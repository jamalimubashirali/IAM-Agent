package com.enterprise.iam.ai.agent;

import io.modelcontextprotocol.client.McpClient;
import io.modelcontextprotocol.client.McpSyncClient;
import io.modelcontextprotocol.client.transport.ServerParameters;
import io.modelcontextprotocol.client.transport.StdioClientTransport;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor;
import org.springframework.ai.mcp.SyncMcpToolCallbackProvider;
import org.springframework.ai.tool.ToolCallbackProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;

import com.enterprise.iam.ai.exception.HitlRequiredException;
import com.enterprise.iam.ai.memory.CognitiveMemoryService;
import com.enterprise.iam.ai.memory.PersistentChatMemory;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;

import jakarta.annotation.PreDestroy;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

/**
 * AdminAgentService — orchestrates the AI chat loop for the admin agent.
 *
 * <p>The IAM tool set is injected directly from the Spring context (the same
 * {@link ToolCallbackProvider} bean that the MCP SSE server also uses) instead
 * of going through an HTTP round-trip to {@code /mcp/sse}. This avoids the 401
 * that would result from calling a JWT-protected endpoint without a token, and
 * is faster since there is no network hop.
 *
 * <p>The postgres-mcp stdio client is still built lazily on the first
 * {@link #chat} call because it spawns an external process that should only
 * start after Tomcat is fully ready.
 */
@Service
@Slf4j
public class AdminAgentService {

    // ---- injected configuration ------------------------------------------------

    private final ChatClient.Builder chatClientBuilder;
    private final PersistentChatMemory persistentChatMemory;
    private final CognitiveMemoryService cognitiveMemoryService;
    private final Resource systemPromptResource;

    /** In-process tool callbacks — same bean registered with the MCP SSE server. */
    private final ToolCallbackProvider iamTools;

    /** JDBC URL passed through to the postgres-mcp stdio server. */
    private final String postgresMcpUrl;

    // ---- lazy-initialised state ------------------------------------------------

    /** Guarded by {@code this}. Null until first {@link #chat} call. */
    private volatile ChatClient chatClient;

    /** All MCP clients created during lazy init — closed on shutdown. */
    private final List<McpSyncClient> managedClients = new ArrayList<>();    // ---------------------------------------------------------------------------

    @SuppressWarnings("null")
    public AdminAgentService(
            ChatClient.Builder chatClientBuilder,
            PersistentChatMemory persistentChatMemory,
            CognitiveMemoryService cognitiveMemoryService,
            @Value("classpath:/prompts/system-prompt.st") Resource systemPromptResource,
            ToolCallbackProvider iamTools,
            @Value("${postgres.mcp.url:postgresql://postgres:postgres@localhost:5433/iam_db}") String postgresMcpUrl) {

        this.chatClientBuilder    = chatClientBuilder;
        this.persistentChatMemory = persistentChatMemory;
        this.cognitiveMemoryService = cognitiveMemoryService;
        this.systemPromptResource = systemPromptResource;
        this.iamTools             = iamTools;
        this.postgresMcpUrl       = postgresMcpUrl;
    }

    // ---------------------------------------------------------------------------
    // Public API
    // ---------------------------------------------------------------------------

    /**
     * Handles the conversational interaction with the agent.
     *
     * <p>On the very first call the {@link ChatClient} — together with all
     * {@link McpSyncClient} connections — is built and cached for subsequent calls.
     *
     * <p>Catches {@link HitlRequiredException} thrown by mutating tools and returns
     * a structured "awaiting approval" message instead of propagating the exception.
     */
    @SuppressWarnings("null")
    public String chat(String chatId, String message) {
        ensureChatClientInitialised();

        Long activeUserId = resolveActiveUserId();

        // Enrich prompt with long-term memory context
        List<String> proceduralRules = new ArrayList<>();
        List<String> historicalFacts = new ArrayList<>();
        try {
            proceduralRules = cognitiveMemoryService.retrieveProceduralRules(message, 3);
            historicalFacts = cognitiveMemoryService.retrieveHistoricalContext(message, activeUserId, 3);
        } catch (Exception e) {
            log.warn("Failed to retrieve memory context: {}", e.getMessage());
            // Continue without memory context - the chat must go on!
        }

        String contextBlock = String.format(
                "\n\n--- REQUIRED PROCEDURAL RULES ---\n%s\n\n--- RELEVANT HISTORICAL CONTEXT ---\n%s\n\n",
                String.join("\n", proceduralRules),
                String.join("\n", historicalFacts));

        try {
            return this.chatClient.prompt()
                    .user(contextBlock + message)
                    .advisors(a -> a.param(MessageChatMemoryAdvisor.CHAT_MEMORY_CONVERSATION_ID_KEY, chatId))
                    .call()
                    .content();
        } catch (HitlRequiredException ex) {
            return String.format(
                    "ACTION_REQUIRED: This operation requires explicit admin approval. " +
                    "Action ID: %d. Please check your Pending Actions dashboard.",                    ex.getPendingActionId());
        }
    }    // ---------------------------------------------------------------------------
    // Lazy initialisation
    // ---------------------------------------------------------------------------

    /**
     * Builds the {@link ChatClient} on the first call using double-checked locking.
     * IAM tools are wired in-process (no HTTP, no JWT required).
     */
    @SuppressWarnings("null")
    private void ensureChatClientInitialised() {
        if (chatClient != null) return;           // fast path — already initialised

        synchronized (this) {
            if (chatClient != null) return;       // another thread beat us to it

            log.info("Initialising MCP clients and ChatClient (first chat request)");

            // -- 1. Postgres MCP stdio server (optional external process) --------
            List<McpSyncClient> mcpClients = new ArrayList<>();
            try {
                // Determine OS to use correct npx command
                boolean isWindows = System.getProperty("os.name", "").toLowerCase().contains("win");
                String npxCmd = isWindows ? "npx.cmd" : "npx";
                
                // Construct the connection string - ensure it targets the Docker service name 'postgres'
                // The application.yml value might be 'localhost' for local dev, but in Docker we need 'postgres'
                // However, since this runs INSIDE the backend container, it MUST use 'iam_postgres' (service name)
                
                log.info("Starting postgres-mcp stdio server against {}", postgresMcpUrl);

                ServerParameters params = ServerParameters.builder(npxCmd)
                        .args("-y", "@modelcontextprotocol/server-postgres", postgresMcpUrl)
                        .build();

                McpSyncClient stdioClient = McpClient
                        .sync(new StdioClientTransport(params))
                        .requestTimeout(Duration.ofSeconds(60))
                        .build();
                stdioClient.initialize();
                mcpClients.add(stdioClient);
                managedClients.add(stdioClient);
                log.info("Started postgres-mcp stdio server against {}", postgresMcpUrl);
            } catch (Exception e) {
                log.warn("Could not start postgres-mcp stdio server — DB query tools will be unavailable: {}",
                        e.getMessage());
            }

            // -- 2. Build the ChatClient ----------------------------------------
            // The IAM tool set is injected directly (same JVM, no HTTP round-trip).
            ChatClient.Builder builder = chatClientBuilder
                    .defaultSystem(systemPromptResource)
                    .defaultAdvisors(new MessageChatMemoryAdvisor(persistentChatMemory))
                    .defaultTools(iamTools);   // in-process: no JWT needed

            if (!mcpClients.isEmpty()) {
                builder.defaultTools(new SyncMcpToolCallbackProvider(mcpClients));
            }

            this.chatClient = builder.build();
            log.info("ChatClient ready — IAM tools wired in-process, {} external MCP client(s)", mcpClients.size());
        }
    }

    // ---------------------------------------------------------------------------
    // Shutdown
    // ---------------------------------------------------------------------------

    /** Close all MCP clients gracefully when the Spring context is destroyed. */
    @PreDestroy
    public void shutdown() {
        log.info("Shutting down {} MCP client(s)", managedClients.size());
        for (McpSyncClient client : managedClients) {
            try {
                client.closeGracefully();
            } catch (Exception e) {
                log.warn("Error closing MCP client: {}", e.getMessage());
            }
        }
    }

    // ---------------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------------

    private Long resolveActiveUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) return -1L;
        Object principal = auth.getPrincipal();
        if (principal instanceof UserDetails ud) {
            try {
                return Long.parseLong(ud.getUsername());
            } catch (NumberFormatException ignored) {
                return (long) ud.getUsername().hashCode();
            }
        }
        return -1L;
    }
}

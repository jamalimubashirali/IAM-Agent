package com.enterprise.iam.config;

import com.enterprise.iam.ai.tools.AuditTools;
import com.enterprise.iam.ai.tools.RoleManagementTools;
import com.enterprise.iam.ai.tools.TelemetryTools;
import com.enterprise.iam.ai.tools.UserManagementTools;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.tool.ToolCallbackProvider;
import org.springframework.ai.tool.method.MethodToolCallbackProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * MCP Server Tool Registration Configuration.
 *
 * <p>
 * This class wires all {@code @Tool}-annotated Spring components into the
 * Spring AI MCP Server
 * (exposed via SSE at {@code /mcp/sse}). Without this bean, the MCP Server
 * starts but advertises
 * zero tools — meaning the MCP Client / LLM would never be able to invoke any
 * business operations.
 *
 * <p>
 * <b>Architecture note:</b> The Spring AI MCP Server Boot Starter
 * ({@code spring-ai-starter-mcp-server-webmvc}) auto-discovers all
 * {@link ToolCallbackProvider}
 * beans in the context and registers their tools when the SSE session is
 * established. No additional
 * wiring is required on the client side.
 *
 * <p>
 * <b>Adding a new tool set:</b> Create your {@code @Component} class with
 * {@code @Tool} methods,
 * inject it here, and add it to the {@code toolObjects(...)} call.
 */
@Configuration
@Slf4j
public class McpServerConfig {

    /**
     * Registers all IAM domain tool classes as a single
     * {@link ToolCallbackProvider}.
     *
     * <p>
     * Spring AI's auto-configuration picks this bean up and exposes each
     * {@code @Tool}
     * method as an MCP tool over the SSE transport.
     */
    @Bean
    public ToolCallbackProvider iamToolCallbackProvider(
            UserManagementTools userManagementTools,
            TelemetryTools telemetryTools,
            AuditTools auditTools,
            RoleManagementTools roleManagementTools) {

        log.info("Registering IAM tool sets with MCP Server: "
                + "UserManagement, Telemetry, Audit, RoleManagement");

        return MethodToolCallbackProvider.builder()
                .toolObjects(
                        userManagementTools, // deactivateUserTool, updateUserRolesTool
                        telemetryTools, // getMetricTool, getSystemHealthSummaryTool
                        auditTools, // getAuditLogsTool
                        roleManagementTools // getAllRolesTool, getAllPermissionsTool, updateRolePermissionsTool
                )
                .build();
    }
}

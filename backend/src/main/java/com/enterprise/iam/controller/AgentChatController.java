package com.enterprise.iam.controller;

import com.enterprise.iam.ai.agent.AdminAgentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * REST endpoint for the Admin AI Assistant chat interface.
 *
 * <p>
 * The frontend sends a user message and a stable {@code chatId} (keyed on the
 * authenticated user's ID so each admin gets their own conversation thread).
 * The
 * request is delegated to {@link AdminAgentService}, which enriches it with
 * long-term memory context, calls the LLM with the configured tools, and
 * returns
 * the AI's response text. If a mutating tool is intercepted by the HITL engine,
 * the service catches {@code HitlRequiredException} and returns a structured
 * "awaiting approval" message instead.
 */
@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/agent")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Slf4j
public class AgentChatController {

    private final AdminAgentService adminAgentService;

    @PostMapping("/chat")
    public ResponseEntity<Map<String, String>> chat(
            @RequestBody Map<String, String> body,
            Authentication authentication) {

        String message = body.get("message");
        if (message == null || message.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Message must not be blank"));
        }

        // Use the authenticated username as a stable chat session ID so that
        // Spring AI's MessageChatMemoryAdvisor can maintain per-user history.
        String chatId = body.getOrDefault("chatId", authentication.getName());

        try {
            String response = adminAgentService.chat(chatId, message);
            return ResponseEntity.ok(Map.of("response", response));
        } catch (Exception ex) {
            log.error("Agent chat error for chatId={}: {}", chatId, ex.getMessage(), ex);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "The AI assistant encountered an error: " + ex.getMessage()));
        }
    }
}

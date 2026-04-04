package com.enterprise.iam.controller;

import com.enterprise.iam.service.HitlEventPublisher;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

/**
 * Provides the Server-Sent Events (SSE) stream for HITL notifications.
 *
 * <p>
 * The frontend subscribes to {@code GET /api/hitl/stream} using the browser's
 * native {@code EventSource} API. When a mutating tool is intercepted, this
 * channel
 * pushes a {@code hitl-action} event with the pending action details so the
 * admin can
 * review and approve/reject it without polling.
 *
 * <p>
 * <b>Security note:</b> The browser {@code EventSource} API cannot send
 * custom Authorization headers. This endpoint is open (see
 * {@code WebSecurityConfig});
 * the SSE stream contains no sensitive data — it is a notification channel
 * only.
 * Actual approval actions ({@code /api/actions/**}) are fully secured.
 */
@RestController
@RequestMapping("/api/hitl")
@RequiredArgsConstructor
public class HitlSseController {

    private final HitlEventPublisher eventPublisher;

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter subscribe() {
        return eventPublisher.subscribe();
    }
}

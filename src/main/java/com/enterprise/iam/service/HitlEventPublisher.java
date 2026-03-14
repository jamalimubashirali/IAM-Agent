package com.enterprise.iam.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Thread-safe registry of active Server-Sent Event (SSE) emitters.
 *
 * <p>
 * The frontend connects to {@code GET /api/hitl/stream} and keeps the
 * connection
 * open via {@link SseEmitter}. When a HITL event occurs (e.g., a new pending
 * action is
 * created), {@link #publishEvent(Object)} broadcasts the event to all connected
 * clients.
 *
 * <p>
 * {@link CopyOnWriteArrayList} is used for the emitter registry because:
 * <ul>
 * <li>Most operations are reads (iteration on publish)</li>
 * <li>Writes (add/remove) are infrequent</li>
 * <li>Iteration and modification can happen concurrently from different
 * threads</li>
 * </ul>
 */
@Component
@Slf4j
public class HitlEventPublisher {

    private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();

    /**
     * Registers a new SSE emitter for a connected frontend client.
     * Automatically deregisters when the client disconnects or times out.
     */
    public SseEmitter subscribe() {
        // 0L = no timeout — connection lives until client disconnects
        SseEmitter emitter = new SseEmitter(0L);

        emitters.add(emitter);
        log.info("New HITL SSE subscriber registered. Total active: {}", emitters.size());

        emitter.onCompletion(() -> {
            emitters.remove(emitter);
            log.debug("HITL SSE emitter completed. Remaining: {}", emitters.size());
        });
        emitter.onTimeout(() -> {
            emitters.remove(emitter);
            log.debug("HITL SSE emitter timed out. Remaining: {}", emitters.size());
        });
        emitter.onError(e -> {
            emitters.remove(emitter);
            log.warn("HITL SSE emitter error: {}", e.getMessage());
        });

        return emitter;
    }

    /**
     * Broadcasts a HITL event (e.g., new pending action) to all connected clients.
     * Silently removes stale emitters that fail to receive the event.
     */
    public void publishEvent(Object payload) {
        List<SseEmitter> stale = new java.util.ArrayList<>();

        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event()
                        .name("hitl-action")
                        .data(payload));
            } catch (IOException e) {
                stale.add(emitter);
                log.debug("Removing stale HITL SSE emitter: {}", e.getMessage());
            }
        }

        emitters.removeAll(stale);
    }
}

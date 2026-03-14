package com.enterprise.iam.ai.exception;

/**
 * Thrown by a mutating {@code @Tool} method to signal that the action
 * requires Human-in-the-Loop approval before it can proceed.
 *
 * <p>
 * This exception carries the {@code pendingActionId} so that
 * {@link com.enterprise.iam.ai.agent.AdminAgentService} can compose a
 * structured "awaiting approval" response for the frontend without needing
 * to query the database again.
 */
public class HitlRequiredException extends RuntimeException {

    private final Long pendingActionId;

    public HitlRequiredException(Long pendingActionId, String toolName) {
        super(String.format(
                "Action '%s' requires administrator approval before execution. Pending action ID: %d",
                toolName, pendingActionId));
        this.pendingActionId = pendingActionId;
    }

    public Long getPendingActionId() {
        return pendingActionId;
    }
}

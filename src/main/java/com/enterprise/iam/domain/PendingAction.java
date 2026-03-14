package com.enterprise.iam.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

/**
 * Represents a mutating AI agent action that is awaiting human administrator
 * approval.
 *
 * <p>
 * Lifecycle:
 * <ol>
 * <li>LLM calls a mutating {@code @Tool} method</li>
 * <li>Tool creates a {@code PendingAction} (status = PENDING) and throws
 * {@link com.enterprise.iam.ai.exception.HitlRequiredException}</li>
 * <li>Admin approves via {@code POST /api/actions/{id}/approve} → status =
 * APPROVED, action is executed</li>
 * <li>Admin rejects via {@code POST /api/actions/{id}/reject} → status =
 * REJECTED, no side effects</li>
 * </ol>
 */
@Entity
@Table(name = "pending_actions")
@Getter
@Setter
@NoArgsConstructor
public class PendingAction {

    public enum Status {
        PENDING, APPROVED, REJECTED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Internal name of the tool requested (e.g. "deactivateUserTool"). */
    @Column(nullable = false)
    private String toolName;

    /** Human-readable summary shown to the admin on the approval dashboard. */
    @Column(nullable = false, length = 1024)
    private String description;

    /** JSON-serialised arguments that will be passed to the service on approval. */
    @Column(nullable = false, columnDefinition = "TEXT")
    private String payloadJson;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.PENDING;

    /** The chat session that triggered this pending action. */
    @Column
    private String chatId;

    /** ID of the authenticated user who triggered the agent action. */
    @Column
    private Long requestedByUserId;

    @CreationTimestamp
    @Column(updatable = false)
    private Instant createdAt;

    @Column
    private Instant resolvedAt;

    public PendingAction(String toolName, String description, String payloadJson,
            String chatId, Long requestedByUserId) {
        this.toolName = toolName;
        this.description = description;
        this.payloadJson = payloadJson;
        this.chatId = chatId;
        this.requestedByUserId = requestedByUserId;
        this.status = Status.PENDING;
    }
}

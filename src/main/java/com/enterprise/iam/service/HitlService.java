package com.enterprise.iam.service;

import com.enterprise.iam.ai.exception.HitlRequiredException;
import com.enterprise.iam.domain.PendingAction;
import com.enterprise.iam.repository.PendingActionRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Set;

/**
 * Core service for the Human-in-the-Loop (HITL) execution engine.
 *
 * <h3>Flow for a mutating tool call:</h3>
 * <ol>
 * <li>The {@code @Tool} method calls {@link #interceptAndPause} which:
 * persists a {@link PendingAction} and broadcasts an SSE event to the
 * frontend.</li>
 * <li>Throws {@link HitlRequiredException} so the LLM receives an "awaiting
 * approval" response.</li>
 * <li>Admin reviews and calls {@link #approveAction} or {@link #rejectAction}
 * via REST.</li>
 * <li>On approval, the action payload is deserialized and routed to the correct
 * service.</li>
 * </ol>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class HitlService {

    private final PendingActionRepository pendingActionRepository;
    private final HitlEventPublisher eventPublisher;
    private final UserService userService;
    private final ObjectMapper objectMapper;

    // -------------------------------------------------------------------------
    // Interception (called from @Tool methods)
    // -------------------------------------------------------------------------

    /**
     * Persists the pending action, broadcasts an SSE event to all connected
     * frontends,
     * then throws {@link HitlRequiredException} to halt the LLM's tool execution.
     *
     * @param toolName      Internal tool name (e.g. "deactivateUserTool")
     * @param description   Human-readable description for the approval dashboard
     * @param payload       The tool's input object (will be serialised to JSON)
     * @param chatId        The active chat session ID
     * @param requestedById The authenticated user who issued the command
     * @throws HitlRequiredException always — this is the intended halt mechanism
     */
    public void interceptAndPause(String toolName, String description, Object payload,
            String chatId, Long requestedById) {
        String payloadJson;
        try {
            payloadJson = objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialise HITL payload for tool '{}': {}", toolName, e.getMessage());
            payloadJson = "{}";
        }

        PendingAction action = new PendingAction(toolName, description, payloadJson, chatId, requestedById);
        action = pendingActionRepository.save(action);
        log.info("HITL: Created pending action id={} tool='{}' for user={}", action.getId(), toolName, requestedById);

        // Notify frontend in real-time
        eventPublisher.publishEvent(toEventPayload(action));

        throw new HitlRequiredException(action.getId(), toolName);
    }

    // -------------------------------------------------------------------------
    // Approval / Rejection (called from ActionApprovalController)
    // -------------------------------------------------------------------------

    /**
     * Approves a pending action and executes it by routing the payload to the
     * correct service method. Marks the action as APPROVED.
     */
    @Transactional
    public PendingAction approveAction(Long actionId) {
        PendingAction action = loadPending(actionId);
        log.info("HITL: Approving action id={} tool='{}'", actionId, action.getToolName());

        executeApprovedAction(action);

        action.setStatus(PendingAction.Status.APPROVED);
        action.setResolvedAt(Instant.now());
        PendingAction saved = pendingActionRepository.save(action);

        // Notify frontend that approval is complete
        eventPublisher.publishEvent(toEventPayload(saved));
        return saved;
    }

    /**
     * Rejects a pending action. The underlying operation is NOT executed.
     */
    @Transactional
    public PendingAction rejectAction(Long actionId) {
        PendingAction action = loadPending(actionId);
        log.info("HITL: Rejecting action id={} tool='{}'", actionId, action.getToolName());

        action.setStatus(PendingAction.Status.REJECTED);
        action.setResolvedAt(Instant.now());
        PendingAction saved = pendingActionRepository.save(action);

        eventPublisher.publishEvent(toEventPayload(saved));
        return saved;
    }

    /**
     * Returns all currently pending actions (for the approval dashboard).
     */
    public List<PendingAction> listPending() {
        return pendingActionRepository.findByStatusOrderByCreatedAtDesc(PendingAction.Status.PENDING);
    }

    // -------------------------------------------------------------------------
    // Internal routing — maps tool name + JSON payload to the correct service call
    // -------------------------------------------------------------------------

    private void executeApprovedAction(PendingAction action) {
        try {
            JsonNode payload = objectMapper.readTree(action.getPayloadJson());

            switch (action.getToolName()) {
                case "createUserTool" -> {
                    String username = payload.get("username").asText();
                    String email = payload.get("email").asText();
                    String password = payload.get("password").asText();
                    Set<String> roles = objectMapper.convertValue(
                            payload.get("roles"),
                            objectMapper.getTypeFactory().constructCollectionType(Set.class, String.class));
                    boolean success = userService.createUser(username, email, password, roles);
                    if (!success) {
                        throw new IllegalStateException(
                                "createUser returned false for: " + username +
                                        " — username/email may already exist, or a requested role was not found.");
                    }
                    log.info("HITL executed: created user '{}' with roles {}", username, roles);
                }
                case "deactivateUserTool" -> {
                    String username = payload.get("username").asText();
                    boolean success = userService.deactivateUser(username);
                    if (!success) {
                        throw new IllegalStateException("deactivateUser returned false for: " + username);
                    }
                    log.info("HITL executed: deactivated user '{}'", username);
                }
                case "updateUserRolesTool" -> {
                    String username = payload.get("username").asText();
                    Set<String> roles = objectMapper.convertValue(
                            payload.get("roles"),
                            objectMapper.getTypeFactory().constructCollectionType(Set.class, String.class));
                    boolean success = userService.updateUserRoles(username, roles);
                    if (!success) {
                        throw new IllegalStateException("updateUserRoles returned false for: " + username);
                    }
                    log.info("HITL executed: updated roles for user '{}' to {}", username, roles);
                }
                case "updateRolePermissionsTool" -> {
                    Long roleId = payload.get("roleId").asLong();
                    List<Long> permissionIds = objectMapper.convertValue(
                            payload.get("permissionIds"),
                            objectMapper.getTypeFactory().constructCollectionType(List.class, Long.class));
                    userService.updateRolePermissions(roleId, permissionIds);
                    log.info("HITL executed: updated permissions for role id={}", roleId);
                }
                default -> throw new IllegalArgumentException(
                        "No HITL executor registered for tool: " + action.getToolName());
            }
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to deserialize HITL payload", e);
        }
    }

    private PendingAction loadPending(Long actionId) {
        PendingAction action = pendingActionRepository.findById(actionId)
                .orElseThrow(() -> new IllegalArgumentException("Pending action not found: " + actionId));
        if (action.getStatus() != PendingAction.Status.PENDING) {
            throw new IllegalStateException(
                    "Action " + actionId + " is already " + action.getStatus() + " and cannot be modified.");
        }
        return action;
    }

    private record HitlEvent(Long id, String toolName, String description,
            String status, String chatId, String createdAt) {
    }

    private HitlEvent toEventPayload(PendingAction action) {
        return new HitlEvent(
                action.getId(),
                action.getToolName(),
                action.getDescription(),
                action.getStatus().name(),
                action.getChatId(),
                action.getCreatedAt() != null ? action.getCreatedAt().toString() : null);
    }
}

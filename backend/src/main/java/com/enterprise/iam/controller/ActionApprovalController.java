package com.enterprise.iam.controller;

import com.enterprise.iam.domain.PendingAction;
import com.enterprise.iam.service.HitlService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST API for reviewing and resolving pending HITL actions.
 *
 * <p>
 * All endpoints require {@code ROLE_ADMIN} — only administrators may approve
 * or reject AI-requested mutating operations.
 */
@RestController
@RequestMapping("/api/actions")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class ActionApprovalController {

    private final HitlService hitlService;

    /** Returns all actions currently awaiting human review. */
    @GetMapping("/pending")
    public ResponseEntity<List<PendingAction>> listPending() {
        return ResponseEntity.ok(hitlService.listPending());
    }

    /** Approves a pending action and executes the underlying operation. */
    @PostMapping("/{id}/approve")
    public ResponseEntity<PendingAction> approve(@PathVariable Long id) {
        return ResponseEntity.ok(hitlService.approveAction(id));
    }

    /** Rejects a pending action. The underlying operation is NOT executed. */
    @PostMapping("/{id}/reject")
    public ResponseEntity<PendingAction> reject(@PathVariable Long id) {
        return ResponseEntity.ok(hitlService.rejectAction(id));
    }
}

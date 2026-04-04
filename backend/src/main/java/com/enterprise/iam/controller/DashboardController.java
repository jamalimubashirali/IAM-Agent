package com.enterprise.iam.controller;

import com.enterprise.iam.repository.PendingActionRepository;
import com.enterprise.iam.repository.RoleRepository;
import com.enterprise.iam.repository.UserRepository;
import com.enterprise.iam.domain.PendingAction;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Provides aggregated statistics for the Admin Dashboard landing page.
 *
 * <p>
 * Keeping this as a dedicated endpoint avoids N+1 round-trips from the
 * frontend and lets the backend compute counts in a single DB sweep.
 */
@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class DashboardController {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PendingActionRepository pendingActionRepository;

    /**
     * Returns lightweight stats shown in the three admin metric cards.
     *
     * <pre>
     * {
     *   "totalUsers":    42,
     *   "totalRoles":    4,
     *   "pendingActions": 2
     * }
     * </pre>
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Long>> getStats() {
        long totalUsers = userRepository.count();
        long totalRoles = roleRepository.count();
        long pendingActions = pendingActionRepository.countByStatus(PendingAction.Status.PENDING);

        return ResponseEntity.ok(Map.of(
                "totalUsers", totalUsers,
                "totalRoles", totalRoles,
                "pendingActions", pendingActions));
    }
}

package com.enterprise.iam.service;

import com.enterprise.iam.domain.AuditLog;
import com.enterprise.iam.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW) // Ensure log is saved even if main tx fails
    public void log(String action, String username, String target, String details, String status) {
        try {
            AuditLog log = AuditLog.builder()
                    .action(action)
                    .username(username != null ? username : "anonymous")
                    .target(target)
                    .details(details)
                    .status(status)
                    .build();
            auditLogRepository.save(log);
        } catch (Exception e) {
            // Never fail the main flow because of logging failure
            System.err.println("Failed to save audit log: " + e.getMessage());
        }
    }

    public void logSuccess(String action, String username, String target, String details) {
        log(action, username, target, details, "SUCCESS");
    }

    public void logFailure(String action, String username, String target, String details) {
        log(action, username, target, details, "FAILURE");
    }
}

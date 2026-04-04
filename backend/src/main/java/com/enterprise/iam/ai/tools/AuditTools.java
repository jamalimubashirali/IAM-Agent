package com.enterprise.iam.ai.tools;

import com.enterprise.iam.domain.AuditLog;
import com.enterprise.iam.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
@Slf4j
public class AuditTools {

    private final AuditLogRepository auditLogRepository;

    public record AuditQueryRequest(String username, Integer limit) {
    }

    @Tool(description = "Retrieves recent audit logs. Optionally filter by username and limit (defaults to 50).")
    public List<AuditLog> getAuditLogsTool(AuditQueryRequest request) {
        log.info("AI invoked getAuditLogsTool for user: {}", request.username());
        int limit = (request.limit() != null && request.limit() > 0) ? request.limit() : 50;

        List<AuditLog> logs;
        if (request.username() != null && !request.username().isBlank()) {
            logs = auditLogRepository.findByUsernameOrderByTimestampDesc(request.username());
        } else {
            logs = auditLogRepository.findAllByOrderByTimestampDesc();
        }

        return logs.stream().limit(limit).collect(Collectors.toList());
    }
}

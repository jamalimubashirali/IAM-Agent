package com.enterprise.iam.ai.tools;

import com.enterprise.iam.ai.exception.HitlRequiredException;
import com.enterprise.iam.domain.Permission;
import com.enterprise.iam.domain.Role;
import com.enterprise.iam.repository.PermissionRepository;
import com.enterprise.iam.repository.RoleRepository;
import com.enterprise.iam.service.HitlService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class RoleManagementTools {

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final HitlService hitlService;

    public record EmptyRequest() {
    }

    @Tool(description = "Retrieves all available system roles and their current permissions.")
    public List<Role> getAllRolesTool(EmptyRequest request) {
        log.info("AI invoked getAllRolesTool.");
        return roleRepository.findAll();
    }

    @Tool(description = "Retrieves all available fine-grained permissions that can be assigned to roles.")
    public List<Permission> getAllPermissionsTool(EmptyRequest request) {
        log.info("AI invoked getAllPermissionsTool.");
        return permissionRepository.findAll();
    }

    public record UpdateRolePermissionsRequest(Long roleId, List<Long> permissionIds) {
    }

    @Tool(description = "Updates a role's permissions. REQUIRES admin approval before execution.")
    public String updateRolePermissionsTool(UpdateRolePermissionsRequest request) {
        log.info("AI requested updateRolePermissionsTool for roleId: {} — routing to HITL", request.roleId());

        String description = String.format(
                "Update permissions for role id=%d to permission IDs: %s",
                request.roleId(), request.permissionIds());

        hitlService.interceptAndPause(
                "updateRolePermissionsTool",
                description,
                request,
                "unknown",
                currentUserId());

        throw new HitlRequiredException(-1L, "updateRolePermissionsTool");
    }

    private Long currentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated())
            return -1L;
        Object principal = auth.getPrincipal();
        if (principal instanceof UserDetails ud) {
            try {
                return Long.parseLong(ud.getUsername());
            } catch (NumberFormatException ignored) {
                return (long) ud.getUsername().hashCode();
            }
        }
        return -1L;
    }
}

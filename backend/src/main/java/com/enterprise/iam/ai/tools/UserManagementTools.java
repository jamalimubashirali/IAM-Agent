package com.enterprise.iam.ai.tools;

import com.enterprise.iam.ai.exception.HitlRequiredException;
import com.enterprise.iam.service.HitlService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.util.Set;

@Component
@RequiredArgsConstructor
@Slf4j
public class UserManagementTools {

    private final HitlService hitlService;

    // -------------------------------------------------------------------------
    // Create User
    // -------------------------------------------------------------------------

    public record CreateUserRequest(String username, String email, String password, Set<String> roles) {
    }

    public record CreateUserResponse(boolean success, String message) {
    }

    @Tool(description = """
            Creates a new IAM user account with the specified username, email, password, and roles.
            Valid roles are: USER, ADMIN, MANAGER, AUDITOR.
            REQUIRES admin approval before execution.
            """)
    public CreateUserResponse createUserTool(CreateUserRequest request) {
        log.info("AI requested createUserTool for username: {} — routing to HITL", request.username());

        String description = String.format(
                "Create user account: username='%s', email='%s', roles=%s",
                request.username(), request.email(), request.roles());

        hitlService.interceptAndPause(
                "createUserTool",
                description,
                request,
                currentChatId(),
                currentUserId());

        // Never reached — interceptAndPause always throws HitlRequiredException.
        throw new HitlRequiredException(-1L, "createUserTool");
    }

    // -------------------------------------------------------------------------
    // Deactivate User
    // -------------------------------------------------------------------------

    public record DeactivateUserRequest(String username) {
    }

    public record DeactivateUserResponse(boolean success, String message) {
    }

    @Tool(description = "Deactivates an IAM user account. REQUIRES admin approval before execution.")
    public DeactivateUserResponse deactivateUserTool(DeactivateUserRequest request) {
        log.info("AI requested deactivateUserTool for username: {} — routing to HITL", request.username());

        String description = String.format("Deactivate user account: '%s'", request.username());
        hitlService.interceptAndPause(
                "deactivateUserTool",
                description,
                request,
                currentChatId(),
                currentUserId());

        throw new HitlRequiredException(-1L, "deactivateUserTool");
    }

    // -------------------------------------------------------------------------
    // Update User Roles
    // -------------------------------------------------------------------------

    public record UpdateUserRolesRequest(String username, Set<String> roles) {
    }

    public record UpdateUserRolesResponse(boolean success, String message) {
    }

    @Tool(description = "Updates the roles assigned to a user. REQUIRES admin approval before execution.")
    public UpdateUserRolesResponse updateUserRolesTool(UpdateUserRolesRequest request) {
        log.info("AI requested updateUserRolesTool for username: {} — routing to HITL", request.username());

        String description = String.format("Update roles for user '%s' to: %s", request.username(), request.roles());
        hitlService.interceptAndPause(
                "updateUserRolesTool",
                description,
                request,
                currentChatId(),
                currentUserId());

        throw new HitlRequiredException(-1L, "updateUserRolesTool");
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private String currentChatId() {
        return "unknown";
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

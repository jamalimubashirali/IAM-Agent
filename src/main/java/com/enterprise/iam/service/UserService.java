package com.enterprise.iam.service;

import java.util.List;
import java.util.Set;

public interface UserService {

    /**
     * Creates a new user account with the given credentials and roles.
     *
     * @param username  the desired username (must be unique)
     * @param email     the user's email address (must be unique)
     * @param password  the plain-text password (will be BCrypt-encoded)
     * @param roleNames set of role names to assign (e.g., "USER", "ADMIN")
     * @return true if created successfully, false if username/email already exists
     */
    boolean createUser(String username, String email, String password, Set<String> roleNames);

    /**
     * Deactivates a user account.
     * 
     * @param username the username of the user to deactivate
     * @return true if successful, false if user not found
     */
    boolean deactivateUser(String username);

    /**
     * Updates the roles for a user.
     * 
     * @param username  the username of the user
     * @param roleNames the new set of role names (e.g., "ADMIN", "USER")
     * @return true if successful, false if user or any roles not found
     */
    boolean updateUserRoles(String username, Set<String> roleNames);

    /**
     * Updates the permissions assigned to a role.
     *
     * @param roleId        the ID of the role to update
     * @param permissionIds the new set of permission IDs to assign
     */
    void updateRolePermissions(Long roleId, List<Long> permissionIds);
}

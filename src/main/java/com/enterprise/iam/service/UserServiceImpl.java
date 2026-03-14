package com.enterprise.iam.service;

import com.enterprise.iam.domain.Permission;
import com.enterprise.iam.domain.Role;
import com.enterprise.iam.domain.User;
import com.enterprise.iam.repository.PermissionRepository;
import com.enterprise.iam.repository.RoleRepository;
import com.enterprise.iam.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public boolean createUser(String username, String email, String password, Set<String> roleNames) {
        log.info("Attempting to create user: {} with roles: {}", username, roleNames);

        if (userRepository.existsByUsername(username)) {
            log.warn("Cannot create user: username '{}' already exists", username);
            return false;
        }
        if (userRepository.existsByEmail(email)) {
            log.warn("Cannot create user: email '{}' already in use", email);
            return false;
        }

        Set<Role> roles = new HashSet<>();
        for (String roleName : roleNames) {
            Optional<Role> roleOpt = roleRepository.findByName(roleName.toUpperCase());
            if (roleOpt.isEmpty()) {
                log.warn("Cannot create user: role '{}' not found", roleName);
                return false;
            }
            roles.add(roleOpt.get());
        }

        User newUser = User.builder()
                .username(username)
                .email(email)
                .password(passwordEncoder.encode(password))
                .enabled(true)
                .roles(roles)
                .build();

        userRepository.save(newUser);
        log.info("Successfully created user: {} with roles: {}", username, roleNames);
        return true;
    }

    @Override
    @Transactional
    public boolean deactivateUser(String username) {
        log.info("Attempting to deactivate user: {}", username);
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            user.setEnabled(false);
            userRepository.save(user);
            log.info("Successfully deactivated user: {}", username);
            return true;
        }
        log.warn("Failed to deactivate user: {} (Not found)", username);
        return false;
    }

    @Override
    @Transactional
    public boolean updateUserRoles(String username, Set<String> roleNames) {
        log.info("Attempting to update roles for user: {} to {}", username, roleNames);
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isEmpty()) {
            log.warn("Failed to update roles: User {} not found", username);
            return false;
        }

        User user = userOpt.get();
        Set<Role> newRoles = new HashSet<>();

        for (String roleName : roleNames) {
            Optional<Role> roleOpt = roleRepository.findByName(roleName.toUpperCase());
            if (roleOpt.isPresent()) {
                newRoles.add(roleOpt.get());
            } else {
                log.warn("Role not found: {}", roleName);
                return false; // Fail fast if a requested role doesn't exist
            }
        }

        user.setRoles(newRoles);
        userRepository.save(user);
        log.info("Successfully updated roles for user: {}", username);
        return true;
    }

    @Override
    @Transactional
    public void updateRolePermissions(Long roleId, List<Long> permissionIds) {
        log.info("Updating permissions for role id={} to permissionIds={}", roleId, permissionIds);
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new IllegalArgumentException("Role not found: " + roleId));

        Set<Permission> newPermissions = permissionIds.stream()
                .map(id -> permissionRepository.findById(id)
                        .orElseThrow(() -> new IllegalArgumentException("Permission not found: " + id)))
                .collect(Collectors.toSet());

        role.getPermissions().clear();
        role.getPermissions().addAll(newPermissions);
        roleRepository.save(role);
        log.info("Successfully updated permissions for role id={}", roleId);
    }
}

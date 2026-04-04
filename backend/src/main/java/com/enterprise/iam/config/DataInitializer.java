package com.enterprise.iam.config;

import com.enterprise.iam.domain.Permission;
import com.enterprise.iam.domain.Role;
import com.enterprise.iam.repository.PermissionRepository;
import com.enterprise.iam.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Set;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;

    @Override
    public void run(String... args) {
        if (roleRepository.count() == 0) {
            log.info("Seeding initial security data...");

            // 1. Create permissions
            Permission readUsers = createPermissionIfNotFound("READ_USERS");
            Permission writeUsers = createPermissionIfNotFound("WRITE_USERS");
            Permission readRoles = createPermissionIfNotFound("READ_ROLES");
            Permission writeRoles = createPermissionIfNotFound("WRITE_ROLES");
            Permission readAudit = createPermissionIfNotFound("READ_AUDIT");
            Permission useAi = createPermissionIfNotFound("USE_AI");
            Permission readDashboard = createPermissionIfNotFound("READ_DASHBOARD");

            // 2. Create roles
            createRoleIfNotFound("ADMIN",
                    Set.of(readUsers, writeUsers, readRoles, writeRoles, readAudit, useAi, readDashboard));
            createRoleIfNotFound("MODERATOR", Set.of(readUsers, readRoles, readAudit, readDashboard));
            createRoleIfNotFound("USER", Set.of(useAi));

            log.info("Security data seeded successfully.");
        }
    }

    private Permission createPermissionIfNotFound(String name) {
        return permissionRepository.findByName(name)
                .orElseGet(() -> permissionRepository.save(new Permission(null, name)));
    }

    private void createRoleIfNotFound(String name, Set<Permission> permissions) {
        roleRepository.findByName(name).orElseGet(() -> {
            Role role = Role.builder()
                    .name(name)
                    .permissions(permissions)
                    .build();
            return roleRepository.save(role);
        });
    }
}

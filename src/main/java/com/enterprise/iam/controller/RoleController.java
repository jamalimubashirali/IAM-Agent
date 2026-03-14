package com.enterprise.iam.controller;

import com.enterprise.iam.domain.Role;
import com.enterprise.iam.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/roles")
@RequiredArgsConstructor
public class RoleController {

    private final com.enterprise.iam.repository.PermissionRepository permissionRepository;
    private final RoleRepository roleRepository;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<Role> getAllRoles() {
        return roleRepository.findAll();
    }

    @GetMapping("/permissions")
    @PreAuthorize("hasRole('ADMIN')")
    public List<com.enterprise.iam.domain.Permission> getAllPermissions() {
        return permissionRepository.findAll();
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createRole(@RequestBody Role roleRequest) {
        if (roleRepository.findByName(roleRequest.getName()).isPresent()) {
            return ResponseEntity.badRequest()
                    .body("Error: A role with that name already exists.");
        }
        Role role = new Role();
        role.setName(roleRequest.getName());
        if (roleRequest.getPermissions() != null) {
            for (com.enterprise.iam.domain.Permission p : roleRequest.getPermissions()) {
                com.enterprise.iam.domain.Permission perm = permissionRepository.findById(p.getId())
                        .orElseThrow(() -> new RuntimeException("Error: Permission not found: " + p.getId()));
                role.getPermissions().add(perm);
            }
        }
        return ResponseEntity.ok(roleRepository.save(role));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateRole(@PathVariable Long id, @RequestBody Role roleDetails) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Error: Role not found."));

        // Update name (optional, if allowed)
        // role.setName(roleDetails.getName());

        // Update permissions
        // Client sends full list of permissions the role should have
        if (roleDetails.getPermissions() != null) {
            // Validate permissions exist? Or just trust IDs?
            // Ideally fetch them to ensure attachment.
            // For simplicity, we trust the client sends valid Permission objects with IDs,
            // but Hibernate needs distinct managed entities or loading.
            // Better: Client sends IDs, we fetch.
            // BUT: roleDetails.getPermissions() is Set<Permission>.
            // Let's rely on JPA merging if possible, or fetch.

            // Safer approach: Clear and re-add found permissions
            role.getPermissions().clear();
            if (!roleDetails.getPermissions().isEmpty()) {
                for (com.enterprise.iam.domain.Permission p : roleDetails.getPermissions()) {
                    com.enterprise.iam.domain.Permission perm = permissionRepository.findById(p.getId())
                            .orElseThrow(() -> new RuntimeException("Error: Permission not found: " + p.getId()));
                    role.getPermissions().add(perm);
                }
            }
        }

        roleRepository.save(role);
        return ResponseEntity.ok("Role updated successfully!");
    }
}

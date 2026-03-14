package com.enterprise.iam.controller;

import com.enterprise.iam.domain.User;
import com.enterprise.iam.dto.PasswordChangeRequest;
import com.enterprise.iam.repository.UserRepository;
import com.enterprise.iam.service.AuditService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final UserRepository userRepository;
    private final PasswordEncoder encoder;
    private final AuditService auditService;

    @GetMapping
    public ResponseEntity<?> getMyProfile() {
        User user = getCurrentUser();
        return ResponseEntity.ok(user);
    }

    @PutMapping
    public ResponseEntity<?> updateMyProfile(@RequestBody User userDetails) {
        User user = getCurrentUser();

        user.setEmail(userDetails.getEmail());
        user.setPhoneNumber(userDetails.getPhoneNumber());
        // Do not allow changing username, roles, or password here

        userRepository.save(user);
        auditService.logSuccess("PROFILE_UPDATE", user.getUsername(), "SELF", "Updated profile details");

        return ResponseEntity.ok("Profile updated successfully!");
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody PasswordChangeRequest request) {
        User user = getCurrentUser();

        if (!encoder.matches(request.getCurrentPassword(), user.getPassword())) {
            auditService.logFailure("PASSWORD_CHANGE", user.getUsername(), "SELF", "Incorrect current password");
            return ResponseEntity.badRequest().body("Error: Current password is incorrect!");
        }

        user.setPassword(encoder.encode(request.getNewPassword()));
        userRepository.save(user);

        auditService.logSuccess("PASSWORD_CHANGE", user.getUsername(), "SELF", "Changed password successfully");

        return ResponseEntity.ok("Password changed successfully!");
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Error: User not found."));
    }
}

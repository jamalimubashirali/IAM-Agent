package com.enterprise.iam.security;

import com.enterprise.iam.domain.User;
import com.enterprise.iam.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

@Component("userSecurity")
public class UserSecurity {

    @Autowired
    UserRepository userRepository;

    public boolean isCurrentUser(Long userId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }

        String currentUsername = authentication.getName();

        // Assuming principal is UserDetails or String
        // You might need to adjust based on your specific UserDetails implementation

        User user = userRepository.findById(userId).orElse(null);
        return user != null && user.getUsername().equals(currentUsername);
    }
}

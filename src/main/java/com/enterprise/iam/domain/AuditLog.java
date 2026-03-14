package com.enterprise.iam.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @CreationTimestamp
    private LocalDateTime timestamp;

    @Column(nullable = false)
    private String action; // e.g., "LOGIN", "CREATE_USER"

    @Column(nullable = false)
    private String username; // Who performed the action

    private String target; // Who/What was affected (e.g., "user:admin")

    @Column(columnDefinition = "TEXT")
    private String details; // Extra info

    private String status; // SUCCESS, FAILURE
}

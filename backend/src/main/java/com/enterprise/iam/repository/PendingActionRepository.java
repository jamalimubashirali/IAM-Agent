package com.enterprise.iam.repository;

import com.enterprise.iam.domain.PendingAction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PendingActionRepository extends JpaRepository<PendingAction, Long> {

    List<PendingAction> findByStatusOrderByCreatedAtDesc(PendingAction.Status status);

    List<PendingAction> findByChatIdOrderByCreatedAtDesc(String chatId);

    long countByStatus(PendingAction.Status status);
}

package com.enterprise.iam.repository;

import com.enterprise.iam.domain.ChatSessionMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatSessionMessageRepository extends JpaRepository<ChatSessionMessage, Long> {
    List<ChatSessionMessage> findByConversationIdOrderByCreatedAtAsc(String conversationId);

    void deleteByConversationId(String conversationId);
}

package com.enterprise.iam.ai.memory;

import com.enterprise.iam.domain.ChatSessionMessage;
import com.enterprise.iam.repository.ChatSessionMessageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.messages.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PersistentChatMemory implements ChatMemory {

    private final ChatSessionMessageRepository repository;

    @Override
    @Transactional
    public void add(String conversationId, List<Message> messages) {
        log.debug("Saving {} messages to DB for conversation {}", messages.size(), conversationId);
        List<ChatSessionMessage> entities = messages.stream().map(msg -> {
            String type = msg.getMessageType().name();
            String content = msg.getText() != null ? msg.getText() : msg.toString();
            return ChatSessionMessage.builder()
                    .conversationId(conversationId)
                    .messageType(type)
                    .content(content)
                    .build();
        }).collect(Collectors.toList());

        repository.saveAll(entities);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Message> get(String conversationId, int lastN) {
        List<ChatSessionMessage> entities = repository.findByConversationIdOrderByCreatedAtAsc(conversationId);

        int size = entities.size();
        int startIndex = Math.max(0, size - lastN);
        List<ChatSessionMessage> recentEntities = entities.subList(startIndex, size);

        return recentEntities.stream().map(this::toMessage).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void clear(String conversationId) {
        log.info("Clearing chat memory for conversation {}", conversationId);
        repository.deleteByConversationId(conversationId);
    }

    private Message toMessage(ChatSessionMessage entity) {
        String type = entity.getMessageType();
        String content = entity.getContent();

        return switch (type) {
            case "USER" -> new UserMessage(content);
            case "ASSISTANT" -> new AssistantMessage(content);
            case "SYSTEM" -> new SystemMessage(content);
            default -> new UserMessage(content); // Fallback to user message
        };
    }
}

package com.enterprise.iam.ai.memory;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.ai.vectorstore.filter.FilterExpressionBuilder;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

/**
 * Production-grade Cognitive Memory Service using Spring AI's VectorStore
 * abstraction.
 *
 * <p>
 * Memory taxonomy (aligned with cognitive science):
 * <ul>
 * <li><b>Episodic</b> — specific past events/actions for a user (what happened,
 * when)</li>
 * <li><b>Semantic</b> — factual knowledge and user preferences (facts,
 * concepts)</li>
 * <li><b>Procedural</b> — rules, SOPs, behavioral constraints (how to act)</li>
 * </ul>
 *
 * <p>
 * All memories are stored in the same Spring AI-managed {@code ai_memory_store}
 * table.
 * Differentiation is done via JSONB metadata fields ({@code memoryType},
 * {@code userId})
 * and filtered at query time using FilterExpressionBuilder — <strong>zero
 * hardcoded SQL</strong>.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CognitiveMemoryService {

        /**
         * Metadata key constants — centralised to avoid typos.
         */
        public static final String META_MEMORY_TYPE = "memoryType";
        public static final String META_USER_ID = "userId";
        public static final String META_SOURCE = "source";

        public enum MemoryType {
                EPISODIC, SEMANTIC, PROCEDURAL
        }

        private final VectorStore vectorStore;

        // -------------------------------------------------------------------------
        // Write operations — @Async to avoid blocking the chat request thread
        // -------------------------------------------------------------------------

        /**
         * Records a user's specific past action/event as an Episodic memory.
         */
        @Async("memoryWriteExecutor")
        public void recordEpisodicMemory(String content, Long userId) {
                log.info("Recording EPISODIC memory for user {}", userId);
                Document doc = new Document(content, Map.of(
                                META_MEMORY_TYPE, MemoryType.EPISODIC.name(),
                                META_USER_ID, userId.toString(),
                                META_SOURCE, "agent-interaction"));
                vectorStore.add(List.of(doc));
        }

        /**
         * Records a general fact or user preference as a Semantic memory.
         */
        @Async("memoryWriteExecutor")
        public void recordSemanticMemory(String content, Long userId) {
                log.info("Recording SEMANTIC memory for user {}", userId);
                Document doc = new Document(content, Map.of(
                                META_MEMORY_TYPE, MemoryType.SEMANTIC.name(),
                                META_USER_ID, userId.toString(),
                                META_SOURCE, "knowledge-base"));
                vectorStore.add(List.of(doc));
        }

        /**
         * Records a global SOP or behavioral rule as a Procedural memory.
         * These are system-level rules, not user-specific.
         */
        @Async("memoryWriteExecutor")
        public void recordProceduralMemory(String content) {
                log.info("Recording PROCEDURAL memory (SOP/rule)");
                Document doc = new Document(content, Map.of(
                                META_MEMORY_TYPE, MemoryType.PROCEDURAL.name(),
                                META_SOURCE, "system-policy"));
                vectorStore.add(List.of(doc));
        }

        // -------------------------------------------------------------------------
        // Retrieval operations — semantic similarity + metadata filtering
        // -------------------------------------------------------------------------

        /**
         * Retrieves the most relevant procedural rules (SOPs) for a given intent.
         * Uses cosine similarity search filtered to PROCEDURAL memory type only.
         */
        public List<String> retrieveProceduralRules(String intentContext, int limit) {
                FilterExpressionBuilder b = new FilterExpressionBuilder();

                List<Document> docs = vectorStore.similaritySearch(
                                SearchRequest.builder()
                                                .query(intentContext)
                                                .topK(limit)
                                                .similarityThreshold(0.65) // Only return meaningfully relevant rules
                                                .filterExpression(b.eq(META_MEMORY_TYPE, MemoryType.PROCEDURAL.name())
                                                                .build())
                                                .build());

                log.debug("Retrieved {} procedural rules for context: {}", docs.size(), intentContext);
                return docs.stream().map(Document::getText).toList();
        }

        /**
         * Retrieves relevant historical context (Episodic + Semantic) for a user.
         * Runs two separate similarity searches and merges results.
         */
        public List<String> retrieveHistoricalContext(String intentContext, Long userId, int limit) {
                FilterExpressionBuilder b = new FilterExpressionBuilder();
                String userIdStr = userId.toString();

                // Episodic: user's past actions/events
                List<Document> episodic = vectorStore.similaritySearch(
                                SearchRequest.builder()
                                                .query(intentContext)
                                                .topK(limit)
                                                .similarityThreshold(0.60)
                                                .filterExpression(b.and(
                                                                b.eq(META_MEMORY_TYPE, MemoryType.EPISODIC.name()),
                                                                b.eq(META_USER_ID, userIdStr)).build())
                                                .build());

                // Semantic: factual knowledge about the user
                List<Document> semantic = vectorStore.similaritySearch(
                                SearchRequest.builder()
                                                .query(intentContext)
                                                .topK(limit)
                                                .similarityThreshold(0.60)
                                                .filterExpression(b.and(
                                                                b.eq(META_MEMORY_TYPE, MemoryType.SEMANTIC.name()),
                                                                b.eq(META_USER_ID, userIdStr)).build())
                                                .build());

                log.debug("Retrieved {} episodic + {} semantic memories for user {}",
                                episodic.size(), semantic.size(), userId);

                // Merge — episodic context first (more specific), then semantic (factual
                // grounding)
                return java.util.stream.Stream.concat(
                                episodic.stream().map(Document::getText),
                                semantic.stream().map(Document::getText)).toList();
        }
}

-- V4: Remove manually-created vector memory tables
-- Spring AI's VectorStore (PgVectorStore) now manages embeddings in 'ai_memory_store'.
-- Memory type differentiation is handled via JSONB metadata, not separate tables.
-- These three tables are superseded by the Spring AI-managed unified store.

DROP TABLE IF EXISTS episodic_memory CASCADE;
DROP TABLE IF EXISTS semantic_memory CASCADE;
DROP TABLE IF EXISTS procedural_memory CASCADE;

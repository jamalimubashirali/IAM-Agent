-- V6: Resize ai_memory_store vector column to 1536 dimensions.
--
-- nvidia/llama-nemotron-embed-vl-1b-v2 natively produces 2048-dim vectors but
-- pgvector 0.5.x limits both HNSW and IVFFlat indexes to 2000 dimensions.
-- We request truncated 1536-dim output from the model (via the `dimensions`
-- API parameter) to stay within that limit while keeping the same model.
--
-- Safe to run on a fresh DB (the DROP is IF EXISTS).

DROP TABLE IF EXISTS ai_memory_store CASCADE;

CREATE TABLE IF NOT EXISTS ai_memory_store (
    id        UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content   TEXT         NOT NULL,
    metadata  JSON,
    embedding vector(1536)
);

-- HNSW: 1536 < 2000-dim limit in pgvector 0.5.x. Fast approximate search.
CREATE INDEX IF NOT EXISTS ai_memory_store_embedding_idx
    ON ai_memory_store USING hnsw (embedding vector_cosine_ops);

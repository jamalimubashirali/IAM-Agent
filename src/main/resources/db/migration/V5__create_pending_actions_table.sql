-- V5: Create the pending_actions table for Phase 5 HITL Execution Engine
-- Stores AI-requested mutating actions that require human administrator approval.

CREATE TABLE IF NOT EXISTS pending_actions (
    id                   BIGSERIAL PRIMARY KEY,
    tool_name            VARCHAR(255)  NOT NULL,
    description          VARCHAR(1024) NOT NULL,
    payload_json         TEXT          NOT NULL,
    status               VARCHAR(50)   NOT NULL DEFAULT 'PENDING',
    chat_id              VARCHAR(255),
    requested_by_user_id BIGINT,
    created_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    resolved_at          TIMESTAMPTZ,

    CONSTRAINT pending_actions_status_check
        CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED'))
);

CREATE INDEX IF NOT EXISTS idx_pending_actions_status ON pending_actions (status);
CREATE INDEX IF NOT EXISTS idx_pending_actions_chat_id ON pending_actions (chat_id);

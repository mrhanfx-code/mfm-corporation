-- MFM Corporation D1 Migration v2
-- Run against existing database: wrangler d1 execute mfm-corporation-db --file=src/db/migrate-v2.sql

-- 1. Add hitl_required column to tasks (if not exists)
ALTER TABLE tasks ADD COLUMN hitl_required INTEGER DEFAULT 0;

-- 2. Add status index (if not exists)
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

-- Note: SQLite D1 does not support adding CHECK constraints via ALTER TABLE.
-- The status CHECK constraint in schema.sql applies to new tables only.
-- Existing rows with status='pending' or 'completed' are valid states in the new machine.

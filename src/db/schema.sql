-- MFM Corporation Agent System D1 Schema
-- Stores: tasks, agent conversation memory, routing decisions, daily metrics, routing scores

-- tasks: every agent run creates a task row; state machine: pending→analyzing→drafting→reviewing→approved/rejected→executing→completed/failed
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  agent TEXT NOT NULL,
  input TEXT NOT NULL,
  output TEXT,
  status TEXT DEFAULT 'pending'
    CHECK(status IN ('pending','analyzing','drafting','reviewing','approved','rejected','executing','completed','failed')),
  quality_score REAL,
  hitl_required INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  completed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_tasks_agent_created ON tasks(agent, created_at);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

-- Migration for existing databases (run once):
-- ALTER TABLE tasks ADD COLUMN hitl_required INTEGER DEFAULT 0;

-- agent_memory: per-user conversation history for each agent (pruned to 100 rows)
CREATE TABLE IF NOT EXISTS agent_memory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agent TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_agent_memory_lookup ON agent_memory(agent, user_id, created_at);

-- decisions: audit log of routing + agent decisions
CREATE TABLE IF NOT EXISTS decisions (
  id TEXT PRIMARY KEY,
  agent TEXT NOT NULL,
  input TEXT NOT NULL,
  reasoning TEXT,
  decision TEXT NOT NULL,
  confidence REAL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- metrics: daily aggregates per agent (weighted averages computed in SQL)
CREATE TABLE IF NOT EXISTS metrics (
  agent TEXT NOT NULL,
  date TEXT NOT NULL,
  tasks_completed INTEGER DEFAULT 0,
  avg_quality_score REAL DEFAULT 0,
  avg_response_ms INTEGER DEFAULT 0,
  PRIMARY KEY (agent, date)
);

-- dead_letter_queue: queue messages that failed after max retries
CREATE TABLE IF NOT EXISTS dead_letter_queue (
  id TEXT PRIMARY KEY,
  chat_id TEXT,
  user_id TEXT,
  text TEXT,
  task_type TEXT,
  error TEXT,
  attempts INTEGER DEFAULT 0,
  replayed INTEGER DEFAULT 0,
  failed_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_dlq_failed_at ON dead_letter_queue(failed_at);

-- routing_scores: per-agent routing quality, separate from task metrics
CREATE TABLE IF NOT EXISTS routing_scores (
  agent TEXT PRIMARY KEY,
  total_reviews INTEGER DEFAULT 0,
  avg_score REAL DEFAULT 0,
  updated_at TEXT DEFAULT (datetime('now'))
);

-- model_usage: cost tracking per model and task type
CREATE TABLE IF NOT EXISTS model_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  model TEXT NOT NULL,
  task_type TEXT NOT NULL,
  prompt_tokens INTEGER DEFAULT 0,
  completion_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  cost REAL DEFAULT 0,
  timestamp INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_model_usage_timestamp ON model_usage(timestamp);
CREATE INDEX IF NOT EXISTS idx_model_usage_model ON model_usage(model);

-- memory: keyword-based memory system for agents
CREATE TABLE IF NOT EXISTS memory (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  keywords TEXT NOT NULL,
  agent TEXT DEFAULT 'general',
  pinned INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_memory_agent ON memory(agent);
CREATE INDEX IF NOT EXISTS idx_memory_keywords ON memory(keywords);
CREATE INDEX IF NOT EXISTS idx_memory_pinned ON memory(pinned, created_at);

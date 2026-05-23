-- MFM Corporation Agent System D1 Schema

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  agent TEXT NOT NULL,
  input TEXT NOT NULL,
  output TEXT,
  status TEXT DEFAULT 'pending',
  quality_score REAL,
  created_at TEXT DEFAULT (datetime('now')),
  completed_at TEXT
);

CREATE TABLE IF NOT EXISTS agent_memory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agent TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_agent_memory_lookup ON agent_memory(agent, user_id, created_at);

CREATE TABLE IF NOT EXISTS decisions (
  id TEXT PRIMARY KEY,
  agent TEXT NOT NULL,
  input TEXT NOT NULL,
  reasoning TEXT,
  decision TEXT NOT NULL,
  confidence REAL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS metrics (
  agent TEXT NOT NULL,
  date TEXT NOT NULL,
  tasks_completed INTEGER DEFAULT 0,
  avg_quality_score REAL DEFAULT 0,
  avg_response_ms INTEGER DEFAULT 0,
  PRIMARY KEY (agent, date)
);

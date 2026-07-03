-- Dashboard Schema Extensions for MFM Corporation Mission Control
-- Run this after existing schema.sql to add dashboard-specific tables

-- dashboard_sessions: track active dashboard connections
CREATE TABLE IF NOT EXISTS dashboard_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  connected_at TEXT DEFAULT (datetime('now')),
  last_heartbeat TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_dashboard_sessions_user ON dashboard_sessions(user_id, last_heartbeat);

-- dashboard_events: event log for real-time streaming
CREATE TABLE IF NOT EXISTS dashboard_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,
  payload TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_dashboard_events_type ON dashboard_events(event_type, created_at);

-- dashboard_commands: command history from dashboard
CREATE TABLE IF NOT EXISTS dashboard_commands (
  id TEXT PRIMARY KEY,
  command_type TEXT NOT NULL,
  target TEXT NOT NULL,
  payload TEXT NOT NULL,
  status TEXT DEFAULT 'pending'
    CHECK(status IN ('pending','executing','completed','failed')),
  created_at TEXT DEFAULT (datetime('now')),
  completed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_dashboard_commands_status ON dashboard_commands(status, created_at);

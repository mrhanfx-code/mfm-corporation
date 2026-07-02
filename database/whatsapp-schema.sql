-- WhatsApp conversations table
CREATE TABLE IF NOT EXISTS whatsapp_conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phone_number TEXT NOT NULL,
  message TEXT NOT NULL,
  response TEXT,
  intent TEXT,
  confidence REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  escalated BOOLEAN DEFAULT 0
);

-- Customer feedback table
CREATE TABLE IF NOT EXISTS customer_feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER,
  helpful BOOLEAN,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback_text TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES whatsapp_conversations(id)
);

-- Escalation log table
CREATE TABLE IF NOT EXISTS escalation_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER,
  escalation_reason TEXT,
  escalated_to TEXT,
  escalated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  resolved BOOLEAN DEFAULT 0,
  FOREIGN KEY (conversation_id) REFERENCES whatsapp_conversations(id)
);

-- Rate limits table
CREATE TABLE IF NOT EXISTS rate_limits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  identifier TEXT NOT NULL,
  request_count INTEGER DEFAULT 0,
  window_start DATETIME DEFAULT CURRENT_TIMESTAMP,
  window_duration INTEGER DEFAULT 60,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_phone ON whatsapp_conversations(phone_number);
CREATE INDEX IF NOT EXISTS idx_conversations_created ON whatsapp_conversations(created_at);
CREATE INDEX IF NOT EXISTS idx_feedback_conversation ON customer_feedback(conversation_id);
CREATE INDEX IF NOT EXISTS idx_escalation_conversation ON escalation_log(conversation_id);
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier ON rate_limits(identifier);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON rate_limits(window_start);

-- MFM Corporation Database Schema
-- CEO Remy Command Center - 19 Teams & 5 C-Level Executives

-- Enable Row Level Security
ALTER DATABASE SET statement_timeout = 0;
SET statement_timeout = 0;

-- C-Level Executives Table
CREATE TABLE IF NOT EXISTS executives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    department TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'busy', 'offline', 'meeting')),
    current_task TEXT,
    quality_score DECIMAL(5,2) DEFAULT 95.0,
    tasks_assigned INTEGER DEFAULT 0,
    tasks_completed INTEGER DEFAULT 0,
    last_updated TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 19 Specialized Teams Table
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    department TEXT NOT NULL,
    executive_id UUID REFERENCES executives(id),
    status TEXT DEFAULT 'available' CHECK (status IN ('available', 'working', 'busy', 'review', 'offline')),
    current_task TEXT,
    quality_score DECIMAL(5,2) DEFAULT 95.0,
    todo_count INTEGER DEFAULT 0,
    redo_count INTEGER DEFAULT 0,
    last_updated TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- CEO Commands Table
CREATE TABLE IF NOT EXISTS ceo_commands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    command TEXT NOT NULL,
    command_type TEXT NOT NULL CHECK (command_type IN ('research', 'design', 'business', 'issues', 'general')),
    urgency TEXT DEFAULT 'normal' CHECK (urgency IN ('low', 'normal', 'medium', 'high', 'critical')),
    scope TEXT DEFAULT 'general' CHECK (scope IN ('general', 'department', 'corporate')),
    files TEXT[],
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    assigned_executive UUID REFERENCES executives(id),
    response TEXT,
    action_items TEXT[],
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Chat Messages Table
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender TEXT NOT NULL CHECK (sender IN ('CEO Remy', 'General Manager', 'System')),
    message TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'system', 'alert')),
    files TEXT[],
    command_id UUID REFERENCES ceo_commands(id),
    timestamp TIMESTAMP DEFAULT NOW(),
    is_read BOOLEAN DEFAULT FALSE
);

-- Team Tasks Table
CREATE TABLE IF NOT EXISTS team_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES teams(id),
    command_id UUID REFERENCES ceo_commands(id),
    task TEXT NOT NULL,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'review', 'completed', 'redo', 'failed')),
    deadline TIMESTAMP,
    quality_score DECIMAL(5,2),
    redo_count INTEGER DEFAULT 0,
    feedback TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Quality Issues Table
CREATE TABLE IF NOT EXISTS quality_issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES teams(id),
    task_id UUID REFERENCES team_tasks(id),
    issue_type TEXT NOT NULL,
    description TEXT NOT NULL,
    severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    action_required TEXT NOT NULL,
    deadline TIMESTAMP,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    created_at TIMESTAMP DEFAULT NOW(),
    resolved_at TIMESTAMP
);

-- CEO Authentication Table
CREATE TABLE IF NOT EXISTS ceo_authentication (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    totp_secret TEXT NOT NULL,
    backup_codes TEXT[],
    session_token TEXT UNIQUE,
    session_expires TIMESTAMP,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- System Settings Table
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key TEXT NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert C-Level Executives
INSERT INTO executives (title, name, department) VALUES
('Chief Operating Officer', 'COO', 'Operations'),
('Chief Technology Officer', 'CTO', 'Technology'),
('Chief Marketing Officer', 'CMO', 'Marketing'),
('Chief Financial Officer', 'CFO', 'Finance'),
('Chief Innovation Officer', 'CINO', 'Innovation')
ON CONFLICT (title) DO NOTHING;

-- Insert 19 Specialized Teams
INSERT INTO teams (name, department, executive_id) VALUES
-- Innovation & Market Intelligence Department
('Innovation Team', 'Innovation & Market Intelligence', (SELECT id FROM executives WHERE title = 'Chief Innovation Officer')),
('Market Intelligence Team', 'Innovation & Market Intelligence', (SELECT id FROM executives WHERE title = 'Chief Innovation Officer')),
('Technology Tracking Team', 'Innovation & Market Intelligence', (SELECT id FROM executives WHERE title = 'Chief Innovation Officer')),
('MCP & LLM Integration Team', 'Innovation & Market Intelligence', (SELECT id FROM executives WHERE title = 'Chief Innovation Officer')),

-- Core Operations Department
('Development Team', 'Core Operations', (SELECT id FROM executives WHERE title = 'Chief Technology Officer')),
('Planning Team', 'Core Operations', (SELECT id FROM executives WHERE title = 'Chief Operating Officer')),
('Research Team', 'Core Operations', (SELECT id FROM executives WHERE title = 'Chief Innovation Officer')),

-- Marketing & Media Department
('Marketing Team', 'Marketing & Media', (SELECT id FROM executives WHERE title = 'Chief Marketing Officer')),
('Media Team', 'Marketing & Media', (SELECT id FROM executives WHERE title = 'Chief Marketing Officer')),

-- Management & Quality Department
('Management Team', 'Management & Quality', (SELECT id FROM executives WHERE title = 'Chief Operating Officer')),
('Quality Control Manager', 'Management & Quality', (SELECT id FROM executives WHERE title = 'Chief Operating Officer')),

-- Support Layer
('Security Operations Team', 'Support Layer', (SELECT id FROM executives WHERE title = 'Chief Technology Officer')),
('Infrastructure Team', 'Support Layer', (SELECT id FROM executives WHERE title = 'Chief Technology Officer')),
('Data Governance Team', 'Support Layer', (SELECT id FROM executives WHERE title = 'Chief Operating Officer')),
('Customer Success Team', 'Support Layer', (SELECT id FROM executives WHERE title = 'Chief Marketing Officer')),

-- Analytics Layer
('Business Intelligence Team', 'Analytics Layer', (SELECT id FROM executives WHERE title = 'Chief Financial Officer')),
('Performance Analytics Team', 'Analytics Layer', (SELECT id FROM executives WHERE title = 'Chief Financial Officer')),

-- Enhancement Layer
('Integration Team', 'Enhancement Layer', (SELECT id FROM executives WHERE title = 'Chief Technology Officer')),
('Training Team', 'Enhancement Layer', (SELECT id FROM executives WHERE title = 'Chief Innovation Officer'))
ON CONFLICT (name) DO NOTHING;

-- Insert System Settings
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('corporation_name', 'MFM Corporation', 'Company name'),
('ceo_name', 'Remy', 'CEO name'),
('timezone', 'Asia/Kuala_Lumpur', 'Default timezone'),
('max_file_size', '52428800', 'Maximum file size in bytes (50MB)'),
('session_timeout', '86400', 'Session timeout in seconds (24 hours)'),
('quality_threshold', '85.0', 'Quality score threshold for redo requests')
ON CONFLICT (setting_key) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE executives ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE ceo_commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE ceo_authentication ENABLE ROW LEVEL SECURITY;

-- RLS Policies for CEO (Full Access)
CREATE POLICY "CEO full access" ON executives FOR ALL USING (true);
CREATE POLICY "CEO full access" ON teams FOR ALL USING (true);
CREATE POLICY "CEO full access" ON ceo_commands FOR ALL USING (true);
CREATE POLICY "CEO full access" ON chat_messages FOR ALL USING (true);
CREATE POLICY "CEO full access" ON team_tasks FOR ALL USING (true);
CREATE POLICY "CEO full access" ON quality_issues FOR ALL USING (true);
CREATE POLICY "CEO full access" ON ceo_authentication FOR ALL USING (true);

-- RLS Policies for System (Read-only)
CREATE POLICY "System read access" ON executives FOR SELECT USING (true);
CREATE POLICY "System read access" ON teams FOR SELECT USING (true);
CREATE POLICY "System read access" ON ceo_commands FOR SELECT USING (true);
CREATE POLICY "System read access" ON chat_messages FOR SELECT USING (true);
CREATE POLICY "System read access" ON team_tasks FOR SELECT USING (true);
CREATE POLICY "System read access" ON quality_issues FOR SELECT USING (true);

-- Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_teams_status ON teams(status);
CREATE INDEX IF NOT EXISTS idx_teams_executive ON teams(executive_id);
CREATE INDEX IF NOT EXISTS idx_ceo_commands_status ON ceo_commands(status);
CREATE INDEX IF NOT EXISTS idx_ceo_commands_type ON ceo_commands(command_type);
CREATE INDEX IF NOT EXISTS idx_chat_messages_timestamp ON chat_messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_team_tasks_status ON team_tasks(status);
CREATE INDEX IF NOT EXISTS idx_team_tasks_team ON team_tasks(team_id);
CREATE INDEX IF NOT EXISTS idx_quality_issues_status ON quality_issues(status);
CREATE INDEX IF NOT EXISTS idx_quality_issues_team ON quality_issues(team_id);

-- Create Functions for Real-time Updates
CREATE OR REPLACE FUNCTION update_team_status()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_team_status_trigger
    BEFORE UPDATE ON teams
    FOR EACH ROW
    EXECUTE FUNCTION update_team_status();

CREATE OR REPLACE FUNCTION update_executive_status()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_executive_status_trigger
    BEFORE UPDATE ON executives
    FOR EACH ROW
    EXECUTE FUNCTION update_executive_status();

-- Create View for Corporate Status
CREATE OR REPLACE VIEW corporate_status AS
SELECT 
    (SELECT COUNT(*) FROM teams WHERE status = 'available') as teams_available,
    (SELECT COUNT(*) FROM teams WHERE status = 'working') as teams_working,
    (SELECT COUNT(*) FROM teams WHERE status = 'busy') as teams_busy,
    (SELECT COUNT(*) FROM teams) as total_teams,
    (SELECT COUNT(*) FROM executives WHERE status = 'active') as executives_active,
    (SELECT COUNT(*) FROM team_tasks WHERE status = 'completed' AND DATE(created_at) = CURRENT_DATE) as tasks_completed_today,
    (SELECT AVG(quality_score) FROM teams) as avg_quality_score,
    (SELECT COUNT(*) FROM quality_issues WHERE status = 'open') as open_quality_issues;

-- Create Function for Quality Alerts
CREATE OR REPLACE FUNCTION check_quality_threshold()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.quality_score < 85.0 THEN
        INSERT INTO quality_issues (team_id, issue_type, description, severity, action_required)
        VALUES (NEW.id, 'Quality Score Below Threshold', 
                CONCAT('Team quality score ', NEW.quality_score, '% is below 85% threshold'),
                CASE 
                    WHEN NEW.quality_score < 70.0 THEN 'critical'
                    WHEN NEW.quality_score < 80.0 THEN 'high'
                    ELSE 'medium'
                END,
                'Team must redo work to meet quality standards');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER quality_check_trigger
    AFTER UPDATE ON teams
    FOR EACH ROW
    EXECUTE FUNCTION check_quality_threshold();

-- Create Function for CEO Session Management
CREATE OR REPLACE FUNCTION create_ceo_session(user_id TEXT, session_token TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE ceo_authentication 
    SET session_token = session_token, 
        session_expires = NOW() + INTERVAL '24 hours',
        last_login = NOW()
    WHERE user_id = user_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Create Function for CEO Session Validation
CREATE OR REPLACE FUNCTION validate_ceo_session(session_token TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    is_valid BOOLEAN;
BEGIN
    SELECT (session_token = session_token AND session_expires > NOW()) INTO is_valid
    FROM ceo_authentication 
    WHERE session_token = session_token;
    
    RETURN COALESCE(is_valid, FALSE);
END;
$$ LANGUAGE plpgsql;

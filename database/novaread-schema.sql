-- MFM Corporation × Novaread Empire Integration Schema
-- Database: Cloudflare D1 (SQLite-compatible)
-- Purpose: Track ebook leads, sales, content performance for 14-day sprint

-- ============================================================
-- NOVAREAD LEADS TABLE
-- Tracks every person who shows interest (PMs, comments, inquiries)
-- ============================================================
CREATE TABLE IF NOT EXISTS novaread_leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source TEXT NOT NULL, -- 'FB Group', 'WhatsApp', 'TikTok', 'Carousell', 'Shopee', 'Telegram', 'Referral'
    source_detail TEXT, -- e.g., group name, contact name, channel name
    contact_method TEXT NOT NULL, -- 'WhatsApp', 'Telegram', 'FB Messenger', 'Carousell Chat'
    contact_id TEXT NOT NULL, -- phone number, username, or identifier
    lead_name TEXT,
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'followed_up', 'paid', 'declined', 'unresponsive')),
    interest_level INTEGER DEFAULT 3 CHECK (interest_level BETWEEN 1 AND 5), -- 1=curious, 5=ready to buy
    first_contact_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_contact_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    assigned_agent TEXT DEFAULT 'ops-coordinator', -- which MFM agent owns this lead
    tags TEXT -- comma-separated: 'hot', 'warm', 'b40', 'm40', 'jb', 'kl'
);

CREATE INDEX IF NOT EXISTS idx_novaread_leads_status ON novaread_leads(status);
CREATE INDEX IF NOT EXISTS idx_novaread_leads_source ON novaread_leads(source);
CREATE INDEX IF NOT EXISTS idx_novaread_leads_contact ON novaread_leads(contact_id);

-- ============================================================
-- NOVAREAD SALES TABLE
-- Tracks every completed ebook purchase
-- ============================================================
CREATE TABLE IF NOT EXISTS novaread_sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lead_id INTEGER REFERENCES novaread_leads(id),
    order_code TEXT UNIQUE, -- NOV-20260524-001 (auto-generated)
    package TEXT NOT NULL DEFAULT 'Basic' CHECK (package IN ('Basic', 'Complete', 'Coaching')),
    amount_rm REAL NOT NULL,
    amount_sgd REAL, -- if paid in SGD
    payment_method TEXT NOT NULL CHECK (payment_method IN ('DuitNow', 'Bank Transfer', 'ShopeePay', 'TouchNGo', 'Cash')),
    payment_reference TEXT, -- transaction ID, receipt number
    payment_verified INTEGER DEFAULT 0 CHECK (payment_verified IN (0, 1)),
    channel TEXT NOT NULL, -- which marketing channel drove this sale
    ebook_pdf_url TEXT, -- R2 signed URL (7-day expiry)
    ebook_epub_url TEXT, -- R2 signed URL (7-day expiry)
    templates_url TEXT, -- for Complete/Coaching packages
    delivered_at DATETIME,
    delivery_method TEXT DEFAULT 'WhatsApp', -- how ebook was sent
    refund_requested INTEGER DEFAULT 0 CHECK (refund_requested IN (0, 1)),
    refund_amount REAL,
    refund_reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_novaread_sales_date ON novaread_sales(created_at);
CREATE INDEX IF NOT EXISTS idx_novaread_sales_channel ON novaread_sales(channel);

-- ============================================================
-- NOVAREAD CONTENT PERFORMANCE TABLE
-- Tracks every marketing post/video/DM and its performance
-- ============================================================
CREATE TABLE IF NOT EXISTS novaread_content (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    platform TEXT NOT NULL, -- 'FB Group', 'TikTok', 'WhatsApp', 'Telegram', 'Carousell', 'Shopee'
    content_type TEXT NOT NULL, -- 'post', 'video', 'dm_template', 'status', 'listing', 'comment'
    agent_creator TEXT NOT NULL, -- which MFM agent created this: content-writer, trend-spotter, etc.
    content_title TEXT, -- brief description
    content_body TEXT, -- full text (for reference/analysis)
    quality_score INTEGER CHECK (quality_score BETWEEN 0 AND 100),
    reviewer_agent TEXT, -- quality-reviewer who scored it
    posted_at DATETIME,
    engagement_likes INTEGER DEFAULT 0,
    engagement_comments INTEGER DEFAULT 0,
    engagement_shares INTEGER DEFAULT 0,
    engagement_views INTEGER DEFAULT 0,
    leads_generated INTEGER DEFAULT 0, -- how many PMs/DMs resulted
    sales_attributed INTEGER DEFAULT 0, -- how many sales traced to this content
    revenue_attributed REAL DEFAULT 0, -- total RM from attributed sales
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'reviewing', 'approved', 'posted', 'archived')),
    ab_test_variant TEXT, -- 'A' or 'B' for A/B testing
    tags TEXT, -- 'hook-salary', 'hook-scam', 'hook-document', 'testimonial'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_novaread_content_platform ON novaread_content(platform);
CREATE INDEX IF NOT EXISTS idx_novaread_content_date ON novaread_content(posted_at);

-- ============================================================
-- NOVAREAD DAILY KPI TABLE
-- Aggregated daily metrics for CEO dashboard
-- ============================================================
CREATE TABLE IF NOT EXISTS novaread_daily_kpi (
    date TEXT PRIMARY KEY, -- YYYY-MM-DD
    leads_new INTEGER DEFAULT 0,
    leads_contacted INTEGER DEFAULT 0,
    sales_count INTEGER DEFAULT 0,
    revenue_rm REAL DEFAULT 0,
    content_posted INTEGER DEFAULT 0,
    avg_response_time_minutes REAL,
    top_channel TEXT,
    top_content_id INTEGER REFERENCES novaread_content(id),
    notes TEXT
);

-- ============================================================
-- NOVAREAD CUSTOMER FOLLOW-UP TABLE
-- Post-sale engagement and testimonial collection
-- ============================================================
CREATE TABLE IF NOT EXISTS novaread_followups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id INTEGER NOT NULL REFERENCES novaread_sales(id),
    followup_type TEXT NOT NULL CHECK (followup_type IN ('delivery_confirmation', 'day3_checkin', 'day7_testimonial_request', 'day14_satisfaction')),
    sent_at DATETIME,
    response_received INTEGER DEFAULT 0 CHECK (response_received IN (0, 1)),
    response_text TEXT,
    testimonial_granted INTEGER DEFAULT 0 CHECK (testimonial_granted IN (0, 1)),
    testimonial_text TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- NOVAREAD INVENTORY / PRODUCT TABLE
-- Product catalog for Novaread
-- ============================================================
CREATE TABLE IF NOT EXISTS novaread_products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sku TEXT UNIQUE NOT NULL, -- NOV-BASIC, NOV-COMPLETE, NOV-COACHING
    name TEXT NOT NULL,
    description TEXT,
    price_rm REAL NOT NULL,
    price_sgd REAL,
    includes_pdf INTEGER DEFAULT 1,
    includes_epub INTEGER DEFAULT 0,
    includes_templates INTEGER DEFAULT 0,
    includes_video INTEGER DEFAULT 0,
    includes_coaching INTEGER DEFAULT 0,
    coaching_minutes INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1 CHECK (is_active IN (0, 1))
);

-- Seed product data
INSERT INTO novaread_products (sku, name, description, price_rm, includes_pdf, includes_epub, includes_templates) VALUES
('NOV-BASIC', 'Panduan Gaji SGD — Basic', 'PDF ebook sahaja. Panduan lengkap kerja Singapore.', 47, 1, 0, 0)
ON CONFLICT(sku) DO UPDATE SET 
    name=excluded.name, description=excluded.description, price_rm=excluded.price_rm;

INSERT INTO novaread_products (sku, name, description, price_rm, includes_pdf, includes_epub, includes_templates, includes_video) VALUES
('NOV-COMPLETE', 'Panduan Gaji SGD — Complete', 'PDF + EPUB + Template Dokumen + Video Summary.', 97, 1, 1, 1, 1)
ON CONFLICT(sku) DO UPDATE SET 
    name=excluded.name, description=excluded.description, price_rm=excluded.price_rm;

INSERT INTO novaread_products (sku, name, description, price_rm, includes_pdf, includes_epub, includes_templates, includes_video, includes_coaching, coaching_minutes) VALUES
('NOV-COACHING', 'Panduan Gaji SGD — Coaching', 'Complete package + 30-min konsultasi + WhatsApp support.', 247, 1, 1, 1, 1, 1, 30)
ON CONFLICT(sku) DO UPDATE SET 
    name=excluded.name, description=excluded.description, price_rm=excluded.price_rm;

-- ============================================================
-- VIEWS FOR REPORTING
-- ============================================================

-- Sales summary by channel
CREATE VIEW IF NOT EXISTS novaread_sales_by_channel AS
SELECT 
    channel,
    COUNT(*) as total_sales,
    SUM(amount_rm) as total_revenue,
    AVG(amount_rm) as avg_order_value,
    MIN(created_at) as first_sale,
    MAX(created_at) as last_sale
FROM novaread_sales
WHERE payment_verified = 1
GROUP BY channel
ORDER BY total_revenue DESC;

-- Daily sales summary
CREATE VIEW IF NOT EXISTS novaread_daily_sales AS
SELECT 
    DATE(created_at) as sale_date,
    COUNT(*) as sales_count,
    SUM(amount_rm) as daily_revenue,
    COUNT(DISTINCT lead_id) as unique_customers
FROM novaread_sales
WHERE payment_verified = 1
GROUP BY DATE(created_at)
ORDER BY sale_date DESC;

-- Top performing content
CREATE VIEW IF NOT EXISTS novaread_top_content AS
SELECT 
    c.id,
    c.platform,
    c.content_type,
    c.content_title,
    c.agent_creator,
    c.quality_score,
    c.leads_generated,
    c.sales_attributed,
    c.revenue_attributed,
    CASE 
        WHEN c.sales_attributed > 0 THEN ROUND(c.revenue_attributed / c.sales_attributed, 2)
        ELSE 0 
    END as avg_sale_value
FROM novaread_content c
WHERE c.status = 'posted'
ORDER BY c.revenue_attributed DESC, c.leads_generated DESC
LIMIT 20;

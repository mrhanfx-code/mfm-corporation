# Cloudflare Terminal Setup Commands

## Prerequisites
```bash
# Install Wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler auth login
```

## Phase 1: Pages Setup
```bash
# Navigate to project directory
cd c:\Users\DELL\Documents\GitHub\mfm-corporation

# Deploy to Pages (manual setup via dashboard recommended)
wrangler pages deploy
```

## Phase 2: Worker Setup
```bash
# Create Worker
wrangler deploy mfm-corporation-api

# Test Worker
curl https://mfm-corporation-api.your-subdomain.workers.dev/api/status
```

## Phase 3: D1 Database
```bash
# Create D1 database
wrangler d1 create mfm-corporation-db

# Note the database ID from output and update wrangler.toml

# Create tables
wrangler d1 execute mfm-corporation-db --file=./database-schema.sql

# Verify tables
wrangler d1 execute mfm-corporation-db --command="SELECT name FROM sqlite_master WHERE type='table';"
```

## Phase 4: KV Namespace
```bash
# Create KV namespace
wrangler kv namespace create mfm-corporation-kv

# Create preview namespace
wrangler kv namespace create mfm-corporation-kv --preview

# Note the namespace IDs from output and update wrangler.toml

# Test KV storage
wrangler kv key put --namespace-id=your-kv-id-here "test-key" "test-value"
wrangler kv key get --namespace-id=your-kv-id-here "test-key"
```

## Phase 5: R2 Bucket
```bash
# Enable R2 (if not already enabled)
# This must be done in Cloudflare dashboard first

# Create R2 bucket
wrangler r2 bucket create mfm-corporation-uploads

# List buckets
wrangler r2 bucket list

# Test bucket
wrangler r2 object put mfm-corporation-uploads test.txt "Hello World"
wrangler r2 object get mfm-corporation-uploads test.txt
```

## Phase 6: Update Configuration
```bash
# Edit wrangler.toml with actual IDs
notepad wrangler.toml

# Deploy updated configuration
wrangler deploy
```

## Phase 7: Test API Endpoints
```bash
# Test status endpoint
curl https://mfm-corporation-api.your-subdomain.workers.dev/api/status

# Test user preferences
curl https://mfm-corporation-api.your-subdomain.workers.dev/api/user/preferences

# Test tools search
curl "https://mfm-corporation-api.your-subdomain.workers.dev/api/tools/search?q=figma"

# Test analytics
curl https://mfm-corporation-api.your-subdomain.workers.dev/api/analytics
```

## Database Schema File
Create `database-schema.sql`:
```sql
-- User preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL UNIQUE,
  preferences TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Analytics table
CREATE TABLE IF NOT EXISTS analytics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,
  event_data TEXT,
  user_id TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tools usage table
CREATE TABLE IF NOT EXISTS tools_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tool_id TEXT NOT NULL,
  user_id TEXT,
  action TEXT NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Troubleshooting Commands
```bash
# Check Wrangler version
wrangler --version

# Check authentication
wrangler whoami

# Check worker status
wrangler tail

# Check deployment status
wrangler deployments list

# Check D1 databases
wrangler d1 list

# Check KV namespaces
wrangler kv namespace list

# Check R2 buckets
wrangler r2 bucket list
```

## Environment Variables
```bash
# Set environment variables (Windows)
set CLOUDFLARE_API_TOKEN=your_token_here
set CLOUDFLARE_ACCOUNT_ID=your_account_id_here

# Or use PowerShell
$env:CLOUDFLARE_API_TOKEN="your_token_here"
$env:CLOUDFLARE_ACCOUNT_ID="your_account_id_here"
```

## Quick Setup Script
```bash
# Save as setup-cloudflare.cmd
@echo off
echo "Setting up Cloudflare resources..."

echo "Creating D1 database..."
wrangler d1 create mfm-corporation-db

echo "Creating KV namespace..."
wrangler kv namespace create mfm-corporation-kv

echo "Creating KV preview namespace..."
wrangler kv namespace create mfm-corporation-kv --preview

echo "Creating R2 bucket..."
wrangler r2 bucket create mfm-corporation-uploads

echo "Setup complete! Update wrangler.toml with the IDs shown above."
pause
```

## Next Steps After Terminal Setup
1. Update wrangler.toml with actual IDs
2. Deploy Worker with bindings
3. Test API endpoints
4. Integrate with frontend
5. Deploy Pages project

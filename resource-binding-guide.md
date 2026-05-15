# Resource Binding Guide - Step 3

## Current Status: Binding Resources to Worker

You are at Phase 2, Step 3: Bind Resources

### Resource Binding Instructions

#### 1. Navigate to Worker Settings
1. Go to your `mfm-corporation-api` worker
2. Click **Settings** tab
3. Scroll to **Variables** section
4. Click **Add variable**

#### 2. Add D1 Database Binding
1. Click **Add binding**
2. Select **D1 database** as type
3. **Variable name**: `DB`
4. **D1 database**: Select `mfm-corporation-db` (you'll create this next)
5. Click **Add binding**

#### 3. Add KV Namespace Binding
1. Click **Add binding**
2. Select **KV namespace** as type
3. **Variable name**: `KV`
4. **KV namespace**: Select `mfm-corporation-kv` (you'll create this next)
5. Click **Add binding**

#### 4. Add R2 Bucket Binding
1. Click **Add binding**
2. Select **R2 bucket** as type
3. **Variable name**: `BUCKET`
4. **R2 bucket**: Select `mfm-corporation-uploads` (you'll create this next)
5. Click **Add binding**

### Important Notes

**Order Matters**: Create resources first, then bind them
**Temporary**: You can bind resources now and create them after
**Testing**: Worker will work without resources (with error handling)

### Next Steps After Binding

1. Create D1 database
2. Create KV namespace
3. Create R2 bucket
4. Update wrangler.toml with actual IDs
5. Test Worker functionality

### Current Progress

✅ Step 1: Cloudflare Pages project created
✅ Step 2: Worker created with Hello World template
✅ Step 3: Worker code updated
🔄 Step 4: Resource binding (current step)
⏳ Step 5: D1 database creation
⏳ Step 6: KV namespace creation
⏳ Step 7: R2 bucket creation

### Quick Reference

**Worker URL**: `https://mfm-corporation-api.your-subdomain.workers.dev`
**Test Endpoint**: `/api/status`
**Expected Response**: System status with resource availability

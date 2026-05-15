# MFM Corporation - Cloudflare Pages Setup Instructions

## Step-by-Step Migration Guide

### Phase 1: Cloudflare Pages Project Setup

#### 1. Create Cloudflare Pages Project
1. Log into your Cloudflare dashboard
2. Navigate to **Pages** section
3. Click **Create a project**
4. Connect to **GitHub**
5. Select `mfm-corporation` repository
6. Configure build settings:
   - **Framework preset**: None
   - **Build command**: `echo "No build required"`
   - **Build output directory**: `.`

#### 2. Environment Variables
Add these environment variables in Pages settings:
```
ENVIRONMENT=production
NODE_VERSION=18
```

#### 3. Deploy Settings
- **Branch**: `master`
- **Production branch**: `master`
- **Preview deployments**: Enabled

### Phase 2: Workers Setup

#### 1. Create Worker
1. Navigate to **Workers & Pages**
2. Click **Create Worker**
3. Name: `mfm-corporation-api`
4. Click **Deploy**
5. Click **Edit code**
6. Replace default code with `src/index.js` content
7. Click **Save and Deploy**

#### 2. Update Worker Code
Replace the worker code with `src/index.js` content

#### 3. Bind Resources
Add these bindings to your worker:
- **D1 Database**: `DB` → `mfm-corporation-db`
- **KV Namespace**: `KV` → `mfm-corporation-kv`
- **R2 Bucket**: `BUCKET` → `mfm-corporation-uploads`

### Phase 3: D1 Database Setup

#### 1. Create Database
1. Navigate to **D1 SQL Database**
2. Click **Create database**
3. Name: `mfm-corporation-db`
4. Click **Create**

#### 2. Create Tables
Execute this SQL in D1 console:

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

#### 3. Get Database ID
Copy the database ID from the dashboard and update `wrangler.toml`

### Phase 4: KV Storage Setup

#### 1. Create KV Namespace
1. Navigate to **KV**
2. Click **Create namespace**
3. Name: `mfm-corporation-kv`
4. Click **Create**

#### 2. Create Preview Namespace
Create another namespace for preview deployments

#### 3. Update wrangler.toml
Replace the placeholder KV IDs with actual IDs

### Phase 5: R2 Storage Setup

#### 1. Enable R2
1. Navigate to **R2 Object Storage**
2. Click **Enable R2** (if not already enabled)

#### 2. Create Bucket
1. Click **Create bucket**
2. Name: `mfm-corporation-uploads`
3. Click **Create**

#### 3. Update wrangler.toml
Replace the placeholder bucket name if different

### Phase 6: Custom Domain Setup

#### 1. Add Custom Domain
1. In Pages project, go to **Custom domains**
2. Click **Set up a custom domain**
3. Enter your domain (e.g., `mfm-corporation.com`)
4. Follow DNS instructions

#### 2. Update DNS Records
Add these DNS records:
```
A    @    192.0.2.1    (Cloudflare IP)
AAAA @    100::        (Cloudflare IPv6)
```

### Phase 7: API Integration

#### 1. Update Frontend
Add this to your JavaScript to connect to the new API:

```javascript
// API configuration
const API_BASE = 'https://mfm-corporation-api.your-subdomain.workers.dev';

// API functions
class CloudflareAPI {
  constructor() {
    this.base = API_BASE;
  }

  async getStatus() {
    const response = await fetch(`${this.base}/api/status`);
    return response.json();
  }

  async getUserPreferences(userId) {
    const response = await fetch(`${this.base}/api/user/preferences?userId=${userId}`);
    return response.json();
  }

  async saveUserPreferences(userId, preferences) {
    const response = await fetch(`${this.base}/api/user/preferences`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(preferences)
    });
    return response.json();
  }

  async searchTools(query, category = '') {
    const response = await fetch(`${this.base}/api/tools/search?q=${query}&category=${category}`);
    return response.json();
  }

  async getAnalytics() {
    const response = await fetch(`${this.base}/api/analytics`);
    return response.json();
  }

  async uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${this.base}/api/upload`, {
      method: 'POST',
      body: formData
    });
    return response.json();
  }
}

// Initialize API
window.MFMCloudflareAPI = new CloudflareAPI();
```

#### 2. Update Existing Integrations
Modify existing JavaScript files to use the new API:

```javascript
// Update awesome-design-tools-integration.js
async saveUserPreferences(preferences) {
  if (window.MFMCloudflareAPI) {
    await window.MFMCloudflareAPI.saveUserPreferences('default', preferences);
  }
  // Fallback to localStorage
  localStorage.setItem('mfm-tools-preferences', JSON.stringify(preferences));
}

async loadUserPreferences() {
  try {
    if (window.MFMCloudflareAPI) {
      const preferences = await window.MFMCloudflareAPI.getUserPreferences('default');
      return preferences;
    }
  } catch (error) {
    console.log('Using localStorage fallback');
  }
  // Fallback to localStorage
  const saved = localStorage.getItem('mfm-tools-preferences');
  return saved ? JSON.parse(saved) : {};
}
```

### Phase 8: Testing

#### 1. Test API Endpoints
```bash
# Test status endpoint
curl https://mfm-corporation-api.your-subdomain.workers.dev/api/status

# Test user preferences
curl https://mfm-corporation-api.your-subdomain.workers.dev/api/user/preferences

# Test tools search
curl "https://mfm-corporation-api.your-subdomain.workers.dev/api/tools/search?q=figma"
```

#### 2. Test Frontend Integration
1. Visit your Cloudflare Pages URL
2. Test all integrations
3. Verify API calls are working
4. Check browser console for errors

#### 3. Performance Testing
1. Use Lighthouse to test performance
2. Test on different devices
3. Verify global CDN performance

### Phase 9: Migration Complete

#### 1. Update DNS
Point your custom domain to Cloudflare Pages

#### 2. Monitor Performance
Use Cloudflare Analytics to monitor:
- Page views
- API requests
- Error rates
- Performance metrics

#### 3. Backup Strategy
- Regular database backups
- Git repository backups
- Configuration backups

## Troubleshooting

### Common Issues

#### 1. Worker Not Found
- Check worker name in URL
- Verify worker is deployed
- Check routing configuration

#### 2. Database Connection Error
- Verify D1 database ID in wrangler.toml
- Check database binding in worker
- Ensure database exists

#### 3. KV Storage Error
- Verify KV namespace ID
- Check KV binding in worker
- Ensure namespace exists

#### 4. CORS Errors
- Check CORS headers in worker
- Verify request methods
- Test with different origins

### Debug Commands

```bash
# Local development
npx wrangler dev

# Deploy worker
npx wrangler deploy

# Execute SQL
npx wrangler d1 execute mfm-corporation-db --file=./schema.sql

# View logs
npx wrangler tail
```

## Next Steps

After migration is complete:

1. **Enhanced Features**:
   - User authentication
   - Real-time collaboration
   - Advanced analytics
   - File management system

2. **Performance Optimization**:
   - Edge caching
   - Image optimization
   - Bundle optimization
   - CDN configuration

3. **Security**:
   - Rate limiting
   - Input validation
   - Authentication middleware
   - Security headers

## Support Resources

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Workers Documentation](https://developers.cloudflare.com/workers/)
- [D1 Documentation](https://developers.cloudflare.com/d1/)
- [KV Documentation](https://developers.cloudflare.com/workers/runtime-apis/kv/)
- [R2 Documentation](https://developers.cloudflare.com/r2/)

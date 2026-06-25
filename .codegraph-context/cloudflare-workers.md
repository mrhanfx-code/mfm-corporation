## Code Context

**Query:** cloudflare workers deployment

### Entry Points

- **CLOUDFLARE_CONFIG** (constant) - js/config.js:5
  `= {
    apiUrl: 'https://mfm-corporation-api.mrhan-fx.workers.dev',
    pagesUrl: 'https://mfm-corpora...`
- **WORKER_URL** (constant) - dashboard/src/components/DashboardNew.tsx:28
  `= 'https://mfm-corporation-telegram-bot.mrhan-fx.workers.dev'`
- **WORKER_URL** (constant) - scripts/generate-action-plan.js:11
  `= 'https://mfm-corporation-telegram-bot.mrhan-fx.workers.dev'`

### Code

#### CLOUDFLARE_CONFIG (js/config.js:5)

```javascript
const CLOUDFLARE_CONFIG = {
    apiUrl: 'https://mfm-corporation-api.mrhan-fx.workers.dev',
    pagesUrl: 'https://mfm-corporation-git.pages.dev',
    endpoints: {
        status: '/api/status',
        userPreferences: '/api/user/preferences',
        toolsSearch: '/api/tools/search',
        analytics: '/api/analytics',
        upload: '/api/upload',
        chat: '/api/chat'
    }
};
```

#### WORKER_URL (dashboard/src/components/DashboardNew.tsx:28)

```tsx
const WORKER_URL = 'https://mfm-corporation-telegram-bot.mrhan-fx.workers.dev';
```

#### WORKER_URL (scripts/generate-action-plan.js:11)

```javascript
const WORKER_URL = 'https://mfm-corporation-telegram-bot.mrhan-fx.workers.dev';
```


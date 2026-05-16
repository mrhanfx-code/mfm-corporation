// MFM Corporation - Cloudflare Configuration
// CEO Remy Command Center - Live Credentials

// Cloudflare API Configuration
const CLOUDFLARE_CONFIG = {
    apiUrl: 'https://mfm-corporation-api.mrhan-fx.workers.dev',
    pagesUrl: 'https://mfm-corporation.pages.dev',
    endpoints: {
        status: '/api/status',
        userPreferences: '/api/user/preferences',
        toolsSearch: '/api/tools/search',
        analytics: '/api/analytics',
        upload: '/api/upload'
    }
};

// CEO Configuration
const CEO_CONFIG = {
    name: 'Remy',
    title: 'Chief Executive Officer',
    email: 'remy@mfm-corporation.com',
    sessionTimeout: 86400000, // 24 hours in milliseconds
    timezone: 'Asia/Kuala_Lumpur'
};

// Corporate Configuration
const CORPORATE_CONFIG = {
    totalTeams: 19,
    totalExecutives: 5,
    qualityThreshold: 85.0,
    maxFileSize: 52428800, // 50MB in bytes
    supportedFileTypes: '*/*',
    responseTimeTarget: 3000, // 3 seconds in milliseconds
    realTimeUpdateInterval: 500 // 500ms
};

// Export configurations
window.CLOUDFLARE_CONFIG = CLOUDFLARE_CONFIG;
window.CEO_CONFIG = CEO_CONFIG;
window.CORPORATE_CONFIG = CORPORATE_CONFIG;

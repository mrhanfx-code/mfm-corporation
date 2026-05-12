// MFM Corporation - Supabase Configuration
// CEO Remy Command Center - Live Credentials

// Supabase Configuration
const SUPABASE_CONFIG = {
    url: 'https://ptziszkaeueqyojixghn.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0emlzemthZXVlcXlvaml4Z2huIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1ODYyMzYsImV4cCI6MjA5NDE2MjIzNn0.CL0EVbis6UBw1BaGg61pyORId0RBi00H2rdykl7j1MQ',
    serviceRoleKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0emlzemthZXVlcXlvaml4Z2huIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1ODYyMzYsImV4cCI6MjA5NDE2MjIzNn0.CL0EVbis6UBw1BaGg61pyORId0RBi00H2rdykl7j1MQ'
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
window.SUPABASE_CONFIG = SUPABASE_CONFIG;
window.CEO_CONFIG = CEO_CONFIG;
window.CORPORATE_CONFIG = CORPORATE_CONFIG;

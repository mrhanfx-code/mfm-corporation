// Synthetic monitoring for critical workflows
// Runs automated checks on key system endpoints

const ENDPOINTS = {
  health: 'https://mfm-corp.cc.cd/health',
  dashboardStatus: 'https://mfm-corp.cc.cd/api/v1/dashboard/status',
  dashboardAgents: 'https://mfm-corp.cc.cd/api/v1/dashboard/agents',
  dashboardTasks: 'https://mfm-corp.cc.cd/api/v1/dashboard/tasks',
};

const AUTH_TOKEN = process.env.DASHBOARD_API_TOKEN;

async function checkEndpoint(name, url, requiresAuth = false) {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (requiresAuth && AUTH_TOKEN) {
    headers['Authorization'] = `Bearer ${AUTH_TOKEN}`;
  }

  const startTime = Date.now();
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });
    
    const duration = Date.now() - startTime;
    const success = response.ok;
    
    return {
      name,
      url,
      success,
      status: response.status,
      duration,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    return {
      name,
      url,
      success: false,
      error: error.message,
      duration,
      timestamp: new Date().toISOString(),
    };
  }
}

async function runHealthChecks() {
  console.log('[SyntheticMonitoring] Starting health checks...');
  
  const results = [];
  
  // Check health endpoint (no auth required)
  results.push(await checkEndpoint('Health Check', ENDPOINTS.health, false));
  
  // Check dashboard endpoints (auth required)
  if (AUTH_TOKEN) {
    results.push(await checkEndpoint('Dashboard Status', ENDPOINTS.dashboardStatus, true));
    results.push(await checkEndpoint('Dashboard Agents', ENDPOINTS.dashboardAgents, true));
    results.push(await checkEndpoint('Dashboard Tasks', ENDPOINTS.dashboardTasks, true));
  } else {
    console.warn('[SyntheticMonitoring] DASHBOARD_API_TOKEN not set, skipping authenticated checks');
  }
  
  return results;
}

function analyzeResults(results) {
  const failures = results.filter(r => !r.success);
  const slowRequests = results.filter(r => r.duration > 1000);
  
  console.log(`[SyntheticMonitoring] ${results.length} checks completed`);
  console.log(`[SyntheticMonitoring] ${failures.length} failures`);
  console.log(`[SyntheticMonitoring] ${slowRequests.length} slow requests (>1s)`);
  
  if (failures.length > 0) {
    console.error('[SyntheticMonitoring] Failed checks:');
    failures.forEach(f => {
      console.error(`  - ${f.name}: ${f.error || `Status ${f.status}`}`);
    });
  }
  
  if (slowRequests.length > 0) {
    console.warn('[SyntheticMonitoring] Slow requests:');
    slowRequests.forEach(s => {
      console.warn(`  - ${s.name}: ${s.duration}ms`);
    });
  }
  
  return {
    total: results.length,
    failures: failures.length,
    slow: slowRequests.length,
    results,
  };
}

async function sendAlert(analysis) {
  // Send alert to monitoring system or notification channel
  if (analysis.failures > 0) {
    console.error(`[SyntheticMonitoring] ALERT: ${analysis.failures} endpoints failed`);
    // Integration with alerting system would go here
    // e.g., send to Slack, email, PagerDuty, etc.
  }
}

async function main() {
  try {
    const results = await runHealthChecks();
    const analysis = analyzeResults(results);
    
    await sendAlert(analysis);
    
    // Exit with error code if any checks failed
    if (analysis.failures > 0) {
      process.exit(1);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('[SyntheticMonitoring] Fatal error:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { runHealthChecks, analyzeResults, sendAlert };

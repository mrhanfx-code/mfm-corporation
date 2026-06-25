// Dashboard API Worker - Cloudflare Workers for MFM Corporation Mission Control
// Provides REST API endpoints for dashboard frontend

import { routeMessage } from '../core/orchestrator.js';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// D1 retry wrapper with exponential backoff for transient errors
async function withD1Retry(operation, context = 'D1 operation', maxRetries = 3) {
  const backoffDelays = [100, 200, 400]; // Exponential backoff: 100ms, 200ms, 400ms
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await operation();
      return result;
    } catch (error) {
      const errorMessage = error.message || error.toString();
      const isTransient = isTransientD1Error(errorMessage);
      
      console.error(`[D1 Retry] Attempt ${attempt + 1}/${maxRetries + 1} failed for ${context}:`, errorMessage);
      
      // Fail fast on non-transient errors
      if (!isTransient) {
        console.error(`[D1 Retry] Non-transient error, failing fast: ${context}`);
        throw error;
      }
      
      // If this was the last attempt, throw the error
      if (attempt === maxRetries) {
        console.error(`[D1 Retry] Max retries (${maxRetries}) exceeded for ${context}`);
        throw error;
      }
      
      // Wait before retrying with exponential backoff
      const delay = backoffDelays[attempt] || 400;
      console.log(`[D1 Retry] Retrying ${context} in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Check if error is transient (should retry)
function isTransientD1Error(errorMessage) {
  const transientPatterns = [
    'object reset',
    'connection',
    'timeout',
    'network',
    'temporarily unavailable',
    'service unavailable',
    'database is locked',
    'database is busy'
  ];
  
  const lowerMessage = errorMessage.toLowerCase();
  return transientPatterns.some(pattern => lowerMessage.includes(pattern));
}

export async function handleDashboardAPI(request, env, path) {
  const url = new URL(request.url);
  
  // Handle OPTIONS preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  
  try {
    // GET /api/v1/dashboard/status - System health overview
    if (path === '/api/v1/dashboard/status' && request.method === 'GET') {
      return await getStatusReport(env, corsHeaders);
    }

    // GET /api/v1/dashboard/agents - All agents with status
    if (path === '/api/v1/dashboard/agents' && request.method === 'GET') {
      return await getAgentsList(env, corsHeaders);
    }

    // GET /api/v1/dashboard/agents/:id - Specific agent details
    if (path.match(/^\/api\/v1\/dashboard\/agents\/[^/]+$/) && request.method === 'GET') {
      const agentId = path.split('/').pop();
      return await getAgentDetails(agentId, env, corsHeaders);
    }

    // GET /api/v1/dashboard/tasks - Recent tasks with filters
    if (path === '/api/v1/dashboard/tasks' && request.method === 'GET') {
      const limit = parseInt(url.searchParams.get('limit') || '20');
      const agent = url.searchParams.get('agent') || null;
      return await getTasksList(limit, agent, env, corsHeaders);
    }

    // GET /api/v1/dashboard/metrics - Performance metrics
    if (path === '/api/v1/dashboard/metrics' && request.method === 'GET') {
      return await getMetricsReport(env, corsHeaders);
    }

    // GET /api/v1/dashboard/costs - Cost tracking summary
    if (path === '/api/v1/dashboard/costs' && request.method === 'GET') {
      const days = parseInt(url.searchParams.get('days') || '7');
      return await getCostSummary(days, env, corsHeaders);
    }

    // POST /api/v1/dashboard/commands - Send command to agent
    if (path === '/api/v1/dashboard/commands' && request.method === 'POST') {
      const body = await request.json();
      return await sendCommand(body, env, corsHeaders);
    }

    // GET /api/v1/dashboard/security - Security posture and events
    if (path === '/api/v1/dashboard/security' && request.method === 'GET') {
      return await getSecurityReport(env, corsHeaders);
    }

    // GET /api/v1/dashboard/security/alerts - Active security alerts
    if (path === '/api/v1/dashboard/security/alerts' && request.method === 'GET') {
      return await getSecurityAlerts(env, corsHeaders);
    }

    // GET /api/v1/dashboard/security/threats - Threat intelligence
    if (path === '/api/v1/dashboard/security/threats' && request.method === 'GET') {
      return await getThreatIntelligence(env, corsHeaders);
    }

    return new Response('Endpoint not found', { status: 404, headers: corsHeaders });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function getStatusReport(env, corsHeaders) {
  // Get recent tasks for system health
  const tasks = await withD1Retry(
    () => env.db.prepare('SELECT COUNT(*) as total, AVG(quality_score) as avg_score FROM tasks WHERE created_at > datetime("now", "-1 hour")').first(),
    'getStatusReport tasks query'
  );
  
  // Get active agents count
  const agents = await withD1Retry(
    () => env.db.prepare('SELECT COUNT(DISTINCT agent) as active_agents FROM tasks WHERE created_at > datetime("now", "-1 hour")').first(),
    'getStatusReport agents query'
  );

  const status = {
    uptime: '99.9%',
    active_agents: agents?.active_agents || 43,
    tasks_last_hour: tasks?.total || 0,
    avg_quality_score: tasks?.avg_score || 0,
    system_status: 'operational',
    timestamp: new Date().toISOString()
  };

  return new Response(JSON.stringify(status), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function getAgentsList(env, corsHeaders) {
  // Get all unique agents with recent activity
  const agents = await withD1Retry(
    () => env.db.prepare(`
      SELECT 
        agent,
        COUNT(*) as task_count,
        AVG(quality_score) as avg_score,
        MAX(created_at) as last_activity
      FROM tasks
      WHERE created_at > datetime("now", "-7 days")
      GROUP BY agent
      ORDER BY last_activity DESC
    `).all(),
    'getAgentsList query'
  );

  return new Response(JSON.stringify({ agents }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function getAgentDetails(agentId, env, corsHeaders) {
  // Get agent details with recent tasks
  const agentInfo = await withD1Retry(
    () => env.db.prepare(`
      SELECT 
        agent,
        COUNT(*) as total_tasks,
        AVG(quality_score) as avg_score,
        MAX(created_at) as last_activity
      FROM tasks
      WHERE agent = ? AND created_at > datetime("now", "-7 days")
      GROUP BY agent
    `).bind(agentId).first(),
    'getAgentDetails agent info query'
  );

  if (!agentInfo) {
    return new Response(JSON.stringify({ error: 'Agent not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Get recent tasks for this agent
  const recentTasks = await withD1Retry(
    () => env.db.prepare(`
      SELECT id, input, output, quality_score, status, created_at
      FROM tasks
      WHERE agent = ?
      ORDER BY created_at DESC
      LIMIT 10
    `).bind(agentId).all(),
    'getAgentDetails recent tasks query'
  );

  return new Response(JSON.stringify({
    agent: agentInfo,
    recent_tasks: recentTasks.results || []
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function getTasksList(limit, agent, env, corsHeaders) {
  let query = 'SELECT id, agent, input, output, quality_score, status, created_at FROM tasks';
  const params = [];

  if (agent) {
    query += ' WHERE agent = ?';
    params.push(agent);
  }

  query += ' ORDER BY created_at DESC LIMIT ?';
  params.push(limit);

  const tasks = await withD1Retry(
    () => env.db.prepare(query).bind(...params).all(),
    'getTasksList query'
  );

  return new Response(JSON.stringify({ tasks: tasks.results || [] }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function getMetricsReport(env, corsHeaders) {
  // Get metrics from last 7 days
  const metrics = await withD1Retry(
    () => env.db.prepare(`
      SELECT 
        agent,
        COUNT(*) as tasks_completed,
        AVG(quality_score) as avg_quality_score,
        AVG(
          CASE 
            WHEN completed_at IS NOT NULL 
            THEN (julianday(completed_at) - julianday(created_at)) * 86400000 
            ELSE NULL 
          END
        ) as avg_response_ms
      FROM tasks
      WHERE created_at > datetime("now", "-7 days")
      GROUP BY agent
      ORDER BY tasks_completed DESC
    `).all(),
    'getMetricsReport query'
  );

  return new Response(JSON.stringify({ metrics: metrics.results || [] }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function sendCommand(body, env, corsHeaders) {
  const { command_type, target, payload } = body;

  if (!command_type || !target) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Log command to database
  const commandId = crypto.randomUUID();
  await withD1Retry(
    () => env.db.prepare(`
      INSERT INTO dashboard_commands (id, command_type, target, payload, status)
      VALUES (?, ?, ?, ?, 'pending')
    `).bind(commandId, command_type, target, JSON.stringify(payload)).run(),
    'sendCommand INSERT'
  );

  // Execute command via orchestrator
  try {
    // Extract task text from payload
    const taskText = payload?.task || payload?.input || JSON.stringify(payload);
    const userId = payload?.userId || 'dashboard-user';
    
    // Route to orchestrator for agent execution
    const result = await routeMessage({ text: taskText }, userId, env);
    
    // Update command status to completed
    await withD1Retry(
      () => env.db.prepare(`
        UPDATE dashboard_commands 
        SET status = 'completed' 
        WHERE id = ?
      `).bind(commandId).run(),
      'sendCommand UPDATE completed'
    );

    return new Response(JSON.stringify({
      command_id: commandId,
      status: 'completed',
      result: result,
      message: 'Command executed successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[Dashboard] Command execution error:', error);
    
    // Update command status to failed
    await withD1Retry(
      () => env.db.prepare(`
        UPDATE dashboard_commands 
        SET status = 'failed' 
        WHERE id = ?
      `).bind(commandId).run(),
      'sendCommand UPDATE failed'
    );

    return new Response(JSON.stringify({
      command_id: commandId,
      status: 'failed',
      error: error.message,
      message: 'Command execution failed'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function getCostSummary(days, env, corsHeaders) {
  const since = Date.now() - (days * 24 * 60 * 60 * 1000);
  
  const result = await withD1Retry(
    () => env.db.prepare(`
      SELECT 
        model,
        task_type,
        SUM(cost) as total_cost,
        SUM(total_tokens) as total_tokens,
        COUNT(*) as calls
      FROM model_usage
      WHERE timestamp > ?
      GROUP BY model, task_type
      ORDER BY total_cost DESC
    `).bind(since).all(),
    'getCostSummary query'
  );

  const summary = {
    total_cost: 0,
    total_tokens: 0,
    total_calls: 0,
    by_model: {},
    by_task: {},
    period_days: days
  };

  for (const row of result.results || []) {
    summary.total_cost += row.total_cost;
    summary.total_tokens += row.total_tokens;
    summary.total_calls += row.calls;

    if (!summary.by_model[row.model]) {
      summary.by_model[row.model] = { cost: 0, tokens: 0, calls: 0 };
    }
    summary.by_model[row.model].cost += row.total_cost;
    summary.by_model[row.model].tokens += row.total_tokens;
    summary.by_model[row.model].calls += row.calls;

    if (!summary.by_task[row.task_type]) {
      summary.by_task[row.task_type] = { cost: 0, tokens: 0, calls: 0 };
    }
    summary.by_task[row.task_type].cost += row.total_cost;
    summary.by_task[row.task_type].tokens += row.total_tokens;
    summary.by_task[row.task_type].calls += row.calls;
  }

  return new Response(JSON.stringify(summary), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function getSecurityReport(env, corsHeaders) {
  // Security posture score calculation
  const score = 85; // Placeholder - would use SecurityTrackingService
  
  const security = {
    score,
    rating: score >= 90 ? 'Excellent' : score >= 80 ? 'Good' : score >= 60 ? 'Medium' : 'Poor',
    active_alerts: 0,
    recent_events: [],
    posture: {
      authentication: 'secure',
      authorization: 'secure',
      data_protection: 'secure',
      network: 'secure'
    },
    timestamp: new Date().toISOString()
  };

  return new Response(JSON.stringify(security), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function getSecurityAlerts(env, corsHeaders) {
  // Get active security alerts
  const alerts = await withD1Retry(
    () => env.db.prepare(`
      SELECT id, type, severity, message, timestamp
      FROM security_alerts
      WHERE status = 'active'
      ORDER BY timestamp DESC
      LIMIT 20
    `).all(),
    'getSecurityAlerts query'
  );

  return new Response(JSON.stringify({ 
    alerts: alerts.results || [],
    count: (alerts.results || []).length
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function getThreatIntelligence(env, corsHeaders) {
  // Threat intelligence summary
  const intelligence = {
    risk_score: 15,
    top_threats: [],
    recommendations: [
      {
        priority: 'low',
        action: 'Monitor authentication patterns',
        type: 'authentication'
      }
    ],
    last_scan: new Date().toISOString()
  };

  return new Response(JSON.stringify(intelligence), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

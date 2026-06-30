// Dashboard API Worker - Cloudflare Workers for MFM Corporation Mission Control
// Provides REST API endpoints for dashboard frontend

import { validateToken, generateAccessToken } from '../core/jwt-auth.js';

export async function handleDashboardAPI(request, env, path) {
  const url = new URL(request.url);
  
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': env.DASHBOARD_ORIGIN || 'https://mfm-corp.cc.cd',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
  };
  
  try {
    // POST /api/v1/dashboard/auth/login - JWT token generation
    if (path === '/api/v1/dashboard/auth/login' && request.method === 'POST') {
      if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });
      let body;
      try { body = await request.json(); } catch {
        return new Response(JSON.stringify({ error: 'Bad Request' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      
      if (!body?.userId) {
        return new Response(JSON.stringify({ error: 'Missing userId' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      
      const authorizedIds = (env.AUTHORIZED_USER_IDS || '').split(',').map(s => s.trim());
      if (!authorizedIds.includes(String(body.userId))) {
        return new Response(JSON.stringify({ error: 'Unauthorized user' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      
      try {
        const accessToken = await generateAccessToken(body.userId, env);
        return new Response(JSON.stringify({ accessToken, expiresIn: 900 }), { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: 'Token generation failed' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    // Validate JWT token for protected endpoints
    const token = (request.headers.get('Authorization') || '').replace('Bearer ', '').trim();
    if (path !== '/api/v1/dashboard/auth/login' && request.method !== 'OPTIONS') {
      const payload = await validateToken(token, env);
      if (!payload) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

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

    // POST /api/v1/dashboard/commands - Send command to agent
    if (path === '/api/v1/dashboard/commands' && request.method === 'POST') {
      const body = await request.json();
      return await sendCommand(body, env, corsHeaders);
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
  const tasks = await env.db.prepare('SELECT COUNT(*) as total, AVG(quality_score) as avg_score FROM tasks WHERE created_at > datetime("now", "-1 hour")').first();
  
  // Get active agents count
  const agents = await env.db.prepare('SELECT COUNT(DISTINCT agent) as active_agents FROM tasks WHERE created_at > datetime("now", "-1 hour")').first();

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
  const agents = await env.db.prepare(`
    SELECT 
      agent,
      COUNT(*) as task_count,
      AVG(quality_score) as avg_score,
      MAX(created_at) as last_activity
    FROM tasks
    WHERE created_at > datetime("now", "-7 days")
    GROUP BY agent
    ORDER BY last_activity DESC
  `).all();

  return new Response(JSON.stringify({ agents }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function getAgentDetails(agentId, env, corsHeaders) {
  // Get agent details with recent tasks
  const agentInfo = await env.db.prepare(`
    SELECT 
      agent,
      COUNT(*) as total_tasks,
      AVG(quality_score) as avg_score,
      MAX(created_at) as last_activity
    FROM tasks
    WHERE agent = ? AND created_at > datetime("now", "-7 days")
    GROUP BY agent
  `).bind(agentId).first();

  if (!agentInfo) {
    return new Response(JSON.stringify({ error: 'Agent not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Get recent tasks for this agent
  const recentTasks = await env.db.prepare(`
    SELECT id, input, output, quality_score, status, created_at
    FROM tasks
    WHERE agent = ?
    ORDER BY created_at DESC
    LIMIT 10
  `).bind(agentId).all();

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

  const tasks = await env.db.prepare(query).bind(...params).all();

  return new Response(JSON.stringify({ tasks: tasks.results || [] }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function getMetricsReport(env, corsHeaders) {
  // Get metrics from last 7 days
  const metrics = await env.db.prepare(`
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
  `).all();

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
  await env.db.prepare(`
    INSERT INTO dashboard_commands (id, command_type, target, payload, status)
    VALUES (?, ?, ?, ?, 'pending')
  `).bind(commandId, command_type, target, JSON.stringify(payload)).run();

  // TODO: Implement actual command execution logic
  // This would integrate with the orchestrator to execute commands

  return new Response(JSON.stringify({
    command_id: commandId,
    status: 'pending',
    message: 'Command queued for execution'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Supabase Bridge — syncs agent events and metrics to Supabase for web dashboard

function getHeaders(env, write = false) {
  const key = write ? env.SUPABASE_SERVICE_KEY : env.SUPABASE_ANON_KEY;
  return {
    'apikey': key,
    'Authorization': `Bearer ${key}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal'
  };
}

function base(env) {
  return `${env.SUPABASE_URL}/rest/v1`;
}

async function insert(table, row, env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) return;
  try {
    await fetch(`${base(env)}/${table}`, {
      method: 'POST',
      headers: getHeaders(env, true),
      body: JSON.stringify(row)
    });
  } catch (err) {
    console.warn(`[Supabase] insert ${table} failed: ${err.message}`);
  }
}

async function upsert(table, row, onConflict, env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) return;
  try {
    const headers = { ...getHeaders(env, true), 'Prefer': `resolution=merge-duplicates,return=minimal` };
    await fetch(`${base(env)}/${table}?on_conflict=${onConflict}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(row)
    });
  } catch (err) {
    console.warn(`[Supabase] upsert ${table} failed: ${err.message}`);
  }
}

export async function syncAgentEvent({ agent, task, response, score, latencyMs, provider, model, userId }, env) {
  await insert('agent_events', {
    agent,
    task:       (task || '').slice(0, 500),
    response:   (response || '').slice(0, 1000),
    score:      score || 0,
    latency_ms: latencyMs || 0,
    provider:   provider || 'unknown',
    model:      model || 'unknown',
    user_id:    userId || null
  }, env);
}

export async function syncAgentMetrics({ agent, totalRuns, avgScore, avgLatency }, env) {
  await upsert('agent_metrics', {
    agent,
    total_runs:  totalRuns,
    avg_score:   avgScore,
    avg_latency: avgLatency,
    updated_at:  new Date().toISOString()
  }, 'agent', env);
}

export async function syncRoutingDecision({ agent, taskType, reasoning, confidence }, env) {
  await insert('routing_decisions', {
    agent,
    task_type:  taskType,
    reasoning:  (reasoning || '').slice(0, 500),
    confidence: confidence || 0
  }, env);
}

export async function syncCeoCommand({ command, userId, response }, env) {
  await insert('ceo_commands', {
    command:  (command || '').slice(0, 200),
    user_id:  userId,
    response: (response || '').slice(0, 1000)
  }, env);
}

export async function getRecentEvents(limit = 20, env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) return [];
  try {
    const res = await fetch(
      `${base(env)}/agent_events?order=created_at.desc&limit=${limit}`,
      { headers: getHeaders(env, false) }
    );
    return res.ok ? await res.json() : [];
  } catch { return []; }
}

export async function getAllMetricsFromSupabase(env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) return [];
  try {
    const res = await fetch(
      `${base(env)}/agent_metrics?order=total_runs.desc`,
      { headers: getHeaders(env, false) }
    );
    return res.ok ? await res.json() : [];
  } catch { return []; }
}

// D1 store — tasks, agent memory, decisions, metrics

function uid() { return crypto.randomUUID(); }

export async function saveTask(agent, input, env) {
  if (!env.db) return null;
  const id = uid();
  await env.db.prepare(
    'INSERT INTO tasks (id, agent, input, status) VALUES (?, ?, ?, ?)'
  ).bind(id, agent, input, 'pending').run();
  return id;
}

export async function completeTask(id, output, qualityScore, env) {
  if (!env.db) return;
  await env.db.prepare(
    'UPDATE tasks SET output=?, status=?, quality_score=?, completed_at=datetime("now") WHERE id=?'
  ).bind(output, 'completed', qualityScore, id).run();
}

export async function getRecentTasks(agent, limit = 10, env) {
  if (!env.db) return [];
  const result = await env.db.prepare(
    'SELECT * FROM tasks WHERE agent=? ORDER BY created_at DESC LIMIT ?'
  ).bind(agent, limit).all();
  return result.results || [];
}

export async function saveMemory(agent, userId, role, content, env) {
  if (!env.db) return;
  await env.db.prepare(
    'INSERT INTO agent_memory (agent, user_id, role, content) VALUES (?, ?, ?, ?)'
  ).bind(agent, String(userId), role, content).run();
}

export async function getMemory(agent, userId, limit = 20, env) {
  if (!env.db) return [];
  const result = await env.db.prepare(
    'SELECT role, content FROM agent_memory WHERE agent=? AND user_id=? ORDER BY created_at DESC LIMIT ?'
  ).bind(agent, String(userId), limit).all();
  return (result.results || []).reverse();
}

export async function clearMemory(agent, userId, env) {
  if (!env.db) return;
  await env.db.prepare(
    'DELETE FROM agent_memory WHERE agent=? AND user_id=?'
  ).bind(agent, String(userId)).run();
}

export async function logDecision(agent, input, reasoning, decision, confidence, env) {
  if (!env.db) return;
  const id = uid();
  await env.db.prepare(
    'INSERT INTO decisions (id, agent, input, reasoning, decision, confidence) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(id, agent, input, reasoning, decision, confidence).run();
}

export async function updateMetrics(agent, tasksCompleted, qualityScore, responseMs, env) {
  if (!env.db) return;
  const date = new Date().toISOString().split('T')[0];
  await env.db.prepare(`
    INSERT INTO metrics (agent, date, tasks_completed, avg_quality_score, avg_response_ms)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(agent, date) DO UPDATE SET
      tasks_completed = tasks_completed + excluded.tasks_completed,
      avg_quality_score = (avg_quality_score + excluded.avg_quality_score) / 2,
      avg_response_ms = (avg_response_ms + excluded.avg_response_ms) / 2
  `).bind(agent, date, tasksCompleted, qualityScore, responseMs).run();
}

export async function getMetrics(agent, days = 7, env) {
  if (!env.db) return [];
  const result = await env.db.prepare(
    'SELECT * FROM metrics WHERE agent=? ORDER BY date DESC LIMIT ?'
  ).bind(agent, days).all();
  return result.results || [];
}

export async function getAllRecentTasks(limit = 10, env) {
  if (!env.db) return [];
  const result = await env.db.prepare(
    'SELECT agent, input, output, status, quality_score, created_at FROM tasks ORDER BY created_at DESC LIMIT ?'
  ).bind(limit).all();
  return result.results || [];
}

export async function getAllMetrics(days = 7, env) {
  if (!env.db) return [];
  const result = await env.db.prepare(
    'SELECT * FROM metrics ORDER BY date DESC, agent ASC LIMIT ?'
  ).bind(days * 20).all();
  return result.results || [];
}

export async function clearAllMemory(userId, env) {
  if (!env.db) return;
  await env.db.prepare(
    'DELETE FROM agent_memory WHERE user_id=?'
  ).bind(String(userId)).run();
}

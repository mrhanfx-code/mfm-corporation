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

export async function updateTaskScore(id, score, env) {
  if (!env.db || !id) return;
  await env.db.prepare(
    'UPDATE tasks SET quality_score=? WHERE id=?'
  ).bind(score, id).run();
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
  // Prune to last 100 entries per agent/user to prevent unbounded growth
  await env.db.prepare(`
    DELETE FROM agent_memory
    WHERE agent=? AND user_id=?
    AND id NOT IN (
      SELECT id FROM agent_memory
      WHERE agent=? AND user_id=?
      ORDER BY created_at DESC LIMIT 100
    )
  `).bind(agent, String(userId), agent, String(userId)).run();
}

export async function getMemory(agent, userId, limit = 20, env) {
  if (!env.db) return [];
  const result = await env.db.prepare(
    'SELECT role, content FROM agent_memory WHERE agent=? AND user_id=? ORDER BY created_at DESC, id DESC LIMIT ?'
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
      avg_quality_score = CAST(
        (avg_quality_score * tasks_completed + excluded.avg_quality_score * excluded.tasks_completed)
        / NULLIF(tasks_completed + excluded.tasks_completed, 0) AS REAL),
      avg_response_ms = CAST(
        (avg_response_ms * tasks_completed + excluded.avg_response_ms * excluded.tasks_completed)
        / NULLIF(tasks_completed + excluded.tasks_completed, 0) AS INTEGER)
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
  ).bind(days * 30).all();
  return result.results || [];
}

export async function getTaskById(id, env) {
  if (!env.db) return null;
  const result = await env.db.prepare(
    'SELECT * FROM tasks WHERE id = ?'
  ).bind(id).first();
  return result || null;
}

export async function clearAllMemory(userId, env) {
  if (!env.db) return;
  await env.db.prepare(
    'DELETE FROM agent_memory WHERE user_id=?'
  ).bind(String(userId)).run();
}

export async function updateRoutingScore(agent, qualityScore, env) {
  if (!env.db) return;
  const existing = await env.db.prepare(
    'SELECT total_reviews, avg_score FROM routing_scores WHERE agent = ?'
  ).bind(agent).first();
  const reviews = (existing?.total_reviews || 0) + 1;
  const newAvg = existing
    ? Math.round(((existing.avg_score * existing.total_reviews) + qualityScore) / reviews)
    : qualityScore;
  await env.db.prepare(`
    INSERT INTO routing_scores (agent, total_reviews, avg_score, updated_at)
    VALUES (?, ?, ?, datetime('now'))
    ON CONFLICT(agent) DO UPDATE SET
      total_reviews = excluded.total_reviews,
      avg_score = excluded.avg_score,
      updated_at = excluded.updated_at
  `).bind(agent, reviews, newAvg).run();
}

export async function transitionTask(id, newStatus, env, extra = {}) {
  if (!env.db) return;
  const validStatuses = ['pending','analyzing','drafting','reviewing','approved','rejected','executing','completed','failed'];
  if (!validStatuses.includes(newStatus)) throw new Error(`Invalid task status: ${newStatus}`);
  const fields = ['status = ?'];
  const binds  = [newStatus];
  if (extra.output !== undefined)       { fields.push('output = ?');        binds.push(extra.output); }
  if (extra.quality_score !== undefined){ fields.push('quality_score = ?'); binds.push(extra.quality_score); }
  if (extra.hitl_required !== undefined){ fields.push('hitl_required = ?'); binds.push(extra.hitl_required ? 1 : 0); }
  if (['completed','failed','rejected'].includes(newStatus)) fields.push('completed_at = datetime(\'now\')');
  binds.push(id);
  await env.db.prepare(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`).bind(...binds).run();
}

export async function transitionTaskState(id, newState, env, extra = {}) {
  if (!env.db) return;
  const validStates = ['pending','analyzing','drafting','reviewing','approved','rejected','executing','completed','failed'];
  if (!validStates.includes(newState)) throw new Error(`Invalid task state: ${newState}`);
  
  const task = await getTaskById(id, env);
  if (!task) throw new Error(`Task not found: ${id}`);
  
  const currentHistory = JSON.parse(task.state_history || '[]');
  currentHistory.push({
    from: task.state || 'pending',
    to: newState,
    at: new Date().toISOString()
  });
  
  const fields = ['state = ?', 'state_history = ?'];
  const binds  = [newState, JSON.stringify(currentHistory)];
  if (extra.content_type !== undefined) { fields.push('content_type = ?'); binds.push(extra.content_type); }
  binds.push(id);
  await env.db.prepare(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`).bind(...binds).run();
}

export async function setTaskContentType(id, contentType, env) {
  if (!env.db) return;
  const validTypes = ['general','video','social_publish','email'];
  if (!validTypes.includes(contentType)) throw new Error(`Invalid content type: ${contentType}`);
  await env.db.prepare(
    'UPDATE tasks SET content_type = ? WHERE id = ?'
  ).bind(contentType, id).run();
}

export async function getTopPerformingAgents(limit = 5, env) {
  if (!env.db) return [];
  const result = await env.db.prepare(`
    SELECT agent,
           SUM(tasks_completed) AS total_tasks,
           CAST(SUM(avg_quality_score * tasks_completed) / NULLIF(SUM(tasks_completed), 0) AS REAL) AS avg_score
    FROM metrics
    WHERE date >= date('now', '-7 days')
    GROUP BY agent
    HAVING total_tasks > 0
    ORDER BY avg_score DESC
    LIMIT ?
  `).bind(limit).all();
  return result.results || [];
}

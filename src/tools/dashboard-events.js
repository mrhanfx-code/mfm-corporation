// Dashboard Events - Emit events to Mission Control dashboard
// Integrates with WebSocket Durable Object for real-time updates

export async function emitDashboardEvent(env, eventType, data) {
  try {
    // Log event to database for persistence
    await env.db.prepare(`
      INSERT INTO dashboard_events (event_type, payload)
      VALUES (?, ?)
    `).bind(eventType, JSON.stringify(data)).run();

    // If Durable Object is available, broadcast to connected clients
    // This would be called via the Durable Object's broadcast methods
    // For now, we log to database and the dashboard polls for updates
    console.log(`[Dashboard Event] ${eventType}:`, data);
  } catch (error) {
    console.error('Error emitting dashboard event:', error);
  }
}

export async function emitAgentStatus(env, agent, status, currentTask) {
  await emitDashboardEvent(env, 'agent_status', {
    agent,
    status,
    current_task: currentTask,
    timestamp: new Date().toISOString()
  });
}

export async function emitTaskUpdate(env, taskId, status, score) {
  await emitDashboardEvent(env, 'task_update', {
    task_id: taskId,
    status,
    score,
    timestamp: new Date().toISOString()
  });
}

export async function emitMetricsUpdate(env, agent, metrics) {
  await emitDashboardEvent(env, 'metrics_update', {
    agent,
    ...metrics,
    timestamp: new Date().toISOString()
  });
}

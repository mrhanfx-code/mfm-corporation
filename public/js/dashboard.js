// MFM Corporation — Live Dashboard
// Connects to Supabase for real-time agent data

const SUPABASE_URL  = 'https://ptziszkaeueqyojixghn.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0emlzemthZXVlcXlvaml4Z2huIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1ODYyMzYsImV4cCI6MjA5NDE2MjIzNn0.CL0EVbis6UBw1BaGg61pyORId0RBi00H2rdykl7j1MQ';

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(ts) {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function providerBadge(provider) {
  if (provider === 'cerebras')   return '<span class="badge cerebras">Cerebras</span>';
  if (provider === 'openrouter') return '<span class="badge openrouter">OpenRouter</span>';
  return '<span class="badge unknown">?</span>';
}

function scoreColor(score) {
  if (score >= 85) return '#22c55e';
  if (score >= 70) return '#f59e0b';
  return '#ef4444';
}

// ─── Agent Activity Feed ──────────────────────────────────────────────────────

async function loadEvents() {
  const { data, error } = await sb
    .from('agent_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(25);

  if (error) { console.error('Events error:', error); return; }
  renderEvents(data || []);
}

function renderEvents(events) {
  const feed = document.getElementById('activityFeed');
  if (!events.length) {
    feed.innerHTML = '<div class="empty-state">No agent activity yet. Send a Telegram message to activate agents.</div>';
    return;
  }
  feed.innerHTML = events.map(e => `
    <div class="event-card">
      <div class="event-header">
        <span class="agent-name">${e.agent || '—'}</span>
        ${providerBadge(e.provider)}
        <span class="event-time">${timeAgo(e.created_at)}</span>
      </div>
      <div class="event-task">${(e.task || '').slice(0, 120)}</div>
      <div class="event-footer">
        <span class="score-badge" style="color:${scoreColor(e.score)}">${e.score}/100</span>
        <span class="latency">${e.latency_ms}ms</span>
      </div>
    </div>
  `).join('');
}

// ─── Metrics Panel ────────────────────────────────────────────────────────────

async function loadMetrics() {
  const { data, error } = await sb
    .from('agent_metrics')
    .select('*')
    .order('total_runs', { ascending: false });

  if (error) { console.error('Metrics error:', error); return; }
  renderMetrics(data || []);
  updateSummaryCards(data || []);
}

function renderMetrics(metrics) {
  const table = document.getElementById('metricsTable');
  if (!metrics.length) {
    table.innerHTML = '<div class="empty-state">No metrics yet.</div>';
    return;
  }
  table.innerHTML = `
    <table>
      <thead><tr><th>Agent</th><th>Runs</th><th>Avg Score</th><th>Avg Latency</th></tr></thead>
      <tbody>
        ${metrics.map(m => `
          <tr>
            <td>${m.agent}</td>
            <td>${m.total_runs}</td>
            <td style="color:${scoreColor(m.avg_score)}">${Number(m.avg_score).toFixed(0)}/100</td>
            <td>${m.avg_latency}ms</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function updateSummaryCards(metrics) {
  const totalRuns  = metrics.reduce((s, m) => s + (m.total_runs || 0), 0);
  const activeAgents = metrics.filter(m => m.total_runs > 0).length;
  const avgScore   = metrics.length
    ? (metrics.reduce((s, m) => s + Number(m.avg_score), 0) / metrics.length).toFixed(1)
    : 0;

  document.getElementById('statRuns').textContent    = totalRuns;
  document.getElementById('statAgents').textContent  = `${activeAgents}/18`;
  document.getElementById('statScore').textContent   = `${avgScore}%`;
}

// ─── Routing Decisions ────────────────────────────────────────────────────────

async function loadDecisions() {
  const { data, error } = await sb
    .from('routing_decisions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) { console.error('Decisions error:', error); return; }
  renderDecisions(data || []);
}

function renderDecisions(decisions) {
  const el = document.getElementById('decisionsFeed');
  if (!decisions.length) {
    el.innerHTML = '<div class="empty-state">No routing decisions yet.</div>';
    return;
  }
  el.innerHTML = decisions.map(d => `
    <div class="decision-card">
      <div class="decision-agent">${d.agent}</div>
      <div class="decision-type">${d.task_type || ''}</div>
      <div class="decision-time">${timeAgo(d.created_at)}</div>
    </div>
  `).join('');
}

// ─── Realtime Subscription ────────────────────────────────────────────────────

function subscribeRealtime() {
  sb.channel('agent-live')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'agent_events' }, () => {
      loadEvents();
      loadMetrics();
      document.getElementById('liveIndicator').classList.add('pulse');
      setTimeout(() => document.getElementById('liveIndicator').classList.remove('pulse'), 1000);
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'agent_metrics' }, () => {
      loadMetrics();
    })
    .subscribe(status => {
      const dot = document.getElementById('realtimeDot');
      dot.style.background = status === 'SUBSCRIBED' ? '#22c55e' : '#ef4444';
      document.getElementById('realtimeStatus').textContent =
        status === 'SUBSCRIBED' ? 'Live' : 'Reconnecting…';
    });
}

// ─── Init ─────────────────────────────────────────────────────────────────────

async function init() {
  await Promise.all([loadEvents(), loadMetrics(), loadDecisions()]);
  subscribeRealtime();
  setInterval(() => {
    loadEvents();
    loadDecisions();
  }, 30000);
}

document.addEventListener('DOMContentLoaded', init);

// MFM Corporation — Live Dashboard
// Connects to Supabase for real-time agent data

const WORKER_URL    = 'https://mfm-corporation-telegram-bot.mrhan-fx.workers.dev';
const SUPABASE_URL  = 'https://ptziszkaeueqyojixghn.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0emlzemthZXVlcXlvaml4Z2huIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1ODYyMzYsImV4cCI6MjA5NDE2MjIzNn0.CL0EVbis6UBw1BaGg61pyORId0RBi00H2rdykl7j1MQ';

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getSecret() {
  let s = localStorage.getItem('mfm_secret');
  if (!s) {
    s = prompt('Enter dashboard secret (set via: wrangler secret put DASHBOARD_SECRET):');
    if (s) localStorage.setItem('mfm_secret', s);
  }
  return s || '';
}

let _lastFetch = Date.now();
function markUpdated() { _lastFetch = Date.now(); }
function startTimestampTicker() {
  setInterval(() => {
    const sec = Math.round((Date.now() - _lastFetch) / 1000);
    const el = document.getElementById('lastUpdated');
    if (!el) return;
    el.textContent = sec < 5 ? 'Updated just now' : `Updated ${sec}s ago`;
  }, 1000);
}

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

function rowClass(score) {
  if (score >= 85) return 'row-high';
  if (score >= 70) return 'row-mid';
  return 'row-low';
}

function scoreBar(score) {
  const pct = Math.min(100, Math.max(0, Number(score) || 0));
  return `<div class="score-cell">
    <div class="score-bar-bg"><div class="score-bar-fill" style="width:${pct}%;background:${scoreColor(pct)}"></div></div>
    <span style="color:${scoreColor(pct)}">${pct.toFixed(0)}/100</span>
  </div>`;
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
          <tr class="${rowClass(m.avg_score)}">
            <td>${m.agent}</td>
            <td>${m.total_runs}</td>
            <td>${scoreBar(m.avg_score)}</td>
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

// ─── Command Panel & Voice ────────────────────────────────────────────────────

let recognition = null;
let isRecording = false;

function openCmdPanel() {
  document.getElementById('cmdPanel').classList.add('open');
  document.getElementById('cmdInput').focus();
}

function closeCmdPanel() {
  document.getElementById('cmdPanel').classList.remove('open');
  stopVoice();
}

function setCmdStatus(msg) {
  document.getElementById('cmdStatus').textContent = msg;
}

function showCmdResponse(text) {
  const el = document.getElementById('cmdResponse');
  el.textContent = text;
  el.style.display = 'block';
}

async function sendCommand(text) {
  if (!text.trim()) return;
  const secret = getSecret();
  if (!secret) { setCmdStatus('No secret set.'); return; }

  const sendBtn = document.getElementById('cmdSendBtn');
  sendBtn.classList.add('sending');
  setCmdStatus('Routing to agents…');
  document.getElementById('cmdResponse').style.display = 'none';

  try {
    const res = await fetch(`${WORKER_URL}/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${secret}` },
      body: JSON.stringify({ text })
    });
    if (res.status === 401) {
      localStorage.removeItem('mfm_secret');
      setCmdStatus('Wrong secret — cleared. Refresh to re-enter.');
      return;
    }
    const data = await res.json();
    setCmdStatus('');
    showCmdResponse(data.response || '(no response)');
    document.getElementById('cmdInput').value = '';
  } catch (err) {
    setCmdStatus(`Error: ${err.message}`);
  } finally {
    sendBtn.classList.remove('sending');
  }
}

function startVoice() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    setCmdStatus('Voice not supported in this browser. Use Chrome or Edge.');
    return;
  }
  if (isRecording) { stopVoice(); return; }

  recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.interimResults = true;
  recognition.continuous = false;

  recognition.onstart = () => {
    isRecording = true;
    setCmdStatus('🎤 Listening…');
    document.getElementById('cmdMicBtn').classList.add('recording');
    document.getElementById('micHeaderBtn').classList.add('recording');
  };

  recognition.onresult = (e) => {
    const transcript = Array.from(e.results).map(r => r[0].transcript).join('');
    document.getElementById('cmdInput').value = transcript;
    if (e.results[e.results.length - 1].isFinal) {
      setCmdStatus('Got it — sending…');
      sendCommand(transcript);
    }
  };

  recognition.onerror = (e) => { setCmdStatus(`Voice error: ${e.error}`); stopVoice(); };
  recognition.onend = () => stopVoice();
  recognition.start();
}

function stopVoice() {
  isRecording = false;
  document.getElementById('cmdMicBtn')?.classList.remove('recording');
  document.getElementById('micHeaderBtn')?.classList.remove('recording');
  if (recognition) { try { recognition.stop(); } catch {} recognition = null; }
}

function initCommandPanel() {
  document.getElementById('micHeaderBtn').addEventListener('click', () => {
    const panel = document.getElementById('cmdPanel');
    if (panel.classList.contains('open')) { closeCmdPanel(); } else { openCmdPanel(); }
  });
  document.getElementById('cmdCloseBtn').addEventListener('click', closeCmdPanel);
  document.getElementById('cmdMicBtn').addEventListener('click', startVoice);
  document.getElementById('cmdSendBtn').addEventListener('click', () => {
    sendCommand(document.getElementById('cmdInput').value);
  });
  document.getElementById('cmdInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendCommand(document.getElementById('cmdInput').value);
    if (e.key === 'Escape') closeCmdPanel();
  });
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); openCmdPanel(); }
  });
}

// ─── Init ─────────────────────────────────────────────────────────────────────

async function init() {
  await Promise.all([loadEvents(), loadMetrics(), loadDecisions()]);
  markUpdated();
  subscribeRealtime();
  startTimestampTicker();
  initCommandPanel();
  setInterval(() => {
    loadEvents();
    loadDecisions();
    markUpdated();
  }, 30000);
}

document.addEventListener('DOMContentLoaded', init);

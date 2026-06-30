import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './Sidebar';
import { AgentCard } from './AgentCard';
import { TelemetryTable } from './TelemetryTable';
import { ControlModal } from './ControlModal';
import { ChatWindow } from './ChatWindow';
import { LogsModal } from './LogsModal';
import { SettingsPanel } from './SettingsPanel';
import { CostTracking } from './CostTracking';
import { MemoryManagement } from './MemoryManagement';

interface Agent {
  id: string;
  name: string;
  team: string;
  status: 'running' | 'idle' | 'error';
  load: number;
}

interface LogEntry {
  time: string;
  id: string;
  op: string;
  status: 'SUCCESS' | 'FAILED' | 'IDLE';
  lat: string;
}

const WORKER_URL = 'https://mfm-corporation-telegram-bot.mrhan-fx.workers.dev';

const FALLBACK_AGENTS: Agent[] = [
  { id: 'MK-084', name: 'Brand Sentiment Analyst', team: 'Marketing', status: 'running', load: 84 },
  { id: 'ENG-112', name: 'Refactoring Specialist', team: 'Engineering', status: 'running', load: 42 },
  { id: 'CS-004', name: 'Escalation Resolver', team: 'Success', status: 'idle', load: 0 },
  { id: 'DATA-22', name: 'Anomalous Log Detector', team: 'Data', status: 'running', load: 95 },
  { id: 'EXE-01', name: 'Strategic KPI Forecaster', team: 'Strategy', status: 'running', load: 12 },
  { id: 'MK-102', name: 'Ad Copy Generator', team: 'Marketing', status: 'error', load: 0 },
  { id: 'ENG-204', name: 'Unit Test Scripter', team: 'Engineering', status: 'running', load: 66 },
  { id: 'DATA-09', name: 'ETL Pipeline Guard', team: 'Data', status: 'idle', load: 0 }
];

const FALLBACK_LOGS: LogEntry[] = [
  { time: '14:22:01.04', id: 'ENG-112', op: 'code_optimization', status: 'SUCCESS', lat: '124ms' },
  { time: '14:21:58.92', id: 'MK-084', op: 'social_sentiment_scrape', status: 'SUCCESS', lat: '842ms' },
  { time: '14:21:55.10', id: 'MK-102', op: 'creative_generation', status: 'FAILED', lat: '20ms' },
  { time: '14:21:48.33', id: 'DATA-22', op: 'log_ingestion_audit', status: 'SUCCESS', lat: '12ms' },
  { time: '14:21:40.01', id: 'CS-004', op: 'wait_for_trigger', status: 'IDLE', lat: '--' }
];

function agentNameToTeam(name: string): string {
  const n = name.toLowerCase();
  if (/social|media|market|brand|content|creative|ads|campaign/.test(n)) return 'Marketing';
  if (/engineer|frontend|backend|develop|code|tech|build|test|refactor/.test(n)) return 'Engineering';
  if (/customer|support|success|service|escalat/.test(n)) return 'Success';
  if (/data|analyt|etl|pipeline|log|ingest/.test(n)) return 'Data';
  if (/strateg|execut|kpi|cfo|cto|cmo|coo|cino|forecast/.test(n)) return 'Strategy';
  return 'General';
}

function mapApiAgents(raw: { agent: string; task_count: number; avg_score: number; last_activity: string }[]): Agent[] {
  return raw.map((a, i) => {
    const minsSinceActive = (Date.now() - new Date(a.last_activity).getTime()) / 60000;
    const status: Agent['status'] = minsSinceActive < 5 ? 'running' : 'idle';
    const team = agentNameToTeam(a.agent);
    const prettyName = a.agent.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    return {
      id: `${team.slice(0, 3).toUpperCase()}-${String(i + 1).padStart(3, '0')}`,
      name: prettyName,
      team,
      status,
      load: Math.min(Math.round((a.task_count || 0) * 8), 98),
    };
  });
}

interface SystemStatus {
  uptime: string;
  active_agents: number;
  tasks_last_hour: number;
  system_status: string;
}

async function verifySecret(secret: string): Promise<boolean> {
  try {
    const r = await fetch(`${WORKER_URL}/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${secret}` },
      body: JSON.stringify({ text: 'ping' }),
    });
    return r.status !== 401 && r.status !== 403;
  } catch { return false; }
}

function LoginGate({ onAuth }: { onAuth: () => void }) {
  const [secret, setSecret] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!secret.trim()) return;
    setLoading(true); setError('');
    const ok = await verifySecret(secret.trim());
    if (ok) { localStorage.setItem('mfm_secret', secret.trim()); onAuth(); }
    else { setError('Incorrect secret. Try again.'); }
    setLoading(false);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0a0f1e', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '1rem', padding: '2.5rem 2rem', width: '100%', maxWidth: 380, textAlign: 'center' }}>
        <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f3f4f6', marginBottom: '.25rem' }}>MFM <span style={{ color: '#6366f1' }}>Corp</span></div>
        <div style={{ fontSize: '.8rem', color: '#6b7280', marginBottom: '2rem' }}>CEO Command Center</div>
        <input
          type="password" placeholder="Dashboard secret…" value={secret}
          onChange={e => setSecret(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          style={{ width: '100%', background: '#0a0f1e', border: '1px solid #1f2937', borderRadius: '.5rem', padding: '.75rem 1rem', color: '#f3f4f6', fontSize: '.95rem', outline: 'none', marginBottom: '.75rem', boxSizing: 'border-box' }}
        />
        <button onClick={handleLogin} disabled={loading}
          style={{ width: '100%', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '.5rem', padding: '.75rem', fontSize: '.95rem', fontWeight: 600, cursor: 'pointer' }}>
          {loading ? 'Checking…' : 'Sign In'}
        </button>
        {error && <div style={{ color: '#ef4444', fontSize: '.8rem', marginTop: '.75rem' }}>{error}</div>}
      </div>
    </div>
  );
}

export function DashboardNew() {
  console.log('[DashboardNew] Component mounting');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [agents, setAgents] = useState<Agent[]>(FALLBACK_AGENTS);
  const [logs, setLogs] = useState<LogEntry[]>(FALLBACK_LOGS);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [activeNav, setActiveNav] = useState('All Agents');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [logsModal, setLogsModal] = useState<{ open: boolean; agentId: string | null; title: string }>({ open: false, agentId: null, title: '' });
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [dataSource, setDataSource] = useState<'live' | 'mock'>('mock');
  const [currentView, setCurrentView] = useState<'agents' | 'cost' | 'memory'>('agents');

  const fetchLiveData = useCallback(async () => {
    console.log('[DashboardNew] Fetching live data');
    const secret = localStorage.getItem('mfm_secret') || '';
    if (!secret) return;
    try {
      const headers = { 'Authorization': `Bearer ${secret}` };
      const [statusRes, agentsRes, tasksRes] = await Promise.all([
        fetch(`${WORKER_URL}/api/v1/dashboard/status`, { headers }),
        fetch(`${WORKER_URL}/api/v1/dashboard/agents`, { headers }),
        fetch(`${WORKER_URL}/api/v1/dashboard/tasks?limit=20`, { headers }),
      ]);
      if (statusRes.ok) {
        const s = await statusRes.json();
        setSystemStatus(s);
        console.log('[DashboardNew] System status loaded:', s);
      }
      if (agentsRes.ok) {
        const a = await agentsRes.json();
        if (a.agents?.length) {
          setAgents(mapApiAgents(a.agents));
          setDataSource('live');
          console.log('[DashboardNew] Agents loaded:', a.agents.length);
        }
      }
      if (tasksRes.ok) {
        const t = await tasksRes.json();
        if (t.tasks?.length) {
          const mapped: LogEntry[] = t.tasks.map((task: { created_at: string; agent: string; input: string; status: string }) => ({
            time: new Date(task.created_at).toLocaleTimeString(),
            id: task.agent,
            op: (task.input || '').slice(0, 40),
            status: task.status === 'completed' ? 'SUCCESS' : task.status === 'failed' ? 'FAILED' : 'IDLE',
            lat: '—',
          }));
          setLogs(mapped);
          console.log('[DashboardNew] Tasks loaded:', t.tasks.length);
        }
      }
    } catch (err) {
      console.error('[DashboardNew] Error fetching live data:', err);
    }
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem('mfm:theme') as 'dark' | 'light' || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);

    const saved = localStorage.getItem('mfm_secret');
    if (!saved) { setAuthed(false); return; }
    verifySecret(saved).then(ok => {
      if (ok) { setAuthed(true); }
      else { localStorage.removeItem('mfm_secret'); setAuthed(false); }
    });
  }, []);

  useEffect(() => {
    if (!authed) return;
    fetchLiveData();
    const interval = setInterval(fetchLiveData, 30000);
    return () => clearInterval(interval);
  }, [authed, fetchLiveData]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('mfm:theme', newTheme);
  };

  const handleControl = (agent: Agent) => {
    setSelectedAgent(agent);
  };

  const handleViewLogs = (agent: Agent) => {
    setLogsModal({ open: true, agentId: agent.name.toLowerCase().replace(/ /g, '-'), title: `${agent.name} — Task Logs` });
  };

  const handleTerminate = (agent: Agent) => {
    if (confirm(`Terminate ${agent.id}?`)) {
      setAgents(agents.map(a => a.id === agent.id ? { ...a, status: 'idle', load: 0 } : a));
    }
  };

  const sendCommand = async (command_type: string, target: string, payload?: object) => {
    const secret = localStorage.getItem('mfm_secret') || '';
    try {
      const r = await fetch(`${WORKER_URL}/api/v1/dashboard/commands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${secret}` },
        body: JSON.stringify({ command_type, target, payload }),
      });
      return r.ok;
    } catch { return false; }
  };

  const handleSaveControl = async () => {
    if (selectedAgent) await sendCommand('configure', selectedAgent.id);
    setSelectedAgent(null);
  };

  const handlePauseAll = async () => {
    const ok = await sendCommand('pause_all', 'all');
    if (ok) {
      setAgents(prev => prev.map(a => ({ ...a, status: 'idle' as const, load: 0 })));
    } else {
      alert('Command sent — Workers will process shortly.');
    }
  };

  const handleDeployCluster = async () => {
    const ok = await sendCommand('deploy', 'new_cluster', { type: 'auto' });
    alert(ok ? '✅ Deploy command queued.' : '⚠️ Could not reach Worker. Try again.');
  };

  const TEAM_MAP: Record<string, string[]> = {
    'All Agents': [],
    'Marketing Fleet': ['Marketing'],
    'Core Engineering': ['Engineering'],
    'Customer Success': ['Success'],
    'Data Ingestion': ['Data'],
    'Executive Strategy': ['Strategy'],
  };

  const filteredAgents = activeNav === 'All Agents' || !TEAM_MAP[activeNav]
    ? agents
    : agents.filter(a => TEAM_MAP[activeNav].includes(a.team));

  const navGroups = [
    {
      label: 'Multi-Agent Teams',
      items: [
        { label: 'All Agents', active: currentView === 'agents', badgeActive: true },
        { label: 'Marketing Fleet', active: activeNav === 'Marketing Fleet', badgeActive: true },
        { label: 'Core Engineering', active: activeNav === 'Core Engineering', badgeActive: true },
        { label: 'Customer Success', active: activeNav === 'Customer Success', badgeActive: true },
        { label: 'Data Ingestion', active: activeNav === 'Data Ingestion', badgeActive: false },
        { label: 'Executive Strategy', active: activeNav === 'Executive Strategy', badgeActive: true }
      ].map(item => ({ ...item, onClick: () => { setActiveNav(item.label); setCurrentView('agents'); } }))
    },
    {
      label: 'Analytics',
      items: [
        { label: 'Cost Tracking', active: currentView === 'cost', onClick: () => setCurrentView('cost') },
        { label: 'Memory Management', active: currentView === 'memory', onClick: () => setCurrentView('memory') }
      ]
    },
    {
      label: 'Global Controls',
      items: [
        { label: 'Settings', onClick: () => setSettingsOpen(true) },
        { label: 'System Logs', onClick: () => setLogsModal({ open: true, agentId: null, title: 'System Logs — All Agents' }) }
      ]
    }
  ];

  if (authed === null) return <div style={{ background: '#0a0f1e', minHeight: '100vh' }} />;
  if (!authed) return <LoginGate onAuth={() => setAuthed(true)} />;

  return (
    <>
      <Sidebar groups={navGroups} />
      
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <header style={{
          height: '60px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px'
        }}>
          <div style={{ display: 'flex', gap: '32px' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--muted)' }}>Total Agents</span>
              <span style={{ fontFamily: 'monospace', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{agents.length}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--muted)' }}>Active Now</span>
              <span style={{ fontFamily: 'monospace', fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: 'var(--success)' }}>
                {agents.filter(a => a.status === 'running').length}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--muted)' }}>Tasks / Sec</span>
              <span style={{ fontFamily: 'monospace', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>128.4</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--muted)' }}>Errors</span>
              <span style={{ fontFamily: 'monospace', fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: 'var(--danger)' }}>
                {agents.filter(a => a.status === 'error').length}
              </span>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={toggleTheme}
              style={{
                width: '32px',
                height: '32px',
                padding: 0,
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                color: 'var(--fg)',
                fontSize: '16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Toggle Theme"
            >
              🌓
            </button>
            <button
              onClick={handlePauseAll}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                color: 'var(--fg)',
                fontSize: '12px',
                cursor: 'pointer',
                fontWeight: 500
              }}
            >
              Pause All
            </button>
            <button
              onClick={handleDeployCluster}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--accent)',
                background: 'var(--accent)',
                color: 'oklch(20% 0.02 255)',
                fontSize: '12px',
                cursor: 'pointer',
                fontWeight: 500
              }}
            >
              + Deploy Cluster
            </button>
          </div>
        </header>

        <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
          {currentView === 'agents' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Active Agent Clusters</h2>
                  {dataSource === 'live' && <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '99px', background: 'color-mix(in oklch, var(--success) 15%, transparent)', color: 'var(--success)' }}>LIVE</span>}
                  {dataSource === 'mock' && <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '99px', background: 'color-mix(in oklch, var(--warning) 15%, transparent)', color: 'var(--warning)' }}>DEMO</span>}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => setViewMode('list')} style={{ width: '28px', height: '28px', padding: 0, borderRadius: 'var(--radius)', border: `1px solid ${viewMode === 'list' ? 'var(--accent)' : 'var(--border)'}`, background: viewMode === 'list' ? 'var(--accent)' : 'var(--surface)', color: viewMode === 'list' ? 'oklch(20% 0.02 255)' : 'var(--fg)', cursor: 'pointer' }} title="List view">≡</button>
                  <button onClick={() => setViewMode('grid')} style={{ width: '28px', height: '28px', padding: 0, borderRadius: 'var(--radius)', border: `1px solid ${viewMode === 'grid' ? 'var(--accent)' : 'var(--border)'}`, background: viewMode === 'grid' ? 'var(--accent)' : 'var(--surface)', color: viewMode === 'grid' ? 'oklch(20% 0.02 255)' : 'var(--fg)', cursor: 'pointer' }} title="Grid view">⊞</button>
                </div>
              </div>

              <div style={{ 
                display: viewMode === 'grid' ? 'grid' : 'flex',
                flexDirection: viewMode === 'list' ? 'column' : undefined,
                gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(280px, 1fr))' : undefined,
                gap: '16px', 
                marginBottom: '32px' 
              }}>
                {filteredAgents.map((agent) => (
                  <AgentCard
                    key={agent.id}
                    agent={agent}
                    onControl={handleControl}
                    onViewLogs={handleViewLogs}
                    onTerminate={handleTerminate}
                  />
                ))}
              </div>
            </>
          )}

          {currentView === 'cost' && <CostTracking />}
          {currentView === 'memory' && <MemoryManagement />}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Telemetry Feed</h2>
            <button
              onClick={() => setLogsModal({ open: true, agentId: null, title: 'System Telemetry Export' })}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                color: 'var(--fg)',
                fontSize: '12px',
                cursor: 'pointer',
                fontWeight: 500
              }}
            >
              Export CSV
            </button>
          </div>

          <TelemetryTable logs={logs} />
        </div>
      </main>

      <ControlModal
        isOpen={selectedAgent !== null}
        agentName={selectedAgent?.name || ''}
        onClose={() => setSelectedAgent(null)}
        onSave={handleSaveControl}
      />

      <LogsModal
        isOpen={logsModal.open}
        agentId={logsModal.agentId}
        title={logsModal.title}
        onClose={() => setLogsModal({ open: false, agentId: null, title: '' })}
        workerUrl={WORKER_URL}
        secret={localStorage.getItem('mfm_secret') || ''}
      />

      <SettingsPanel
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onLogout={() => setAuthed(false)}
        workerUrl={WORKER_URL}
        systemStatus={systemStatus}
      />

      <ChatWindow
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />

      {!isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            border: '1px solid var(--accent)',
            background: 'var(--accent)',
            color: 'oklch(20% 0.02 255)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
            zIndex: 999
          }}
          title="Chat with CEO Remy"
        >
          💬
        </button>
      )}
    </>
  );
}

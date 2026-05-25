import { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { AgentCard } from './AgentCard';
import { TelemetryTable } from './TelemetryTable';
import { ControlModal } from './ControlModal';
import { ChatWindow } from './ChatWindow';

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

const MOCK_AGENTS: Agent[] = [
  { id: 'MK-084', name: 'Brand Sentiment Analyst', team: 'Marketing', status: 'running', load: 84 },
  { id: 'ENG-112', name: 'Refactoring Specialist', team: 'Engineering', status: 'running', load: 42 },
  { id: 'CS-004', name: 'Escalation Resolver', team: 'Success', status: 'idle', load: 0 },
  { id: 'DATA-22', name: 'Anomalous Log Detector', team: 'Data', status: 'running', load: 95 },
  { id: 'EXE-01', name: 'Strategic KPI Forecaster', team: 'Strategy', status: 'running', load: 12 },
  { id: 'MK-102', name: 'Ad Copy Generator', team: 'Marketing', status: 'error', load: 0 },
  { id: 'ENG-204', name: 'Unit Test Scripter', team: 'Engineering', status: 'running', load: 66 },
  { id: 'DATA-09', name: 'ETL Pipeline Guard', team: 'Data', status: 'idle', load: 0 }
];

const MOCK_LOGS: LogEntry[] = [
  { time: '14:22:01.04', id: 'ENG-112', op: 'code_optimization', status: 'SUCCESS', lat: '124ms' },
  { time: '14:21:58.92', id: 'MK-084', op: 'social_sentiment_scrape', status: 'SUCCESS', lat: '842ms' },
  { time: '14:21:55.10', id: 'MK-102', op: 'creative_generation', status: 'FAILED', lat: '20ms' },
  { time: '14:21:48.33', id: 'DATA-22', op: 'log_ingestion_audit', status: 'SUCCESS', lat: '12ms' },
  { time: '14:21:40.01', id: 'CS-004', op: 'wait_for_trigger', status: 'IDLE', lat: '--' }
];

const WORKER = 'https://mfm-corporation-telegram-bot.mrhan-fx.workers.dev';

async function verifySecret(secret: string): Promise<boolean> {
  try {
    const r = await fetch(`${WORKER}/ask`, {
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
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [agents, setAgents] = useState<Agent[]>(MOCK_AGENTS);
  const [logs] = useState<LogEntry[]>(MOCK_LOGS);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [activeNav, setActiveNav] = useState('All Agents');

  useEffect(() => {
    const savedTheme = localStorage.getItem('mfm:theme') as 'dark' | 'light' || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);

    const saved = localStorage.getItem('mfm_secret');
    if (!saved) { setAuthed(false); return; }
    verifySecret(saved).then(ok => {
      if (ok) setAuthed(true);
      else { localStorage.removeItem('mfm_secret'); setAuthed(false); }
    });
  }, []);

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
    alert(`Viewing Logs for ${agent.id}`);
  };

  const handleTerminate = (agent: Agent) => {
    if (confirm(`Terminate ${agent.id}?`)) {
      setAgents(agents.map(a => a.id === agent.id ? { ...a, status: 'idle', load: 0 } : a));
    }
  };

  const handleSaveControl = () => {
    alert('Parameters optimized and propagated to cluster.');
    setSelectedAgent(null);
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
        { label: 'All Agents', active: activeNav === 'All Agents', badgeActive: true },
        { label: 'Marketing Fleet', active: activeNav === 'Marketing Fleet', badgeActive: true },
        { label: 'Core Engineering', active: activeNav === 'Core Engineering', badgeActive: true },
        { label: 'Customer Success', active: activeNav === 'Customer Success', badgeActive: true },
        { label: 'Data Ingestion', active: activeNav === 'Data Ingestion', badgeActive: false },
        { label: 'Executive Strategy', active: activeNav === 'Executive Strategy', badgeActive: true }
      ].map(item => ({ ...item, onClick: () => setActiveNav(item.label) }))
    },
    {
      label: 'Global Controls',
      items: [
        { label: 'Settings', onClick: () => alert('Settings panel coming soon') },
        { label: 'System Logs', onClick: () => alert('System Logs coming soon') }
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
              onClick={() => alert('Batch Pause Initiated')}
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
              onClick={() => alert('Deploying New Agent Cluster')}
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Active Agent Clusters</h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button style={{ width: '28px', height: '28px', padding: 0, borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--fg)', cursor: 'pointer' }}>≡</button>
              <button style={{ width: '28px', height: '28px', padding: 0, borderRadius: 'var(--radius)', border: '1px solid var(--accent)', background: 'var(--accent)', color: 'oklch(20% 0.02 255)', cursor: 'pointer' }}>⊞</button>
            </div>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
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

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Telemetry Feed</h2>
            <button
              onClick={() => alert('Exporting CSV...')}
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

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

export function DashboardNew() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [agents, setAgents] = useState<Agent[]>(MOCK_AGENTS);
  const [logs] = useState<LogEntry[]>(MOCK_LOGS);
  const [isChatOpen, setIsChatOpen] = useState(true);

  useEffect(() => {
    const savedTheme = localStorage.getItem('mfm:theme') as 'dark' | 'light' || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
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

  const navGroups = [
    {
      label: 'Multi-Agent Teams',
      items: [
        { label: 'All Agents', active: true, badgeActive: true },
        { label: 'Marketing Fleet', badgeActive: true },
        { label: 'Core Engineering', badgeActive: true },
        { label: 'Customer Success', badgeActive: true },
        { label: 'Data Ingestion', badgeActive: false },
        { label: 'Executive Strategy', badgeActive: true }
      ]
    },
    {
      label: 'Global Controls',
      items: [
        { label: 'Settings' },
        { label: 'System Logs' }
      ]
    }
  ];

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
            {agents.map((agent) => (
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

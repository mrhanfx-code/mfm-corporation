interface Agent {
  id: string;
  name: string;
  team: string;
  status: 'running' | 'idle' | 'error';
  load: number;
}

interface AgentCardProps {
  agent: Agent;
  onControl: (agent: Agent) => void;
  onViewLogs: (agent: Agent) => void;
  onTerminate: (agent: Agent) => void;
}

export function AgentCard({ agent, onControl, onViewLogs, onTerminate }: AgentCardProps) {
  const statusColor = agent.status === 'running' ? 'var(--success)' : 
                      agent.status === 'idle' ? 'var(--muted)' : 'var(--danger)';
  
  const statusBg = agent.status === 'running' ? 'color-mix(in oklch, var(--success) 15%, transparent)' : 
                   agent.status === 'idle' ? 'var(--bg)' : 'color-mix(in oklch, var(--danger) 15%, transparent)';

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      transition: 'all 0.2s',
      boxShadow: 'var(--shadow)'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.borderColor = 'var(--accent)';
      e.currentTarget.style.transform = 'translateY(-2px)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.borderColor = 'var(--border)';
      e.currentTarget.style.transform = 'translateY(0)';
    }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ 
          fontFamily: 'monospace', 
          fontSize: '11px', 
          color: 'var(--muted)' 
        }}>
          {agent.id}
        </span>
        <span style={{
          fontSize: '10px',
          fontWeight: 700,
          textTransform: 'uppercase',
          padding: '2px 6px',
          borderRadius: '99px',
          background: statusBg,
          color: statusColor
        }}>
          {agent.status}
        </span>
      </div>
      
      <div style={{ fontSize: '14px', fontWeight: 600 }}>
        {agent.name}
      </div>
      
      <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: 'var(--muted)' }}>
        <span>{agent.team} Team</span>
        <span>{agent.load}% Load</span>
      </div>
      
      <div style={{ 
        height: '4px', 
        background: 'var(--bg)', 
        borderRadius: '2px', 
        overflow: 'hidden' 
      }}>
        <div style={{
          height: '100%',
          width: `${agent.load}%`,
          background: 'var(--accent)',
          boxShadow: '0 0 8px var(--accent)'
        }} />
      </div>
      
      <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
        <button
          onClick={() => onControl(agent)}
          style={{
            flex: 1,
            padding: '6px 12px',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
            background: 'var(--accent)',
            color: 'oklch(20% 0.02 255)',
            fontSize: '12px',
            cursor: 'pointer',
            fontWeight: 500
          }}
        >
          Control
        </button>
        <button
          onClick={() => onViewLogs(agent)}
          style={{
            width: '28px',
            height: '28px',
            padding: 0,
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            color: 'var(--fg)',
            fontSize: '12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          📊
        </button>
        <button
          onClick={() => onTerminate(agent)}
          style={{
            width: '28px',
            height: '28px',
            padding: 0,
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            color: 'var(--danger)',
            fontSize: '12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          ⏻
        </button>
      </div>
    </div>
  );
}

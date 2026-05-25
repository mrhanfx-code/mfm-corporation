interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  workerUrl: string;
  systemStatus: { uptime: string; active_agents: number; tasks_last_hour: number; system_status: string } | null;
}

export function SettingsPanel({ isOpen, onClose, onLogout, workerUrl, systemStatus }: SettingsPanelProps) {
  if (!isOpen) return null;

  const handleLogout = () => {
    localStorage.removeItem('mfm_secret');
    onLogout();
    onClose();
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '440px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', boxShadow: '0 30px 100px rgba(0,0,0,0.5)' }}>

        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 600, fontSize: '14px' }}>Settings</span>
          <button onClick={onClose} style={{ width: '28px', height: '28px', padding: 0, borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--fg)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>

        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* System Info */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '10px', letterSpacing: '0.05em' }}>System</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { label: 'Status', value: systemStatus?.system_status ?? 'Loading…', color: systemStatus?.system_status === 'operational' ? 'var(--success)' : 'var(--warning)' },
                { label: 'Uptime', value: systemStatus?.uptime ?? '—' },
                { label: 'Active Agents', value: systemStatus?.active_agents?.toString() ?? '—' },
                { label: 'Tasks (last hour)', value: systemStatus?.tasks_last_hour?.toString() ?? '—' },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--muted)' }}>{row.label}</span>
                  <span style={{ fontFamily: 'monospace', color: row.color || 'var(--fg)' }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* API Config */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '10px', letterSpacing: '0.05em' }}>API</div>
            <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius)', padding: '8px 12px', fontFamily: 'monospace', fontSize: '11px', color: 'var(--accent)', wordBreak: 'break-all' }}>
              {workerUrl}
            </div>
          </div>

          {/* Session */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '10px', letterSpacing: '0.05em' }}>Session</div>
            <button onClick={handleLogout} style={{ width: '100%', padding: '8px 16px', borderRadius: 'var(--radius)', border: '1px solid var(--danger)', background: 'color-mix(in oklch, var(--danger) 15%, transparent)', color: 'var(--danger)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
              Sign Out
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

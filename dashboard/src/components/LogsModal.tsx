import { useState, useEffect } from 'react';

interface Task {
  id: string;
  agent: string;
  input: string;
  output: string;
  quality_score: number;
  status: string;
  created_at: string;
}

interface LogsModalProps {
  isOpen: boolean;
  agentId: string | null;
  title: string;
  onClose: () => void;
  workerUrl: string;
  secret: string;
}

export function LogsModal({ isOpen, agentId, title, onClose, workerUrl, secret }: LogsModalProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError('');
    const url = agentId
      ? `${workerUrl}/api/v1/dashboard/tasks?agent=${encodeURIComponent(agentId)}&limit=50`
      : `${workerUrl}/api/v1/dashboard/tasks?limit=50`;
    fetch(url, { headers: { 'Authorization': `Bearer ${secret}` } })
      .then(r => r.json())
      .then(d => setTasks(d.tasks || []))
      .catch(() => setError('Failed to load logs. Check Worker connectivity.'))
      .finally(() => setLoading(false));
  }, [isOpen, agentId, workerUrl, secret]);

  const exportCSV = () => {
    const header = 'Timestamp,Agent,Input,Status,Quality Score\n';
    const rows = tasks.map(t =>
      `"${t.created_at}","${t.agent}","${(t.input || '').replace(/"/g, '""').slice(0, 200)}","${t.status}","${t.quality_score ?? ''}"`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `mfm-logs-${agentId || 'system'}-${Date.now()}.csv`;
    a.click();
  };

  if (!isOpen) return null;

  const statusColor = (s: string) =>
    s === 'completed' || s === 'SUCCESS' ? 'var(--success)' :
    s === 'failed'    || s === 'FAILED'  ? 'var(--danger)'  : 'var(--muted)';

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '760px', maxWidth: '95vw', maxHeight: '80vh', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', boxShadow: '0 30px 100px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: '14px' }}>📊 {title}</div>
            <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>{tasks.length} records</div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={exportCSV} disabled={tasks.length === 0} style={{ padding: '6px 12px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--fg)', fontSize: '12px', cursor: tasks.length === 0 ? 'not-allowed' : 'pointer', opacity: tasks.length === 0 ? 0.5 : 1 }}>
              Export CSV
            </button>
            <button onClick={onClose} style={{ width: '28px', height: '28px', padding: 0, borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--fg)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0' }}>
          {loading && <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>Loading…</div>}
          {error && <div style={{ padding: '40px', textAlign: 'center', color: 'var(--danger)' }}>{error}</div>}
          {!loading && !error && tasks.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>No tasks found. Agents may not have run yet.</div>
          )}
          {!loading && tasks.length > 0 && (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'monospace', fontSize: '11px' }}>
              <thead>
                <tr>
                  {['Timestamp', 'Agent', 'Input', 'Status', 'Quality'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 16px', background: 'color-mix(in oklch, var(--surface) 95%, var(--fg) 5%)', borderBottom: '1px solid var(--border)', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', fontSize: '10px', position: 'sticky', top: 0 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tasks.map((t, i) => (
                  <tr key={i} style={{ cursor: 'default' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'color-mix(in oklch, var(--surface) 95%, var(--accent) 5%)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '8px 16px', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap', color: 'var(--muted)' }}>{new Date(t.created_at).toLocaleString()}</td>
                    <td style={{ padding: '8px 16px', borderBottom: '1px solid var(--border)', color: 'var(--accent)', whiteSpace: 'nowrap' }}>{t.agent}</td>
                    <td style={{ padding: '8px 16px', borderBottom: '1px solid var(--border)', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={t.input}>{t.input}</td>
                    <td style={{ padding: '8px 16px', borderBottom: '1px solid var(--border)', color: statusColor(t.status), whiteSpace: 'nowrap' }}>{t.status?.toUpperCase()}</td>
                    <td style={{ padding: '8px 16px', borderBottom: '1px solid var(--border)', color: (t.quality_score ?? 0) >= 80 ? 'var(--success)' : (t.quality_score ?? 0) >= 50 ? 'var(--warning)' : 'var(--danger)' }}>{t.quality_score != null ? `${t.quality_score}%` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

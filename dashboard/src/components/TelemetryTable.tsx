interface LogEntry {
  time: string;
  id: string;
  op: string;
  status: 'SUCCESS' | 'FAILED' | 'IDLE';
  lat: string;
}

interface TelemetryTableProps {
  logs: LogEntry[];
}

export function TelemetryTable({ logs }: TelemetryTableProps) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      overflow: 'hidden',
      boxShadow: 'var(--shadow)'
    }}>
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        fontFamily: 'monospace',
        fontSize: '11px'
      }}>
        <thead>
          <tr>
            <th style={{
              textAlign: 'left',
              padding: '12px 16px',
              background: 'color-mix(in oklch, var(--surface) 95%, var(--fg) 5%)',
              borderBottom: '1px solid var(--border)',
              color: 'var(--muted)',
              fontWeight: 600,
              textTransform: 'uppercase',
              fontSize: '10px'
            }}>
              Timestamp
            </th>
            <th style={{
              textAlign: 'left',
              padding: '12px 16px',
              background: 'color-mix(in oklch, var(--surface) 95%, var(--fg) 5%)',
              borderBottom: '1px solid var(--border)',
              color: 'var(--muted)',
              fontWeight: 600,
              textTransform: 'uppercase',
              fontSize: '10px'
            }}>
              Agent ID
            </th>
            <th style={{
              textAlign: 'left',
              padding: '12px 16px',
              background: 'color-mix(in oklch, var(--surface) 95%, var(--fg) 5%)',
              borderBottom: '1px solid var(--border)',
              color: 'var(--muted)',
              fontWeight: 600,
              textTransform: 'uppercase',
              fontSize: '10px'
            }}>
              Operation
            </th>
            <th style={{
              textAlign: 'left',
              padding: '12px 16px',
              background: 'color-mix(in oklch, var(--surface) 95%, var(--fg) 5%)',
              borderBottom: '1px solid var(--border)',
              color: 'var(--muted)',
              fontWeight: 600,
              textTransform: 'uppercase',
              fontSize: '10px'
            }}>
              Status
            </th>
            <th style={{
              textAlign: 'left',
              padding: '12px 16px',
              background: 'color-mix(in oklch, var(--surface) 95%, var(--fg) 5%)',
              borderBottom: '1px solid var(--border)',
              color: 'var(--muted)',
              fontWeight: 600,
              textTransform: 'uppercase',
              fontSize: '10px'
            }}>
              Latency
            </th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log, index) => (
            <tr 
              key={index}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'color-mix(in oklch, var(--surface) 95%, var(--accent) 5%)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
              style={{ cursor: 'pointer' }}
            >
              <td style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', fontVariantNumeric: 'tabular-nums' }}>
                {log.time}
              </td>
              <td style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', fontVariantNumeric: 'tabular-nums', color: 'var(--accent)' }}>
                {log.id}
              </td>
              <td style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', fontVariantNumeric: 'tabular-nums' }}>
                {log.op}
              </td>
              <td style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', fontVariantNumeric: 'tabular-nums' }}>
                <span style={{ 
                  color: log.status === 'SUCCESS' ? 'var(--success)' : 
                         log.status === 'FAILED' ? 'var(--danger)' : 'var(--muted)' 
                }}>
                  {log.status}
                </span>
              </td>
              <td style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', fontVariantNumeric: 'tabular-nums' }}>
                {log.lat}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

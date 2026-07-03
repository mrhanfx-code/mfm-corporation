import { useState } from 'react';

interface ControlModalProps {
  isOpen: boolean;
  agentName: string;
  onClose: () => void;
  onSave: () => void;
}

export function ControlModal({ isOpen, agentName, onClose, onSave }: ControlModalProps) {
  const [temperature, setTemperature] = useState(0.7);
  const [concurrency, setConcurrency] = useState(8);
  const [strategy, setStrategy] = useState('Chain-of-Thought');

  if (!isOpen) return null;

  return (
    <div 
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '480px',
          background: 'var(--surface)',
          borderRadius: 'var(--radius)',
          boxShadow: '0 30px 100px rgba(0,0,0,0.5)',
          border: '1px solid var(--border)',
          animation: 'modalSlide 0.3s ease-out'
        }}
      >
        <div style={{ 
          padding: '16px 20px', 
          borderBottom: '1px solid var(--border)', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}>
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>
            Control: {agentName}
          </h3>
          <button
            onClick={onClose}
            style={{
              width: '28px',
              height: '28px',
              padding: 0,
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--fg)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: '24px' }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '11px', 
              fontWeight: 600, 
              textTransform: 'uppercase', 
              marginBottom: '6px', 
              color: 'var(--muted)' 
            }}>
              Inference Temperature
            </label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent)' }}
            />
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginTop: '4px', 
              fontFamily: 'monospace', 
              fontSize: '10px' 
            }}>
              <span>0.0 (Strict)</span>
              <span>2.0 (Creative)</span>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '11px', 
              fontWeight: 600, 
              textTransform: 'uppercase', 
              marginBottom: '6px', 
              color: 'var(--muted)' 
            }}>
              Concurrency Limit
            </label>
            <input
              type="number"
              value={concurrency}
              onChange={(e) => setConcurrency(parseInt(e.target.value))}
              style={{
                width: '100%',
                padding: '6px 12px',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                color: 'var(--fg)',
                fontSize: '12px',
                height: '32px'
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '11px', 
              fontWeight: 600, 
              textTransform: 'uppercase', 
              marginBottom: '6px', 
              color: 'var(--muted)' 
            }}>
              Strategy Mode
            </label>
            <select
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 12px',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                color: 'var(--fg)',
                fontSize: '12px',
                height: '32px',
                appearance: 'none',
                backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' fill=\'none\' stroke=\'white\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'m3 5 3 3 3-3\'/%3E%3C/svg%3E")',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 8px center',
                paddingRight: '24px'
              }}
            >
              <option>Greedy Search</option>
              <option>Chain-of-Thought</option>
              <option>Self-Reflection</option>
            </select>
          </div>
        </div>

        <div style={{ 
          padding: '16px 20px', 
          borderTop: '1px solid var(--border)', 
          display: 'flex', 
          justifyContent: 'flex-end', 
          gap: '12px' 
        }}>
          <button
            onClick={onClose}
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
            Cancel
          </button>
          <button
            onClick={onSave}
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
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  );
}

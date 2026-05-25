
interface NavItem {
  label: string;
  active?: boolean;
  badgeActive?: boolean;
  onClick?: () => void;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

interface SidebarProps {
  groups: NavGroup[];
}

export function Sidebar({ groups }: SidebarProps) {
  return (
    <aside style={{ 
      width: 'var(--sidebar-width)', 
      borderRight: '1px solid var(--border)',
      background: 'var(--surface)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 10
    }}>
      <header style={{ padding: '20px', borderBottom: '1px solid var(--border)' }}>
        <h1 style={{ 
          fontSize: '11px', 
          fontWeight: 700, 
          letterSpacing: '0.1em', 
          textTransform: 'uppercase',
          color: 'var(--muted)',
          margin: 0
        }}>
          MFM Corporation
        </h1>
        <p style={{ 
          fontSize: '14px', 
          fontWeight: 600, 
          marginTop: '4px',
          margin: '4px 0 0 0'
        }}>
          Command Center
        </p>
      </header>

      <nav style={{ flex: 1, padding: '16px 0', overflowY: 'auto' }}>
        {groups.map((group, groupIndex) => (
          <div key={groupIndex}>
            <div style={{ 
              fontSize: '10px', 
              fontWeight: 700, 
              textTransform: 'uppercase', 
              letterSpacing: '0.05em',
              color: 'var(--muted)',
              padding: groupIndex > 0 ? '24px 20px 8px' : '0 20px 8px'
            }}>
              {group.label}
            </div>
            {group.items.map((item, itemIndex) => (
              <div
                key={itemIndex}
                onClick={item.onClick}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px 20px',
                  cursor: 'pointer',
                  gap: '10px',
                  transition: 'background 0.1s',
                  background: item.active ? 'color-mix(in oklch, var(--accent) 10%, transparent)' : 'transparent',
                  borderRight: item.active ? '2px solid var(--accent)' : 'none',
                  color: item.active ? 'var(--accent)' : 'var(--fg)'
                }}
                onMouseEnter={(e) => {
                  if (!item.active) {
                    e.currentTarget.style.background = 'var(--bg)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!item.active) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                {item.badgeActive !== undefined && (
                  <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: item.badgeActive ? 'var(--success)' : 'var(--border)',
                    boxShadow: item.badgeActive ? '0 0 8px var(--success)' : 'none'
                  }} />
                )}
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}

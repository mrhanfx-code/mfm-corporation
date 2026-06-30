"use client";

interface NavItem {
  label: string;
  id: string;
  icon?: string;
}

interface SidebarProps {
  activeTeam: string;
  onTeamChange: (team: string) => void;
}

const TEAMS: NavItem[] = [
  { label: "All Agents", id: "all" },
  { label: "Marketing Fleet", id: "marketing" },
  { label: "Core Engineering", id: "engineering" },
  { label: "Customer Success", id: "customer" },
  { label: "Data Ingestion", id: "data" },
  { label: "Executive Strategy", id: "executive" },
];

const GLOBAL_CONTROLS: NavItem[] = [
  { label: "Settings", id: "settings" },
  { label: "System Logs", id: "logs" },
];

export default function Sidebar({ activeTeam, onTeamChange }: SidebarProps) {
  return (
    <aside className="w-56 flex-shrink-0 bg-zinc-900 border-r border-zinc-800 flex flex-col h-full">
      <div className="px-4 py-5 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
            <span className="text-emerald-400 text-xs font-bold">M</span>
          </div>
          <div>
            <p className="text-xs font-semibold text-white leading-tight">MFM Corp</p>
            <p className="text-[10px] text-zinc-500 leading-tight">Command Center</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 space-y-5" aria-label="Main navigation">
        <div>
          <p className="px-4 text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-1">
            Multi-Agent Teams
          </p>
          <ul role="list" className="space-y-0.5">
            {TEAMS.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onTeamChange(item.id)}
                  aria-current={activeTeam === item.id ? "page" : undefined}
                  className={`w-full text-left px-4 py-2 text-sm rounded-lg mx-1 transition ${
                    activeTeam === item.id
                      ? "bg-emerald-500/10 text-emerald-400 font-medium"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                  }`}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="px-4 text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-1">
            Global Controls
          </p>
          <ul role="list" className="space-y-0.5">
            {GLOBAL_CONTROLS.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onTeamChange(item.id)}
                  aria-current={activeTeam === item.id ? "page" : undefined}
                  className={`w-full text-left px-4 py-2 text-sm rounded-lg mx-1 transition ${
                    activeTeam === item.id
                      ? "bg-emerald-500/10 text-emerald-400 font-medium"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                  }`}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </aside>
  );
}

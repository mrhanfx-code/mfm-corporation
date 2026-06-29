"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";
import ConfirmModal from "@/components/ui/ConfirmModal";

interface StatusStats {
  totalAgents?: number;
  activeAgents?: number;
  tasksPerHour?: number;
  qualityScore?: number;
}

interface HeaderProps {
  stats?: StatusStats;
  onPauseAll?: () => void;
  onDeployCluster?: () => void;
}

export default function Header({ stats, onPauseAll, onDeployCluster }: HeaderProps) {
  const [pauseModal, setPauseModal] = useState(false);
  const [deployModal, setDeployModal] = useState(false);

  const handlePauseConfirm = () => {
    setPauseModal(false);
    onPauseAll?.();
  };

  const handleDeployConfirm = () => {
    setDeployModal(false);
    onDeployCluster?.();
  };

  return (
    <>
      <header className="h-14 flex-shrink-0 bg-zinc-950 border-b border-zinc-800 flex items-center px-5 gap-4">
        <div className="flex items-center gap-4 flex-1">
          <StatBadge label="Total Agents" value={stats?.totalAgents ?? "—"} />
          <StatBadge label="Active" value={stats?.activeAgents ?? "—"} color="emerald" />
          <StatBadge label="Tasks/hr" value={stats?.tasksPerHour ?? "—"} />
          <StatBadge
            label="Quality"
            value={stats?.qualityScore ? `${stats.qualityScore}%` : "—"}
            color="amber"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPauseModal(true)}
            className="px-3 py-1.5 text-xs font-medium text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-lg transition"
          >
            ⏸ Pause All
          </button>
          <button
            type="button"
            onClick={() => setDeployModal(true)}
            className="px-3 py-1.5 text-xs font-medium text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg transition"
          >
            + Deploy Cluster
          </button>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg transition"
            aria-label="Sign out"
          >
            Sign Out
          </button>
        </div>
      </header>

      <ConfirmModal
        open={pauseModal}
        title="Pause All Agents"
        message="This will stop all active agents immediately. Running tasks will be interrupted. Are you sure?"
        confirmLabel="Yes, Pause All"
        onConfirm={handlePauseConfirm}
        onCancel={() => setPauseModal(false)}
        danger
      />

      <ConfirmModal
        open={deployModal}
        title="Deploy New Cluster"
        message="This will spin up a new agent cluster and incur additional resource costs. Continue?"
        confirmLabel="Deploy"
        onConfirm={handleDeployConfirm}
        onCancel={() => setDeployModal(false)}
      />
    </>
  );
}

function StatBadge({
  label,
  value,
  color = "default",
}: {
  label: string;
  value: string | number;
  color?: "emerald" | "amber" | "default";
}) {
  const colors = {
    emerald: "text-emerald-400",
    amber: "text-amber-400",
    default: "text-zinc-200",
  };

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] text-zinc-500 uppercase tracking-wider">{label}</span>
      <span className={`text-sm font-semibold ${colors[color]}`}>{value}</span>
    </div>
  );
}

"use client";

import { useState } from "react";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { api } from "@/lib/api.client";

export interface Agent {
  id: string;
  name: string;
  status: "active" | "idle" | "error" | "stopped";
  team?: string;
  taskCount?: number;
  qualityScore?: number;
  lastActivity?: string;
}

interface AgentCardProps {
  agent: Agent;
  onStopped?: (id: string) => void;
}

const STATUS_STYLES: Record<Agent["status"], { dot: string; label: string }> = {
  active: { dot: "bg-emerald-400", label: "Active" },
  idle:   { dot: "bg-zinc-500",    label: "Idle" },
  error:  { dot: "bg-red-400",     label: "Error" },
  stopped:{ dot: "bg-zinc-600",    label: "Stopped" },
};

export default function AgentCard({ agent, onStopped }: AgentCardProps) {
  const [stopModal, setStopModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const style = STATUS_STYLES[agent.status] ?? STATUS_STYLES.idle;

  const handleStop = async () => {
    setStopModal(false);
    setLoading(true);
    await api.post(`/agents`, { action: "stop", agentId: agent.id });
    setLoading(false);
    onStopped?.(agent.id);
  };

  return (
    <>
      <article className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3 hover:border-zinc-700 transition">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`w-2 h-2 rounded-full flex-shrink-0 ${style.dot} ${
                agent.status === "active" ? "animate-pulse" : ""
              }`}
              aria-hidden="true"
            />
            <h3 className="text-sm font-medium text-white truncate">{agent.name}</h3>
          </div>
          <span className="text-[10px] font-medium text-zinc-500 flex-shrink-0">{style.label}</span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <Stat label="Tasks" value={agent.taskCount ?? 0} />
          <Stat label="Quality" value={agent.qualityScore ? `${agent.qualityScore}%` : "—"} />
          {agent.lastActivity && (
            <div className="col-span-2 text-zinc-600 truncate" title={agent.lastActivity}>
              <span className="text-zinc-500">Last: </span>
              {agent.lastActivity}
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            className="flex-1 py-1.5 text-xs font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 rounded-lg border border-zinc-700 transition"
          >
            Control
          </button>
          <button
            type="button"
            className="flex-1 py-1.5 text-xs font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 rounded-lg border border-zinc-700 transition"
          >
            Stats
          </button>
          <button
            type="button"
            onClick={() => setStopModal(true)}
            disabled={agent.status === "stopped" || loading}
            className="py-1.5 px-3 text-xs font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-lg border border-red-500/20 transition disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label={`Stop agent ${agent.name}`}
          >
            {loading ? "…" : "⏻ Stop"}
          </button>
        </div>
      </article>

      <ConfirmModal
        open={stopModal}
        title={`Stop "${agent.name}"`}
        message="This agent will be stopped and any in-progress tasks will be interrupted. Continue?"
        confirmLabel="Stop Agent"
        onConfirm={handleStop}
        onCancel={() => setStopModal(false)}
        danger
      />
    </>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <span className="text-zinc-500">{label}: </span>
      <span className="text-zinc-300 font-medium">{value}</span>
    </div>
  );
}

"use client";

import { useState } from "react";
import AgentCard, { type Agent } from "./AgentCard";

interface AgentGridProps {
  agents: Agent[];
  activeTeam: string;
}

export default function AgentGrid({ agents, activeTeam }: AgentGridProps) {
  const [localAgents, setLocalAgents] = useState<Agent[]>(agents);

  const filtered =
    activeTeam === "all"
      ? localAgents
      : localAgents.filter(
          (a) => a.team?.toLowerCase() === activeTeam.toLowerCase()
        );

  const handleStopped = (id: string) => {
    setLocalAgents((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "stopped" as const } : a))
    );
  };

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-zinc-500 text-sm">No agents in this team.</p>
      </div>
    );
  }

  return (
    <div
      className="grid gap-3 p-5"
      style={{
        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
      }}
    >
      {filtered.map((agent) => (
        <AgentCard key={agent.id} agent={agent} onStopped={handleStopped} />
      ))}
    </div>
  );
}

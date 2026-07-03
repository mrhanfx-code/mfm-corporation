"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import AgentGrid from "@/components/dashboard/AgentGrid";
import ChatPanel from "@/components/dashboard/ChatPanel";
import type { Agent } from "@/components/dashboard/AgentCard";

interface DashboardClientProps {
  agents: Agent[];
  stats: {
    totalAgents?: number;
    activeAgents?: number;
    tasksPerHour?: number;
    qualityScore?: number;
  };
}

export default function DashboardClient({ agents, stats }: DashboardClientProps) {
  const [activeTeam, setActiveTeam] = useState("all");

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error("Global error:", event.error);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error("Unhandled promise rejection:", event.reason);
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  return (
    <>
      <Sidebar activeTeam={activeTeam} onTeamChange={setActiveTeam} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header stats={stats} />

        <main className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <div className="flex items-center gap-3 px-5 pt-4 pb-2">
              <h1 className="text-sm font-semibold text-white">
                {activeTeam === "all" ? "All Agents" : activeTeam.replace(/^\w/, (c) => c.toUpperCase())}
              </h1>
              <span className="text-xs text-zinc-500">
                {activeTeam === "all"
                  ? `${agents.length} agents`
                  : `${agents.filter((a) => a.team?.toLowerCase() === activeTeam).length} agents`}
              </span>
            </div>

            <AgentGrid agents={agents} activeTeam={activeTeam} />
          </div>

          <ChatPanel />
        </main>
      </div>
    </>
  );
}

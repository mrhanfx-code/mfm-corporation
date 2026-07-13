"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import AgentGrid from "@/components/dashboard/AgentGrid";
import ChatPanel from "@/components/dashboard/ChatPanel";
import type { Agent } from "@/components/dashboard/AgentCard";
import type { View } from "@/components/layout/Sidebar";

interface DashboardClientProps {
  agents: Agent[];
  stats: {
    totalAgents?: number;
    activeAgents?: number;
    tasksPerHour?: number;
    qualityScore?: number;
  };
}

export default function DashboardClient({ agents: initialAgents, stats: initialStats }: DashboardClientProps) {
  const [activeTeam, setActiveTeam] = useState<View>("all");
  const [agents, setAgents] = useState<Agent[]>(initialAgents);
  const [stats, setStats] = useState(initialStats);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log("Fetching agents and status from internal API routes...");
        
        const [agentsRes, statusRes] = await Promise.all([
          fetch('/api/dashboard/agents'),
          fetch('/api/dashboard/status')
        ]);

        const agentsData = await agentsRes.json();
        const statusData = await statusRes.json();

        console.log("Agents API response:", agentsData);
        console.log("Status API response:", statusData);

        // Normalize agent data from Workers API response
        const normalizedAgents = agentsData.agents?.results?.map((a: any) => {
          // Map agent names to team categories (matching sidebar IDs)
          const teamMap: Record<string, string> = {
            'finance': 'executive',
            'ops': 'data',
            'technology': 'engineering',
            'trend': 'marketing',
            'market': 'marketing',
            'general': 'executive',
            'integration': 'engineering',
            'analytics': 'data',
            'risk': 'executive',
            'reporting': 'data',
            'content': 'marketing',
            'brand': 'marketing',
          };
          
          const agentName = a.agent;
          const teamKey = agentName.split('-')[0] || 'general';
          const team = teamMap[teamKey] || 'engineering';

          return {
            id: agentName,
            name: agentName.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
            team: team,
            status: 'active',
            lastActivity: a.last_activity,
            taskCount: a.task_count,
            avgScore: a.avg_score,
          };
        }) || [];

        console.log("Normalized agents:", normalizedAgents);
        setAgents(normalizedAgents);

        // Normalize stats from Workers API response
        const normalizedStats = {
          totalAgents: normalizedAgents.length,
          activeAgents: normalizedAgents.length,
          tasksPerHour: 0,
          qualityScore: statusData.agents?.results?.reduce((acc: number, a: any) => acc + a.avg_score, 0) / statusData.agents?.results?.length || 0,
        };

        console.log("Normalized stats:", normalizedStats);
        setStats(normalizedStats);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []); // Force re-render

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
                {loading ? "Loading..." : activeTeam === "all"
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

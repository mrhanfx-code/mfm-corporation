import { workersApi } from "@/lib/api.server";
import DashboardClient from "./DashboardClient";
import type { Agent } from "@/components/dashboard/AgentCard";

interface WorkersAgent {
  id?: string;
  name?: string;
  status?: string;
  team?: string;
  task_count?: number;
  quality_score?: number;
  last_activity?: string;
}

interface WorkersStatus {
  total_agents?: number;
  active_agents?: number;
  tasks_per_hour?: number;
  quality_score?: number;
}

function normalizeAgent(raw: WorkersAgent, index: number): Agent {
  const status = (raw.status ?? "idle") as Agent["status"];
  return {
    id: raw.id ?? String(index),
    name: raw.name ?? `Agent ${index + 1}`,
    status: ["active", "idle", "error", "stopped"].includes(status) ? status : "idle",
    team: raw.team,
    taskCount: raw.task_count,
    qualityScore: raw.quality_score,
    lastActivity: raw.last_activity,
  };
}

export default async function DashboardPage() {
  // Skip API calls during build time if environment variables not set
  const useMockData = !process.env.WORKERS_API_URL || !process.env.DASHBOARD_SECRET;

  let agents: Agent[];
  let stats: {
    totalAgents?: number;
    activeAgents?: number;
    tasksPerHour?: number;
    qualityScore?: number;
  };

  if (useMockData) {
    agents = [];
    stats = {
      totalAgents: 0,
      activeAgents: 0,
      tasksPerHour: undefined,
      qualityScore: undefined,
    };
  } else {
    const [agentsRes, statusRes] = await Promise.allSettled([
      workersApi.get<WorkersAgent[]>("/agents"),
      workersApi.get<WorkersStatus>("/api/v1/dashboard/status"),
    ]);

    agents =
      agentsRes.status === "fulfilled" && Array.isArray(agentsRes.value.data)
        ? agentsRes.value.data.map(normalizeAgent)
        : [];

    const rawStatus =
      statusRes.status === "fulfilled" ? statusRes.value.data : null;

    stats = rawStatus
      ? {
          totalAgents: rawStatus.total_agents,
          activeAgents: rawStatus.active_agents,
          tasksPerHour: rawStatus.tasks_per_hour,
          qualityScore: rawStatus.quality_score,
        }
      : {
          totalAgents: agents.length,
          activeAgents: agents.filter((a) => a.status === "active").length,
          tasksPerHour: undefined,
          qualityScore: undefined,
        };
  }

  return <DashboardClient agents={agents} stats={stats} />;
}

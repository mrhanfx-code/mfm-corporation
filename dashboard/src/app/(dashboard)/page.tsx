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
    agents = MOCK_AGENTS;
    stats = {
      totalAgents: agents.length,
      activeAgents: agents.filter((a) => a.status === "active").length,
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
        : MOCK_AGENTS;

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

const MOCK_AGENTS: Agent[] = [
  { id: "1", name: "Marketing Agent Alpha", status: "active", team: "marketing", taskCount: 12, qualityScore: 94 },
  { id: "2", name: "Marketing Agent Beta",  status: "idle",   team: "marketing", taskCount: 7,  qualityScore: 88 },
  { id: "3", name: "Core Engineer 1",       status: "active", team: "engineering", taskCount: 23, qualityScore: 97 },
  { id: "4", name: "Core Engineer 2",       status: "error",  team: "engineering", taskCount: 3,  qualityScore: 61 },
  { id: "5", name: "Customer Success 1",    status: "active", team: "customer",    taskCount: 18, qualityScore: 92 },
  { id: "6", name: "Data Ingestion 1",      status: "active", team: "data",        taskCount: 45, qualityScore: 99 },
  { id: "7", name: "Executive Advisor",     status: "idle",   team: "executive",   taskCount: 2,  qualityScore: 85 },
];

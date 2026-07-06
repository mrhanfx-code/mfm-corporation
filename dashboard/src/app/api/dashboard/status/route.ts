import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { workersApi } from "@/lib/api.server";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Skip API call if environment variables not set (build time)
  if (!process.env.WORKERS_API_URL || !process.env.DASHBOARD_SECRET) {
    return NextResponse.json({ 
      totalAgents: 0,
      activeAgents: 0,
      tasksPerHour: 0,
      qualityScore: 0
    });
  }

  const { data, error, status } = await workersApi.get("/api/v1/dashboard/status");

  if (error) {
    return NextResponse.json({ error }, { status });
  }

  return NextResponse.json(data);
}

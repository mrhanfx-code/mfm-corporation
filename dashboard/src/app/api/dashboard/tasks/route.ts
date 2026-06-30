import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { workersApi } from "@/lib/api.server";

interface RawTask {
  id?: string;
  agent_id?: string;
  type?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  input?: unknown;
  output?: unknown;
  [key: string]: unknown;
}

function stripSensitiveFields(task: RawTask): Omit<RawTask, "input" | "output"> {
  const { input: _input, output: _output, ...safe } = task;
  return safe;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limitParam = req.nextUrl.searchParams.get("limit");
  const limit = Math.min(parseInt(limitParam ?? "20", 10) || 20, 50);

  const { data, error, status } = await workersApi.get<RawTask[]>(`/tasks?limit=${limit}`);

  if (error) {
    return NextResponse.json({ error }, { status });
  }

  const filtered = Array.isArray(data) ? data.map(stripSensitiveFields) : data;
  return NextResponse.json(filtered);
}

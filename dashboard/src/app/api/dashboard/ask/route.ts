import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { workersApi } from "@/lib/api.server";
import { checkRateLimit } from "@/lib/ratelimit";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Skip API call if environment variables not set (build time)
  if (!process.env.WORKERS_API_URL || !process.env.DASHBOARD_SECRET) {
    return NextResponse.json({ error: "Service unavailable during build" }, { status: 503 });
  }

  const sessionId = (session.user as { id?: string })?.id ?? "unknown";
  const limit = checkRateLimit(sessionId);

  if (!limit.success) {
    const retryAfterSeconds = Math.ceil((limit.reset - Date.now()) / 1000);
    return NextResponse.json(
      { error: "Too many requests. Please wait before sending another message." },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfterSeconds),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(limit.reset),
        },
      }
    );
  }

  let body: { message?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.message || typeof body.message !== "string") {
    return NextResponse.json({ error: "message field is required" }, { status: 400 });
  }

  const sanitizedMessage = body.message.trim().slice(0, 2000);

  const { data, error, status } = await workersApi.post("/dashboard/ask", {
    text: sanitizedMessage,
  });

  if (error) {
    console.error('[Dashboard API] Backend error:', error, status);
    const clientStatus = status === 401 || status === 403 ? 502 : status;
    return NextResponse.json({ error: "Backend service error. Please try again." }, { status: clientStatus });
  }

  console.log('[Dashboard API] Backend response:', data);
  return NextResponse.json(data, {
    headers: {
      "X-RateLimit-Remaining": String(limit.remaining),
      "X-RateLimit-Reset": String(limit.reset),
    },
  });
}

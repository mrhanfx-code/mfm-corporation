import "server-only";

const BASE_URL = process.env.WORKERS_API_URL;
const SECRET = process.env.WORKERS_API_SECRET;

if (!BASE_URL) throw new Error("WORKERS_API_URL is not set");
if (!SECRET) throw new Error("WORKERS_API_SECRET is not set");

interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
}

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  const url = `${BASE_URL}${path}`;

  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SECRET}`,
        ...options?.headers,
      },
      next: { revalidate: 60, tags: ['workers-api'] },
    });

    if (!res.ok) {
      return { data: null, error: `Workers API error: ${res.status}`, status: res.status };
    }

    const data: T = await res.json();
    return { data, error: null, status: res.status };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Network error";
    return { data: null, error: message, status: 500 };
  }
}

export const workersApi = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
};

interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
}

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(path, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!res.ok) {
      return { data: null, error: `Request failed: ${res.status}`, status: res.status };
    }

    const data: T = await res.json();
    return { data, error: null, status: res.status };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Network error";
    return { data: null, error: message, status: 500 };
  }
}

export const api = {
  get: <T>(path: string) =>
    request<T>(`/api/dashboard${path}`, { method: "GET" }),
  post: <T>(path: string, body: unknown) =>
    request<T>(`/api/dashboard${path}`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
};

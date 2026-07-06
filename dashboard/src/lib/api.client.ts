interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
}

async function request<T>(
  path: string,
  options?: RequestInit,
  retries: number = 3
): Promise<ApiResponse<T>> {
  let lastError: string | null = null;
  let lastStatus: number = 500;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(path, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options?.headers,
        },
      });

      // Rate limit detection - retry with exponential backoff
      if (res.status === 429 && attempt < retries) {
        const waitTime = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }

      if (!res.ok) {
        lastError = `Request failed: ${res.status}`;
        lastStatus = res.status;
        
        // Retry on server errors (5xx) but not on client errors (4xx except 429)
        if (res.status >= 500 && attempt < retries) {
          const waitTime = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        
        return { data: null, error: lastError, status: lastStatus };
      }

      const data: T = await res.json();
      return { data, error: null, status: res.status };
    } catch (err) {
      lastError = err instanceof Error ? err.message : "Network error";
      
      // Retry on network errors
      if (attempt < retries) {
        const waitTime = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
    }
  }

  return { data: null, error: lastError, status: lastStatus };
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

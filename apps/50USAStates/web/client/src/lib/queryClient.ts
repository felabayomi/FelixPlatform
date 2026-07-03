import { QueryClient, QueryFunction } from "@tanstack/react-query";

const EXPEDITION_ADMIN_TOKEN_KEY = "ea_admin_token";
const configuredApiHost = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const configuredApiPrefix = (import.meta.env.VITE_API_PREFIX || "").replace(/\/$/, "");
const API_HOST = configuredApiHost || (typeof window !== "undefined" ? window.location.origin : "");
const API_PREFIX = configuredApiHost
  ? (configuredApiPrefix || "/api/expedition-america")
  : "";

function getStoredAdminToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(EXPEDITION_ADMIN_TOKEN_KEY)
    || window.sessionStorage.getItem(EXPEDITION_ADMIN_TOKEN_KEY)
    || null;
}

export function buildApiUrl(path: string) {
  const rawPath = String(path || "");
  const normalizedPath = API_PREFIX
    ? rawPath.replace(/^\/api/, "")
    : (rawPath.startsWith("/") ? rawPath : `/${rawPath}`);

  return `${API_HOST}${API_PREFIX}${normalizedPath.startsWith("/") ? normalizedPath : `/${normalizedPath}`}`;
}

function buildHeaders(hasJsonBody: boolean) {
  const headers: Record<string, string> = {};
  const adminToken = getStoredAdminToken();

  if (hasJsonBody) {
    headers["Content-Type"] = "application/json";
  }

  if (adminToken) {
    headers.Authorization = `Bearer ${adminToken}`;
  }

  return headers;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(buildApiUrl(url), {
    method,
    headers: buildHeaders(Boolean(data)),
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
    async ({ queryKey }) => {
      const res = await fetch(buildApiUrl(queryKey.join("/") as string), {
        headers: buildHeaders(false),
        credentials: "include",
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

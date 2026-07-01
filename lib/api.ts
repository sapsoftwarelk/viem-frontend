const DEFAULT_API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
const FALLBACK_API_BASE_URLS = ["http://localhost:5001/api"];
export const API_BASE_URL = DEFAULT_API_BASE_URL;
const AUTH_TOKEN_STORAGE_KEY = "sap-auth-token";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

let resolvedApiBaseUrl: string | null = null;

function getApiBaseUrls() {
  if (resolvedApiBaseUrl) {
    return [resolvedApiBaseUrl];
  }
  return [DEFAULT_API_BASE_URL, ...FALLBACK_API_BASE_URLS].filter(Boolean) as string[];
}

export function getStoredAuthToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
}

export function setStoredAuthToken(token?: string | null) {
  if (typeof window === "undefined") return;
  if (token) {
    window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
    return;
  }
  window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getStoredAuthToken();
  const headers: Record<string, string> = {
    ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const baseUrls = getApiBaseUrls();
  let lastError: unknown = null;

  for (const baseUrl of baseUrls) {
    try {
      const res = await fetch(`${baseUrl}${path}`, {
        ...options,
        headers,
        credentials: "include",
      });

      if (res.status === 204) {
        resolvedApiBaseUrl = baseUrl;
        return null;
      }

      const body = await res.json().catch(() => null);
      resolvedApiBaseUrl = baseUrl;
      if (!res.ok) {
        throw new ApiError(body?.message || body?.error || res.statusText || "API request failed", res.status);
      }
      return body;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new ApiError("API request failed", 0);
}

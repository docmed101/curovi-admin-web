import { getAdminToken, clearAdminToken } from "../auth";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5002/api";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function adminRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAdminToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}/admin${path}`, { ...options, headers });

  if (res.status === 401) {
    clearAdminToken();
    window.location.href = "/login";
    throw new ApiError(401, "Session expired");
  }

  const data = await res.json();
  if (!res.ok) throw new ApiError(res.status, data?.message || "Request failed");
  return data as T;
}

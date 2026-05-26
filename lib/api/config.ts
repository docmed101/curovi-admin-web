import { adminRequest } from "./client";

export interface AppConfig {
  id: number;
  key: string;
  value: string;
  app: "patient" | "provider" | "both";
  description?: string;
  updated_at: string;
}

export async function getConfig(): Promise<AppConfig[]> {
  const res = await adminRequest<{ data: AppConfig[] }>("/config");
  return res.data ?? [];
}

export async function updateConfig(
  key: string,
  value: string
): Promise<void> {
  await adminRequest(`/config/${key}`, {
    method: "PUT",
    body: JSON.stringify({ value }),
  });
}

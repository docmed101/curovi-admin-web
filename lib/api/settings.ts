import { adminRequest } from "./client";

export interface OrgSetting {
  id: number;
  key: string;
  value: string;
  label: string;
  description?: string;
  group: "email" | "billing" | "general";
  is_secret: boolean;
}

export async function getSettings(): Promise<OrgSetting[]> {
  const res = await adminRequest<{ data: OrgSetting[] }>("/settings");
  return res.data ?? [];
}

export async function updateSetting(key: string, value: string): Promise<void> {
  await adminRequest(`/settings/${key}`, {
    method: "PUT",
    body: JSON.stringify({ value }),
  });
}

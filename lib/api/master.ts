import { adminRequest } from "./client";

export interface MasterRow {
  id: number;
  name: string;
  status: 0 | 1;
  [key: string]: unknown; // table-specific extra fields (category, state, etc.)
}

export async function getMasterRows(table: string): Promise<MasterRow[]> {
  const res = await adminRequest<{ data: MasterRow[] }>(`/master/${table}`);
  return res.data ?? [];
}

export async function createMasterRow(
  table: string,
  payload: Record<string, unknown>
): Promise<void> {
  await adminRequest(`/master/${table}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateMasterRow(
  table: string,
  id: number,
  payload: Record<string, unknown>
): Promise<void> {
  await adminRequest(`/master/${table}/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function toggleMasterRow(
  table: string,
  id: number,
  status: 0 | 1
): Promise<void> {
  await adminRequest(`/master/${table}/${id}`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
}

export async function deleteMasterRow(
  table: string,
  id: number
): Promise<void> {
  await adminRequest(`/master/${table}/${id}`, { method: "DELETE" });
}

import { adminRequest } from "./client";

export interface LabTestRow {
  id: string;
  name: string;
  category_id: string;
  description: string | null;
  price: number;
  discounted_price: number | null;
  discount_percent: number | null;
  parameters: number;
  fasting: boolean;
  report_time: string | null;
  sample_type: string;
  prescription_required: boolean;
  popular: boolean;
  is_common: boolean;
  includes: string[];
  icon: string | null;
  display_order: number;
  status: number;
  pricing_control: "curovi_controlled" | "lab_price_allowed";
  lab_payout: number | null;
  curovi_fee: number | null;
  home_collection_charge: number | null;
}

export interface LabTestCategoryRow {
  id: string;
  name: string;
  icon: string | null;
  description: string | null;
  test_count: number;
  display_order: number;
  service_type: "lab" | "scan" | "package";
}

export async function getLabTests(): Promise<LabTestRow[]> {
  const res = await adminRequest<{ data: LabTestRow[] }>("/master/lab-tests");
  return res.data ?? [];
}

export async function createLabTest(payload: Record<string, unknown>): Promise<void> {
  await adminRequest("/master/lab-tests", { method: "POST", body: JSON.stringify(payload) });
}

export async function updateLabTest(id: string, payload: Record<string, unknown>): Promise<void> {
  await adminRequest(`/master/lab-tests/${id}`, { method: "PUT", body: JSON.stringify(payload) });
}

export async function deleteLabTest(id: string): Promise<void> {
  await adminRequest(`/master/lab-tests/${id}`, { method: "DELETE" });
}

export async function getLabTestCategories(): Promise<LabTestCategoryRow[]> {
  const res = await adminRequest<{ data: LabTestCategoryRow[] }>("/lab-test-categories");
  return res.data ?? [];
}

export async function createLabTestCategory(payload: Record<string, unknown>): Promise<void> {
  await adminRequest("/master/lab-test-categories", { method: "POST", body: JSON.stringify(payload) });
}

export async function updateLabTestCategory(id: string, payload: Record<string, unknown>): Promise<void> {
  await adminRequest(`/master/lab-test-categories/${id}`, { method: "PUT", body: JSON.stringify(payload) });
}

export async function deleteLabTestCategory(id: string): Promise<void> {
  await adminRequest(`/master/lab-test-categories/${id}`, { method: "DELETE" });
}

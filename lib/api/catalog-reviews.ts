import { adminRequest } from "./client";

export type CatalogItemStatus = "draft" | "pending_review" | "approved" | "rejected";

export interface CatalogItem {
  id: number;
  provider_id: number;
  master_test_id: string | null;
  type: "lab_test" | "scan";
  name: string;
  short_name: string | null;
  category: string | null;
  sub_category: string | null;
  description: string | null;
  sample_type: string | null;
  body_part: string | null;
  report_time: string | null;
  preparation_instructions: string | null;
  is_fasting_required: boolean;
  home_collection_available: boolean;
  units: string | null;
  age_gender: string | null;
  is_contrast_required: boolean;
  pricing_control: "curovi_controlled" | "lab_price_allowed";
  mrp: number | null;
  selling_price: number | null;
  home_collection_price: number | null;
  discount_percentage: number | null;
  lab_payout: number | null;
  curovi_fee: number | null;
  patient_price: number | null;
  turnaround_note: string | null;
  is_active: boolean;
  status: CatalogItemStatus;
  is_custom: boolean;
  rejection_reason: string | null;
  reviewed_at: string | null;
  reviewed_by: number | null;
  createdAt: string;
  updatedAt: string;
  provider?: {
    id: number;
    name: string;
    mobile: string;
    type: string;
    email?: string;
    fcm_token?: string;
  };
}

export function formatDate(iso: string | undefined | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export async function getCatalogItems(params?: {
  status?: string;
  provider_id?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{ data: CatalogItem[]; total: number }> {
  const qs = new URLSearchParams(
    Object.entries(params ?? {}).filter(([, v]) => v !== undefined && v !== "") as [string, string][]
  ).toString();
  return adminRequest(`/catalog-items${qs ? `?${qs}` : ""}`);
}

export async function getCatalogItem(id: number | string): Promise<CatalogItem> {
  const res = await adminRequest<{ data: CatalogItem }>(`/catalog-items/${id}`);
  return res.data;
}

export async function reviewCatalogItem(
  id: number,
  action: "approve" | "reject",
  reason?: string
): Promise<{ review_status: string; message: string }> {
  return adminRequest(`/catalog-items/${id}/review`, {
    method: "PATCH",
    body: JSON.stringify({ action, reason }),
  });
}

export async function bulkReviewCatalogItems(
  ids: number[],
  action: "approve" | "reject",
  reason?: string
): Promise<{ message: string; count: number }> {
  return adminRequest(`/catalog-items/bulk-review`, {
    method: "PATCH",
    body: JSON.stringify({ ids, action, reason }),
  });
}

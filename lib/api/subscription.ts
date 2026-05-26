import { adminRequest } from "./client";

export interface SubscriptionPlan {
  id: number;
  tier: string;
  provider_type: "doctor" | "lab" | "pharmacy";
  name: string;
  monthly_price: number;
  yearly_price: number;
  features: string[];
  is_active: boolean;
  sort_order: number;
}

export interface SubscriptionCoupon {
  id: number;
  code: string;
  description?: string;
  discount_type: "percentage" | "flat" | "months_free";
  discount_value: number;
  applicable_tiers: string[] | null;
  applicable_provider_types: string[] | null;   // null = all types
  allowed_phones: string[] | null;              // null = anyone
  min_amount: number;
  max_uses: number | null;
  used_count: number;
  valid_from: string | null;
  expires_at: string | null;
  is_active: boolean;
  createdAt: string;
}

// ── Plans ─────────────────────────────────────────────────────────────────────

export async function getPlans(): Promise<SubscriptionPlan[]> {
  const res = await adminRequest<{ data: SubscriptionPlan[] }>("/subscription-plans");
  return res.data ?? [];
}

export async function createPlan(body: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> {
  const res = await adminRequest<{ data: SubscriptionPlan }>("/subscription-plans", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return res.data;
}

export async function updatePlan(id: number, body: Partial<SubscriptionPlan>): Promise<void> {
  await adminRequest(`/subscription-plans/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function deletePlan(id: number): Promise<void> {
  await adminRequest(`/subscription-plans/${id}`, { method: "DELETE" });
}

// ── Coupons ───────────────────────────────────────────────────────────────────

export async function getCoupons(): Promise<SubscriptionCoupon[]> {
  const res = await adminRequest<{ data: SubscriptionCoupon[] }>("/subscription-coupons");
  return res.data ?? [];
}

export async function createCoupon(body: Partial<SubscriptionCoupon>): Promise<SubscriptionCoupon> {
  const res = await adminRequest<{ data: SubscriptionCoupon }>("/subscription-coupons", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return res.data;
}

export async function updateCoupon(id: number, body: Partial<SubscriptionCoupon>): Promise<void> {
  await adminRequest(`/subscription-coupons/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function deleteCoupon(id: number): Promise<void> {
  await adminRequest(`/subscription-coupons/${id}`, { method: "DELETE" });
}

import { adminRequest } from "./client";

export type ReviewStatus = "pending" | "approved" | "rejected" | null;

export interface ProviderProfile {
  // Doctor / Hospital
  hospital_name?: string;
  specialty?: string;
  sub_specialty?: string;
  qualification?: string;
  medical_reg_number?: string;
  reg_council?: string;
  years_experience?: number;
  gender?: string;
  practice_type?: string;
  appointment_type?: string;
  consultation_fee?: number;
  walk_in_fee?: number;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  languages?: string[];
  photo?: string;
  rating?: number;
  total_patients?: number;
  // Lab
  lab_name?: string;
  lab_type?: string;
  registration_number?: string;
  owner_name?: string;
  phone?: string;
  services?: string[];
  home_collection?: boolean;
  nabl?: boolean;
  cap?: boolean;
  morning_open?: string;
  evening_close?: string;
  report_delivery?: string;
  // Pharmacy
  shop_name?: string;
  license_number?: string;
  gst_number?: string;
  emergency_contact?: string;
  operating_hours?: string;
  has_delivery?: boolean;
  // Shared
  email?: string;
}

export interface AdminProvider {
  id: number;
  provider_uid?: string;
  name: string;
  mobile: string;
  email?: string;
  type: string;
  profile_status: string;
  subscription_tier: string;
  subscription_expires_at?: string | null;
  trial_expires_at?: string | null;
  review_status: ReviewStatus;
  status: number;
  doctor_id?: number | null;
  // Banking (shown to super_admin only)
  bank_account_holder?: string;
  bank_name?: string;
  bank_account_number?: string;
  bank_account_type?: string;
  bank_ifsc?: string;
  bank_branch?: string;
  bank_upi_id?: string;
  pan_number?: string;
  city?: string;
  createdAt: string;
  updatedAt: string;
  // List-level virtual fields from backend join
  profile_name?: string;
  profile_city?: string;
  specialty?: string;
  // Detail-level nested profile
  profile?: ProviderProfile | null;
}

export interface AdminStaff {
  id: number;
  name: string;
  mobile: string;
  email?: string;
  role: string;
  status: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function isActive(p: AdminProvider): boolean {
  return p.status === 1;
}

export function formatDate(iso: string | undefined | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function subscriptionLabel(p: AdminProvider): string {
  const tier = p.subscription_tier ?? "basic";
  if (tier === "basic" && !p.subscription_expires_at) return "Basic (Free)";
  if (p.subscription_expires_at) {
    const exp = new Date(p.subscription_expires_at);
    if (!isNaN(exp.getTime())) {
      const expired = exp < new Date();
      return `${tier} · ${expired ? "Expired" : "Until"} ${exp.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`;
    }
  }
  return tier;
}

/** Display name for a provider in the list (clinic/lab/pharmacy name or fallback to mobile) */
export function providerDisplayName(p: AdminProvider): string {
  return p.profile_name || p.name || p.mobile;
}

// ── API ───────────────────────────────────────────────────────────────────────

export async function getProviders(params?: {
  type?: string;
  status?: string;
  review_status?: string;
  q?: string;
}): Promise<AdminProvider[]> {
  const qs = new URLSearchParams(
    Object.entries(params ?? {}).filter(([, v]) => v) as [string, string][]
  ).toString();
  const res = await adminRequest<{ data: AdminProvider[] }>(
    `/providers${qs ? `?${qs}` : ""}`
  );
  return res.data ?? [];
}

export interface DoctorRecord {
  id: number;
  doctor_uid?: string;
  name: string;
  specialty?: string;
  status: number;
  hospital_name?: string;
  city?: string;
  address?: string;
  consultation_fee?: number;
  walk_in_fee?: number;
  rating?: number;
  [key: string]: unknown;
}

export interface PatientAppDiagnostic {
  visible: boolean;
  doctor_id?: number;
  doctor_uid?: string;
  specialty_in_db?: string | null;
  doctor_status?: number;
  issues: string[];
}

export async function getProvider(id: number | string): Promise<AdminProvider & {
  doctor_record?: DoctorRecord | null;
  patient_app_diagnostic?: PatientAppDiagnostic | null;
}> {
  const res = await adminRequest<{ data: AdminProvider & {
    doctor_record?: DoctorRecord | null;
    patient_app_diagnostic?: PatientAppDiagnostic | null;
  } }>(`/providers/${id}`);
  return res.data;
}

export async function patchDoctorRecord(
  providerId: number | string,
  updates: Partial<{ specialty: string; status: number; consultation_fee: number; walk_in_fee: number; hospital_name: string; city: string; address: string }>
): Promise<void> {
  await adminRequest(`/providers/${providerId}/doctor`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}

export async function updateProviderStatus(id: number, active: boolean): Promise<void> {
  await adminRequest(`/providers/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status: active ? 1 : 0 }),
  });
}

export async function reviewProvider(
  id: number,
  action: "approve" | "reject",
  reason?: string
): Promise<{ review_status: ReviewStatus; message: string }> {
  const res = await adminRequest<{ review_status: ReviewStatus; message: string }>(
    `/providers/${id}/review`,
    { method: "PATCH", body: JSON.stringify({ action, reason }) }
  );
  return res;
}

export async function blockProvider(id: number): Promise<{ message: string }> {
  return adminRequest(`/providers/${id}/block`, { method: "POST" });
}

export async function unblockProvider(id: number): Promise<{ message: string }> {
  return adminRequest(`/providers/${id}/unblock`, { method: "POST" });
}

export async function resetProviderSession(id: number): Promise<{ message: string }> {
  return adminRequest(`/providers/${id}/reset-session`, { method: "POST" });
}

export async function deleteProvider(id: number): Promise<{ message: string }> {
  return adminRequest(`/providers/${id}`, { method: "DELETE" });
}

export async function updateProviderTrial(id: number | string, trialExpiresAt: string | null): Promise<void> {
  await adminRequest(`/providers/${id}/trial`, {
    method: "PATCH",
    body: JSON.stringify({ trial_expires_at: trialExpiresAt }),
  });
}

// ── Staff ─────────────────────────────────────────────────────────────────────

export async function getProviderStaff(providerId: number): Promise<AdminStaff[]> {
  const res = await adminRequest<{ staff: AdminStaff[] }>(`/providers/${providerId}/staff`);
  return res.staff ?? [];
}

export async function updateStaffRole(providerId: number, staffId: number, role: string): Promise<void> {
  await adminRequest(`/providers/${providerId}/staff/${staffId}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
}

export async function updateStaffStatus(providerId: number, staffId: number, status: "active" | "inactive"): Promise<void> {
  await adminRequest(`/providers/${providerId}/staff/${staffId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function removeStaff(providerId: number, staffId: number): Promise<void> {
  await adminRequest(`/providers/${providerId}/staff/${staffId}`, { method: "DELETE" });
}

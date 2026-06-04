"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Loader2, ShieldOff, ShieldCheck,
  CheckCircle, XCircle, Clock, CreditCard, RefreshCw,
  Trash2, Users, Building2, FlaskConical, Pill, Pencil,
} from "lucide-react";
import {
  getProvider, blockProvider, unblockProvider, resetProviderSession,
  deleteProvider, reviewProvider, getProviderStaff, patchDoctorRecord,
  updateStaffRole, updateStaffStatus, removeStaff, updateProviderTrial,
  isActive, formatDate, subscriptionLabel, providerDisplayName,
  type AdminProvider, type AdminStaff, type DoctorRecord, type PatientAppDiagnostic,
} from "@/lib/api/providers";
import { getAdminToken } from "@/lib/auth";

function getAdminRole(): string | null {
  try {
    const token = getAdminToken();
    if (!token) return null;
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return (decoded as { role?: string }).role ?? null;
  } catch { return null; }
}

const REVIEW_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  pending:  { bg: "bg-amber-50",  text: "text-amber-700",  label: "Pending Review" },
  approved: { bg: "bg-green-50",  text: "text-green-700",  label: "Approved" },
  rejected: { bg: "bg-red-50",    text: "text-red-700",    label: "Rejected" },
};

const STAFF_ROLES = ["admin", "doctor", "nurse", "frontdesk"];

function Row({ label, value }: { label: string; value?: string | number | boolean | null }) {
  if (value === undefined || value === null || value === "") return null;
  const display = typeof value === "boolean" ? (value ? "Yes" : "No") : String(value);
  return (
    <div className="flex items-start px-5 py-3 gap-4 border-b border-gray-50 last:border-0">
      <span className="text-xs font-semibold text-gray-400 uppercase w-32 flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-gray-800 break-words">{display}</span>
    </div>
  );
}

function SectionCard({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100">
      <div className="px-5 py-3 flex items-center gap-2 border-b border-gray-50">
        {icon}
        <span className="font-semibold text-xs text-gray-500 uppercase tracking-wide">{title}</span>
      </div>
      {children}
    </div>
  );
}

export default function ProviderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [provider, setProvider] = useState<(AdminProvider & { doctor_record?: DoctorRecord | null; patient_app_diagnostic?: PatientAppDiagnostic | null }) | null>(null);
  const [staff, setStaff] = useState<AdminStaff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  // Trial period edit
  const [showTrialEdit, setShowTrialEdit] = useState(false);
  const [trialInput, setTrialInput] = useState("");
  const [trialBusy, setTrialBusy] = useState(false);
  // Doctor fix modal
  const [showFixDoctor, setShowFixDoctor] = useState(false);
  const [fixSpecialty, setFixSpecialty] = useState("");
  const [fixStatus, setFixStatus] = useState("1");
  const [fixBusy, setFixBusy] = useState(false);
  const router = useRouter();

  const adminRole = getAdminRole();
  const isSuperAdmin = adminRole === "super_admin";

  useEffect(() => {
    Promise.all([
      getProvider(id),                               // accepts UID string or numeric id
      getProviderStaff(Number(id)).catch(() => []),
    ])
      .then(([p, s]) => { setProvider(p); setStaff(s); })
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [id]);

  function flash(msg: string) {
    setActionMsg(msg);
    setTimeout(() => setActionMsg(null), 4000);
  }

  async function act(key: string, fn: () => Promise<{ message?: string }>) {
    setBusy(key);
    try {
      const res = await fn();
      flash(res.message ?? "Done");
      const fresh = await getProvider(id);
      setProvider(fresh);
    } catch (e) { flash(`Error: ${(e as Error).message}`); }
    finally { setBusy(null); }
  }

  async function handleFixDoctor() {
    if (!provider) return;
    setFixBusy(true);
    try {
      await patchDoctorRecord(id, {
        ...(fixSpecialty.trim() ? { specialty: fixSpecialty.trim() } : {}),
        status: Number(fixStatus) as 0 | 1,
      });
      flash("Doctor record updated — patient app will reflect the change immediately");
      setShowFixDoctor(false);
      const fresh = await getProvider(id);
      setProvider(fresh);
    } catch (e) { flash(`Error: ${(e as Error).message}`); }
    finally { setFixBusy(false); }
  }

  async function handleApprove() {
    if (!provider || !confirm(`Approve ${providerDisplayName(provider)}? SMS will be sent.`)) return;
    await act("approve", () => reviewProvider(provider.id, "approve"));
  }

  async function handleReject() {
    if (!provider || !rejectReason.trim()) { alert("Reason required"); return; }
    await act("reject", () => reviewProvider(provider.id, "reject", rejectReason));
    setShowRejectModal(false);
    setRejectReason("");
  }

  async function handleBlock() {
    if (!provider || !confirm(`Block ${providerDisplayName(provider)}? All active sessions on mobile and web will be terminated immediately.`)) return;
    await act("block", () => blockProvider(provider.id));
  }

  async function handleUnblock() {
    if (!provider || !confirm(`Unblock ${providerDisplayName(provider)}?`)) return;
    await act("unblock", () => unblockProvider(provider.id));
  }

  async function handleResetSession() {
    if (!provider || !confirm(`Force re-login for all users of ${providerDisplayName(provider)}? They will not be blocked, just logged out.`)) return;
    await act("reset", () => resetProviderSession(provider.id));
  }

  async function handleDelete() {
    if (!provider || !confirm(`PERMANENTLY DELETE ${providerDisplayName(provider)}? This cannot be undone.`)) return;
    await act("delete", () => deleteProvider(provider.id));
    router.push("/providers");
  }

  async function handleStaffRole(s: AdminStaff, role: string) {
    await updateStaffRole(provider!.id, s.id, role);
    setStaff((prev) => prev.map((m) => m.id === s.id ? { ...m, role } : m));
  }

  async function handleStaffStatus(s: AdminStaff) {
    const next = s.status === "active" ? "inactive" : "active";
    await updateStaffStatus(provider!.id, s.id, next);
    setStaff((prev) => prev.map((m) => m.id === s.id ? { ...m, status: next } : m));
  }

  async function handleStaffRemove(s: AdminStaff) {
    if (!confirm(`Remove ${s.name} from this clinic?`)) return;
    await removeStaff(provider!.id, s.id);
    setStaff((prev) => prev.filter((m) => m.id !== s.id));
  }

  function toDatetimeLocal(iso: string | null | undefined): string {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    const offset = d.getTimezoneOffset();
    return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 16);
  }

  async function handleTrialSave() {
    if (!trialInput) return;
    setTrialBusy(true);
    try {
      await updateProviderTrial(id, new Date(trialInput).toISOString());
      flash("Trial period updated");
      setShowTrialEdit(false);
      const fresh = await getProvider(id);
      setProvider(fresh);
    } catch (e) { flash(`Error: ${(e as Error).message}`); }
    finally { setTrialBusy(false); }
  }

  async function handleTrialClear() {
    if (!confirm("Disable trial for this provider? They will lose free-trial access immediately.")) return;
    setTrialBusy(true);
    try {
      await updateProviderTrial(id, null);
      flash("Trial disabled");
      setShowTrialEdit(false);
      const fresh = await getProvider(id);
      setProvider(fresh);
    } catch (e) { flash(`Error: ${(e as Error).message}`); }
    finally { setTrialBusy(false); }
  }

  if (loading) return <div className="flex justify-center pt-20"><Loader2 className="animate-spin text-indigo-600" size={24} /></div>;
  if (error || !provider) return <p className="text-red-600 text-sm text-center pt-20">{error || "Not found"}</p>;

  const active = isActive(provider);
  const reviewStyle = provider.review_status ? REVIEW_STYLES[provider.review_status] : null;
  const subExpiry = provider.subscription_expires_at ? new Date(provider.subscription_expires_at) : null;
  const subExpired = subExpiry ? subExpiry < new Date() : false;
  const prof = provider.profile;

  return (
    <>
      <div className="flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-3 border-b border-gray-200 bg-white flex-wrap">
          <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-700 transition-colors">
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-gray-900 truncate">
              {providerDisplayName(provider)}
              {provider.profile?.specialty && <span className="ml-2 text-xs font-normal text-gray-400">{provider.profile.specialty}</span>}
            </h1>
            <p className="text-xs text-gray-400">{provider.provider_uid} · +91 {provider.mobile}</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {actionMsg && (
              <span className="text-xs px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 font-medium">{actionMsg}</span>
            )}

            {/* Approve / Reject — pending + super_admin only */}
            {isSuperAdmin && provider.review_status === "pending" && (
              <>
                <button onClick={handleApprove} disabled={!!busy}
                  className="flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-xl bg-green-600 text-white hover:bg-green-700 disabled:opacity-60 transition-colors">
                  {busy === "approve" ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />} Approve
                </button>
                <button onClick={() => setShowRejectModal(true)} disabled={!!busy}
                  className="flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 disabled:opacity-60 transition-colors">
                  <XCircle size={13} /> Reject
                </button>
              </>
            )}

            {/* Block / Unblock */}
            {active ? (
              <button onClick={handleBlock} disabled={!!busy}
                className="flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-60 transition-colors">
                {busy === "block" ? <Loader2 size={13} className="animate-spin" /> : <ShieldOff size={13} />} Block
              </button>
            ) : (
              <button onClick={handleUnblock} disabled={!!busy}
                className="flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-xl bg-green-50 text-green-600 hover:bg-green-100 disabled:opacity-60 transition-colors">
                {busy === "unblock" ? <Loader2 size={13} className="animate-spin" /> : <ShieldCheck size={13} />} Unblock
              </button>
            )}

            {/* Reset sessions */}
            {active && (
              <button onClick={handleResetSession} disabled={!!busy}
                className="flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-100 disabled:opacity-60 transition-colors">
                {busy === "reset" ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />} Reset Session
              </button>
            )}

            {/* Delete — super_admin only */}
            {isSuperAdmin && (
              <button onClick={handleDelete} disabled={!!busy}
                className="flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-xl bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-60 transition-colors">
                {busy === "delete" ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />} Delete
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto px-6 py-6 space-y-5">
          {/* Review banner */}
          {reviewStyle && (
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${reviewStyle.bg}`}>
              {provider.review_status === "pending"  && <Clock       size={16} className={reviewStyle.text} />}
              {provider.review_status === "approved" && <CheckCircle size={16} className={reviewStyle.text} />}
              {provider.review_status === "rejected" && <XCircle     size={16} className={reviewStyle.text} />}
              <span className={`text-sm font-semibold ${reviewStyle.text}`}>
                {reviewStyle.label}
                {provider.review_status === "pending"  && " — awaiting your approval"}
                {provider.review_status === "approved" && " — clinic has full access"}
                {provider.review_status === "rejected" && " — provider was notified via SMS"}
              </span>
              {!active && <span className="ml-auto text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-semibold">Blocked</span>}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Account Details */}
            <SectionCard title="Account" icon={<Building2 size={14} className="text-indigo-500" />}>
              <Row label="UID"           value={provider.provider_uid} />
              <Row label="Mobile"        value={`+91 ${provider.mobile}`} />
              <Row label="Email"         value={provider.email} />
              <Row label="Type"          value={provider.type} />
              <Row label="Profile"       value={provider.profile_status} />
              <Row label="Joined"        value={formatDate(provider.createdAt)} />
              <div className="flex items-start px-5 py-3 gap-4">
                <span className="text-xs font-semibold text-gray-400 uppercase w-32 flex-shrink-0">Account</span>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                  {active ? "Active" : "Blocked"}
                </span>
              </div>
            </SectionCard>

            {/* Subscription */}
            <SectionCard title="Subscription" icon={<CreditCard size={14} className="text-indigo-500" />}>
              <Row label="Plan"    value={provider.subscription_tier} />
              <Row label="Expiry"  value={subExpiry ? `${subExpired ? "Expired" : "Valid until"} ${subExpiry.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}` : "—"} />
              <div className="flex items-start px-5 py-3 gap-4 border-b border-gray-50">
                <span className="text-xs font-semibold text-gray-400 uppercase w-32 flex-shrink-0">Status</span>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${subExpired ? "bg-red-100 text-red-700" : provider.subscription_tier !== "basic" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                  {subExpired ? "Expired" : provider.subscription_tier !== "basic" ? "Active" : "Free"}
                </span>
              </div>
              {provider.subscription_tier === "discovery" && (
                <div className="flex items-start px-5 py-3 gap-4 border-b border-gray-50">
                  <span className="text-xs font-semibold text-gray-400 uppercase w-32 flex-shrink-0 pt-0.5">Trial Expires</span>
                  {!showTrialEdit ? (
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-sm text-gray-800">
                        {provider.trial_expires_at
                          ? formatDate(provider.trial_expires_at)
                          : <span className="text-gray-400">Not set</span>}
                      </span>
                      <button
                        onClick={() => { setTrialInput(toDatetimeLocal(provider.trial_expires_at)); setShowTrialEdit(true); }}
                        className="ml-1 text-gray-400 hover:text-indigo-600 transition-colors"
                        title="Edit trial period"
                      >
                        <Pencil size={12} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 flex-1">
                      <input
                        type="datetime-local"
                        value={trialInput}
                        onChange={(e) => setTrialInput(e.target.value)}
                        className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-indigo-400 w-full max-w-xs"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleTrialSave}
                          disabled={trialBusy || !trialInput}
                          className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
                        >
                          {trialBusy ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle size={11} />} Save
                        </button>
                        <button
                          onClick={handleTrialClear}
                          disabled={trialBusy}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-60"
                        >
                          Disable
                        </button>
                        <button
                          onClick={() => setShowTrialEdit(false)}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg text-gray-500 hover:bg-gray-100"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div className="px-5 py-3"><p className="text-xs text-gray-400">{subscriptionLabel(provider)}</p></div>
            </SectionCard>

            {/* Doctor / Hospital Profile */}
            {(provider.type === "doctor" || provider.type === "hospital") && prof && (
              <SectionCard title="Clinical Profile" icon={<Building2 size={14} className="text-cyan-500" />}>
                <Row label="Clinic Name"     value={prof.hospital_name} />
                <Row label="Specialty"       value={prof.specialty} />
                <Row label="Sub-specialty"   value={prof.sub_specialty} />
                <Row label="Qualification"   value={prof.qualification} />
                <Row label="Medical Reg No." value={prof.medical_reg_number} />
                <Row label="Council"         value={prof.reg_council} />
                <Row label="Experience"      value={prof.years_experience ? `${prof.years_experience} years` : null} />
                <Row label="Gender"          value={prof.gender} />
                <Row label="Practice Type"   value={prof.practice_type} />
                <Row label="Appointment"     value={prof.appointment_type} />
                <Row label="Consult Fee"     value={prof.consultation_fee ? `₹${prof.consultation_fee}` : null} />
                <Row label="Walk-in Fee"     value={prof.walk_in_fee ? `₹${prof.walk_in_fee}` : null} />
                <Row label="Address"         value={prof.address} />
                <Row label="City"            value={prof.city} />
                <Row label="Pincode"         value={prof.pincode} />
                <Row label="Languages"       value={Array.isArray(prof.languages) ? prof.languages.join(", ") : prof.languages} />
                {prof.rating != null && <Row label="Rating" value={`${prof.rating} ★ (${prof.total_patients ?? 0} patients)`} />}
              </SectionCard>
            )}

            {/* Lab Profile */}
            {provider.type === "lab" && prof && (
              <SectionCard title="Lab Profile" icon={<FlaskConical size={14} className="text-emerald-500" />}>
                <Row label="Lab Name"         value={prof.lab_name} />
                <Row label="Lab Type"         value={prof.lab_type} />
                <Row label="Reg. Number"      value={prof.registration_number} />
                <Row label="Owner Name"       value={prof.owner_name} />
                <Row label="Email"            value={prof.email} />
                <Row label="Phone"            value={prof.phone} />
                <Row label="Address"          value={prof.address} />
                <Row label="City"             value={prof.city} />
                <Row label="State"            value={prof.state} />
                <Row label="Pincode"          value={prof.pincode} />
                <Row label="Services"         value={Array.isArray(prof.services) && prof.services.length ? prof.services.join(", ") : null} />
                <Row label="Home Collection"  value={prof.home_collection} />
                <Row label="NABL Accredited"  value={prof.nabl} />
                <Row label="CAP Certified"    value={prof.cap} />
                <Row label="Opening Hours"    value={prof.morning_open ? `${prof.morning_open} – ${prof.evening_close}` : null} />
                <Row label="Report Delivery"  value={prof.report_delivery} />
              </SectionCard>
            )}

            {/* Pharmacy Profile */}
            {provider.type === "pharmacy" && prof && (
              <SectionCard title="Pharmacy Profile" icon={<Pill size={14} className="text-amber-500" />}>
                <Row label="Pharmacy Name"   value={prof.shop_name} />
                <Row label="Owner Name"      value={prof.owner_name} />
                <Row label="Drug License"    value={prof.license_number} />
                <Row label="GST Number"      value={prof.gst_number} />
                <Row label="Phone"           value={prof.phone} />
                <Row label="Emergency"       value={prof.emergency_contact} />
                <Row label="Address"         value={prof.address} />
                <Row label="City"            value={prof.city} />
                <Row label="State"           value={prof.state} />
                <Row label="Pincode"         value={prof.pincode} />
                <Row label="Hours"           value={prof.operating_hours} />
                <Row label="Home Delivery"   value={prof.has_delivery} />
              </SectionCard>
            )}

            {/* No profile yet */}
            {!prof && provider.profile_status !== "complete" && (
              <div className="bg-amber-50 rounded-2xl border border-amber-100 px-5 py-4 text-sm text-amber-700">
                Profile not yet completed by the provider.
              </div>
            )}

            {/* Banking Details — super_admin only */}
            {isSuperAdmin && (
              <SectionCard title="Banking Details" icon={<CreditCard size={14} className="text-gray-400" />}>
                {provider.bank_account_number ? (
                  <>
                    <Row label="Account Holder" value={provider.bank_account_holder} />
                    <Row label="Bank Name"       value={provider.bank_name} />
                    <Row label="Account No."     value={provider.bank_account_number ? `****${provider.bank_account_number.slice(-4)}` : null} />
                    <Row label="Account Type"    value={provider.bank_account_type} />
                    <Row label="IFSC"            value={provider.bank_ifsc} />
                    <Row label="Branch"          value={provider.bank_branch} />
                    <Row label="UPI ID"          value={provider.bank_upi_id} />
                    <Row label="PAN"             value={provider.pan_number} />
                  </>
                ) : (
                  <div className="px-5 py-4 text-xs text-gray-400">No banking details added yet</div>
                )}
              </SectionCard>
            )}
          </div>

          {/* ── Patient App Diagnostic ──────────────────────────────────── */}
          {provider.patient_app_diagnostic && (
            <div className={`rounded-2xl border ${provider.patient_app_diagnostic.visible ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
              <div className="px-5 py-3 flex items-center gap-2 border-b border-black/5">
                <span className={`text-sm font-bold ${provider.patient_app_diagnostic.visible ? "text-green-700" : "text-red-700"}`}>
                  {provider.patient_app_diagnostic.visible ? "✓ Visible in patient app" : "✗ NOT visible in patient app"}
                </span>
                {!provider.patient_app_diagnostic.visible && isSuperAdmin && provider.doctor_record && (
                  <button
                    onClick={() => {
                      setFixSpecialty(provider.patient_app_diagnostic?.specialty_in_db ?? "");
                      setFixStatus(String(provider.patient_app_diagnostic?.doctor_status ?? 1));
                      setShowFixDoctor(true);
                    }}
                    className="ml-auto text-xs font-semibold px-3 py-1 rounded-lg bg-red-600 text-white hover:bg-red-700"
                  >
                    Fix Doctor Record
                  </button>
                )}
              </div>
              <div className="px-5 py-3 space-y-1.5">
                {provider.patient_app_diagnostic.issues.length > 0 ? (
                  provider.patient_app_diagnostic.issues.map((issue, i) => (
                    <p key={i} className="text-sm text-red-700 flex gap-2">
                      <span className="font-bold flex-shrink-0">→</span> {issue}
                    </p>
                  ))
                ) : (
                  <p className="text-sm text-green-700">Doctor record is healthy. Specialty: <strong>{provider.patient_app_diagnostic.specialty_in_db}</strong></p>
                )}

                {/* Doctor record summary */}
                {provider.doctor_record && (
                  <div className="mt-3 pt-3 border-t border-black/10 grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-gray-600">
                    <span><strong>Doctor UID:</strong> {provider.doctor_record.doctor_uid ?? "—"}</span>
                    <span><strong>Status:</strong> {provider.doctor_record.status === 1 ? "Active (1)" : `Inactive (${provider.doctor_record.status})`}</span>
                    <span><strong>Specialty:</strong> {provider.doctor_record.specialty || <em className="text-red-500">empty</em>}</span>
                    <span><strong>Hospital:</strong> {provider.doctor_record.hospital_name || "—"}</span>
                    <span><strong>City:</strong> {provider.doctor_record.city || "—"}</span>
                    <span><strong>Fee:</strong> {provider.doctor_record.consultation_fee ? `₹${provider.doctor_record.consultation_fee}` : "—"}</span>
                  </div>
                )}

                {!provider.doctor_record && !provider.patient_app_diagnostic.visible && (
                  <p className="mt-2 text-xs text-red-500">
                    Ask the provider to complete their profile setup in the provider app, or use the &quot;Save Basic Profile&quot; screen.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Staff Members */}
          <div className="bg-white rounded-2xl border border-gray-100">
            <div className="px-5 py-3 flex items-center gap-2 border-b border-gray-50">
              <Users size={14} className="text-indigo-500" />
              <span className="font-semibold text-xs text-gray-500 uppercase tracking-wide">Staff Members</span>
              <span className="ml-auto text-xs text-gray-400">{staff.length} members</span>
            </div>
            {staff.length === 0 ? (
              <div className="px-5 py-6 text-xs text-gray-400 text-center">No staff added yet</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs text-gray-500 font-semibold uppercase">
                    <th className="px-5 py-2.5 text-left">Name</th>
                    <th className="px-5 py-2.5 text-left">Mobile</th>
                    <th className="px-5 py-2.5 text-left">Role</th>
                    <th className="px-5 py-2.5 text-left">Status</th>
                    <th className="px-5 py-2.5 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {staff.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3 font-medium text-gray-900">{s.name}</td>
                      <td className="px-5 py-3 text-gray-500">+91 {s.mobile}</td>
                      <td className="px-5 py-3">
                        <select
                          value={s.role}
                          onChange={(e) => handleStaffRole(s, e.target.value)}
                          className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:border-indigo-400"
                        >
                          {STAFF_ROLES.map((r) => (
                            <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${s.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 flex gap-3">
                        <button
                          onClick={() => handleStaffStatus(s)}
                          className={`text-xs font-medium hover:underline ${s.status === "active" ? "text-red-500" : "text-green-600"}`}
                        >
                          {s.status === "active" ? "Block" : "Activate"}
                        </button>
                        <button
                          onClick={() => handleStaffRemove(s)}
                          className="text-xs font-medium text-gray-400 hover:text-red-500"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Fix Doctor Record modal */}
      {showFixDoctor && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-base font-bold text-gray-900 mb-1">Fix Doctor Record</h2>
            <p className="text-sm text-gray-500 mb-4">
              Update the doctor record linked to {provider?.provider_uid}. Changes are immediate — no app restart needed.
            </p>
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Specialty (must match patient app filter exactly, e.g. &quot;General Physician&quot;)
                </label>
                <input
                  value={fixSpecialty}
                  onChange={(e) => setFixSpecialty(e.target.value)}
                  placeholder="e.g. General Physician, Cardiologist, ENT Specialist"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  Patient app tiles use: General Physician · Pediatrician · Gynecologist · Dermatologist · ENT Specialist · Cardiologist
                </p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Doctor Status</label>
                <select
                  value={fixStatus}
                  onChange={(e) => setFixStatus(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
                >
                  <option value="1">1 — Active (visible to patients)</option>
                  <option value="0">0 — Inactive (hidden from patients)</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowFixDoctor(false)}
                className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl">
                Cancel
              </button>
              <button onClick={handleFixDoctor} disabled={fixBusy}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-60">
                {fixBusy ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
                Apply Fix
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-base font-bold text-gray-900 mb-1">Reject Provider</h2>
            <p className="text-sm text-gray-500 mb-4">
              SMS will be sent to {providerDisplayName(provider)} (+91{provider.mobile}) with the rejection reason.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection (required)…"
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-red-400 resize-none mb-4"
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => { setShowRejectModal(false); setRejectReason(""); }}
                className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                Cancel
              </button>
              <button onClick={handleReject} disabled={!!busy || !rejectReason.trim()}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-60">
                {busy === "reject" ? <Loader2 size={13} className="animate-spin" /> : <XCircle size={13} />}
                Send Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

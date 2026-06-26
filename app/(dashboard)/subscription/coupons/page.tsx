"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Pencil, Trash2, Check, X } from "lucide-react";
import {
  getCoupons, createCoupon, updateCoupon, deleteCoupon,
  type SubscriptionCoupon,
} from "@/lib/api/subscription";

const BLANK: Partial<SubscriptionCoupon> = {
  code: "", description: "", discount_type: "percentage", discount_value: 0,
  applicable_tiers: null, applicable_provider_types: null, allowed_phones: null,
  min_amount: 0, max_uses: null, valid_from: null, expires_at: null, is_active: true,
};

function badge(active: boolean, expired: boolean) {
  if (!active) return "bg-gray-100 text-gray-500";
  if (expired)  return "bg-red-50 text-red-600";
  return "bg-green-50 text-green-700";
}

function statusLabel(coupon: SubscriptionCoupon) {
  if (!coupon.is_active) return "Disabled";
  const today = new Date().toISOString().slice(0, 10);
  if (coupon.expires_at && coupon.expires_at < today) return "Expired";
  if (coupon.max_uses && coupon.used_count >= coupon.max_uses) return "Exhausted";
  return "Active";
}

export default function CouponsPage() {
  const [coupons, setCoupons]   = useState<SubscriptionCoupon[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [editId, setEditId]     = useState<number | "new" | null>(null);
  const [form, setForm]         = useState<Partial<SubscriptionCoupon>>(BLANK);
  const [saving, setSaving]     = useState(false);
  const [tiersInput, setTiersInput]   = useState("");
  const [phonesInput, setPhonesInput] = useState("");
  const [providerTypes, setProviderTypes] = useState<string[]>([]);

  async function load() {
    setLoading(true);
    try { setCoupons(await getCoupons()); }
    catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function openNew() {
    setForm({ ...BLANK }); setTiersInput(""); setPhonesInput(""); setProviderTypes([]);
    setEditId("new");
  }

  function openEdit(c: SubscriptionCoupon) {
    setForm({ ...c });
    setTiersInput((c.applicable_tiers ?? []).join(", "));
    setPhonesInput((c.allowed_phones ?? []).join(", "));
    setProviderTypes(c.applicable_provider_types ?? []);
    setEditId(c.id);
  }

  function parseList(raw: string): string[] | null {
    const list = raw.split(",").map((s) => s.trim()).filter(Boolean);
    return list.length > 0 ? list : null;
  }

  function toggleType(t: string) {
    setProviderTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  }

  async function handleSave() {
    setSaving(true);
    try {
      const body = {
        ...form,
        applicable_tiers: parseList(tiersInput),
        applicable_provider_types: providerTypes.length > 0 ? providerTypes : null,
        allowed_phones: parseList(phonesInput),
      };
      if (editId === "new") {
        const created = await createCoupon(body);
        setCoupons((c) => [created, ...c]);
      } else {
        await updateCoupon(editId as number, body);
        setCoupons((c) => c.map((r) => (r.id === editId ? { ...r, ...body } as SubscriptionCoupon : r)));
      }
      setEditId(null);
    } catch (e) { alert((e as Error).message); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this coupon?")) return;
    try { await deleteCoupon(id); setCoupons((c) => c.filter((r) => r.id !== id)); }
    catch (e) { alert((e as Error).message); }
  }

  async function toggleActive(c: SubscriptionCoupon) {
    try {
      await updateCoupon(c.id, { is_active: !c.is_active });
      setCoupons((list) => list.map((r) => r.id === c.id ? { ...r, is_active: !r.is_active } : r));
    } catch (e) { alert((e as Error).message); }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-4 md:px-6 py-4 border-b border-gray-200 bg-white flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-base font-bold text-gray-900">Discount Coupons</h1>
          <p className="text-xs text-gray-500 mt-0.5">Create and manage subscription discount codes</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
        >
          <Plus size={14} /> New Coupon
        </button>
      </div>

      <div className="flex-1 overflow-auto px-4 md:px-6 py-5">
        {loading ? (
          <div className="flex justify-center pt-16"><Loader2 className="animate-spin text-indigo-600" size={24} /></div>
        ) : error ? (
          <p className="text-red-600 text-sm text-center pt-16">{error}</p>
        ) : coupons.length === 0 ? (
          <p className="text-gray-400 text-sm text-center pt-16">No coupons yet. Click &quot;New Coupon&quot; to create one.</p>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-500 font-semibold uppercase tracking-wider">
                  <th className="px-4 py-3 text-left">Code</th>
                  <th className="px-4 py-3 text-left">Discount</th>
                  <th className="px-4 py-3 text-left">Applies to</th>
                  <th className="px-4 py-3 text-left">Usage</th>
                  <th className="px-4 py-3 text-left">Expires</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {coupons.map((c) => {
                  const today = new Date().toISOString().slice(0, 10);
                  const expired = !!c.expires_at && c.expires_at < today;
                  const sl = statusLabel(c);
                  return (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-xs">
                          {c.code}
                        </span>
                        {c.description && (
                          <p className="text-xs text-gray-400 mt-0.5">{c.description}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                        {c.discount_type === "percentage"
                          ? `${c.discount_value}% off`
                          : c.discount_type === "months_free"
                            ? `${c.discount_value} month${c.discount_value !== 1 ? "s" : ""} free`
                            : `₹${c.discount_value} off`}
                        {c.min_amount > 0 && (
                          <span className="block text-xs text-gray-400 font-normal">min ₹{c.min_amount}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        {/* Provider types */}
                        {c.applicable_provider_types?.length
                          ? c.applicable_provider_types.map((t) => (
                              <span key={t} className="inline-block bg-indigo-50 text-indigo-700 rounded px-1.5 py-0.5 mr-1 mb-1 capitalize font-semibold">{t}</span>
                            ))
                          : <span className="text-gray-400 mr-1">All types</span>
                        }
                        {/* Plan tiers */}
                        {c.applicable_tiers?.length
                          ? c.applicable_tiers.map((t) => (
                              <span key={t} className="inline-block bg-gray-100 rounded px-1.5 py-0.5 mr-1 mb-1 font-mono">{t}</span>
                            ))
                          : null
                        }
                        {/* Phone-targeted */}
                        {c.allowed_phones?.length
                          ? <span className="inline-block bg-amber-50 text-amber-700 rounded px-1.5 py-0.5 mr-1 font-semibold">
                              {c.allowed_phones.length} provider{c.allowed_phones.length > 1 ? "s" : ""}
                            </span>
                          : null
                        }
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        {c.used_count}
                        {c.max_uses ? ` / ${c.max_uses}` : " / ∞"}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        {c.expires_at ?? <span className="text-gray-400">Never</span>}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleActive(c)}
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badge(c.is_active, expired)}`}
                        >
                          {sl}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <button onClick={() => openEdit(c)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal ──────────────────────────────────────────────────────────────── */}
      {editId !== null && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-900">
                {editId === "new" ? "New Coupon" : "Edit Coupon"}
              </h2>
              <button onClick={() => setEditId(null)} className="p-1 rounded hover:bg-gray-100 text-gray-400">
                <X size={16} />
              </button>
            </div>

            <div className="overflow-y-auto px-5 py-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Coupon code</label>
                <input
                  value={form.code ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                  placeholder="e.g. WELCOME20"
                  className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs font-mono uppercase bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Description (optional)</label>
                <input
                  value={form.description ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Internal note about this coupon"
                  className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Discount type</label>
                  <select
                    value={form.discount_type ?? "percentage"}
                    onChange={(e) => setForm((f) => ({ ...f, discount_type: e.target.value as "percentage" | "flat" | "months_free" }))}
                    className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="flat">Flat amount (₹)</option>
                    <option value="months_free">Months Free</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    {form.discount_type === "percentage"
                      ? "Discount %"
                      : form.discount_type === "months_free"
                        ? "Number of months free"
                        : "Discount ₹"}
                  </label>
                  <input
                    type="number" min={0}
                    value={form.discount_value ?? 0}
                    onChange={(e) => setForm((f) => ({ ...f, discount_value: Number(e.target.value) }))}
                    className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Min. order amount (₹)</label>
                  <input
                    type="number" min={0}
                    value={form.min_amount ?? 0}
                    onChange={(e) => setForm((f) => ({ ...f, min_amount: Number(e.target.value) }))}
                    className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Max uses (blank = unlimited)</label>
                  <input
                    type="number" min={1}
                    value={form.max_uses ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, max_uses: e.target.value ? Number(e.target.value) : null }))}
                    placeholder="unlimited"
                    className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Valid from</label>
                  <input
                    type="date"
                    value={form.valid_from ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, valid_from: e.target.value || null }))}
                    className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Expires on</label>
                  <input
                    type="date"
                    value={form.expires_at ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, expires_at: e.target.value || null }))}
                    className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Provider types */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">
                  Applicable provider types (none checked = all types)
                </label>
                <div className="flex gap-3">
                  {["doctor", "lab", "pharmacy"].map((t) => (
                    <label key={t} className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={providerTypes.includes(t)}
                        onChange={() => toggleType(t)}
                        className="rounded border-gray-300 text-indigo-600"
                      />
                      <span className="text-xs font-semibold text-gray-700 capitalize">{t}</span>
                    </label>
                  ))}
                </div>
                <p className="text-[10px] text-gray-400 mt-1">
                  Leave all unchecked to apply to any provider type
                </p>
              </div>

              {/* Specific phone numbers */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Restrict to specific providers (comma-separated phone numbers)
                </label>
                <textarea
                  rows={2}
                  value={phonesInput}
                  onChange={(e) => setPhonesInput(e.target.value)}
                  placeholder="e.g. 9876543210, 9123456789"
                  className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  Leave blank to allow for any registered provider
                </p>
              </div>

              {/* Plan tiers */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Applicable plan tiers (comma-separated, blank = all)
                </label>
                <input
                  value={tiersInput}
                  onChange={(e) => setTiersInput(e.target.value)}
                  placeholder="e.g. pro, enterprise, lab_pro"
                  className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs font-mono bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-[10px] text-gray-400 mt-1">Leave blank to allow on all plans</p>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_active ?? true}
                  onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                  className="rounded border-gray-300 text-indigo-600"
                />
                <span className="text-xs font-semibold text-gray-700">Active</span>
              </label>
            </div>

            <div className="px-5 py-3 border-t border-gray-100 flex justify-end gap-2">
              <button onClick={() => setEditId(null)} className="px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100">Cancel</button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

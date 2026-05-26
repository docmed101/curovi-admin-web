"use client";

import { useEffect, useState } from "react";
import {
  Loader2, Pencil, Trash2, Plus, Check, X, ChevronDown, ChevronUp,
} from "lucide-react";
import {
  getPlans, createPlan, updatePlan, deletePlan,
  type SubscriptionPlan,
} from "@/lib/api/subscription";

const TYPE_LABELS: Record<string, string> = {
  doctor: "Doctor Plans",
  lab: "Lab Plans",
  pharmacy: "Pharmacy Plans",
};
const TYPE_COLORS: Record<string, string> = {
  doctor:   "bg-indigo-50 text-indigo-700 border-indigo-200",
  lab:      "bg-teal-50 text-teal-700 border-teal-200",
  pharmacy: "bg-orange-50 text-orange-700 border-orange-200",
};

const BLANK: Partial<SubscriptionPlan> = {
  tier: "", provider_type: "doctor", name: "", monthly_price: 0,
  yearly_price: 0, features: [], is_active: true, sort_order: 0,
};

function fmt(n: number) {
  return n === 0 ? "Free" : `₹${n.toLocaleString("en-IN")}`;
}

function toFeatures(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw as string[];
  if (typeof raw === "string") {
    try { return JSON.parse(raw) as string[]; } catch { return []; }
  }
  return [];
}

export default function SubscriptionPlansPage() {
  const [plans, setPlans]       = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [editId, setEditId]     = useState<number | "new" | null>(null);
  const [form, setForm]         = useState<Partial<SubscriptionPlan>>(BLANK);
  const [saving, setSaving]     = useState(false);
  const [featInput, setFeatInput] = useState("");

  async function load() {
    setLoading(true);
    try { setPlans(await getPlans()); }
    catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function openNew() {
    setForm({ ...BLANK });
    setFeatInput("");
    setEditId("new");
  }

  function openEdit(p: SubscriptionPlan) {
    setForm({ ...p, features: toFeatures(p.features) });
    setFeatInput("");
    setEditId(p.id);
  }

  function cancelEdit() { setEditId(null); }

  function addFeature() {
    const f = featInput.trim();
    if (!f) return;
    setForm((prev) => ({ ...prev, features: [...toFeatures(prev.features), f] }));
    setFeatInput("");
  }

  function removeFeature(i: number) {
    setForm((prev) => ({ ...prev, features: toFeatures(prev.features).filter((_, idx) => idx !== i) }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (editId === "new") {
        const created = await createPlan(form);
        setPlans((p) => [...p, created]);
      } else {
        await updatePlan(editId as number, form);
        setPlans((p) => p.map((r) => (r.id === editId ? { ...r, ...form } as SubscriptionPlan : r)));
      }
      setEditId(null);
    } catch (e) { alert((e as Error).message); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this plan?")) return;
    try {
      await deletePlan(id);
      setPlans((p) => p.filter((r) => r.id !== id));
    } catch (e) { alert((e as Error).message); }
  }

  async function toggleActive(plan: SubscriptionPlan) {
    try {
      await updatePlan(plan.id, { is_active: !plan.is_active });
      setPlans((p) => p.map((r) => r.id === plan.id ? { ...r, is_active: !r.is_active } : r));
    } catch (e) { alert((e as Error).message); }
  }

  async function reorder(plan: SubscriptionPlan, dir: -1 | 1) {
    const newOrder = (plan.sort_order ?? 0) + dir;
    try {
      await updatePlan(plan.id, { sort_order: newOrder });
      setPlans((p) => p.map((r) => r.id === plan.id ? { ...r, sort_order: newOrder } : r));
    } catch (e) { alert((e as Error).message); }
  }

  const groups = ["doctor", "lab", "pharmacy"] as const;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-white flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-gray-900">Subscription Plans</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage pricing for doctor, lab, and pharmacy providers
          </p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
        >
          <Plus size={14} /> Add Plan
        </button>
      </div>

      <div className="flex-1 overflow-auto px-6 py-5 space-y-8">
        {loading ? (
          <div className="flex justify-center pt-16">
            <Loader2 className="animate-spin text-indigo-600" size={24} />
          </div>
        ) : error ? (
          <p className="text-red-600 text-sm text-center pt-16">{error}</p>
        ) : (
          groups.map((type) => {
            const rows = [...plans.filter((p) => p.provider_type === type)].sort(
              (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
            );
            return (
              <section key={type}>
                <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                  {TYPE_LABELS[type]}
                </h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {rows.map((plan) => (
                    <div
                      key={plan.id}
                      className={`rounded-2xl border p-4 flex flex-col gap-3 bg-white ${
                        plan.is_active ? "border-gray-200" : "border-dashed border-gray-300 opacity-60"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className={`inline-block text-xs font-mono px-2 py-0.5 rounded-full border ${TYPE_COLORS[type]}`}>
                            {plan.tier}
                          </span>
                          <p className="mt-1 text-sm font-bold text-gray-900">{plan.name}</p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button onClick={() => reorder(plan, -1)} className="p-1 rounded hover:bg-gray-100 text-gray-400">
                            <ChevronUp size={12} />
                          </button>
                          <button onClick={() => reorder(plan, 1)} className="p-1 rounded hover:bg-gray-100 text-gray-400">
                            <ChevronDown size={12} />
                          </button>
                          <button onClick={() => openEdit(plan)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => handleDelete(plan.id)} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      <div className="flex gap-4 text-center">
                        <div className="flex-1 bg-gray-50 rounded-xl p-2">
                          <p className="text-[10px] text-gray-400 font-medium">Monthly</p>
                          <p className="text-sm font-bold text-gray-900">{fmt(plan.monthly_price)}</p>
                        </div>
                        <div className="flex-1 bg-gray-50 rounded-xl p-2">
                          <p className="text-[10px] text-gray-400 font-medium">Yearly</p>
                          <p className="text-sm font-bold text-gray-900">{fmt(plan.yearly_price)}</p>
                        </div>
                      </div>

                      {toFeatures(plan.features).length > 0 && (
                        <ul className="space-y-1">
                          {toFeatures(plan.features).map((f, i) => (
                            <li key={i} className="flex items-start gap-1.5 text-xs text-gray-600">
                              <span className="mt-0.5 text-green-500">✓</span> {f}
                            </li>
                          ))}
                        </ul>
                      )}

                      <button
                        onClick={() => toggleActive(plan)}
                        className={`mt-auto text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                          plan.is_active
                            ? "bg-green-50 text-green-700 hover:bg-red-50 hover:text-red-700"
                            : "bg-gray-100 text-gray-500 hover:bg-green-50 hover:text-green-700"
                        }`}
                      >
                        {plan.is_active ? "Active — click to disable" : "Disabled — click to enable"}
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            );
          })
        )}
      </div>

      {/* ── Edit / Create modal ─────────────────────────────────────────────── */}
      {editId !== null && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-900">
                {editId === "new" ? "Add Plan" : "Edit Plan"}
              </h2>
              <button onClick={cancelEdit} className="p-1 rounded hover:bg-gray-100 text-gray-400">
                <X size={16} />
              </button>
            </div>

            <div className="overflow-y-auto px-5 py-4 space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Tier key</label>
                  <input
                    value={form.tier ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, tier: e.target.value }))}
                    placeholder="e.g. pro"
                    className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Provider type</label>
                  <select
                    value={form.provider_type ?? "doctor"}
                    onChange={(e) => setForm((f) => ({ ...f, provider_type: e.target.value as SubscriptionPlan["provider_type"] }))}
                    className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="doctor">Doctor</option>
                    <option value="lab">Lab</option>
                    <option value="pharmacy">Pharmacy</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Display name</label>
                <input
                  value={form.name ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Pro"
                  className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Monthly price (₹)</label>
                  <input
                    type="number" min={0}
                    value={form.monthly_price ?? 0}
                    onChange={(e) => setForm((f) => ({ ...f, monthly_price: Number(e.target.value) }))}
                    className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Yearly price (₹)</label>
                  <input
                    type="number" min={0}
                    value={form.yearly_price ?? 0}
                    onChange={(e) => setForm((f) => ({ ...f, yearly_price: Number(e.target.value) }))}
                    className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Sort order</label>
                <input
                  type="number" min={0}
                  value={form.sort_order ?? 0}
                  onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))}
                  className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Features</label>
                <div className="flex gap-2 mb-2">
                  <input
                    value={featInput}
                    onChange={(e) => setFeatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addFeature())}
                    placeholder="Add feature and press Enter"
                    className="flex-1 border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button onClick={addFeature} className="px-2.5 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 text-xs font-semibold">
                    Add
                  </button>
                </div>
                <ul className="space-y-1">
                  {toFeatures(form.features).map((f, i) => (
                    <li key={i} className="flex items-center justify-between gap-2 bg-gray-50 rounded-lg px-2.5 py-1.5">
                      <span className="text-xs text-gray-700">{f}</span>
                      <button onClick={() => removeFeature(i)} className="text-gray-400 hover:text-red-500">
                        <X size={12} />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_active ?? true}
                  onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                  className="rounded border-gray-300 text-indigo-600"
                />
                <span className="text-xs font-semibold text-gray-700">Active (visible to providers)</span>
              </label>
            </div>

            <div className="px-5 py-3 border-t border-gray-100 flex justify-end gap-2">
              <button onClick={cancelEdit} className="px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100">Cancel</button>
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

"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Loader2, ToggleLeft, ToggleRight, Search, X } from "lucide-react";
import {
  getLabTests, createLabTest, updateLabTest, deleteLabTest,
  getLabTestCategories, createLabTestCategory, updateLabTestCategory, deleteLabTestCategory,
  type LabTestRow, type LabTestCategoryRow,
} from "@/lib/api/master-catalog";

const PRICING_COLORS = {
  curovi_controlled: "bg-emerald-100 text-emerald-700",
  lab_price_allowed: "bg-violet-100 text-violet-700",
};

type Tab = "tests" | "categories";

export default function MasterCatalogPage() {
  const [tab, setTab] = useState<Tab>("tests");
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Master Catalog</h1>
        <p className="text-sm text-gray-500 mt-1">Manage Curovi&apos;s master lab tests, scans, and categories</p>
      </div>
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        <button onClick={() => setTab("tests")}
          className={`px-5 py-2 rounded-md text-sm font-medium transition-colors ${tab === "tests" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
          Tests &amp; Scans
        </button>
        <button onClick={() => setTab("categories")}
          className={`px-5 py-2 rounded-md text-sm font-medium transition-colors ${tab === "categories" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
          Categories
        </button>
      </div>
      {tab === "tests" ? <TestsTab /> : <CategoriesTab />}
    </div>
  );
}

// ── Tests Tab ──────────────────────────────────────────────────────────────────

function TestsTab() {
  const [rows, setRows] = useState<LabTestRow[]>([]);
  const [categories, setCategories] = useState<LabTestCategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [pricingFilter, setPricingFilter] = useState("");
  const [modal, setModal] = useState<LabTestRow | "new" | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [tests, cats] = await Promise.all([getLabTests(), getLabTestCategories()]);
      setRows(tests);
      setCategories(cats);
    } catch (e) { setFlash((e as Error).message); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const filtered = rows.filter(r => {
    if (search && !r.name.toLowerCase().includes(search.toLowerCase()) && !r.id.toLowerCase().includes(search.toLowerCase())) return false;
    if (catFilter && r.category_id !== catFilter) return false;
    if (pricingFilter && r.pricing_control !== pricingFilter) return false;
    return true;
  });

  async function handleToggle(row: LabTestRow) {
    const newStatus = row.status === 1 ? 0 : 1;
    await updateLabTest(row.id, { status: newStatus });
    load();
  }

  async function handleDelete(row: LabTestRow) {
    if (!confirm(`Delete "${row.name}"? This cannot be undone.`)) return;
    await deleteLabTest(row.id);
    load();
  }

  return (
    <>
      {flash && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{flash}<button className="ml-2 underline" onClick={() => setFlash(null)}>dismiss</button></div>}

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by ID or name..."
            className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={pricingFilter} onChange={e => setPricingFilter(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Pricing</option>
          <option value="curovi_controlled">Curovi Controlled</option>
          <option value="lab_price_allowed">Lab Price Allowed</option>
        </select>
        <button onClick={() => setModal("new")}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 ml-auto">
          <Plus className="w-4 h-4" /> Add Test
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
      ) : (
        <div className="bg-white rounded-xl border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase">ID</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Name</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Category</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase">MRP</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Pricing</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Payout</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Fee</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Sample</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Report</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-3 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={11} className="text-center py-12 text-gray-400">No tests found</td></tr>
              ) : filtered.map(row => (
                <tr key={row.id} className="border-b hover:bg-gray-50">
                  <td className="px-3 py-2.5 font-mono text-xs text-gray-500">{row.id}</td>
                  <td className="px-3 py-2.5 font-medium text-gray-900">{row.name}</td>
                  <td className="px-3 py-2.5 text-gray-600">{categories.find(c => c.id === row.category_id)?.name ?? row.category_id}</td>
                  <td className="px-3 py-2.5 text-gray-700">₹{row.price}</td>
                  <td className="px-3 py-2.5">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${PRICING_COLORS[row.pricing_control] ?? "bg-gray-100"}`}>
                      {row.pricing_control === "curovi_controlled" ? "Curovi" : "Lab"}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-green-600 font-medium">{row.lab_payout != null ? `₹${row.lab_payout}` : "—"}</td>
                  <td className="px-3 py-2.5 text-blue-600 font-medium">{row.curovi_fee != null ? `₹${row.curovi_fee}` : "—"}</td>
                  <td className="px-3 py-2.5 text-gray-600">{row.sample_type}</td>
                  <td className="px-3 py-2.5 text-gray-600">{row.report_time ?? "—"}</td>
                  <td className="px-3 py-2.5">
                    <button onClick={() => handleToggle(row)} title={row.status === 1 ? "Active" : "Inactive"}>
                      {row.status === 1
                        ? <ToggleRight className="w-6 h-6 text-green-500" />
                        : <ToggleLeft className="w-6 h-6 text-gray-300" />}
                    </button>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => setModal(row)} className="p-1.5 hover:bg-gray-100 rounded"><Pencil className="w-4 h-4 text-gray-500" /></button>
                      <button onClick={() => handleDelete(row)} className="p-1.5 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4 text-red-400" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-2 text-xs text-gray-400 border-t">{filtered.length} of {rows.length} tests</div>
        </div>
      )}

      {modal && <TestModal test={modal === "new" ? null : modal} categories={categories} onClose={() => setModal(null)} onSave={load} />}
    </>
  );
}

// ── Test Modal ─────────────────────────────────────────────────────────────────

function TestModal({ test, categories, onClose, onSave }: {
  test: LabTestRow | null;
  categories: LabTestCategoryRow[];
  onClose: () => void;
  onSave: () => void;
}) {
  const isEdit = !!test;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [id, setId] = useState(test?.id ?? "");
  const [name, setName] = useState(test?.name ?? "");
  const [categoryId, setCategoryId] = useState(test?.category_id ?? "");
  const [description, setDescription] = useState(test?.description ?? "");
  const [price, setPrice] = useState(String(test?.price ?? ""));
  const [discountedPrice, setDiscountedPrice] = useState(String(test?.discounted_price ?? ""));
  const [discountPercent, setDiscountPercent] = useState(String(test?.discount_percent ?? ""));
  const [pricingControl, setPricingControl] = useState(test?.pricing_control ?? "curovi_controlled");
  const [labPayout, setLabPayout] = useState(String(test?.lab_payout ?? ""));
  const [curoviFee, setCuroviFee] = useState(String(test?.curovi_fee ?? ""));
  const [hcCharge, setHcCharge] = useState(String(test?.home_collection_charge ?? ""));
  const [sampleType, setSampleType] = useState(test?.sample_type ?? "Blood");
  const [reportTime, setReportTime] = useState(test?.report_time ?? "");
  const [fasting, setFasting] = useState(test?.fasting ?? false);
  const [prescriptionRequired, setPrescriptionRequired] = useState(test?.prescription_required ?? false);
  const [popular, setPopular] = useState(test?.popular ?? false);
  const [isCommon, setIsCommon] = useState(test?.is_common ?? false);
  const [displayOrder, setDisplayOrder] = useState(String(test?.display_order ?? 0));

  async function handleSave() {
    if (!id.trim() || !name.trim() || !categoryId || !price) {
      setError("ID, Name, Category, and Price are required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = {
        id: id.trim(),
        name: name.trim(),
        category_id: categoryId,
        description: description || null,
        price: Number(price),
        discounted_price: discountedPrice ? Number(discountedPrice) : null,
        discount_percent: discountPercent ? Number(discountPercent) : null,
        pricing_control: pricingControl,
        lab_payout: labPayout ? Number(labPayout) : null,
        curovi_fee: curoviFee ? Number(curoviFee) : null,
        home_collection_charge: hcCharge ? Number(hcCharge) : null,
        sample_type: sampleType,
        report_time: reportTime || null,
        fasting,
        prescription_required: prescriptionRequired,
        popular,
        is_common: isCommon,
        display_order: Number(displayOrder) || 0,
        status: 1,
      };
      if (isEdit) {
        await updateLabTest(test!.id, payload);
      } else {
        await createLabTest(payload);
      }
      onSave();
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 overflow-y-auto py-8">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-lg font-bold text-gray-900">{isEdit ? "Edit Test" : "Add New Test"}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5 text-gray-500" /></button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-6 py-4 space-y-4 flex-1">
          {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

          <div className="grid grid-cols-2 gap-4">
            <Field label="Test ID *" value={id} onChange={setId} placeholder="e.g. cbc" disabled={isEdit} />
            <Field label="Name *" value={name} onChange={setName} placeholder="e.g. Complete Blood Count (CBC)" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select value={categoryId} onChange={e => setCategoryId(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select Category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name} ({c.service_type})</option>)}
              </select>
            </div>
            <Field label="Sample Type" value={sampleType} onChange={setSampleType} placeholder="Blood" />
          </div>

          <Field label="Description" value={description} onChange={setDescription} placeholder="Brief description" multiline />

          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Pricing</h4>
            <div className="grid grid-cols-3 gap-4">
              <Field label="MRP (₹) *" value={price} onChange={setPrice} type="number" placeholder="350" />
              <Field label="Discounted Price (₹)" value={discountedPrice} onChange={setDiscountedPrice} type="number" placeholder="" />
              <Field label="Discount %" value={discountPercent} onChange={setDiscountPercent} type="number" placeholder="" />
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Pricing Control</h4>
            <div className="flex gap-4 mb-3">
              {(["curovi_controlled", "lab_price_allowed"] as const).map(v => (
                <label key={v} className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg cursor-pointer text-sm ${pricingControl === v ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}>
                  <input type="radio" name="pricing" value={v} checked={pricingControl === v} onChange={() => setPricingControl(v)} className="accent-blue-600" />
                  {v === "curovi_controlled" ? "Curovi Controlled" : "Lab Price Allowed"}
                </label>
              ))}
            </div>
            {pricingControl === "curovi_controlled" && (
              <div className="grid grid-cols-3 gap-4 bg-emerald-50 p-3 rounded-lg">
                <Field label="Lab Payout (₹)" value={labPayout} onChange={setLabPayout} type="number" placeholder="250" />
                <Field label="Curovi Fee (₹)" value={curoviFee} onChange={setCuroviFee} type="number" placeholder="50" />
                <Field label="Home Collection (₹)" value={hcCharge} onChange={setHcCharge} type="number" placeholder="99" />
              </div>
            )}
          </div>

          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Details</h4>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Report Time" value={reportTime} onChange={setReportTime} placeholder="e.g. 6 hours" />
              <Field label="Display Order" value={displayOrder} onChange={setDisplayOrder} type="number" placeholder="0" />
            </div>
            <div className="flex flex-wrap gap-6 mt-3">
              <Toggle label="Fasting Required" checked={fasting} onChange={setFasting} />
              <Toggle label="Prescription Required" checked={prescriptionRequired} onChange={setPrescriptionRequired} />
              <Toggle label="Popular" checked={popular} onChange={setPopular} />
              <Toggle label="Common Test" checked={isCommon} onChange={setIsCommon} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 justify-end px-6 py-4 border-t">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
            {saving ? "Saving..." : isEdit ? "Update" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Categories Tab ─────────────────────────────────────────────────────────────

function CategoriesTab() {
  const [rows, setRows] = useState<LabTestCategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<LabTestCategoryRow | "new" | null>(null);

  async function load() {
    setLoading(true);
    try { setRows(await getLabTestCategories()); } catch {}
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function handleDelete(row: LabTestCategoryRow) {
    if (!confirm(`Delete category "${row.name}"?`)) return;
    await deleteLabTestCategory(row.id);
    load();
  }

  return (
    <>
      <div className="flex justify-end">
        <button onClick={() => setModal("new")}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Icon</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Service Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Test Count</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Order</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-mono text-xs text-gray-500">{row.id}</td>
                  <td className="px-4 py-2.5 font-medium text-gray-900">{row.name}</td>
                  <td className="px-4 py-2.5 text-lg">{row.icon ?? "—"}</td>
                  <td className="px-4 py-2.5">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      row.service_type === "lab" ? "bg-blue-100 text-blue-700"
                      : row.service_type === "scan" ? "bg-purple-100 text-purple-700"
                      : "bg-amber-100 text-amber-700"
                    }`}>{row.service_type}</span>
                  </td>
                  <td className="px-4 py-2.5 text-gray-600">{row.test_count}</td>
                  <td className="px-4 py-2.5 text-gray-600">{row.display_order}</td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => setModal(row)} className="p-1.5 hover:bg-gray-100 rounded"><Pencil className="w-4 h-4 text-gray-500" /></button>
                      <button onClick={() => handleDelete(row)} className="p-1.5 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4 text-red-400" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-2 text-xs text-gray-400 border-t">{rows.length} categories</div>
        </div>
      )}

      {modal && <CategoryModal cat={modal === "new" ? null : modal} onClose={() => setModal(null)} onSave={load} />}
    </>
  );
}

// ── Category Modal ─────────────────────────────────────────────────────────────

function CategoryModal({ cat, onClose, onSave }: { cat: LabTestCategoryRow | null; onClose: () => void; onSave: () => void }) {
  const isEdit = !!cat;
  const [saving, setSaving] = useState(false);
  const [id, setId] = useState(cat?.id ?? "");
  const [name, setName] = useState(cat?.name ?? "");
  const [icon, setIcon] = useState(cat?.icon ?? "");
  const [description, setDescription] = useState(cat?.description ?? "");
  const [serviceType, setServiceType] = useState(cat?.service_type ?? "lab");
  const [displayOrder, setDisplayOrder] = useState(String(cat?.display_order ?? 0));

  async function handleSave() {
    if (!id.trim() || !name.trim()) return;
    setSaving(true);
    try {
      const payload = { id: id.trim(), name: name.trim(), icon: icon || null, description: description || null, service_type: serviceType, display_order: Number(displayOrder) || 0 };
      isEdit ? await updateLabTestCategory(cat!.id, payload) : await createLabTestCategory(payload);
      onSave();
      onClose();
    } catch {} finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">{isEdit ? "Edit Category" : "Add Category"}</h3>
        <div className="space-y-3">
          <Field label="ID *" value={id} onChange={setId} placeholder="e.g. hematology" disabled={isEdit} />
          <Field label="Name *" value={name} onChange={setName} placeholder="e.g. Blood Tests" />
          <Field label="Icon (emoji)" value={icon} onChange={setIcon} placeholder="🩸" />
          <Field label="Description" value={description} onChange={setDescription} placeholder="" />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
            <select value={serviceType} onChange={e => setServiceType(e.target.value as "lab" | "scan" | "package")}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="lab">Lab</option>
              <option value="scan">Scan</option>
              <option value="package">Package</option>
            </select>
          </div>
          <Field label="Display Order" value={displayOrder} onChange={setDisplayOrder} type="number" placeholder="0" />
        </div>
        <div className="flex gap-3 justify-end mt-5">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
            {saving ? "Saving..." : isEdit ? "Update" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Shared Components ──────────────────────────────────────────────────────────

function Field({ label, value, onChange, placeholder = "", type = "text", disabled = false, multiline = false }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; disabled?: boolean; multiline?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {multiline ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={2}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      ) : (
        <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} disabled={disabled}
          className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${disabled ? "bg-gray-100 text-gray-500" : ""}`} />
      )}
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="accent-blue-600 w-4 h-4 rounded" />
      {label}
    </label>
  );
}

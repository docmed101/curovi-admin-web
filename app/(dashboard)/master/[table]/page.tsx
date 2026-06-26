"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { Plus, Pencil, Trash2, Loader2, ToggleLeft, ToggleRight } from "lucide-react";
import {
  getMasterRows,
  createMasterRow,
  updateMasterRow,
  toggleMasterRow,
  deleteMasterRow,
  type MasterRow,
} from "@/lib/api/master";

// Per-table column config
const TABLE_CONFIG: Record<
  string,
  { label: string; fields: { key: string; label: string; required?: boolean }[] }
> = {
  diagnoses: {
    label: "Diagnoses",
    fields: [
      { key: "name",     label: "Name",     required: true },
      { key: "category", label: "Category" },
      { key: "icd_code", label: "ICD Code" },
    ],
  },
  medicines: {
    label: "Medicines",
    fields: [
      { key: "name",         label: "Name",         required: true },
      { key: "generic_name", label: "Generic Name" },
      { key: "category",     label: "Category" },
    ],
  },
  specialties: {
    label: "Specialties",
    fields: [
      { key: "name",     label: "Name",     required: true },
      { key: "category", label: "Category" },
    ],
  },
  qualifications: {
    label: "Qualifications",
    fields: [{ key: "name", label: "Name", required: true }],
  },
  councils: {
    label: "Councils",
    fields: [
      { key: "name",  label: "Name",  required: true },
      { key: "state", label: "State" },
    ],
  },
  "lab-tests": {
    label: "Lab Tests",
    fields: [
      { key: "name",     label: "Name",     required: true },
      { key: "category", label: "Category" },
    ],
  },
};

export default function MasterTablePage({
  params,
}: {
  params: Promise<{ table: string }>;
}) {
  const { table } = use(params);
  const config = TABLE_CONFIG[table];

  const [rows, setRows] = useState<MasterRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [editRow, setEditRow] = useState<MasterRow | "new" | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setRows(await getMasterRows(table));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [table]);

  if (!config) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 text-sm">
        Unknown table: {table}
      </div>
    );
  }

  const filtered = rows.filter((r) =>
    String(r.name).toLowerCase().includes(search.toLowerCase())
  );

  async function handleToggle(row: MasterRow) {
    const newStatus = row.status === 1 ? 0 : 1;
    await toggleMasterRow(table, row.id, newStatus as 0 | 1);
    await load();
  }

  async function handleDelete(row: MasterRow) {
    if (!confirm(`Delete "${row.name}"?`)) return;
    await deleteMasterRow(table, row.id);
    await load();
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2 px-4 md:px-6 py-4 border-b border-gray-200 bg-white">
        <h1 className="text-base font-bold text-gray-900">{config.label}</h1>
        <div className="flex items-center gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full md:w-48"
          />
          <button
            onClick={() => setEditRow("new")}
            className="flex items-center gap-1.5 bg-indigo-600 text-white text-sm font-semibold px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus size={14} /> Add
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-4 md:px-6 py-4">
        {loading ? (
          <div className="flex justify-center pt-16">
            <Loader2 className="animate-spin text-indigo-600" size={24} />
          </div>
        ) : error ? (
          <p className="text-red-600 text-sm text-center pt-16">{error}</p>
        ) : (
          <div className="overflow-x-auto"><table className="w-full text-sm border-collapse min-w-[480px]">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">
                  #
                </th>
                {config.fields.map((f) => (
                  <th
                    key={f.key}
                    className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase"
                  >
                    {f.label}
                  </th>
                ))}
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">
                  Status
                </th>
                <th className="py-2 px-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="py-2.5 px-3 text-gray-400 text-xs">{row.id}</td>
                  {config.fields.map((f) => (
                    <td key={f.key} className="py-2.5 px-3 text-gray-800">
                      {String(row[f.key] ?? "—")}
                    </td>
                  ))}
                  <td className="py-2.5 px-3">
                    <button
                      onClick={() => handleToggle(row)}
                      className="flex items-center gap-1 text-xs font-medium"
                    >
                      {row.status === 1 ? (
                        <>
                          <ToggleRight size={16} className="text-green-500" />
                          <span className="text-green-600">Active</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft size={16} className="text-gray-400" />
                          <span className="text-gray-400">Inactive</span>
                        </>
                      )}
                    </button>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => setEditRow(row)}
                        className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(row)}
                        className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={config.fields.length + 3}
                    className="py-12 text-center text-gray-400 text-sm"
                  >
                    {search ? "No results" : "No records yet"}
                  </td>
                </tr>
              )}
            </tbody>
          </table></div>
        )}
      </div>

      {/* Add / Edit modal */}
      {editRow !== null && (
        <RowModal
          table={table}
          config={config}
          row={editRow === "new" ? null : editRow}
          onClose={() => setEditRow(null)}
          onSuccess={load}
        />
      )}
    </div>
  );
}

// ── Row modal ──────────────────────────────────────────────────────────────

function RowModal({
  table,
  config,
  row,
  onClose,
  onSuccess,
}: {
  table: string;
  config: (typeof TABLE_CONFIG)[string];
  row: MasterRow | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [values, setValues] = useState<Record<string, string>>(
    row
      ? Object.fromEntries(
          config.fields.map((f) => [f.key, String(row[f.key] ?? "")])
        )
      : Object.fromEntries(config.fields.map((f) => [f.key, ""]))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (row) {
        await updateMasterRow(table, row.id, values);
      } else {
        await createMasterRow(table, values);
      }
      onSuccess();
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-gray-900">
            {row ? `Edit ${config.label}` : `Add ${config.label}`}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {config.fields.map((f) => (
            <div key={f.key}>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">
                {f.label}
                {f.required && <span className="text-red-500 ml-0.5">*</span>}
              </label>
              <input
                required={f.required}
                value={values[f.key]}
                onChange={(e) =>
                  setValues((v) => ({ ...v, [f.key]: e.target.value }))
                }
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          ))}
          {error && (
            <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-200 text-sm font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-indigo-600 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {saving && <Loader2 size={13} className="animate-spin" />}
              {row ? "Save" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

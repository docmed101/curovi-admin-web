"use client";

import { useEffect, useState } from "react";
import { Loader2, Pencil, Check, X } from "lucide-react";
import { getConfig, updateConfig, type AppConfig } from "@/lib/api/config";

const APP_LABELS: Record<string, string> = {
  patient:  "Patient App",
  provider: "Provider App",
  both:     "Both Apps",
};

export default function ConfigPage() {
  const [config, setConfig] = useState<AppConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      setConfig(await getConfig());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleSave(key: string) {
    setSaving(true);
    try {
      await updateConfig(key, editValue);
      setConfig((c) =>
        c.map((r) => (r.key === key ? { ...r, value: editValue } : r))
      );
      setEditing(null);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const sections = ["patient", "provider", "both"] as const;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-white">
        <h1 className="text-base font-bold text-gray-900">App Configuration</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Feature flags and settings that control the patient and provider apps
        </p>
      </div>

      <div className="flex-1 overflow-auto px-6 py-5 space-y-6">
        {loading ? (
          <div className="flex justify-center pt-16">
            <Loader2 className="animate-spin text-indigo-600" size={24} />
          </div>
        ) : error ? (
          <p className="text-red-600 text-sm text-center pt-16">{error}</p>
        ) : (
          sections.map((app) => {
            const rows = config.filter((c) => c.app === app);
            if (rows.length === 0) return null;
            return (
              <section key={app}>
                <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                  {APP_LABELS[app]}
                </h2>
                <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-100">
                  {rows.map((row) => (
                    <div key={row.key} className="flex items-start gap-4 px-5 py-3.5">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-mono font-medium text-gray-800">
                          {row.key}
                        </p>
                        {row.description && (
                          <p className="text-xs text-gray-400 mt-0.5">{row.description}</p>
                        )}
                      </div>
                      {editing === row.key ? (
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="border border-indigo-300 rounded-lg px-2.5 py-1 text-sm w-32 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSave(row.key)}
                            disabled={saving}
                            className="p-1.5 rounded bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
                          >
                            {saving ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : (
                              <Check size={13} />
                            )}
                          </button>
                          <button
                            onClick={() => setEditing(null)}
                            className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className="text-sm font-mono text-gray-700 bg-gray-50 px-2.5 py-1 rounded-lg">
                            {row.value}
                          </span>
                          <button
                            onClick={() => {
                              setEditing(row.key);
                              setEditValue(row.value);
                            }}
                            className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <Pencil size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            );
          })
        )}
      </div>
    </div>
  );
}

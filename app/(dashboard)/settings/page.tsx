"use client";

import { useEffect, useState } from "react";
import { Loader2, Pencil, Check, X, Eye, EyeOff, Send } from "lucide-react";
import { getSettings, updateSetting, type OrgSetting } from "@/lib/api/settings";

const GROUP_LABELS: Record<string, string> = {
  email:   "Email / SMTP Configuration",
  billing: "Billing Settings",
  general: "General Settings",
};

const GROUP_DESC: Record<string, string> = {
  email:   "Configure the outgoing mail server used to send billing receipts and notifications to providers.",
  billing: "Organisation-level billing defaults.",
  general: "Other organisation settings.",
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<OrgSetting[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [editing, setEditing]   = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving]     = useState(false);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [testEmail, setTestEmail] = useState("");
  const [testing, setTesting]   = useState(false);
  const [testMsg, setTestMsg]   = useState<{ ok: boolean; text: string } | null>(null);

  async function load() {
    setLoading(true);
    try { setSettings(await getSettings()); }
    catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function handleSave(key: string) {
    setSaving(true);
    try {
      await updateSetting(key, editValue);
      setSettings((s) => s.map((r) => (r.key === key ? { ...r, value: editValue } : r)));
      setEditing(null);
    } catch (e) { alert((e as Error).message); }
    finally { setSaving(false); }
  }

  function toggleReveal(key: string) {
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) { next.delete(key); } else { next.add(key); }
      return next;
    });
  }

  async function sendTestEmail() {
    if (!testEmail.trim()) return;
    setTesting(true);
    setTestMsg(null);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5002/api"}/admin/settings/test-email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("admin_token") ?? ""}`,
          },
          body: JSON.stringify({ to: testEmail }),
        }
      );
      const data = await res.json();
      setTestMsg({ ok: data.status === true, text: data.message ?? (data.status ? "Sent!" : "Failed") });
    } catch (e) {
      setTestMsg({ ok: false, text: (e as Error).message });
    } finally {
      setTesting(false);
    }
  }

  const groups = ["email", "billing", "general"] as const;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-white">
        <h1 className="text-base font-bold text-gray-900">Organisation Settings</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Global configuration for email delivery, billing, and other org-level options
        </p>
      </div>

      <div className="flex-1 overflow-auto px-6 py-5 space-y-8">
        {loading ? (
          <div className="flex justify-center pt-16">
            <Loader2 className="animate-spin text-indigo-600" size={24} />
          </div>
        ) : error ? (
          <p className="text-red-600 text-sm text-center pt-16">{error}</p>
        ) : (
          groups.map((group) => {
            const rows = settings.filter((s) => s.group === group);
            if (rows.length === 0) return null;
            return (
              <section key={group}>
                <div className="mb-3">
                  <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                    {GROUP_LABELS[group]}
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">{GROUP_DESC[group]}</p>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-100">
                  {rows.map((row) => {
                    const isRevealed = revealed.has(row.key);
                    const displayValue = row.is_secret && !isRevealed
                      ? row.value ? "••••••••" : ""
                      : row.value;

                    return (
                      <div key={row.key} className="flex items-start gap-4 px-5 py-3.5">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800">{row.label}</p>
                          <p className="text-xs font-mono text-gray-400">{row.key}</p>
                          {row.description && (
                            <p className="text-xs text-gray-400 mt-0.5">{row.description}</p>
                          )}
                        </div>

                        {editing === row.key ? (
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <input
                              type={row.is_secret ? "password" : "text"}
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="border border-indigo-300 rounded-lg px-2.5 py-1 text-sm w-40 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSave(row.key)}
                              disabled={saving}
                              className="p-1.5 rounded bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                            >
                              {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                            </button>
                            <button
                              onClick={() => setEditing(null)}
                              className="p-1.5 rounded hover:bg-gray-100 text-gray-400"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={`text-sm font-mono px-2.5 py-1 rounded-lg ${
                              row.value ? "bg-gray-50 text-gray-700" : "bg-gray-50 text-gray-300 italic"
                            }`}>
                              {displayValue || "not set"}
                            </span>
                            {row.is_secret && row.value && (
                              <button
                                onClick={() => toggleReveal(row.key)}
                                className="p-1.5 rounded hover:bg-gray-100 text-gray-400"
                              >
                                {isRevealed ? <EyeOff size={13} /> : <Eye size={13} />}
                              </button>
                            )}
                            <button
                              onClick={() => { setEditing(row.key); setEditValue(row.value); }}
                              className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                            >
                              <Pencil size={13} />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* ── Test email send (email group only) ─────────────────────── */}
                {group === "email" && (
                  <div className="mt-4 bg-white rounded-2xl border border-gray-100 px-5 py-4">
                    <p className="text-xs font-bold text-gray-700 mb-2">Send Test Email</p>
                    <p className="text-xs text-gray-400 mb-3">
                      Verify your SMTP settings by sending a test message.
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        value={testEmail}
                        onChange={(e) => setTestEmail(e.target.value)}
                        placeholder="recipient@example.com"
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <button
                        onClick={sendTestEmail}
                        disabled={testing || !testEmail.trim()}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60"
                      >
                        {testing ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                        Send Test
                      </button>
                    </div>
                    {testMsg && (
                      <p className={`mt-2 text-xs font-semibold ${testMsg.ok ? "text-green-600" : "text-red-600"}`}>
                        {testMsg.text}
                      </p>
                    )}
                  </div>
                )}
              </section>
            );
          })
        )}
      </div>
    </div>
  );
}

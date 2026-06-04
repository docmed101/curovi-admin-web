"use client";

import { useEffect, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { adminRequest } from "@/lib/api/client";

interface AuditLog {
  id: number;
  actor_type: string;
  actor_id: number;
  action: string;
  resource_type: string;
  resource_id: number | null;
  ip_address: string | null;
  createdAt: string;
}

const ACTOR_TYPES = ["", "patient", "provider", "admin"];
const ACTIONS = ["", "view", "create", "update", "delete"];

function badge(text: string, color: string) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${color}`}>
      {text}
    </span>
  );
}

function actorBadge(type: string) {
  if (type === "patient")  return badge("patient",  "bg-blue-100 text-blue-700");
  if (type === "provider") return badge("provider", "bg-teal-100 text-teal-700");
  if (type === "admin")    return badge("admin",    "bg-purple-100 text-purple-700");
  return badge(type, "bg-gray-100 text-gray-600");
}

function actionBadge(action: string) {
  if (action === "create") return badge("create", "bg-green-100 text-green-700");
  if (action === "update") return badge("update", "bg-yellow-100 text-yellow-700");
  if (action === "delete") return badge("delete", "bg-red-100 text-red-700");
  return badge(action, "bg-gray-100 text-gray-600");
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [actorType, setActorType]     = useState("");
  const [actorId, setActorId]         = useState("");
  const [action, setAction]           = useState("");
  const [resourceType, setResourceType] = useState("");
  const [dateFrom, setDateFrom]       = useState("");
  const [dateTo, setDateTo]           = useState("");

  function buildQs(offset = 0) {
    const p = new URLSearchParams();
    if (actorType)    p.set("actor_type",    actorType);
    if (actorId)      p.set("actor_id",      actorId);
    if (action)       p.set("action",        action);
    if (resourceType) p.set("resource_type", resourceType);
    if (dateFrom)     p.set("date_from",     dateFrom);
    if (dateTo)       p.set("date_to",       dateTo);
    p.set("limit",  "100");
    p.set("offset", String(offset));
    return p.toString();
  }

  function load() {
    setLoading(true);
    adminRequest<{ total: number; data: AuditLog[] }>(`/audit-logs?${buildQs(0)}`)
      .then((r) => { setTotal(r.total); setLogs(r.data ?? []); })
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }

  function loadMore() {
    setLoadingMore(true);
    adminRequest<{ total: number; data: AuditLog[] }>(`/audit-logs?${buildQs(logs.length)}`)
      .then((r) => { setTotal(r.total); setLogs((prev) => [...prev, ...(r.data ?? [])]); })
      .catch(() => {})
      .finally(() => setLoadingMore(false));
  }

  // Load on mount only; user triggers search manually
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-base font-bold text-gray-900">Audit Logs</h1>
          <span className="text-xs text-gray-400">{total} total records</span>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <select
            value={actorType}
            onChange={(e) => setActorType(e.target.value)}
            className="text-xs border border-gray-200 rounded px-2 py-1.5 outline-none"
          >
            {ACTOR_TYPES.map((t) => <option key={t} value={t}>{t || "All actor types"}</option>)}
          </select>

          <input
            value={actorId}
            onChange={(e) => setActorId(e.target.value)}
            placeholder="Actor ID"
            className="text-xs border border-gray-200 rounded px-2 py-1.5 outline-none w-24"
          />

          <select
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="text-xs border border-gray-200 rounded px-2 py-1.5 outline-none"
          >
            {ACTIONS.map((a) => <option key={a} value={a}>{a || "All actions"}</option>)}
          </select>

          <div className="flex items-center gap-1 border border-gray-200 rounded px-2 py-1.5">
            <Search size={12} className="text-gray-400" />
            <input
              value={resourceType}
              onChange={(e) => setResourceType(e.target.value)}
              placeholder="Resource type…"
              className="text-xs outline-none w-32"
            />
          </div>

          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
            className="text-xs border border-gray-200 rounded px-2 py-1.5 outline-none" />
          <span className="text-xs text-gray-400">to</span>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
            className="text-xs border border-gray-200 rounded px-2 py-1.5 outline-none" />

          <button
            onClick={load}
            className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded hover:bg-indigo-700 transition-colors"
          >
            Apply
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-6 py-4">
        {loading ? (
          <div className="flex justify-center pt-16">
            <Loader2 className="animate-spin text-indigo-600" size={24} />
          </div>
        ) : (
          <>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  {["Time", "Actor", "ID", "Action", "Resource", "Res. ID", "IP"].map((h) => (
                    <th key={h} className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 px-3 text-gray-400 text-xs whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="py-2 px-3">{actorBadge(log.actor_type)}</td>
                    <td className="py-2 px-3 text-gray-500 text-xs">{log.actor_id}</td>
                    <td className="py-2 px-3">{actionBadge(log.action)}</td>
                    <td className="py-2 px-3 text-gray-700 text-xs font-mono">{log.resource_type}</td>
                    <td className="py-2 px-3 text-gray-400 text-xs">{log.resource_id ?? "—"}</td>
                    <td className="py-2 px-3 text-gray-400 text-xs font-mono">{log.ip_address || "—"}</td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr><td colSpan={7} className="py-12 text-center text-gray-400 text-sm">No audit logs found</td></tr>
                )}
              </tbody>
            </table>

            {logs.length < total && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  {loadingMore && <Loader2 size={14} className="animate-spin" />}
                  Load more ({total - logs.length} remaining)
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

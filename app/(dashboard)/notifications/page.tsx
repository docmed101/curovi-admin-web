"use client";

import { useEffect, useState } from "react";
import { Loader2, Search, CheckCircle2, XCircle } from "lucide-react";
import { adminRequest } from "@/lib/api/client";

interface NotificationLog {
  id: number;
  recipient_type: string;
  recipient_id: number | null;
  notification_type: string | null;
  title: string | null;
  body: string | null;
  success: boolean;
  error_message: string | null;
  created_at: string;
}

const RECIPIENT_TYPES = ["", "patient", "provider"];
const SUCCESS_OPTS = [
  { value: "", label: "All" },
  { value: "true", label: "Delivered" },
  { value: "false", label: "Failed" },
];

function recipientBadge(type: string) {
  const cls = type === "patient"
    ? "bg-blue-100 text-blue-700"
    : "bg-teal-100 text-teal-700";
  return <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${cls}`}>{type}</span>;
}

export default function NotificationsPage() {
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [recipientType, setRecipientType]     = useState("");
  const [recipientId, setRecipientId]         = useState("");
  const [notificationType, setNotificationType] = useState("");
  const [success, setSuccess]                 = useState("");
  const [dateFrom, setDateFrom]               = useState("");
  const [dateTo, setDateTo]                   = useState("");

  function buildQs(offset = 0) {
    const p = new URLSearchParams();
    if (recipientType)    p.set("recipient_type",    recipientType);
    if (recipientId)      p.set("recipient_id",      recipientId);
    if (notificationType) p.set("notification_type", notificationType);
    if (success !== "")   p.set("success",           success);
    if (dateFrom)         p.set("date_from",         dateFrom);
    if (dateTo)           p.set("date_to",           dateTo);
    p.set("limit",  "100");
    p.set("offset", String(offset));
    return p.toString();
  }

  function load() {
    setLoading(true);
    adminRequest<{ total: number; data: NotificationLog[] }>(`/notification-logs?${buildQs(0)}`)
      .then((r) => { setTotal(r.total); setLogs(r.data ?? []); })
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }

  function loadMore() {
    setLoadingMore(true);
    adminRequest<{ total: number; data: NotificationLog[] }>(`/notification-logs?${buildQs(logs.length)}`)
      .then((r) => { setTotal(r.total); setLogs((prev) => [...prev, ...(r.data ?? [])]); })
      .catch(() => {})
      .finally(() => setLoadingMore(false));
  }

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-base font-bold text-gray-900">Push Notification Logs</h1>
          <span className="text-xs text-gray-400">{total} total records</span>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <select
            value={recipientType}
            onChange={(e) => setRecipientType(e.target.value)}
            className="text-xs border border-gray-200 rounded px-2 py-1.5 outline-none text-gray-900"
          >
            {RECIPIENT_TYPES.map((t) => (
              <option key={t} value={t}>{t || "All recipients"}</option>
            ))}
          </select>

          <input
            value={recipientId}
            onChange={(e) => setRecipientId(e.target.value)}
            placeholder="Recipient ID"
            className="text-xs border border-gray-200 rounded px-2 py-1.5 outline-none w-28 text-gray-900"
          />

          <div className="flex items-center gap-1 border border-gray-200 rounded px-2 py-1.5">
            <Search size={12} className="text-gray-400" />
            <input
              value={notificationType}
              onChange={(e) => setNotificationType(e.target.value)}
              placeholder="Type (e.g. new_booking)"
              className="text-xs outline-none w-40 text-gray-900"
            />
          </div>

          <select
            value={success}
            onChange={(e) => setSuccess(e.target.value)}
            className="text-xs border border-gray-200 rounded px-2 py-1.5 outline-none text-gray-900"
          >
            {SUCCESS_OPTS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
            className="text-xs border border-gray-200 rounded px-2 py-1.5 outline-none text-gray-900" />
          <span className="text-xs text-gray-400">to</span>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
            className="text-xs border border-gray-200 rounded px-2 py-1.5 outline-none text-gray-900" />

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
                  {["Time", "Status", "Recipient", "ID", "Type", "Title", "Body / Error"].map((h) => (
                    <th key={h} className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className={`border-b border-gray-100 hover:bg-gray-50 ${!log.success ? "bg-red-50/40" : ""}`}>
                    <td className="py-2 px-3 text-gray-400 text-xs whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="py-2 px-3">
                      {log.success
                        ? <CheckCircle2 size={15} className="text-green-500" />
                        : <XCircle size={15} className="text-red-500" />}
                    </td>
                    <td className="py-2 px-3">{log.recipient_type ? recipientBadge(log.recipient_type) : "—"}</td>
                    <td className="py-2 px-3 text-gray-400 text-xs">{log.recipient_id ?? "—"}</td>
                    <td className="py-2 px-3 text-gray-700 text-xs font-mono whitespace-nowrap">{log.notification_type || "—"}</td>
                    <td className="py-2 px-3 text-gray-700 text-xs max-w-[180px] truncate">{log.title || "—"}</td>
                    <td className="py-2 px-3 text-xs max-w-[260px] truncate">
                      {log.success
                        ? <span className="text-gray-500">{log.body || "—"}</span>
                        : <span className="text-red-500">{log.error_message || log.body || "—"}</span>}
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-400 text-sm">No notification logs found</td>
                  </tr>
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

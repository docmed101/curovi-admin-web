"use client";

import { useEffect, useState } from "react";
import { Loader2, Search, CheckCircle2, XCircle, Bell } from "lucide-react";
import { adminRequest } from "@/lib/api/client";

interface Patient {
  id: number;
  name: string;
  mobile: string;
  email?: string;
  gender?: string;
  createdAt: string;
  has_fcm_token: boolean;
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [sending, setSending] = useState<number | null>(null);
  const [toast, setToast] = useState<{ id: number; msg: string; ok: boolean } | null>(null);

  useEffect(() => {
    setLoading(true);
    const qs = search ? `?q=${encodeURIComponent(search)}` : "";
    adminRequest<{ data: Patient[] }>(`/patients${qs}`)
      .then((r) => setPatients(r.data ?? []))
      .catch(() => setPatients([]))
      .finally(() => setLoading(false));
  }, [search]);

  async function sendTestPush(patient: Patient) {
    setSending(patient.id);
    try {
      await adminRequest(`/patients/${patient.id}/test-notification`, { method: "POST" });
      showToast(patient.id, "Test notification sent!", true);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to send";
      showToast(patient.id, msg, false);
    } finally {
      setSending(null);
    }
  }

  function showToast(id: number, msg: string, ok: boolean) {
    setToast({ id, msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between flex-wrap gap-2 px-4 md:px-6 py-4 border-b border-gray-200 bg-white">
        <h1 className="text-base font-bold text-gray-900">Patients</h1>
        <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-1.5">
          <Search size={14} className="text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && setSearch(query)}
            placeholder="Search name or mobile…"
            className="text-sm outline-none w-full md:w-48"
          />
        </div>
      </div>

      {toast && (
        <div className={`mx-6 mt-3 px-4 py-2 rounded-lg text-sm font-medium ${toast.ok ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {toast.msg}
        </div>
      )}

      <div className="flex-1 overflow-auto px-4 md:px-6 py-4">
        {loading ? (
          <div className="flex justify-center pt-16">
            <Loader2 className="animate-spin text-indigo-600" size={24} />
          </div>
        ) : (
          <div className="overflow-x-auto"><table className="w-full text-sm border-collapse min-w-[640px]">
            <thead>
              <tr className="border-b border-gray-200">
                {["Name", "Mobile", "Email", "Gender", "Joined", "FCM", ""].map((h) => (
                  <th key={h} className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {patients.map((p) => (
                <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-2.5 px-3 font-medium text-gray-900">{p.name || "—"}</td>
                  <td className="py-2.5 px-3 text-gray-600">+91 {p.mobile}</td>
                  <td className="py-2.5 px-3 text-gray-600">{p.email || "—"}</td>
                  <td className="py-2.5 px-3 capitalize text-gray-600">{p.gender || "—"}</td>
                  <td className="py-2.5 px-3 text-gray-400 text-xs">{new Date(p.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td>
                  <td className="py-2.5 px-3">
                    {p.has_fcm_token
                      ? <span title="FCM token registered"><CheckCircle2 size={15} className="text-green-500" /></span>
                      : <span title="No FCM token — push won't work"><XCircle size={15} className="text-red-400" /></span>}
                  </td>
                  <td className="py-2.5 px-3">
                    <button
                      onClick={() => sendTestPush(p)}
                      disabled={!p.has_fcm_token || sending === p.id}
                      title={p.has_fcm_token ? "Send test push notification" : "No FCM token"}
                      className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-indigo-50 text-indigo-600 hover:bg-indigo-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      {sending === p.id ? <Loader2 size={11} className="animate-spin" /> : <Bell size={11} />}
                      Test Push
                    </button>
                  </td>
                </tr>
              ))}
              {patients.length === 0 && (
                <tr><td colSpan={7} className="py-12 text-center text-gray-400 text-sm">No patients found</td></tr>
              )}
            </tbody>
          </table></div>
        )}
      </div>
    </div>
  );
}

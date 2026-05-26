"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { adminRequest } from "@/lib/api/client";

interface Appointment {
  id: number;
  slot_date: string;
  session?: string;
  status: string;
  doctor_id?: number;
  patient_id?: number;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending:   "bg-amber-100 text-amber-700",
  confirmed: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    setLoading(true);
    adminRequest<{ data: Appointment[] }>(`/appointments?date=${date}`)
      .then((r) => setAppointments(r.data ?? []))
      .catch(() => setAppointments([]))
      .finally(() => setLoading(false));
  }, [date]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
        <h1 className="text-base font-bold text-gray-900">Appointments</h1>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none"
        />
      </div>

      <div className="flex-1 overflow-auto px-6 py-4">
        {loading ? (
          <div className="flex justify-center pt-16">
            <Loader2 className="animate-spin text-indigo-600" size={24} />
          </div>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-200">
                {["ID", "Date", "Session", "Status", "Created"].map((h) => (
                  <th key={h} className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {appointments.map((a) => (
                <tr key={a.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-2.5 px-3 text-gray-500 text-xs">#{a.id}</td>
                  <td className="py-2.5 px-3 text-gray-900">{a.slot_date}</td>
                  <td className="py-2.5 px-3 capitalize text-gray-600">{a.session || "—"}</td>
                  <td className="py-2.5 px-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[a.status] ?? "bg-gray-100 text-gray-600"}`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-gray-400 text-xs">{new Date(a.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td>
                </tr>
              ))}
              {appointments.length === 0 && (
                <tr><td colSpan={5} className="py-12 text-center text-gray-400 text-sm">No appointments for this date</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

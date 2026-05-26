"use client";

import { useEffect, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { adminRequest } from "@/lib/api/client";

interface Patient {
  id: number;
  name: string;
  mobile: string;
  email?: string;
  gender?: string;
  createdAt: string;
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    const qs = search ? `?q=${encodeURIComponent(search)}` : "";
    adminRequest<{ data: Patient[] }>(`/patients${qs}`)
      .then((r) => setPatients(r.data ?? []))
      .catch(() => setPatients([]))
      .finally(() => setLoading(false));
  }, [search]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
        <h1 className="text-base font-bold text-gray-900">Patients</h1>
        <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-1.5">
          <Search size={14} className="text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && setSearch(query)}
            placeholder="Search name or mobile…"
            className="text-sm outline-none w-48"
          />
        </div>
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
                {["Name", "Mobile", "Email", "Gender", "Joined"].map((h) => (
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
                </tr>
              ))}
              {patients.length === 0 && (
                <tr><td colSpan={5} className="py-12 text-center text-gray-400 text-sm">No patients found</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

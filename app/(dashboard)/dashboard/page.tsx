"use client";

import { useEffect, useState } from "react";
import { Users, CalendarDays, Stethoscope, Clock, Loader2 } from "lucide-react";
import { adminRequest } from "@/lib/api/client";

interface DashboardStats {
  total_providers: number;
  total_patients: number;
  appointments_today: number;
  pending_approvals: number;
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminRequest<{ data: DashboardStats }>("/dashboard")
      .then((r) => setStats(r.data))
      .catch(() => setStats({ total_providers: 0, total_patients: 0, appointments_today: 0, pending_approvals: 0 }))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-4 md:px-6 py-4 border-b border-gray-200 bg-white">
        <h1 className="text-base font-bold text-gray-900">Dashboard</h1>
      </div>
      <div className="flex-1 overflow-auto px-4 md:px-6 py-6">
        {loading ? (
          <div className="flex justify-center pt-16">
            <Loader2 className="animate-spin text-indigo-600" size={24} />
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl">
            <StatCard
              label="Total Providers"
              value={stats?.total_providers ?? 0}
              icon={Users}
              color="bg-indigo-50 text-indigo-600"
            />
            <StatCard
              label="Total Patients"
              value={stats?.total_patients ?? 0}
              icon={Stethoscope}
              color="bg-cyan-50 text-cyan-600"
            />
            <StatCard
              label="Appointments Today"
              value={stats?.appointments_today ?? 0}
              icon={CalendarDays}
              color="bg-emerald-50 text-emerald-600"
            />
            <StatCard
              label="Pending Approvals"
              value={stats?.pending_approvals ?? 0}
              icon={Clock}
              color="bg-amber-50 text-amber-600"
            />
          </div>
        )}
      </div>
    </div>
  );
}

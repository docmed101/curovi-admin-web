"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ChevronRight, Clock, Search } from "lucide-react";
import {
  getProviders, isActive, formatDate, subscriptionLabel, providerDisplayName,
  type AdminProvider,
} from "@/lib/api/providers";

const TYPE_COLORS: Record<string, string> = {
  doctor:   "bg-cyan-100 text-cyan-700",
  hospital: "bg-violet-100 text-violet-700",
  lab:      "bg-emerald-100 text-emerald-700",
  pharmacy: "bg-amber-100 text-amber-700",
};

const REVIEW_COLORS: Record<string, string> = {
  pending:  "bg-amber-100 text-amber-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

export default function ProvidersPage() {
  const [providers, setProviders] = useState<AdminProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState("");
  const [reviewFilter, setReviewFilter] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const router = useRouter();

  useEffect(() => {
    setLoading(true);
    getProviders({
      type: typeFilter || undefined,
      review_status: reviewFilter || undefined,
      q: search || undefined,
    })
      .then(setProviders)
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [typeFilter, reviewFilter, search]);

  function handleSearchKey(e: React.KeyboardEvent) {
    if (e.key === "Enter") setSearch(searchInput);
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-gray-200 bg-white gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-bold text-gray-900">Providers</h1>
          <button
            onClick={() => setReviewFilter(reviewFilter === "pending" ? "" : "pending")}
            className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full transition-colors ${
              reviewFilter === "pending"
                ? "bg-amber-500 text-white"
                : "bg-amber-100 text-amber-700 hover:bg-amber-200"
            }`}
          >
            <Clock size={11} />
            Pending Review
          </button>
          <span className="text-xs text-gray-400">{providers.length} results</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleSearchKey}
              onBlur={() => setSearch(searchInput)}
              placeholder="Name, mobile, or UID…"
              className="pl-7 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400 w-full md:w-44"
            />
          </div>

          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none">
            <option value="">All Types</option>
            {["doctor", "hospital", "lab", "pharmacy"].map((t) => (
              <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </select>

          <select value={reviewFilter} onChange={(e) => setReviewFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none">
            <option value="">All Reviews</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
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
          <div className="overflow-x-auto"><table className="w-full text-sm border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-gray-200">
                {["Clinic / Lab / Pharmacy", "Owner / Mobile", "Type", "Specialty / Service", "Location", "Subscription", "Review", "Active", "Joined", ""].map((h) => (
                  <th key={h} className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {providers.map((p) => {
                const active = isActive(p);
                const displayName = providerDisplayName(p);
                const specialty = p.specialty ?? null;
                const city = p.profile_city ?? p.city ?? null;

                return (
                  <tr
                    key={p.id}
                    className={`border-b border-gray-100 cursor-pointer transition-colors ${
                      p.review_status === "pending"
                        ? "bg-amber-50/50 hover:bg-amber-50"
                        : "hover:bg-gray-50"
                    }`}
                    onClick={() => router.push(`/providers/${p.id}`)}
                  >
                    <td className="py-2.5 px-3">
                      <p className="font-semibold text-gray-900 leading-tight">{displayName}</p>
                      {displayName !== p.name && p.name && (
                        <p className="text-xs text-gray-400 mt-0.5">{p.name}</p>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <p className="text-gray-600">+91 {p.mobile}</p>
                      {p.email && <p className="text-xs text-gray-400 truncate max-w-[140px]">{p.email}</p>}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${TYPE_COLORS[p.type] ?? "bg-gray-100 text-gray-600"}`}>
                        {p.type || "—"}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-gray-600 text-xs max-w-[140px] truncate">
                      {specialty ?? "—"}
                    </td>
                    <td className="py-2.5 px-3 text-gray-600 text-xs">{city ?? "—"}</td>
                    <td className="py-2.5 px-3 text-gray-600 text-xs whitespace-nowrap">{subscriptionLabel(p)}</td>
                    <td className="py-2.5 px-3">
                      {p.review_status === "pending" ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 animate-pulse">
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                          Pending
                        </span>
                      ) : p.review_status ? (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${REVIEW_COLORS[p.review_status] ?? "bg-gray-100 text-gray-600"}`}>
                          {p.review_status}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {active ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-gray-400 text-xs whitespace-nowrap">{formatDate(p.createdAt)}</td>
                    <td className="py-2.5 px-3">
                      {p.review_status === "pending" ? (
                        <span className="text-xs font-semibold text-indigo-600">Review →</span>
                      ) : (
                        <ChevronRight size={14} className="text-gray-400" />
                      )}
                    </td>
                  </tr>
                );
              })}
              {providers.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-gray-400 text-sm">No providers found</td>
                </tr>
              )}
            </tbody>
          </table></div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search, ChevronRight, CheckCircle, XCircle } from "lucide-react";
import {
  getCatalogItems, formatDate, reviewCatalogItem, bulkReviewCatalogItems,
  type CatalogItem, type CatalogItemStatus,
} from "@/lib/api/catalog-reviews";

const STATUS_COLORS: Record<string, string> = {
  pending_review: "bg-amber-100 text-amber-700",
  approved:       "bg-green-100 text-green-700",
  rejected:       "bg-red-100 text-red-700",
  draft:          "bg-gray-100 text-gray-500",
};

const STATUS_LABELS: Record<string, string> = {
  pending_review: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  draft: "Draft",
};

const TABS: { key: string; label: string }[] = [
  { key: "pending_review", label: "Pending Review" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "", label: "All" },
];

export default function CatalogReviewsPage() {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending_review");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [actionLoading, setActionLoading] = useState(false);
  const [flash, setFlash] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [rejectModal, setRejectModal] = useState<{ ids: number[] } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const router = useRouter();

  useEffect(() => {
    load();
  }, [statusFilter, search]);

  async function load() {
    setLoading(true);
    try {
      const res = await getCatalogItems({
        status: statusFilter || undefined,
        search: search || undefined,
      });
      setItems(res.data);
      setTotal(res.total);
      setSelected(new Set());
    } catch (e) {
      setFlash({ type: "error", msg: (e as Error).message });
    } finally {
      setLoading(false);
    }
  }

  function toggleSelect(id: number) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === items.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(items.map(i => i.id)));
    }
  }

  async function handleApprove(ids: number[]) {
    setActionLoading(true);
    try {
      if (ids.length === 1) {
        await reviewCatalogItem(ids[0], "approve");
      } else {
        await bulkReviewCatalogItems(ids, "approve");
      }
      setFlash({ type: "success", msg: `${ids.length} item(s) approved` });
      load();
    } catch (e) {
      setFlash({ type: "error", msg: (e as Error).message });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReject() {
    if (!rejectModal || !rejectReason.trim()) return;
    setActionLoading(true);
    try {
      if (rejectModal.ids.length === 1) {
        await reviewCatalogItem(rejectModal.ids[0], "reject", rejectReason);
      } else {
        await bulkReviewCatalogItems(rejectModal.ids, "reject", rejectReason);
      }
      setFlash({ type: "success", msg: `${rejectModal.ids.length} item(s) rejected` });
      setRejectModal(null);
      setRejectReason("");
      load();
    } catch (e) {
      setFlash({ type: "error", msg: (e as Error).message });
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Flash message */}
      {flash && (
        <div className={`p-3 rounded-lg text-sm font-medium ${flash.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {flash.msg}
          <button className="ml-2 underline" onClick={() => setFlash(null)}>dismiss</button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Catalog Reviews</h1>
          <p className="text-sm text-gray-500 mt-1">Review and approve lab catalog item submissions</p>
        </div>
        {total > 0 && statusFilter === "pending_review" && (
          <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm font-semibold">
            {total} pending
          </span>
        )}
      </div>

      {/* Tabs + Search */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                statusFilter === tab.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && setSearch(searchInput)}
              placeholder="Search by test name..."
              className="pl-9 pr-3 py-2 border rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <span className="text-sm font-medium text-blue-700">{selected.size} selected</span>
          <button
            onClick={() => handleApprove(Array.from(selected))}
            disabled={actionLoading}
            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50"
          >
            <CheckCircle className="w-4 h-4" /> Approve
          </button>
          <button
            onClick={() => setRejectModal({ ids: Array.from(selected) })}
            disabled={actionLoading}
            className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50"
          >
            <XCircle className="w-4 h-4" /> Reject
          </button>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-gray-400">No catalog items found</div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selected.size === items.length && items.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Lab</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Test Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Pricing</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">MRP</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Patient Price</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Submitted</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr
                  key={item.id}
                  className={`border-b hover:bg-gray-50 cursor-pointer ${
                    item.status === "pending_review" ? "bg-amber-50/30" : ""
                  }`}
                  onClick={() => router.push(`/catalog-reviews/${item.id}`)}
                >
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selected.has(item.id)}
                      onChange={() => toggleSelect(item.id)}
                      className="rounded"
                    />
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {item.provider?.name || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <span className="font-medium text-gray-900">{item.name}</span>
                      {item.is_custom && (
                        <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">Custom</span>
                      )}
                    </div>
                    {item.category && <div className="text-xs text-gray-400 mt-0.5">{item.category}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      item.type === "lab_test" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                    }`}>
                      {item.type === "lab_test" ? "Lab Test" : "Scan"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      item.pricing_control === "curovi_controlled" ? "bg-emerald-100 text-emerald-700" : "bg-violet-100 text-violet-700"
                    }`}>
                      {item.pricing_control === "curovi_controlled" ? "Curovi" : "Lab"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">₹{item.mrp ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-700">₹{item.patient_price ?? item.selling_price ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[item.status] || "bg-gray-100 text-gray-500"}`}>
                      {STATUS_LABELS[item.status] || item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(item.createdAt)}</td>
                  <td className="px-4 py-3">
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Reject modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Reject Catalog Item(s)</h3>
            <p className="text-sm text-gray-500 mb-4">
              Rejecting {rejectModal.ids.length} item(s). The lab provider will be notified with your reason.
            </p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason (required)..."
              rows={3}
              className="w-full border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 mb-4"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setRejectModal(null); setRejectReason(""); }}
                className="px-4 py-2 border rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim() || actionLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading ? "Rejecting..." : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

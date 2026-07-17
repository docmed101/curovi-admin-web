"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, CheckCircle, XCircle, Info } from "lucide-react";
import {
  getCatalogItem, reviewCatalogItem, formatDate,
  type CatalogItem,
} from "@/lib/api/catalog-reviews";

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  pending_review: { bg: "bg-amber-100", text: "text-amber-700", label: "Pending Review" },
  approved:       { bg: "bg-green-100", text: "text-green-700", label: "Approved" },
  rejected:       { bg: "bg-red-100",   text: "text-red-700",   label: "Rejected" },
  draft:          { bg: "bg-gray-100",  text: "text-gray-500",  label: "Draft" },
};

export default function CatalogItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [item, setItem] = useState<CatalogItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [flash, setFlash] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getCatalogItem(id)
      .then(setItem)
      .catch(e => setFlash({ type: "error", msg: (e as Error).message }))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleApprove() {
    if (!item) return;
    setActionLoading(true);
    try {
      await reviewCatalogItem(item.id, "approve");
      setFlash({ type: "success", msg: "Catalog item approved" });
      setItem({ ...item, status: "approved", reviewed_at: new Date().toISOString() });
    } catch (e) {
      setFlash({ type: "error", msg: (e as Error).message });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReject() {
    if (!item || !rejectReason.trim()) return;
    setActionLoading(true);
    try {
      await reviewCatalogItem(item.id, "reject", rejectReason);
      setFlash({ type: "success", msg: "Catalog item rejected" });
      setItem({ ...item, status: "rejected", rejection_reason: rejectReason, reviewed_at: new Date().toISOString() });
      setShowRejectModal(false);
      setRejectReason("");
    } catch (e) {
      setFlash({ type: "error", msg: (e as Error).message });
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>;
  }

  if (!item) {
    return <div className="text-center py-20 text-gray-400">Item not found</div>;
  }

  const statusStyle = STATUS_STYLES[item.status] || STATUS_STYLES.draft;
  const isPending = item.status === "pending_review";
  const price = item.patient_price ?? item.selling_price ?? item.mrp ?? 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Flash */}
      {flash && (
        <div className={`p-3 rounded-lg text-sm font-medium ${flash.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {flash.msg}
          <button className="ml-2 underline" onClick={() => setFlash(null)}>dismiss</button>
        </div>
      )}

      {/* Back + Title */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.push("/catalog-reviews")} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">{item.name}</h1>
          <p className="text-sm text-gray-500">Submitted by {item.provider?.name ?? "Unknown"} on {formatDate(item.createdAt)}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusStyle.bg} ${statusStyle.text}`}>
          {statusStyle.label}
        </span>
      </div>

      {/* Review banner */}
      {item.status === "rejected" && item.rejection_reason && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <XCircle className="w-5 h-5 text-red-500 mt-0.5" />
            <div>
              <p className="font-semibold text-red-700">Rejected</p>
              <p className="text-sm text-red-600 mt-1">Reason: {item.rejection_reason}</p>
              {item.reviewed_at && <p className="text-xs text-red-400 mt-1">Reviewed on {formatDate(item.reviewed_at)}</p>}
            </div>
          </div>
        </div>
      )}

      {item.status === "approved" && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
            <div>
              <p className="font-semibold text-green-700">Approved</p>
              {item.reviewed_at && <p className="text-xs text-green-500 mt-1">Approved on {formatDate(item.reviewed_at)}</p>}
            </div>
          </div>
        </div>
      )}

      {/* Lab Provider Info */}
      <div className="bg-white rounded-xl border p-5">
        <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">Lab Provider</h2>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div><span className="text-gray-400">Name</span><p className="font-medium text-gray-900">{item.provider?.name ?? "—"}</p></div>
          <div><span className="text-gray-400">Mobile</span><p className="font-medium text-gray-900">{item.provider?.mobile ?? "—"}</p></div>
          <div><span className="text-gray-400">Type</span><p className="font-medium text-gray-900 capitalize">{item.provider?.type ?? "—"}</p></div>
        </div>
      </div>

      {/* Item Details */}
      <div className="bg-white rounded-xl border p-5">
        <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">Item Details</h2>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div><span className="text-gray-400">Type</span><p className="font-medium">{item.type === "lab_test" ? "Lab Test" : "Scan / Imaging"}</p></div>
          <div><span className="text-gray-400">Category</span><p className="font-medium">{item.category ?? "—"}</p></div>
          <div><span className="text-gray-400">Sub Category</span><p className="font-medium">{item.sub_category ?? "—"}</p></div>
          <div><span className="text-gray-400">Sample Type</span><p className="font-medium">{item.sample_type ?? "—"}</p></div>
          <div><span className="text-gray-400">Report Time</span><p className="font-medium">{item.report_time ?? "—"}</p></div>
          <div><span className="text-gray-400">Fasting</span><p className="font-medium">{item.is_fasting_required ? "Yes" : "No"}</p></div>
          <div><span className="text-gray-400">Home Collection</span><p className="font-medium">{item.home_collection_available ? "Available" : "Not Available"}</p></div>
          <div><span className="text-gray-400">Status</span><p className="font-medium">{item.is_active ? "Active" : "Inactive"}</p></div>
          <div>
            <span className="text-gray-400">Source</span>
            <p className="font-medium">{item.is_custom ? "Custom (Lab Created)" : `Master: ${item.master_test_id}`}</p>
          </div>
        </div>
        {item.description && (
          <div className="mt-4">
            <span className="text-gray-400 text-sm">Description</span>
            <p className="text-sm text-gray-700 mt-1">{item.description}</p>
          </div>
        )}
        {item.preparation_instructions && (
          <div className="mt-3">
            <span className="text-gray-400 text-sm">Preparation Instructions</span>
            <p className="text-sm text-gray-700 mt-1">{item.preparation_instructions}</p>
          </div>
        )}
        {item.turnaround_note && (
          <div className="mt-3">
            <span className="text-gray-400 text-sm">Turnaround Note</span>
            <p className="text-sm text-gray-700 mt-1">{item.turnaround_note}</p>
          </div>
        )}
      </div>

      {/* Pricing */}
      <div className="bg-white rounded-xl border p-5">
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase">Pricing</h2>
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
            item.pricing_control === "curovi_controlled" ? "bg-emerald-100 text-emerald-700" : "bg-violet-100 text-violet-700"
          }`}>
            {item.pricing_control === "curovi_controlled" ? "Curovi Controlled" : "Lab Price Allowed"}
          </span>
        </div>
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <span className="text-gray-400 text-xs">MRP</span>
            <p className="text-lg font-bold text-gray-900 mt-1">₹{item.mrp ?? "—"}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <span className="text-gray-400 text-xs">Patient Price</span>
            <p className="text-lg font-bold text-gray-900 mt-1">₹{price}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <span className="text-gray-400 text-xs">Lab Payout</span>
            <p className="text-lg font-bold text-green-600 mt-1">₹{item.lab_payout ?? "—"}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <span className="text-gray-400 text-xs">Curovi Fee</span>
            <p className="text-lg font-bold text-blue-600 mt-1">₹{item.curovi_fee ?? "—"}</p>
          </div>
        </div>
        {item.home_collection_price != null && (
          <div className="mt-3 text-sm text-gray-600">
            <Info className="w-4 h-4 inline mr-1" />
            Home collection price: ₹{item.home_collection_price}
          </div>
        )}
        {item.discount_percentage != null && item.discount_percentage > 0 && (
          <div className="mt-2 text-sm text-gray-600">
            <Info className="w-4 h-4 inline mr-1" />
            Discount: {item.discount_percentage}%
          </div>
        )}
      </div>

      {/* Action buttons */}
      {isPending && (
        <div className="flex gap-3 justify-end">
          <button
            onClick={() => setShowRejectModal(true)}
            disabled={actionLoading}
            className="flex items-center gap-2 px-5 py-2.5 border border-red-300 text-red-600 rounded-lg font-medium hover:bg-red-50 disabled:opacity-50"
          >
            <XCircle className="w-4 h-4" /> Reject
          </button>
          <button
            onClick={handleApprove}
            disabled={actionLoading}
            className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
          >
            <CheckCircle className="w-4 h-4" /> {actionLoading ? "Processing..." : "Approve"}
          </button>
        </div>
      )}

      {/* Reject modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Reject &quot;{item.name}&quot;</h3>
            <p className="text-sm text-gray-500 mb-4">The lab provider will be notified with your reason.</p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason (required)..."
              rows={3}
              className="w-full border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 mb-4"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setShowRejectModal(false); setRejectReason(""); }}
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

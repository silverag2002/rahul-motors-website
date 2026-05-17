"use client";

import { ZapOff, AlertTriangle } from "lucide-react";

interface BulkZeroDialogProps {
  count: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function BulkZeroDialog({ count, onConfirm, onCancel }: BulkZeroDialogProps) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
            <ZapOff size={20} className="text-amber-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Bulk Zero Quantity</h2>
        </div>
        <p className="text-gray-600 text-sm mb-3">
          You are about to set all inventory quantities to <span className="font-bold text-red-600">0</span> for{" "}
          <span className="font-bold text-gray-900">{count} product{count !== 1 ? "s" : ""}</span>.
        </p>
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 mb-5 text-xs text-amber-800">
          <AlertTriangle size={14} className="shrink-0 mt-0.5" />
          <span>Admin will be notified via email for each product. This action is logged in the audit trail.</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 rounded-lg transition flex items-center justify-center gap-1.5"
          >
            <ZapOff size={14} /> Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { Product } from "../../types";
import { Trash2, AlertTriangle } from "lucide-react";

interface DeleteProductDialogProps {
  product: Product;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteProductDialog({ product, onConfirm, onCancel }: DeleteProductDialogProps) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
            <AlertTriangle size={20} className="text-red-500" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Delete Product</h2>
        </div>
        <p className="text-gray-600 text-sm mb-1">Are you sure you want to delete:</p>
        <p className="font-semibold text-gray-900 mb-4">"{product.name}"</p>
        <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-5">
          This action is permanent and cannot be undone. All inventory data for this product will be lost.
        </p>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition flex items-center justify-center gap-1.5"
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}

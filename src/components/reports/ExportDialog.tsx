"use client";

import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { productService } from "../../lib/api";
import { EXPORT_FIELDS } from "../../lib/constants";
import { toast } from "sonner";
import { X, Loader2, Download, Mail, FileText, FileSpreadsheet } from "lucide-react";

interface ExportDialogProps {
  onClose: () => void;
}

export default function ExportDialog({ onClose }: ExportDialogProps) {
  const { jwt } = useAuth();
  const [format, setFormat] = useState<"pdf" | "excel">("pdf");
  const [email, setEmail] = useState("");
  const [selectedFields, setSelectedFields] = useState<Set<string>>(
    new Set(EXPORT_FIELDS.filter((f) => f.defaultChecked).map((f) => f.key))
  );
  const [loading, setLoading] = useState(false);

  const toggleField = (key: string) => {
    setSelectedFields((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const handleExport = async () => {
    if (!jwt) return;
    if (selectedFields.size === 0) { toast.error("Select at least one field"); return; }

    setLoading(true);
    try {
      const result = await productService.exportProducts(jwt, {
        fields: [...selectedFields],
        format,
        email: email.trim() || undefined,
      });

      if (email.trim()) {
        toast.success(`Export sent to ${email.trim()}`);
        onClose();
        return;
      }

      // Download the blob
      const blob = result as Blob;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `products_export_${Date.now()}.${format === "pdf" ? "pdf" : "xlsx"}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Export downloaded!");
      onClose();
    } catch {
      toast.error("Export failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Export Products</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Format */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Export Format</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormat("pdf")}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-medium transition ${
                  format === "pdf"
                    ? "border-amber-500 bg-amber-50 text-amber-700"
                    : "border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >
                <FileText size={16} /> PDF
              </button>
              <button
                type="button"
                onClick={() => setFormat("excel")}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-medium transition ${
                  format === "excel"
                    ? "border-amber-500 bg-amber-50 text-amber-700"
                    : "border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >
                <FileSpreadsheet size={16} /> Excel
              </button>
            </div>
          </div>

          {/* Fields */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Fields <span className="text-gray-400 font-normal">({selectedFields.size} selected)</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {EXPORT_FIELDS.map((field) => (
                <label
                  key={field.key}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition text-sm ${
                    selectedFields.has(field.key)
                      ? "border-amber-400 bg-amber-50 text-amber-800"
                      : "border-gray-200 text-gray-600 hover:border-gray-300 bg-gray-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedFields.has(field.key)}
                    onChange={() => toggleField(field.key)}
                    className="w-3.5 h-3.5 rounded accent-amber-500"
                  />
                  <span className="truncate">{field.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Email option */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Send to Email <span className="text-gray-400 font-normal">(optional — leave blank to download)</span>
            </label>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. rahulmotors08@gmail.com"
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={loading || selectedFields.size === 0}
            className="px-5 py-2 text-sm font-semibold text-gray-900 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 rounded-lg transition flex items-center gap-2"
          >
            {loading ? (
              <><Loader2 size={15} className="animate-spin" /> Generating...</>
            ) : email.trim() ? (
              <><Mail size={15} /> Send Email</>
            ) : (
              <><Download size={15} /> Download</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

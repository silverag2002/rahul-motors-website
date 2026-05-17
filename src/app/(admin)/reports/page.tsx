"use client";

import { useState } from "react";
import { FileText, FileSpreadsheet, Download, ArrowRight } from "lucide-react";
import ExportDialog from "../../../components/reports/ExportDialog";

export default function ReportsPage() {
  const [showExport, setShowExport] = useState(false);

  return (
    <div className="max-w-2xl space-y-4">
      <p className="text-sm text-gray-500">Generate and download product inventory reports in PDF or Excel format.</p>

      <div className="grid sm:grid-cols-2 gap-4">
        {/* PDF Export */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:border-amber-300 transition group">
          <div className="flex items-start justify-between mb-4">
            <div className="w-11 h-11 bg-red-100 rounded-xl flex items-center justify-center">
              <FileText size={20} className="text-red-500" />
            </div>
            <span className="text-xs font-medium bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">PDF</span>
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Products PDF Report</h3>
          <p className="text-sm text-gray-500 mb-4">Export inventory to a formatted PDF — choose exactly which fields to include.</p>
          <button
            onClick={() => setShowExport(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold text-sm rounded-lg transition"
          >
            <Download size={15} /> Generate Report
          </button>
        </div>

        {/* Excel Export */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:border-amber-300 transition group">
          <div className="flex items-start justify-between mb-4">
            <div className="w-11 h-11 bg-green-100 rounded-xl flex items-center justify-center">
              <FileSpreadsheet size={20} className="text-green-600" />
            </div>
            <span className="text-xs font-medium bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-200">Excel</span>
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Products Excel Export</h3>
          <p className="text-sm text-gray-500 mb-4">Export inventory to Excel with field selection. Download directly or send to email.</p>
          <button
            onClick={() => setShowExport(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 border border-gray-300 hover:border-amber-400 hover:bg-amber-50 text-gray-700 hover:text-amber-700 font-semibold text-sm rounded-lg transition"
          >
            <Download size={15} /> Generate Excel
          </button>
        </div>
      </div>

      {/* Info card */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <h4 className="text-sm font-semibold text-amber-800 mb-2">How to Export</h4>
        <ol className="text-sm text-amber-700 space-y-1 list-decimal list-inside">
          <li>Click Generate Report</li>
          <li>Choose PDF or Excel format</li>
          <li>Select which fields to include (some are pre-checked)</li>
          <li>Optionally enter an email address to receive the file by email</li>
          <li>Click Download (or Send Email)</li>
        </ol>
      </div>

      {showExport && <ExportDialog onClose={() => setShowExport(false)} />}
    </div>
  );
}

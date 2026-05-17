"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { auditLogService } from "../../../lib/api";
import { AuditLog } from "../../../types";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, RefreshCw, ClipboardList, Filter } from "lucide-react";
import { formatDate } from "../../../lib/utils";
import { ACTION_COLORS, LOG_ACTIONS } from "../../../lib/constants";

export default function AuditLogsPage() {
  const { jwt } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 50;

  const [filterAction, setFilterAction] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  const load = async (p = page) => {
    if (!jwt) return;
    setLoading(true);
    try {
      const result = await auditLogService.getAuditLogs(jwt, {
        action: filterAction || undefined,
        dateFrom: filterDateFrom || undefined,
        dateTo: filterDateTo || undefined,
        page: p,
        pageSize,
      });
      setLogs(result.data);
      setTotal(result.meta.total);
      setPageCount(result.meta.pageCount);
    } catch {
      toast.error("Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(page); }, [jwt, page]);
  useEffect(() => { if (page === 1) load(1); else setPage(1); }, [filterAction, filterDateFrom, filterDateTo]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Filter size={14} className="text-gray-400 shrink-0" />
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="">All Actions</option>
            {LOG_ACTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500">From</label>
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500">To</label>
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <button onClick={() => load(page)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition ml-auto" title="Refresh">
            <RefreshCw size={15} />
          </button>
          <span className="text-sm text-gray-400">{total} records</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-2">{[...Array(8)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}</div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center">
            <ClipboardList size={32} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No audit logs found</p>
            <p className="text-gray-400 text-sm mt-1">Try adjusting the filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Action</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Product</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 hidden md:table-cell">User</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 hidden lg:table-cell">Description</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600 hidden md:table-cell">Qty</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Date & Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ACTION_COLORS[log.action] || "bg-gray-100 text-gray-700"}`}>
                        {log.action.replace("PRODUCT ", "").replace("CATEGORY ", "")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800 truncate max-w-[180px]">{log.product?.name || "—"}</p>
                      {log.godown && <p className="text-xs text-gray-400">{log.godown.name}</p>}
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell">
                      {log.user?.name || log.user?.email || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs hidden lg:table-cell max-w-[240px]">
                      <p className="truncate">{log.description || "—"}</p>
                    </td>
                    <td className="px-4 py-3 text-right hidden md:table-cell">
                      {log.quantity != null ? (
                        <span className="font-medium text-gray-700">{log.quantity}</span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-gray-400 whitespace-nowrap">
                      {formatDate(log.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && pageCount > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">Page {page} of {pageCount} · {total} records</p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition">
                <ChevronLeft size={16} />
              </button>
              {[...Array(Math.min(5, pageCount))].map((_, i) => {
                const p = Math.max(1, Math.min(page - 2, pageCount - 4)) + i;
                return (
                  <button key={p} onClick={() => setPage(p)}
                    className={`w-8 h-8 text-sm rounded-lg transition ${p === page ? "bg-amber-500 text-gray-900 font-semibold" : "text-gray-600 hover:bg-gray-100"}`}>
                    {p}
                  </button>
                );
              })}
              <button onClick={() => setPage(p => Math.min(pageCount, p + 1))} disabled={page === pageCount}
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { productService, auditLogService } from "../../../lib/api";
import { Product, AuditLog } from "../../../types";
import StatsCards from "../../../components/dashboard/StatsCards";
import { formatDate, formatDisplayLabel, getTotalInventory } from "../../../lib/utils";
import { formatAuditQuantitySummary, getAuditLogCategoryName } from "../../../lib/auditLogDisplay";
import { ACTION_COLORS } from "../../../lib/constants";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function DashboardPage() {
  const { jwt } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!jwt) return;
    setLoading(true);
    try {
      const [productsRes, logsRes] = await Promise.all([
        productService.searchProducts(jwt, { pageSize: 200 }),
        auditLogService.getAuditLogs(jwt, { pageSize: 10 }),
      ]);
      setProducts(productsRes.data);
      setLogs(logsRes.data);
    } catch {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [jwt]);

  const [lowStockThreshold, setLowStockThreshold] = useState(5);

  const lowStockProducts = products.filter(
    (p) => getTotalInventory(p.inventory) < lowStockThreshold && getTotalInventory(p.inventory) > 0
  );
  const zeroStockProducts = products.filter(
    (p) => getTotalInventory(p.inventory) === 0
  );

  return (
    <div className="space-y-6">
      {/* Stats */}
      <StatsCards products={products} loading={loading} />

      {/* Alerts */}
      {!loading && (lowStockProducts.length > 0 || zeroStockProducts.length > 0) && (
        <div className="grid sm:grid-cols-2 gap-4">
          {zeroStockProducts.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle size={18} className="text-red-500 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-red-800">{zeroStockProducts.length} product(s) out of stock</p>
                <p className="text-xs text-red-600 mt-0.5 truncate">
                  {zeroStockProducts.slice(0, 3).map(p => formatDisplayLabel(p.name)).join(", ")}{zeroStockProducts.length > 3 ? "..." : ""}
                </p>
                <Link
                  href="/products?maxQuantity=0"
                  className="text-xs text-red-700 underline mt-1 inline-block hover:text-red-800 font-medium"
                >
                  View all →
                </Link>
              </div>
            </div>
          )}
          {(lowStockProducts.length > 0 || zeroStockProducts.length === 0) && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle size={18} className="text-amber-500 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-amber-800">
                    {lowStockProducts.length} product(s) low on stock
                  </p>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-amber-600">({"<"}</span>
                    <input
                      type="number"
                      min={1}
                      max={999}
                      value={lowStockThreshold}
                      onChange={(e) => setLowStockThreshold(Math.max(1, Number(e.target.value) || 1))}
                      className="w-12 text-xs text-center border border-amber-300 bg-white rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium text-amber-800"
                    />
                    <span className="text-xs text-amber-600">)</span>
                  </div>
                </div>
                {lowStockProducts.length > 0 && (
                  <p className="text-xs text-amber-600 mt-0.5 truncate">
                    {lowStockProducts.slice(0, 3).map(p => formatDisplayLabel(p.name)).join(", ")}{lowStockProducts.length > 3 ? "..." : ""}
                  </p>
                )}
                <Link
                  href={`/products?minQuantity=1&maxQuantity=${lowStockThreshold - 1}`}
                  className="text-xs text-amber-700 underline mt-1 inline-block hover:text-amber-800 font-medium"
                >
                  View all →
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Recent Activity</h2>
          <div className="flex items-center gap-2">
            <button onClick={load} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition">
              <RefreshCw size={15} />
            </button>
            <Link href="/audit-logs" className="text-sm text-amber-600 hover:text-amber-700 font-medium">
              View all →
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="p-4 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">No activity recorded yet</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {logs.map((log) => {
              const categoryName = getAuditLogCategoryName(log);
              return (
              <div key={log.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${
                    ACTION_COLORS[log.action] || "bg-gray-100 text-gray-700"
                  }`}
                >
                  {log.action.replace("PRODUCT ", "").replace("CATEGORY ", "")}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {log.product?.name && (
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {formatDisplayLabel(log.product.name)}
                      </p>
                    )}
                    {categoryName && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                        {formatDisplayLabel(categoryName)}
                      </span>
                    )}
                    {log.description && !log.product?.name && (
                      <span className="text-sm text-gray-700">{log.description}</span>
                    )}
                  </div>
                  {log.user && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      by {log.user.name || log.user.email}
                      {log.godown?.name ? ` · ${formatDisplayLabel(log.godown.name)}` : ""}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-0.5">
                    {formatAuditQuantitySummary(log)}
                  </p>
                </div>
                <p className="text-xs text-gray-400 shrink-0">{formatDate(log.createdAt)}</p>
              </div>
            );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

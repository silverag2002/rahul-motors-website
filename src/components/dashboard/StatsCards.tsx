"use client";

import { Package, BarChart3, DollarSign, TrendingUp } from "lucide-react";
import { Product } from "../../types";
import { formatCurrency, getTotalInventory } from "../../lib/utils";

interface StatsCardsProps {
  products: Product[];
  loading?: boolean;
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  loading,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  color: string;
  loading?: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{label}</p>
          {loading ? (
            <div className="h-7 w-24 bg-gray-100 rounded animate-pulse mt-1.5" />
          ) : (
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
          )}
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

export default function StatsCards({ products, loading }: StatsCardsProps) {
  const totalProducts = products.length;
  const totalInventory = products.reduce(
    (sum, p) => sum + getTotalInventory(p.inventory),
    0
  );
  const totalValue = products.reduce((sum, p) => {
    const qty = getTotalInventory(p.inventory);
    return sum + (p.purchasePrice || 0) * qty;
  }, 0);
  const avgSellPrice =
    products.filter((p) => p.minimumSellingPrice).length > 0
      ? products.reduce((sum, p) => sum + (p.minimumSellingPrice || 0), 0) /
        products.filter((p) => p.minimumSellingPrice).length
      : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Total Products"
        value={totalProducts.toLocaleString("en-IN")}
        icon={Package}
        color="bg-amber-100 text-amber-600"
        loading={loading}
      />
      <StatCard
        label="Total Inventory"
        value={totalInventory.toLocaleString("en-IN")}
        icon={BarChart3}
        color="bg-blue-100 text-blue-600"
        loading={loading}
      />
      <StatCard
        label="Inventory Value"
        value={formatCurrency(totalValue)}
        icon={DollarSign}
        color="bg-green-100 text-green-600"
        loading={loading}
      />
      <StatCard
        label="Avg Sell Price"
        value={formatCurrency(Math.round(avgSellPrice))}
        icon={TrendingUp}
        color="bg-purple-100 text-purple-600"
        loading={loading}
      />
    </div>
  );
}

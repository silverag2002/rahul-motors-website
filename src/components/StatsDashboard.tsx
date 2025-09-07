"use client";

import React from "react";
import { Product } from "../types";
import { Package, TrendingUp, DollarSign, BarChart3 } from "lucide-react";

interface StatsDashboardProps {
  products: Product[];
}

const StatsDashboard: React.FC<StatsDashboardProps> = ({ products }) => {
  const totalProducts = products.length;
  const totalInventory = products.reduce(
    (sum, product) =>
      sum + product.inventory.reduce((invSum, inv) => invSum + inv.quantity, 0),
    0
  );
  const totalValue = products.reduce(
    (sum, product) =>
      sum +
      (product.purchasePrice || 0) *
        product.inventory.reduce((invSum, inv) => invSum + inv.quantity, 0),
    0
  );
  const avgPrice =
    products.length > 0
      ? products.reduce(
          (sum, product) => sum + (product.minimumSellingPrice || 0),
          0
        ) / products.length
      : 0;

  const stats = [
    {
      name: "Total Products",
      value: totalProducts,
      icon: Package,
      color: "from-blue-500 to-blue-600",
      bgColor: "from-blue-50 to-blue-100",
    },
    {
      name: "Total Inventory",
      value: totalInventory,
      icon: BarChart3,
      color: "from-green-500 to-green-600",
      bgColor: "from-green-50 to-green-100",
    },
    {
      name: "Total Value",
      value: `₹${totalValue.toLocaleString()}`,
      icon: DollarSign,
      color: "from-purple-500 to-purple-600",
      bgColor: "from-purple-50 to-purple-100",
    },
    {
      name: "Avg. Price",
      value: `₹${avgPrice.toLocaleString()}`,
      icon: TrendingUp,
      color: "from-orange-500 to-orange-600",
      bgColor: "from-orange-50 to-orange-100",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat) => (
        <div
          key={stat.name}
          className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-300"
        >
          <div className="flex items-center">
            <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.bgColor}`}>
              <stat.icon
                className={`h-6 w-6 bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}
              />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{stat.name}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsDashboard;

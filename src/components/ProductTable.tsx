"use client";

import React, { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Product,
  Category,
  Godown,
  CreateProductData,
  UpdateInventoryData,
} from "../types";
import { productService, categoryService, godownService } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Package,
  Image as ImageIcon,
  Search,
  Filter,
  RefreshCw,
  X,
  ChevronDown,
  Check,
  FileSpreadsheet,
  FileText,
} from "lucide-react";
import StatsDashboard from "./StatsDashboard";

interface ProductTableProps {
  onEditProduct?: (product: Product) => void;
  onCreateProduct?: () => void;
}

const ProductTable: React.FC<ProductTableProps> = ({
  onEditProduct,
  onCreateProduct,
}) => {
  const { jwt } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [godowns, setGodowns] = useState<Godown[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedGodown, setSelectedGodown] = useState<string>("");
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [inventoryData, setInventoryData] = useState<UpdateInventoryData[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(
    new Set()
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRemoveGodownModal, setShowRemoveGodownModal] = useState(false);
  const [selectedGodownsForRemoval, setSelectedGodownsForRemoval] = useState<
    Set<number>
  >(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRemovingGodown, setIsRemovingGodown] = useState(false);
  const [categoryFilterSearch, setCategoryFilterSearch] = useState("");
  const [isCategoryFilterOpen, setIsCategoryFilterOpen] = useState(false);
  const categoryFilterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (jwt) {
      loadData();
    }
  }, [jwt]);

  // Close category filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        categoryFilterRef.current &&
        !categoryFilterRef.current.contains(event.target as Node)
      ) {
        setIsCategoryFilterOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const loadData = async () => {
    if (!jwt) return;

    try {
      setLoading(true);
      const [productsData, categoriesData, godownsData] = await Promise.all([
        productService.searchProducts(jwt),
        categoryService.fetchCategories(jwt),
        godownService.fetchGodowns(jwt),
      ]);

      setProducts(productsData);
      setCategories(categoriesData);
      setGodowns(godownsData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.brand?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      !selectedCategory ||
      product.categories.some((cat) => cat.id.toString() === selectedCategory);
    const matchesGodown =
      !selectedGodown ||
      product.inventory.some(
        (inv) => inv.godown.id.toString() === selectedGodown
      );

    return matchesSearch && matchesCategory && matchesGodown;
  });

  const getTotalInventory = (product: Product) => {
    return product.inventory.reduce((total, inv) => total + inv.quantity, 0);
  };

  const getInventoryBreakdown = (product: Product) => {
    return product.inventory
      .map((inv) => `${inv.godown.name}: ${inv.quantity}`)
      .join(", ");
  };

  const handleEditInventory = (product: Product) => {
    setSelectedProduct(product);
    setInventoryData(
      product.inventory.map((inv) => ({
        productId: product.id,
        godownId: inv.godown.id,
        quantity: inv.quantity,
      }))
    );
    setShowInventoryModal(true);
  };

  const handleUpdateInventory = async () => {
    if (!jwt || !selectedProduct) return;

    try {
      for (const inv of inventoryData) {
        await productService.updateInventory(jwt, inv);
      }
      await loadData();
      setShowInventoryModal(false);
    } catch (error) {
      console.error("Error updating inventory:", error);
    }
  };

  const handleCreateProduct = () => {
    if (onCreateProduct) {
      onCreateProduct();
    }
  };

  const handleEditProduct = (product: Product) => {
    if (onEditProduct) {
      onEditProduct(product);
    }
  };

  const handleSelectProduct = (productId: number, checked: boolean) => {
    setSelectedProducts((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(productId);
      } else {
        newSet.delete(productId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(new Set(filteredProducts.map((p) => p.id)));
    } else {
      setSelectedProducts(new Set());
    }
  };

  const handleDeleteProducts = async () => {
    if (!jwt || selectedProducts.size === 0) return;

    try {
      setIsDeleting(true);
      const deletePromises = Array.from(selectedProducts).map((productId) =>
        productService.deleteProduct(jwt, productId)
      );
      await Promise.all(deletePromises);
      setSelectedProducts(new Set());
      setShowDeleteConfirm(false);
      await loadData();
    } catch (error) {
      console.error("Error deleting products:", error);
      alert("Failed to delete products. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRemoveGodowns = async () => {
    if (
      !jwt ||
      selectedProducts.size === 0 ||
      selectedGodownsForRemoval.size === 0
    )
      return;

    try {
      setIsRemovingGodown(true);
      const removePromises: Promise<void>[] = [];

      selectedProducts.forEach((productId) => {
        selectedGodownsForRemoval.forEach((godownId) => {
          removePromises.push(
            productService.removeGodownFromProduct(jwt, productId, godownId)
          );
        });
      });

      await Promise.all(removePromises);
      setSelectedProducts(new Set());
      setSelectedGodownsForRemoval(new Set());
      setShowRemoveGodownModal(false);
      await loadData();
    } catch (error) {
      console.error("Error removing godowns:", error);
      alert("Failed to remove godowns. Please try again.");
    } finally {
      setIsRemovingGodown(false);
    }
  };

  const handleOpenRemoveGodownModal = () => {
    if (selectedProducts.size === 0) {
      alert("Please select at least one product");
      return;
    }
    setShowRemoveGodownModal(true);
  };

  const prepareExportData = () => {
    return filteredProducts.map((product) => {
      const categoriesList =
        product.categories.map((cat) => cat.name).join(", ") || "N/A";
      const inventoryBreakdown =
        product.inventory
          .map((inv) => `${inv.godown.name}: ${inv.quantity}`)
          .join("; ") || "No inventory";
      const totalInventory = getTotalInventory(product);

      return {
        "Product ID": product.id,
        "Product Name": product.name,
        Brand: product.brand || "N/A",
        Description: product.description || "N/A",
        Categories: categoriesList,
        "Minimum Selling Price": product.minimumSellingPrice || 0,
        "Purchase Price": product.purchasePrice || 0,
        "Total Inventory": totalInventory,
        "Inventory Breakdown": inventoryBreakdown,
        "Number of Images": product.images.length,
      };
    });
  };

  const handleExportToExcel = () => {
    const data = prepareExportData();

    if (data.length === 0) {
      alert(
        "No data to export. Please apply filters or ensure products exist."
      );
      return;
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);

    ws["!cols"] = [
      { wch: 10 },
      { wch: 30 },
      { wch: 20 },
      { wch: 40 },
      { wch: 30 },
      { wch: 20 },
      { wch: 20 },
      { wch: 15 },
      { wch: 50 },
      { wch: 15 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Products");
    const timestamp = new Date().toISOString().split("T")[0];
    XLSX.writeFile(wb, `products_export_${timestamp}.xlsx`);
  };

  const handleExportToPDF = () => {
    const data = prepareExportData();

    if (data.length === 0) {
      alert(
        "No data to export. Please apply filters or ensure products exist."
      );
      return;
    }

    const doc = new jsPDF("landscape", "pt", "a4");
    const pagePadding = 36;

    doc.setFontSize(16);
    doc.text("Products Export", pagePadding, 32);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Exported on: ${new Date().toLocaleString()}`, pagePadding, 48);

    let yPosition = 64;
    if (searchTerm || selectedCategory || selectedGodown) {
      const filterInfo: string[] = [];
      if (searchTerm) filterInfo.push(`Search: ${searchTerm}`);
      if (selectedCategory) {
        const catName =
          categories.find((c) => c.id.toString() === selectedCategory)?.name ||
          selectedCategory;
        filterInfo.push(`Category: ${catName}`);
      }
      if (selectedGodown) {
        const godownName =
          godowns.find((g) => g.id.toString() === selectedGodown)?.name ||
          selectedGodown;
        filterInfo.push(`Godown: ${godownName}`);
      }
      doc.text(`Filters: ${filterInfo.join(", ")}`, pagePadding, yPosition);
      yPosition += 16;
    }

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);

    const tableData = data.map((row) => [
      row["Product ID"],
      row["Product Name"],
      row["Brand"],
      row["Categories"],
      `${row["Minimum Selling Price"]}`,
      `${row["Purchase Price"]}`,
      row["Total Inventory"],
      row["Inventory Breakdown"],
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [
        [
          "ID",
          "Product Name",
          "Brand",
          "Categories",
          "Min Price",
          "Purchase Price",
          "Total Qty",
          "Inventory Breakdown",
        ],
      ],
      body: tableData,
      styles: {
        fontSize: 8,
        cellPadding: 3,
        overflow: "linebreak",
        halign: "left",
      },
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: 255,
        fontStyle: "bold",
        halign: "center",
      },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 140 },
        2: { cellWidth: 90 },
        3: { cellWidth: 150 },
        4: { cellWidth: 50 },
        5: { cellWidth: 50 },
        6: { cellWidth: 50 },
        7: { cellWidth: 220 },
      },
      tableWidth: "auto",
      margin: { left: pagePadding, right: pagePadding },
    });

    const timestamp = new Date().toISOString().split("T")[0];
    doc.save(`products_export_${timestamp}.pdf`);
  };

  const getAvailableGodownsWithQuantities = () => {
    const godownQuantities = new Map<
      number,
      { godown: Godown; totalQuantity: number }
    >();

    // Calculate total quantity for each godown across selected products
    filteredProducts
      .filter((product) => selectedProducts.has(product.id))
      .forEach((product) => {
        product.inventory.forEach((inv) => {
          if (inv.quantity > 0) {
            const existing = godownQuantities.get(inv.godown.id);
            if (existing) {
              existing.totalQuantity += inv.quantity;
            } else {
              godownQuantities.set(inv.godown.id, {
                godown: inv.godown,
                totalQuantity: inv.quantity,
              });
            }
          }
        });
      });

    // Convert to array and sort by name
    return Array.from(godownQuantities.values()).sort((a, b) =>
      a.godown.name.localeCompare(b.godown.name)
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="animate-spin h-8 w-8 text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Product Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage your inventory and product catalog
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportToExcel}
              className="flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium text-sm"
              title="Export to Excel"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Export Excel
            </button>
            <button
              onClick={handleExportToPDF}
              className="flex items-center px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:from-red-700 hover:to-rose-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium text-sm"
              title="Export to PDF"
            >
              <FileText className="h-4 w-4 mr-2" />
              Export PDF
            </button>
          </div>
          {selectedProducts.size > 0 && (
            <>
              <button
                onClick={handleOpenRemoveGodownModal}
                className="flex items-center px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl hover:from-orange-700 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium text-sm"
              >
                <Package className="h-4 w-4 mr-2" />
                Remove Godown ({selectedProducts.size})
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-lg hover:shadow-xl font-medium text-sm"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete ({selectedProducts.size})
              </button>
            </>
          )}
          <button
            onClick={handleCreateProduct}
            className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Product
          </button>
        </div>
      </div>

      {/* Stats Dashboard */}
      <StatsDashboard products={products} />

      {/* Filters */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Products
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or brand..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Category
            </label>
            <div className="relative" ref={categoryFilterRef}>
              {isCategoryFilterOpen && (
                <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-hidden">
                  <div className="p-2 border-b border-gray-200">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search categories..."
                        value={categoryFilterSearch}
                        onChange={(e) => {
                          setCategoryFilterSearch(e.target.value);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="overflow-y-auto max-h-48">
                    <div
                      onClick={() => {
                        setSelectedCategory("");
                        setIsCategoryFilterOpen(false);
                        setCategoryFilterSearch("");
                      }}
                      className={`flex items-center px-4 py-2 hover:bg-blue-50 cursor-pointer transition-colors ${
                        !selectedCategory ? "bg-blue-50" : ""
                      }`}
                    >
                      <div
                        className={`w-4 h-4 border-2 rounded mr-3 flex items-center justify-center ${
                          !selectedCategory
                            ? "bg-blue-600 border-blue-600"
                            : "border-gray-300"
                        }`}
                      >
                        {!selectedCategory && (
                          <Check className="h-3 w-3 text-white" />
                        )}
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        All Categories
                      </span>
                    </div>
                    {categories
                      .filter((category) =>
                        category.name
                          .toLowerCase()
                          .includes(categoryFilterSearch.toLowerCase())
                      )
                      .map((category) => {
                        const isSelected =
                          selectedCategory === category.id.toString();
                        return (
                          <div
                            key={category.id}
                            onClick={() => {
                              setSelectedCategory(
                                isSelected ? "" : category.id.toString()
                              );
                              setIsCategoryFilterOpen(false);
                              setCategoryFilterSearch("");
                            }}
                            className={`flex items-center px-4 py-2 hover:bg-blue-50 cursor-pointer transition-colors ${
                              isSelected ? "bg-blue-50" : ""
                            }`}
                          >
                            <div
                              className={`w-4 h-4 border-2 rounded mr-3 flex items-center justify-center ${
                                isSelected
                                  ? "bg-blue-600 border-blue-600"
                                  : "border-gray-300"
                              }`}
                            >
                              {isSelected && (
                                <Check className="h-3 w-3 text-white" />
                              )}
                            </div>
                            <span className="text-sm font-medium text-gray-700">
                              {category.name}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
              <div
                onClick={() => setIsCategoryFilterOpen(!isCategoryFilterOpen)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 cursor-pointer flex items-center justify-between"
              >
                <span className="text-sm text-gray-700">
                  {selectedCategory
                    ? categories.find(
                        (c) => c.id.toString() === selectedCategory
                      )?.name || "All Categories"
                    : "All Categories"}
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-gray-400 transition-transform ${
                    isCategoryFilterOpen ? "transform rotate-180" : ""
                  }`}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Godown
            </label>
            <select
              value={selectedGodown}
              onChange={(e) => setSelectedGodown(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50"
            >
              <option value="">All Godowns</option>
              {godowns.map((godown) => (
                <option key={godown.id} value={godown.id.toString()}>
                  {godown.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={loadData}
              className="flex items-center px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-200 shadow-lg hover:shadow-xl font-medium w-full justify-center"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Data
            </button>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 overflow-hidden relative">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200/50">
            <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={
                      filteredProducts.length > 0 &&
                      filteredProducts.every((p) => selectedProducts.has(p.id))
                    }
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Product Details
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Brand
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Categories
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Pricing
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Inventory
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Images
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white/50 divide-y divide-gray-200/50">
              {filteredProducts.map((product) => (
                <tr
                  key={product.id}
                  className="hover:bg-blue-50/50 transition-colors duration-200"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedProducts.has(product.id)}
                      onChange={(e) =>
                        handleSelectProduct(product.id, e.target.checked)
                      }
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center">
                        <Package className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">
                          {product.name}
                        </div>
                        {product.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {product.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {product.brand || "N/A"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      {product.categories.map((cat) => (
                        <span
                          key={cat.id}
                          className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-indigo-100 text-indigo-800"
                        >
                          {cat.name}
                        </span>
                      ))}
                      {product.categories.length === 0 && (
                        <span className="text-gray-400 text-sm">
                          No categories
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      {product.minimumSellingPrice && (
                        <div className="text-sm font-medium text-green-600">
                          Min: ₹{product.minimumSellingPrice.toLocaleString()}
                        </div>
                      )}
                      {product.purchasePrice && (
                        <div className="text-sm text-gray-600">
                          Cost: ₹{product.purchasePrice.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </td>
                  <td
                    className="px-6 py-4 whitespace-nowrap"
                    onClick={() => handleEditInventory(product)}
                  >
                    <div
                      className="text-sm font-semibold text-blue-600 cursor-pointer hover:text-blue-800 transition-colors"
                      title={getInventoryBreakdown(product)}
                    >
                      <div className="flex items-center space-x-1">
                        <Package className="h-4 w-4" />
                        <span>{getTotalInventory(product)} units</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-1">
                      {product.images.slice(0, 3).map((image, index) => (
                        <img
                          key={index}
                          src={image.thumbnailUrl || image.url}
                          alt={`${product.name} ${index + 1}`}
                          className="h-8 w-8 rounded-lg object-cover border border-gray-200"
                        />
                      ))}
                      {product.images.length > 3 && (
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-xs font-medium text-gray-600 border border-gray-200">
                          +{product.images.length - 3}
                        </div>
                      )}
                      {product.images.length === 0 && (
                        <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center">
                          <ImageIcon className="h-4 w-4 text-gray-400" />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditInventory(product)}
                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-all duration-200"
                        title="Edit Inventory"
                      >
                        <Package className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEditProduct(product)}
                        className="p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100 rounded-lg transition-all duration-200"
                        title="Edit Product"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inventory Modal */}
      {showInventoryModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="h-10 w-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center">
                  <Package className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Edit Inventory
                  </h3>
                  <p className="text-sm text-gray-500">
                    {selectedProduct.name}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {inventoryData.map((inv, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between space-x-4 p-3 bg-gray-50 rounded-xl"
                  >
                    <label className="text-sm font-medium text-gray-700 min-w-0 flex-1">
                      {godowns.find((g) => g.id === inv.godownId)?.name}:
                    </label>
                    <input
                      type="number"
                      value={inv.quantity}
                      onChange={(e) => {
                        const newData = [...inventoryData];
                        newData[index].quantity = parseInt(e.target.value) || 0;
                        setInventoryData(newData);
                      }}
                      className="w-20 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center font-medium"
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowInventoryModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateInventory}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
                >
                  Update Inventory
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="h-10 w-10 bg-gradient-to-br from-red-100 to-red-200 rounded-lg flex items-center justify-center">
                  <Trash2 className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Delete Products
                  </h3>
                  <p className="text-sm text-gray-500">
                    This action cannot be undone
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-gray-700 mb-3">
                  Are you sure you want to delete {selectedProducts.size}{" "}
                  product(s)?
                </p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800 font-medium">
                    ⚠️ Warning: This will permanently delete the selected
                    products and all associated data.
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="px-6 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors duration-200 font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteProducts}
                  disabled={isDeleting}
                  className="px-6 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
                >
                  {isDeleting ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Deleting...
                    </div>
                  ) : (
                    "Delete Products"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Remove Godown Modal */}
      {showRemoveGodownModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-gradient-to-br from-orange-100 to-red-100 rounded-lg flex items-center justify-center">
                    <Package className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Remove Godown from Products
                    </h3>
                    <p className="text-sm text-gray-500">
                      Select godowns to remove from {selectedProducts.size}{" "}
                      selected product(s)
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowRemoveGodownModal(false);
                    setSelectedGodownsForRemoval(new Set());
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Select Godowns to Remove *
                </label>
                {getAvailableGodownsWithQuantities().length === 0 ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                    <p className="text-sm text-yellow-800">
                      No godowns with inventory found in the selected products.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto p-2 bg-gray-50 rounded-xl">
                      {getAvailableGodownsWithQuantities().map(
                        ({ godown, totalQuantity }) => (
                          <label
                            key={godown.id}
                            className="flex items-center justify-between p-3 bg-white rounded-xl hover:bg-gray-100 cursor-pointer transition-colors duration-200 border border-gray-200"
                          >
                            <div className="flex items-center flex-1">
                              <input
                                type="checkbox"
                                checked={selectedGodownsForRemoval.has(
                                  godown.id
                                )}
                                onChange={(e) => {
                                  setSelectedGodownsForRemoval((prev) => {
                                    const newSet = new Set(prev);
                                    if (e.target.checked) {
                                      newSet.add(godown.id);
                                    } else {
                                      newSet.delete(godown.id);
                                    }
                                    return newSet;
                                  });
                                }}
                                className="mr-3 h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                              />
                              <span className="text-sm font-medium text-gray-700">
                                {godown.name}
                              </span>
                            </div>
                            <span className="text-sm font-semibold text-blue-600 ml-3 px-2 py-1 bg-blue-50 rounded-lg">
                              Qty: {totalQuantity}
                            </span>
                          </label>
                        )
                      )}
                    </div>
                    {selectedGodownsForRemoval.size === 0 && (
                      <p className="mt-2 text-sm text-red-600">
                        Please select at least one godown
                      </p>
                    )}
                  </>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> This will remove the selected godown(s)
                  from all {selectedProducts.size} selected product(s). This
                  action cannot be undone.
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowRemoveGodownModal(false);
                    setSelectedGodownsForRemoval(new Set());
                  }}
                  disabled={isRemovingGodown}
                  className="px-6 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors duration-200 font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRemoveGodowns}
                  disabled={
                    isRemovingGodown ||
                    selectedGodownsForRemoval.size === 0 ||
                    getAvailableGodownsWithQuantities().length === 0
                  }
                  className="px-6 py-2 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl hover:from-orange-700 hover:to-red-700 disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
                >
                  {isRemovingGodown ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Removing...
                    </div>
                  ) : (
                    "Remove Godown"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductTable;

"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { productService, categoryService, godownService } from "../../../lib/api";
import { Product, Category, Godown, SearchParams } from "../../../types";
import { formatCurrency, getTotalInventory } from "../../../lib/utils";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import {
  Plus, Search, RefreshCw, Trash2, Edit, ChevronLeft,
  ChevronRight, Package, AlertCircle, Filter, X, ZapOff,
  FileDown, Boxes
} from "lucide-react";
import ProductFormModal from "../../../components/products/ProductFormModal";
import DeleteProductDialog from "../../../components/products/DeleteProductDialog";
import BulkZeroDialog from "../../../components/products/BulkZeroDialog";
import InventoryModal from "../../../components/products/InventoryModal";
import ExportDialog from "../../../components/reports/ExportDialog";

export default function ProductsPage() {
  const { jwt } = useAuth();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [godowns, setGodowns] = useState<Godown[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const pageSize = 25;

  // Filters
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedGodown, setSelectedGodown] = useState("");
  const [minQty, setMinQty] = useState<string>(() => searchParams.get("minQuantity") ?? "");
  const [maxQty, setMaxQty] = useState<string>(() => searchParams.get("maxQuantity") ?? "");
  const [minQtyInput, setMinQtyInput] = useState<string>(() => searchParams.get("minQuantity") ?? "");
  const [maxQtyInput, setMaxQtyInput] = useState<string>(() => searchParams.get("maxQuantity") ?? "");

  // Selection
  const [selected, setSelected] = useState<Set<number>>(new Set());

  // Modals
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
  const [showBulkZero, setShowBulkZero] = useState(false);
  const [inventoryProduct, setInventoryProduct] = useState<Product | null>(null);
  const [showExport, setShowExport] = useState(false);

  const loadData = useCallback(async (p = page) => {
    if (!jwt) return;
    setLoading(true);
    try {
      const params: SearchParams = { page: p, pageSize };
      if (search) params.name = search;
      if (selectedBrand) params.brand = selectedBrand;
      if (selectedCategory) params.categoryId = Number(selectedCategory);
      if (selectedGodown) params.godownId = Number(selectedGodown);
      if (minQty !== "") params.minQuantity = Number(minQty);
      if (maxQty !== "") params.maxQuantity = Number(maxQty);
      const result = await productService.searchProducts(jwt, params);
      setProducts(result.data);
      setTotal(result.meta.total);
      setPageCount(result.meta.pageCount);
    } catch {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [jwt, page, search, selectedBrand, selectedCategory, selectedGodown, minQty, maxQty]);

  useEffect(() => {
    if (!jwt) return;
    Promise.all([
      categoryService.fetchCategories(jwt),
      godownService.fetchGodowns(jwt),
      productService.getBrands(jwt),
    ]).then(([cats, gdns, brnds]) => {
      setCategories(cats);
      setGodowns(gdns);
      setBrands(brnds);
    }).catch(() => {});
  }, [jwt]);

  useEffect(() => { loadData(page); }, [page]);
  useEffect(() => { if (page === 1) loadData(1); else setPage(1); }, [search, selectedBrand, selectedCategory, selectedGodown, minQty, maxQty]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const applyQtyFilter = () => {
    setMinQty(minQtyInput);
    setMaxQty(maxQtyInput);
  };

  const clearFilters = () => {
    setSearch(""); setSearchInput(""); setSelectedBrand(""); setSelectedCategory(""); setSelectedGodown("");
    setMinQty(""); setMaxQty(""); setMinQtyInput(""); setMaxQtyInput("");
  };

  const hasQtyFilter = minQty !== "" || maxQty !== "";
  const hasFilters = search || selectedBrand || selectedCategory || selectedGodown || hasQtyFilter;

  const stockFilterLabel = (() => {
    if (maxQty === "0") return "Out of Stock";
    if (minQty !== "" && maxQty !== "") return `Stock ${minQty}–${maxQty}`;
    if (minQty !== "") return `Stock ≥ ${minQty}`;
    if (maxQty !== "") return `Stock ≤ ${maxQty}`;
    return null;
  })();

  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const toggleAll = () => {
    setSelected(selected.size === products.length ? new Set() : new Set(products.map((p) => p.id)));
  };

  const handleDeleteConfirm = async () => {
    if (!deleteProduct || !jwt) return;
    try {
      await productService.deleteProduct(jwt, deleteProduct.id);
      toast.success(`"${deleteProduct.name}" deleted`);
      setDeleteProduct(null);
      loadData(page);
    } catch {
      toast.error("Failed to delete product");
    }
  };

  const handleBulkZeroConfirm = async () => {
    if (!jwt) return;
    try {
      await productService.bulkZeroQuantity(jwt, [...selected]);
      toast.success(`${selected.size} product(s) set to zero quantity`);
      setSelected(new Set());
      setShowBulkZero(false);
      loadData(page);
    } catch {
      toast.error("Failed to bulk zero quantities");
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditProduct(null);
    loadData(page);
    toast.success(editProduct ? "Product updated" : "Product created");
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex flex-col gap-3">
          {/* Row 1: Search + actions */}
          <div className="flex items-center gap-2">
            <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search by name..."
                  className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
              <button type="submit" className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-gray-900 font-medium text-sm rounded-lg transition shrink-0">
                Search
              </button>
            </form>
            <button onClick={() => loadData(page)} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition" title="Refresh">
              <RefreshCw size={16} />
            </button>
            <button onClick={() => setShowExport(true)} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition" title="Export">
              <FileDown size={16} />
            </button>
            <button
              onClick={() => { setEditProduct(null); setShowForm(true); }}
              className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold text-sm rounded-lg transition shrink-0"
            >
              <Plus size={15} />
              <span className="hidden sm:inline">Add Product</span>
            </button>
          </div>

          {/* Row 2: Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <Filter size={14} className="text-gray-400 shrink-0" />
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">All Brands</option>
              {brands.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">All Categories</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select
              value={selectedGodown}
              onChange={(e) => setSelectedGodown(e.target.value)}
              className="text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">All Godowns</option>
              {godowns.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>

            {/* Stock quantity filter */}
            {stockFilterLabel ? (
              <span className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-xs font-medium text-blue-700">
                <Boxes size={12} />
                {stockFilterLabel}
                <button
                  onClick={() => { setMinQty(""); setMaxQty(""); setMinQtyInput(""); setMaxQtyInput(""); }}
                  className="ml-0.5 text-blue-400 hover:text-blue-700"
                >
                  <X size={11} />
                </button>
              </span>
            ) : (
              <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-500">
                <Boxes size={12} className="text-gray-400 shrink-0" />
                <span className="hidden sm:inline text-gray-400">Qty:</span>
                <input
                  type="number"
                  placeholder="min"
                  value={minQtyInput}
                  min={0}
                  onChange={(e) => setMinQtyInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && applyQtyFilter()}
                  className="w-12 text-center bg-transparent focus:outline-none placeholder-gray-300 text-gray-700 text-xs"
                />
                <span className="text-gray-300">–</span>
                <input
                  type="number"
                  placeholder="max"
                  value={maxQtyInput}
                  min={0}
                  onChange={(e) => setMaxQtyInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && applyQtyFilter()}
                  className="w-12 text-center bg-transparent focus:outline-none placeholder-gray-300 text-gray-700 text-xs"
                />
                <button
                  onClick={applyQtyFilter}
                  disabled={minQtyInput === "" && maxQtyInput === ""}
                  className="ml-1 px-1.5 py-0.5 bg-gray-200 hover:bg-amber-500 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed text-gray-600 rounded text-xs font-medium transition"
                >
                  Go
                </button>
              </div>
            )}

            {hasFilters && (
              <button onClick={clearFilters} className="flex items-center gap-1 text-sm text-red-500 hover:text-red-600 px-2 py-1.5">
                <X size={13} /> Clear all
              </button>
            )}
            <span className="ml-auto text-sm text-gray-400">
              {total} product{total !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Bulk actions */}
          {selected.size > 0 && (
            <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
              <span className="text-sm font-medium text-gray-700">{selected.size} selected</span>
              <button
                onClick={() => setShowBulkZero(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition"
              >
                <ZapOff size={14} /> Set to Zero Qty
              </button>
              <button onClick={() => setSelected(new Set())} className="text-sm text-gray-400 hover:text-gray-600">
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-2">
            {[...Array(8)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}
          </div>
        ) : products.length === 0 ? (
          <div className="py-16 text-center">
            <Package size={36} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No products found</p>
            {hasFilters && <button onClick={clearFilters} className="mt-2 text-sm text-amber-600 hover:underline">Clear filters</button>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="w-10 px-4 py-3 text-left">
                    <input type="checkbox" checked={selected.size === products.length && products.length > 0} onChange={toggleAll}
                      className="w-4 h-4 rounded border-gray-300 text-amber-500 accent-amber-500" />
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Product</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 hidden md:table-cell">Brand</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 hidden lg:table-cell">Part No</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 hidden lg:table-cell">Categories</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">MSP</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600 hidden md:table-cell">Stock</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((product) => {
                  const totalQty = getTotalInventory(product.inventory);
                  const img = product.images?.[0];
                  return (
                    <tr key={product.id} className="hover:bg-gray-50 transition group">
                      <td className="px-4 py-3">
                        <input type="checkbox" checked={selected.has(product.id)} onChange={() => toggleSelect(product.id)}
                          className="w-4 h-4 rounded border-gray-300 accent-amber-500" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {img ? (
                            <img src={img.thumbnailUrl || img.url} alt={product.name}
                              className="w-9 h-9 object-contain rounded-lg bg-gray-100 border border-gray-200 shrink-0" />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                              <Package size={16} className="text-gray-400" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate max-w-[180px]">{product.name}</p>
                            {product.carName && <p className="text-xs text-gray-400 truncate">{product.carName}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{product.brand || "—"}</td>
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs hidden lg:table-cell">{product.partNo || "—"}</td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {product.categories.slice(0, 2).map((c) => (
                            <span key={c.id} className="inline-flex px-1.5 py-0.5 bg-amber-50 text-amber-700 text-xs rounded-full border border-amber-200">{c.name}</span>
                          ))}
                          {product.categories.length > 2 && (
                            <span className="text-xs text-gray-400">+{product.categories.length - 2}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">
                        {formatCurrency(product.minimumSellingPrice)}
                      </td>
                      <td className="px-4 py-3 text-right hidden md:table-cell">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          totalQty === 0 ? "bg-red-100 text-red-700" :
                          totalQty < 5 ? "bg-amber-100 text-amber-700" :
                          "bg-green-100 text-green-700"
                        }`}>
                          {totalQty}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setInventoryProduct(product)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition text-xs font-medium"
                            title="Edit Inventory"
                          >
                            Stock
                          </button>
                          <button
                            onClick={() => { setEditProduct(product); setShowForm(true); }}
                            className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                            title="Edit Product"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteProduct(product)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Delete Product"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && pageCount > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Page {page} of {pageCount} · {total} products
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft size={16} />
              </button>
              {[...Array(Math.min(5, pageCount))].map((_, i) => {
                const p = Math.max(1, Math.min(page - 2, pageCount - 4)) + i;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 text-sm rounded-lg transition ${
                      p === page ? "bg-amber-500 text-gray-900 font-semibold" : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(p => Math.min(pageCount, p + 1))}
                disabled={page === pageCount}
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showForm && (
        <ProductFormModal
          product={editProduct}
          categories={categories}
          godowns={godowns}
          onClose={() => { setShowForm(false); setEditProduct(null); }}
          onSuccess={handleFormSuccess}
        />
      )}
      {deleteProduct && (
        <DeleteProductDialog
          product={deleteProduct}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteProduct(null)}
        />
      )}
      {showBulkZero && (
        <BulkZeroDialog
          count={selected.size}
          onConfirm={handleBulkZeroConfirm}
          onCancel={() => setShowBulkZero(false)}
        />
      )}
      {inventoryProduct && (
        <InventoryModal
          product={inventoryProduct}
          godowns={godowns}
          onClose={() => { setInventoryProduct(null); loadData(page); }}
        />
      )}
      {showExport && (
        <ExportDialog onClose={() => setShowExport(false)} />
      )}
    </div>
  );
}

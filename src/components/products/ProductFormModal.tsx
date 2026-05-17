"use client";

import { useState, useEffect } from "react";
import { Product, Category, Godown, CreateProductData } from "../../types";
import { productService } from "../../lib/api";
import { useAuth } from "../../contexts/AuthContext";
import { toast } from "sonner";
import { X, Loader2, Plus, Minus } from "lucide-react";

interface ProductFormModalProps {
  product: Product | null;
  categories: Category[];
  godowns: Godown[];
  onClose: () => void;
  onSuccess: () => void;
}

interface InventoryEntry {
  godownId: number;
  quantity: number;
}

export default function ProductFormModal({ product, categories, godowns, onClose, onSuccess }: ProductFormModalProps) {
  const { jwt } = useAuth();
  const isEdit = !!product;
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: product?.name || "",
    brand: product?.brand || "",
    car_name: product?.carName || "",
    part_no: product?.partNo || "",
    description: product?.description || "",
    minimum_selling_price: product?.minimumSellingPrice?.toString() || "",
    purchase_price: product?.purchasePrice?.toString() || "",
  });

  const [selectedCategories, setSelectedCategories] = useState<Set<number>>(
    new Set(product?.categories.map((c) => c.id) || [])
  );

  const [inventory, setInventory] = useState<InventoryEntry[]>(
    product?.inventory.map((inv) => ({ godownId: inv.godown.id, quantity: inv.quantity })) ||
    (godowns.length > 0 ? [{ godownId: godowns[0].id, quantity: 0 }] : [])
  );

  const toggleCategory = (id: number) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const addInventoryRow = () => {
    const usedGodowns = new Set(inventory.map((i) => i.godownId));
    const nextGodown = godowns.find((g) => !usedGodowns.has(g.id));
    if (nextGodown) setInventory([...inventory, { godownId: nextGodown.id, quantity: 0 }]);
  };

  const removeInventoryRow = (idx: number) => {
    setInventory(inventory.filter((_, i) => i !== idx));
  };

  const setInventoryField = (idx: number, field: keyof InventoryEntry, value: number) => {
    setInventory(inventory.map((row, i) => (i === idx ? { ...row, [field]: value } : row)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jwt) return;
    if (!form.name.trim()) { toast.error("Product name is required"); return; }

    setLoading(true);
    try {
      const data: CreateProductData = {
        name: form.name.trim(),
        brand: form.brand.trim() || undefined,
        car_name: form.car_name.trim() || undefined,
        part_no: form.part_no.trim() || undefined,
        description: form.description.trim() || undefined,
        minimum_selling_price: form.minimum_selling_price ? Number(form.minimum_selling_price) : undefined,
        purchase_price: form.purchase_price ? Number(form.purchase_price) : undefined,
        categories: [...selectedCategories],
        inventory,
        imageIds: [],
      };

      if (isEdit) {
        await productService.updateProduct(jwt, product!.id, data);
      } else {
        await productService.createProduct(jwt, data);
      }
      onSuccess();
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message || err?.message || "Failed to save product";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ label, name, type = "text", placeholder }: { label: string; name: keyof typeof form; type?: string; placeholder?: string }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <input
        type={type}
        value={form[name]}
        onChange={(e) => setForm((f) => ({ ...f, [name]: e.target.value }))}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-gray-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">{isEdit ? "Edit Product" : "Add New Product"}</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Basic info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Field label="Product Name *" name="name" placeholder="e.g. Air Filter Assembly" />
            </div>
            <Field label="Brand" name="brand" placeholder="e.g. Bosch" />
            <Field label="Car Model" name="car_name" placeholder="e.g. Maruti Swift" />
            <Field label="Part No" name="part_no" placeholder="e.g. AF-12345" />
            <div />
            <Field label="Min Selling Price (₹)" name="minimum_selling_price" type="number" placeholder="0" />
            <Field label="Purchase Price (₹)" name="purchase_price" type="number" placeholder="0" />
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
                placeholder="Optional description..."
                className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
              />
            </div>
          </div>

          {/* Categories */}
          {categories.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Categories</label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    className={`px-3 py-1.5 text-sm rounded-lg border transition ${
                      selectedCategories.has(cat.id)
                        ? "bg-amber-500 text-gray-900 border-amber-500 font-medium"
                        : "bg-white text-gray-600 border-gray-300 hover:border-amber-400"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Inventory */}
          {!isEdit && godowns.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Initial Inventory</label>
                <button
                  type="button"
                  onClick={addInventoryRow}
                  disabled={inventory.length >= godowns.length}
                  className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 disabled:opacity-40"
                >
                  <Plus size={13} /> Add Godown
                </button>
              </div>
              <div className="space-y-2">
                {inventory.map((row, idx) => {
                  const usedGodowns = new Set(inventory.filter((_, i) => i !== idx).map((i) => i.godownId));
                  return (
                    <div key={idx} className="flex items-center gap-2">
                      <select
                        value={row.godownId}
                        onChange={(e) => setInventoryField(idx, "godownId", Number(e.target.value))}
                        className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        {godowns.filter((g) => !usedGodowns.has(g.id) || g.id === row.godownId).map((g) => (
                          <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min={0}
                        value={row.quantity}
                        onChange={(e) => setInventoryField(idx, "quantity", Number(e.target.value))}
                        placeholder="Qty"
                        className="w-24 text-sm text-center border border-gray-300 rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                      {inventory.length > 1 && (
                        <button type="button" onClick={() => removeInventoryRow(idx)} className="p-1.5 text-gray-400 hover:text-red-500">
                          <Minus size={14} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit as any}
            disabled={loading}
            className="px-5 py-2 text-sm font-semibold text-gray-900 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 rounded-lg transition flex items-center gap-2"
          >
            {loading && <Loader2 size={15} className="animate-spin" />}
            {isEdit ? "Update Product" : "Create Product"}
          </button>
        </div>
      </div>
    </div>
  );
}

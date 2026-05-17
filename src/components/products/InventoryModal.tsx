"use client";

import { useState } from "react";
import { Product, Godown } from "../../types";
import { productService } from "../../lib/api";
import { useAuth } from "../../contexts/AuthContext";
import { toast } from "sonner";
import { X, Loader2, Warehouse, Plus } from "lucide-react";
import { getTotalInventory } from "../../lib/utils";

interface InventoryModalProps {
  product: Product;
  godowns: Godown[];
  onClose: () => void;
}

export default function InventoryModal({ product, godowns, onClose }: InventoryModalProps) {
  const { jwt } = useAuth();
  const [quantities, setQuantities] = useState<Record<number, number>>(() => {
    const map: Record<number, number> = {};
    product.inventory.forEach((inv) => { map[inv.godown.id] = inv.quantity; });
    return map;
  });
  const [saving, setSaving] = useState<number | null>(null);
  const [addGodownId, setAddGodownId] = useState<string>("");
  const [addQty, setAddQty] = useState(0);
  const [adding, setAdding] = useState(false);

  const linkedGodownIds = new Set(product.inventory.map((inv) => inv.godown.id));
  const availableGodowns = godowns.filter((g) => !linkedGodownIds.has(g.id));

  const saveInventory = async (godownId: number) => {
    if (!jwt) return;
    setSaving(godownId);
    try {
      await productService.updateInventory(jwt, {
        productId: product.id,
        quantity: quantities[godownId] ?? 0,
        godownId,
      });
      toast.success("Inventory updated");
    } catch {
      toast.error("Failed to update inventory");
    } finally {
      setSaving(null);
    }
  };

  const handleAddGodown = async () => {
    if (!jwt || !addGodownId) return;
    setAdding(true);
    try {
      await productService.linkGodownToProduct(jwt, product.id, Number(addGodownId), addQty);
      toast.success("Godown linked");
      onClose();
    } catch {
      toast.error("Failed to link godown");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-semibold text-gray-900">Edit Inventory</h2>
            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[300px]">{product.name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
          {product.inventory.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">No godowns linked yet</p>
          )}
          {product.inventory.map((inv) => (
            <div key={inv.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
              <Warehouse size={15} className="text-gray-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">{inv.godown.name}</p>
                {inv.godown.location && <p className="text-xs text-gray-400">{inv.godown.location}</p>}
              </div>
              <input
                type="number"
                min={0}
                value={quantities[inv.godown.id] ?? inv.quantity}
                onChange={(e) => setQuantities((q) => ({ ...q, [inv.godown.id]: Number(e.target.value) }))}
                className="w-20 px-2 py-1.5 text-sm text-center border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <button
                onClick={() => saveInventory(inv.godown.id)}
                disabled={saving === inv.godown.id}
                className="px-3 py-1.5 text-xs font-medium bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-gray-900 rounded-lg transition flex items-center gap-1"
              >
                {saving === inv.godown.id ? <Loader2 size={12} className="animate-spin" /> : null}
                Save
              </button>
            </div>
          ))}

          {availableGodowns.length > 0 && (
            <div className="mt-4 p-3 border border-dashed border-gray-300 rounded-xl">
              <p className="text-xs font-medium text-gray-500 mb-2">Add Godown</p>
              <div className="flex gap-2">
                <select
                  value={addGodownId}
                  onChange={(e) => setAddGodownId(e.target.value)}
                  className="flex-1 text-sm border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">Select godown</option>
                  {availableGodowns.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
                <input
                  type="number"
                  min={0}
                  value={addQty}
                  onChange={(e) => setAddQty(Number(e.target.value))}
                  placeholder="Qty"
                  className="w-20 text-sm text-center border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <button
                  onClick={handleAddGodown}
                  disabled={!addGodownId || adding}
                  className="px-3 py-1.5 text-xs font-medium bg-gray-900 hover:bg-gray-700 disabled:opacity-60 text-white rounded-lg transition flex items-center gap-1"
                >
                  {adding ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                  Add
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-gray-100 flex justify-between items-center">
          <p className="text-sm text-gray-500">
            Total: <span className="font-semibold text-gray-900">{getTotalInventory(product.inventory)}</span> units
          </p>
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

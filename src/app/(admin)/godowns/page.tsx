"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { godownService } from "../../../lib/api";
import { Godown } from "../../../types";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, Warehouse, X, Loader2, Check, MapPin, Search } from "lucide-react";

export default function GodownsPage() {
  const { jwt } = useAuth();
  const [godowns, setGodowns] = useState<Godown[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createLocation, setCreateLocation] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [savingId, setSavingId] = useState<number | "new" | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const load = async () => {
    if (!jwt) return;
    setLoading(true);
    try {
      setGodowns(await godownService.fetchGodowns(jwt));
    } catch {
      toast.error("Failed to load godowns");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [jwt]);

  const filtered = godowns.filter(
    (g) =>
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      (g.location || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jwt || !createName.trim()) return;
    setSavingId("new");
    try {
      await godownService.createGodown(jwt, createName.trim(), createLocation.trim() || undefined);
      toast.success("Godown created");
      setCreateName("");
      setCreateLocation("");
      setShowCreate(false);
      load();
    } catch {
      toast.error("Failed to create godown");
    } finally {
      setSavingId(null);
    }
  };

  const handleUpdate = async (godown: Godown) => {
    if (!jwt || !editName.trim()) return;
    setSavingId(godown.id);
    try {
      await godownService.updateGodown(jwt, godown.id, editName.trim(), editLocation.trim() || undefined);
      toast.success("Godown updated");
      setEditingId(null);
      load();
    } catch {
      toast.error("Failed to update godown");
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!jwt) return;
    setDeletingId(id);
    try {
      await godownService.deleteGodown(jwt, id);
      toast.success("Godown deleted");
      setConfirmDeleteId(null);
      load();
    } catch {
      toast.error("Failed to delete godown");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search godowns..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-sm text-gray-500 hidden sm:block">
            {filtered.length} of {godowns.length} warehouses
          </span>
          <button
            onClick={() => { setShowCreate(true); setCreateName(""); setCreateLocation(""); }}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold text-sm rounded-lg transition shrink-0"
          >
            <Plus size={15} /> Add Godown
          </button>
        </div>
      </div>

      {/* Create form */}
      {showCreate && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl border-2 border-amber-400 p-5 shadow-sm">
          <p className="text-sm font-semibold text-gray-700 mb-4">New Warehouse / Godown</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Name *</label>
              <input
                autoFocus
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="e.g. Main Warehouse"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Location</label>
              <input
                value={createLocation}
                onChange={(e) => setCreateLocation(e.target.value)}
                placeholder="e.g. Sector 5, Delhi"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowCreate(false)} className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition">
              Cancel
            </button>
            <button
              type="submit"
              disabled={!createName.trim() || savingId === "new"}
              className="px-4 py-2 text-sm font-semibold bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-gray-900 rounded-lg transition flex items-center gap-1.5"
            >
              {savingId === "new" ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Create
            </button>
          </div>
        </form>
      )}

      {/* Cards grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-100 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-3/4" />
                  <div className="h-2.5 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-20 text-center">
          <Warehouse size={36} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">
            {search ? "No godowns match your search" : "No godowns yet"}
          </p>
          {!search && (
            <button
              onClick={() => setShowCreate(true)}
              className="mt-4 text-sm text-amber-600 hover:text-amber-700 font-medium"
            >
              + Add your first godown
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((godown) => (
            <div
              key={godown.id}
              className="bg-white rounded-xl border border-gray-200 hover:border-amber-300 hover:shadow-md transition-all duration-200 p-5 flex flex-col gap-4"
            >
              {editingId === godown.id ? (
                /* Edit mode */
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Name</label>
                    <input
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Escape") setEditingId(null); }}
                      className="w-full px-3 py-2 text-sm border border-amber-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Location</label>
                    <input
                      value={editLocation}
                      onChange={(e) => setEditLocation(e.target.value)}
                      placeholder="Optional"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdate(godown)}
                      disabled={!editName.trim() || savingId === godown.id}
                      className="flex-1 py-2 text-sm font-semibold bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-gray-900 rounded-lg transition flex items-center justify-center gap-1.5"
                    >
                      {savingId === godown.id ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ) : confirmDeleteId === godown.id ? (
                /* Delete confirm */
                <div className="flex flex-col items-center text-center gap-3 py-2">
                  <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                    <Trash2 size={16} className="text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Delete godown?</p>
                    <p className="text-xs text-gray-400 mt-0.5">{godown.name}</p>
                  </div>
                  <div className="flex gap-2 w-full">
                    <button
                      onClick={() => handleDelete(godown.id)}
                      disabled={deletingId === godown.id}
                      className="flex-1 py-2 text-sm font-semibold bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white rounded-lg transition flex items-center justify-center gap-1.5"
                    >
                      {deletingId === godown.id ? <Loader2 size={13} className="animate-spin" /> : null}
                      Delete
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="flex-1 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                /* Normal view */
                <>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                      <Warehouse size={18} className="text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{godown.name}</p>
                      {godown.location ? (
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5 truncate">
                          <MapPin size={10} className="shrink-0" />
                          {godown.location}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-300 mt-0.5 italic">No location</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1 border-t border-gray-100">
                    <button
                      onClick={() => {
                        setEditingId(godown.id);
                        setEditName(godown.name);
                        setEditLocation(godown.location || "");
                        setConfirmDeleteId(null);
                      }}
                      className="flex-1 py-1.5 text-xs font-medium text-gray-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition flex items-center justify-center gap-1"
                    >
                      <Edit2 size={12} /> Edit
                    </button>
                    <button
                      onClick={() => { setConfirmDeleteId(godown.id); setEditingId(null); }}
                      className="flex-1 py-1.5 text-xs font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition flex items-center justify-center gap-1"
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

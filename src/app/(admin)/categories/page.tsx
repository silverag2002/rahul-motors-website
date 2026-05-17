"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { categoryService } from "../../../lib/api";
import { Category } from "../../../types";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, Tag, X, Loader2, Check, Search } from "lucide-react";

export default function CategoriesPage() {
  const { jwt } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState("");
  const [savingId, setSavingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const load = async () => {
    if (!jwt) return;
    setLoading(true);
    try {
      setCategories(await categoryService.fetchCategories(jwt));
    } catch {
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [jwt]);

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jwt || !createName.trim()) return;
    setSavingId(-1);
    try {
      await categoryService.createCategory(jwt, createName.trim());
      toast.success("Category created");
      setCreateName("");
      setShowCreate(false);
      load();
    } catch {
      toast.error("Failed to create category");
    } finally {
      setSavingId(null);
    }
  };

  const handleEdit = async (cat: Category) => {
    if (!jwt || !editName.trim()) return;
    setSavingId(cat.id);
    try {
      await categoryService.updateCategory(jwt, cat.id, editName.trim());
      toast.success("Category updated");
      setEditingId(null);
      load();
    } catch {
      toast.error("Failed to update category");
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!jwt) return;
    setDeletingId(id);
    try {
      await categoryService.deleteCategory(jwt, id);
      toast.success("Category deleted");
      setConfirmDeleteId(null);
      load();
    } catch {
      toast.error("Failed to delete category — it may be in use by products");
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
            placeholder="Search categories..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-sm text-gray-500 hidden sm:block">
            {filtered.length} of {categories.length} categories
          </span>
          <button
            onClick={() => { setShowCreate(true); setCreateName(""); }}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold text-sm rounded-lg transition shrink-0"
          >
            <Plus size={15} /> Add Category
          </button>
        </div>
      </div>

      {/* Create form */}
      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="bg-white rounded-xl border-2 border-amber-400 p-5 shadow-sm flex items-end gap-3"
        >
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
              New Category Name
            </label>
            <input
              autoFocus
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              placeholder="e.g. Brake Pads"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <button
            type="submit"
            disabled={!createName.trim() || savingId === -1}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-gray-900 font-semibold text-sm rounded-lg transition flex items-center gap-1.5 shrink-0"
          >
            {savingId === -1 ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            Create
          </button>
          <button
            type="button"
            onClick={() => setShowCreate(false)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg shrink-0"
          >
            <X size={16} />
          </button>
        </form>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
              <div className="aspect-square bg-gray-100" />
              <div className="p-3">
                <div className="h-3 bg-gray-200 rounded w-3/4 mx-auto" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-20 text-center">
          <Tag size={36} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">
            {search ? "No categories match your search" : "No categories yet"}
          </p>
          {!search && (
            <button
              onClick={() => setShowCreate(true)}
              className="mt-4 text-sm text-amber-600 hover:text-amber-700 font-medium"
            >
              + Add your first category
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filtered.map((cat) => (
            <div
              key={cat.id}
              className="group bg-white rounded-xl border border-gray-200 hover:border-amber-300 hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col"
            >
              {/* Image */}
              <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
                {cat.imageUrl ? (
                  <img
                    src={cat.imageUrl}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Tag size={32} className="text-gray-300" />
                  </div>
                )}
                {/* Hover action overlay */}
                {editingId !== cat.id && confirmDeleteId !== cat.id && (
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <button
                      onClick={() => { setEditingId(cat.id); setEditName(cat.name); setConfirmDeleteId(null); }}
                      className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-gray-700 hover:text-amber-600 shadow-lg transition"
                      title="Edit"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => { setConfirmDeleteId(cat.id); setEditingId(null); }}
                      className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-gray-700 hover:text-red-600 shadow-lg transition"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>

              {/* Name / Edit / Delete */}
              <div className="p-3 flex-1 flex flex-col justify-center">
                {editingId === cat.id ? (
                  <div className="space-y-2">
                    <input
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleEdit(cat); if (e.key === "Escape") setEditingId(null); }}
                      className="w-full px-2 py-1 text-xs border border-amber-400 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit(cat)}
                        disabled={!editName.trim() || savingId === cat.id}
                        className="flex-1 py-1 text-xs font-semibold bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-gray-900 rounded-md transition flex items-center justify-center gap-1"
                      >
                        {savingId === cat.id ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} />}
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  </div>
                ) : confirmDeleteId === cat.id ? (
                  <div className="space-y-2">
                    <p className="text-xs text-red-600 font-medium text-center">Delete this category?</p>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleDelete(cat.id)}
                        disabled={deletingId === cat.id}
                        className="flex-1 py-1 text-xs font-semibold bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white rounded-md transition flex items-center justify-center gap-1"
                      >
                        {deletingId === cat.id ? <Loader2 size={10} className="animate-spin" /> : null}
                        Yes, delete
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition"
                      >
                        No
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs font-semibold text-gray-700 text-center truncate" title={cat.name}>
                    {cat.name}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

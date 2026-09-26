"use client";

import React, { useState, useEffect } from "react";
import {
  getAdminCategories,
  createAdminCategory,
  updateAdminCategory,
  deactivateAdminCategory,
} from "@/lib/api";
import { AdminCategory } from "@/types";
import {
  Layers,
  PlusCircle,
  Edit2,
  CheckCircle2,
  XCircle,
  Loader2,
  Save,
  AlertCircle,
  X,
} from "lucide-react";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Create Modal / Inline state
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newTagline, setNewTagline] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newDisplayOrder, setNewDisplayOrder] = useState("0");
  const [isSavingNew, setIsSavingNew] = useState(false);

  // Edit Modal state
  const [editingCategory, setEditingCategory] = useState<AdminCategory | null>(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editTagline, setEditTagline] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDisplayOrder, setEditDisplayOrder] = useState("0");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const list = await getAdminCategories();
      setCategories(list);
    } catch (err: any) {
      console.error("Failed to load categories:", err);
      setError(err?.message || "Failed to load categories.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleNameChangeForNew = (val: string) => {
    setNewName(val);
    if (!newSlug || newSlug === val.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, -1)) {
      setNewSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
      );
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newSlug.trim()) {
      setError("Please provide both category name and slug.");
      return;
    }

    setIsSavingNew(true);
    setError(null);
    try {
      await createAdminCategory({
        name: newName.trim(),
        slug: newSlug.trim().toLowerCase(),
        tagline: newTagline.trim() || undefined,
        description: newDescription.trim() || undefined,
        display_order: Number(newDisplayOrder) || 0,
        is_active: true,
      });

      setIsCreating(false);
      setNewName("");
      setNewSlug("");
      setNewTagline("");
      setNewDescription("");
      setNewDisplayOrder("0");
      setActionMessage("Category created successfully!");
      fetchCategories();
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      console.error("Create category failure:", err);
      setError(err?.message || "Failed to create category.");
    } finally {
      setIsSavingNew(false);
    }
  };

  const openEdit = (cat: AdminCategory) => {
    setEditingCategory(cat);
    setEditName(cat.name);
    setEditSlug(cat.slug);
    setEditTagline(cat.tagline || "");
    setEditDescription(cat.description || "");
    setEditDisplayOrder(String(cat.display_order));
    setError(null);
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;

    setIsSavingEdit(true);
    setError(null);
    try {
      await updateAdminCategory(editingCategory.id, {
        name: editName.trim(),
        slug: editSlug.trim().toLowerCase(),
        tagline: editTagline.trim() || undefined,
        description: editDescription.trim() || undefined,
        display_order: Number(editDisplayOrder) || 0,
      });

      setEditingCategory(null);
      setActionMessage(`Category '${editName}' updated successfully!`);
      fetchCategories();
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      console.error("Update category failure:", err);
      setError(err?.message || "Failed to update category.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleToggleActive = async (cat: AdminCategory) => {
    try {
      if (cat.is_active) {
        await deactivateAdminCategory(cat.id);
        setActionMessage(`Category '${cat.name}' has been archived.`);
      } else {
        await updateAdminCategory(cat.id, { is_active: true });
        setActionMessage(`Category '${cat.name}' restored to active state.`);
      }
      fetchCategories();
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      console.error("Toggle category active error:", err);
      setError(err?.message || "Failed to toggle category status.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-burgundy-950">
            Weave Category Management
          </h1>
          <p className="text-xs text-charcoal-500 mt-1">
            Organize saree categories, display hierarchy, and URL slug taxonomies.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreating(true)}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-burgundy-900 hover:bg-burgundy-950 text-gold-200 text-xs font-semibold uppercase tracking-wider rounded-sm shadow-sm transition-all self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Category</span>
        </button>
      </div>

      {actionMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-sm text-xs text-emerald-900 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-sm text-xs text-red-900 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Create Modal / Form */}
      {isCreating && (
        <div className="p-6 bg-white border border-gold-400 rounded-sm shadow-md space-y-4 animate-fade-in-subtle">
          <div className="flex items-center justify-between border-b border-gold-200 pb-2">
            <h2 className="font-serif text-sm font-bold uppercase tracking-wider text-burgundy-950">
              Create New Saree Category
            </h2>
            <button
              onClick={() => setIsCreating(false)}
              className="p-1 text-charcoal-400 hover:text-charcoal-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleCreateCategory} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                  Category Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Kora Silk Sarees"
                  value={newName}
                  onChange={(e) => handleNameChangeForNew(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-ivory-50/60 border border-gold-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-gold-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                  URL Slug <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="kora-silk"
                  value={newSlug}
                  onChange={(e) => setNewSlug(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-ivory-50/60 border border-gold-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-gold-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                  Display Order
                </label>
                <input
                  type="number"
                  value={newDisplayOrder}
                  onChange={(e) => setNewDisplayOrder(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-ivory-50/60 border border-gold-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-gold-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                  Tagline / Subtitle
                </label>
                <input
                  type="text"
                  placeholder="Sheer organza texture with zari borders"
                  value={newTagline}
                  onChange={(e) => setNewTagline(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-ivory-50/60 border border-gold-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-gold-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="Handloom kora silk woven by master artisans..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-ivory-50/60 border border-gold-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-gold-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 bg-white border border-gold-300 text-charcoal-700 text-xs font-semibold uppercase tracking-wider rounded-sm hover:bg-gold-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingNew}
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-burgundy-900 hover:bg-burgundy-950 text-gold-200 text-xs font-semibold uppercase tracking-wider rounded-sm transition-all disabled:opacity-60"
              >
                {isSavingNew ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Save Category</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Category Modal */}
      {editingCategory && (
        <div className="p-6 bg-white border border-gold-500 ring-1 ring-gold-400 rounded-sm shadow-md space-y-4 animate-fade-in-subtle">
          <div className="flex items-center justify-between border-b border-gold-200 pb-2">
            <h2 className="font-serif text-sm font-bold uppercase tracking-wider text-burgundy-950">
              Edit Category: {editingCategory.name}
            </h2>
            <button
              onClick={() => setEditingCategory(null)}
              className="p-1 text-charcoal-400 hover:text-charcoal-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleUpdateCategory} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-ivory-50/60 border border-gold-200 rounded-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                  URL Slug
                </label>
                <input
                  type="text"
                  required
                  value={editSlug}
                  onChange={(e) => setEditSlug(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-ivory-50/60 border border-gold-200 rounded-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                  Display Order
                </label>
                <input
                  type="number"
                  value={editDisplayOrder}
                  onChange={(e) => setEditDisplayOrder(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-ivory-50/60 border border-gold-200 rounded-sm focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                  Tagline
                </label>
                <input
                  type="text"
                  value={editTagline}
                  onChange={(e) => setEditTagline(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-ivory-50/60 border border-gold-200 rounded-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-ivory-50/60 border border-gold-200 rounded-sm focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditingCategory(null)}
                className="px-4 py-2 bg-white border border-gold-300 text-charcoal-700 text-xs font-semibold uppercase tracking-wider rounded-sm hover:bg-gold-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingEdit}
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-burgundy-900 hover:bg-burgundy-950 text-gold-200 text-xs font-semibold uppercase tracking-wider rounded-sm transition-all disabled:opacity-60"
              >
                {isSavingEdit ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Categories Table */}
      <div className="bg-white border border-gold-300/80 rounded-sm shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center space-y-2">
            <Loader2 className="w-7 h-7 text-burgundy-900 animate-spin" />
            <span className="text-xs font-mono text-charcoal-500">Loading categories...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-charcoal-700">
              <thead className="bg-ivory-50 text-[10px] uppercase tracking-wider text-charcoal-500 border-b border-gold-200">
                <tr>
                  <th className="px-5 py-3 font-semibold">Display Order</th>
                  <th className="px-5 py-3 font-semibold">Category Name</th>
                  <th className="px-5 py-3 font-semibold">Slug Identifier</th>
                  <th className="px-5 py-3 font-semibold">Linked Sarees</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold-200/60">
                {categories.map((c) => (
                  <tr key={c.id} className="hover:bg-ivory-50/70 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-charcoal-500">#{c.display_order}</td>
                    <td className="px-5 py-3.5 font-medium text-charcoal-900">
                      <div>
                        <span className="font-semibold block">{c.name}</span>
                        {c.tagline && (
                          <span className="text-[11px] text-charcoal-500 block">{c.tagline}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-charcoal-600">{c.slug}</td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 rounded font-mono font-semibold text-xs bg-gold-100 text-burgundy-950">
                        {c.product_count} sarees
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {c.is_active ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-charcoal-400">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Archived</span>
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => openEdit(c)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-ivory-100 hover:bg-gold-100 text-charcoal-800 border border-gold-300 rounded text-xs font-medium transition-colors"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleActive(c)}
                        className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                          c.is_active
                            ? "bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                            : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
                        }`}
                        title={c.is_active ? "Archive category" : "Restore category"}
                      >
                        {c.is_active ? "Archive" : "Restore"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

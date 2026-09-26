"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  getAdminRawMaterials,
  createAdminRawMaterial,
  adjustAdminRawMaterialStock,
  getAdminSuppliers,
} from "@/lib/api/admin";
import {
  AdminRawMaterialList,
  MaterialType,
  UnitOfMeasure,
  AdminRawMaterialCreatePayload,
  AdminSupplierList,
  RawMaterialMovementType,
} from "@/types";
import {
  Scissors,
  Plus,
  Search,
  RefreshCw,
  AlertTriangle,
  ArrowRight,
  Boxes,
  Loader2,
  X,
  Sliders,
  Flame,
  CheckCircle,
  Building2,
} from "lucide-react";

export default function AdminRawMaterialsPage() {
  const [materials, setMaterials] = useState<AdminRawMaterialList[]>([]);
  const [suppliers, setSuppliers] = useState<AdminSupplierList[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<AdminRawMaterialList | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Create Form State
  const [createForm, setCreateForm] = useState<AdminRawMaterialCreatePayload>({
    material_code: "",
    name: "",
    material_type: "RAW_SILK",
    unit_of_measure: "KILOGRAMS",
    reorder_level: 10,
    unit_cost: 0,
    description: "",
    supplier_id: "",
    initial_stock: 0,
    warehouse_location: "Yarn Bay 1",
    is_active: true,
  });

  // Adjust Form State
  const [adjustDelta, setAdjustDelta] = useState<number>(0);
  const [adjustType, setAdjustType] = useState<RawMaterialMovementType>("ADJUSTMENT");
  const [adjustRef, setAdjustRef] = useState<string>("");
  const [adjustNotes, setAdjustNotes] = useState<string>("");

  const fetchMaterials = async () => {
    setIsLoading(true);
    try {
      const res = await getAdminRawMaterials({
        page,
        limit: 15,
        search: search.trim() || undefined,
        material_type: typeFilter || undefined,
        low_stock_only: lowStockOnly || undefined,
      });
      setMaterials(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (err) {
      console.error("Failed to load raw materials:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSuppliersList = async () => {
    try {
      const res = await getAdminSuppliers({ limit: 100, is_active: true });
      setSuppliers(res.items);
    } catch (err) {
      console.error("Failed to load supplier list:", err);
    }
  };

  useEffect(() => {
    fetchMaterials();
    fetchSuppliersList();
  }, [page, typeFilter, lowStockOnly]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchMaterials();
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setModalError(null);
    try {
      await createAdminRawMaterial({
        ...createForm,
        supplier_id: createForm.supplier_id || undefined,
        unit_cost: Number(createForm.unit_cost) || undefined,
        initial_stock: Number(createForm.initial_stock) || 0,
        reorder_level: Number(createForm.reorder_level) || 10,
      });
      setIsCreateModalOpen(false);
      setCreateForm({
        material_code: "",
        name: "",
        material_type: "RAW_SILK",
        unit_of_measure: "KILOGRAMS",
        reorder_level: 10,
        unit_cost: 0,
        description: "",
        supplier_id: "",
        initial_stock: 0,
        warehouse_location: "Yarn Bay 1",
        is_active: true,
      });
      fetchMaterials();
    } catch (err: any) {
      setModalError(err?.message || "Failed to create raw material SKU.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openAdjustModal = (mat: AdminRawMaterialList) => {
    setSelectedMaterial(mat);
    setAdjustDelta(0);
    setAdjustType("ADJUSTMENT");
    setAdjustRef("");
    setAdjustNotes("");
    setModalError(null);
    setIsAdjustModalOpen(true);
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMaterial) return;
    if (adjustDelta === 0) {
      setModalError("Delta adjustment cannot be zero.");
      return;
    }
    setIsSubmitting(true);
    setModalError(null);
    try {
      await adjustAdminRawMaterialStock(selectedMaterial.id, {
        movement_type: adjustType,
        quantity_delta: Number(adjustDelta),
        reference_id: adjustRef.trim() || undefined,
        notes: adjustNotes.trim() || undefined,
      });
      setIsAdjustModalOpen(false);
      fetchMaterials();
    } catch (err: any) {
      setModalError(err?.message || "Failed to adjust raw material stock.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const materialTypeLabels: Record<string, string> = {
    RAW_SILK: "Mulberry Raw Silk",
    PURE_ZARI: "Pure Gold/Silver Zari",
    METALLIC_ZARI: "Tested Metallic Zari",
    ECO_DYES: "Natural & Eco Dyes",
    PACKAGING_SUPPLIES: "Rigid Box Packaging",
    LOOM_ACCESSORIES: "Loom Harness & Jacquard",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-burgundy-950 flex items-center gap-2.5">
            <Scissors className="w-7 h-7 text-gold-600" />
            <span>Raw Materials Inventory</span>
          </h1>
          <p className="text-xs text-charcoal-500 mt-1">
            Real-time tracking of pure silk spools, gold/silver zari cones, eco dyes, and consumption ledger.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/purchases/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-charcoal-800 hover:bg-charcoal-900 text-gold-200 text-xs font-semibold uppercase tracking-wider rounded-sm transition-all"
          >
            <span>+ Purchase Order</span>
          </Link>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-burgundy-900 hover:bg-burgundy-950 text-gold-200 text-xs font-semibold uppercase tracking-wider rounded-sm shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Raw Material</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-gold-300/80 rounded-sm p-4 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-charcoal-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by material code, name, description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-charcoal-200 rounded-sm focus:outline-none focus:border-burgundy-900"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-2 bg-charcoal-800 text-gold-200 text-xs font-semibold rounded-sm hover:bg-charcoal-900"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs border border-charcoal-200 rounded-sm px-2.5 py-2 bg-white focus:outline-none focus:border-burgundy-900"
          >
            <option value="">All Material Types</option>
            <option value="RAW_SILK">Raw Silk</option>
            <option value="PURE_ZARI">Pure Zari</option>
            <option value="METALLIC_ZARI">Metallic Zari</option>
            <option value="ECO_DYES">Eco Dyes</option>
            <option value="PACKAGING_SUPPLIES">Packaging</option>
            <option value="LOOM_ACCESSORIES">Loom Accessories</option>
          </select>

          <label className="flex items-center gap-1.5 text-xs text-charcoal-700 font-medium cursor-pointer">
            <input
              type="checkbox"
              checked={lowStockOnly}
              onChange={(e) => {
                setLowStockOnly(e.target.checked);
                setPage(1);
              }}
              className="accent-burgundy-900"
            />
            <span>Low Stock Only</span>
          </label>

          <button
            onClick={fetchMaterials}
            className="p-2 border border-gold-300 rounded-sm hover:bg-gold-50 text-charcoal-600"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Raw Materials Table */}
      <div className="bg-white border border-gold-300/80 rounded-sm shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-burgundy-900 animate-spin" />
            <p className="text-xs font-semibold text-charcoal-500 font-mono">
              Loading Raw Material Stock...
            </p>
          </div>
        ) : materials.length === 0 ? (
          <div className="p-12 text-center">
            <Scissors className="w-12 h-12 text-charcoal-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-burgundy-950">No Raw Materials Found</p>
            <p className="text-xs text-charcoal-500 mt-1 max-w-sm mx-auto">
              No material specifications match your active filters. Click "Add Raw Material" to create one.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-ivory-100 border-b border-gold-200 text-charcoal-600 uppercase tracking-wider text-[10px] font-mono">
                  <th className="py-3 px-4">Code & Material Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Default Supplier</th>
                  <th className="py-3 px-4 text-right">On Hand</th>
                  <th className="py-3 px-4 text-right">Reorder Level</th>
                  <th className="py-3 px-4 text-right">Est. Unit Cost</th>
                  <th className="py-3 px-4 text-center">Stock Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal-100">
                {materials.map((m) => (
                  <tr key={m.id} className="hover:bg-ivory-50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-burgundy-900 bg-gold-100/60 px-1.5 py-0.5 rounded text-[11px]">
                          {m.material_code}
                        </span>
                        <Link
                          href={`/admin/raw-materials/${m.id}`}
                          className="font-semibold text-charcoal-900 hover:text-burgundy-900 hover:underline"
                        >
                          {m.name}
                        </Link>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-charcoal-700 bg-charcoal-100 px-2 py-0.5 rounded-full text-[10px]">
                        {materialTypeLabels[m.material_type] || m.material_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-charcoal-600">
                      {m.supplier_name || <span className="text-charcoal-400 italic">Unassigned</span>}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-charcoal-900">
                      {Number(m.quantity_on_hand).toFixed(2)}{" "}
                      <span className="text-[10px] text-charcoal-500 font-sans">{m.unit_of_measure}</span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-charcoal-600">
                      {Number(m.reorder_level).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-charcoal-700">
                      {m.unit_cost ? `₹${Number(m.unit_cost).toLocaleString("en-IN")}` : "—"}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          m.stock_status === "IN_STOCK"
                            ? "bg-emerald-100 text-emerald-800"
                            : m.stock_status === "LOW_STOCK"
                            ? "bg-amber-100 text-amber-900 ring-1 ring-amber-400"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {m.stock_status === "LOW_STOCK" && <Flame className="w-2.5 h-2.5 mr-1 text-amber-700" />}
                        {m.stock_status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openAdjustModal(m)}
                          className="px-2 py-1 bg-ivory-100 hover:bg-gold-100 text-charcoal-800 font-semibold rounded text-[11px] border border-gold-300"
                        >
                          Adjust
                        </button>
                        <Link
                          href={`/admin/raw-materials/${m.id}`}
                          className="text-burgundy-900 font-semibold hover:underline"
                        >
                          Ledger &rarr;
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gold-200 flex items-center justify-between text-xs">
            <span className="text-charcoal-500">
              Showing page {page} of {totalPages} ({total} materials total)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1 border border-charcoal-200 rounded-sm disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1 border border-charcoal-200 rounded-sm disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Raw Material Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white border border-gold-300 rounded-sm w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-gold-200 pb-3">
              <h2 className="font-serif text-lg font-bold text-burgundy-950 flex items-center gap-2">
                <Scissors className="w-5 h-5 text-gold-600" />
                <span>Create Raw Material Specification</span>
              </h2>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-charcoal-400 hover:text-charcoal-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-sm text-xs text-red-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-charcoal-700 mb-1">
                    Material Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. RM-SILK-2A"
                    value={createForm.material_code}
                    onChange={(e) => setCreateForm({ ...createForm, material_code: e.target.value })}
                    className="w-full p-2 border border-charcoal-200 rounded-sm font-mono focus:border-burgundy-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-charcoal-700 mb-1">
                    Material Type *
                  </label>
                  <select
                    value={createForm.material_type}
                    onChange={(e) => setCreateForm({ ...createForm, material_type: e.target.value as MaterialType })}
                    className="w-full p-2 border border-charcoal-200 rounded-sm bg-white focus:border-burgundy-900 focus:outline-none"
                  >
                    <option value="RAW_SILK">Mulberry Raw Silk</option>
                    <option value="PURE_ZARI">Pure Gold/Silver Zari</option>
                    <option value="METALLIC_ZARI">Tested Metallic Zari</option>
                    <option value="ECO_DYES">Natural & Eco Dyes</option>
                    <option value="PACKAGING_SUPPLIES">Packaging Supplies</option>
                    <option value="LOOM_ACCESSORIES">Loom Accessories</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">
                  Material Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mulberry Raw Silk Yarn 2A Grade"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full p-2 border border-charcoal-200 rounded-sm focus:border-burgundy-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-charcoal-700 mb-1">
                    Unit of Measure *
                  </label>
                  <select
                    value={createForm.unit_of_measure}
                    onChange={(e) => setCreateForm({ ...createForm, unit_of_measure: e.target.value as UnitOfMeasure })}
                    className="w-full p-2 border border-charcoal-200 rounded-sm bg-white focus:border-burgundy-900 focus:outline-none"
                  >
                    <option value="KILOGRAMS">Kilograms (kg)</option>
                    <option value="GRAMS">Grams (g)</option>
                    <option value="METERS">Meters (m)</option>
                    <option value="HANK_REELS">Hank / Reels</option>
                    <option value="UNITS">Units / Cones</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-charcoal-700 mb-1">
                    Reorder Threshold *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={createForm.reorder_level}
                    onChange={(e) => setCreateForm({ ...createForm, reorder_level: Number(e.target.value) })}
                    className="w-full p-2 border border-charcoal-200 rounded-sm focus:border-burgundy-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-charcoal-700 mb-1">
                    Est. Unit Cost (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={createForm.unit_cost || ""}
                    onChange={(e) => setCreateForm({ ...createForm, unit_cost: Number(e.target.value) })}
                    className="w-full p-2 border border-charcoal-200 rounded-sm focus:border-burgundy-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-charcoal-700 mb-1">
                    Default Supplier
                  </label>
                  <select
                    value={createForm.supplier_id || ""}
                    onChange={(e) => setCreateForm({ ...createForm, supplier_id: e.target.value })}
                    className="w-full p-2 border border-charcoal-200 rounded-sm bg-white focus:border-burgundy-900 focus:outline-none"
                  >
                    <option value="">No Default Supplier</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.supplier_name} ({s.supplier_code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-charcoal-700 mb-1">
                    Initial Stock Baseline
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={createForm.initial_stock || ""}
                    onChange={(e) => setCreateForm({ ...createForm, initial_stock: Number(e.target.value) })}
                    className="w-full p-2 border border-charcoal-200 rounded-sm focus:border-burgundy-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">
                  Warehouse Location / Bay
                </label>
                <input
                  type="text"
                  placeholder="e.g. Yarn Bay 1 - Bin A"
                  value={createForm.warehouse_location || ""}
                  onChange={(e) => setCreateForm({ ...createForm, warehouse_location: e.target.value })}
                  className="w-full p-2 border border-charcoal-200 rounded-sm focus:border-burgundy-900 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gold-200">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-charcoal-300 rounded-sm font-semibold text-charcoal-700 hover:bg-charcoal-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-burgundy-900 hover:bg-burgundy-950 text-gold-200 font-semibold uppercase tracking-wider rounded-sm disabled:opacity-50"
                >
                  {isSubmitting ? "Creating SKU..." : "Save Raw Material"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {isAdjustModalOpen && selectedMaterial && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white border border-gold-300 rounded-sm w-full max-w-md p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-gold-200 pb-3">
              <div>
                <h2 className="font-serif text-base font-bold text-burgundy-950">
                  Manual Stock Adjustment
                </h2>
                <p className="text-[11px] text-charcoal-500 font-mono">
                  {selectedMaterial.material_code}: {selectedMaterial.name}
                </p>
              </div>
              <button onClick={() => setIsAdjustModalOpen(false)} className="text-charcoal-400 hover:text-charcoal-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-sm text-xs text-red-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <div className="p-3 bg-ivory-100 border border-gold-200 rounded-sm text-xs flex justify-between">
              <div>
                <span className="text-charcoal-500 block">Current On-Hand:</span>
                <span className="font-mono font-bold text-charcoal-900 text-sm">
                  {Number(selectedMaterial.quantity_on_hand).toFixed(2)} {selectedMaterial.unit_of_measure}
                </span>
              </div>
              <div className="text-right">
                <span className="text-charcoal-500 block">Available:</span>
                <span className="font-mono font-bold text-emerald-800 text-sm">
                  {Number(selectedMaterial.quantity_available).toFixed(2)} {selectedMaterial.unit_of_measure}
                </span>
              </div>
            </div>

            <form onSubmit={handleAdjustSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">
                  Movement Type *
                </label>
                <select
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value as RawMaterialMovementType)}
                  className="w-full p-2 border border-charcoal-200 rounded-sm bg-white focus:border-burgundy-900 focus:outline-none"
                >
                  <option value="ADJUSTMENT">Audit Count Correction (ADJUSTMENT)</option>
                  <option value="WASTAGE_DAMAGE">Damaged / Wastage Write-off (WASTAGE_DAMAGE)</option>
                  <option value="RETURN_TO_SUPPLIER">Return to Vendor (RETURN_TO_SUPPLIER)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">
                  Quantity Delta (+ or -) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. +5.0 or -2.5"
                  value={adjustDelta || ""}
                  onChange={(e) => setAdjustDelta(Number(e.target.value))}
                  className="w-full p-2 border border-charcoal-200 rounded-sm font-mono text-sm focus:border-burgundy-900 focus:outline-none"
                />
                <span className="text-[10px] text-charcoal-400 mt-1 block">
                  Positive value increases stock; negative value decrements stock.
                </span>
              </div>

              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">
                  Audit / Cycle Reference Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. AUDIT-2026-Q3"
                  value={adjustRef}
                  onChange={(e) => setAdjustRef(e.target.value)}
                  className="w-full p-2 border border-charcoal-200 rounded-sm font-mono focus:border-burgundy-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">
                  Reason & Operational Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Physical stock verification surplus, spool dampness, etc."
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  className="w-full p-2 border border-charcoal-200 rounded-sm focus:border-burgundy-900 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gold-200">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2 border border-charcoal-300 rounded-sm font-semibold text-charcoal-700 hover:bg-charcoal-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-burgundy-900 hover:bg-burgundy-950 text-gold-200 font-semibold uppercase tracking-wider rounded-sm disabled:opacity-50"
                >
                  {isSubmitting ? "Executing..." : "Commit Adjustment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

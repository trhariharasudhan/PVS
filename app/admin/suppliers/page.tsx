"use client";

import React, { useState, useEffect } from "react";
import {
  getAdminSuppliers,
  createAdminSupplier,
  updateAdminSupplier,
} from "@/lib/api/admin";
import { AdminSupplierList, SupplierType, AdminSupplierCreatePayload } from "@/types";
import {
  Truck,
  Plus,
  Search,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  FileText,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
  Building2,
} from "lucide-react";

export default function AdminSuppliersPage() {
  const [suppliers, setSuppliers] = useState<AdminSupplierList[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [activeFilter, setActiveFilter] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Create Form State
  const [formData, setFormData] = useState<AdminSupplierCreatePayload>({
    supplier_code: "",
    supplier_name: "",
    supplier_type: "SILK_REELER",
    contact_person: "",
    phone: "",
    email: "",
    location: "Kanchipuram, Tamil Nadu",
    address: "",
    gstin: "",
    notes: "",
    is_active: true,
  });

  const fetchSuppliers = async () => {
    setIsLoading(true);
    try {
      const res = await getAdminSuppliers({
        page,
        limit: 15,
        search: search.trim() || undefined,
        supplier_type: typeFilter || undefined,
        is_active: activeFilter === "" ? undefined : activeFilter === "true",
      });
      setSuppliers(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (err) {
      console.error("Failed to load suppliers:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, [page, typeFilter, activeFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchSuppliers();
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setModalError(null);
    try {
      await createAdminSupplier(formData);
      setIsCreateModalOpen(false);
      setFormData({
        supplier_code: "",
        supplier_name: "",
        supplier_type: "SILK_REELER",
        contact_person: "",
        phone: "",
        email: "",
        location: "Kanchipuram, Tamil Nadu",
        address: "",
        gstin: "",
        notes: "",
        is_active: true,
      });
      fetchSuppliers();
    } catch (err: any) {
      setModalError(err?.message || "Failed to create supplier.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (supplier: AdminSupplierList) => {
    try {
      await updateAdminSupplier(supplier.id, { is_active: !supplier.is_active });
      fetchSuppliers();
    } catch (err) {
      console.error("Failed to toggle supplier status:", err);
    }
  };

  const supplierTypeLabels: Record<string, string> = {
    SILK_REELER: "Mulberry Silk Reeler",
    ZARI_MANUFACTURER: "Pure Zari Artisan / Mill",
    DYE_CHEMICALS: "Eco Dye & Chemical Works",
    PACKAGING: "Luxury Box & Packaging",
    LOOM_SPARES: "Handloom Spares & Jacquard",
    GENERAL: "General Materials Vendor",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-burgundy-950 flex items-center gap-2.5">
            <Truck className="w-7 h-7 text-gold-600" />
            <span>Supplier & Mill Registry</span>
          </h1>
          <p className="text-xs text-charcoal-500 mt-1">
            Directory of certified raw silk reelers, pure zari manufacturers, and traditional dye artisans.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-burgundy-900 hover:bg-burgundy-950 text-gold-200 text-xs font-semibold uppercase tracking-wider rounded-sm shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Supplier</span>
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
              placeholder="Search by supplier code, mill name, person, or phone..."
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
            <option value="">All Supplier Types</option>
            <option value="SILK_REELER">Silk Reelers</option>
            <option value="ZARI_MANUFACTURER">Zari Manufacturers</option>
            <option value="DYE_CHEMICALS">Dyes & Chemicals</option>
            <option value="PACKAGING">Packaging</option>
            <option value="LOOM_SPARES">Loom Spares</option>
            <option value="GENERAL">General</option>
          </select>

          <select
            value={activeFilter}
            onChange={(e) => {
              setActiveFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs border border-charcoal-200 rounded-sm px-2.5 py-2 bg-white focus:outline-none focus:border-burgundy-900"
          >
            <option value="">All Statuses</option>
            <option value="true">Active Only</option>
            <option value="false">Inactive Only</option>
          </select>

          <button
            onClick={fetchSuppliers}
            className="p-2 border border-gold-300 rounded-sm hover:bg-gold-50 text-charcoal-600"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Supplier Table */}
      <div className="bg-white border border-gold-300/80 rounded-sm shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-burgundy-900 animate-spin" />
            <p className="text-xs font-semibold text-charcoal-500 font-mono">
              Loading Supplier Directory...
            </p>
          </div>
        ) : suppliers.length === 0 ? (
          <div className="p-12 text-center">
            <Building2 className="w-12 h-12 text-charcoal-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-burgundy-950">No Suppliers Found</p>
            <p className="text-xs text-charcoal-500 mt-1 max-w-sm mx-auto">
              No suppliers match your active filter criteria. Click "Add Supplier" to register a new vendor.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-ivory-100 border-b border-gold-200 text-charcoal-600 uppercase tracking-wider text-[10px] font-mono">
                  <th className="py-3 px-4">Code & Mill Name</th>
                  <th className="py-3 px-4">Speciality / Type</th>
                  <th className="py-3 px-4">Key Contact & Phone</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4 text-center">Materials</th>
                  <th className="py-3 px-4 text-center">POs</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal-100">
                {suppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-ivory-50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-burgundy-900 bg-gold-100/60 px-1.5 py-0.5 rounded text-[11px]">
                          {s.supplier_code}
                        </span>
                        <span className="font-semibold text-charcoal-900">{s.supplier_name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-charcoal-700 bg-charcoal-100 px-2 py-0.5 rounded-full text-[10px]">
                        {supplierTypeLabels[s.supplier_type] || s.supplier_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-charcoal-800">{s.contact_person}</div>
                      <div className="text-[11px] text-charcoal-500 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-gold-600" />
                        <span>{s.phone}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-charcoal-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-charcoal-400" />
                        <span>{s.location}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-charcoal-700">
                      {s.materials_count}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-charcoal-700">
                      {s.purchase_orders_count}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          s.is_active
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-charcoal-100 text-charcoal-500"
                        }`}
                      >
                        {s.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleToggleActive(s)}
                        className="text-[11px] font-medium text-burgundy-900 hover:underline"
                      >
                        {s.is_active ? "Deactivate" : "Activate"}
                      </button>
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
              Showing page {page} of {totalPages} ({total} suppliers total)
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

      {/* Create Supplier Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white border border-gold-300 rounded-sm w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-gold-200 pb-3">
              <h2 className="font-serif text-lg font-bold text-burgundy-950 flex items-center gap-2">
                <Truck className="w-5 h-5 text-gold-600" />
                <span>Register Verified Supplier</span>
              </h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-charcoal-400 hover:text-charcoal-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-sm flex items-center gap-2 text-xs text-red-900">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSupplier} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-charcoal-700 mb-1">
                    Supplier Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SUP-SILK-001"
                    value={formData.supplier_code}
                    onChange={(e) => setFormData({ ...formData, supplier_code: e.target.value })}
                    className="w-full p-2 border border-charcoal-200 rounded-sm font-mono focus:border-burgundy-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-charcoal-700 mb-1">
                    Supplier Type *
                  </label>
                  <select
                    value={formData.supplier_type}
                    onChange={(e) => setFormData({ ...formData, supplier_type: e.target.value as SupplierType })}
                    className="w-full p-2 border border-charcoal-200 rounded-sm bg-white focus:border-burgundy-900 focus:outline-none"
                  >
                    <option value="SILK_REELER">Mulberry Silk Reeler</option>
                    <option value="ZARI_MANUFACTURER">Pure Zari Manufacturer</option>
                    <option value="DYE_CHEMICALS">Eco Dyes & Chemicals</option>
                    <option value="PACKAGING">Packaging Supplier</option>
                    <option value="LOOM_SPARES">Handloom Spares</option>
                    <option value="GENERAL">General Materials</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">
                  Supplier / Mill Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kanchi Mulberry Reelers Society"
                  value={formData.supplier_name}
                  onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                  className="w-full p-2 border border-charcoal-200 rounded-sm focus:border-burgundy-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-charcoal-700 mb-1">
                    Contact Person *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. V. Ranganathan"
                    value={formData.contact_person}
                    onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                    className="w-full p-2 border border-charcoal-200 rounded-sm focus:border-burgundy-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-charcoal-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. +91 94432 12345"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-2 border border-charcoal-200 rounded-sm focus:border-burgundy-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-charcoal-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. contact@kanchireelers.test"
                    value={formData.email || ""}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-2 border border-charcoal-200 rounded-sm focus:border-burgundy-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-charcoal-700 mb-1">
                    GSTIN / Tax ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 33AAAAA1234A1Z5"
                    value={formData.gstin || ""}
                    onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                    className="w-full p-2 border border-charcoal-200 rounded-sm font-mono focus:border-burgundy-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">
                  Location / City *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kanchipuram, Tamil Nadu"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full p-2 border border-charcoal-200 rounded-sm focus:border-burgundy-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">
                  Full Mill Address
                </label>
                <textarea
                  rows={2}
                  placeholder="Street address, weaver colony, pin code..."
                  value={formData.address || ""}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
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
                  {isSubmitting ? "Registering..." : "Register Supplier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

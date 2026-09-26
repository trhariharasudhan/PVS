"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  getAdminSuppliers,
  getAdminRawMaterials,
  createAdminPurchase,
} from "@/lib/api/admin";
import {
  AdminSupplierList,
  AdminRawMaterialList,
  AdminPurchaseOrderItemCreatePayload,
} from "@/types";
import {
  FileText,
  ArrowLeft,
  Plus,
  Trash2,
  AlertTriangle,
  Loader2,
  Truck,
  Scissors,
} from "lucide-react";

export default function NewPurchaseOrderPage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<AdminSupplierList[]>([]);
  const [materials, setMaterials] = useState<AdminRawMaterialList[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Form State
  const [supplierId, setSupplierId] = useState("");
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split("T")[0]);
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");
  const [taxAmount, setTaxAmount] = useState<number>(0);
  const [notes, setNotes] = useState("");

  interface LineItemState {
    raw_material_id: string;
    quantity_ordered: number;
    unit_cost: number;
  }

  const [items, setItems] = useState<LineItemState[]>([
    { raw_material_id: "", quantity_ordered: 1, unit_cost: 0 },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setIsLoadingData(true);
      try {
        const [supRes, matRes] = await Promise.all([
          getAdminSuppliers({ limit: 100, is_active: true }),
          getAdminRawMaterials({ limit: 100, is_active: true }),
        ]);
        setSuppliers(supRes.items);
        setMaterials(matRes.items);
      } catch (err) {
        console.error("Failed to load suppliers/materials:", err);
      } finally {
        setIsLoadingData(false);
      }
    }
    loadData();
  }, []);

  const handleItemChange = (
    index: number,
    field: keyof LineItemState,
    value: string | number
  ) => {
    const next = [...items];
    if (field === "raw_material_id") {
      next[index].raw_material_id = String(value);
      const selectedMat = materials.find((m) => m.id === value);
      if (selectedMat && selectedMat.unit_cost) {
        next[index].unit_cost = Number(selectedMat.unit_cost);
      }
    } else {
      next[index][field] = Number(value) as never;
    }
    setItems(next);
  };

  const addItemRow = () => {
    setItems([...items, { raw_material_id: "", quantity_ordered: 1, unit_cost: 0 }]);
  };

  const removeItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce((acc, it) => acc + (it.quantity_ordered * it.unit_cost || 0), 0);
  const totalAmount = subtotal + Number(taxAmount || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId) {
      setError("Please select a verified supplier.");
      return;
    }
    const validItems = items.filter(
      (it) => it.raw_material_id && it.quantity_ordered > 0 && it.unit_cost >= 0
    );
    if (validItems.length === 0) {
      setError("Please specify at least one valid raw material item with quantity and cost.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const po = await createAdminPurchase({
        supplier_id: supplierId,
        order_date: orderDate,
        expected_delivery_date: expectedDeliveryDate || undefined,
        items: validItems.map((it) => ({
          raw_material_id: it.raw_material_id,
          quantity_ordered: it.quantity_ordered,
          unit_cost: it.unit_cost,
        })),
        tax_amount: Number(taxAmount) || 0,
        notes: notes.trim() || undefined,
      });

      router.push(`/admin/purchases/${po.id}`);
    } catch (err: any) {
      setError(err?.message || "Failed to generate Purchase Order.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back Button */}
      <div>
        <Link
          href="/admin/purchases"
          className="inline-flex items-center gap-1.5 text-xs text-burgundy-900 font-semibold hover:underline mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Purchase Orders</span>
        </Link>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-burgundy-950 flex items-center gap-2.5">
          <FileText className="w-7 h-7 text-gold-600" />
          <span>Generate Purchase Order</span>
        </h1>
        <p className="text-xs text-charcoal-500 mt-1">
          Draft procurement orders for raw mulberry silk filament, gold zari spools, and eco dyes.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-sm text-xs text-red-900 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isLoadingData ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-burgundy-900 animate-spin" />
          <p className="text-xs font-semibold text-charcoal-500 font-mono">
            Loading Suppliers & Material Catalogue...
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6 text-xs">
          {/* Supplier & Dates */}
          <div className="bg-white border border-gold-300/80 rounded-sm p-5 shadow-sm space-y-4">
            <h2 className="font-serif text-sm font-bold text-burgundy-950 flex items-center gap-2">
              <Truck className="w-4 h-4 text-gold-600" />
              <span>Supplier & Procurement Schedule</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">
                  Target Supplier / Mill *
                </label>
                <select
                  required
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full p-2 border border-charcoal-200 rounded-sm bg-white focus:border-burgundy-900 focus:outline-none"
                >
                  <option value="">Select a Verified Supplier</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.supplier_name} ({s.supplier_code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">
                  Order Date *
                </label>
                <input
                  type="date"
                  required
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                  className="w-full p-2 border border-charcoal-200 rounded-sm focus:border-burgundy-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">
                  Expected Delivery Date
                </label>
                <input
                  type="date"
                  value={expectedDeliveryDate}
                  onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                  className="w-full p-2 border border-charcoal-200 rounded-sm focus:border-burgundy-900 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="bg-white border border-gold-300/80 rounded-sm p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-sm font-bold text-burgundy-950 flex items-center gap-2">
                <Scissors className="w-4 h-4 text-gold-600" />
                <span>Raw Material Consignment Items</span>
              </h2>
              <button
                type="button"
                onClick={addItemRow}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-ivory-100 hover:bg-gold-100 text-charcoal-800 font-semibold rounded text-xs border border-gold-300"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-ivory-100 border-b border-gold-200 text-charcoal-600 uppercase tracking-wider text-[10px] font-mono">
                    <th className="py-2.5 px-3">Raw Material SKU *</th>
                    <th className="py-2.5 px-3 text-right">Quantity Ordered *</th>
                    <th className="py-2.5 px-3 text-right">Unit Rate (₹) *</th>
                    <th className="py-2.5 px-3 text-right">Line Total (₹)</th>
                    <th className="py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-charcoal-100">
                  {items.map((it, idx) => {
                    const selectedMat = materials.find((m) => m.id === it.raw_material_id);
                    const lineTot = (it.quantity_ordered || 0) * (it.unit_cost || 0);

                    return (
                      <tr key={idx} className="hover:bg-ivory-50">
                        <td className="py-2.5 px-3 min-w-[240px]">
                          <select
                            required
                            value={it.raw_material_id}
                            onChange={(e) => handleItemChange(idx, "raw_material_id", e.target.value)}
                            className="w-full p-2 border border-charcoal-200 rounded-sm bg-white focus:border-burgundy-900 focus:outline-none"
                          >
                            <option value="">Select Raw Material</option>
                            {materials.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.material_code}: {m.name} ({m.unit_of_measure})
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2.5 px-3 w-36 text-right">
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            required
                            value={it.quantity_ordered || ""}
                            onChange={(e) => handleItemChange(idx, "quantity_ordered", e.target.value)}
                            placeholder="Qty"
                            className="w-full p-2 border border-charcoal-200 rounded-sm text-right font-mono focus:border-burgundy-900 focus:outline-none"
                          />
                        </td>
                        <td className="py-2.5 px-3 w-40 text-right">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            required
                            value={it.unit_cost || ""}
                            onChange={(e) => handleItemChange(idx, "unit_cost", e.target.value)}
                            placeholder="Rate ₹"
                            className="w-full p-2 border border-charcoal-200 rounded-sm text-right font-mono focus:border-burgundy-900 focus:outline-none"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-charcoal-900">
                          ₹{lineTot.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            disabled={items.length <= 1}
                            onClick={() => removeItemRow(idx)}
                            className="text-charcoal-400 hover:text-red-600 disabled:opacity-30"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Calculations */}
            <div className="pt-4 border-t border-gold-200 flex flex-col items-end space-y-2">
              <div className="flex items-center justify-between w-64 text-charcoal-600">
                <span>Subtotal:</span>
                <span className="font-mono font-bold text-charcoal-900">
                  ₹{subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center justify-between w-64 text-charcoal-600">
                <span>GST / Taxes (₹):</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={taxAmount || ""}
                  onChange={(e) => setTaxAmount(Number(e.target.value))}
                  className="w-28 p-1.5 border border-charcoal-200 rounded-sm text-right font-mono"
                />
              </div>
              <div className="flex items-center justify-between w-64 pt-2 border-t border-gold-300 font-serif text-sm font-bold text-burgundy-950">
                <span>Total PO Value:</span>
                <span className="font-mono text-base">
                  ₹{totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Notes & Submission */}
          <div className="bg-white border border-gold-300/80 rounded-sm p-5 shadow-sm space-y-4">
            <div>
              <label className="block font-semibold text-charcoal-700 mb-1">
                Procurement Terms & Delivery Instructions
              </label>
              <textarea
                rows={3}
                placeholder="Include delivery lot requirements, quality inspection terms, payment milestones..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2 border border-charcoal-200 rounded-sm focus:border-burgundy-900 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Link
                href="/admin/purchases"
                className="px-4 py-2 border border-charcoal-300 rounded-sm font-semibold text-charcoal-700 hover:bg-charcoal-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-burgundy-900 hover:bg-burgundy-950 text-gold-200 font-semibold uppercase tracking-wider rounded-sm disabled:opacity-50 shadow-sm"
              >
                {isSubmitting ? "Generating PO..." : "Issue Purchase Order"}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}

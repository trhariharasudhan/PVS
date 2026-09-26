"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  getAdminProductionBatch,
  updateAdminProductionBatch,
  updateAdminProductionStage,
  consumeAdminProductionMaterial,
  getAdminProductionMaterials,
  getAdminRawMaterials,
} from "@/lib/api/admin";
import {
  AdminProductionBatchDetail,
  AdminProductionStage,
  AdminProductionBatchMaterialDetail,
  AdminRawMaterialList,
  BatchStatus,
  StageStatus,
} from "@/types";
import {
  Factory,
  ArrowLeft,
  RefreshCw,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  Calendar,
  User,
  Sparkles,
  Check,
  ChevronRight,
  Boxes,
  X,
} from "lucide-react";

export default function AdminProductionBatchDetailPage() {
  const params = useParams();
  const batchId = params.id as string;

  const [batch, setBatch] = useState<AdminProductionBatchDetail | null>(null);
  const [consumedMaterials, setConsumedMaterials] = useState<AdminProductionBatchMaterialDetail[]>([]);
  const [availableMaterials, setAvailableMaterials] = useState<AdminRawMaterialList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Material Consumption State
  const [isConsumeModalOpen, setIsConsumeModalOpen] = useState(false);
  const [consumeRawMaterialId, setConsumeRawMaterialId] = useState("");
  const [consumeQty, setConsumeQty] = useState<number>(0);
  const [consumeNotes, setConsumeNotes] = useState("");
  const [isSubmittingConsume, setIsSubmittingConsume] = useState(false);
  const [consumeError, setConsumeError] = useState<string | null>(null);

  // Status Modal / Trigger
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [completedQtyInput, setCompletedQtyInput] = useState<number>(0);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);

  // Stage update state
  const [editingStageId, setEditingStageId] = useState<string | null>(null);
  const [stageStatus, setStageStatus] = useState<StageStatus>("PASSED_QC");
  const [stageInspector, setStageInspector] = useState("");
  const [stageNotes, setStageNotes] = useState("");
  const [isSavingStage, setIsSavingStage] = useState(false);

  const fetchBatch = useCallback(async () => {
    if (!batchId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [data, mats, allRawMats] = await Promise.all([
        getAdminProductionBatch(batchId),
        getAdminProductionMaterials(batchId),
        getAdminRawMaterials({ limit: 100, is_active: true }),
      ]);
      setBatch(data);
      setConsumedMaterials(mats);
      setAvailableMaterials(allRawMats.items);
      setCompletedQtyInput(data.completed_quantity || data.planned_quantity);
    } catch (err: any) {
      console.error("Failed to load batch:", err);
      setError(err?.message || "Failed to load production batch detail.");
    } finally {
      setIsLoading(false);
    }
  }, [batchId]);

  useEffect(() => {
    fetchBatch();
  }, [fetchBatch]);

  const handleConsumeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consumeRawMaterialId || consumeQty <= 0) {
      setConsumeError("Please select a raw material and specify a valid quantity.");
      return;
    }
    setIsSubmittingConsume(true);
    setConsumeError(null);
    try {
      await consumeAdminProductionMaterial(batchId, {
        raw_material_id: consumeRawMaterialId,
        quantity_consumed: Number(consumeQty),
        notes: consumeNotes.trim() || undefined,
      });
      setIsConsumeModalOpen(false);
      fetchBatch();
      setActionMessage("Raw material successfully issued and deducted from inventory!");
      setTimeout(() => setActionMessage(null), 5000);
    } catch (err: any) {
      setConsumeError(err?.message || "Failed to consume raw material.");
    } finally {
      setIsSubmittingConsume(false);
    }
  };

  const handleBatchStatusChange = async (newStatus: BatchStatus, qty?: number) => {
    if (!batch) return;
    setIsUpdatingStatus(true);
    setError(null);
    try {
      const updated = await updateAdminProductionBatch(batch.id, {
        status: newStatus,
        completed_quantity: qty !== undefined ? qty : batch.completed_quantity,
      });
      setBatch(updated);
      setShowCompleteDialog(false);

      if (newStatus === "COMPLETED") {
        setActionMessage(
          `🎉 Batch '${batch.batch_number}' marked COMPLETED! ${qty || batch.planned_quantity} sarees have been credited to Finished Inventory.`
        );
      } else {
        setActionMessage(`Batch status updated to ${newStatus.replace(/_/g, " ")}.`);
      }
      setTimeout(() => setActionMessage(null), 6000);
    } catch (err: any) {
      console.error("Batch status update error:", err);
      setError(err?.message || "Failed to update batch status.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleStageSave = async (stageId: string) => {
    if (!batch) return;
    setIsSavingStage(true);
    setError(null);
    try {
      await updateAdminProductionStage(batch.id, stageId, {
        status: stageStatus,
        inspected_by: stageInspector.trim() || undefined,
        notes: stageNotes.trim() || undefined,
      });

      setEditingStageId(null);
      setActionMessage("Quality checkpoint stage updated.");
      fetchBatch();
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      console.error("Stage update error:", err);
      setError(err?.message || "Failed to update quality checkpoint stage.");
    } finally {
      setIsSavingStage(false);
    }
  };

  const startEditStage = (stage: AdminProductionStage) => {
    setEditingStageId(stage.id);
    setStageStatus(stage.status);
    setStageInspector(stage.inspected_by || "");
    setStageNotes(stage.notes || "");
  };

  if (isLoading && !batch) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-burgundy-900 animate-spin" />
        <span className="text-xs font-mono text-charcoal-500">Querying loom batch record...</span>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="p-8 text-center bg-white border border-gold-300 rounded-sm">
        <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-2" />
        <h2 className="font-serif text-lg font-bold text-burgundy-950">Batch Not Found</h2>
        <Link href="/admin/production" className="text-xs text-burgundy-900 font-semibold underline mt-3 inline-block">
          &larr; Back to Production Desk
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            href="/admin/production"
            className="text-xs text-burgundy-900 font-semibold hover:underline inline-flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Loom Batches</span>
          </Link>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-burgundy-950">
            Batch Control: {batch.batch_number}
          </h1>
          <p className="text-xs text-charcoal-500 mt-1">
            {batch.product_name} &bull; <span className="font-mono">{batch.product_code}</span> &bull; {batch.category_name}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchBatch}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-gold-300 hover:bg-gold-50 text-charcoal-700 text-xs font-medium rounded-sm transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-gold-600" />
            <span>Refresh</span>
          </button>

          {batch.status !== "COMPLETED" && (
            <button
              onClick={() => setShowCompleteDialog(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-gold-100 text-xs font-semibold uppercase tracking-wider rounded-sm shadow-sm transition-all"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Mark Completed & Credit Stock</span>
            </button>
          )}
        </div>
      </div>

      {actionMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-sm text-xs text-emerald-900 flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span className="font-medium">{actionMessage}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-sm text-xs text-red-900 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Batch Summary Info */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-gold-300 rounded-sm">
          <span className="text-[11px] uppercase tracking-wider text-charcoal-500 font-semibold block">
            Loom Identifier
          </span>
          <span className="font-serif text-lg font-bold text-burgundy-950 mt-1 block">
            {batch.loom_identifier || "Master Loom"}
          </span>
        </div>

        <div className="p-4 bg-white border border-gold-300 rounded-sm">
          <span className="text-[11px] uppercase tracking-wider text-charcoal-500 font-semibold block">
            Planned Saree Output
          </span>
          <span className="font-serif text-lg font-bold text-charcoal-900 mt-1 block">
            {batch.planned_quantity} pcs
          </span>
        </div>

        <div className="p-4 bg-white border border-gold-300 rounded-sm">
          <span className="text-[11px] uppercase tracking-wider text-charcoal-500 font-semibold block">
            Batch Status
          </span>
          <span
            className={`inline-block px-2.5 py-0.5 rounded text-xs font-bold mt-1.5 ${
              batch.status === "COMPLETED"
                ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                : batch.status === "ABORTED"
                ? "bg-red-100 text-red-900 border border-red-300"
                : "bg-amber-100 text-amber-900 border border-amber-300"
            }`}
          >
            {batch.status.replace(/_/g, " ")}
          </span>
        </div>

        <div className="p-4 bg-white border border-gold-300 rounded-sm">
          <span className="text-[11px] uppercase tracking-wider text-charcoal-500 font-semibold block">
            Overall Checkpoint Progress
          </span>
          <div className="mt-1 flex items-center justify-between text-xs font-mono font-bold">
            <span>{batch.progress_percent}% Passed</span>
          </div>
          <div className="w-full bg-gold-100 rounded-full h-1.5 mt-1.5 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                batch.status === "COMPLETED" ? "bg-emerald-600" : "bg-amber-600"
              }`}
              style={{ width: `${batch.progress_percent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Checkpoints Timeline & Inspection Desk */}
      <div className="bg-white border border-gold-300/80 rounded-sm shadow-sm p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-gold-200 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-burgundy-900" />
            <h2 className="font-serif text-base font-bold text-burgundy-950">
              Quality Inspection Checkpoints & Weaving Timeline
            </h2>
          </div>
          <span className="text-[11px] text-charcoal-400 font-mono">
            {batch.stages.filter((s) => s.status === "PASSED_QC").length} / {batch.stages.length} Passed
          </span>
        </div>

        <div className="space-y-4">
          {batch.stages.map((stage) => {
            const isEditing = editingStageId === stage.id;

            return (
              <div
                key={stage.id}
                className={`p-4 rounded-sm border transition-all ${
                  stage.status === "PASSED_QC"
                    ? "bg-emerald-50/40 border-emerald-200"
                    : stage.status === "IN_PROGRESS"
                    ? "bg-amber-50/50 border-amber-300 ring-1 ring-amber-300"
                    : stage.status === "FAILED_REWORK"
                    ? "bg-red-50/40 border-red-200"
                    : "bg-ivory-50/60 border-gold-200"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
                        stage.status === "PASSED_QC"
                          ? "bg-emerald-700 text-white"
                          : stage.status === "IN_PROGRESS"
                          ? "bg-amber-600 text-white"
                          : "bg-gold-200 text-charcoal-700"
                      }`}
                    >
                      {stage.status === "PASSED_QC" ? <Check className="w-4 h-4" /> : stage.stage_sequence}
                    </div>

                    <div>
                      <h3 className="font-serif text-sm font-bold text-charcoal-900">
                        {stage.stage_name}
                      </h3>
                      {stage.inspected_by && (
                        <p className="text-[11px] text-charcoal-600 flex items-center gap-1 mt-0.5">
                          <User className="w-3 h-3 text-gold-600" />
                          <span>Inspected by: <strong>{stage.inspected_by}</strong></span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        stage.status === "PASSED_QC"
                          ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                          : stage.status === "IN_PROGRESS"
                          ? "bg-amber-100 text-amber-900 border border-amber-300"
                          : stage.status === "FAILED_REWORK"
                          ? "bg-red-100 text-red-900 border border-red-300"
                          : "bg-gray-100 text-gray-800 border border-gray-300"
                      }`}
                    >
                      {stage.status.replace(/_/g, " ")}
                    </span>

                    {!isEditing && (
                      <button
                        onClick={() => startEditStage(stage)}
                        className="px-2.5 py-1 bg-white border border-gold-300 text-charcoal-700 hover:bg-gold-50 text-[11px] font-semibold rounded transition-colors"
                      >
                        Update
                      </button>
                    )}
                  </div>
                </div>

                {stage.notes && !isEditing && (
                  <p className="text-xs text-charcoal-600 bg-white/80 p-2.5 rounded border border-gold-200/60 mt-3 italic">
                    &ldquo;{stage.notes}&rdquo;
                  </p>
                )}

                {/* Inline Editing Form */}
                {isEditing && (
                  <div className="mt-4 pt-4 border-t border-gold-200/80 space-y-3 animate-fade-in-subtle">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-charcoal-700 mb-1">
                          Stage Status
                        </label>
                        <select
                          value={stageStatus}
                          onChange={(e) => setStageStatus(e.target.value as StageStatus)}
                          className="w-full px-3 py-1.5 text-xs bg-white border border-gold-300 rounded focus:outline-none"
                        >
                          <option value="PENDING">Pending</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="PASSED_QC">Passed QC</option>
                          <option value="FAILED_REWORK">Failed / Rework</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-charcoal-700 mb-1">
                          Inspected By (Staff Name)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Raman Loom Master"
                          value={stageInspector}
                          onChange={(e) => setStageInspector(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs bg-white border border-gold-300 rounded focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-charcoal-700 mb-1">
                        Quality Notes / Inspection Remarks
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Zari tensile strength verified; warp density aligned."
                        value={stageNotes}
                        onChange={(e) => setStageNotes(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-gold-300 rounded focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setEditingStageId(null)}
                        className="px-3 py-1 bg-white border border-gold-300 text-charcoal-700 text-xs rounded hover:bg-gold-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={isSavingStage}
                        onClick={() => handleStageSave(stage.id)}
                        className="inline-flex items-center gap-1 px-4 py-1 bg-burgundy-900 text-gold-200 text-xs font-semibold rounded hover:bg-burgundy-950"
                      >
                        {isSavingStage ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                        <span>Save Stage Checkpoint</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Raw Material Consumption Desk (Phase 4C-C) */}
      <div className="bg-white border border-gold-300/80 rounded-sm shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gold-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <Boxes className="w-5 h-5 text-gold-600" />
            <h2 className="font-serif text-base font-bold text-burgundy-950">
              Raw Material Consumption & Warp Allocation
            </h2>
          </div>
          {batch.status !== "COMPLETED" && batch.status !== "ABORTED" && (
            <button
              onClick={() => {
                setConsumeRawMaterialId("");
                setConsumeQty(0);
                setConsumeNotes("");
                setConsumeError(null);
                setIsConsumeModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-burgundy-900 hover:bg-burgundy-950 text-gold-200 text-xs font-semibold uppercase tracking-wider rounded-sm transition-all shadow-xs"
            >
              <span>+ Issue Raw Material</span>
            </button>
          )}
        </div>

        {consumedMaterials.length === 0 ? (
          <div className="p-8 text-center text-xs text-charcoal-500">
            No raw materials logged for this production batch yet. Click "Issue Raw Material" to deduct mulberry silk or zari from warehouse inventory.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-ivory-100 border-b border-gold-200 text-charcoal-600 uppercase tracking-wider text-[10px] font-mono">
                  <th className="py-3 px-4">Material SKU</th>
                  <th className="py-3 px-4">Material Name</th>
                  <th className="py-3 px-4 text-right">Quantity Consumed</th>
                  <th className="py-3 px-4">Operator / Weaver</th>
                  <th className="py-3 px-4">Notes</th>
                  <th className="py-3 px-4 text-right">Logged At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal-100">
                {consumedMaterials.map((mat) => (
                  <tr key={mat.id} className="hover:bg-ivory-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-burgundy-900 text-[11px]">
                      {mat.material_code}
                    </td>
                    <td className="py-3 px-4 text-charcoal-800 font-semibold">{mat.material_name}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-amber-900">
                      {Number(mat.quantity_consumed).toFixed(2)} {mat.unit_of_measure}
                    </td>
                    <td className="py-3 px-4 text-charcoal-700">
                      {mat.performed_by_name || "Factory Manager"}
                    </td>
                    <td className="py-3 px-4 text-charcoal-600 italic">
                      {mat.notes || "—"}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-[11px] text-charcoal-400">
                      {new Date(mat.created_at).toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Consume Material Modal */}
      {isConsumeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white border border-gold-300 rounded-sm w-full max-w-md p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-gold-200 pb-3">
              <h2 className="font-serif text-base font-bold text-burgundy-950">
                Issue Raw Material for Loom #{batch.loom_identifier || batch.batch_number}
              </h2>
              <button
                onClick={() => setIsConsumeModalOpen(false)}
                className="text-charcoal-400 hover:text-charcoal-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {consumeError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-sm text-xs text-red-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{consumeError}</span>
              </div>
            )}

            <form onSubmit={handleConsumeSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">
                  Raw Material SKU *
                </label>
                <select
                  required
                  value={consumeRawMaterialId}
                  onChange={(e) => setConsumeRawMaterialId(e.target.value)}
                  className="w-full p-2 border border-charcoal-200 rounded-sm bg-white focus:border-burgundy-900 focus:outline-none"
                >
                  <option value="">Select Raw Material</option>
                  {availableMaterials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.material_code}: {m.name} (Available: {Number(m.quantity_available).toFixed(2)} {m.unit_of_measure})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">
                  Quantity to Issue / Consume *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="e.g. 5.5"
                  value={consumeQty || ""}
                  onChange={(e) => setConsumeQty(Number(e.target.value))}
                  className="w-full p-2 border border-charcoal-200 rounded-sm font-mono text-sm focus:border-burgundy-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">
                  Notes & Loom Allocation
                </label>
                <textarea
                  rows={2}
                  placeholder="Issued to weaver Murugan for warp setup..."
                  value={consumeNotes}
                  onChange={(e) => setConsumeNotes(e.target.value)}
                  className="w-full p-2 border border-charcoal-200 rounded-sm focus:border-burgundy-900 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gold-200">
                <button
                  type="button"
                  onClick={() => setIsConsumeModalOpen(false)}
                  className="px-4 py-2 border border-charcoal-300 rounded-sm font-semibold text-charcoal-700 hover:bg-charcoal-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingConsume}
                  className="px-5 py-2 bg-burgundy-900 hover:bg-burgundy-950 text-gold-200 font-semibold uppercase tracking-wider rounded-sm disabled:opacity-50"
                >
                  {isSubmittingConsume ? "Deducting Stock..." : "Confirm Material Consumption"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Production Completion Confirmation Dialog */}
      {showCompleteDialog && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-gold-400 rounded-sm shadow-2xl max-w-md w-full p-6 space-y-4 animate-fade-in-subtle">
            <div className="flex items-center gap-2 text-emerald-800 border-b border-gold-200 pb-3">
              <Boxes className="w-5 h-5 text-emerald-600" />
              <h3 className="font-serif text-base font-bold">
                Complete Production Batch & Credit Stock
              </h3>
            </div>

            <p className="text-xs text-charcoal-600 leading-relaxed">
              Marking batch <strong>{batch.batch_number}</strong> as COMPLETED will automatically create an immutable <strong>PRODUCTION</strong> inventory movement and increase finished stock for <strong>{batch.product_name}</strong>.
            </p>

            <div>
              <label className="block text-xs font-semibold text-charcoal-800 mb-1">
                Completed Saree Pieces to Credit
              </label>
              <input
                type="number"
                min="1"
                required
                value={completedQtyInput}
                onChange={(e) => setCompletedQtyInput(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs font-mono font-bold bg-ivory-50 border border-gold-300 rounded focus:outline-none"
              />
              <p className="text-[10px] text-charcoal-400 mt-1">
                Planned output was {batch.planned_quantity} pcs.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gold-200">
              <button
                type="button"
                onClick={() => setShowCompleteDialog(false)}
                className="px-4 py-2 bg-white border border-gold-300 text-charcoal-700 text-xs font-semibold uppercase tracking-wider rounded-sm hover:bg-gold-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isUpdatingStatus}
                onClick={() => handleBatchStatusChange("COMPLETED", completedQtyInput)}
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-gold-100 text-xs font-semibold uppercase tracking-wider rounded-sm transition-all disabled:opacity-60"
              >
                {isUpdatingStatus ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                <span>Confirm & Credit Inventory</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

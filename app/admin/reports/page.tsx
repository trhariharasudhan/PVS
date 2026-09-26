"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  BarChart3,
  FileDown,
  Calendar,
  Layers,
  ShoppingBag,
  Boxes,
  Receipt,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Scissors,
  CheckCircle2,
} from "lucide-react";
import {
  getAdminSalesReport,
  getAdminInventoryValuationReport,
  getAdminGSTReport,
  getAdminReportCsvExportUrl,
} from "@/lib/api/admin";
import {
  SalesReportSummary,
  InventoryValuationReport,
  GSTSummaryReport,
} from "@/types";

export default function AdminReportsPage() {
  const [activeTab, setActiveTab] = useState<"sales" | "inventory" | "gst">("sales");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Date filters (Defaults: Current Month)
  const todayStr = new Date().toISOString().split("T")[0];
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .split("T")[0];

  const [startDate, setStartDate] = useState(firstDayOfMonth);
  const [endDate, setEndDate] = useState(todayStr);

  // Reports data
  const [salesReport, setSalesReport] = useState<SalesReportSummary | null>(null);
  const [inventoryReport, setInventoryReport] = useState<InventoryValuationReport | null>(null);
  const [gstReport, setGstReport] = useState<GSTSummaryReport | null>(null);

  const loadCurrentReport = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (activeTab === "sales") {
        const data = await getAdminSalesReport({
          start_date: startDate,
          end_date: endDate,
        });
        setSalesReport(data);
      } else if (activeTab === "inventory") {
        const data = await getAdminInventoryValuationReport();
        setInventoryReport(data);
      } else if (activeTab === "gst") {
        const data = await getAdminGSTReport({
          start_date: startDate,
          end_date: endDate,
        });
        setGstReport(data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load report analytics.");
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, startDate, endDate]);

  useEffect(() => {
    loadCurrentReport();
  }, [loadCurrentReport]);

  const formatCurrency = (amount: number | string) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(Number(amount) || 0);
  };

  const getCsvUrl = () => {
    if (activeTab === "sales") {
      return getAdminReportCsvExportUrl("sales", { start_date: startDate, end_date: endDate });
    }
    if (activeTab === "inventory") {
      return getAdminReportCsvExportUrl("inventory-valuation");
    }
    return getAdminReportCsvExportUrl("gst", { start_date: startDate, end_date: endDate });
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gold-500/20 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-burgundy-900/10 text-burgundy-900 rounded-lg border border-burgundy-900/20">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-serif text-2xl md:text-3xl font-bold text-burgundy-950">
                Business Analytics & Statutory Reports
              </h1>
              <p className="text-sm text-charcoal-600">
                Sales performance, composite inventory valuation, and GST GSTR-1 filings.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={getCsvUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 text-sm font-semibold shadow-sm transition"
          >
            <FileDown className="w-4 h-4" />
            Export CSV ({activeTab.toUpperCase()})
          </a>
        </div>
      </div>

      {/* Tabs and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-charcoal-200 shadow-sm">
        <div className="flex border-b md:border-b-0 border-charcoal-200 gap-4 text-sm font-semibold">
          <button
            onClick={() => setActiveTab("sales")}
            className={`pb-2 md:pb-0 px-3 py-1.5 rounded-lg transition ${
              activeTab === "sales"
                ? "bg-burgundy-900 text-gold-200 font-bold"
                : "text-charcoal-600 hover:bg-ivory-100"
            }`}
          >
            Sales & Revenue
          </button>
          <button
            onClick={() => setActiveTab("inventory")}
            className={`pb-2 md:pb-0 px-3 py-1.5 rounded-lg transition ${
              activeTab === "inventory"
                ? "bg-burgundy-900 text-gold-200 font-bold"
                : "text-charcoal-600 hover:bg-ivory-100"
            }`}
          >
            Inventory Valuation
          </button>
          <button
            onClick={() => setActiveTab("gst")}
            className={`pb-2 md:pb-0 px-3 py-1.5 rounded-lg transition ${
              activeTab === "gst"
                ? "bg-burgundy-900 text-gold-200 font-bold"
                : "text-charcoal-600 hover:bg-ivory-100"
            }`}
          >
            GST (GSTR-1) Summary
          </button>
        </div>

        {activeTab !== "inventory" && (
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-charcoal-600">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="py-1 px-2 border border-charcoal-200 rounded-md text-xs font-mono"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-charcoal-600">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="py-1 px-2 border border-charcoal-200 rounded-md text-xs font-mono"
              />
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tab 1: Sales Report */}
      {activeTab === "sales" && salesReport && (
        <div className="space-y-6">
          {/* Summary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-charcoal-200 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-charcoal-500 block">
                Gross Sales Turnover
              </span>
              <span className="text-2xl font-bold font-mono text-charcoal-900 block mt-2">
                {formatCurrency(salesReport.gross_sales)}
              </span>
              <span className="text-[11px] text-charcoal-500 font-mono mt-1 block">
                {salesReport.total_orders} total orders
              </span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-charcoal-200 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-charcoal-500 block">
                Net Taxable Sales
              </span>
              <span className="text-2xl font-bold font-mono text-emerald-800 block mt-2">
                {formatCurrency(salesReport.net_sales)}
              </span>
              <span className="text-[11px] text-charcoal-500 font-mono mt-1 block">
                Excludes GST
              </span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-charcoal-200 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-charcoal-500 block">
                Total GST Collected
              </span>
              <span className="text-2xl font-bold font-mono text-blue-900 block mt-2">
                {formatCurrency(salesReport.total_tax_collected)}
              </span>
              <span className="text-[11px] text-charcoal-500 font-mono mt-1 block">
                Output Tax
              </span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-charcoal-200 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-charcoal-500 block">
                Wholesale Volume
              </span>
              <span className="text-2xl font-bold font-mono text-amber-900 block mt-2">
                {formatCurrency(salesReport.wholesale_sales_volume)}
              </span>
              <span className="text-[11px] text-charcoal-500 font-mono mt-1 block">
                Retail: {formatCurrency(salesReport.retail_sales_volume)}
              </span>
            </div>
          </div>

          {/* Orders Breakdown Table */}
          <div className="bg-white rounded-xl border border-charcoal-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-ivory-50 border-b border-charcoal-200 flex justify-between items-center">
              <h3 className="font-serif text-sm font-bold text-burgundy-950 uppercase tracking-wider">
                Sales Transaction Ledger
              </h3>
              <span className="text-xs text-charcoal-500 font-mono">
                {salesReport.rows.length} transactions
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-charcoal-800">
                <thead className="bg-ivory-100 text-charcoal-700 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Order #</th>
                    <th className="px-5 py-3">Customer</th>
                    <th className="px-5 py-3">Channel</th>
                    <th className="px-5 py-3 text-center">Items</th>
                    <th className="px-5 py-3 text-right">Taxable (₹)</th>
                    <th className="px-5 py-3 text-right">GST (₹)</th>
                    <th className="px-5 py-3 text-right">Total (₹)</th>
                    <th className="px-5 py-3 text-center">Payment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-charcoal-100 font-mono">
                  {salesReport.rows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-ivory-50">
                      <td className="px-5 py-3.5 text-charcoal-600 font-sans">
                        {new Date(row.date).toLocaleDateString("en-IN")}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-burgundy-900">{row.order_number}</td>
                      <td className="px-5 py-3.5 font-sans font-medium text-charcoal-900">{row.customer_name}</td>
                      <td className="px-5 py-3.5 font-sans">
                        <span className="px-2 py-0.5 rounded bg-charcoal-100 text-charcoal-800 text-[10px]">
                          {row.order_type.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">{row.items_count}</td>
                      <td className="px-5 py-3.5 text-right">{formatCurrency(row.taxable_amount)}</td>
                      <td className="px-5 py-3.5 text-right text-charcoal-600">{formatCurrency(row.tax_amount)}</td>
                      <td className="px-5 py-3.5 text-right font-bold text-charcoal-900">
                        {formatCurrency(row.total_amount)}
                      </td>
                      <td className="px-5 py-3.5 text-center font-sans">
                        <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                          {row.payment_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Inventory Valuation */}
      {activeTab === "inventory" && inventoryReport && (
        <div className="space-y-6">
          {/* Summary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl border border-charcoal-200 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-charcoal-500 block">
                Total Inventory Value
              </span>
              <span className="text-2xl font-bold font-mono text-burgundy-950 block mt-2">
                {formatCurrency(inventoryReport.total_combined_inventory_value)}
              </span>
              <span className="text-[11px] text-charcoal-500 font-mono mt-1 block">
                Raw Materials + Finished Handloom Goods
              </span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-charcoal-200 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-charcoal-500 block">
                Raw Material Valuation
              </span>
              <span className="text-2xl font-bold font-mono text-emerald-800 block mt-2">
                {formatCurrency(inventoryReport.total_raw_material_valuation)}
              </span>
              <span className="text-[11px] text-charcoal-500 font-mono mt-1 block">
                Silk yarn, Zari spools, Dyes
              </span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-charcoal-200 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-charcoal-500 block">
                Finished Sarees Valuation
              </span>
              <span className="text-2xl font-bold font-mono text-blue-900 block mt-2">
                {formatCurrency(inventoryReport.total_finished_goods_valuation)}
              </span>
              <span className="text-[11px] text-charcoal-500 font-mono mt-1 block">
                Wholesale stock valuation
              </span>
            </div>
          </div>

          {/* Finished Goods Table */}
          <div className="bg-white rounded-xl border border-charcoal-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-ivory-50 border-b border-charcoal-200">
              <h3 className="font-serif text-sm font-bold text-burgundy-950 uppercase tracking-wider">
                Finished Handloom Sarees Stock Valuation
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-charcoal-800">
                <thead className="bg-ivory-100 text-charcoal-700 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3">Code</th>
                    <th className="px-5 py-3">Product Name</th>
                    <th className="px-5 py-3">Category</th>
                    <th className="px-5 py-3 text-center">On Hand</th>
                    <th className="px-5 py-3 text-right">Wholesale Rate</th>
                    <th className="px-5 py-3 text-right">Retail Rate</th>
                    <th className="px-5 py-3 text-right">Total Inventory Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-charcoal-100 font-mono">
                  {inventoryReport.finished_goods.map((fg, idx) => (
                    <tr key={idx} className="hover:bg-ivory-50">
                      <td className="px-5 py-3 font-bold text-burgundy-900">{fg.product_code}</td>
                      <td className="px-5 py-3 font-sans font-medium text-charcoal-900">{fg.product_name}</td>
                      <td className="px-5 py-3 font-sans text-charcoal-600">{fg.category_name}</td>
                      <td className="px-5 py-3 text-center font-bold">{fg.quantity_on_hand} pcs</td>
                      <td className="px-5 py-3 text-right">{formatCurrency(fg.wholesale_price)}</td>
                      <td className="px-5 py-3 text-right text-charcoal-500">{formatCurrency(fg.retail_price)}</td>
                      <td className="px-5 py-3 text-right font-bold text-emerald-800">
                        {formatCurrency(fg.total_inventory_value)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Raw Materials Table */}
          <div className="bg-white rounded-xl border border-charcoal-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-ivory-50 border-b border-charcoal-200">
              <h3 className="font-serif text-sm font-bold text-burgundy-950 uppercase tracking-wider">
                Raw Material Stock Valuation
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-charcoal-800">
                <thead className="bg-ivory-100 text-charcoal-700 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3">Code</th>
                    <th className="px-5 py-3">Material Name</th>
                    <th className="px-5 py-3">Type</th>
                    <th className="px-5 py-3 text-center">Stock on Hand</th>
                    <th className="px-5 py-3 text-right">Unit Cost</th>
                    <th className="px-5 py-3 text-right">Total Valuation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-charcoal-100 font-mono">
                  {inventoryReport.raw_materials.map((rm, idx) => (
                    <tr key={idx} className="hover:bg-ivory-50">
                      <td className="px-5 py-3 font-bold text-burgundy-900">{rm.material_code}</td>
                      <td className="px-5 py-3 font-sans font-medium text-charcoal-900">{rm.material_name}</td>
                      <td className="px-5 py-3 font-sans text-charcoal-600">{rm.material_type.replace(/_/g, " ")}</td>
                      <td className="px-5 py-3 text-center font-bold">
                        {Number(rm.quantity_on_hand)} {rm.unit_of_measure}
                      </td>
                      <td className="px-5 py-3 text-right">{formatCurrency(rm.unit_cost)}</td>
                      <td className="px-5 py-3 text-right font-bold text-emerald-800">
                        {formatCurrency(rm.total_valuation)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: GST GSTR-1 Report */}
      {activeTab === "gst" && gstReport && (
        <div className="space-y-6">
          {/* Summary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-charcoal-200 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-charcoal-500 block">
                Total Taxable Turnover
              </span>
              <span className="text-2xl font-bold font-mono text-charcoal-900 block mt-2">
                {formatCurrency(gstReport.total_taxable_turnover)}
              </span>
              <span className="text-[11px] text-charcoal-500 font-mono mt-1 block">
                GSTIN: {gstReport.company_gstin}
              </span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-charcoal-200 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-charcoal-500 block">
                Central GST (CGST)
              </span>
              <span className="text-2xl font-bold font-mono text-emerald-800 block mt-2">
                {formatCurrency(gstReport.total_cgst)}
              </span>
              <span className="text-[11px] text-charcoal-500 font-mono mt-1 block">
                Intra-State 2.5%
              </span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-charcoal-200 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-charcoal-500 block">
                State GST (SGST)
              </span>
              <span className="text-2xl font-bold font-mono text-blue-900 block mt-2">
                {formatCurrency(gstReport.total_sgst)}
              </span>
              <span className="text-[11px] text-charcoal-500 font-mono mt-1 block">
                Intra-State 2.5%
              </span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-charcoal-200 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-charcoal-500 block">
                Integrated GST (IGST)
              </span>
              <span className="text-2xl font-bold font-mono text-amber-900 block mt-2">
                {formatCurrency(gstReport.total_igst)}
              </span>
              <span className="text-[11px] text-charcoal-500 font-mono mt-1 block">
                Inter-State 5.0%
              </span>
            </div>
          </div>

          {/* GSTR-1 HSN Breakdown */}
          <div className="bg-white rounded-xl border border-charcoal-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-ivory-50 border-b border-charcoal-200">
              <h3 className="font-serif text-sm font-bold text-burgundy-950 uppercase tracking-wider">
                GSTR-1 Table 12: HSN Summary of Outward Supplies
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-charcoal-800">
                <thead className="bg-ivory-100 text-charcoal-700 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3">HSN/SAC</th>
                    <th className="px-5 py-3">Description</th>
                    <th className="px-5 py-3 text-center">UQC</th>
                    <th className="px-5 py-3 text-center">Total Qty</th>
                    <th className="px-5 py-3 text-right">Taxable Value (₹)</th>
                    <th className="px-5 py-3 text-right">CGST (₹)</th>
                    <th className="px-5 py-3 text-right">SGST (₹)</th>
                    <th className="px-5 py-3 text-right">IGST (₹)</th>
                    <th className="px-5 py-3 text-right">Total Tax (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-charcoal-100 font-mono">
                  {gstReport.hsn_summary.map((hsn, idx) => (
                    <tr key={idx} className="hover:bg-ivory-50">
                      <td className="px-5 py-3 font-bold text-burgundy-900">{hsn.hsn_sac_code}</td>
                      <td className="px-5 py-3 font-sans font-medium text-charcoal-900">{hsn.description}</td>
                      <td className="px-5 py-3 text-center font-sans">{hsn.uqc}</td>
                      <td className="px-5 py-3 text-center font-bold">{Number(hsn.total_quantity)}</td>
                      <td className="px-5 py-3 text-right">{formatCurrency(hsn.taxable_value)}</td>
                      <td className="px-5 py-3 text-right text-emerald-700">{formatCurrency(hsn.cgst_amount)}</td>
                      <td className="px-5 py-3 text-right text-blue-700">{formatCurrency(hsn.sgst_amount)}</td>
                      <td className="px-5 py-3 text-right text-amber-700">{formatCurrency(hsn.igst_amount)}</td>
                      <td className="px-5 py-3 text-right font-bold text-charcoal-900">
                        {formatCurrency(hsn.total_tax_amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

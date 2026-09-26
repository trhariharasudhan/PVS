"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Receipt,
  Search,
  Filter,
  Plus,
  FileDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  CreditCard,
  Building2,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  Ban,
  TrendingUp,
} from "lucide-react";
import {
  getAdminInvoices,
  getAdminInvoicePdfDownloadUrl,
  createAdminInvoice,
  getAdminCustomers,
  getAdminProducts,
  AdminInvoiceFilterParams,
} from "@/lib/api/admin";
import {
  AdminInvoiceList,
  InvoiceType,
  InvoiceStatus,
  AdminCustomerList,
  AdminProductList,
} from "@/types";

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<AdminInvoiceList[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Modal for creating a new invoice
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customers, setCustomers] = useState<AdminCustomerList[]>([]);
  const [products, setProducts] = useState<AdminProductList[]>([]);
  const [modalError, setModalError] = useState<string | null>(null);

  // Form State
  const [formCustomerId, setFormCustomerId] = useState("");
  const [formInvoiceType, setFormInvoiceType] = useState<InvoiceType>("TAX_INVOICE");
  const [formInvoiceDate, setFormInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [formDueDate, setFormDueDate] = useState("");
  const [formPlaceOfSupply, setFormPlaceOfSupply] = useState("Tamil Nadu (33)");
  const [formIsInterState, setFormIsInterState] = useState(false);
  const [formCustomerGstin, setFormCustomerGstin] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formTerms, setFormTerms] = useState("1. Goods once sold will not be returned.\n2. Silk care: Dry clean only.");
  const [formItems, setFormItems] = useState<Array<{
    productId: string;
    description: string;
    hsnCode: string;
    quantity: number;
    unitPrice: number;
    gstRate: number;
  }>>([
    {
      productId: "",
      description: "Kanchipuram Pure Silk Handloom Saree",
      hsnCode: "5007",
      quantity: 1,
      unitPrice: 15000,
      gstRate: 5,
    },
  ]);

  const loadInvoices = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: AdminInvoiceFilterParams = {
        page,
        limit,
        search: searchTerm.trim() || undefined,
        invoice_type: selectedType || undefined,
        status: selectedStatus || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      };
      const res = await getAdminInvoices(params);
      setInvoices(res.items);
      setTotal(res.total);
    } catch (err: any) {
      setError(err.message || "Failed to load tax invoices and bills.");
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, searchTerm, selectedType, selectedStatus, startDate, endDate]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  const openCreateModal = async () => {
    setIsCreateModalOpen(true);
    setModalError(null);
    try {
      const [custRes, prodRes] = await Promise.all([
        getAdminCustomers({ limit: 100 }),
        getAdminProducts({ limit: 100 }),
      ]);
      setCustomers(custRes.items);
      setProducts(prodRes.items);
    } catch (err) {
      console.error("Failed to load modal reference data", err);
    }
  };

  const handleAddItemRow = () => {
    setFormItems([
      ...formItems,
      {
        productId: "",
        description: "",
        hsnCode: "5007",
        quantity: 1,
        unitPrice: 0,
        gstRate: 5,
      },
    ]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (formItems.length === 1) return;
    setFormItems(formItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...formItems];
    if (field === "productId") {
      const prod = products.find((p) => p.id === value);
      updated[index].productId = value;
      if (prod) {
        updated[index].description = `${prod.name} (${prod.code})`;
        updated[index].unitPrice = Number(prod.price) || 0;
      }
    } else {
      (updated[index] as any)[field] = value;
    }
    setFormItems(updated);
  };

  const handleCreateInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCustomerId) {
      setModalError("Please select a customer for this tax invoice.");
      return;
    }
    if (formItems.some((it) => !it.description.trim() || it.quantity <= 0 || it.unitPrice < 0)) {
      setModalError("Please specify valid items, quantities, and pricing.");
      return;
    }

    setIsSubmitting(true);
    setModalError(null);

    try {
      await createAdminInvoice({
        invoice_type: formInvoiceType,
        customer_id: formCustomerId,
        invoice_date: formInvoiceDate,
        due_date: formDueDate || undefined,
        place_of_supply: formPlaceOfSupply,
        is_inter_state: formIsInterState,
        customer_gstin: formCustomerGstin || undefined,
        notes: formNotes || undefined,
        terms_and_conditions: formTerms || undefined,
        items: formItems.map((it) => ({
          product_id: it.productId || undefined,
          item_description: it.description,
          hsn_sac_code: it.hsnCode || "5007",
          quantity: Number(it.quantity),
          unit_price: Number(it.unitPrice),
          gst_rate: Number(it.gstRate),
        })),
      });
      setIsCreateModalOpen(false);
      loadInvoices();
    } catch (err: any) {
      setModalError(err.message || "Failed to create invoice.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number | string) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(Number(amount) || 0);
  };

  const getStatusBadge = (status: InvoiceStatus) => {
    switch (status) {
      case "PAID":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5" /> Paid
          </span>
        );
      case "PARTIALLY_PAID":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3.5 h-3.5" /> Partially Paid
          </span>
        );
      case "ISSUED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">
            <Receipt className="w-3.5 h-3.5" /> Issued (Open)
          </span>
        );
      case "OVERDUE":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">
            <AlertCircle className="w-3.5 h-3.5" /> Overdue
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-charcoal-100 text-charcoal-700 border border-charcoal-300">
            <Ban className="w-3.5 h-3.5" /> Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-300">
            Draft
          </span>
        );
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gold-500/20 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-burgundy-900/10 text-burgundy-900 rounded-lg border border-burgundy-900/20">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-serif text-2xl md:text-3xl font-bold text-burgundy-950">
                Invoices & Tax Billing
              </h1>
              <p className="text-sm text-charcoal-600">
                GST-compliant Tax Invoices, Purchase Bills, HSN classification, and PDF generation.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/finance"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gold-400 bg-gold-50 text-burgundy-950 hover:bg-gold-100 text-sm font-semibold transition"
          >
            <TrendingUp className="w-4 h-4 text-burgundy-900" />
            Finance & Aging Desk
          </Link>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-burgundy-900 text-gold-300 hover:bg-burgundy-950 text-sm font-semibold shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            Create Tax Invoice
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-charcoal-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400" />
          <input
            type="text"
            placeholder="Search invoice # or party..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-charcoal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-burgundy-900/20 focus:border-burgundy-900"
          />
        </div>

        <div>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full py-2 px-3 text-sm border border-charcoal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-burgundy-900/20 focus:border-burgundy-900"
          >
            <option value="">All Document Types</option>
            <option value="TAX_INVOICE">Tax Invoice (Sales)</option>
            <option value="PURCHASE_BILL">Purchase Bill (Inbound)</option>
            <option value="PROFORMA_INVOICE">Proforma Invoice</option>
          </select>
        </div>

        <div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full py-2 px-3 text-sm border border-charcoal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-burgundy-900/20 focus:border-burgundy-900"
          >
            <option value="">All Clearance Statuses</option>
            <option value="ISSUED">Issued (Unpaid)</option>
            <option value="PARTIALLY_PAID">Partially Paid</option>
            <option value="PAID">Fully Paid</option>
            <option value="OVERDUE">Overdue</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        <div>
          <input
            type="date"
            placeholder="Start Date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full py-2 px-3 text-sm border border-charcoal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-burgundy-900/20 focus:border-burgundy-900"
          />
        </div>

        <div>
          <input
            type="date"
            placeholder="End Date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full py-2 px-3 text-sm border border-charcoal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-burgundy-900/20 focus:border-burgundy-900"
          />
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Invoices Table */}
      <div className="bg-white rounded-xl border border-charcoal-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-charcoal-800">
            <thead className="bg-ivory-100 text-charcoal-900 font-serif font-bold text-xs uppercase tracking-wider border-b border-charcoal-200">
              <tr>
                <th className="px-6 py-3.5">Invoice #</th>
                <th className="px-6 py-3.5">Type & Date</th>
                <th className="px-6 py-3.5">Party (Buyer / Supplier)</th>
                <th className="px-6 py-3.5 text-right">Taxable</th>
                <th className="px-6 py-3.5 text-right">Tax (GST)</th>
                <th className="px-6 py-3.5 text-right">Total Amount</th>
                <th className="px-6 py-3.5 text-right">Balance Due</th>
                <th className="px-6 py-3.5 text-center">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal-100">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-charcoal-500">
                    Loading invoices...
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-charcoal-500">
                    No invoices match your filter criteria.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-ivory-50 transition">
                    <td className="px-6 py-4 font-mono font-bold text-burgundy-950">
                      <Link
                        href={`/admin/invoices/${inv.id}`}
                        className="hover:underline hover:text-burgundy-800"
                      >
                        {inv.invoice_number}
                      </Link>
                      {inv.order_id && (
                        <div className="text-[11px] font-sans font-normal text-charcoal-500">
                          Order Linked
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs font-semibold text-burgundy-900">
                        {inv.invoice_type.replace(/_/g, " ")}
                      </div>
                      <div className="text-xs text-charcoal-500 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        {new Date(inv.invoice_date).toLocaleDateString("en-IN")}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-charcoal-900 max-w-[200px] truncate">
                      {inv.party_name}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-charcoal-700">
                      {formatCurrency(inv.subtotal_amount)}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-charcoal-600">
                      {formatCurrency(inv.total_tax_amount)}
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-charcoal-900">
                      {formatCurrency(inv.total_amount)}
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold">
                      {Number(inv.balance_due) > 0 ? (
                        <span className="text-rose-700">
                          {formatCurrency(inv.balance_due)}
                        </span>
                      ) : (
                        <span className="text-emerald-700">₹0.00</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {getStatusBadge(inv.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={getAdminInvoicePdfDownloadUrl(inv.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Download PDF"
                          className="p-1.5 rounded-lg text-charcoal-600 hover:bg-gold-100 hover:text-burgundy-900 transition"
                        >
                          <FileDown className="w-4 h-4" />
                        </a>
                        <Link
                          href={`/admin/invoices/${inv.id}`}
                          title="View Details & Payments"
                          className="p-1.5 rounded-lg text-charcoal-600 hover:bg-burgundy-100 hover:text-burgundy-900 transition"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 bg-ivory-50 border-t border-charcoal-200 flex items-center justify-between">
          <p className="text-xs text-charcoal-600">
            Showing <span className="font-semibold">{invoices.length}</span> of{" "}
            <span className="font-semibold">{total}</span> records
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 border border-charcoal-200 rounded-lg bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-ivory-100 transition"
            >
              <ChevronLeft className="w-4 h-4 text-charcoal-700" />
            </button>
            <span className="text-xs font-semibold px-2">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 border border-charcoal-200 rounded-lg bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-ivory-100 transition"
            >
              <ChevronRight className="w-4 h-4 text-charcoal-700" />
            </button>
          </div>
        </div>
      </div>

      {/* Create Invoice Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-gold-500/30 my-8">
            <div className="flex items-center justify-between border-b border-charcoal-100 pb-4 mb-4">
              <div>
                <h3 className="font-serif text-xl font-bold text-burgundy-950">
                  New Tax Invoice
                </h3>
                <p className="text-xs text-charcoal-500">
                  Create a manual sales tax invoice for retail or wholesale client.
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-charcoal-400 hover:text-charcoal-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {modalError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateInvoiceSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                    Select Customer *
                  </label>
                  <select
                    value={formCustomerId}
                    onChange={(e) => {
                      setFormCustomerId(e.target.value);
                      const c = customers.find((cust) => cust.id === e.target.value);
                      if (c && c.gstin) setFormCustomerGstin(c.gstin);
                    }}
                    required
                    className="w-full py-2 px-3 text-sm border border-charcoal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-burgundy-900/20"
                  >
                    <option value="">-- Choose Customer --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.full_name} {c.company_name ? `(${c.company_name})` : ""} - {c.city}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                    Customer GSTIN
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 33AAAAA1234A1Z5"
                    value={formCustomerGstin}
                    onChange={(e) => setFormCustomerGstin(e.target.value.toUpperCase())}
                    className="w-full py-2 px-3 text-sm border border-charcoal-200 rounded-lg uppercase focus:outline-none focus:ring-2 focus:ring-burgundy-900/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                    Invoice Date *
                  </label>
                  <input
                    type="date"
                    value={formInvoiceDate}
                    onChange={(e) => setFormInvoiceDate(e.target.value)}
                    required
                    className="w-full py-2 px-3 text-sm border border-charcoal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-burgundy-900/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="w-full py-2 px-3 text-sm border border-charcoal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-burgundy-900/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                    Place of Supply
                  </label>
                  <input
                    type="text"
                    value={formPlaceOfSupply}
                    onChange={(e) => setFormPlaceOfSupply(e.target.value)}
                    className="w-full py-2 px-3 text-sm border border-charcoal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-burgundy-900/20"
                  />
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="isInterState"
                    checked={formIsInterState}
                    onChange={(e) => setFormIsInterState(e.target.checked)}
                    className="w-4 h-4 text-burgundy-900 rounded focus:ring-burgundy-900"
                  />
                  <label htmlFor="isInterState" className="text-xs font-semibold text-charcoal-700">
                    Inter-State Supply (IGST 5%) instead of Intra-State (CGST 2.5% + SGST 2.5%)
                  </label>
                </div>
              </div>

              {/* Items Section */}
              <div className="border-t border-charcoal-200 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-burgundy-900">
                    Invoice Items & HSN
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-xs font-semibold text-burgundy-900 hover:underline"
                  >
                    + Add Item Line
                  </button>
                </div>

                <div className="space-y-3">
                  {formItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-ivory-50 rounded-xl border border-charcoal-200 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                    >
                      <div className="sm:col-span-4">
                        <label className="block text-[10px] text-charcoal-500 mb-0.5">Product</label>
                        <select
                          value={item.productId}
                          onChange={(e) => handleItemChange(idx, "productId", e.target.value)}
                          className="w-full py-1.5 px-2 text-xs border border-charcoal-200 rounded bg-white"
                        >
                          <option value="">-- Custom item --</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.code})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-[10px] text-charcoal-500 mb-0.5">Description</label>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                          placeholder="Item description"
                          required
                          className="w-full py-1.5 px-2 text-xs border border-charcoal-200 rounded"
                        />
                      </div>

                      <div className="sm:col-span-1">
                        <label className="block text-[10px] text-charcoal-500 mb-0.5">HSN</label>
                        <input
                          type="text"
                          value={item.hsnCode}
                          onChange={(e) => handleItemChange(idx, "hsnCode", e.target.value)}
                          className="w-full py-1.5 px-2 text-xs border border-charcoal-200 rounded"
                        />
                      </div>

                      <div className="sm:col-span-1">
                        <label className="block text-[10px] text-charcoal-500 mb-0.5">Qty</label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                          className="w-full py-1.5 px-2 text-xs border border-charcoal-200 rounded text-center"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] text-charcoal-500 mb-0.5">Rate (₹)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(idx, "unitPrice", e.target.value)}
                          className="w-full py-1.5 px-2 text-xs border border-charcoal-200 rounded text-right font-mono"
                        />
                      </div>

                      <div className="sm:col-span-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(idx)}
                          disabled={formItems.length === 1}
                          className="text-rose-600 hover:text-rose-800 text-xs font-bold disabled:opacity-30 pt-3"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                  Notes / Dispatch Reference
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dispatched via Express Courier"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full py-2 px-3 text-sm border border-charcoal-200 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-charcoal-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold border border-charcoal-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-sm font-semibold bg-burgundy-900 text-gold-300 rounded-lg hover:bg-burgundy-950 disabled:opacity-50"
                >
                  {isSubmitting ? "Generating..." : "Save & Generate Invoice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

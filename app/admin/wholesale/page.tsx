"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { getAdminWholesaleEnquiries } from "@/lib/api";
import { AdminWholesaleEnquiryList, CRMEnquiryStatus } from "@/types";
import {
  Store,
  Search,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  ArrowRight,
  Building,
  Phone,
  Mail,
  UserCheck,
  Package,
} from "lucide-react";

export default function AdminWholesalePage() {
  const [enquiries, setEnquiries] = useState<AdminWholesaleEnquiryList[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEnquiries = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getAdminWholesaleEnquiries({
        page,
        limit: 15,
        status: statusFilter || undefined,
        search: search.trim() || undefined,
      });
      setEnquiries(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (err: any) {
      console.error("Failed to load wholesale enquiries:", err);
      setError(err?.message || "Failed to load wholesale CRM pipeline.");
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => {
    fetchEnquiries();
  }, [fetchEnquiries]);

  const newCount = enquiries.filter((e) => e.status === "NEW").length;
  const negotiatingCount = enquiries.filter((e) =>
    ["CONTACTED", "CATALOGUE_SENT", "NEGOTIATING"].includes(e.status)
  ).length;
  const convertedCount = enquiries.filter((e) => e.status === "CONVERTED_TO_ORDER").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-burgundy-950">
            Wholesale Trade CRM & Leads Desk
          </h1>
          <p className="text-xs text-charcoal-500 mt-1">
            Qualify showroom enquiries, track sample catalogues, negotiate terms, and convert B2B buyers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchEnquiries}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-gold-300 hover:bg-gold-50 text-charcoal-700 text-xs font-medium rounded-sm transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-gold-600" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-sm text-xs text-red-900 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white border border-gold-300/80 rounded-sm shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs uppercase tracking-wider text-charcoal-500 font-semibold block">
              New Inbound Enquiries
            </span>
            <span className="font-serif text-2xl font-bold text-amber-700">
              {newCount}
            </span>
          </div>
          <Clock className="w-5 h-5 text-amber-600" />
        </div>

        <div className="p-4 bg-white border border-gold-300/80 rounded-sm shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs uppercase tracking-wider text-charcoal-500 font-semibold block">
              In Negotiation / Sampling
            </span>
            <span className="font-serif text-2xl font-bold text-burgundy-950">
              {negotiatingCount}
            </span>
          </div>
          <Store className="w-5 h-5 text-burgundy-900" />
        </div>

        <div className="p-4 bg-white border border-gold-300/80 rounded-sm shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs uppercase tracking-wider text-charcoal-500 font-semibold block">
              Converted to Sales Orders
            </span>
            <span className="font-serif text-2xl font-bold text-emerald-800">
              {convertedCount}
            </span>
          </div>
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 bg-white border border-gold-300/80 rounded-sm shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-charcoal-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Business name, contact person, city, phone..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-xs bg-ivory-50/60 border border-gold-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-gold-500 text-charcoal-900"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-ivory-50/60 border border-gold-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-gold-500 text-charcoal-900"
            >
              <option value="">All CRM Stages</option>
              <option value="NEW">New Trade Leads</option>
              <option value="CONTACTED">Contacted / Call Scheduled</option>
              <option value="CATALOGUE_SENT">Lookbook / Catalogue Sent</option>
              <option value="NEGOTIATING">Price & MOQ Negotiating</option>
              <option value="CONVERTED_TO_ORDER">Converted to Order</option>
              <option value="REJECTED">Declined / Closed</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-gold-200/60 text-xs text-charcoal-500">
          <span>
            Showing <strong>{enquiries.length}</strong> of <strong>{total}</strong> trade applications
          </span>
          {(search || statusFilter) && (
            <button
              onClick={() => {
                setSearch("");
                setStatusFilter("");
                setPage(1);
              }}
              className="text-xs text-burgundy-900 font-semibold hover:underline"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Enquiries Table */}
      <div className="bg-white border border-gold-300/80 rounded-sm shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center space-y-2">
            <Loader2 className="w-7 h-7 text-burgundy-900 animate-spin" />
            <span className="text-xs font-mono text-charcoal-500">Loading wholesale leads...</span>
          </div>
        ) : enquiries.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <Store className="w-10 h-10 text-gold-400 mx-auto" />
            <h3 className="font-serif text-base font-bold text-burgundy-950">
              No Wholesale Enquiries Found
            </h3>
            <p className="text-xs text-charcoal-500 max-w-sm mx-auto">
              No trade enquiries match the current filter or search criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-charcoal-700">
              <thead className="bg-ivory-50 text-[10px] uppercase tracking-wider text-charcoal-500 border-b border-gold-200">
                <tr>
                  <th className="px-4 py-3 font-semibold">Business / Showroom</th>
                  <th className="px-4 py-3 font-semibold">Contact Person</th>
                  <th className="px-4 py-3 font-semibold">Business Type</th>
                  <th className="px-4 py-3 font-semibold">Location</th>
                  <th className="px-4 py-3 font-semibold">Expected Volume</th>
                  <th className="px-4 py-3 font-semibold">CRM Stage</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold-200/60">
                {enquiries.map((e) => (
                  <tr key={e.id} className="hover:bg-ivory-50/70 transition-colors">
                    {/* Business Name */}
                    <td className="px-4 py-3.5 font-medium text-charcoal-900">
                      <div className="font-bold text-burgundy-950">{e.business_name}</div>
                      <div className="text-[10px] text-charcoal-400">
                        Received on {new Date(e.created_at).toLocaleDateString("en-IN")}
                      </div>
                    </td>

                    {/* Contact Person */}
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-charcoal-900">{e.contact_person}</div>
                      <div className="text-[10px] text-charcoal-500 font-mono">{e.phone}</div>
                    </td>

                    {/* Business Type */}
                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-ivory-100 text-charcoal-800 border border-gold-300">
                        {e.business_type}
                      </span>
                    </td>

                    {/* Location */}
                    <td className="px-4 py-3.5 text-charcoal-800">
                      {e.city}
                    </td>

                    {/* Volume */}
                    <td className="px-4 py-3.5 font-mono text-charcoal-700">
                      {e.expected_quantity || "Unspecified"}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          e.status === "CONVERTED_TO_ORDER"
                            ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                            : e.status === "REJECTED"
                            ? "bg-charcoal-100 text-charcoal-600 border border-charcoal-300"
                            : e.status === "NEW"
                            ? "bg-amber-100 text-amber-900 border border-amber-300"
                            : "bg-blue-100 text-blue-900 border border-blue-300"
                        }`}
                      >
                        {e.status.replace(/_/g, " ")}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <Link
                        href={`/admin/wholesale/${e.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-burgundy-900 hover:bg-burgundy-950 text-gold-200 rounded text-xs font-semibold uppercase tracking-wider transition-colors"
                      >
                        <span>Manage Lead</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
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
              Page <strong>{page}</strong> of <strong>{totalPages}</strong>
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-gold-300 rounded-sm text-charcoal-700 disabled:opacity-40 hover:bg-gold-50"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-gold-300 rounded-sm text-charcoal-700 disabled:opacity-40 hover:bg-gold-50"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

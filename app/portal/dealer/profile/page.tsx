"use client";

import React, { useState, useEffect } from "react";
import { getDealerProfile } from "@/lib/api";
import { DealerProfile } from "@/lib/api/dealer";
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  FileCheck,
  CreditCard,
  Loader2,
  ShieldCheck,
} from "lucide-react";

export default function DealerProfilePage() {
  const [profile, setProfile] = useState<DealerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        setIsLoading(true);
        const data = await getDealerProfile();
        setProfile(data);
      } catch (err) {
        console.error("Failed to load dealer profile:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadProfile();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-silk-red-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-serif font-bold text-heritage-brown-950">Merchant Business Profile</h1>
        <p className="text-xs sm:text-sm text-heritage-brown-600 mt-0.5 font-sans">
          B2B wholesale trading account information, registered GSTIN, and credit terms
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Business & Contact Info */}
        <div className="lg:col-span-7 bg-white rounded-[4px] p-6 border border-gold-300/60 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-[4px] bg-silk-red-50 flex items-center justify-center text-silk-red-700 border border-silk-red-200">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-heritage-brown-950">{profile?.company_name || profile?.full_name}</h2>
              <p className="text-xs text-gold-700 font-semibold uppercase tracking-wider font-sans">Verified Silk Wholesale Partner</p>
            </div>
          </div>

          <div className="divide-y divide-gold-100 text-xs font-sans">
            <div className="py-3 flex justify-between">
              <span className="text-heritage-brown-500">Contact Person:</span>
              <span className="font-semibold text-heritage-brown-950">{profile?.contact_person || profile?.full_name}</span>
            </div>
            <div className="py-3 flex justify-between items-center">
              <span className="text-heritage-brown-500 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-gold-600" /> Email:
              </span>
              <span className="font-semibold text-heritage-brown-950">{profile?.email}</span>
            </div>
            <div className="py-3 flex justify-between items-center">
              <span className="text-heritage-brown-500 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-gold-600" /> Phone:
              </span>
              <span className="font-semibold text-heritage-brown-950">{profile?.phone}</span>
            </div>
            <div className="py-3 flex justify-between">
              <span className="text-heritage-brown-500">GSTIN / Tax ID:</span>
              <span className="font-mono font-bold text-silk-red-700">{profile?.gstin || "Not Registered"}</span>
            </div>
            <div className="py-3 flex justify-between">
              <span className="text-heritage-brown-500">Location:</span>
              <span className="font-semibold text-heritage-brown-950">{profile?.city}, {profile?.state}</span>
            </div>
            <div className="py-3 flex justify-between items-start">
              <span className="text-heritage-brown-500 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-gold-600" /> Shipping Address:
              </span>
              <span className="font-semibold text-heritage-brown-950 text-right max-w-xs">{profile?.shipping_address || "On File"}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Commercial & Credit Terms */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-[4px] p-6 border border-gold-300/60 shadow-sm space-y-4">
            <h3 className="text-sm font-serif font-bold text-heritage-brown-950 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-700" /> Approved Trade Terms
            </h3>

            <div className="p-4 bg-ivory-50 rounded-[4px] border border-gold-200 space-y-2 text-xs font-sans">
              <div className="flex justify-between">
                <span className="text-heritage-brown-600">Trading Role:</span>
                <span className="font-bold text-heritage-brown-950 font-serif">
                  {profile?.role || "DEALER"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-heritage-brown-600">Pricing Tier Category:</span>
                <span className="font-semibold text-silk-red-700">Tiered Wholesale Pricing</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50 p-3 rounded-[4px] border border-emerald-200 font-sans">
              <ShieldCheck className="w-4 h-4 flex-shrink-0" />
              <span>Merchant account is active and verified for instant order placement.</span>
            </div>
          </div>

          <div className="bg-white rounded-[4px] p-6 border border-gold-300/60 shadow-sm space-y-3 font-sans">
            <h3 className="text-sm font-serif font-bold text-heritage-brown-950 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-silk-red-600" /> Need to Update Details?
            </h3>
            <p className="text-xs text-heritage-brown-600 leading-relaxed">
              To update your GSTIN, credit limit, or shipping destination, please contact our wholesale trade desk.
            </p>
            <a
              href="tel:+919876543210"
              className="inline-block text-xs font-bold text-silk-red-600 hover:text-silk-red-800 underline"
            >
              Contact Account Representative →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

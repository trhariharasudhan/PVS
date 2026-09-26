"use client";

import React, { useState } from "react";
import { submitWholesaleEnquiry } from "@/lib/api";
import { getWhatsAppLink } from "@/config/site";
import { Send, CheckCircle2, MessageCircle, AlertCircle, Loader2 } from "lucide-react";

export function WholesaleForm() {
  const [formData, setFormData] = useState({
    businessName: "",
    contactPerson: "",
    phone: "",
    email: "",
    city: "",
    businessType: "Retail Saree Showroom",
    numberOfStores: "1-2 Stores",
    interestedCollection: "Pure Silk & Bridal Sarees",
    expectedQuantity: "10-25 Sarees",
    message: "",
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await submitWholesaleEnquiry({
        business_name: formData.businessName,
        contact_person: formData.contactPerson,
        phone: formData.phone,
        email: formData.email || undefined,
        city: formData.city,
        business_type: formData.businessType,
        number_of_stores: formData.numberOfStores,
        interested_collection: formData.interestedCollection,
        expected_quantity: formData.expectedQuantity,
        message: formData.message || undefined,
      });

      setSubmitted(true);
    } catch (err) {
      console.error("Wholesale submission failed:", err);
      setError("Unable to save directly to server. You can still forward your application directly via WhatsApp below.");
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  const generateWhatsAppInquiryUrl = () => {
    const text = `*WHOLESALE B2B ENQUIRY - PVS SILK S*
• *Business:* ${formData.businessName || "Not specified"}
• *Contact:* ${formData.contactPerson} (${formData.phone})
• *Email:* ${formData.email || "N/A"}
• *City:* ${formData.city}
• *Business Type:* ${formData.businessType}
• *Stores:* ${formData.numberOfStores}
• *Interested In:* ${formData.interestedCollection}
• *Expected Qty:* ${formData.expectedQuantity}
• *Requirement:* ${formData.message || "General wholesale catalogue & pricing"}`;

    return getWhatsAppLink(text);
  };

  return (
    <div className="bg-white border border-gold-300/80 rounded-[4px] shadow-luxury p-6 sm:p-10">
      {submitted ? (
        <div className="text-center py-8 space-y-4 animate-fade-in-subtle">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto border border-emerald-300">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="font-serif text-2xl font-bold text-heritage-brown-950">
            Wholesale Inquiry Recorded
          </h3>
          {error ? (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-900 max-w-md mx-auto">
              <AlertCircle className="w-4 h-4 inline mr-1 text-amber-700" />
              {error}
            </div>
          ) : (
            <p className="text-xs sm:text-sm text-heritage-brown-700 max-w-md mx-auto leading-relaxed font-sans">
              Thank you, <span className="font-semibold text-heritage-brown-950">{formData.contactPerson}</span>.
              Our manufacturing trade desk has logged your application for{" "}
              <span className="font-semibold text-heritage-brown-950">{formData.businessName}</span>.
            </p>
          )}

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href={generateWhatsAppInquiryUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-emerald-800 hover:bg-emerald-700 text-white text-xs uppercase tracking-widest font-semibold px-6 py-3.5 rounded-[4px] shadow-md transition-all"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Forward to Wholesale WhatsApp</span>
            </a>

            <button
              type="button"
              onClick={() => {
                setSubmitted(false);
                setError(null);
                setFormData({
                  businessName: "",
                  contactPerson: "",
                  phone: "",
                  email: "",
                  city: "",
                  businessType: "Retail Saree Showroom",
                  numberOfStores: "1-2 Stores",
                  interestedCollection: "Pure Silk & Bridal Sarees",
                  expectedQuantity: "10-25 Sarees",
                  message: "",
                });
              }}
              className="text-xs text-heritage-brown-600 hover:text-silk-red-600 underline"
            >
              Submit Another Inquiry
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-heritage-brown-950">
              Wholesale & Boutique Trade Application
            </h3>
            <p className="text-xs text-heritage-brown-600 mt-1 font-sans">
              Please provide your store or business details. Direct loom quotations will be shared within 24 business hours.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Business Name */}
            <div>
              <label className="block text-xs font-semibold text-heritage-brown-900 uppercase tracking-wider mb-1">
                Business / Showroom Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Sri Krishna Silks / Diva Boutique"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-ivory-50/70 border border-gold-300/80 rounded-[4px] focus:outline-none focus:ring-1 focus:ring-silk-red-600 focus:border-silk-red-600 focus:bg-white text-heritage-brown-950"
              />
            </div>

            {/* Contact Person */}
            <div>
              <label className="block text-xs font-semibold text-heritage-brown-900 uppercase tracking-wider mb-1">
                Contact Person Name *
              </label>
              <input
                type="text"
                required
                placeholder="Your Full Name"
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-ivory-50/70 border border-gold-300/80 rounded-[4px] focus:outline-none focus:ring-1 focus:ring-silk-red-600 focus:border-silk-red-600 focus:bg-white text-heritage-brown-950"
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-semibold text-heritage-brown-900 uppercase tracking-wider mb-1">
                WhatsApp / Phone Number *
              </label>
              <input
                type="tel"
                required
                placeholder="+91 98765 43210"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-ivory-50/70 border border-gold-300/80 rounded-[4px] focus:outline-none focus:ring-1 focus:ring-silk-red-600 focus:border-silk-red-600 focus:bg-white text-heritage-brown-950"
              />
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold text-heritage-brown-900 uppercase tracking-wider mb-1">
                Business Email Address
              </label>
              <input
                type="email"
                placeholder="store@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-ivory-50/70 border border-gold-300/80 rounded-[4px] focus:outline-none focus:ring-1 focus:ring-silk-red-600 focus:border-silk-red-600 focus:bg-white text-heritage-brown-950"
              />
            </div>

            {/* City & State */}
            <div>
              <label className="block text-xs font-semibold text-heritage-brown-900 uppercase tracking-wider mb-1">
                City / Location *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Chennai, Bangalore, Hyderabad"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-ivory-50/70 border border-gold-300/80 rounded-[4px] focus:outline-none focus:ring-1 focus:ring-silk-red-600 focus:border-silk-red-600 focus:bg-white text-heritage-brown-950"
              />
            </div>

            {/* Business Type */}
            <div>
              <label className="block text-xs font-semibold text-heritage-brown-900 uppercase tracking-wider mb-1">
                Business Nature
              </label>
              <select
                value={formData.businessType}
                onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-ivory-50/70 border border-gold-300/80 rounded-[4px] focus:outline-none focus:ring-1 focus:ring-silk-red-600 focus:border-silk-red-600 focus:bg-white text-heritage-brown-950"
              >
                <option>Retail Saree Showroom</option>
                <option>Boutique / Designer Studio</option>
                <option>Online Saree Brand / D2C</option>
                <option>Regional Wholesaler / Distributor</option>
                <option>International / Export Buyer</option>
                <option>Other Textile Business</option>
              </select>
            </div>

            {/* Number of Stores */}
            <div>
              <label className="block text-xs font-semibold text-heritage-brown-900 uppercase tracking-wider mb-1">
                Number of Outlets
              </label>
              <select
                value={formData.numberOfStores}
                onChange={(e) => setFormData({ ...formData, numberOfStores: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-ivory-50/70 border border-gold-300/80 rounded-[4px] focus:outline-none focus:ring-1 focus:ring-silk-red-600 focus:border-silk-red-600 focus:bg-white text-heritage-brown-950"
              >
                <option>1-2 Stores</option>
                <option>3-5 Stores</option>
                <option>6+ Chain Outlets</option>
                <option>Online Exclusive</option>
              </select>
            </div>

            {/* Expected Order Quantity */}
            <div>
              <label className="block text-xs font-semibold text-heritage-brown-900 uppercase tracking-wider mb-1">
                Anticipated Order Volume
              </label>
              <select
                value={formData.expectedQuantity}
                onChange={(e) => setFormData({ ...formData, expectedQuantity: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-ivory-50/70 border border-gold-300/80 rounded-[4px] focus:outline-none focus:ring-1 focus:ring-silk-red-600 focus:border-silk-red-600 focus:bg-white text-heritage-brown-950"
              >
                <option>Sample Order (5-10 Sarees)</option>
                <option>10-25 Sarees</option>
                <option>25-50 Sarees</option>
                <option>50-100 Sarees</option>
                <option>100+ Bulk Production Run</option>
              </select>
            </div>
          </div>

          {/* Interested Collections */}
          <div>
            <label className="block text-xs font-semibold text-heritage-brown-900 uppercase tracking-wider mb-1">
              Primary Collection of Interest
            </label>
            <select
              value={formData.interestedCollection}
              onChange={(e) => setFormData({ ...formData, interestedCollection: e.target.value })}
              className="w-full px-3.5 py-2.5 text-xs bg-ivory-50/70 border border-gold-300/80 rounded-[4px] focus:outline-none focus:ring-1 focus:ring-silk-red-600 focus:border-silk-red-600 focus:bg-white text-heritage-brown-950"
            >
              <option>Pure Mulberry Silk & Bridal Sarees</option>
              <option>Traditional Korvai Temple Border Sarees</option>
              <option>Lightweight Soft Silk Sarees</option>
              <option>Custom Loom Colorways & Specific CAD Weaves</option>
              <option>All Collections (Full Catalogue)</option>
            </select>
          </div>

          {/* Message / Custom Requirements */}
          <div>
            <label className="block text-xs font-semibold text-heritage-brown-900 uppercase tracking-wider mb-1">
              Custom Requirements / Specific Notes
            </label>
            <textarea
              rows={4}
              placeholder="Mention any specific color requirements, target price points, or GST/billing queries..."
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full px-3.5 py-2.5 text-xs bg-ivory-50/70 border border-gold-300/80 rounded-[4px] focus:outline-none focus:ring-1 focus:ring-silk-red-600 focus:border-silk-red-600 focus:bg-white text-heritage-brown-950"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 bg-silk-red-600 hover:bg-silk-red-800 text-ivory-50 text-xs sm:text-sm font-semibold uppercase tracking-widest py-4 rounded-[4px] border border-silk-red-600 shadow-luxury transition-all disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting Application to Trade Desk...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 text-gold-300" />
                  <span>SEND WHOLESALE ENQUIRY</span>
                </>
              )}
            </button>
          </div>

          <p className="text-[11px] text-heritage-brown-600 text-center font-sans">
            Direct communication: Your inquiry goes directly to our manufacturing trade team in Tamil Nadu.
          </p>
        </form>
      )}
    </div>
  );
}

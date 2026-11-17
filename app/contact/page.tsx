"use client";

import React, { useState } from "react";
import { siteConfig } from "@/config/site";
import { GoldDivider } from "@/components/ui/GoldDivider";
import {
  MapPin,
  Phone,
  MessageCircle,
  Navigation,
  Send,
  CheckCircle2,
  Clock,
  Building2,
  ShoppingBag,
  Sparkles,
} from "lucide-react";

export default function ContactPage() {
  const [activeTab, setActiveTab] = useState<"retail" | "wholesale" | "general">("retail");

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    city: "",
    businessName: "",
    sareeCodeOrName: "",
    message: "",
  });

  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const generateWhatsAppUrl = () => {
    let text = "";
    if (activeTab === "retail") {
      text = `*RETAIL ENQUIRY - PVS*
• *Name:* ${formData.name}
• *Phone:* ${formData.phone}
• *City:* ${formData.city}
• *Saree Interest:* ${formData.sareeCodeOrName || "Catalogue Browsing"}
• *Message:* ${formData.message || "Looking to purchase pattu sarees"}`;
    } else if (activeTab === "wholesale") {
      text = `*WHOLESALE ENQUIRY - PVS*
• *Name:* ${formData.name}
• *Business:* ${formData.businessName || "Retail Boutique"}
• *Phone:* ${formData.phone}
• *City:* ${formData.city}
• *Message:* ${formData.message || "Interested in wholesale pattu sarees"}`;
    } else {
      text = `*GENERAL ENQUIRY - PVS*
• *Name:* ${formData.name}
• *Phone:* ${formData.phone}
• *City:* ${formData.city}
• *Message:* ${formData.message || "General inquiry"}`;
    }

    return `https://wa.me/${siteConfig.business.whatsapp}?text=${encodeURIComponent(text)}`;
  };

  const address = siteConfig.business.address;

  return (
    <div className="min-h-screen bg-ivory-50 pb-24">
      {/* Header Banner */}
      <section className="bg-silk-cream-100/70 text-heritage-brown-950 py-16 sm:py-24 border-b border-gold-300/40 relative overflow-hidden">
        <div className="absolute inset-0 bg-textile-weave opacity-40 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-3">
          <span className="text-xs font-semibold tracking-widest uppercase text-silk-red-700 font-mono">
            DIRECT LOOM ACCESS
          </span>
          <GoldDivider variant="motif" theme="light" className="!my-2" />
          <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-heritage-brown-950">
            Get in Touch with PVS
          </h1>
          <p className="mt-3 text-base sm:text-lg text-heritage-brown-700 max-w-2xl mx-auto font-sans leading-relaxed">
            Connect directly with manufacturer Sathish Kumar and our weaving desk in Salem, Tamil Nadu.
            Wholesale supply and retail purchases available.
          </p>
        </div>
      </section>

      {/* Main Workspace */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16">
        {/* 3 Contact Pillar Cards: VISIT US, CALL US, WHATSAPP */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {/* VISIT US */}
          <div className="bg-white border border-gold-300/80 rounded-[4px] p-6 sm:p-8 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-luxury transition-all">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-[4px] bg-silk-red-50 border border-silk-red-200 flex items-center justify-center text-silk-red-700">
                <MapPin className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-gold-700 font-bold block">
                LOCATION & SHOWROOM
              </span>
              <h2 className="font-serif text-xl font-bold text-heritage-brown-950">
                VISIT US
              </h2>
              <address className="not-italic text-xs text-heritage-brown-700 font-sans leading-relaxed">
                {address.street},<br />
                {address.village}, {address.post},<br />
                {address.district} District,<br />
                {address.state} {address.pincode}, India
              </address>
            </div>

            <div className="pt-2">
              <a
                href={address.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 bg-silk-red-700 hover:bg-deep-maroon-800 text-ivory-50 text-xs font-semibold py-3 rounded-[4px] uppercase tracking-wider shadow-sm transition-all"
              >
                <Navigation className="w-3.5 h-3.5 text-gold-300" />
                <span>Get Directions</span>
              </a>
            </div>
          </div>

          {/* CALL US */}
          <div className="bg-white border border-gold-300/80 rounded-[4px] p-6 sm:p-8 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-luxury transition-all">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-[4px] bg-gold-50 border border-gold-200 flex items-center justify-center text-gold-700">
                <Phone className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-gold-700 font-bold block">
                DIRECT TELEPHONE
              </span>
              <h2 className="font-serif text-xl font-bold text-heritage-brown-950">
                CALL US
              </h2>
              <p className="text-xs text-heritage-brown-700 font-sans leading-relaxed">
                Speak directly with Sathish Kumar for order updates, loom consultations, and retail inquiries.
              </p>
              <p className="font-mono text-base font-bold text-silk-red-700 pt-1">
                +91 99651 76136
              </p>
            </div>

            <div className="pt-2">
              <a
                href={`tel:${siteConfig.business.phoneNumeric}`}
                className="w-full inline-flex items-center justify-center gap-2 bg-heritage-brown-900 hover:bg-heritage-brown-950 text-ivory-50 text-xs font-semibold py-3 rounded-[4px] uppercase tracking-wider shadow-sm transition-all"
              >
                <Phone className="w-3.5 h-3.5 text-gold-400" />
                <span>Call Now</span>
              </a>
            </div>
          </div>

          {/* WHATSAPP */}
          <div className="bg-white border border-gold-300/80 rounded-[4px] p-6 sm:p-8 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-luxury transition-all">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-[4px] bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                <MessageCircle className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-700 font-bold block">
                INSTANT MESSAGING
              </span>
              <h2 className="font-serif text-xl font-bold text-heritage-brown-950">
                WHATSAPP
              </h2>
              <p className="text-xs text-heritage-brown-700 font-sans leading-relaxed">
                Send saree photo queries, request live video calls of sarees on looms, and get quick answers.
              </p>
              <p className="font-mono text-base font-bold text-emerald-700 pt-1">
                Chat with PVS
              </p>
            </div>

            <div className="pt-2">
              <a
                href={`https://wa.me/${siteConfig.business.whatsapp}?text=${encodeURIComponent(
                  siteConfig.whatsappTemplates.general()
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold py-3 rounded-[4px] uppercase tracking-wider shadow-sm transition-all"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
        </div>

        {/* Interactive Tabs Form Container */}
        <div className="bg-white border border-gold-300 rounded-[4px] shadow-luxury p-6 sm:p-10 max-w-4xl mx-auto">
          {/* Tab Selector */}
          <div className="flex border-b border-gold-200 mb-8 overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => {
                setActiveTab("retail");
                setSubmitted(false);
              }}
              className={`flex-1 py-3 px-4 text-xs font-semibold uppercase tracking-wider text-center border-b-2 transition-all whitespace-nowrap ${
                activeTab === "retail"
                  ? "border-silk-red-700 text-silk-red-700 font-bold bg-silk-red-50/40"
                  : "border-transparent text-heritage-brown-600 hover:text-heritage-brown-950"
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5 inline mr-1.5" />
              <span>Retail Enquiry</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("wholesale");
                setSubmitted(false);
              }}
              className={`flex-1 py-3 px-4 text-xs font-semibold uppercase tracking-wider text-center border-b-2 transition-all whitespace-nowrap ${
                activeTab === "wholesale"
                  ? "border-silk-red-700 text-silk-red-700 font-bold bg-silk-red-50/40"
                  : "border-transparent text-heritage-brown-600 hover:text-heritage-brown-950"
              }`}
            >
              <Building2 className="w-3.5 h-3.5 inline mr-1.5" />
              <span>Wholesale Enquiry</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("general");
                setSubmitted(false);
              }}
              className={`flex-1 py-3 px-4 text-xs font-semibold uppercase tracking-wider text-center border-b-2 transition-all whitespace-nowrap ${
                activeTab === "general"
                  ? "border-silk-red-700 text-silk-red-700 font-bold bg-silk-red-50/40"
                  : "border-transparent text-heritage-brown-600 hover:text-heritage-brown-950"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 inline mr-1.5" />
              <span>General Enquiry</span>
            </button>
          </div>

          {submitted ? (
            <div className="text-center py-10 space-y-4 animate-fade-in-subtle">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto border border-emerald-300">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-heritage-brown-950">
                Enquiry Received
              </h3>
              <p className="text-xs sm:text-sm text-heritage-brown-700 max-w-md mx-auto leading-relaxed font-sans">
                Thank you, <span className="font-semibold text-heritage-brown-950">{formData.name}</span>.
                Sathish Kumar and our team will reply via phone or WhatsApp shortly.
              </p>

              <div className="pt-3">
                <a
                  href={generateWhatsAppUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs uppercase tracking-widest font-semibold px-6 py-3.5 rounded-[4px] shadow"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Forward Directly on WhatsApp</span>
                </a>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 font-sans text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-heritage-brown-900 uppercase tracking-wider mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Full Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-3 bg-ivory-50/70 border border-gold-300 rounded-[4px] focus:outline-none focus:ring-1 focus:ring-silk-red-700 text-heritage-brown-950"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-heritage-brown-900 uppercase tracking-wider mb-1">
                    Phone / WhatsApp Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 99651 xxxxx"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-3 bg-ivory-50/70 border border-gold-300 rounded-[4px] focus:outline-none focus:ring-1 focus:ring-silk-red-700 text-heritage-brown-950"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-heritage-brown-900 uppercase tracking-wider mb-1">
                    City / Location *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Salem, Chennai, Bengaluru"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full p-3 bg-ivory-50/70 border border-gold-300 rounded-[4px] focus:outline-none focus:ring-1 focus:ring-silk-red-700 text-heritage-brown-950"
                  />
                </div>

                {activeTab === "wholesale" ? (
                  <div>
                    <label className="block font-semibold text-heritage-brown-900 uppercase tracking-wider mb-1">
                      Business / Store Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Meenakshi Silks / Sri Devi Boutique"
                      value={formData.businessName}
                      onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                      className="w-full p-3 bg-ivory-50/70 border border-gold-300 rounded-[4px] focus:outline-none focus:ring-1 focus:ring-silk-red-700 text-heritage-brown-950"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block font-semibold text-heritage-brown-900 uppercase tracking-wider mb-1">
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      placeholder="name@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full p-3 bg-ivory-50/70 border border-gold-300 rounded-[4px] focus:outline-none focus:ring-1 focus:ring-silk-red-700 text-heritage-brown-950"
                    />
                  </div>
                )}
              </div>

              {activeTab === "retail" && (
                <div>
                  <label className="block font-semibold text-heritage-brown-900 uppercase tracking-wider mb-1">
                    Saree Code or Design Interest
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. PVS-001 (Aadrika Bridal) or Bridal Red"
                    value={formData.sareeCodeOrName}
                    onChange={(e) => setFormData({ ...formData, sareeCodeOrName: e.target.value })}
                    className="w-full p-3 bg-ivory-50/70 border border-gold-300 rounded-[4px] focus:outline-none focus:ring-1 focus:ring-silk-red-700 text-heritage-brown-950"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-heritage-brown-900 uppercase tracking-wider mb-1">
                  Message / Inquiries *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder={
                    activeTab === "wholesale"
                      ? "Tell us about your volume requirements, boutique details, and timeline..."
                      : activeTab === "retail"
                      ? "Ask about pricing, video inspection of saree, colorways, or delivery..."
                      : "Type your query here..."
                  }
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full p-3 bg-ivory-50/70 border border-gold-300 rounded-[4px] focus:outline-none focus:ring-1 focus:ring-silk-red-700 text-heritage-brown-950"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 bg-silk-red-700 hover:bg-deep-maroon-800 text-ivory-50 text-xs sm:text-sm font-semibold uppercase tracking-widest py-4 rounded-[4px] border border-silk-red-700 shadow-luxury transition-all"
                >
                  <Send className="w-4 h-4 text-gold-300" />
                  <span>
                    Submit {activeTab === "retail" ? "Retail" : activeTab === "wholesale" ? "Wholesale" : "General"} Enquiry
                  </span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

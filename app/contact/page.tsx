"use client";

import React, { useState } from "react";
import { siteConfig, getWhatsAppLink } from "@/config/site";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import {
  MapPin,
  Phone,
  Mail,
  Instagram,
  Clock,
  Send,
  MessageCircle,
  CheckCircle2,
  Building,
} from "lucide-react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    subject: "General Inquiry / Saree Details",
    message: "",
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 600);
  };

  const generateWhatsAppMessageUrl = () => {
    const text = `*GENERAL INQUIRY - PVS SILK S*
• *Name:* ${formData.name}
• *Phone:* ${formData.phone}
• *Email:* ${formData.email || "N/A"}
• *Subject:* ${formData.subject}
• *Message:* ${formData.message}`;

    return getWhatsAppLink(text);
  };

  return (
    <div className="min-h-screen bg-ivory-50 pb-24">
      {/* Header Banner */}
      <section className="bg-ivory-100 text-heritage-brown-950 py-20 relative overflow-hidden border-b border-gold-300/40">
        <div className="absolute inset-0 bg-textile-weave opacity-50 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <span className="text-xs font-semibold tracking-widest uppercase text-silk-red-600">
            Connect With Our Looms
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight mt-2 text-heritage-brown-950">
            CONTACT & SHOWROOM
          </h1>
          <p className="mt-4 text-sm sm:text-base text-heritage-brown-700 max-w-2xl mx-auto font-sans leading-relaxed">
            Reach out to PVS Silk S for individual saree enquiries, wholesale partnerships, or to
            schedule a visit to our manufacturing facility in Tamil Nadu.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Column: Official Contact Cards & Business Details */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white border border-gold-300/80 rounded-[4px] p-6 sm:p-8 shadow-sm space-y-6">
              <div>
                <span className="text-[10px] font-mono tracking-widest uppercase text-gold-700 font-bold">
                  Official Business Details
                </span>
                <h3 className="font-serif text-2xl font-bold text-heritage-brown-950 mt-1">
                  {siteConfig.business.name}
                </h3>
                <p className="text-xs text-heritage-brown-600 mt-0.5 font-sans">
                  {siteConfig.business.category}
                </p>
              </div>

              <div className="space-y-4 border-t border-ivory-200 pt-5 text-xs text-heritage-brown-700">
                {/* Address */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-[4px] bg-gold-50 flex items-center justify-center text-gold-800 flex-shrink-0 mt-0.5 border border-gold-200">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-heritage-brown-950">Manufacturing Unit & Address:</h4>
                    <p className="text-heritage-brown-600 mt-0.5 leading-relaxed font-sans">
                      {siteConfig.business.address.full}
                    </p>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-[4px] bg-gold-50 flex items-center justify-center text-gold-800 flex-shrink-0 mt-0.5 border border-gold-200">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-heritage-brown-950">Phone Inquiry:</h4>
                    <a
                      href={`tel:${siteConfig.business.phone}`}
                      className="text-silk-red-600 font-semibold hover:underline block mt-0.5"
                    >
                      {siteConfig.business.phoneDisplay}
                    </a>
                  </div>
                </div>

                {/* WhatsApp */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-[4px] bg-emerald-50 flex items-center justify-center text-emerald-800 flex-shrink-0 mt-0.5 border border-emerald-200">
                    <MessageCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-heritage-brown-950">Official WhatsApp:</h4>
                    <p className="text-emerald-800 font-bold mt-0.5">
                      {siteConfig.business.whatsappDisplay}
                    </p>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-[4px] bg-gold-50 flex items-center justify-center text-gold-800 flex-shrink-0 mt-0.5 border border-gold-200">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-heritage-brown-950">Email Address:</h4>
                    <a
                      href={`mailto:${siteConfig.business.email}`}
                      className="text-silk-red-600 font-semibold hover:underline block mt-0.5"
                    >
                      {siteConfig.business.emailDisplay}
                    </a>
                  </div>
                </div>

                {/* Instagram */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-[4px] bg-silk-red-50 border border-silk-red-200 flex items-center justify-center text-silk-red-600 flex-shrink-0 mt-0.5">
                    <Instagram className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-heritage-brown-950">Instagram Channel:</h4>
                    <a
                      href={siteConfig.social.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-silk-red-600 font-semibold hover:underline block mt-0.5"
                    >
                      {siteConfig.social.instagramHandle}
                    </a>
                  </div>
                </div>

                {/* Hours */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-[4px] bg-gold-50 flex items-center justify-center text-gold-800 flex-shrink-0 mt-0.5 border border-gold-200">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-heritage-brown-950">Operating Hours:</h4>
                    <p className="text-heritage-brown-600 mt-0.5 font-sans">{siteConfig.business.businessHours}</p>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <WhatsAppButton
                  size="md"
                  variant="gold"
                  label="Direct WhatsApp Message"
                  message={siteConfig.whatsappTemplates.general}
                  className="w-full justify-center"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Form & Map Container */}
          <div className="lg:col-span-7 space-y-8">
            {/* Contact Form */}
            <div className="bg-white border border-gold-300/80 rounded-[4px] p-6 sm:p-10 shadow-luxury">
              {submitted ? (
                <div className="text-center py-10 space-y-4 animate-fade-in-subtle">
                  <div className="w-14 h-14 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto border border-emerald-300">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="font-serif text-2xl font-bold text-heritage-brown-950">
                    Message Received
                  </h3>
                  <p className="text-xs sm:text-sm text-heritage-brown-700 max-w-md mx-auto leading-relaxed font-sans">
                    Thank you, <span className="font-semibold text-heritage-brown-950">{formData.name}</span>.
                    Our team will reply via WhatsApp or phone shortly.
                  </p>
                  <div className="pt-3">
                    <a
                      href={generateWhatsAppMessageUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-emerald-800 hover:bg-emerald-700 text-white text-xs uppercase tracking-widest font-semibold px-6 py-3.5 rounded-[4px] shadow"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Forward Directly on WhatsApp</span>
                    </a>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <h3 className="font-serif text-xl sm:text-2xl font-bold text-heritage-brown-950">
                      Send a Message to PVS Silk S
                    </h3>
                    <p className="text-xs text-heritage-brown-600 mt-1 font-sans">
                      Have a query regarding a specific saree design, retail order, or custom weave?
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-semibold text-heritage-brown-900 uppercase tracking-wider mb-1">
                        Your Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Enter your name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs bg-ivory-50/70 border border-gold-300/80 rounded-[4px] focus:outline-none focus:ring-1 focus:ring-silk-red-600 focus:border-silk-red-600 focus:bg-white text-heritage-brown-950"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-heritage-brown-900 uppercase tracking-wider mb-1">
                        Phone / WhatsApp Number *
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
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-heritage-brown-900 uppercase tracking-wider mb-1">
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      placeholder="your.email@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs bg-ivory-50/70 border border-gold-300/80 rounded-[4px] focus:outline-none focus:ring-1 focus:ring-silk-red-600 focus:border-silk-red-600 focus:bg-white text-heritage-brown-950"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-heritage-brown-900 uppercase tracking-wider mb-1">
                      Subject / Interest Area
                    </label>
                    <select
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs bg-ivory-50/70 border border-gold-300/80 rounded-[4px] focus:outline-none focus:ring-1 focus:ring-silk-red-600 focus:border-silk-red-600 focus:bg-white text-heritage-brown-950"
                    >
                      <option>General Inquiry / Saree Details</option>
                      <option>Specific Saree Price & Availability</option>
                      <option>Wholesale & Boutique Supply</option>
                      <option>Factory Loom Visit / Video Tour</option>
                      <option>Custom Bridal Silk Weaving</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-heritage-brown-900 uppercase tracking-wider mb-1">
                      Your Message *
                    </label>
                    <textarea
                      rows={4}
                      required
                      placeholder="Type your message, saree codes you are interested in, or specific requirements..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs bg-ivory-50/70 border border-gold-300/80 rounded-[4px] focus:outline-none focus:ring-1 focus:ring-silk-red-600 focus:border-silk-red-600 focus:bg-white text-heritage-brown-950"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full inline-flex items-center justify-center gap-2 bg-silk-red-600 hover:bg-silk-red-800 text-ivory-50 text-xs sm:text-sm font-semibold uppercase tracking-widest py-4 rounded-[4px] border border-silk-red-600 shadow-luxury transition-all disabled:opacity-70"
                  >
                    <Send className="w-4 h-4 text-gold-300" />
                    <span>{loading ? "Sending..." : "SEND MESSAGE"}</span>
                  </button>
                </form>
              )}
            </div>

            {/* Google Maps Styled Placeholder Card */}
            <div className="bg-white border border-gold-300/80 rounded-[4px] p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-silk-red-600" />
                  <h4 className="font-serif text-sm font-bold text-heritage-brown-950">
                    Loom & Showroom Location Map
                  </h4>
                </div>
                <span className="text-[10px] font-mono text-gold-700 uppercase font-semibold">
                  Tamil Nadu, India
                </span>
              </div>

              {/* Styled Interactive Map Box */}
              <div className="relative aspect-[16/8] rounded-[4px] overflow-hidden bg-ivory-100 border border-gold-300/60 flex items-center justify-center text-center p-6">
                <div className="space-y-2 z-10">
                  <MapPin className="w-8 h-8 text-silk-red-600 mx-auto animate-bounce" />
                  <p className="font-serif font-bold text-heritage-brown-950 text-sm">
                    PVS SILK S MANUFACTURING UNIT
                  </p>
                  <p className="text-xs text-heritage-brown-600 max-w-sm font-sans">
                    {siteConfig.business.address.full}
                  </p>
                  <div className="pt-2">
                    <span className="inline-block text-[10px] uppercase font-mono px-3 py-1 bg-heritage-brown-900 text-gold-300 rounded-[4px] border border-gold-500/30">
                      Coordinates: [11.6643° N, 78.1460° E]
                    </span>
                  </div>
                </div>
                <div className="absolute inset-0 bg-textile-weave opacity-30 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

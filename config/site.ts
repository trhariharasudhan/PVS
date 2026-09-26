export const siteConfig = {
  name: process.env.NEXT_PUBLIC_SITE_NAME || "PVS Silk S",
  brandTitle: `${process.env.NEXT_PUBLIC_SITE_NAME || "PVS Silk S"} | Silk Saree Manufacturer & Textile Brand`,
  tagline: process.env.NEXT_PUBLIC_BRAND_TAGLINE || "Woven With Precision",
  description:
    "PVS Silk S is a premier silk saree manufacturer based in Tamil Nadu, India. Specializing in authentic traditional silk sarees, bridal collections, and fine zari weaving for retail, wholesale, and boutiques worldwide.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://pvssilks.com",
  ogImage: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1200&auto=format&fit=crop",

  // Business & Contact Information (Environment-driven configuration)
  business: {
    name: process.env.NEXT_PUBLIC_SITE_NAME || "PVS Silk S",
    category: "Silk Saree Manufacturer / Silk Textile Business",
    legalName: "PVS Silk S Private Limited",
    experiencePlaceholder: "[15+ Years of Weaving Excellence]",
    manufacturingCapacityPlaceholder: "[10,000+ Sarees / Month]",
    loomCountPlaceholder: "[50+ Precision Looms]",
    location: "Tamil Nadu, India",
    address: {
      line1: process.env.NEXT_PUBLIC_BUSINESS_ADDRESS_LINE1 || "42, Weavers Colony",
      city: process.env.NEXT_PUBLIC_BUSINESS_ADDRESS_CITY || "Kanchipuram",
      state: process.env.NEXT_PUBLIC_BUSINESS_ADDRESS_STATE || "Tamil Nadu",
      pincode: process.env.NEXT_PUBLIC_BUSINESS_ADDRESS_PINCODE || "631501",
      country: process.env.NEXT_PUBLIC_BUSINESS_ADDRESS_COUNTRY || "India",
      full:
        process.env.NEXT_PUBLIC_BUSINESS_ADDRESS_FULL ||
        "42, Weavers Colony, Kanchipuram, Tamil Nadu, India - 631501",
    },
    phone: process.env.NEXT_PUBLIC_BUSINESS_PHONE || "+91 98427 12345",
    phoneDisplay: process.env.NEXT_PUBLIC_BUSINESS_PHONE_DISPLAY || "+91 98427 12345",
    whatsapp: process.env.NEXT_PUBLIC_BUSINESS_WHATSAPP || "919842712345", // Numeric without + or spaces for wa.me
    whatsappDisplay: process.env.NEXT_PUBLIC_BUSINESS_WHATSAPP_DISPLAY || "+91 98427 12345",
    email: process.env.NEXT_PUBLIC_BUSINESS_EMAIL || "contact@pvssilks.com",
    emailDisplay: process.env.NEXT_PUBLIC_BUSINESS_EMAIL_DISPLAY || "contact@pvssilks.com",
    businessHours: "Monday - Saturday: 9:00 AM - 7:30 PM (IST)",
    gstinPlaceholder: process.env.NEXT_PUBLIC_BUSINESS_GSTIN || "33AAAAA0000A1Z5",
  },

  // Bank Wire Transfer Details (For official Tax Invoices and Remittance UI)
  bank: {
    name: process.env.NEXT_PUBLIC_BANK_NAME || "State Bank of India",
    accountName: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME || "PVS Silk S Private Limited",
    accountNumber: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NUMBER || "39882200192",
    ifsc: process.env.NEXT_PUBLIC_BANK_IFSC || "SBIN0000853",
    branch: process.env.NEXT_PUBLIC_BANK_BRANCH || "Kanchipuram Main Branch",
    upiId: process.env.NEXT_PUBLIC_BANK_UPI_ID || "pvssilks@sbi",
  },

  // Social & Channels
  social: {
    instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL || "https://instagram.com/pvs_silk_s",
    instagramHandle: process.env.NEXT_PUBLIC_INSTAGRAM_HANDLE || "@pvs_silk_s",
    facebook: process.env.NEXT_PUBLIC_FACEBOOK_URL || "https://facebook.com/pvssilks",
    youtube: process.env.NEXT_PUBLIC_YOUTUBE_URL || "https://youtube.com/@pvssilks",
  },

  // WhatsApp Message Templates
  whatsappTemplates: {
    general: "Hello PVS Silk S, I would like to know more about your silk saree collections.",
    product: (code: string, name: string) =>
      `Hello PVS Silk S, I am interested in product ${code} (${name}). Please share price, availability, and high-resolution photos.`,
    wholesale: (businessName?: string) =>
      `Hello PVS Silk S, I represent ${businessName || "our retail business"} and would like to discuss wholesale manufacturing / bulk saree orders.`,
    customLoom: "Hello PVS Silk S, I would like to inquire about custom weave production / bulk loom orders.",
  },

  // Navigation Links
  navLinks: [
    { label: "Home", href: "/" },
    { label: "Collections", href: "/collections" },
    { label: "Manufacturing", href: "/manufacturing" },
    { label: "About Us", href: "/about" },
    { label: "Wholesale", href: "/wholesale" },
    { label: "Contact", href: "/contact" },
  ],
};

export function getWhatsAppLink(message: string): string {
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${siteConfig.business.whatsapp}?text=${encoded}`;
}


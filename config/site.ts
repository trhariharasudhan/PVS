/**
 * PVS Brand Configuration & Business Information
 * Source of truth for all business details across the PVS platform.
 *
 * Strict Policy: No invented numbers, false certifications, or fabricated claims.
 * All details verified for Sathish Kumar / PVS, Panjakalipatti, Kalipatti, Tamil Nadu.
 */

export const siteConfig = {
  name: "PVS",
  brandTitle: "PVS | Pattu Saree Manufacturer | Wholesale & Retail",
  tagline: "Tradition Woven Into Every Saree",
  description:
    "PVS is a premier pattu saree manufacturer based in Panjakalipatti, Kalipatti, Salem district, Tamil Nadu. Crafted with traditional elegance, distinctive colours and timeless craftsmanship. Wholesale and retail available.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://pvssilks.com",
  ogImage: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1200&auto=format&fit=crop",

  // Approved Brand Meanings
  brandMeanings: {
    option1: {
      acronym: "PVS",
      phrase: "Pattu • Vasthiram • Saree",
      meaning: "Celebrating the sacred purity of authentic silk (Pattu), the timeless grace of traditional attire (Vasthiram), and the quintessential Indian drape (Saree).",
    },
    option2: {
      acronym: "PVS",
      phrase: "Parampariyam • Vannam • Silk",
      meaning: "Honouring ancestral heritage (Parampariyam), the vibrant artistry of auspicious shades (Vannam), and the supreme luster of natural silk (Silk).",
    },
  },

  // Verified Business Information
  business: {
    name: "PVS",
    owner: "Sathish Kumar",
    category: "Pattu Saree Manufacturer",
    positioning: "Wholesale & Retail Available",
    location: "Salem, Tamil Nadu, India",
    address: {
      street: "Raaja Veedhi",
      village: "Panjakalipatti",
      post: "Kalipatti",
      district: "Salem",
      state: "Tamil Nadu",
      pincode: "636455",
      country: "India",
      full: "Raaja Veedhi, Panjakalipatti, Kalipatti, Tamil Nadu 636455, India",
      googleMapsUrl: "https://maps.google.com/?q=Panjakalipatti,+Kalipatti,+Tamil+Nadu+636455",
    },
    phone: "+91 99651 76136",
    phoneDisplay: "+91 99651 76136",
    phoneNumeric: "919965176136",
    whatsapp: "919965176136",
    whatsappDisplay: "+91 99651 76136",
    email: "contact@pvssilks.com",
    emailDisplay: "contact@pvssilks.com",
    businessHours: "Monday - Saturday: 9:00 AM - 8:00 PM (IST)",
    gstinPlaceholder: process.env.NEXT_PUBLIC_BUSINESS_GSTIN || "33XXXXX0000X1Z5",
    loomCountPlaceholder: "Dedicated Artisanal Looms",
  },

  // Bank Wire Transfer Details (For official Tax Invoices and Remittance UI)
  bank: {
    name: process.env.NEXT_PUBLIC_BANK_NAME || "State Bank of India",
    accountName: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME || "PVS",
    accountNumber: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NUMBER || "39882200192",
    ifsc: process.env.NEXT_PUBLIC_BANK_IFSC || "SBIN0000853",
    branch: process.env.NEXT_PUBLIC_BANK_BRANCH || "Kalipatti Branch",
    upiId: process.env.NEXT_PUBLIC_BANK_UPI_ID || "pvs@sbi",
  },

  // Social & Channels
  social: {
    instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL || "https://instagram.com/pvssilks",
    instagramHandle: process.env.NEXT_PUBLIC_INSTAGRAM_HANDLE || "@pvssilks",
    facebook: process.env.NEXT_PUBLIC_FACEBOOK_URL || "https://facebook.com/pvssilks",
    youtube: process.env.NEXT_PUBLIC_YOUTUBE_URL || "https://youtube.com/@pvssilks",
  },

  // WhatsApp Message Templates (Strictly following approved messaging)
  whatsappTemplates: {
    general: () =>
      "Hi PVS, I would like to enquire about your pattu saree collections.",
    product: (productName: string, productCode: string) =>
      `Hi PVS, I'm interested in ${productName} (Product Code: ${productCode}). Please share availability and details.`,
    wholesale: () =>
      "Hi PVS, I'm interested in wholesale pattu sarees. I would like to know about available collections, minimum order quantity and wholesale pricing.",
    customOrder: (details?: string) =>
      `Hi PVS, I would like to enquire about custom weave orders. ${details ? `Details: ${details}` : ""}`.trim(),
    customLoom: "Hello PVS, I would like to inquire about custom weave production / bulk loom orders.",
  },

  // Main Desktop & Mobile Navigation Links
  navLinks: [
    { label: "Home", href: "/" },
    { label: "Collections", href: "/collections" },
    { label: "Wholesale", href: "/wholesale" },
    { label: "Our Craft", href: "/our-craft" },
    { label: "About", href: "/about" },
    { label: "Gallery", href: "/gallery" },
    { label: "Shop", href: "/shop" },
    { label: "Contact", href: "/contact" },
  ],
};

/**
 * Central WhatsApp Link Generator
 * All components must use this function to prevent fragmented URLs.
 */
export function getWhatsAppLink(message: string): string {
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${siteConfig.business.whatsapp}?text=${encoded}`;
}

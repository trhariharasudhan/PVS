import { Product } from "@/types";

export const products: Product[] = [
  {
    id: "pvs-001",
    code: "PVS-001",
    name: "Aadrika Crimson Bridal Kanchipuram Silk",
    category: "Bridal & Wedding",
    fabric: "100% Pure Mulberry Silk (3-Ply Warp & Weft)",
    color: "Deep Crimson Red with Antique Gold Zari",
    border: "Broad Korvai Temple Border with Mayil (Peacock) & Rudraksham Motifs",
    pallu: "Rich Floral Brocade Pallu with Heavy Gold Zari Work",
    weaveType: "Traditional Korvai Interlocking Jacquard Weave",
    description:
      "A masterwork of traditional Tamil Nadu weaving, this deep crimson bridal silk saree features authentic Korvai interlocking borders with intricate temple spires and majestic peacock motifs.",
    detailedStory:
      "Crafted across 120 hours of continuous loom precision, this saree embodies the solemn dignity of South Indian bridal traditions. The body is woven with subtle micro-buttas, framed by a rich antique gold zari border that shines with subdued luxury.",
    priceDisplay: "Enquire for Price",
    priceNote: "Direct Manufacturer Pricing / Bulk Discounts for Boutiques",
    availability: "In Stock",
    featured: true,
    isNewArrival: false,
    dimensions: {
      sareeLength: "5.5 Metres",
      blousePiece: "0.8 Metres Contrast Brocade Included",
      weightApprox: "780 grams",
    },
    images: [
      {
        src: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1200&auto=format&fit=crop",
        alt: "Full Saree Drape - Aadrika Crimson Bridal Kanchipuram Silk",
        tag: "Full Saree",
      },
      {
        src: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?q=80&w=1200&auto=format&fit=crop",
        alt: "Border & Zari Close-up Detail",
        tag: "Border Detail",
      },
      {
        src: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=1200&auto=format&fit=crop",
        alt: "Rich Floral Brocade Pallu",
        tag: "Pallu Weave",
      },
      {
        src: "https://images.unsplash.com/photo-1610030469668-93530c17b58f?q=80&w=1200&auto=format&fit=crop",
        alt: "Fabric Texture & Pure Silk Sheen",
        tag: "Fabric Texture",
      },
    ],
    careInstructions: [
      "Dry clean only to maintain zari luster and silk protein integrity.",
      "Store wrapped in pure cotton or muslin fabric away from direct sunlight.",
      "Never spray perfumes or deodorants directly onto zari surfaces.",
      "Iron on low-medium silk setting strictly on the reverse side.",
    ],
  },
  {
    id: "pvs-002",
    code: "PVS-002",
    name: "Mayuri Emerald & Mustard Traditional Silk",
    category: "Traditional Weaves",
    fabric: "Pure Silk (Double Warp)",
    color: "Emerald Green with Warm Mustard Gold",
    border: "Dual Ganga-Jamuna Contrast Border with Paisley Motifs",
    pallu: "Geometric Diamond & Elephant Motif Zari Pallu",
    weaveType: "High-Density Precision Loom Weave",
    description:
      "A classic heritage pairing of rich emerald green and warm mustard, finished with dual Ganga-Jamuna border accents and finely detailed elephant crests.",
    detailedStory:
      "This creation captures the timeless aesthetic of heritage celebrations. The lustrous green body reflects natural light gracefully, while the mustard border adds depth and festive warmth.",
    priceDisplay: "Enquire for Price",
    priceNote: "Wholesale MOQ: 5 units per colorway",
    availability: "In Stock",
    featured: true,
    isNewArrival: false,
    dimensions: {
      sareeLength: "5.5 Metres",
      blousePiece: "0.8 Metres Plain Mustard with Border",
      weightApprox: "720 grams",
    },
    images: [
      {
        src: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?q=80&w=1200&auto=format&fit=crop",
        alt: "Emerald Green Silk Saree Full Drape",
        tag: "Full Saree",
      },
      {
        src: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1200&auto=format&fit=crop",
        alt: "Border & Pallu Detail",
        tag: "Border Detail",
      },
      {
        src: "https://images.unsplash.com/photo-1590736969955-71cc94801759?q=80&w=1200&auto=format&fit=crop",
        alt: "Saree Fold & Packaging",
        tag: "Folding & Finish",
      },
    ],
    careInstructions: [
      "Dry clean only.",
      "Change fold lines every 3-4 months to prevent crease stress.",
      "Store in breathable cotton saree bags.",
    ],
  },
  {
    id: "pvs-003",
    code: "PVS-003",
    name: "Rukmani Royal Violet & Muted Gold Brocade",
    category: "Pure Silk Sarees",
    fabric: "100% Pure Mulberry Silk",
    color: "Imperial Royal Violet with Soft Champagne Zari",
    border: "Intricate Floral Jaal with Scalloped Zari Edge",
    pallu: "Grand Architectural Arch Pattern Pallu",
    weaveType: "Full Body Jacquard Weave",
    description:
      "An imperial violet silk masterpiece featuring subtle all-over floral vines and a grand architectural pallu woven with muted champagne gold zari.",
    detailedStory:
      "Engineered for evening receptions and prestigious gatherings, the deep violet body provides high contrast to the soft champagne zari, avoiding harsh glitter while commanding regal presence.",
    priceDisplay: "Enquire for Price",
    priceNote: "Direct from manufacturing looms",
    availability: "In Stock",
    featured: true,
    isNewArrival: true,
    dimensions: {
      sareeLength: "5.5 Metres",
      blousePiece: "0.8 Metres Violet Brocade Included",
      weightApprox: "740 grams",
    },
    images: [
      {
        src: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=1200&auto=format&fit=crop",
        alt: "Royal Violet Silk Saree Drape",
        tag: "Full Saree",
      },
      {
        src: "https://images.unsplash.com/photo-1610030469668-93530c17b58f?q=80&w=1200&auto=format&fit=crop",
        alt: "Intricate Floral Jaal Weave Close Up",
        tag: "Fabric Texture",
      },
      {
        src: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1200&auto=format&fit=crop",
        alt: "Zari Border Finishing",
        tag: "Border Detail",
      },
    ],
    careInstructions: [
      "Professional dry clean recommended.",
      "Store horizontally in cool, dry climate.",
      "Reverse iron on low heat.",
    ],
  },
  {
    id: "pvs-004",
    code: "PVS-004",
    name: "Saundarya Pastel Blush Soft Silk Saree",
    category: "Soft Silk",
    fabric: "Featherlight Pure Soft Silk",
    color: "Pastel Blush Rose with Silver & Copper Zari",
    border: "Minimalist Sleek Zari Piping with Chevron Trim",
    pallu: "Modern Linear Geometric Stripes with Micro Tassels",
    weaveType: "Contemporary Lightweight Silk Weave",
    description:
      "Crafted for modern sensibilities, this pastel blush soft silk saree merges airy comfort with dual-tone silver and copper zari accents.",
    detailedStory:
      "Weighing under 500 grams, this soft silk saree is specially woven on high-tension looms to achieve a butter-soft drape that cascades effortlessly.",
    priceDisplay: "Enquire for Price",
    priceNote: "Ideal for modern brides and bridesmaid collections",
    availability: "In Stock",
    featured: true,
    isNewArrival: true,
    dimensions: {
      sareeLength: "5.5 Metres",
      blousePiece: "0.8 Metres Matching Blush Silk",
      weightApprox: "480 grams",
    },
    images: [
      {
        src: "https://images.unsplash.com/photo-1610030469854-41125208f237?q=80&w=1200&auto=format&fit=crop",
        alt: "Pastel Blush Soft Silk Saree",
        tag: "Full Saree",
      },
      {
        src: "https://images.unsplash.com/photo-1590736969955-71cc94801759?q=80&w=1200&auto=format&fit=crop",
        alt: "Soft Silk Drape and Texture",
        tag: "Fabric Texture",
      },
    ],
    careInstructions: [
      "Dry clean or gentle hand wash with mild protein shampoo.",
      "Dry in shade on a flat surface.",
    ],
  },
  {
    id: "pvs-005",
    code: "PVS-005",
    name: "Kalyani Temple Gold Tissue Silk Saree",
    category: "Bridal & Wedding",
    fabric: "Pure Silk-Zari Tissue Blend",
    color: "Liquid Antique Gold with Subtle Vermillion Sheen",
    border: "Traditional Temple G願i Border with Yali Crests",
    pallu: "Ornate Full-Zari Tree of Life Pallu",
    weaveType: "Double Zari Metallic Warp Weave",
    description:
      "An ethereal liquid gold tissue silk saree designed for the bride's ceremonial muhurtham, reflecting pure luminescence under traditional temple lamps.",
    detailedStory:
      "Woven with fine metallic zari twisted along with mulberry silk threads, creating a shimmering, non-stiff fabric that holds pleats crisply without bulk.",
    priceDisplay: "Enquire for Price",
    priceNote: "Exclusive Ceremonial Masterpiece",
    availability: "Limited Weave",
    featured: false,
    isNewArrival: false,
    dimensions: {
      sareeLength: "5.5 Metres",
      blousePiece: "0.8 Metres Heavy Zari Tissue Included",
      weightApprox: "820 grams",
    },
    images: [
      {
        src: "https://images.unsplash.com/photo-1590736969955-71cc94801759?q=80&w=1200&auto=format&fit=crop",
        alt: "Kalyani Gold Tissue Saree Full View",
        tag: "Full Saree",
      },
      {
        src: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1200&auto=format&fit=crop",
        alt: "Golden Zari Border Detail",
        tag: "Border Detail",
      },
    ],
    careInstructions: [
      "Strictly dry clean only.",
      "Wrap in acid-free tissue and store in cedar-lined chests or cotton covers.",
    ],
  },
  {
    id: "pvs-006",
    code: "PVS-006",
    name: "Meenakshi Peacock Teal & Coral Korvai Silk",
    category: "Traditional Weaves",
    fabric: "100% Pure Mulberry Silk",
    color: "Deep Peacock Teal with Vibrant Coral Red",
    border: "Korvai Contrast Border with Annapakshi (Mythical Bird) Motifs",
    pallu: "Rich Chevron and Diamond Brocade",
    weaveType: "Handcrafted Korvai Technique",
    description:
      "A quintessential South Indian color harmony of oceanic teal and auspicious coral red, woven using the demanding Korvai interlocking method.",
    detailedStory:
      "The distinct hallmark of a genuine Korvai saree is the seamless joining of border and body with no visible seam lines on the front face.",
    priceDisplay: "Enquire for Price",
    priceNote: "Direct Factory Wholesale Available",
    availability: "In Stock",
    featured: false,
    isNewArrival: false,
    dimensions: {
      sareeLength: "5.5 Metres",
      blousePiece: "0.8 Metres Coral Red Included",
      weightApprox: "750 grams",
    },
    images: [
      {
        src: "https://images.unsplash.com/photo-1610030469668-93530c17b58f?q=80&w=1200&auto=format&fit=crop",
        alt: "Peacock Teal Korvai Silk Saree",
        tag: "Full Saree",
      },
      {
        src: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?q=80&w=1200&auto=format&fit=crop",
        alt: "Border & Annapakshi Motifs",
        tag: "Border Detail",
      },
    ],
    careInstructions: [
      "Dry clean only.",
      "Avoid exposure to humidity or moisture.",
    ],
  },
  {
    id: "pvs-007",
    code: "PVS-007",
    name: "Divya Maroon & Olive Vintage Border Silk",
    category: "Pure Silk Sarees",
    fabric: "Pure Silk (Heavy Gsm)",
    color: "Deep Maroon Wine with Muted Olive Green",
    border: "Vintage Temple Spire & Rudraksh Row Border",
    pallu: "Heavy Zari Coin Butta Pallu",
    weaveType: "Dobby & Jacquard Combination",
    description:
      "A distinguished vintage color palette featuring deep maroon wine with olive green selvedge and gleaming coin buttas throughout.",
    detailedStory:
      "A tribute to century-old weaving patterns, reviving traditional temple border geometry with modernized high-tension weaving precision.",
    priceDisplay: "Enquire for Price",
    priceNote: "Popular for festive ceremonies and anniversaries",
    availability: "In Stock",
    featured: false,
    isNewArrival: false,
    dimensions: {
      sareeLength: "5.5 Metres",
      blousePiece: "0.8 Metres Contrast Olive Silk",
      weightApprox: "710 grams",
    },
    images: [
      {
        src: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1200&auto=format&fit=crop",
        alt: "Maroon & Olive Silk Saree Drape",
        tag: "Full Saree",
      },
      {
        src: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=1200&auto=format&fit=crop",
        alt: "Pallu Weave Detail",
        tag: "Pallu Weave",
      },
    ],
    careInstructions: ["Dry clean only.", "Store in cool dry conditions."],
  },
  {
    id: "pvs-008",
    code: "PVS-008",
    name: "Ananya Lavender Mist Floral Soft Silk",
    category: "Soft Silk",
    fabric: "Premium Micro-Mulberry Soft Silk",
    color: "Lavender Mist with Matte Silver Zari",
    border: "Subtle 2-inch Silver Zari Border with Floral Vines",
    pallu: "Understated Stripe Pallu with Hand-knotted Tassels",
    weaveType: "Ultra-Fine Lightweight Weave",
    description:
      "A serene and refreshing lavender silk saree featuring matte silver zari accents designed for morning celebrations and corporate festivities.",
    detailedStory:
      "Engineered with ultra-fine silk denier to provide maximum drape flow while retaining the crisp richness expected of pure silk.",
    priceDisplay: "Enquire for Price",
    priceNote: "Boutique bestseller",
    availability: "In Stock",
    featured: false,
    isNewArrival: true,
    dimensions: {
      sareeLength: "5.5 Metres",
      blousePiece: "0.8 Metres Lavender Silk",
      weightApprox: "460 grams",
    },
    images: [
      {
        src: "https://images.unsplash.com/photo-1610030469854-41125208f237?q=80&w=1200&auto=format&fit=crop",
        alt: "Lavender Soft Silk Saree",
        tag: "Full Saree",
      },
      {
        src: "https://images.unsplash.com/photo-1590736969955-71cc94801759?q=80&w=1200&auto=format&fit=crop",
        alt: "Fabric Fold and Sheen",
        tag: "Fabric Texture",
      },
    ],
    careInstructions: ["Dry clean only.", "Steam iron on silk mode."],
  },
];

export function getProductByCode(code: string): Product | undefined {
  return products.find((p) => p.code.toLowerCase() === code.toLowerCase() || p.id.toLowerCase() === code.toLowerCase());
}

export function getFeaturedProducts(): Product[] {
  return products.filter((p) => p.featured);
}

export function getNewArrivals(): Product[] {
  return products.filter((p) => p.isNewArrival);
}

export interface ProductItem {
  id: string;
  code: string;
  name: string;
  category: "Bridal" | "Wedding" | "Traditional" | "Designer" | "Silk" | "New Arrivals";
  categorySlug: string;
  collection: string;
  fabric: string;
  color: string;
  border: string;
  pallu: string;
  weaveType: string;
  price: number;
  priceDisplay: string;
  wholesaleNote?: string;
  availability: "In Stock" | "Made to Order" | "Bulk Available" | "Limited Weave";
  description: string;
  length: string;
  blousePiece: string;
  weightApprox: string;
  careInstructions: string[];
  images: {
    src: string;
    alt: string;
    tag?: string;
  }[];
  isSample: boolean; // Flag marking sample/demo catalogue entry as per policy
  featured?: boolean;
}

export const sampleProducts: ProductItem[] = [
  {
    id: "pvs-001",
    code: "PVS-001",
    name: "Aadrika Crimson Bridal Pattu Saree",
    category: "Bridal",
    categorySlug: "bridal",
    collection: "Bridal Collection",
    fabric: "Pure Mulberry Silk (3-Ply)",
    color: "Deep Crimson Red & Antique Gold",
    border: "Broad Korvai Temple Border with Mayil (Peacock) & Rudraksham Motifs",
    pallu: "Rich Floral Brocade Pallu with Heavy Zari Work",
    weaveType: "Traditional Handloom Korvai Jacquard Weave",
    price: 18500,
    priceDisplay: "₹18,500",
    wholesaleNote: "Wholesale & bulk pricing available for retailers and boutiques",
    availability: "In Stock",
    description:
      "A quintessential bridal creation crafted with deep crimson mulberry silk and heavy antique gold zari. Features authentic Korvai temple spires and delicate floral brocade.",
    length: "5.5 Metres",
    blousePiece: "0.8 Metres Contrast Brocade Included",
    weightApprox: "780 grams",
    careInstructions: [
      "Dry clean only to maintain silk luster and zari integrity.",
      "Store wrapped in pure cotton or muslin fabric away from moisture.",
      "Avoid direct perfume or chemical spray on zari surfaces.",
      "Iron on low-medium silk setting on reverse side.",
    ],
    images: [
      {
        src: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1200&auto=format&fit=crop",
        alt: "Aadrika Crimson Bridal Pattu Saree - Full View",
        tag: "Full Saree",
      },
      {
        src: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?q=80&w=1200&auto=format&fit=crop",
        alt: "Aadrika Crimson Saree - Border Detail",
        tag: "Border Detail",
      },
      {
        src: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=1200&auto=format&fit=crop",
        alt: "Aadrika Crimson Saree - Pallu Detail",
        tag: "Pallu Weave",
      },
      {
        src: "https://images.unsplash.com/photo-1610030469668-93530c17b58f?q=80&w=1200&auto=format&fit=crop",
        alt: "Aadrika Crimson Saree - Texture",
        tag: "Fabric Texture",
      },
    ],
    isSample: true,
    featured: true,
  },
  {
    id: "pvs-002",
    code: "PVS-002",
    name: "Mayuri Emerald & Mustard Wedding Pattu",
    category: "Wedding",
    categorySlug: "wedding",
    collection: "Wedding Collection",
    fabric: "Pure Silk (Double Warp)",
    color: "Emerald Green with Warm Mustard Gold",
    border: "Dual Ganga-Jamuna Contrast Border with Paisley Motifs",
    pallu: "Geometric Diamond & Elephant Motif Zari Pallu",
    weaveType: "Precision Loom Jacquard Weave",
    price: 15200,
    priceDisplay: "₹15,200",
    wholesaleNote: "Special rate tiers for wedding orders and boutique stockists",
    availability: "In Stock",
    description:
      "A classic heritage pairing of rich emerald green and warm mustard, finished with dual Ganga-Jamuna border accents and finely detailed elephant crests.",
    length: "5.5 Metres",
    blousePiece: "0.8 Metres Plain Mustard with Border",
    weightApprox: "720 grams",
    careInstructions: [
      "Dry clean only.",
      "Change fold lines every 3-4 months to prevent crease stress.",
      "Store in a cool, dry place.",
    ],
    images: [
      {
        src: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?q=80&w=1200&auto=format&fit=crop",
        alt: "Mayuri Emerald & Mustard Wedding Pattu Saree",
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
    isSample: true,
    featured: true,
  },
  {
    id: "pvs-003",
    code: "PVS-003",
    name: "Ratna Deep Royal Blue Traditional Silk",
    category: "Traditional",
    categorySlug: "traditional",
    collection: "Traditional Collection",
    fabric: "100% Pure Mulberry Silk",
    color: "Royal Midnight Blue & Copper Gold",
    border: "Temple Spire (Gopuram) Interlocked Border",
    pallu: "Traditional Peacock (Mayil) & Chakra Motif Pallu",
    weaveType: "Traditional Korvai Interlocking Weave",
    price: 16800,
    priceDisplay: "₹16,800",
    wholesaleNote: "Bulk wholesale pricing available upon enquiry",
    availability: "In Stock",
    description:
      "Deep royal blue body framed with copper gold zari in authentic temple spire geometry. A timeless drape representing South Indian temple craftsmanship.",
    length: "5.5 Metres",
    blousePiece: "0.8 Metres Contrast Copper Brocade",
    weightApprox: "750 grams",
    careInstructions: [
      "Strictly dry clean only.",
      "Wrap in breathable muslin or cotton cloth.",
      "Do not hang on metal hangers.",
    ],
    images: [
      {
        src: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=1200&auto=format&fit=crop",
        alt: "Ratna Royal Blue Traditional Silk",
        tag: "Full Saree",
      },
      {
        src: "https://images.unsplash.com/photo-1610030469668-93530c17b58f?q=80&w=1200&auto=format&fit=crop",
        alt: "Gopuram Border Detail",
        tag: "Border Detail",
      },
    ],
    isSample: true,
    featured: true,
  },
  {
    id: "pvs-004",
    code: "PVS-004",
    name: "Swarna Honey Gold Designer Pattu",
    category: "Designer",
    categorySlug: "designer",
    collection: "Designer Collection",
    fabric: "Pure Silk with Metallic Zari Weft",
    color: "Honey Gold with Magenta Accent",
    border: "Delicate Floral Vine with Contrast Magenta Piping",
    pallu: "Contemporary Chevron & Floral Jaal Brocade",
    weaveType: "Jacquard Handloom Weave",
    price: 13900,
    priceDisplay: "₹13,900",
    wholesaleNote: "Retailers and boutique bulk packs available",
    availability: "In Stock",
    description:
      "A luminous honey gold body with a modern magenta selvedge. Designed for festive gatherings, cocktail drapes, and boutique collections.",
    length: "5.5 Metres",
    blousePiece: "0.8 Metres Magenta Silk Included",
    weightApprox: "640 grams",
    careInstructions: [
      "Dry clean recommended.",
      "Store flat in protective cotton bag.",
    ],
    images: [
      {
        src: "https://images.unsplash.com/photo-1610030469668-93530c17b58f?q=80&w=1200&auto=format&fit=crop",
        alt: "Swarna Honey Gold Designer Pattu Saree",
        tag: "Full Saree",
      },
      {
        src: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1200&auto=format&fit=crop",
        alt: "Zari and Vine Border",
        tag: "Border Detail",
      },
    ],
    isSample: true,
    featured: true,
  },
  {
    id: "pvs-005",
    code: "PVS-005",
    name: "Kalyani Rani Pink Pure Silk Saree",
    category: "Silk",
    categorySlug: "silk",
    collection: "Silk Collection",
    fabric: "High-Twist Mulberry Silk",
    color: "Rani Pink with Muted Antique Gold",
    border: "Medium Temple Border with Diamond Buttas",
    pallu: "Traditional Zari Stripes & Mango Motifs",
    weaveType: "Precision Loom Silk Weave",
    price: 12400,
    priceDisplay: "₹12,400",
    wholesaleNote: "Direct loom wholesale quotes available",
    availability: "In Stock",
    description:
      "Vibrant Rani pink silk with soft drape qualities and authentic luster. Perfect for poojas, traditional functions, and day celebrations.",
    length: "5.5 Metres",
    blousePiece: "0.8 Metres Running Rani Pink with Border",
    weightApprox: "620 grams",
    careInstructions: [
      "Dry clean only.",
      "Store wrapped in breathable cloth.",
    ],
    images: [
      {
        src: "https://images.unsplash.com/photo-1610030469854-41125208f237?q=80&w=1200&auto=format&fit=crop",
        alt: "Kalyani Rani Pink Pure Silk Saree",
        tag: "Full Saree",
      },
      {
        src: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?q=80&w=1200&auto=format&fit=crop",
        alt: "Rani Pink Texture & Zari",
        tag: "Fabric Texture",
      },
    ],
    isSample: true,
    featured: true,
  },
  {
    id: "pvs-006",
    code: "PVS-006",
    name: "Varnam Plum & Copper New Arrival Pattu",
    category: "New Arrivals",
    categorySlug: "new-arrivals",
    collection: "New Arrivals",
    fabric: "Pure Mulberry Silk",
    color: "Deep Plum Purple & Copper Zari",
    border: "Contemporary Slender Border with Micro Buttas",
    pallu: "Linear Geometric Zari Brocade",
    weaveType: "Fresh Electronic Jacquard Weave",
    price: 14800,
    priceDisplay: "₹14,800",
    wholesaleNote: "Fresh release from our Kalipatti looms",
    availability: "In Stock",
    description:
      "A freshly unwoven colorway combining deep plum with warm copper zari threads. Modernized motifs over an uncompromising pure silk foundation.",
    length: "5.5 Metres",
    blousePiece: "0.8 Metres Contrast Copper Brocade",
    weightApprox: "680 grams",
    careInstructions: [
      "Dry clean only.",
      "Iron strictly on low reverse setting.",
    ],
    images: [
      {
        src: "https://images.unsplash.com/photo-1590736969955-71cc94801759?q=80&w=1200&auto=format&fit=crop",
        alt: "Varnam Plum & Copper New Arrival",
        tag: "Full Saree",
      },
      {
        src: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1200&auto=format&fit=crop",
        alt: "Plum Saree Close-up",
        tag: "Border Detail",
      },
    ],
    isSample: true,
    featured: true,
  },
  {
    id: "pvs-007",
    code: "PVS-007",
    name: "Tarika Mustard & Maroon Traditional Pattu",
    category: "Traditional",
    categorySlug: "traditional",
    collection: "Traditional Collection",
    fabric: "Pure Silk (Double Warp)",
    color: "Warm Mustard Gold & Maroon",
    border: "Intricate Rudraksham & Annapakshi Temple Border",
    pallu: "Heavy Brocade Traditional Motif Pallu",
    weaveType: "Korvai Three-Shuttle Weave",
    price: 17200,
    priceDisplay: "₹17,200",
    wholesaleNote: "Wholesale MOQ 5 pieces per colorway",
    availability: "Bulk Available",
    description:
      "The warmth of mustard yellow paired with deep maroon. Handcrafted with traditional Korvai border interlocking for sacred occasions.",
    length: "5.5 Metres",
    blousePiece: "0.8 Metres Plain Maroon with Zari Border",
    weightApprox: "760 grams",
    careInstructions: [
      "Dry clean only.",
      "Store in moisture-free fabric pouches.",
    ],
    images: [
      {
        src: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?q=80&w=1200&auto=format&fit=crop",
        alt: "Tarika Mustard & Maroon Traditional Pattu",
        tag: "Full Saree",
      },
      {
        src: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=1200&auto=format&fit=crop",
        alt: "Temple Border & Zari",
        tag: "Border Detail",
      },
    ],
    isSample: true,
    featured: false,
  },
  {
    id: "pvs-008",
    code: "PVS-008",
    name: "Manasa Pastel Lavender Designer Silk",
    category: "Designer",
    categorySlug: "designer",
    collection: "Designer Collection",
    fabric: "Lightweight Pure Mulberry Silk",
    color: "Pastel Lavender with Silver Zari",
    border: "Fine Silver Zari Threadwork with Pearl Buttas",
    pallu: "Minimalist Silver Leaf Motifs",
    weaveType: "Modern Jacquard Loom Weave",
    price: 13500,
    priceDisplay: "₹13,500",
    wholesaleNote: "High demand with boutique buyers",
    availability: "In Stock",
    description:
      "A serene pastel lavender creation illuminated by subtle silver zari threadwork. Offers a graceful, airy drape with subtle festive sparkle.",
    length: "5.5 Metres",
    blousePiece: "0.8 Metres Lavender with Silver Border",
    weightApprox: "580 grams",
    careInstructions: [
      "Dry clean only.",
      "Keep away from direct heat and damp environments.",
    ],
    images: [
      {
        src: "https://images.unsplash.com/photo-1610030469668-93530c17b58f?q=80&w=1200&auto=format&fit=crop",
        alt: "Manasa Pastel Lavender Designer Silk",
        tag: "Full Saree",
      },
      {
        src: "https://images.unsplash.com/photo-1610030469854-41125208f237?q=80&w=1200&auto=format&fit=crop",
        alt: "Silver Zari Leaf Details",
        tag: "Pallu Weave",
      },
    ],
    isSample: true,
    featured: false,
  },
];

export const products = sampleProducts;

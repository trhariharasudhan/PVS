export interface CollectionCategory {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  image: string;
  badge?: string;
}

export const collectionsData: CollectionCategory[] = [
  {
    id: "bridal",
    name: "Bridal Collection",
    slug: "bridal",
    tagline: "Regal Drapes for the Auspicious Day",
    description: "Opulent pattu sarees crafted with heavy gold zari borders, intricate temple motifs, and grand brocade pallus designed for bridal splendor.",
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=900&auto=format&fit=crop",
    badge: "Wholesale & Retail",
  },
  {
    id: "wedding",
    name: "Wedding Collection",
    slug: "wedding",
    tagline: "Celebratory Splendor for Festive Traditions",
    description: "Timeless wedding silk sarees in rich celebratory hues, featuring auspicious motifs, contrast borders, and radiant pure zari sheen.",
    image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=900&auto=format&fit=crop",
    badge: "Bespoke Runs Available",
  },
  {
    id: "traditional",
    name: "Traditional Collection",
    slug: "traditional",
    tagline: "Heritage Weaves from Tamil Nadu Looms",
    description: "Classic Korvai weaves with Mayil (Peacock), Rudraksham, and temple spires honoring generations of Tamil handloom artistry.",
    image: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?q=80&w=900&auto=format&fit=crop",
    badge: "Handloom Heritage",
  },
  {
    id: "designer",
    name: "Designer Collection",
    slug: "designer",
    tagline: "Contemporary Nuances in Pure Pattu",
    description: "Modern color palettes with refined border designs, subtle metallic thread work, and versatile elegance for boutique buyers and connoisseurs.",
    image: "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?q=80&w=900&auto=format&fit=crop",
    badge: "Boutique Favorite",
  },
  {
    id: "silk",
    name: "Silk Collection",
    slug: "silk",
    tagline: "Pure Luster & Natural Mulberry Silk",
    description: "Authentic pure silk sarees showcasing the natural biological drape, smooth texture, and fluid pleating that define genuine pattu.",
    image: "https://images.unsplash.com/photo-1614036417651-efe5912149d8?q=80&w=900&auto=format&fit=crop",
    badge: "Pure Silk",
  },
  {
    id: "new-arrivals",
    name: "New Arrivals",
    slug: "new-arrivals",
    tagline: "Fresh Off the Manufacturing Looms",
    description: "The latest creations straight from our weaving unit in Kalipatti, featuring fresh pattern releases and new color combinations.",
    image: "https://images.unsplash.com/photo-1590736969955-71cc94801759?q=80&w=900&auto=format&fit=crop",
    badge: "New Release",
  },
];

export const shopCategories = [
  { label: "All Sarees", slug: "all" },
  { label: "Bridal", slug: "bridal" },
  { label: "Wedding", slug: "wedding" },
  { label: "Traditional", slug: "traditional" },
  { label: "Designer", slug: "designer" },
  { label: "Silk", slug: "silk" },
  { label: "New Arrivals", slug: "new-arrivals" },
];

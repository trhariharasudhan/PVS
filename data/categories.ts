import { ProductCategory } from "@/types";

export interface CategoryInfo {
  name: ProductCategory;
  slug: string;
  tagline: string;
  description: string;
  image: string;
}

export const categories: CategoryInfo[] = [
  {
    name: "All Sarees",
    slug: "all",
    tagline: "The Complete Weaver's Archive",
    description: "Explore our entire range of meticulously manufactured pure silk, bridal, and contemporary weaves.",
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=900&auto=format&fit=crop",
  },
  {
    name: "Pure Silk Sarees",
    slug: "pure-silk",
    tagline: "Authentic Silk Mark Quality",
    description: "Woven using high-twist pure mulberry silk warp and weft for unmatched luster and durability.",
    image: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?q=80&w=900&auto=format&fit=crop",
  },
  {
    name: "Bridal & Wedding",
    slug: "bridal",
    tagline: "Timeless Grandeur for Auspicious Moments",
    description: "Heavy brocade body, intricate temple borders, and rich zari pallu crafted for quintessential bridal elegance.",
    image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=900&auto=format&fit=crop",
  },
  {
    name: "Traditional Weaves",
    slug: "traditional",
    tagline: "Heritage Motifs & Korvai Borders",
    description: "Classic South Indian motifs including Mayil (Peacock), Rudraksham, Yali, and Ganga-Jamuna dual borders.",
    image: "https://images.unsplash.com/photo-1610030469668-93530c17b58f?q=80&w=900&auto=format&fit=crop",
  },
  {
    name: "Soft Silk",
    slug: "soft-silk",
    tagline: "Lightweight Elegance & Effortless Drape",
    description: "Feather-light silk weave offering modern color palettes, delicate zari accents, and supreme comfort.",
    image: "https://images.unsplash.com/photo-1610030469854-41125208f237?q=80&w=900&auto=format&fit=crop",
  },
  {
    name: "New Arrivals",
    slug: "new-arrivals",
    tagline: "Fresh Off The Looms",
    description: "Our newest creations straight from the master weavers' looms featuring innovative color harmonies.",
    image: "https://images.unsplash.com/photo-1590736969955-71cc94801759?q=80&w=900&auto=format&fit=crop",
  },
];

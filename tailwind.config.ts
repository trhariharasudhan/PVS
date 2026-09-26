import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // 1. PRIMARY SILK RED & MAROON
        "silk-red": {
          950: "#36080F",
          900: "#541019", // Deep Maroon
          800: "#68131F",
          700: "#7A1625", // Primary Silk Red
          600: "#8F1D2E",
          500: "#A7273A",
          400: "#C23B50",
          300: "#DA6174",
          200: "#EBA1AD",
          100: "#F6D3D9",
          50: "#FDF2F4",
        },
        "deep-maroon": {
          950: "#26050A",
          900: "#3E0A11",
          800: "#541019", // Deep Maroon
          700: "#68131F",
          600: "#7A1625",
          500: "#8F1D2E",
        },
        burgundy: {
          950: "#36080F",
          900: "#541019",
          800: "#68131F",
          700: "#7A1625",
          600: "#8F1D2E",
          500: "#A7273A",
        },

        // 2. ANTIQUE ZARI GOLD
        "zari-gold": {
          900: "#5E4314",
          800: "#75551A",
          700: "#8E6923",
          600: "#A1792E",
          500: "#B08A3C", // Primary Antique Zari Gold
          400: "#C29D4F",
          300: "#D4B56A", // Soft Gold Highlight
          200: "#E3CD94",
          100: "#F1E5C4",
          50: "#FAF6EB",
        },
        gold: {
          900: "#5E4314",
          800: "#75551A",
          700: "#8E6923",
          600: "#A1792E",
          500: "#B08A3C", // Primary Antique Zari Gold
          400: "#C29D4F",
          300: "#D4B56A", // Soft Gold
          200: "#E3CD94",
          100: "#F1E5C4",
          50: "#FAF6EB",
        },

        // 3. HERITAGE BROWN & COFFEE BROWN
        "heritage-brown": {
          950: "#1A0E0B",
          900: "#2B1812", // Primary Dark Heritage Brown
          800: "#3A2118", // Dark Coffee Brown
          700: "#4B2C21",
          600: "#5E382B",
          500: "#734737",
          400: "#91604F",
          300: "#B28474",
          200: "#D4B1A5",
          100: "#EDDCD5",
          50: "#F9F4F2",
        },
        "coffee-brown": {
          950: "#1A0E0B",
          900: "#2B1812",
          800: "#3A2118", // Dark Coffee Brown
          700: "#4B2C21",
          600: "#5E382B",
        },
        brown: {
          950: "#1A0E0B",
          900: "#2B1812",
          800: "#3A2118",
          700: "#4B2C21",
          600: "#5E382B",
          500: "#734737",
          400: "#91604F",
          300: "#B28474",
          200: "#D4B1A5",
          100: "#EDDCD5",
          50: "#F9F4F2",
        },

        // 4. WARM IVORY, SILK CREAM, & LIGHT SAND
        ivory: {
          950: "#241613", // Charcoal Brown Text
          900: "#2B1812",
          800: "#3A2118",
          700: "#4B2C21",
          600: "#5E382B",
          500: "#91604F",
          400: "#C4A88E",
          300: "#E8D7BC", // Light Sand
          200: "#EFE1CE",
          100: "#F5EBDD", // Silk Cream
          50: "#FBF7EE", // Warm Ivory Background
        },
        "warm-ivory": "#FBF7EE",
        "silk-cream": "#F5EBDD",
        "light-sand": "#E8D7BC",

        // Charcoal Brown / Primary Text
        charcoal: {
          950: "#241613", // Charcoal Brown Primary Text
          900: "#2B1812",
          800: "#3A2118",
          700: "#4B2C21",
          600: "#5E382B",
          500: "#785345",
          400: "#9B7667",
          300: "#BE9F93",
          200: "#DECBC3",
          100: "#F1E7E3",
        },
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Playfair Display", "Cormorant Garamond", "Cinzel", "Georgia", "serif"],
        sans: ["var(--font-sans)", "Plus Jakarta Sans", "Inter", "DM Sans", "sans-serif"],
      },
      letterSpacing: {
        widest: ".2em",
        ultra: ".3em",
      },
      boxShadow: {
        luxury: "0 12px 32px -8px rgba(43, 24, 18, 0.08)",
        "luxury-hover": "0 20px 40px -10px rgba(122, 22, 37, 0.16)",
        "zari-glow": "0 0 16px rgba(176, 138, 60, 0.25)",
        "gold-border": "0 0 0 1px rgba(176, 138, 60, 0.4)",
      },
    },
  },
  plugins: [],
};
export default config;

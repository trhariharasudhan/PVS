# PVS — Pattu Saree Manufacturer | Wholesale & Retail

**PVS** is a premier Tamil Nadu-based pattu saree manufacturing brand located in Panjakalipatti, Kalipatti (Salem district). Owned and operated by **Sathish Kumar**, PVS directly weaves and supplies authentic pattu sarees across Tamil Nadu and India for:
1. **Wholesale buyers & merchants**
2. **Retailers, boutiques & resellers**
3. **Individual retail customers**

---

## 🏛️ Brand Identity & Philosophy

**PVS** operates under two approved brand interpretations:

- **Option 1: PVS — Pattu • Vasthiram • Saree**  
  Celebrating the sacred purity of authentic silk (*Pattu*), the timeless grace of traditional attire (*Vasthiram*), and the quintessential Indian drape (*Saree*).
- **Option 2: PVS — Parampariyam • Vannam • Silk**  
  Honouring ancestral heritage (*Parampariyam*), the vibrant artistry of auspicious shades (*Vannam*), and the supreme luster of natural silk (*Silk*).

### Verified Business Information
- **Brand Name**: PVS
- **Proprietor**: Sathish Kumar
- **Phone / WhatsApp**: `+91 99651 76136`
- **Location**: Raaja Veedhi, Panjakalipatti, Kalipatti, Tamil Nadu 636455, India
- **Core Value Proposition**: *"Wholesale & Retail Available"* directly from manufacturing looms.

---

## 📁 Project Architecture

```
PVS/
├── app/                        # Next.js 14 App Router
│   ├── about/                  # Story of Sathish Kumar, PVS heritage & philosophy
│   ├── admin/                  # Comprehensive ERP & Operations Admin Console
│   ├── cart/                   # Dedicated Shopping Cart review & quantity manager
│   ├── checkout/               # Production-ready checkout (WhatsApp, Bank Remittance, COD)
│   ├── collections/            # 6 Signature Collections Overview & Filterable Catalog
│   │   └── [id]/               # Dynamic Product Detail Showcase
│   ├── contact/                # Direct contact cards, Google Maps, and Tabbed Enquiry forms
│   ├── gallery/                # Masonry manufacturing, loom & product gallery with lightbox
│   ├── manufacturing/          # 7-Stage Loom Manufacturing process
│   ├── our-craft/              # From Thread to Tradition & interactive loom simulator
│   ├── portal/dealer/          # B2B Dealer Self-Service Trade Desk
│   ├── shop/                   # Full filterable/sortable e-commerce catalogue
│   │   └── [id]/               # Product detail view with Add to Cart / WhatsApp Enquiry
│   ├── sitemap.ts              # Dynamic XML sitemap generator
│   └── wholesale/              # Dedicated Wholesale trade desk with business qualification form
├── backend/                    # Python FastAPI Backend Architecture
│   ├── alembic/                # Database Migrations (0001 -> 0006)
│   └── app/                    # FastAPI Routers, Services, Repositories, Security & Tests
├── components/                 # Reusable UI Primitives & Design System
│   ├── cart/                   # CartDrawer slide-over component
│   ├── home/                   # Ordered 9-section cinematic homepage flow
│   ├── layout/                 # Navbar with live cart badge, Footer, Floating WhatsApp
│   ├── products/               # ProductCard with Quick View modal & Add to Cart
│   ├── ui/                     # Badge, GoldDivider, SectionHeading, WhatsAppButton
│   └── wholesale/              # Comprehensive Wholesale trade form with WhatsApp link
├── config/                     # Central siteConfig & WhatsApp message generator
├── context/                    # CartContext with persistent localStorage state
├── data/                       # Categories & Sample Products (flagged isSample: true)
├── lib/                        # WhatsApp link generators & client API helpers
└── public/                     # Static media & textile textures
```

---

## 🛍️ Key Features & Customer Journeys

### 1. Ordered Homepage Flow
1. **Hero Section**: *"Tradition Woven Into Every Saree"* + *"Wholesale & Retail Available"* badge + 3 primary CTAs.
2. **Brand Introduction**: *"PVS — Where Tradition Meets Craft"* + 4 manufacturing pillars.
3. **Grandeur Collections**: 6 signature collections (*Bridal*, *Wedding*, *Traditional*, *Designer*, *Silk*, *New Arrivals*).
4. **Featured Sarees**: Dynamic category tabs with interactive Product Cards.
5. **Wholesale Teaser**: Direct manufacturer supply highlights + dedicated Wholesale CTAs.
6. **Manufacturing Process Preview**: 8-step thread-to-saree journey.
7. **About Preview**: Factual narrative of Sathish Kumar and Panjakalipatti weaving roots.
8. **Location & Unit Visit**: Panjakalipatti address, Google Maps direct navigation, Call & WhatsApp actions.
9. **Final CTA**: Complete shop & wholesale call to action.

### 2. Wholesale Catalogue & Inquiry
- Dedicated `/wholesale` route outlining low minimums, bulk packaging, direct loom pricing, and dispatch tracking.
- Interactive qualification form specifying business type (Retailer, Boutique, Wholesaler, Reseller, Online Store) with direct WhatsApp dispatch.

### 3. Integrated Shopping Cart & Checkout
- **Cart Context**: React Context persistent in `localStorage`.
- **Slide-out Cart Drawer**: Instant item adjustments, subtotal calculation, WhatsApp checkout assist.
- **Dedicated Checkout**: Real-time address validation, order review, and 3 payment/order workflows:
  - Instant WhatsApp Order Confirmation
  - Direct SBI Bank Remittance with account details
  - Pay on Delivery (Advance token)

---

## 🚀 Running Locally

### 1. Frontend (Next.js 14 App Router)

```bash
# Install dependencies
npm install

# Typecheck and lint
npx tsc --noEmit

# Run local development server
npm run dev

# Build for production
npm run build
```
Frontend runs at `http://localhost:3000`.

### 2. Backend (FastAPI + PostgreSQL)

```bash
cd backend

# Activate virtual environment
# Windows:
.venv\Scripts\activate
# Linux/macOS:
# source .venv/bin/activate

# Run database migrations
alembic upgrade head

# Run backend regression tests (233 unit tests)
pytest app/tests -q
```
Backend API runs at `http://localhost:8000`.

---

## 📄 License & Attribution

All rights reserved. © PVS. Handcrafted and woven in Panjakalipatti, Kalipatti, Salem, Tamil Nadu, India.


# PVS SILK S — Luxury Silk Saree House Platform

PVS Silk S is a modern, high-performance web platform and enterprise management system for an authentic South Indian Kanchipuram silk saree manufacturing house.

---

## 🏛️ Project Architecture

```
PVS/
├── app/                  # Next.js 14 App Router pages & API routes
│   ├── about/            # Brand Heritage & Story
│   ├── admin/            # ERP & Operations Admin Console
│   ├── collections/      # Saree Catalogue & Product Showcases
│   ├── contact/          # Showroom & Manufacturing Unit Contact
│   ├── manufacturing/    # 7-Stage Loom Manufacturing Guide
│   ├── portal/dealer/    # B2B Dealer Self-Service Trade Desk
│   └── wholesale/        # Wholesale & Boutique Trade Desk
├── backend/              # Python FastAPI Backend Architecture
│   ├── alembic/          # Database Migrations (0001 -> 0006)
│   └── app/              # FastAPI Routers, Services, Repositories, Security & Tests
├── components/           # Reusable UI Primitives & Design System
│   ├── home/             # Homepage Storytelling & Showcase Components
│   ├── layout/           # Navbar, Footer & Floating WhatsApp Triggers
│   ├── products/         # Product Card & Catalogue Grid Primitives
│   ├── ui/               # Badge, GoldDivider, SectionHeading, Buttons
│   └── wholesale/        # B2B Trade & Inquiry Forms
├── config/               # Business Profile & Navigation Configuration
├── data/                 # Static Fallback Catalogues & Manufacturing Specifications
├── docs/                 # Authoritative Architecture, Operations & Phase Audits
├── lib/                  # Client API Adapters & Utility Helpers
├── public/               # Static Assets & Media
└── templates/            # CSV Master Data Import Templates
```

---

## ✨ Features

- **Traditional Luxury Aesthetic**: Deep Silk Red (`#7A1625`), Antique Zari Gold (`#B08A3C`), Heritage Brown (`#2B1812`), and Warm Textile Ivory (`#FBF7EE`).
- **Interactive Saree Catalogue**: Real-time category filtering, faceted search, multi-angle zoom inspection, and WhatsApp enquiry integration.
- **B2B Dealer Self-Service Portal**: Private trade desk with server-authoritative tiered volume wholesale pricing, live inventory allocation, credit ledger, and tax invoice history.
- **Enterprise Operations & ERP**: Comprehensive admin console covering inventory, looms, production runs, raw materials, purchase orders, financial reports, and CRM.
- **Transactional Communications & Webhooks**: Provider-neutral payment webhook ingestion with HMAC-SHA256 signature verification and idempotent reconciliation.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ & npm
- Python 3.11+
- PostgreSQL (for local backend service)

### 1. Frontend Setup (Next.js)

```bash
# Install dependencies
npm install

# Run local development server
npm run dev

# Build for production
npm run build
```

Frontend runs at `http://localhost:3000`.

### 2. Backend Setup (FastAPI)

```bash
cd backend

# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Run backend regression tests
pytest app/tests -q
```

Backend API runs at `http://localhost:8000`.

---

## 🔒 Security & Environment Configuration

Configuration templates are available at:
- `.env.example`
- `.env.production.example`
- `backend/.env.example`
- `backend/.env.production.example`

Never commit live `.env` files containing secrets or credentials to version control.

---

## 📄 License

All rights reserved. © PVS Silk S. Woven with devotion in Tamil Nadu, India.

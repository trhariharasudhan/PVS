# PVS Silk S — End-to-End System Architecture
**Document Version:** 3.1.0  
**Phase:** Phase 4C-A — Inventory + Production / Loom Operations  
**Last Updated:** August 30, 2026  

---

## 1. High-Level Architecture Diagram

```
                              ┌─────────────────────────────┐
                              │       PUBLIC USERS &        │
                              │    WHOLESALE RETAILERS      │
                              └──────────────┬──────────────┘
                                             │ HTTPS
                                             ▼
                              ┌─────────────────────────────┐
                              │     NEXT.JS 14 FRONTEND     │
                              │  (App Router / Tailwind /   │
                              │   TypeScript / SEO Engine)  │
                              └──────────────┬──────────────┘
                                             │ REST API (JSON)
                                             ▼
                              ┌─────────────────────────────┐
                              │     FASTAPI BACKEND API     │
                              │  (Python 3.12 / Pydantic /  │
                              │   Async / JWT Auth / CORS)  │
                              └───────┬─────────────┬───────┘
                                      │             │
                    Async Sessions    │             │   Future Storage Engine
                   (SQLAlchemy 2.x)   │             │   (S3 / Cloudinary)
                                      ▼             ▼
                       ┌──────────────────────┐  ┌──────────────────────┐
                       │ POSTGRESQL 16 DB     │  │ CLOUD ASSET STORAGE  │
                       │ (15 Relational Core  │  │ (High-Res Saree Zari │
                       │  Entities + Alembic) │  │  Photography / Zoom) │
                       └──────────────────────┘  └──────────────────────┘
```

---

## 2. Component Specifications

### 2.1 Frontend Layer (Next.js 14 + TypeScript + Tailwind CSS)
* **Rendering Strategy:** Hybrid SSR (Server-Side Rendering) for SEO-indexed public catalogue and CSR (Client-Side Rendering) for interactive elements (Image zoom, filter toggles, wholesale trade application).
* **Styling & Tokens:** Centralized Tailwind design tokens implementing a luxury Indian textile palette (Deep Burgundy `#2D080E`, Warm Ivory `#FAF7F2`, Muted Gold `#C5A880`, Charcoal `#141313`).
* **Conversion Hub:** Unified WhatsApp routing utility (`getWhatsAppLink`) formatting prefilled lead messages for individual sarees, wholesale inquiries, and loom tour bookings.
* **Accessibility & Performance:** WCAG 2.1 AA compliant contrast, semantic landmark elements, Google Web Fonts with `swap` display, and sub-100kB first load JS bundles.

### 2.2 Backend Application Layer (Python 3.12 + FastAPI)
* **Framework:** FastAPI utilizing modern async/await patterns for high-throughput I/O.
* **Validation & Schemas:** Pydantic v2 schemas enforcing strict data validation, serialization, and automatic OpenAPI 3.1 documentation generation (`/api/v1/docs`).
* **Routing Strategy:** Domain-isolated modular routers (`/api/v1/products`, `/api/v1/categories`, `/api/v1/wholesale-enquiries`, `/api/v1/admin/*`).
* **Health & Probes:** Root `/health` probe and `/api/v1/health` deep probe checking application runtime and PostgreSQL connectivity.
* **Security & Middleware:**
  - Dynamic CORS middleware restricting origins to authorized frontend domains.
  - Secret key and environment isolation using `pydantic-settings`.
  - Rate limiting & request throttling via Redis / memory backends.

### 2.3 Database Layer (PostgreSQL 16 + SQLAlchemy 2.x + Alembic)
* **Engine:** PostgreSQL 16 with asynchronous connection pooling via `asyncpg`.
* **ORM:** SQLAlchemy 2.0 mapped declarative models with explicit type hints (`Mapped[...]`).
* **15 Core Relational Entities:**
  1. `users` (Admin, Manager, Dealer auth accounts)
  2. `categories` (Saree collection classification)
  3. `products` (Saree design models & specifications)
  4. `product_images` (Multi-angle photography assets)
  5. `inventory` (Real-time stock counts)
  6. `inventory_movements` (Immutable stock audit ledger)
  7. `customers` (Retail and wholesale buyer profiles)
  8. `orders` (Sales orders & status lifecycle)
  9. `order_items` (Order line items)
  10. `wholesale_enquiries` (Inbound trade applications)
  11. `production_batches` (Loom weaving runs)
  12. `production_stages` (7-step checkpoint sequence)
  13. `suppliers` (Silk and zari vendors)
  14. `raw_materials` (Yarn, zari, dyes)
  15. `raw_material_stock` (Raw inventory quantities)
* **Migrations:** Alembic version-controlled migration pipeline in `backend/alembic/versions/` (Initial revision: `0001_initial_schema`).
* **Data Integrity:** Explicit foreign key cascading rules (`CASCADE` for owned children, `RESTRICT`/`SET NULL` for transactional references), UUIDv4 primary keys, and immutable event logs for inventory movements.

---

## 3. Future Subsystems & Module Evolution

### 3.1 Cloud Storage Pipeline
* **Purpose:** Replace third-party mockup CDNs with an optimized asset pipeline.
* **Target:** AWS S3 / Cloudinary with WebP/AVIF automated variant generation (Thumbnail, 1080p Drape, 4K Zari Close-up).

### 3.2 Authentication & Role-Based Access Control (RBAC)
* **Purpose:** Secure internal operations across factory roles.
* **Roles:**
  - `SUPER_ADMIN`: Full access to finances, users, and system config.
  - `FACTORY_MANAGER`: Access to production batches, loom schedules, and raw materials.
  - `SALES_ADMIN`: Access to wholesale CRM leads, customer quotes, and orders.
  - `DEALER_PARTNER`: Future authenticated B2B portal for registered saree showrooms.

### 3.3 Admin Workspace (CMS & CRM)
* **Catalogue Management:** CRUD interface for adding sarees, uploading multi-angle imagery, and toggling availability.
* **Wholesale Trade Desk:** Inbound lead pipeline tracking inquiries from "New" $\rightarrow$ "Catalogue Shared" $\rightarrow$ "Negotiating" $\rightarrow$ "Order Placed".

### 3.4 Orders, Invoicing & ERP Export
* **Order Processing:** Multi-item sales order management supporting sample shipments and bulk factory bales.
* **Tax & Invoicing:** Automatic GST-compliant invoice generation (5% Silk Textile GST rate) and export formatting for Tally and Zoho Books.

### 3.5 Inventory & Multi-Loom Production Tracking
* **Finished Saree Inventory:** Real-time stock counts with reserved buffers for confirmed boutique orders.
* **7-Stage Loom Tracking:** Digital tracking of production batches as they progress through:
  `Raw Silk Hank` $\rightarrow$ `Hank Dyeing` $\rightarrow$ `Loom Weaving` $\rightarrow$ `Zari Border Jacquard` $\rightarrow$ `Finishing` $\rightarrow$ `QC Table` $\rightarrow$ `Packaging`.

### 3.6 AI & Conversational Automation
* **WhatsApp Conversational Agent:** Webhook listener integrating WhatsApp Business API with OpenAI / Anthropic to answer routine buyer questions (stock availability, fabric weight, minimum order quantity).
* **AI Visual Matcher:** Recommend complementary sarees based on color harmonics or motif similarities.

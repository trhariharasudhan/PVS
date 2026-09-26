# PVS Silk S — Admin Operations & Product Management Specification
**Document Version:** 1.0.0  
**Phase:** Phase 4B — Admin Operations Workspace + Product Management  
**Architecture:** Next.js 14 / FastAPI / PostgreSQL 16 / SQLAlchemy 2.x  
**Last Updated:** August 30, 2026  

---

## 1. Overview & Operational Scope

Phase 4B provides authorized staff members of PVS Silk S with a dedicated, secure operations portal to manage the saree catalogue, weave taxonomies, photography angles, and live business telemetry.

All modifications made in the Admin Workspace immediately synchronize with PostgreSQL 16 and are reflected across the public Next.js storefront.

---

## 2. Admin Application Shell (`/admin/*`)

The admin platform operates within a unified shell ([`app/admin/layout.tsx`](file:///d:/PVS/app/admin/layout.tsx)):
- **Session Verification:** Authoritative server-validated authentication using `GET /api/v1/auth/me`. Unauthenticated visitors are immediately redirected to `/admin/login`.
- **Navigation Structure:**
  - `Dashboard` (`/admin`): Real-time KPI telemetry and recently updated sarees.
  - `Products` (`/admin/products`): Full catalogue CMS with search, multi-faceted filtering, and active/archive states.
  - `Categories` (`/admin/categories`): Weave hierarchy management with live product counts and slug uniqueness.
  - `Inventory` / `Orders` / `Wholesale CRM` / `Loom Production` / `Settings`: Clearly demarcated as coming in **Phase 4C**.
- **Role Badging & Identity:** Displays logged-in staff member's name, email, and color-coded RBAC role badge (`SUPER_ADMIN`, `FACTORY_MANAGER`, `SALES_ADMIN`).

---

## 3. Real-Time Dashboard (`/admin`)

Powered exclusively by live database aggregates via `GET /api/v1/admin/dashboard`:
- **Active Catalogue:** Count of live, published sarees.
- **Archived Count:** Sarees withdrawn from public storefront.
- **Featured Spotlight:** Count of sarees designated for homepage spotlight.
- **Out of Stock & Made-to-Order:** Real-time manufacturing availability status breakdown.
- **Weave Categories:** Count of registered category taxonomies.
- **New Trade Inquiries:** Count of pending B2B boutique wholesale leads.
- **Recent Saree SKUs:** Table of 5 most recently created or updated products with one-click edit shortcuts.

---

## 4. Product Management CMS (`/admin/products`)

### 4.1 SKU Creation & Validation
- Enforces strict SKU uniqueness (e.g. `PVS-001`, `PVS-002`). Duplicate codes return `409 Conflict`.
- Validates category references (`404 Not Found` if category UUID does not exist).
- Supported textile fields: `fabric`, `color`, `border`, `pallu`, `motif`, `weave_type`, `description`, `detailed_story`, `saree_length_meters`, `blouse_piece_description`, `weight_approx_grams`, `care_instructions`.
- Commercial controls: `price`, `currency`, `is_price_on_enquiry`, `price_note`, `availability_status` (`IN_STOCK`, `MADE_TO_ORDER`, `LIMITED_WEAVE`, `OUT_OF_STOCK`), `is_featured`, `is_new_arrival`, `is_active`.

### 4.2 Partial Updates (PATCH)
`PATCH /api/v1/admin/products/{id}` allows selective modifications (e.g., toggling price or updating weave description) without overwriting untouched attributes.

### 4.3 Soft-Deactivation & Historical Integrity
`DELETE /api/v1/admin/products/{id}` executes a **soft-deactivation** (`is_active = false`) rather than a destructive SQL DELETE. This protects historical wholesale inquiries, orders, and manufacturing batch linkages from foreign-key cascade failures. Deactivated sarees are automatically filtered out from the public catalogue.

---

## 5. Photography & Image Angle Management

- Product photography supports multiple angles per saree (`Full Saree`, `Border Detail`, `Pallu`, `Fabric Texture`, `Drape`).
- **Primary Image:** Designates the default storefront thumbnail. Assigning a new primary automatically unsets prior primaries for that SKU.
- **Granular Image Endpoints:**
  - `POST /api/v1/admin/products/{id}/images`
  - `PATCH /api/v1/admin/products/{id}/images/{image_id}`
  - `DELETE /api/v1/admin/products/{id}/images/{image_id}`

---

## 6. Category Taxonomy Management (`/admin/categories`)

- Provides creation, inline editing, and soft-deactivation of saree categories.
- Enforces unique URL slugs (e.g. `pure-silk`, `bridal-wedding`).
- Displays live linked saree counts to prevent accidental orphaning.

---

## 7. Role-Based Access Control (RBAC) Policies

| Role | Dashboard | Product Read | Product CRUD & Images | Category CRUD |
|---|---|---|---|---|
| `SUPER_ADMIN` | Full Access | Full Access | Full Access | Full Access |
| `SALES_ADMIN` | Full Access | Full Access | Full Access | Full Access |
| `FACTORY_MANAGER` | Full Access | Full Access | Blocked (`403 Forbidden`) | Blocked (`403 Forbidden`) |
| `DEALER` | Blocked (`403`) | Blocked (`403`) | Blocked (`403`) | Blocked (`403`) |

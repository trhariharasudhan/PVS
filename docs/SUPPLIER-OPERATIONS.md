# PVS Silk S — Supplier & Mill Vendor Operations

## 1. Overview & Business Context

In the handloom silk weaving ecosystem of Tamil Nadu, authentic luxury production depends directly on a trusted network of raw silk reelers, pure zari artisans, eco-dye chemical producers, and specialized packaging suppliers.

The Supplier Management module provides PVS Silk S with a centralized, verified directory of all manufacturing supply partners with complete contact, tax, and procurement linkage.

---

## 2. Supplier Data Architecture

### 2.1 Supplier Model (`suppliers` table)

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `supplier_code` | VARCHAR(50) UNIQUE | Human-readable unique code (e.g. `SUP-SILK-001`) |
| `supplier_name` | VARCHAR(255) | Official business or cooperative name |
| `supplier_type` | ENUM | Categorization of supplied goods |
| `contact_person` | VARCHAR(255) | Primary mill representative / artisan master |
| `phone` | VARCHAR(30) | Primary phone / WhatsApp for procurement orders |
| `email` | VARCHAR(255) | Optional business email |
| `location` | VARCHAR(150) | City & State (e.g. `Kanchipuram, Tamil Nadu`) |
| `address` | TEXT | Physical mill / reeling facility address |
| `gstin` | VARCHAR(20) | Indian Goods & Services Tax Identification Number |
| `notes` | TEXT | Terms of trade, credit window, quality notes |
| `is_active` | BOOLEAN | Operational status |

### 2.2 Supplier Types

* `SILK_REELER`: Mulberry and tussar silk filatures, reeling cooperatives, and yarn twisting units.
* `ZARI_MANUFACTURER`: Traditional pure gold/silver electroplated zari wire drawing and spooling mills (e.g., Surat / Tamil Nadu).
* `DYE_CHEMICALS`: Certified non-toxic, azo-free natural and acid dye chemical houses.
* `PACKAGING`: Velvet-lined rigid luxury saree presentation boxes and protective wraps.
* `LOOM_SPARES`: Jacquard punch cards, harnesses, reeds, heddles, and wooden pit-loom spare parts.
* `GENERAL`: Ancillary weaving supplies, cotton selvage yarn, and general consumables.

---

## 3. RBAC Permissions Matrix

| Operation | Super Admin | Factory Manager | Sales Admin | Showroom / Dealer |
| :--- | :---: | :---: | :---: | :---: |
| **List & View Suppliers** | ✅ Allowed | ✅ Allowed | ✅ Allowed | ❌ Forbidden (403) |
| **Create Supplier** | ✅ Allowed | ✅ Allowed | ❌ Forbidden (403) | ❌ Forbidden (403) |
| **Update Supplier Info** | ✅ Allowed | ✅ Allowed | ❌ Forbidden (403) | ❌ Forbidden (403) |
| **Deactivate Supplier** | ✅ Allowed | ✅ Allowed | ❌ Forbidden (403) | ❌ Forbidden (403) |

---

## 4. API Endpoints Reference

* `GET /api/v1/admin/suppliers` — Paginated listing with search by code/name/phone and filtering by type and active status.
* `GET /api/v1/admin/suppliers/{id}` — Full supplier detail with materials count and purchase order count.
* `POST /api/v1/admin/suppliers` — Create a new verified supplier SKU.
* `PATCH /api/v1/admin/suppliers/{id}` — Update contact, address, GSTIN, or active status.

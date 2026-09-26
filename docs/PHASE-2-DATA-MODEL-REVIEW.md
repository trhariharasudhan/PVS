# PVS Silk S — Phase 2 Data Model Review & Schema Specification
**Document Version:** 1.0.0  
**Phase:** Phase 2 — PostgreSQL Database Foundation  
**Date:** August 30, 2026  
**ORM:** SQLAlchemy 2.x / PostgreSQL 16  

---

## 1. Executive Summary & Review Rationale

In accordance with Phase 2 requirements, the initial data model draft (`docs/PVS-DATA-MODEL-DRAFT.md`) was reviewed against the actual business domain of PVS Silk S as a traditional silk saree manufacturer in Tamil Nadu.

This review formalizes the exact relational constraints, explicit types, primary/foreign keys, indices, and deletion cascades to ensure a rock-solid, production-grade schema.

---

## 2. Refinements Made to the Draft Model

| Entity | Field / Component | Change / Refinement | Rationale |
|---|---|---|---|
| **All Entities** | Primary Key | Standardized on `UUIDv4` (`uuid.UUID`) | Guarantees distributed uniqueness, prevents enumeration attacks, and avoids exposing sequential internal database counters. |
| **Product** | `motif` | Added `motif: String(255)` (Nullable) | Crucial for South Indian sarees (e.g. Peacock/Mayil, Temple/Gopuram, Rudraksham, Annapakshi) without hardcoding into description. |
| **Product** | `currency` | Added `currency: String(3)` (Default: `"INR"`) | Standardizes currency for Indian domestic and future export pricing. |
| **InventoryMovement** | `movement_type` | Standardized Enum (`PURCHASE`, `PRODUCTION`, `SALE`, `ADJUSTMENT`, `DAMAGE`, `RETURN`) | Matches standard manufacturing inventory tracking without over-complicating warehouse domains. |
| **Order** | `order_status` | Standardized Enum (`PENDING`, `CONFIRMED`, `PROCESSING`, `READY`, `SHIPPED`, `DELIVERED`, `CANCELLED`, `RETURNED`) | Complete lifecycle representation for wholesale bulk orders and future retail checkouts. |
| **Foreign Keys** | Cascading Rules | Explicitly set `ondelete="CASCADE"` only for dependent children and `ondelete="RESTRICT"` / `SET NULL` for transactional references | Prevents accidental deletion of historical invoices, orders, inventory logs, and production batches. |
| **Timestamps** | All Tables | Explicit `DateTime(timezone=True)` with UTC defaults | Avoids ambiguous server timezone offsets across cloud environments. |

---

## 3. Entity-by-Entity Schema Specifications

### 1. `users`
* **Table Name:** `users`
* **Purpose:** System authentication and administrative role access.
* **Fields:**
  - `id`: UUID (PK, default `uuid.uuid4`)
  - `email`: `String(255)` — **NOT NULL, UNIQUE, INDEX**
  - `hashed_password`: `String(255)` — **NOT NULL**
  - `full_name`: `String(255)` — **NOT NULL**
  - `role`: Enum `UserRole` (`SUPER_ADMIN`, `FACTORY_MANAGER`, `SALES_ADMIN`, `DEALER`) — **NOT NULL**
  - `is_active`: `Boolean` — **NOT NULL, default True**
  - `last_login_at`: `DateTime(timezone=True)` — Nullable
  - `created_at`, `updated_at`: `DateTime(timezone=True)` — **NOT NULL**
* **Indexes:** `ix_users_email` (Unique)

---

### 2. `categories`
* **Table Name:** `categories`
* **Purpose:** Saree collection classification.
* **Fields:**
  - `id`: UUID (PK, default `uuid.uuid4`)
  - `name`: `String(100)` — **NOT NULL**
  - `slug`: `String(100)` — **NOT NULL, UNIQUE, INDEX**
  - `tagline`: `String(255)` — Nullable
  - `description`: `Text` — Nullable
  - `banner_image_url`: `String(512)` — Nullable
  - `display_order`: `Integer` — **NOT NULL, default 0**
  - `is_active`: `Boolean` — **NOT NULL, default True, INDEX**
  - `created_at`, `updated_at`: `DateTime(timezone=True)` — **NOT NULL**
* **Indexes:** `ix_categories_slug` (Unique), `ix_categories_is_active`

---

### 3. `products`
* **Table Name:** `products`
* **Purpose:** Saree design models, weave specifications, and pricing status.
* **Fields:**
  - `id`: UUID (PK, default `uuid.uuid4`)
  - `code`: `String(50)` — **NOT NULL, UNIQUE, INDEX** (e.g. `PVS-001`)
  - `name`: `String(255)` — **NOT NULL**
  - `category_id`: UUID — **NOT NULL, FK $\rightarrow$ `categories.id` (ondelete="RESTRICT"), INDEX**
  - `fabric`: `String(150)` — **NOT NULL** (e.g. "100% Pure Mulberry Silk")
  - `color`: `String(150)` — **NOT NULL**
  - `border`: `String(255)` — **NOT NULL**
  - `pallu`: `String(255)` — Nullable
  - `motif`: `String(255)` — Nullable (e.g. "Mayil / Peacock, Temple Gopuram")
  - `weave_type`: `String(150)` — **NOT NULL**
  - `description`: `Text` — **NOT NULL**
  - `detailed_story`: `Text` — Nullable
  - `price`: `Numeric(10, 2)` — Nullable
  - `currency`: `String(3)` — **NOT NULL, default "INR"**
  - `is_price_on_enquiry`: `Boolean` — **NOT NULL, default True**
  - `price_note`: `String(255)` — Nullable
  - `availability_status`: Enum `AvailabilityStatus` (`IN_STOCK`, `MADE_TO_ORDER`, `LIMITED_WEAVE`, `BULK_AVAILABLE`, `OUT_OF_STOCK`) — **NOT NULL, default IN_STOCK, INDEX**
  - `saree_length_meters`: `Numeric(4, 2)` — **NOT NULL, default 5.50**
  - `blouse_piece_description`: `String(255)` — Nullable
  - `weight_approx_grams`: `Integer` — Nullable
  - `care_instructions`: `JSON` / `ARRAY(String)` — Nullable
  - `is_featured`: `Boolean` — **NOT NULL, default False, INDEX**
  - `is_new_arrival`: `Boolean` — **NOT NULL, default False, INDEX**
  - `is_active`: `Boolean` — **NOT NULL, default True, INDEX**
  - `created_at`, `updated_at`: `DateTime(timezone=True)` — **NOT NULL**
* **Indexes:** `ix_products_code` (Unique), `ix_products_category_id`, `ix_products_availability_status`, `ix_products_is_featured`, `ix_products_is_new_arrival`, `ix_products_is_active`

---

### 4. `product_images`
* **Table Name:** `product_images`
* **Purpose:** Multi-angle photography and zoom assets.
* **Fields:**
  - `id`: UUID (PK, default `uuid.uuid4`)
  - `product_id`: UUID — **NOT NULL, FK $\rightarrow$ `products.id` (ondelete="CASCADE"), INDEX**
  - `image_url`: `String(512)` — **NOT NULL**
  - `alt_text`: `String(255)` — Nullable
  - `tag`: `String(50)` — Nullable (e.g. "Full Saree", "Border Detail", "Pallu", "Fabric Texture")
  - `display_order`: `Integer` — **NOT NULL, default 0**
  - `is_primary`: `Boolean` — **NOT NULL, default False**
  - `created_at`: `DateTime(timezone=True)` — **NOT NULL**
* **Indexes:** `ix_product_images_product_id`

---

### 5. `inventory`
* **Table Name:** `inventory`
* **Purpose:** Stock on hand of finished sarees.
* **Fields:**
  - `id`: UUID (PK, default `uuid.uuid4`)
  - `product_id`: UUID — **NOT NULL, UNIQUE, FK $\rightarrow$ `products.id` (ondelete="CASCADE"), INDEX**
  - `quantity_on_hand`: `Integer` — **NOT NULL, default 0**
  - `quantity_reserved`: `Integer` — **NOT NULL, default 0**
  - `reorder_threshold`: `Integer` — **NOT NULL, default 5**
  - `warehouse_location`: `String(100)` — Nullable
  - `updated_at`: `DateTime(timezone=True)` — **NOT NULL**
* **Indexes:** `ix_inventory_product_id` (Unique)

---

### 6. `inventory_movements`
* **Table Name:** `inventory_movements`
* **Purpose:** Immutable stock change ledger.
* **Fields:**
  - `id`: UUID (PK, default `uuid.uuid4`)
  - `inventory_id`: UUID — **NOT NULL, FK $\rightarrow$ `inventory.id` (ondelete="RESTRICT"), INDEX**
  - `movement_type`: Enum `MovementType` (`PURCHASE`, `PRODUCTION`, `SALE`, `ADJUSTMENT`, `DAMAGE`, `RETURN`) — **NOT NULL, INDEX**
  - `quantity_delta`: `Integer` — **NOT NULL** (positive or negative)
  - `reference_id`: `String(100)` — Nullable
  - `performed_by_user_id`: UUID — Nullable, FK $\rightarrow$ `users.id` (ondelete="SET NULL")
  - `notes`: `Text` — Nullable
  - `created_at`: `DateTime(timezone=True)` — **NOT NULL, INDEX**
* **Indexes:** `ix_inventory_movements_inventory_id`, `ix_inventory_movements_movement_type`, `ix_inventory_movements_created_at`

---

### 7. `customers`
* **Table Name:** `customers`
* **Purpose:** Buyer profile for retail consumers, boutique buyers, and wholesale merchants.
* **Fields:**
  - `id`: UUID (PK, default `uuid.uuid4`)
  - `full_name`: `String(255)` — **NOT NULL**
  - `company_name`: `String(255)` — Nullable
  - `customer_type`: Enum `CustomerType` (`RETAIL`, `BOUTIQUE`, `WHOLESALE_MERCHANT`, `EXPORTER`) — **NOT NULL, default RETAIL**
  - `phone`: `String(30)` — **NOT NULL, INDEX**
  - `whatsapp_number`: `String(30)` — Nullable
  - `email`: `String(255)` — Nullable, INDEX
  - `gstin`: `String(20)` — Nullable
  - `city`: `String(100)` — **NOT NULL**
  - `state`: `String(100)` — **NOT NULL, default "Tamil Nadu"**
  - `shipping_address`: `Text` — Nullable
  - `created_at`, `updated_at`: `DateTime(timezone=True)` — **NOT NULL**
* **Indexes:** `ix_customers_phone`, `ix_customers_email`

---

### 8. `orders`
* **Table Name:** `orders`
* **Purpose:** Sales orders for wholesale bulk or retail orders.
* **Fields:**
  - `id`: UUID (PK, default `uuid.uuid4`)
  - `order_number`: `String(50)` — **NOT NULL, UNIQUE, INDEX** (e.g. `PVS-ORD-2026-0001`)
  - `customer_id`: UUID — **NOT NULL, FK $\rightarrow$ `customers.id` (ondelete="RESTRICT"), INDEX**
  - `order_type`: Enum `OrderType` (`WHOLESALE_BULK`, `CUSTOM_LOOM_RUN`, `RETAIL_DIRECT`) — **NOT NULL**
  - `order_status`: Enum `OrderStatus` (`PENDING`, `CONFIRMED`, `PROCESSING`, `READY`, `SHIPPED`, `DELIVERED`, `CANCELLED`, `RETURNED`) — **NOT NULL, default PENDING, INDEX**
  - `payment_status`: Enum `PaymentStatus` (`PENDING`, `ADVANCE_PAID`, `FULLY_PAID`, `REFUNDED`) — **NOT NULL, default PENDING**
  - `subtotal_amount`: `Numeric(12, 2)` — **NOT NULL**
  - `tax_amount`: `Numeric(10, 2)` — **NOT NULL, default 0.00**
  - `shipping_amount`: `Numeric(10, 2)` — **NOT NULL, default 0.00**
  - `total_amount`: `Numeric(12, 2)` — **NOT NULL**
  - `tracking_number`: `String(100)` — Nullable
  - `notes`: `Text` — Nullable
  - `created_at`, `updated_at`: `DateTime(timezone=True)` — **NOT NULL**
* **Indexes:** `ix_orders_order_number` (Unique), `ix_orders_customer_id`, `ix_orders_order_status`

---

### 9. `order_items`
* **Table Name:** `order_items`
* **Purpose:** Line items within an order.
* **Fields:**
  - `id`: UUID (PK, default `uuid.uuid4`)
  - `order_id`: UUID — **NOT NULL, FK $\rightarrow$ `orders.id` (ondelete="CASCADE"), INDEX**
  - `product_id`: UUID — **NOT NULL, FK $\rightarrow$ `products.id` (ondelete="RESTRICT"), INDEX**
  - `unit_price`: `Numeric(10, 2)` — **NOT NULL**
  - `quantity`: `Integer` — **NOT NULL, default 1**
  - `custom_colorway_notes`: `String(255)` — Nullable
  - `line_total`: `Numeric(12, 2)` — **NOT NULL**
* **Indexes:** `ix_order_items_order_id`, `ix_order_items_product_id`

---

### 10. `wholesale_enquiries`
* **Table Name:** `wholesale_enquiries`
* **Purpose:** B2B wholesale trade applications from boutiques and showrooms.
* **Fields:**
  - `id`: UUID (PK, default `uuid.uuid4`)
  - `business_name`: `String(255)` — **NOT NULL**
  - `contact_person`: `String(255)` — **NOT NULL**
  - `phone`: `String(30)` — **NOT NULL, INDEX**
  - `email`: `String(255)` — Nullable
  - `city`: `String(100)` — **NOT NULL**
  - `business_type`: `String(100)` — **NOT NULL**
  - `number_of_stores`: `String(50)` — Nullable
  - `interested_collection`: `String(100)` — Nullable
  - `expected_quantity`: `String(50)` — Nullable
  - `message`: `Text` — Nullable
  - `status`: Enum `EnquiryStatus` (`NEW`, `CONTACTED`, `CATALOGUE_SENT`, `NEGOTIATING`, `CONVERTED_TO_ORDER`, `REJECTED`) — **NOT NULL, default NEW, INDEX**
  - `assigned_to_user_id`: UUID — Nullable, FK $\rightarrow$ `users.id` (ondelete="SET NULL")
  - `created_at`, `updated_at`: `DateTime(timezone=True)` — **NOT NULL**
* **Indexes:** `ix_wholesale_enquiries_phone`, `ix_wholesale_enquiries_status`

---

### 11. `production_batches`
* **Table Name:** `production_batches`
* **Purpose:** Active weaving runs across factory looms.
* **Fields:**
  - `id`: UUID (PK, default `uuid.uuid4`)
  - `batch_number`: `String(50)` — **NOT NULL, UNIQUE, INDEX** (e.g. `BATCH-2026-KORVAI-01`)
  - `product_id`: UUID — **NOT NULL, FK $\rightarrow$ `products.id` (ondelete="RESTRICT"), INDEX**
  - `loom_identifier`: `String(50)` — Nullable (e.g. `LOOM-JACQUARD-01`)
  - `planned_quantity`: `Integer` — **NOT NULL**
  - `completed_quantity`: `Integer` — **NOT NULL, default 0**
  - `status`: Enum `BatchStatus` (`PLANNED`, `WARPING`, `WEAVING_IN_PROGRESS`, `FINISHING`, `QUALITY_CHECK`, `COMPLETED`, `ABORTED`) — **NOT NULL, default PLANNED, INDEX**
  - `start_date`: `Date` — Nullable
  - `estimated_completion_date`: `Date` — Nullable
  - `created_at`, `updated_at`: `DateTime(timezone=True)` — **NOT NULL**
* **Indexes:** `ix_production_batches_batch_number` (Unique), `ix_production_batches_product_id`, `ix_production_batches_status`

---

### 12. `production_stages`
* **Table Name:** `production_stages`
* **Purpose:** Milestone checkpoints within a production batch.
* **Fields:**
  - `id`: UUID (PK, default `uuid.uuid4`)
  - `batch_id`: UUID — **NOT NULL, FK $\rightarrow$ `production_batches.id` (ondelete="CASCADE"), INDEX**
  - `stage_sequence`: `Integer` — **NOT NULL** (1 to 7)
  - `stage_name`: `String(100)` — **NOT NULL**
  - `status`: Enum `StageStatus` (`PENDING`, `IN_PROGRESS`, `PASSED_QC`, `FAILED_REWORK`) — **NOT NULL, default PENDING**
  - `inspected_by`: `String(100)` — Nullable
  - `notes`: `Text` — Nullable
  - `completed_at`: `DateTime(timezone=True)` — Nullable
* **Indexes:** `ix_production_stages_batch_id`

---

### 13. `suppliers`
* **Table Name:** `suppliers`
* **Purpose:** Raw material yarn and zari vendors.
* **Fields:**
  - `id`: UUID (PK, default `uuid.uuid4`)
  - `supplier_name`: `String(255)` — **NOT NULL**
  - `contact_person`: `String(255)` — **NOT NULL**
  - `phone`: `String(30)` — **NOT NULL**
  - `email`: `String(255)` — Nullable
  - `location`: `String(150)` — **NOT NULL**
  - `supplied_material_types`: `JSON` — Nullable
  - `is_active`: `Boolean` — **NOT NULL, default True**
  - `created_at`: `DateTime(timezone=True)` — **NOT NULL**

---

### 14. `raw_materials`
* **Table Name:** `raw_materials`
* **Purpose:** Raw yarn, zari reels, eco dyestuffs.
* **Fields:**
  - `id`: UUID (PK, default `uuid.uuid4`)
  - `material_code`: `String(50)` — **NOT NULL, UNIQUE, INDEX** (e.g. `SILK-MUL-GR-A`)
  - `name`: `String(255)` — **NOT NULL**
  - `material_type`: Enum `MaterialType` (`RAW_SILK`, `PURE_ZARI`, `METALLIC_ZARI`, `ECO_DYES`, `PACKAGING_SUPPLIES`) — **NOT NULL**
  - `unit_of_measure`: Enum `UnitOfMeasure` (`KILOGRAMS`, `METERS`, `HANK_REELS`, `UNITS`) — **NOT NULL**
  - `reorder_level`: `Numeric(10, 2)` — **NOT NULL, default 10.00**
  - `supplier_id`: UUID — Nullable, FK $\rightarrow$ `suppliers.id` (ondelete="SET NULL")
  - `created_at`, `updated_at`: `DateTime(timezone=True)` — **NOT NULL**
* **Indexes:** `ix_raw_materials_material_code` (Unique)

---

### 15. `raw_material_stock`
* **Table Name:** `raw_material_stock`
* **Purpose:** Current physical quantities of raw materials.
* **Fields:**
  - `id`: UUID (PK, default `uuid.uuid4`)
  - `raw_material_id`: UUID — **NOT NULL, UNIQUE, FK $\rightarrow$ `raw_materials.id` (ondelete="CASCADE"), INDEX**
  - `quantity_available`: `Numeric(10, 2)` — **NOT NULL, default 0.00**
  - `last_restocked_at`: `DateTime(timezone=True)` — Nullable
* **Indexes:** `ix_raw_material_stock_raw_material_id` (Unique)

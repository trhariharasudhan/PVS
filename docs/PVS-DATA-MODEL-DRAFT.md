# PVS Silk S — Relational Data Model Draft
**Document Version:** 1.0.0  
**Target ORM / Database:** SQLAlchemy 2.x / PostgreSQL  
**Phase:** Phase 1 — Data Architecture Specification  

---

## 1. Overview & Architecture Principles

This document specifies the target relational schema for the PVS Silk S textile manufacturing platform. The schema is designed around six core functional domains:

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│     CATALOG     │       │    COMMERCE     │       │   MANUFACTURING │
│   & SHOWROOM    │◄─────►│    & LEADS      │◄─────►│    & INVENTORY  │
│                 │       │                 │       │                 │
│ • Category      │       │ • WholesaleEnq  │       │ • RawMaterial   │
│ • Product       │       │ • Customer      │       │ • Supplier      │
│ • ProductImage  │       │ • Order         │       │ • Production    │
│                 │       │ • OrderItem     │       │ • Inventory     │
└─────────────────┘       └─────────────────┘       └─────────────────┘
```

### Design Standards:
1. **Primary Keys:** UUIDv4 (`UUID(as_uuid=True)`) or BigInteger sequences for high-concurrency entities.
2. **Timestamps:** Every table contains `created_at` (UTC timezone-aware) and `updated_at`.
3. **Soft Deletions:** Critical business entities (Products, Categories, Users) include `is_active` or `deleted_at`.
4. **Audit Trail:** Inventory movements and order state changes record immutable event histories.

---

## 2. Core Entity Definitions

### 1. User
* **Purpose:** System authentication and authorization for internal administrators, loom managers, and future B2B dealer logins.
* **Important Fields:**
  - `id`: UUID (Primary Key)
  - `email`: String (Unique, Indexed)
  - `hashed_password`: String
  - `full_name`: String
  - `role`: Enum (`SUPER_ADMIN`, `FACTORY_MANAGER`, `SALES_ADMIN`, `DEALER`)
  - `is_active`: Boolean (Default: True)
  - `last_login_at`: Timestamp (Optional)
  - `created_at`, `updated_at`: Timestamp
* **Relationships:**
  - One-to-Many with `ProductionBatch` (as creator/manager)
  - One-to-Many with `InventoryMovement` (as performer)
* **Required vs Optional:**
  - *Required:* `email`, `hashed_password`, `full_name`, `role`
  - *Optional:* `last_login_at`, `phone`
* **Future Expansion:** OAuth2 / Google SSO integration, fine-grained permission matrices.

---

### 2. Category
* **Purpose:** High-level classification of sarees (e.g. Pure Silk, Bridal & Wedding, Traditional Weaves, Soft Silk).
* **Important Fields:**
  - `id`: UUID (Primary Key)
  - `name`: String (e.g., "Pure Silk Sarees")
  - `slug`: String (Unique, Indexed, e.g., "pure-silk")
  - `tagline`: String (Optional, e.g., "Authentic Silk Mark Quality")
  - `description`: Text (Optional)
  - `banner_image_url`: String (Optional)
  - `display_order`: Integer (Default: 0)
  - `is_active`: Boolean (Default: True)
  - `created_at`, `updated_at`: Timestamp
* **Relationships:**
  - One-to-Many with `Product`
* **Required vs Optional:**
  - *Required:* `name`, `slug`
  - *Optional:* `tagline`, `description`, `banner_image_url`
* **Future Expansion:** Hierarchical parent-child subcategories (e.g., Silk Sarees $\rightarrow$ Kanchipuram $\rightarrow$ Korvai).

---

### 3. Product
* **Purpose:** Core saree catalog entity representing design models, weave specifications, and availability.
* **Important Fields:**
  - `id`: UUID (Primary Key)
  - `code`: String (Unique, Indexed, e.g., "PVS-001")
  - `name`: String (e.g., "Aadrika Crimson Bridal Kanchipuram Silk")
  - `category_id`: UUID (Foreign Key $\rightarrow$ `Category.id`)
  - `fabric`: String (e.g., "100% Pure Mulberry Silk")
  - `color`: String (e.g., "Deep Crimson / Antique Gold")
  - `border`: String (e.g., "Korvai Temple Border with Pure Gold Zari")
  - `pallu`: String (e.g., "Heavy Floral Brocade Pallu")
  - `weave_type`: String (e.g., "Traditional Korvai Jacquard Weave")
  - `description`: Text
  - `detailed_story`: Text (Optional)
  - `price`: Numeric(10, 2) (Optional)
  - `is_price_on_enquiry`: Boolean (Default: True)
  - `price_note`: String (Optional, e.g., "Direct Manufacturer Pricing")
  - `availability_status`: Enum (`IN_STOCK`, `MADE_TO_ORDER`, `LIMITED_WEAVE`, `BULK_AVAILABLE`, `OUT_OF_STOCK`)
  - `saree_length_meters`: Numeric(4, 2) (Default: 5.50)
  - `blouse_piece_description`: String (Optional, e.g., "0.8m Included")
  - `weight_approx_grams`: Integer (Optional, e.g., 780)
  - `care_instructions`: JSONB / Array of Strings
  - `is_featured`: Boolean (Default: False)
  - `is_new_arrival`: Boolean (Default: False)
  - `is_active`: Boolean (Default: True)
  - `created_at`, `updated_at`: Timestamp
* **Relationships:**
  - Many-to-One with `Category`
  - One-to-Many with `ProductImage`
  - One-to-One with `Inventory`
  - One-to-Many with `OrderItem`
  - One-to-Many with `ProductionBatch`
* **Required vs Optional:**
  - *Required:* `code`, `name`, `category_id`, `fabric`, `color`, `border`, `weave_type`, `description`
  - *Optional:* `price`, `detailed_story`, `weight_approx_grams`, `price_note`
* **Future Expansion:** Multi-currency support, SKU variant matrix for blouse tailoring options.

---

### 4. ProductImage
* **Purpose:** Multi-angle photography and zoom assets for each saree.
* **Important Fields:**
  - `id`: UUID (Primary Key)
  - `product_id`: UUID (Foreign Key $\rightarrow$ `Product.id`, Indexed)
  - `image_url`: String
  - `alt_text`: String (Optional)
  - `tag`: Enum (`FULL_SAREE`, `BORDER_DETAIL`, `PALLU`, `FABRIC_TEXTURE`, `FOLDING`, `PACKAGING`)
  - `display_order`: Integer (Default: 0)
  - `is_primary`: Boolean (Default: False)
  - `created_at`: Timestamp
* **Relationships:**
  - Many-to-One with `Product`
* **Required vs Optional:**
  - *Required:* `product_id`, `image_url`
  - *Optional:* `alt_text`, `tag`
* **Future Expansion:** Storage provider asset IDs (S3 keys, Cloudinary public IDs, image dimensions).

---

### 5. Inventory
* **Purpose:** Real-time stock levels of finished sarees ready for retail or wholesale dispatch.
* **Important Fields:**
  - `id`: UUID (Primary Key)
  - `product_id`: UUID (Unique Foreign Key $\rightarrow$ `Product.id`)
  - `quantity_on_hand`: Integer (Default: 0)
  - `quantity_reserved`: Integer (Default: 0)
  - `quantity_available`: Computed / Generated (`on_hand - reserved`)
  - `reorder_threshold`: Integer (Default: 5)
  - `warehouse_location`: String (Optional, e.g., "Salem-Rack-B4")
  - `updated_at`: Timestamp
* **Relationships:**
  - One-to-One with `Product`
  - One-to-Many with `InventoryMovement`
* **Required vs Optional:**
  - *Required:* `product_id`, `quantity_on_hand`, `quantity_reserved`
  - *Optional:* `warehouse_location`
* **Future Expansion:** Multi-warehouse / showroom stock partitioning.

---

### 6. InventoryMovement
* **Purpose:** Immutable audit ledger for every stock increment, decrement, reserve, or return.
* **Important Fields:**
  - `id`: BigInteger (Primary Key, Auto-increment)
  - `inventory_id`: UUID (Foreign Key $\rightarrow$ `Inventory.id`, Indexed)
  - `movement_type`: Enum (`PRODUCTION_INFLOW`, `WHOLESALE_DISPATCH`, `RETAIL_SALE`, `ADJUSTMENT`, `RETURN_INFLOW`, `DAMAGE_WRITEOFF`)
  - `quantity_delta`: Integer (Signed: positive or negative)
  - `reference_id`: String (Optional, e.g., Order ID or Batch ID)
  - `performed_by_user_id`: UUID (Optional Foreign Key $\rightarrow$ `User.id`)
  - `notes`: Text (Optional)
  - `created_at`: Timestamp
* **Relationships:**
  - Many-to-One with `Inventory`
  - Many-to-One with `User`
* **Required vs Optional:**
  - *Required:* `inventory_id`, `movement_type`, `quantity_delta`
  - *Optional:* `reference_id`, `notes`, `performed_by_user_id`

---

### 7. Customer
* **Purpose:** Buyer profile for retail consumers, boutique buyers, and wholesale merchants.
* **Important Fields:**
  - `id`: UUID (Primary Key)
  - `full_name`: String
  - `company_name`: String (Optional for retail, required for wholesale)
  - `customer_type`: Enum (`RETAIL`, `BOUTIQUE`, `WHOLESALE_MERCHANT`, `EXPORTER`)
  - `phone`: String (Indexed)
  - `whatsapp_number`: String (Optional)
  - `email`: String (Optional, Indexed)
  - `gstin`: String (Optional, for B2B tax compliance)
  - `city`: String
  - `state`: String (Default: "Tamil Nadu")
  - `shipping_address`: Text (Optional)
  - `created_at`, `updated_at`: Timestamp
* **Relationships:**
  - One-to-Many with `Order`
  - One-to-Many with `WholesaleEnquiry`
* **Required vs Optional:**
  - *Required:* `full_name`, `phone`, `customer_type`, `city`
  - *Optional:* `company_name`, `email`, `gstin`, `shipping_address`

---

### 8. Order
* **Purpose:** Sales orders placed via wholesale contracts, WhatsApp sales desk, or future online checkout.
* **Important Fields:**
  - `id`: UUID (Primary Key)
  - `order_number`: String (Unique, Indexed, e.g., "PVS-ORD-2026-0012")
  - `customer_id`: UUID (Foreign Key $\rightarrow$ `Customer.id`, Indexed)
  - `order_type`: Enum (`WHOLESALE_BULK`, `CUSTOM_LOOM_RUN`, `RETAIL_DIRECT`)
  - `order_status`: Enum (`DRAFT`, `CONFIRMED`, `IN_PRODUCTION`, `READY_FOR_DISPATCH`, `DISPATCHED`, `DELIVERED`, `CANCELLED`)
  - `payment_status`: Enum (`PENDING`, `ADVANCE_PAID`, `FULLY_PAID`, `REFUNDED`)
  - `subtotal_amount`: Numeric(12, 2)
  - `tax_amount`: Numeric(10, 2) (Default: 0.00)
  - `shipping_amount`: Numeric(10, 2) (Default: 0.00)
  - `total_amount`: Numeric(12, 2)
  - `tracking_number`: String (Optional)
  - `notes`: Text (Optional)
  - `created_at`, `updated_at`: Timestamp
* **Relationships:**
  - Many-to-One with `Customer`
  - One-to-Many with `OrderItem`
* **Required vs Optional:**
  - *Required:* `order_number`, `customer_id`, `order_type`, `order_status`, `total_amount`
  - *Optional:* `tracking_number`, `notes`

---

### 9. OrderItem
* **Purpose:** Line items contained within an Order.
* **Important Fields:**
  - `id`: UUID (Primary Key)
  - `order_id`: UUID (Foreign Key $\rightarrow$ `Order.id`, Indexed)
  - `product_id`: UUID (Foreign Key $\rightarrow$ `Product.id`)
  - `unit_price`: Numeric(10, 2)
  - `quantity`: Integer (Default: 1)
  - `custom_colorway_notes`: String (Optional)
  - `line_total`: Numeric(12, 2)
* **Relationships:**
  - Many-to-One with `Order`
  - Many-to-One with `Product`

---

### 10. WholesaleEnquiry
* **Purpose:** Inbound B2B wholesale trade applications submitted via the website or WhatsApp sales funnels.
* **Important Fields:**
  - `id`: UUID (Primary Key)
  - `business_name`: String
  - `contact_person`: String
  - `phone`: String (Indexed)
  - `email`: String (Optional)
  - `city`: String
  - `business_type`: String (e.g. "Retail Saree Showroom", "Boutique")
  - `number_of_stores`: String
  - `interested_collection`: String
  - `expected_quantity`: String
  - `message`: Text (Optional)
  - `status`: Enum (`NEW`, `CONTACTED`, `CATALOGUE_SENT`, `NEGOTIATING`, `CONVERTED_TO_ORDER`, `REJECTED`)
  - `assigned_to_user_id`: UUID (Optional Foreign Key $\rightarrow$ `User.id`)
  - `created_at`, `updated_at`: Timestamp
* **Relationships:**
  - Many-to-One with `User` (as assignee)
* **Required vs Optional:**
  - *Required:* `business_name`, `contact_person`, `phone`, `city`
  - *Optional:* `email`, `message`, `assigned_to_user_id`

---

### 11. ProductionBatch
* **Purpose:** Represents an active weaving run on one or more factory looms.
* **Important Fields:**
  - `id`: UUID (Primary Key)
  - `batch_number`: String (Unique, Indexed, e.g., "BATCH-2026-KORVAI-04")
  - `product_id`: UUID (Foreign Key $\rightarrow$ `Product.id`)
  - `loom_identifier`: String (e.g., "LOOM-JACQUARD-08")
  - `planned_quantity`: Integer
  - `completed_quantity`: Integer (Default: 0)
  - `status`: Enum (`PLANNED`, `WARPING`, `WEAVING_IN_PROGRESS`, `FINISHING`, `QUALITY_CHECK`, `COMPLETED`, `ABORTED`)
  - `start_date`: Date (Optional)
  - `estimated_completion_date`: Date (Optional)
  - `created_at`, `updated_at`: Timestamp
* **Relationships:**
  - Many-to-One with `Product`
  - One-to-Many with `ProductionStage`

---

### 12. ProductionStage
* **Purpose:** Tracks progress across the 7 manufacturing milestones for a specific production batch.
* **Important Fields:**
  - `id`: UUID (Primary Key)
  - `batch_id`: UUID (Foreign Key $\rightarrow$ `ProductionBatch.id`, Indexed)
  - `stage_sequence`: Integer (1 to 7)
  - `stage_name`: String (e.g. "Raw Material Selection", "Hank Dyeing", "Jacquard Weaving")
  - `status`: Enum (`PENDING`, `IN_PROGRESS`, `PASSED_QC`, `FAILED_REWORK`)
  - `inspected_by`: String (Optional)
  - `notes`: Text (Optional)
  - `completed_at`: Timestamp (Optional)
* **Relationships:**
  - Many-to-One with `ProductionBatch`

---

### 13. RawMaterial
* **Purpose:** Raw textile supplies used in saree manufacturing (Mulberry Silk yarn, Silver Zari, Copper Zari, Dyes).
* **Important Fields:**
  - `id`: UUID (Primary Key)
  - `material_code`: String (Unique, e.g., "SILK-MUL-GRADE-A")
  - `name`: String (e.g., "Pure Mulberry Silk Yarn (Grade A)")
  - `material_type`: Enum (`RAW_SILK`, `PURE_ZARI`, `METALLIC_ZARI`, `ECO_DYES`, `PACKAGING_SUPPLIES`)
  - `unit_of_measure`: Enum (`KILOGRAMS`, `METERS`, `HANK_REELS`, `UNITS`)
  - `reorder_level`: Numeric(10, 2)
  - `created_at`, `updated_at`: Timestamp
* **Relationships:**
  - One-to-One with `RawMaterialStock`
  - Many-to-One with `Supplier`

---

### 14. RawMaterialStock
* **Purpose:** Current physical quantity of raw materials stored at the dyehouse and loom workshop.
* **Important Fields:**
  - `id`: UUID (Primary Key)
  - `raw_material_id`: UUID (Unique Foreign Key $\rightarrow$ `RawMaterial.id`)
  - `quantity_available`: Numeric(10, 2)
  - `last_restocked_at`: Timestamp (Optional)
* **Relationships:**
  - One-to-One with `RawMaterial`

---

### 15. Supplier
* **Purpose:** Certified silk cocoon rearers, filatures, zari drawing mills, and packaging manufacturers.
* **Important Fields:**
  - `id`: UUID (Primary Key)
  - `supplier_name`: String
  - `contact_person`: String
  - `phone`: String
  - `email`: String (Optional)
  - `location`: String (e.g., "Dharmapuri / Surat / Kanchipuram")
  - `supplied_material_types`: JSONB / Array of Strings
  - `is_active`: Boolean (Default: True)
  - `created_at`: Timestamp
* **Relationships:**
  - One-to-Many with `RawMaterial`

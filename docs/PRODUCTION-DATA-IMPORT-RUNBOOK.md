# PVS Silk S — Production Master Data Import Runbook

**Scope:** Master Data Onboarding, CSV Parsing, Dependency Sequencing, and Post-Import Validation  
**Target:** Staging & Production Environments  

---

## 1. Master Data Import Sequence (Dependency Order)

Master data must be imported in strict topological sequence to satisfy foreign key relationships:

```
┌─────────────────────┐
│ 1. Categories       │ ──┐
└─────────────────────┘   │
                          ▼
┌─────────────────────┐  ┌─────────────────────┐
│ 3. Suppliers        │  │ 2. Products         │
└──────────┬──────────┘  └─────────────────────┘
           ▼
┌─────────────────────┐  ┌─────────────────────┐
│ 4. Raw Materials    │  │ 5. Customers        │
└─────────────────────┘  └─────────────────────┘
```

---

## 2. Step-by-Step 10-Stage Data Import Protocol

### Step 1: Pre-Import CSV Validation
Validate header schema, UTF-8 encoding, price formatting, and uniqueness constraints against template specifications:
- [`templates/category-import-template.csv`](file:///d:/PVS/templates/category-import-template.csv)
- [`templates/product-import-template.csv`](file:///d:/PVS/templates/product-import-template.csv)
- [`templates/supplier-import-template.csv`](file:///d:/PVS/templates/supplier-import-template.csv)
- [`templates/raw-material-import-template.csv`](file:///d:/PVS/templates/raw-material-import-template.csv)
- [`templates/customer-import-template.csv`](file:///d:/PVS/templates/customer-import-template.csv)

### Step 2: Pre-Import Snapshot Backup
Create a snapshot before importing:
```bash
docker exec -t pvs_prod_db pg_dump -U pvs_prod_user -Fc pvs_silks_production > /backups/pre_import_$(date +%Y%m%d_%H%M%S).dump
```

### Step 3: Import Categories
Populate product categories with display order and SEO slugs.

### Step 4: Import Products (Silk Sarees Master)
Import saree catalog with product codes, weave types, fabrics, colors, border details, and price. Automatically provisions initial inventory records.

### Step 5: Import Suppliers
Onboard verified silk reelers, pure zari suppliers, and natural dye vendors with valid GSTINs and contact info.

### Step 6: Import Raw Materials
Catalogue Mulberry raw silk warp/weft yarns, Silver/Gold Zari reels, and dyes with unit costs and reorder thresholds.

### Step 7: Import Customers
Import existing B2B wholesale merchants, boutique retailers, and direct retail patrons.

### Step 8: Verify Foreign Key Relationships
Run relationship integrity checks:
```sql
SELECT count(*) FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE c.id IS NULL;
-- Expected: 0 (No orphaned products)

SELECT count(*) FROM raw_materials rm LEFT JOIN suppliers s ON rm.supplier_id = s.id WHERE rm.supplier_id IS NOT NULL AND s.id IS NULL;
-- Expected: 0 (No orphaned raw materials)
```

### Step 9: Verify Inventory Ledgers
Ensure each product has an initialized inventory record with zero or positive stock on hand:
```sql
SELECT count(*) FROM products p LEFT JOIN inventory i ON p.id = i.product_id WHERE i.id IS NULL;
-- Expected: 0
```

### Step 10: Verify Storefront Presentation
Browse `https://pvssilks.com/collections` to verify category navigation, saree imagery, and pricing.

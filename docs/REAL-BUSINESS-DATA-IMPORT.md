# PVS Silk S — Real Business Data Import & Master Data Guide

## 1. Overview
This document specifies the master data ingestion process for onboarding real PVS Silk S business data into the production environment.

Import template files are located in `templates/`:
* `templates/category-import-template.csv`
* `templates/product-import-template.csv`
* `templates/supplier-import-template.csv`
* `templates/raw-material-import-template.csv`
* `templates/customer-import-template.csv`

---

## 2. Master Data Onboarding Order

To satisfy database relational integrity, master data must be populated in the following exact dependency sequence:

```text
Step 1: Categories (categories table)
     ↓
Step 2: Products (products & product_images tables)
     ↓
Step 3: Initial Finished Goods Stock (inventory table)
     ↓
Step 4: Suppliers (suppliers table)
     ↓
Step 5: Raw Materials & Initial Stocks (raw_materials & raw_material_stocks tables)
     ↓
Step 6: Verified Wholesale & Retail Customers (customers table)
```

---

## 3. Detailed Data Schemas

### 3.1 Categories
* **`name`**: Category title (e.g., `Pure Silk Sarees`, `Bridal & Wedding Silk`).
* **`slug`**: URL-friendly slug (e.g., `pure-silk`, `bridal`).
* **`tagline`**: Marketing punchline.
* **`description`**: Detailed fabric composition and artisan weaving summary.
* **`display_order`**: Integer sorting priority on storefront.
* **`is_active`**: Boolean visibility flag.

### 3.2 Products
* **`product_code`**: Unique SKU (e.g., `PVS-KAN-001`).
* **`name`**: Full saree name.
* **`category_slug`**: Foreign key mapping to Category.
* **`fabric`**: e.g., `Pure Mulberry Silk`.
* **`color`**: Dominant body and border colorway.
* **`border`**: Border motif description (e.g., `Korvai Gold Zari Border`).
* **`pallu`**: Pallu description.
* **`motif`**: Traditional motif elements (e.g., `Peacock (Mayil)`, `Rudraksham`).
* **`weave_type`**: `Traditional Handloom`, `Korvai Handloom Weave`, `Jacquard Handloom`.
* **`retail_price`**: Inclusive/exclusive retail catalog price (INR).
* **`wholesale_price`**: Bulk dealer/boutique rate (INR).
* **`gst_rate`**: Standard $5.0\%$ for HSN 5007 silk woven sarees.

### 3.3 Product Photography Angle Standards
When uploading product images:
1. `FRONT`: Full frontal drape view.
2. `PALLU`: Close-up of rich zari pallu artwork.
3. `BORDER`: Detail of the border weave and selvedge.
4. `DETAIL`: Macro view of silk yarn twist and texture.
5. `FOLD`: Traditional folded presentation.
6. `PACKAGING`: Silk Mark certified box/packaging.

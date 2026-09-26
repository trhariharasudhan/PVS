# PVS Silk S — Product Catalogue Readiness Audit

**Model File:** [`backend/app/models/product.py`](file:///d:/PVS/backend/app/models/product.py)  
**Schemas:** [`backend/app/schemas/admin/product.py`](file:///d:/PVS/backend/app/schemas/admin/product.py) & [`backend/app/schemas/product.py`](file:///d:/PVS/backend/app/schemas/product.py)  

---

## 1. Traditional Saree Attribute Audit

The `Product` database schema and API schemas have been audited for comprehensive support of traditional Kanchipuram silk saree manufacturing and retail specifications:

| Saree Attribute | Model Field | Database Column Type | Validation & Formatting | Status |
|---|---|---|---|:---:|
| **Unique SKU Code** | `code` | `VARCHAR(50) UNIQUE` | Indexed, uppercase alphanumeric | **READY** |
| **Product Title** | `name` | `VARCHAR(255)` | Non-empty string | **READY** |
| **Category Association**| `category_id` | `UUID FK` | Relational integrity with `categories.id` | **READY** |
| **Silk Fabric Specification**| `fabric` | `VARCHAR(150)` | e.g. "100% Pure Mulberry Silk" | **READY** |
| **Body Colorway** | `color` | `VARCHAR(150)` | e.g. "Crimson Red / Peacock Blue" | **READY** |
| **Zari & Korvai Border**| `border` | `VARCHAR(255)` | e.g. "Korvai Gold Zari Temple Border" | **READY** |
| **Pallu Detailing** | `pallu` | `VARCHAR(255)` | e.g. "Rich Brocade Gold Zari Pallu" | **READY** |
| **Traditional Motifs** | `motif` | `VARCHAR(255)` | e.g. "Mayil (Peacock) / Rudraksham" | **READY** |
| **Weaving Technique** | `weave_type` | `VARCHAR(150)` | e.g. "Traditional 3-Shuttle Pit Loom"| **READY** |
| **Editorial Description**| `description` | `TEXT` | Long-form story & heritage craft context | **READY** |
| **Commercial Price** | `price` | `NUMERIC(10, 2)` | Precision INR decimal ($\ge 0$) | **READY** |
| **Price on Enquiry** | `is_price_on_enquiry`| `BOOLEAN` | High-value bespoke/bridal toggle | **READY** |
| **Availability Status**| `availability_status`| `ENUM` | `IN_STOCK`, `MADE_TO_ORDER`, `OUT_OF_STOCK` | **READY** |
| **Dimensions & Blouse** | `saree_length_meters`| `NUMERIC(4, 2)` | Standard 5.50m / 6.20m with blouse | **READY** |
| **Weight** | `weight_approx_grams`| `INTEGER` | Approximate saree weight (e.g. 750g) | **READY** |
| **Care Instructions** | `care_instructions` | `JSON` | List of dry-clean & silk storage guidelines | **READY** |
| **Product Images** | `images` | `List[ProductImage]`| Primary image flag, display ordering | **READY** |

---

## 2. Catalogue Onboarding Readiness Verdict

$$\mathbf{CATALOGUE\ SCHEMA\ VERDICT: \quad 100\%\ READY\ FOR\ REAL\ INVENTORY}$$

The product domain supports every physical, artisanal, and commercial attribute of authentic Kanchipuram silk sarees without any further schema migrations required.

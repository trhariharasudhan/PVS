# PVS Silk S — Real-Data Onboarding Readiness Specification

**Module:** `backend/app/core/verify_onboarding_readiness.py`  
**Test Suite:** [`backend/app/tests/test_onboarding_readiness.py`](file:///d:/PVS/backend/app/tests/test_onboarding_readiness.py)  

---

## 1. Onboarding Gate Status Matrix

| Gate ID | Domain | Technical Onboarding Pipeline | Business Data Status | Required Human Action |
|:---:|---|:---:|:---:|---|
| `ONBOARD-01` | **Legal Identity** | **PASS** | `BLOCKED` | Provide legal entity certificate & trade registration name. |
| `ONBOARD-02` | **GST / Tax** | **PASS** | `BLOCKED` | Supply official Tamil Nadu State (33) GSTIN Certificate. |
| `ONBOARD-03` | **Premises** | **PASS** | `BLOCKED` | Provide verified Kanchipuram showroom & loom workshop address. |
| `ONBOARD-04` | **Communications**| **PASS** | `BLOCKED` | Verify billing/support domain inbox and active corporate phone line. |
| `ONBOARD-05` | **Banking** | **PASS** | `BLOCKED` | Supply official SBI Current Account & IFSC wire instructions. |
| `ONBOARD-06` | **Categories** | **PASS** | **PASS** | Template ready in `templates/category-import-template.csv`. |
| `ONBOARD-07` | **Products/SKUs** | **PASS** | `BLOCKED` | Merchandising team to populate real saree SKU inventory in CSV template. |
| `ONBOARD-08` | **Suppliers** | **PASS** | `BLOCKED` | Procurement team to provide authentic silk reeler & zari vendor list. |
| `ONBOARD-09` | **Raw Materials** | **PASS** | `BLOCKED` | Input opening balances for warp/weft silk yarns and zari spools. |
| `ONBOARD-10` | **Customers** | **PASS** | **PASS** | Customer CRM schema ready for wholesale merchant directory onboarding. |
| `ONBOARD-11` | **Media & Photos**| **PASS** | `BLOCKED` | Upload authentic high-res saree photoshoot imagery to CDN/S3 bucket. |

---

## 2. Onboarding Dry-Run CLI Tooling

```powershell
& "d:/PVS/backend/.venv/Scripts/python.exe" -m app.core.verify_onboarding_readiness --dry-run
```

```powershell
& "d:/PVS/backend/.venv/Scripts/python.exe" -m app.core.verify_onboarding_readiness --json
```

---

## 3. Sequential Import Dependency Chain

```
1. categories -> 2. suppliers -> 3. raw_materials -> 4. products -> 5. customers
```
- **Validation Engine:** `python -m app.core.validate_master_data --dry-run`
- Guaranteed foreign-key consistency and rollback on any malformed record.

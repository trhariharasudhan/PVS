# PVS Silk S — Phase 5L-01: Production Input Registry

**Phase:** 5L-01 — Production Input Registry  
**Module:** [`backend/app/core/production_input_registry.py`](file:///d:/PVS/backend/app/core/production_input_registry.py)  
**Test Suite:** [`backend/app/tests/test_production_input_registry.py`](file:///d:/PVS/backend/app/tests/test_production_input_registry.py)  
**Status:** **INPUT REGISTRY INITIALIZED (FAIL-CLOSED: TRUE) — CUTOVER BLOCKED ON EXTERNAL INPUTS**  

---

> [!IMPORTANT]
> **PHASE 5L-01 SCOPE & SAFETY NOTICE:**  
> Phase 5L-01 establishes a single, machine-readable, fail-closed registry of external business and infrastructure inputs.  
> **Phase 5L-01 does not provision cloud infrastructure, modify DNS, issue live TLS certificates, import real business data, or authorize production deployment.**

---

## 1. Objective & Scope

The Production Input Registry provides a deterministic, auditable, fail-closed mechanism to track and validate the 12 canonical external inputs required before live production cutover of the **PVS Silk S** platform.

The registry strictly distinguishes:
- **Supplied & Validated Inputs** (`VALID`)
- **Awaiting External Stakeholder Input** (`PENDING`)
- **Malformed / Format Failures** (`INVALID`)
- **Prohibited / Placeholder Inputs** (`BLOCKED`)

---

## 2. Canonical Input Identifiers & Registry Structure

### A. Business Inputs (`category: "business"`)

| Input ID | Input Name | Required Action & Verification Criteria | Default Status | Owner |
|:---:|---|---|:---:|---|
| `BUS-01` | **Official GSTIN** | Verified 15-digit Tamil Nadu State (33) GSTIN registration certificate | `PENDING` | PVS Silk S Business Owner |
| `BUS-02` | **Legal Business Entity** | Official registered corporate incorporation name & certificate | `VALID` | PVS Silk S Business Owner |
| `BUS-03` | **Showroom Address** | Authentic physical Kanchipuram showroom & loom workshop street address | `PENDING` | PVS Silk S Business Owner |
| `BUS-04` | **Banking / Remittance** | Official SBI Current Account number, IFSC (`SBIN0000853`), and wire details | `PENDING` | PVS Silk S Finance Director |
| `BUS-05` | **Official Contact Channels** | Verified active billing/support domain inbox and corporate phone number | `VALID` | PVS Silk S Operations |
| `BUS-06` | **Master Saree Catalogue** | Authentic saree SKU inventory records populated in `templates/` CSVs | `PENDING` | PVS Silk S Merchandising Team |
| `BUS-07` | **Product Photography** | High-resolution authentic saree photoshoot imagery uploaded to CDN/S3 | `PENDING` | PVS Silk S Creative Team |
| `BUS-08` | **Executive Approval** | Formal written launch sign-off from PVS Silk S Executive Sponsor | `PENDING` | PVS Silk S Executive Sponsor |

### B. Infrastructure Inputs (`category: "infrastructure"`)

| Input ID | Input Name | Required Action & Verification Criteria | Default Status | Owner |
|:---:|---|---|:---:|---|
| `INFRA-01` | **Managed PostgreSQL** | AWS RDS / GCP Cloud SQL PostgreSQL 16 connection string (asyncpg driver) | `PENDING` | DevOps Lead |
| `INFRA-02` | **Secret Key Injection** | 64-character random hex cryptographic secret injected via secrets manager | `PENDING` | DevOps / Security Lead |
| `INFRA-03` | **Production DNS** | A/AAAA records for `pvssilks.com`, `www`, `admin`, and `api` bound to edge IP | `PENDING` | Network Administrator |
| `INFRA-04` | **Production TLS** | Valid wildcard TLS certificate active covering `pvssilks.com` and `*.pvssilks.com` | `PENDING` | DevOps Lead |

---

## 3. Fail-Closed Status Model & Zero-Fabrication Policy

### Status Lifecycle
```
                 [ Initial State: PENDING ]
                             |
         +-------------------+-------------------+
         | (Supplied)                            | (Supplied)
         v                                       v
[ Matches Format & Criteria ]         [ Fails Format / Contains Placeholder ]
         |                                       |
         v                                       v
     [ VALID ]                          [ INVALID / BLOCKED ]
```

- **Fail-Closed Rule:** Unless `valid == 12` and `pending == 0`, `production_ready` is strictly `False`.
- **Zero Fabrication Policy:** The registry never invents, simulates, or generates fake GSTINs, bank accounts, passwords, or customer records.
- **Placeholder Protection:** Detects and rejects development defaults such as `localhost`, `127.0.0.1`, `example.com`, `dummy`, `test`, `33AAAAA0000A1Z5`, and `39882200192`.
- **Sensitive Data Redaction:** Secret keys, database connection passwords, and bank accounts are masked as `[REDACTED]` across CLI logs and JSON streams.

---

## 4. CLI Execution & JSON Contract

### CLI Inspection Commands
```powershell
python -m app.core.production_input_registry --dry-run
```

```powershell
python -m app.core.production_input_registry --json
```

```powershell
python -m app.core.production_input_registry --category business
```

```powershell
python -m app.core.production_input_registry --category infrastructure
```

### JSON Output Contract
```json
{
  "phase": "5L-01",
  "component": "production_input_registry",
  "fail_closed": true,
  "summary": {
    "total": 12,
    "valid": 2,
    "pending": 10,
    "invalid": 0,
    "blocked": 0,
    "production_ready": false
  },
  "items": [
    {
      "id": "BUS-01",
      "category": "business",
      "name": "Official GSTIN",
      "status": "PENDING",
      "is_sensitive": false,
      "value_display": "33AAAAA0000A1Z5",
      "details": "Default placeholder GSTIN active ('33AAAAA0000A1Z5'). Verified live 15-digit Tamil Nadu GSTIN required.",
      "required_action": "Business owner to supply official Tamil Nadu GSTIN registration certificate.",
      "owner": "PVS Silk S Business Owner"
    }
  ]
}
```

---

## 5. Relationship with Existing Production Gate Systems

The Production Input Registry integrates cleanly into the established verification ecosystem:
- **[`production_blocker_registry.py`](file:///d:/PVS/backend/app/core/production_blocker_registry.py):** Tracks high-level 4-tier blocker status.
- **[`validate_production_contract.py`](file:///d:/PVS/backend/app/core/validate_production_contract.py):** Validates the 8 architectural and network contracts.
- **[`final_cutover_controller.py`](file:///d:/PVS/backend/app/core/final_cutover_controller.py):** Evaluates overall go-live clearance across 20 gates.
- **[`production_input_registry.py`](file:///d:/PVS/backend/app/core/production_input_registry.py):** Provides granular, field-level validation for the 12 external inputs.

---

## 6. Next Phase

**Phase 5L-02** will implement the **Business Identity & Tax Ingestion Validator**, providing isolated verification tools for the legal entity registration and Tamil Nadu GST compliance documents once supplied by the business owner.

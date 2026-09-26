# PVS Silk S — Phase 5A Codebase Audit & Business Configuration Matrix

## 1. Audit Overview
This comprehensive audit systematically examines all business identifiers, financial constants, GST identities, bank wire credentials, contact endpoints, metadata, seeds, and security configurations across `D:\PVS`.

Every finding has been classified into one of 7 standardized audit categories:
1. **Confirmed Configuration**: Environment or codebase settings confirmed by architectural requirements.
2. **Demo Data**: Fixtures and mock entries specifically used for local development and unit tests.
3. **Placeholder**: Explicit tokens (e.g., `[PHONE NUMBER]`, `[GSTIN]`) awaiting client input.
4. **Hard-coded Business Value**: Fabricated or sample values directly embedded in business logic or templates that must be converted to dynamic configuration.
5. **Secret / Sensitive Value**: Cryptographic keys, credentials, or session tokens.
6. **Technical Constant**: Domain constants, HSN statutory codes, tax percentages, or textile specifications.
7. **Needs Human Confirmation**: Real-world business details that must be provided by the PVS Silk S management.

---

## 2. Comprehensive Inventory of Findings

### 2.1 Brand & Identity

| File / Location | Item | Current State | Classification | Action Required in Phase 5A |
| :--- | :--- | :--- | :--- | :--- |
| `config/site.ts` | Brand Name | `"PVS Silk S"` | Confirmed Configuration | Centralize across frontend & backend |
| `config/site.ts` | Tagline | `"Woven With Precision"` | Confirmed Configuration | Make configurable via `NEXT_PUBLIC_BRAND_TAGLINE` |
| `config/site.ts` | Legal Name | `"PVS Silk S Textiles Pvt. Ltd."` | Needs Human Confirmation | Move to configuration default with placeholder notice |
| `config/site.ts` | Experience Claim | `"[15+ Years of Weaving Excellence]"` | Placeholder | Retain explicit placeholder format |
| `config/site.ts` | Manufacturing Capacity | `"[10,000+ Sarees / Month]"` | Placeholder | Retain explicit placeholder format |
| `config/site.ts` | Loom Count | `"[50+ Precision Looms]"` | Placeholder | Retain explicit placeholder format |
| `backend/app/core/config.py` | `PROJECT_NAME` | `"PVS Silk S API"` | Confirmed Configuration | Expose in central settings |

---

### 2.2 Contact, Location & Social Channels

| File / Location | Item | Current State | Classification | Action Required in Phase 5A |
| :--- | :--- | :--- | :--- | :--- |
| `config/site.ts` | Address Lines | `[DOOR NO. / STREET NAME]...` | Placeholder | Configurable via `NEXT_PUBLIC_BUSINESS_ADDRESS_*` |
| `config/site.ts` | Phone Number | `[+91 98765 43210]` | Placeholder | Configurable via `NEXT_PUBLIC_BUSINESS_PHONE` |
| `config/site.ts` | WhatsApp Number | `919876543210` | Placeholder (Demo format) | Configurable via `NEXT_PUBLIC_BUSINESS_WHATSAPP` |
| `config/site.ts` | Email Address | `contact@pvssilks.com` | Needs Human Confirmation | Configurable via `NEXT_PUBLIC_BUSINESS_EMAIL` |
| `config/site.ts` | Instagram Handle | `@pvs_silk_s` | Needs Human Confirmation | Configurable via `NEXT_PUBLIC_INSTAGRAM_URL` |
| `config/site.ts` | Google Maps Embed | Arbitrary coordinate URL | Hard-coded Business Value | Make optional; hide map if not configured |
| `app/layout.tsx` | Schema.org Geo Coordinates | `11.664325, 78.146014` | Hard-coded Business Value | Remove hardcoded coords from JSON-LD schema |

---

### 2.3 Tax, Invoicing & Financial Information

| File / Location | Item | Current State | Classification | Action Required in Phase 5A |
| :--- | :--- | :--- | :--- | :--- |
| `pdf_generator.py` | Company GSTIN | `33AAECP1234F1Z5` | Hard-coded Business Value | Sourced from `settings.BUSINESS_GSTIN` or placeholder |
| `pdf_generator.py` | Company Address in PDF | `42, Weavers Colony, Kanchipuram...` | Hard-coded Business Value | Sourced from `settings.BUSINESS_ADDRESS` |
| `pdf_generator.py` | Bank Name | `State Bank of India` | Hard-coded Business Value | Sourced from `settings.BANK_NAME` |
| `pdf_generator.py` | Account Number | `389201004829` | Hard-coded Business Value | Sourced from `settings.BANK_ACCOUNT_NUMBER` |
| `pdf_generator.py` | IFSC Code | `SBIN0001234` | Hard-coded Business Value | Sourced from `settings.BANK_IFSC` |
| `pdf_generator.py` | UPI ID | `pvssilks@sbi` | Hard-coded Business Value | Sourced from `settings.BANK_UPI_ID` |
| `admin/invoices/page.tsx` | Bank Account in UI | `39882200192` (SBI Kanchipuram) | Hard-coded Business Value | Sourced from central site configuration |
| `admin/invoices/[id]/page.tsx`| Bank Details in View | Hardcoded SBI Account | Hard-coded Business Value | Sourced from central site configuration |
| `models/raw_material.py` | HSN 5004 | Silk Yarn 5% | Technical Constant | Preserved as statutory constant |
| `models/product.py` | HSN 5007 | Handloom Silk Fabric 5% | Technical Constant | Preserved as statutory constant |

---

### 2.4 Seed Scripts & Test Fixtures

| File / Location | Item | Current State | Classification | Action Required in Phase 5A |
| :--- | :--- | :--- | :--- | :--- |
| `backend/app/db/seed.py` | `seed_development_data()` | Creates demo users, categories, products, inventory, suppliers | Demo Data | Keep isolated as DEV-ONLY seed script |
| `backend/app/db/seed.py` | Production Safeguard | Comments only | Needs Hardening | Add strict runtime check raising error in `APP_ENV=production` |
| `backend/app/db/init_prod.py` | Production Initializer | Missing | Missing | Create `init_prod.py` creating ONLY superadmin user |
| `backend/app/tests/*` | Test Fixtures | In-memory SQLite with synthetic accounts | Demo Data | Kept isolated for pytest test execution |

---

### 2.5 Security, Secrets & Environment Settings

| File / Location | Item | Current State | Classification | Action Required in Phase 5A |
| :--- | :--- | :--- | :--- | :--- |
| `backend/app/core/config.py` | `SECRET_KEY` | Insecure default key | Secret / Sensitive Value | Enforce minimum 32-char key & forbid default in production |
| `backend/app/core/config.py` | `DATABASE_URL` | Local postgres connection | Confirmed Configuration | Sourced from `.env` |
| `backend/app/core/config.py` | `CORS_ORIGINS` | Includes `localhost` & `pvssilks.com` | Confirmed Configuration | Restrict to production domains when `is_production` |
| `backend/app/core/config.py` | `COOKIE_SECURE` | `False` | Confirmed Configuration | Automatically `True` in `ENVIRONMENT=production` |
| Root `.gitignore` | Ignored files | `.env`, `.env.local`, etc. | Confirmed Configuration | Verify coverage |
| Backend `.gitignore` | Ignored files | `.env`, `__pycache__`, etc. | Confirmed Configuration | Verify coverage |

---

## 3. Action Plan for Phase 5A Execution

1. **Centralize Backend Configuration (`backend/app/core/config.py`)**:
   - Add business settings: `BUSINESS_NAME`, `BUSINESS_LEGAL_NAME`, `BUSINESS_ADDRESS`, `BUSINESS_PHONE`, `BUSINESS_EMAIL`, `BUSINESS_WEBSITE`.
   - Add tax settings: `GST_ENABLED`, `BUSINESS_GSTIN`, `BUSINESS_STATE_CODE`, `DEFAULT_GST_RATE`.
   - Add bank remittance settings: `BANK_NAME`, `BANK_ACCOUNT_NAME`, `BANK_ACCOUNT_NUMBER`, `BANK_IFSC`, `BANK_BRANCH`, `BANK_UPI_ID`.
   - Add startup validation: when `is_production` is true, validate that `SECRET_KEY` is not default and required business fields are provided.
2. **Centralize Frontend Configuration (`config/site.ts`)**:
   - Bind all business properties, phone, WhatsApp, email, address, bank info, and social channels to `process.env.NEXT_PUBLIC_*` with graceful fallback placeholders.
3. **Environment Separation Templates**:
   - Create `backend/.env.example` and `backend/.env.production.example`.
   - Create `.env.example` and `.env.production.example` at frontend root.
4. **Clean PDF Generation & UI Invoicing**:
   - Update `backend/app/utils/pdf_generator.py` to source business name, address, GSTIN, and bank instructions directly from `settings`.
   - Update frontend invoice details views to consume `siteConfig.bank` and `siteConfig.business`.
5. **Separate Development Demo Seed from Production Initializer**:
   - Refactor `backend/app/db/seed.py` with runtime exception if executed under `ENVIRONMENT=production`.
   - Create `backend/app/db/init_prod.py` for strictly creating the initial super admin account without creating dummy business data.

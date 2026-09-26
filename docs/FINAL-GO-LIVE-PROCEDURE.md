# PVS Silk S — Final Production Go-Live Procedure

**Document Version:** 1.0.0  
**Target Environment:** Production (`pvssilks.com`, `api.pvssilks.com`)  

---

## 1. Pre-Deployment Gate Checklist (Mandatory Clearance)

Before initiating live production deployment, all 12 Business Gates must be transitioned from `BLOCKED` to `PASS`:
1. [ ] **Official GSTIN:** Verified Tamil Nadu 15-character GSTIN supplied by business owner.
2. [ ] **Showroom Address:** Official registered physical showroom & workshop address in Kanchipuram.
3. [ ] **Corporate Bank Account:** Active SBI Current Account number, IFSC code (`SBIN0000853`), and UPI ID.
4. [ ] **Domain Email & Phone:** Customer support phone and domain email configured.
5. [ ] **Master Catalogue Data:** Final saree inventory CSV files populated in `templates/`.
6. [ ] **Product Media:** High-resolution saree photoshoot photography uploaded to CDN/S3.
7. [ ] **Managed PostgreSQL:** AWS RDS / GCP Cloud SQL PostgreSQL 16 provisioned.
8. [ ] **Production Secrets:** 64-character hex `SECRET_KEY` generated and injected via secrets manager.
9. [ ] **Production DNS:** A/AAAA records for `pvssilks.com` and `api.pvssilks.com` bound to edge load balancer.
10. [ ] **TLS Certificate:** Let's Encrypt / AWS Certificate Manager wildcard TLS certificate issued.
11. [ ] **Written Authorization:** Signed go-live authorization from PVS Silk S Executive Sponsor.

---

## 2. Step-by-Step Go-Live Execution Sequence

```
[ Step 1: Pre-Flight Gate Inspection ]
  Command: python -m app.core.check_production_gates
  Requirement: 100% PASS across all Engineering & Business Gates

[ Step 2: Database Migration Execution ]
  Command: alembic upgrade head
  Requirement: Verify database head is 0003_phase_4c_d_finance_invoicing

[ Step 3: Master Data Sequential Import ]
  Run import sequence: Categories -> Suppliers -> Raw Materials -> Products -> Customers
  Command: python -m app.core.validate_master_data --dry-run (verify 0 errors before DB commit)

[ Step 4: Container Stack Launch ]
  Command: docker compose -f docker-compose.production.yml up -d

[ Step 5: Liveness & Readiness Verification ]
  Command: curl -f https://api.pvssilks.com/health
  Command: curl -f https://api.pvssilks.com/ready

[ Step 6: Post-Deployment Smoke Test ]
  - Verify storefront loads at https://pvssilks.com
  - Verify admin login at https://pvssilks.com/admin/login
  - Verify tax calculation and PDF invoice generation on test order

[ Step 7: Public DNS Traffic Cutover ]
  - Switch apex DNS traffic to production edge cluster.
```

# PVS Silk S — Phase 5K Rollback Safety & Validation

**Runbook Reference:** [`docs/PRODUCTION-DEPLOYMENT-RUNBOOK.md`](file:///d:/PVS/docs/PRODUCTION-DEPLOYMENT-RUNBOOK.md) & [`docs/FINAL-GO-LIVE-PROCEDURE.md`](file:///d:/PVS/docs/FINAL-GO-LIVE-PROCEDURE.md)  

---

## 1. Multi-Tier Rollback Strategy

In the event of an unexpected regression during cutover:

```
+-------------------------------------------------------------------------+
|                         INCIDENT DETECTED                               |
+-------------------------------------------------------------------------+
                                    |
        +---------------------------+---------------------------+
        |                                                       |
[ Tier 1: Application Rollback ]            [ Tier 2: Database Rollback ]
Re-tag container image to previous tag:     Execute controlled downward migration:
`docker compose pull backend:v1.0.0-prev`   `alembic downgrade -1`
`docker compose up -d --no-deps backend`    (Or restore pre-cutover logical snapshot)
        |                                                       |
        +---------------------------+---------------------------+
                                    |
+-----------------------------------v-------------------------------------+
|                     [ Tier 3: DNS Traffic Reversion ]                   |
| Point Cloudflare / Route 53 A-records back to standby maintenance page  |
+-------------------------------------------------------------------------+
```

---

## 2. Invariants & Safety Guarantees

1. **Pre-Cutover Base Backup:** A full logical backup (`pg_dump -Fc` piped to AES-256 GPG) is generated and verified before executing any schema upgrade or DNS modification.
2. **Non-Destructive Migrations:** Alembic revisions `0001`, `0002`, and `0003` are strictly additive and preserve rollback symmetry (`downgrade()` methods implemented).
3. **No Accidental Destruction:** Dry-run modes are enabled by default on all controllers, preventing inadvertent DDL drops or data truncation.

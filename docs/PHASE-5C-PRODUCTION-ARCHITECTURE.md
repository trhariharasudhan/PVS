# PVS Silk S — Production Deployment Architecture & Topology Specification

**Phase:** 5C — Production Launch Infrastructure & Deployment Engineering  
**System:** PVS Silk S E-Commerce & Loom Manufacturing Platform  
**Target Environments:** Staging (`staging.pvssilks.com`) & Production (`pvssilks.com`, `admin.pvssilks.com`, `api.pvssilks.com`)  

---

## 1. Target Production Topology

```
                   [ Internet / B2C Shoppers / B2B Merchants / Factory Admins ]
                                               │
                                               ▼
                                 [ Cloudflare / DNS & Edge WAF ]
                                               │
                                 (HTTPS :443 / TLS 1.3 / HSTS)
                                               ▼
                                 [ Nginx Edge Reverse Proxy ]
                                               │
                        ┌──────────────────────┴──────────────────────┐
                        │ Host Header Routing                         │
                        ▼                                             ▼
          [ pvssilks.com / admin.pvssilks.com ]               [ api.pvssilks.com ]
                        │                                             │
                        ▼                                             ▼
          ┌───────────────────────────┐                 ┌───────────────────────────┐
          │  Next.js 14 Frontend      │                 │  FastAPI Backend Server   │
          │  (Node.js 20 Standalone)  │ ──(REST API)──► │  (Python 3.12 ASGI)       │
          │  Port: 3000 (Non-root)    │                 │  Port: 8000 (Non-root)    │
          └───────────────────────────┘                 └─────────────┬─────────────┘
                                                                      │
                                                (TLS Encrypted AsyncPG Connection)
                                                                      ▼
                                                        ┌───────────────────────────┐
                                                        │ Managed PostgreSQL 15+    │
                                                        │ (SSL=require, WAL Archive)│
                                                        │ Port: 5432                │
                                                        └───────────────────────────┘
```

---

## 2. Infrastructure Component Specifications

### 2.1 Edge & DNS Layer
- **Primary Domain:** `pvssilks.com`
- **Subdomains:**
  - `www.pvssilks.com` -> Canonical redirect to `pvssilks.com`
  - `admin.pvssilks.com` -> Admin Operations Portal
  - `api.pvssilks.com` -> FastAPI REST Engine
  - `staging.pvssilks.com` -> Staging cluster
- **Edge Security:** Cloudflare / Edge WAF with DDoS mitigation, rate limiting on `/api/v1/auth/login` and `/api/v1/wholesale-enquiries`, and automated SSL/TLS termination.

### 2.2 Reverse Proxy Layer (Nginx)
- **Protocols:** HTTP/2 over TLS 1.2 / TLS 1.3 only (SSLv3, TLS 1.0, 1.1 disabled).
- **HSTS:** `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`.
- **Security Headers:** Injected globally (`X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`).
- **Path Routing:**
  - `api.pvssilks.com` -> Proxies to `backend:8000`
  - `pvssilks.com` -> Proxies to `frontend:3000`
  - `admin.pvssilks.com` -> Proxies to `frontend:3000/admin`
- **Payload Limits:** `client_max_body_size 15M;` (accommodates high-res saree imagery and invoice generation).

### 2.3 Frontend Presentation Layer (Next.js)
- **Runtime:** Node.js 20 Alpine in Multi-Stage Container.
- **Process Isolation:** Runs as unprivileged `nextjs` system user (UID 1001).
- **Mode:** Next.js Standalone production build with pre-rendered static routes and server-side dynamic SSR for admin dashboards.
- **Network Binding:** Internal container network only on port 3000.

### 2.4 Application REST Layer (FastAPI)
- **Runtime:** Python 3.12-slim with Uvicorn ASGI workers.
- **Process Isolation:** Runs as unprivileged `appuser` (UID 1001).
- **Health Probing:** Dual `/health` (process liveness) and `/ready` (DB readiness).
- **CORS Policy:** Whitelisted strictly to `https://pvssilks.com`, `https://admin.pvssilks.com`, `https://staging.pvssilks.com`.
- **Session Transport:** HttpOnly, Secure, SameSite cookies (`pvs_access_token`).

### 2.5 Database & Persistence Layer (PostgreSQL)
- **Engine:** Managed PostgreSQL 15 or 16 (AWS RDS, DigitalOcean Managed DB, or Azure Database).
- **Connection Security:** Mandatory SSL (`sslmode=require`).
- **Connection Pooling:** SQLAlchemy async engine with `pool_size=20`, `max_overflow=10`, `pool_pre_ping=True`, `pool_recycle=1800`.
- **Storage:** NVMe SSD with automated daily snapshots and continuous point-in-time recovery (WAL archiving).

---

## 3. High Availability & Resilience Design

| Failure Mode | Mitigation Strategy | Recovery Objective (RTO / RPO) |
|---|---|---|
| Frontend Container Crash | Docker restart policy (`always`) + healthcheck auto-restart | RTO < 5s / RPO = 0 |
| Backend API Crash | Uvicorn worker supervisor + Docker restart policy | RTO < 10s / RPO = 0 |
| Database Node Failure | Managed DB Multi-AZ automatic failover | RTO < 60s / RPO < 1s |
| Disaster / Data Corruption | Point-in-time restore from encrypted logical backups | RTO < 1 hour / RPO < 24 hours |
| Traffic Spike | Stateless API container horizontal scaling behind reverse proxy | Auto-scale responsive |

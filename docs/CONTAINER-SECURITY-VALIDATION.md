# PVS Silk S — Container Security & Hardening Validation

**Artifacts:** `backend/Dockerfile`, `Dockerfile`, `docker-compose.production.example.yml`  

---

## 1. Container Security Hardening Matrix

| Security Parameter | Backend (`backend/Dockerfile`) | Frontend (`Dockerfile`) | Audit Verdict |
|---|---|---|:---:|
| **Base Image** | `python:3.12-slim` | `node:20-alpine` | **PASS** (Minimal footprint) |
| **Multi-Stage Build** | 2 stages (builder $\rightarrow$ runner) | 3 stages (deps $\rightarrow$ builder $\rightarrow$ runner) | **PASS** (Compilers stripped) |
| **Non-Root User** | `appuser` (UID: 10001, GID: 10001) | `nextjs` (UID: 1001, GID: 1001) | **PASS** (Zero root privileges) |
| **Healthchecks** | `curl -f http://localhost:8000/health` | `wget -q http://localhost:3000/` | **PASS** (Automated recovery) |
| **Graceful Shutdown** | `--timeout-graceful-shutdown 30` | Node.js SIGTERM default | **PASS** (30s in-flight drain) |
| **Secret Isolation** | Zero baked secrets, runtime ENV | Zero baked secrets, runtime ENV | **PASS** (Air-gapped) |
| **No Development Seed** | Seed logic blocked in production | No test mocks in production build | **PASS** |

---

## 2. Docker Compose Production Constraints

In `docker-compose.production.example.yml`:
- Resource limits configured (`cpus: "2.0"`, `memory: 1024M`).
- Isolated internal bridge networks (`pvs_internal_net`).
- Data volumes configured with persistent mount points (`pvs_postgres_prod_data`).
- Restart policy set to `unless-stopped`.

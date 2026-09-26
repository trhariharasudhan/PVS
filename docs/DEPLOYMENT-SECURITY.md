# PVS Silk S — Deployment Security Architecture

## 1. Production Deployment Topology

```text
[ Client Browser / Mobile Web ]
               │
               ▼ HTTPS (Port 443)
[ Cloudflare WAF / Reverse Proxy (SSL Termination + DDoS / Rate Limiting) ]
               │
       ┌───────┴───────┐
       ▼               ▼
[ Next.js Frontend ]  [ FastAPI Backend (Uvicorn / Gunicorn) ]
(Port 3000)           (Port 8000)
                       │
                       ▼ PostgreSQL Connection (SSL)
              [ Managed PostgreSQL 15+ ]
```

---

## 2. Infrastructure-Level Rate Limiting Recommendations

For high-concurrency production deployments across multiple container instances, rate limiting should be enforced at the Edge or Reverse Proxy layer:

### 2.1 Cloudflare WAF Rate Limiting Rules
* `/api/v1/auth/login`: Maximum 5 requests per minute per IP.
* `/api/v1/wholesale/enquiry`: Maximum 10 submissions per hour per IP.
* `/api/v1/contact`: Maximum 10 submissions per hour per IP.
* `/api/v1/admin/invoices/*/pdf`: Maximum 30 downloads per minute per authenticated staff IP.

### 2.2 Nginx Reverse Proxy Rate Limiting Directive
```nginx
limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=5r/m;
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=60r/m;

location /api/v1/auth/login {
    limit_req zone=auth_limit burst=3 nodelay;
    proxy_pass http://backend_upstream;
}
```

---

## 3. Secret Management & Runtime Environment
* Secrets (`SECRET_KEY`, `DATABASE_URL`, `ADMIN_INITIAL_PASSWORD`) must be injected at runtime using environment variables, Docker secrets, or cloud secrets managers (e.g., AWS Secrets Manager / Vault).
* Never bake credentials or `.env` files into container image layers.
* Execute containers as non-privileged users (`USER appuser`).

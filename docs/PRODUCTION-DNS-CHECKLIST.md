# PVS Silk S — Production DNS Configuration & Verification Checklist

**Scope:** DNS Zone Records, Routing Topology, and Automated Verification Commands  
**Apex Domain:** `pvssilks.com`  

---

## 1. Required DNS Record Set

| Record Type | Hostname / Subdomain | Target / Value | TTL | Purpose |
|---|---|---|---|---|
| **A** | `@` (`pvssilks.com`) | `PROD_EDGE_SERVER_IP` (e.g. `198.51.100.10`) | 300 | Apex Storefront Entrypoint |
| **CNAME** | `www` (`www.pvssilks.com`) | `pvssilks.com.` | 300 | WWW Canonical Redirect |
| **A / CNAME** | `admin` (`admin.pvssilks.com`) | `PROD_EDGE_SERVER_IP` / `pvssilks.com.` | 300 | Admin Operations Workspace |
| **A / CNAME** | `api` (`api.pvssilks.com`) | `PROD_EDGE_SERVER_IP` / `pvssilks.com.` | 300 | FastAPI REST Engine |
| **TXT** | `@` | `v=spf1 include:_spf.google.com ~all` | 3600 | Email Deliverability (SPF) |
| **TXT** | `_dmarc` | `v=DMARC1; p=quarantine; rua=mailto:dmarc@pvssilks.com` | 3600 | Domain Email Authentication (DMARC) |

---

## 2. Verification Commands & Validation Checklist

Before initiating TLS certificate generation, verify DNS propagation across worldwide resolvers:

### Step 1: Query Apex Domain
```bash
dig +short A pvssilks.com
# Expected: Returns PROD_EDGE_SERVER_IP
```

### Step 2: Query API Subdomain
```bash
dig +short A api.pvssilks.com
# Expected: Returns PROD_EDGE_SERVER_IP
```

### Step 3: Query Admin Subdomain
```bash
dig +short A admin.pvssilks.com
# Expected: Returns PROD_EDGE_SERVER_IP
```

### Step 4: Verify HTTP Response & Header Resolution
```bash
curl -I -L http://pvssilks.com
# Expected: HTTP/1.1 301 Moved Permanently -> Location: https://pvssilks.com/

curl -I https://api.pvssilks.com/health
# Expected: HTTP/2 200 OK {"status": "healthy", "version": "1.0.0"}
```

> [!NOTE]
> DNS records are currently **NOT configured** in production. They must be added to the authoritative DNS provider (Cloudflare / Route 53 / GoDaddy) prior to launch.

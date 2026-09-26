# PVS Silk S — Production Reverse Proxy & TLS Termination Specification

**Domain Suite:**
- Storefront: `pvssilks.com`, `www.pvssilks.com`
- Admin Operations: `admin.pvssilks.com`
- Backend API Engine: `api.pvssilks.com`

---

## 1. Nginx Reverse Proxy Architecture

The production reverse proxy acts as the single public entrypoint for all web traffic:
- **Port 80 (HTTP):** Enforces 301 Permanent Redirect to HTTPS.
- **Port 443 (HTTPS):** Terminates TLS, verifies SNI host headers, and dispatches to appropriate internal container upstreams.

---

## 2. Complete Nginx Production Configuration (`nginx/production.conf`)

```nginx
# ==============================================================================
# PVS SILK S — NGINX PRODUCTION REVERSE PROXY CONFIGURATION
# ==============================================================================

# Upstream Definitions
upstream frontend_upstream {
    server frontend:3000;
    keepalive 32;
}

upstream backend_upstream {
    server backend:8000;
    keepalive 32;
}

# ------------------------------------------------------------------------------
# 1. HTTP -> HTTPS Global Redirection
# ------------------------------------------------------------------------------
server {
    listen 80;
    listen [::]:80;
    server_name pvssilks.com www.pvssilks.com admin.pvssilks.com api.pvssilks.com;

    # Let's Encrypt ACME Challenge Directory
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

# ------------------------------------------------------------------------------
# 2. Canonical WWW -> Apex Domain Redirection
# ------------------------------------------------------------------------------
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name www.pvssilks.com;

    ssl_certificate /etc/nginx/ssl/live/pvssilks.com/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/live/pvssilks.com/privkey.pem;

    return 301 https://pvssilks.com$request_uri;
}

# ------------------------------------------------------------------------------
# 3. Main Storefront Portal (pvssilks.com)
# ------------------------------------------------------------------------------
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name pvssilks.com;

    ssl_certificate /etc/nginx/ssl/live/pvssilks.com/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/live/pvssilks.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
    ssl_session_tickets off;

    # Security Headers
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    client_max_body_size 15M;

    location / {
        proxy_pass http://frontend_upstream;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}

# ------------------------------------------------------------------------------
# 4. Admin Operations Portal (admin.pvssilks.com)
# ------------------------------------------------------------------------------
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name admin.pvssilks.com;

    ssl_certificate /etc/nginx/ssl/live/pvssilks.com/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/live/pvssilks.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    # Security Headers
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Robots-Tag "noindex, nofollow, noarchive" always;

    client_max_body_size 15M;

    location / {
        proxy_pass http://frontend_upstream/admin;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }
}

# ------------------------------------------------------------------------------
# 5. REST API Engine (api.pvssilks.com)
# ------------------------------------------------------------------------------
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.pvssilks.com;

    ssl_certificate /etc/nginx/ssl/live/pvssilks.com/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/live/pvssilks.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    # Security Headers
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header X-Content-Type-Options "nosniff" always;

    client_max_body_size 15M;

    location / {
        proxy_pass http://backend_upstream;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }
}
```

---

## 3. SSL/TLS Certificate Provisioning & Automated Renewal

### Initial Certificate Issuance via Certbot
```bash
docker run -it --rm --name certbot \
  -v ./nginx/certbot_challenge:/var/www/certbot \
  -v ./nginx/ssl:/etc/letsencrypt \
  certbot/certbot certonly --webroot -w /var/www/certbot \
  -d pvssilks.com -d www.pvssilks.com -d admin.pvssilks.com -d api.pvssilks.com \
  --email contact@pvssilks.com --agree-tos --no-eff-email
```

### Automated Renewal Cron Job
Run twice daily:
```bash
0 3,15 * * * docker run --rm -v ./nginx/certbot_challenge:/var/www/certbot -v ./nginx/ssl:/etc/letsencrypt certbot/certbot renew --quiet && docker exec pvs_prod_nginx nginx -s reload
```

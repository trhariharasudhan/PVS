# PVS Silk S — Production Secrets Management & Lifecycle Policy

**Scope:** Cryptographic Keys, Database Passwords, JWT Tokens, and Business Credentials  
**Authority:** PVS Silk S Infrastructure Security  

---

## 1. Secret Inventory & Classification

| Secret Name | Classification | Injected Layer | Security Requirement |
|---|---|---|---|
| `SECRET_KEY` | CRITICAL | Backend FastAPI | Minimum 64-character random hex (`openssl rand -hex 32`). Must never be committed. |
| `DATABASE_URL` | CRITICAL | Backend FastAPI | Managed PostgreSQL async connection string with dedicated DB user and TLS flag (`sslmode=require`). |
| `ADMIN_INITIAL_PASSWORD` | HIGH | Bootstrap CLI (`init_prod.py`) | Minimum 16-character complex password. Used once during Super Admin bootstrap, then purged. |
| `BUSINESS_GSTIN` | SENSITIVE | Backend FastAPI | Statutory 15-character GSTIN format. Validated via regex at startup. |
| `BANK_ACCOUNT_NUMBER` | SENSITIVE | Backend FastAPI | Production remittance bank account for tax invoices. Validated non-placeholder at startup. |
| `BANK_IFSC` | SENSITIVE | Backend FastAPI | 11-character alphanumeric IFSC code for wire transfers. |

---

## 2. Secrets Lifecycle Management

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ 1. GENERATE  │ ──► │  2. STORE    │ ──► │  3. INJECT   │ ──► │  4. ROTATE   │
└──────────────┘     └──────────────┘     └──────────────┘     └──────┬───────┘
                                                                      │
                                          ┌──────────────┐     ┌──────▼───────┐
                                          │   6. AUDIT   │ ◄── │  5. REVOKE   │
                                          └──────────────┘     └──────────────┘
```

### 1. Generation
- Secrets must be generated cryptographically using standard system entropy:
  ```bash
  openssl rand -hex 32
  ```
- Passwords must be generated with password managers (minimum 20 characters, mixed case, numbers, and symbols).

### 2. Secure Storage
- Secrets must never be stored in plain text in Git repositories, commit logs, Wiki pages, or chat channels.
- Production secrets must be stored in encrypted secret vaults (e.g. AWS Secrets Manager, HashiCorp Vault, Doppler, or Cloud Secret Manager).

### 3. Runtime Injection
- Injected strictly as environment variables at container runtime using Docker Compose `env_file` or Kubernetes Secrets.
- No secrets must be baked into Docker build images or Dockerfile layers.

### 4. Rotation Protocol
- `SECRET_KEY`: Rotated bi-annually or upon suspected token compromise. (Note: Rotating `SECRET_KEY` invalidates all active staff sessions, requiring re-login).
- Database Passwords: Rotated quarterly via zero-downtime dual-user rotation.

### 5. Revocation
- In the event of a credential leak, immediately generate a replacement credential, update the secret vault, redeploy container services, and revoke the compromised credential at the database/provider level.

### 6. Automated Audit
- The system includes a zero-leakage validator CLI:
  ```bash
  python -m app.core.validate_environment
  ```
- Masks all credentials while verifying string length, complexity, and format invariants.

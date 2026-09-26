# PVS Silk S — CI/CD Supply-Chain & Release Policy

**Workflow File:** [`.github/workflows/ci.yml`](file:///d:/PVS/.github/workflows/ci.yml)  

---

## 1. Automated Supply-Chain Verification Pipeline

The GitHub Actions CI pipeline enforces a strict 3-tier quality gate on all `main` and `develop` commits:

```
[ Commit / Pull Request ]
          │
          ├──> Job 1: Backend CI & Database Validation
          │     ├── Setup Python 3.12 & dependencies
          │     ├── Environment validation (validate_environment)
          │     ├── Master Data CSV validation (validate_master_data --dry-run)
          │     ├── Disaster Recovery verification (verify_disaster_recovery --dry-run)
          │     ├── Production Launch Gate evaluation (check_production_gates --json)
          │     └── Pytest Test Suite (100% passing tests)
          │
          ├──> Job 2: Frontend Production Compilation
          │     ├── Setup Node.js 20 & npm ci
          │     ├── TypeScript static typechecking
          │     └── Next.js 14 Standalone build (31 routes)
          │
          └──> Job 3: Security & Secret Scanning
                └── Gitleaks / Secret detection across git history
```

---

## 2. Release & Promotion Criteria

1. **Branch Protection:** No direct pushes to `main`. Require pull request with $\ge 1$ peer approval.
2. **Deterministic Build:** Zero warnings or type errors allowed in frontend Next.js compilation.
3. **Linear Alembic Migrations:** Single head required; branching migration chains fail CI immediately.
4. **Secret Quarantine:** Commits containing raw credentials, high-entropy secrets, or private keys are rejected.

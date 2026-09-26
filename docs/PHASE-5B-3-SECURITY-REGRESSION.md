# PVS Silk S — Phase 5B-3 Security Regression Matrix

## 1. Executive Summary
This regression document tracks automated and manual verification results for security controls across the PVS Silk S application.

---

## 2. Regression Test Results

| Security Control | Test Scope | Verification Method | Status |
| :--- | :--- | :--- | :--- |
| **Password Hashing** | Memory-hard Argon2id ($64\text{ MB}$, $3$ passes) | `test_password_hashing_security` | `PASSED` |
| **Authentication Flow** | Session cookie issuance, invalid password rejection | `test_auth.py` suite | `PASSED` |
| **Inactive Account Lockout** | Disabled accounts rejected with 401 | `test_inactive_staff_user_token_rejected` | `PASSED` |
| **Cookie Flags** | `HttpOnly`, `SameSite=lax`, `Secure=True` | `test_successful_login_sets_cookie` | `PASSED` |
| **Server-Side RBAC** | `SUPER_ADMIN`, `FACTORY_MANAGER`, `SALES_ADMIN`, `DEALER` | `test_rbac_authorization_checks` | `PASSED` |
| **Privilege Escalation** | `DEALER` role forbidden on financial/report endpoints | `test_role_based_access_control_escalation_prevention` | `PASSED` |
| **Data Leakage** | Public APIs omit supplier costs, warehouse counts, hashes | `test_no_sensitive_business_data_leakage` | `PASSED` |
| **Pagination Bounds** | Limit capped at 100, minimum 1 | `test_pagination_bounds_and_safety` | `PASSED` |
| **Security Headers** | `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` | `test_security_response_headers` | `PASSED` |
| **Non-Negative Stock** | Deductions exceeding stock rejected with 400 | `test_negative_stock_prevention` | `PASSED` |
| **Idempotency** | Duplicate wholesale conversions or batch completions rejected | `test_complete_end_to_end_business_lifecycle` | `PASSED` |
| **Decimal Precision** | Zero floating-point rounding errors in GST/invoice totals | `test_invoice_creation_and_tax_calculations` | `PASSED` |
| **Production Demo Block** | `seed_development_data()` raises RuntimeError in prod | `test_seed_development_data_refuses_production` | `PASSED` |

---

## 3. Summary
All 13 core security regression dimensions are **VERIFIED AND PASSING**.

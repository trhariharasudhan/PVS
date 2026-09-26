# PVS Silk S — Production Observability, Logging & Alerting Specification

**Scope:** Application Performance Monitoring, Log Aggregation, Security Audits, and Production Alerts  
**Architecture:** Prometheus / Grafana / Vector / CloudWatch / Sentry  

---

## 1. Observability Architecture

```
┌─────────────────────────────────┐
│ FastAPI Backend / Next.js Front │
└────────────────┬────────────────┘
                 │ (Structured JSON Logs with Correlation ID)
                 ▼
┌─────────────────────────────────┐
│ Vector / FluentBit Log Shipper  │
└────────────────┬────────────────┘
                 │
        ┌────────┴────────┐
        ▼                 ▼
┌───────────────┐ ┌───────────────┐
│ CloudWatch /  │ │ Prometheus /  │
│ Elasticsearch │ │ Grafana /     │
│ (Log Archive) │ │ Sentry Alerts │
└───────────────┘ └───────────────┘
```

---

## 2. Structured Logging Standards & Data Sanitization

All log events must be structured JSON.

### Standard Log Schema:
```json
{
  "timestamp": "2026-08-30T15:30:00.123Z",
  "level": "INFO",
  "correlation_id": "req-8f92-4a7b-b3c1",
  "method": "POST",
  "path": "/api/v1/admin/orders",
  "status_code": 201,
  "duration_ms": 42.5,
  "user_id": "usr-uuid",
  "user_role": "SUPER_ADMIN",
  "message": "Order created successfully"
}
```

### Strict Masking Policy (Zero Credential Leakage):
The application enforces strict log masking:
- Passwords (`password`, `hashed_password`) -> `[FILTERED]`
- JWT Tokens & Cookies (`pvs_access_token`, `Authorization`) -> `[FILTERED]`
- Bank Account Numbers -> Masked (e.g. `XXXX-XXXX-7001`)
- Credit/Debit Card Details -> Never accepted or logged
- Secret Keys & DB URLs -> Never printed during startup or error handlers

---

## 3. Minimum Production Alerting Matrix

| Alert Name | Metric Condition | Severity | Notification Channel | Remediation SLA |
|---|---|---|---|---|
| **Backend API Down** | `/health` fails for 2 consecutive minutes | **P1 - CRITICAL** | PagerDuty / On-Call SMS | < 5 minutes |
| **Database Disconnected** | `/ready` returns HTTP 503 for > 30 seconds | **P1 - CRITICAL** | PagerDuty / On-Call SMS | < 5 minutes |
| **Elevated 5xx Error Rate** | > 1% of total API requests return 5xx over 5m | **P2 - HIGH** | Slack `#alerts-prod` | < 15 minutes |
| **Repeated Auth Failures** | > 10 failed login attempts in 1m from single IP | **P2 - HIGH** | Security Team / Slack | < 15 minutes |
| **High Memory / Disk Usage** | Container or DB volume > 85% utilization | **P3 - MEDIUM** | Slack `#infra-alerts` | < 2 hours |
| **Backup Failure** | Daily backup job non-zero exit code or missing dump | **P2 - HIGH** | DevOps Email / Slack | < 4 hours |
| **TLS Certificate Expiry** | SSL certificate expires in < 14 days | **P3 - MEDIUM** | DevOps Email | < 24 hours |

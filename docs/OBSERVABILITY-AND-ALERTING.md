# PVS Silk S — Observability & Alerting Specification

**Module:** `backend/app/core/logging_config.py`, `backend/app/core/audit.py`  
**Test Suite:** [`backend/app/tests/test_observability.py`](file:///d:/PVS/backend/app/tests/test_observability.py)  

---

## 1. Request Correlation ID Architecture

Every inbound HTTP request is assigned a unique `X-Correlation-ID` and `X-Request-ID`:
1. If the client or reverse proxy supplies `X-Correlation-ID` or `X-Request-ID`, it is adopted.
2. Otherwise, a cryptographically random UUIDv4 is minted.
3. The ID is stored in an async `contextvars.ContextVar` (`correlation_id_ctx`) and attached to `request.state.correlation_id`.
4. All application logs and error response payloads automatically include the active `correlation_id`.
5. Both `X-Correlation-ID` and `X-Request-ID` are returned in outbound HTTP response headers.

---

## 2. Sensitive Credential Redaction

The logging pipeline implements defensive data sanitization via `redact_sensitive_data()`. Any dictionary key matching the following sensitive key set is permanently masked with `[REDACTED]`:
```python
{"password", "hashed_password", "token", "access_token", "refresh_token", 
 "secret", "secret_key", "authorization", "cookie", "set-cookie", "client_secret", "api_key"}
```

---

## 3. Structured Business Audit Logging

Business-critical events are dispatched through `log_audit_event()` to the `pvs.audit` logging stream:
- `AUTH:LOGIN_SUCCESS` / `AUTH:LOGIN_FAILURE`
- `INVENTORY:MUTATION`
- `PRODUCTION:STAGE_CHANGE`
- `ORDER:RESERVATION` / `ORDER:FULFILLMENT`
- `INVOICE:GENERATED` / `INVOICE:PAYMENT_RECORDED`

Each event record encapsulates:
- `timestamp`: UTC ISO 8601 timestamp
- `event_type`: Domain namespace
- `action`: Specific state change
- `user_id`: Authenticated staff user ID or `anonymous`
- `correlation_id`: Active trace ID
- `details`: Fully sanitized parameter dictionary

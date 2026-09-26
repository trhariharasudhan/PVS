# PVS Silk S — Payment Architecture & Gateway Readiness Specification

**Current Phase:** Phase 5C (Manual Payment Settlement Architecture)  
**Future Target:** Automated Online Payment Gateway Integration (Razorpay / Stripe / PayU)  

---

## 1. Current Verified Payment Architecture

The PVS Silk S platform operates on an enterprise **B2B & High-Value B2C Manual Settlement & Reconciliation Architecture**:

| Payment Method | Settlement Workflow | Clearance Statuses Supported | Invoicing Impact |
|---|---|---|---|
| **Bank Wire (NEFT / RTGS / IMPS)** | Customer remits funds to configured SBI Current Account with UTR reference | `INITIATED` -> `PENDING_CLEARANCE` -> `CLEARED` | Updates `invoice.paid_amount` & `invoice.balance_due` |
| **UPI Transfer** | Customer scans showroom/invoice UPI QR ID (`pvssilks@sbi`) | `INITIATED` -> `CLEARED` | Immediate full/partial balance reduction |
| **Cheque / Demand Draft** | Physical cheque collected with cheque number & issuing bank | `INITIATED` -> `PENDING_CLEARANCE` -> `CLEARED` / `BOUNCED_FAILED` | Bounced cheques revert order payment status |
| **Cash Settlement** | Showroom direct counter cash with receipt numbering | `CLEARED` | Immediate reconciliation |
| **Wholesale Trade Credit** | 30/60/90-day wholesale payment terms | `INITIATED` -> Receivables Aging Ledger | Monitored in Aging Report |

---

## 2. Future Online Gateway Integration Boundaries

```
[ Customer Checkout ]
         │
         ▼
[ Create Gateway Order ] ──► [ Razorpay / Stripe API ]
                                       │
                                       ▼
                             [ Customer Completes Payment ]
                                       │
                                       ▼
[ Webhook Ingestion Engine ] ◄── [ Signature Verified Webhook ]
         │
         ▼ (Idempotency Key Check)
[ Record Payment & Reconcile Invoice ]
         │
         ▼
[ Update Order Status to FULLY_PAID ]
```

### Mandatory Requirements for Future Gateway Activation:
1. **Webhook Signature Verification:** HMAC-SHA256 verification of `X-Razorpay-Signature` or `Stripe-Signature` to prevent spoofing.
2. **Idempotency Key Enforcement:** Prevent duplicate payment records or double credit applications during network retries.
3. **Webhook Failure Queue:** Dead-letter queue (DLQ) with retry exponential backoff.
4. **Daily Gateway Reconciliation Job:** Reconcile gateway captured transactions with internal invoice ledger.
5. **No Secret Storage in Frontend:** Gateway secret keys restricted strictly to backend environment variables.

> [!IMPORTANT]
> **GATEWAY ACTIVATION NOTICE:**  
> Real payment gateway credentials and webhook processing are **NOT active** in Phase 5C. All current invoice and order settlements are processed securely through the verified server-authoritative manual payment and reconciliation ledger.

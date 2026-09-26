import hmac
import hashlib
from typing import Optional


class WebhookSignatureVerificationError(Exception):
    """Raised when webhook signature verification fails."""
    pass


def verify_webhook_hmac_signature(
    payload_bytes: bytes,
    signature: Optional[str],
    secret: Optional[str],
    algorithm: str = "sha256",
) -> bool:
    """
    Provider-neutral HMAC signature verifier with constant-time comparison.
    Guarantees:
    1. Rejects missing payload, signature, or secret.
    2. Uses constant-time hmac.compare_digest to prevent timing attacks.
    3. Never exposes, logs, or echoes the secret.
    """
    if not payload_bytes or not signature or not secret:
        return False

    try:
        secret_bytes = secret.encode("utf-8") if isinstance(secret, str) else secret
        
        # Clean signature if prefixed (e.g. 'sha256=' or 'v1=')
        clean_signature = signature.strip()
        if clean_signature.startswith("sha256="):
            clean_signature = clean_signature.split("=", 1)[1].strip()
        elif "v1=" in clean_signature:
            # Scheme: t=...,v1=...
            parts = clean_signature.split(",")
            v1_part = next((p for p in parts if p.startswith("v1=")), None)
            if v1_part:
                clean_signature = v1_part.split("=", 1)[1].strip()

        # Compute HMAC
        if algorithm.lower() == "sha256":
            mac = hmac.new(secret_bytes, payload_bytes, hashlib.sha256)
            expected_hex = mac.hexdigest()
        else:
            return False

        # Constant-time comparison
        return hmac.compare_digest(expected_hex.lower(), clean_signature.lower())
    except Exception:
        return False

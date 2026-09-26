import logging
from typing import Any, Dict, Optional
from datetime import datetime, timezone
from app.core.logging_config import get_correlation_id, redact_sensitive_data

audit_logger = logging.getLogger("pvs.audit")


def log_audit_event(
    event_type: str,
    action: str,
    status: str,
    user_id: Optional[str] = None,
    user_role: Optional[str] = None,
    resource_id: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
):
    """
    Log an immutable business audit event with active correlation ID,
    actor context, timestamp, and sanitized operation details.
    """
    event = {
        "event_type": event_type,
        "action": action,
        "status": status,
        "user_id": user_id or "anonymous",
        "user_role": user_role or "unauthenticated",
        "resource_id": resource_id,
        "correlation_id": get_correlation_id(),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "details": redact_sensitive_data(details or {}),
    }
    audit_logger.info(f"[AUDIT] {event_type}:{action} status={status} user={user_id or 'anon'}", extra={"extra_data": event})
    return event

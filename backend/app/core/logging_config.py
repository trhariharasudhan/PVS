import logging
import json
import uuid
import contextvars
from datetime import datetime, timezone
from typing import Any, Dict, Optional, Set

# Context variable to hold the request correlation ID across async execution
correlation_id_ctx: contextvars.ContextVar[Optional[str]] = contextvars.ContextVar("correlation_id", default=None)

SENSITIVE_KEYS: Set[str] = {
    "password",
    "hashed_password",
    "token",
    "access_token",
    "refresh_token",
    "secret",
    "secret_key",
    "authorization",
    "cookie",
    "set-cookie",
    "client_secret",
    "api_key",
    "apikey",
}


def redact_sensitive_data(data: Any) -> Any:
    """
    Recursively redact known sensitive credentials, passwords, and secret keys.
    """
    if isinstance(data, dict):
        redacted = {}
        for k, v in data.items():
            if str(k).lower() in SENSITIVE_KEYS:
                redacted[k] = "[REDACTED]"
            else:
                redacted[k] = redact_sensitive_data(v)
        return redacted
    elif isinstance(data, list):
        return [redact_sensitive_data(item) for item in data]
    elif isinstance(data, tuple):
        return tuple(redact_sensitive_data(item) for item in data)
    return data


class StructuredJsonFormatter(logging.Formatter):
    """
    Production JSON log formatter injecting ISO timestamp, log level,
    module, correlation_id, and message payload with automatic sensitive data redaction.
    """
    def format(self, record: logging.LogRecord) -> str:
        log_entry: Dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "line": record.lineno,
            "correlation_id": correlation_id_ctx.get() or getattr(record, "correlation_id", None),
        }

        # Include structured extra attributes if provided
        if hasattr(record, "extra_data") and isinstance(record.extra_data, dict):
            log_entry["extra"] = redact_sensitive_data(record.extra_data)

        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)

        return json.dumps(redact_sensitive_data(log_entry))


def get_correlation_id() -> str:
    """Retrieve the active correlation ID or generate a new one if not present."""
    cid = correlation_id_ctx.get()
    if not cid:
        cid = str(uuid.uuid4())
        correlation_id_ctx.set(cid)
    return cid

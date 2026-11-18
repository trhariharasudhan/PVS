"""
File storage for customer design uploads.

- "supabase": Supabase Storage (private bucket) via its REST API. Used in production.
- "local": files under LOCAL_UPLOAD_DIR. Development / tests only.

Files are never served publicly: admins get short-lived signed URLs (Supabase)
or an authenticated streaming endpoint (local).
"""
from __future__ import annotations

import logging
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Optional, Protocol

import httpx

from app.core.config import settings

logger = logging.getLogger("uvicorn.error")

MAX_FILES = 5
MAX_FILE_BYTES = 10 * 1024 * 1024  # 10 MB


class StorageError(Exception):
    pass


@dataclass
class StoredFile:
    key: str
    filename: str
    content_type: str
    size: int


def sniff_content_type(data: bytes) -> Optional[str]:
    """Identify allowed file types by magic bytes (never trust the browser's content-type)."""
    if data.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if len(data) >= 12 and data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "image/webp"
    if data.startswith(b"%PDF-"):
        return "application/pdf"
    if len(data) >= 12 and data[4:8] == b"ftyp" and data[8:12] in (b"heic", b"heix", b"mif1", b"msf1", b"hevc"):
        return "image/heic"
    return None


EXTENSIONS = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "application/pdf": "pdf",
    "image/heic": "heic",
}


def safe_filename(name: str) -> str:
    base = os.path.basename(name or "design")
    cleaned = "".join(c if c.isalnum() or c in "._- " else "_" for c in base).strip() or "design"
    return cleaned[:120]


class StorageBackend(Protocol):
    async def put(self, key: str, data: bytes, content_type: str) -> None: ...
    async def signed_url(self, key: str, expires_in: int = 600) -> Optional[str]: ...
    def local_path(self, key: str) -> Optional[Path]: ...


class LocalStorage:
    def __init__(self, root: str):
        self.root = Path(root).resolve()

    def _path(self, key: str) -> Path:
        p = (self.root / key).resolve()
        if self.root not in p.parents:
            raise StorageError("Invalid storage key")
        return p

    async def put(self, key: str, data: bytes, content_type: str) -> None:
        p = self._path(key)
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_bytes(data)

    async def signed_url(self, key: str, expires_in: int = 600) -> Optional[str]:
        return None  # served through the authenticated admin endpoint

    def local_path(self, key: str) -> Optional[Path]:
        p = self._path(key)
        return p if p.exists() else None


class SupabaseStorage:
    def __init__(self, url: str, service_key: str, bucket: str):
        self.base = url.rstrip("/") + "/storage/v1"
        self.bucket = bucket
        self.headers = {"Authorization": f"Bearer {service_key}", "apikey": service_key}

    async def put(self, key: str, data: bytes, content_type: str) -> None:
        async with httpx.AsyncClient(timeout=30) as client:
            r = await client.post(
                f"{self.base}/object/{self.bucket}/{key}",
                content=data,
                headers={**self.headers, "Content-Type": content_type, "x-upsert": "false"},
            )
        if r.status_code >= 300:
            logger.error("Supabase upload failed (%s): %s", r.status_code, r.text[:300])
            raise StorageError("Could not store the uploaded file")

    async def signed_url(self, key: str, expires_in: int = 600) -> Optional[str]:
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.post(
                f"{self.base}/object/sign/{self.bucket}/{key}",
                json={"expiresIn": expires_in},
                headers=self.headers,
            )
        if r.status_code >= 300:
            logger.error("Supabase sign failed (%s): %s", r.status_code, r.text[:300])
            return None
        signed = r.json().get("signedURL") or r.json().get("signedUrl")
        return f"{self.base}{signed}" if signed and signed.startswith("/") else signed

    def local_path(self, key: str) -> Optional[Path]:
        return None


_backend: Optional[StorageBackend] = None


def get_storage() -> StorageBackend:
    global _backend
    if _backend is None:
        if settings.STORAGE_BACKEND == "supabase":
            if not (settings.SUPABASE_URL and settings.SUPABASE_SERVICE_ROLE_KEY):
                raise StorageError("Supabase storage selected but SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are missing")
            _backend = SupabaseStorage(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY, settings.SUPABASE_STORAGE_BUCKET)
        else:
            _backend = LocalStorage(settings.LOCAL_UPLOAD_DIR)
    return _backend


def set_storage(backend: Optional[StorageBackend]) -> None:
    """Test hook."""
    global _backend
    _backend = backend

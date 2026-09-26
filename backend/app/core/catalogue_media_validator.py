import os
import re
import sys
import json
from pathlib import Path
from typing import Dict, List, Any, Optional, Set
from enum import Enum

ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
PROHIBITED_EXECUTABLE_EXTENSIONS = {".exe", ".sh", ".php", ".js", ".py", ".bat", ".cmd", ".vbs", ".bin", ".dll"}
STANDARD_IMAGE_TAGS = {"front", "back", "border", "pallu", "detail", "lifestyle", "primary", "pleats", "full"}

TRAVERSAL_PATTERN = re.compile(r"(\.\./|\.\.\\|/etc/|/var/|c:\\windows|file://)", re.IGNORECASE)
IMAGE_FILENAME_PATTERN = re.compile(r"^[a-zA-Z0-9_\-]+(\.[a-zA-Z0-9]+)$")


class MediaStatus(str, Enum):
    VALID = "VALID"
    PENDING_MEDIA = "PENDING_MEDIA"
    PENDING_EXTERNAL_MEDIA = "PENDING_EXTERNAL_MEDIA"
    INVALID = "INVALID"
    BLOCKED = "BLOCKED"


class CatalogueMediaValidator:
    """
    PVS Silk S — Saree Photography & Media Asset Ingestion Validator (Phase 5L-03).
    Validates product photography naming conventions, media coverage per SKU,
    path traversal safety, and external CDN asset manifests.
    """
    def __init__(self, media_root: Optional[Path] = None):
        if media_root is None:
            self.media_root = Path(__file__).resolve().parent.parent.parent.parent / "media"
        else:
            self.media_root = media_root
        self.errors: List[str] = []
        self.warnings: List[str] = []

    def validate_image_path_or_url(self, image_ref: str, expected_sku: Optional[str] = None) -> Dict[str, Any]:
        """Validate single image filename, URL, or local reference for safety and convention."""
        if not image_ref or str(image_ref).strip() == "":
            return {
                "is_valid": False,
                "status": MediaStatus.INVALID.value,
                "error": "Empty or whitespace image reference.",
            }

        ref_clean = str(image_ref).strip()

        # 1. Path traversal & dangerous protocol check
        if TRAVERSAL_PATTERN.search(ref_clean):
            return {
                "is_valid": False,
                "status": MediaStatus.BLOCKED.value,
                "error": f"Security violation: path traversal detected in '{ref_clean}'.",
            }

        # 2. Extract filename and extension
        filename = Path(ref_clean).name
        ext = Path(ref_clean).suffix.lower()

        # 3. Prohibited executable extensions
        if ext in PROHIBITED_EXECUTABLE_EXTENSIONS:
            return {
                "is_valid": False,
                "status": MediaStatus.BLOCKED.value,
                "error": f"Security violation: executable file extension '{ext}' is forbidden.",
            }

        # 4. Allowed image extension
        if ext not in ALLOWED_IMAGE_EXTENSIONS:
            return {
                "is_valid": False,
                "status": MediaStatus.INVALID.value,
                "error": f"Invalid image extension '{ext}'. Allowed: {sorted(list(ALLOWED_IMAGE_EXTENSIONS))}.",
            }

        # 5. Placeholder detection
        if any(p in ref_clean.lower() for p in ["placeholder", "demo_img", "sample_photo", "dummy"]):
            return {
                "is_valid": False,
                "status": MediaStatus.BLOCKED.value,
                "error": f"Development placeholder image '{ref_clean}' rejected.",
            }

        # 6. SKU matching convention (if SKU provided)
        # Recommended pattern: {SKU}_front.jpg, {SKU}-01.jpg, or {SKU}_pallu.jpg
        sku_matched = True
        if expected_sku:
            clean_sku = re.sub(r"[^a-zA-Z0-9]", "", expected_sku.lower())
            clean_filename = re.sub(r"[^a-zA-Z0-9]", "", filename.lower())
            if clean_sku not in clean_filename:
                sku_matched = False

        return {
            "is_valid": True,
            "status": MediaStatus.VALID.value,
            "filename": filename,
            "extension": ext,
            "sku_matched": sku_matched,
            "reference": ref_clean,
        }

    def validate_media_manifest(
        self,
        products: List[Dict[str, Any]],
        media_records: Optional[List[Dict[str, Any]]] = None,
        is_external_cdn: bool = True
    ) -> Dict[str, Any]:
        """
        Validate media coverage across all SKU catalogue records.
        """
        total_products = len(products)
        if total_products == 0:
            return {
                "status": MediaStatus.PENDING_MEDIA.value,
                "total_products": 0,
                "products_with_images": 0,
                "products_missing_images": 0,
                "coverage_pct": 0.0,
                "errors": ["No products provided for media validation."],
                "is_ready": False,
            }

        media_records = media_records or []
        sku_to_images: Dict[str, List[Dict[str, Any]]] = {p["product_code"]: [] for p in products if "product_code" in p}

        seen_image_urls: Set[str] = set()
        duplicate_images: List[str] = []
        invalid_images: List[str] = []

        for m in media_records:
            sku = m.get("product_code")
            img_url = m.get("image_url", "")
            val_res = self.validate_image_path_or_url(img_url, expected_sku=sku)

            if not val_res["is_valid"]:
                invalid_images.append(f"SKU '{sku}': {val_res['error']}")
            else:
                if img_url in seen_image_urls:
                    duplicate_images.append(f"SKU '{sku}': Duplicate image reference '{img_url}'")
                seen_image_urls.add(img_url)

                if sku in sku_to_images:
                    sku_to_images[sku].append({
                        "url": img_url,
                        "tag": m.get("tag", "front"),
                        "is_primary": m.get("is_primary", False),
                    })

        products_with_images = sum(1 for sku, imgs in sku_to_images.items() if len(imgs) > 0)
        products_missing_images = total_products - products_with_images
        coverage_pct = round((products_with_images / total_products) * 100.0, 1) if total_products > 0 else 0.0

        if len(invalid_images) > 0:
            status = MediaStatus.INVALID.value
            is_ready = False
        elif products_missing_images > 0:
            status = MediaStatus.PENDING_EXTERNAL_MEDIA.value if is_external_cdn else MediaStatus.PENDING_MEDIA.value
            is_ready = False
        else:
            status = MediaStatus.VALID.value
            is_ready = True

        return {
            "status": status,
            "total_products": total_products,
            "products_with_images": products_with_images,
            "products_missing_images": products_missing_images,
            "coverage_pct": coverage_pct,
            "duplicate_count": len(duplicate_images),
            "invalid_count": len(invalid_images),
            "invalid_details": invalid_images,
            "duplicate_details": duplicate_images,
            "is_ready": is_ready,
        }

import csv
import json
import pytest
from pathlib import Path
from decimal import Decimal

from app.core.catalogue_ingestion_validator import (
    CatalogueIngestionValidator,
    CatalogueStatus,
)
from app.core.catalogue_media_validator import (
    CatalogueMediaValidator,
    MediaStatus,
)


@pytest.fixture
def sample_valid_row():
    return {
        "product_code": "PVS-BRIDAL-001",
        "name": "Kanchipuram Crimson Royal Bridal Silk Saree",
        "category_slug": "bridal",
        "fabric": "Pure Mulberry Silk",
        "color": "Crimson Red & Gold",
        "border": "Rich Temple Zari Border",
        "pallu": "Brocade Zari Pallu",
        "motif": "Mayil (Peacock) & Rudraksha",
        "weave_type": "Korvai Handloom Weave",
        "description": "Handcrafted pure mulberry silk saree with exquisite heavy zari work.",
        "dimensions": "6.2 meters with blouse",
        "weight": "850 grams",
        "retail_price": "32000.00",
        "wholesale_price": "24000.00",
        "gst_rate": "5.0",
        "availability_status": "IN_STOCK",
        "is_featured": "true",
        "is_active": "true",
    }


def test_valid_catalogue_row(sample_valid_row):
    """1. Valid saree row with pure silk attributes and 5% GST passes row validation."""
    validator = CatalogueIngestionValidator()
    seen = set()
    res = validator.validate_saree_row(sample_valid_row, row_idx=2, seen_skus=seen)

    assert res["is_valid"] is True
    assert len(res["errors"]) == 0
    assert "PVS-BRIDAL-001" in seen


def test_missing_or_duplicate_sku(sample_valid_row):
    """2. Missing or duplicate SKU is marked invalid."""
    validator = CatalogueIngestionValidator()
    seen = {"PVS-BRIDAL-001"}

    # Duplicate
    res_dup = validator.validate_saree_row(sample_valid_row, row_idx=3, seen_skus=seen)
    assert res_dup["is_valid"] is False
    assert "Duplicate SKU" in res_dup["errors"][0]

    # Missing
    row_empty_sku = dict(sample_valid_row, product_code="")
    res_empty = validator.validate_saree_row(row_empty_sku, row_idx=4, seen_skus=set())
    assert res_empty["is_valid"] is False
    assert "Missing or empty 'product_code'" in res_empty["errors"][0]


def test_placeholder_sku_rejected(sample_valid_row):
    """3. Demo/placeholder SKUs are rejected."""
    validator = CatalogueIngestionValidator()
    for token in ["DEMO-SKU-001", "TEST-PROD-99", "SAMPLE-SAREE", "DUMMY-SKU"]:
        row = dict(sample_valid_row, product_code=token)
        res = validator.validate_saree_row(row, row_idx=2, seen_skus=set())
        assert res["is_valid"] is False
        assert "placeholder" in res["errors"][0].lower()


def test_missing_product_name_or_too_short(sample_valid_row):
    """4. Product name missing or under 5 characters is marked invalid."""
    validator = CatalogueIngestionValidator()
    row_short = dict(sample_valid_row, name="Silk")
    res = validator.validate_saree_row(row_short, row_idx=2, seen_skus=set())
    assert res["is_valid"] is False
    assert "too short" in res["errors"][0]


def test_invalid_prices_and_wholesale_exceeding_retail(sample_valid_row):
    """5. Negative price or wholesale price > retail price is rejected."""
    validator = CatalogueIngestionValidator()

    # Negative price
    row_neg = dict(sample_valid_row, retail_price="-500")
    res_neg = validator.validate_saree_row(row_neg, row_idx=2, seen_skus=set())
    assert res_neg["is_valid"] is False

    # Wholesale > Retail
    row_bad_rel = dict(sample_valid_row, retail_price="20000", wholesale_price="25000")
    res_rel = validator.validate_saree_row(row_bad_rel, row_idx=2, seen_skus=set())
    assert res_rel["is_valid"] is False
    assert "cannot exceed retail" in res_rel["errors"][0]


def test_gst_rate_must_be_5_percent(sample_valid_row):
    """6. GST rate must strictly be 5.0% for pure silk handloom sarees."""
    validator = CatalogueIngestionValidator()

    row_18 = dict(sample_valid_row, gst_rate="18.0")
    res = validator.validate_saree_row(row_18, row_idx=2, seen_skus=set())
    assert res["is_valid"] is False
    assert "5.0%" in res["errors"][0]


def test_csv_structure_validation_with_temp_file(tmp_path, sample_valid_row):
    """7. Valid CSV headers parse successfully; missing headers fail."""
    validator = CatalogueIngestionValidator()
    valid_csv = tmp_path / "valid_products.csv"

    headers = list(sample_valid_row.keys())
    with open(valid_csv, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=headers)
        writer.writeheader()
        writer.writerow(sample_valid_row)

    success, rows, errors = validator.validate_csv_structure(valid_csv)
    assert success is True
    assert len(rows) == 1
    assert len(errors) == 0

    # Missing header
    bad_csv = tmp_path / "bad_products.csv"
    bad_headers = ["product_code", "name"]
    with open(bad_csv, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=bad_headers)
        writer.writeheader()
        writer.writerow({"product_code": "PVS-01", "name": "Saree"})

    success_bad, rows_bad, errors_bad = validator.validate_csv_structure(bad_csv)
    assert success_bad is False
    assert "Missing required CSV columns" in errors_bad[0]


def test_media_validator_single_image():
    """8. Media validator verifies safe image extensions, path traversal, and executable extensions."""
    mv = CatalogueMediaValidator()

    # Valid image
    res_valid = mv.validate_image_path_or_url("PVS-BRIDAL-001_front.jpg", expected_sku="PVS-BRIDAL-001")
    assert res_valid["is_valid"] is True
    assert res_valid["extension"] == ".jpg"
    assert res_valid["sku_matched"] is True

    # Path traversal attack
    res_trav = mv.validate_image_path_or_url("../../etc/passwd.jpg")
    assert res_trav["is_valid"] is False
    assert res_trav["status"] == MediaStatus.BLOCKED.value

    # Executable extension attack
    res_exe = mv.validate_image_path_or_url("malicious_script.php")
    assert res_exe["is_valid"] is False
    assert res_exe["status"] == MediaStatus.BLOCKED.value

    # Invalid extension
    res_bad_ext = mv.validate_image_path_or_url("saree_photo.bmp")
    assert res_bad_ext["is_valid"] is False
    assert res_bad_ext["status"] == MediaStatus.INVALID.value


def test_media_coverage_manifest_calculation():
    """9. Media coverage calculates products with/without images and detects duplicates."""
    mv = CatalogueMediaValidator()
    products = [
        {"product_code": "SKU-001"},
        {"product_code": "SKU-002"},
        {"product_code": "SKU-003"},
    ]
    media_records = [
        {"product_code": "SKU-001", "image_url": "SKU-001_front.jpg", "tag": "front", "is_primary": True},
        {"product_code": "SKU-001", "image_url": "SKU-001_pallu.jpg", "tag": "pallu", "is_primary": False},
        {"product_code": "SKU-002", "image_url": "SKU-002_front.jpg", "tag": "front", "is_primary": True},
        # SKU-003 has no images
    ]

    res = mv.validate_media_manifest(products=products, media_records=media_records, is_external_cdn=True)
    assert res["total_products"] == 3
    assert res["products_with_images"] == 2
    assert res["products_missing_images"] == 1
    assert res["coverage_pct"] == 66.7
    assert res["status"] == MediaStatus.PENDING_EXTERNAL_MEDIA.value
    assert res["is_ready"] is False


def test_catalogue_full_file_validation_with_media(tmp_path, sample_valid_row):
    """10. Full file validation returns CATALOGUE_READY only when both CSV and 100% media coverage are valid."""
    csv_file = tmp_path / "complete_products.csv"
    headers = list(sample_valid_row.keys())
    with open(csv_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=headers)
        writer.writeheader()
        writer.writerow(sample_valid_row)

    validator = CatalogueIngestionValidator()

    # Case A: Media missing -> CATALOGUE_PENDING_MEDIA
    report_no_media = validator.validate_catalogue_file(csv_file_path=csv_file, media_records=[])
    assert report_no_media["status"] == CatalogueStatus.CATALOGUE_PENDING_MEDIA.value
    assert report_no_media["is_production_ready"] is False

    # Case B: Media provided for 100% of SKUs -> CATALOGUE_READY
    media_records = [
        {"product_code": "PVS-BRIDAL-001", "image_url": "PVS-BRIDAL-001_front.jpg", "tag": "front", "is_primary": True}
    ]
    report_ready = validator.validate_catalogue_file(csv_file_path=csv_file, media_records=media_records)
    assert report_ready["status"] == CatalogueStatus.CATALOGUE_READY.value
    assert report_ready["is_production_ready"] is True
    assert report_ready["summary"]["valid_rows"] == 1


def test_deterministic_json_output(tmp_path, sample_valid_row):
    """11. Output JSON adheres to machine-readable contract."""
    csv_file = tmp_path / "json_test.csv"
    with open(csv_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(sample_valid_row.keys()))
        writer.writeheader()
        writer.writerow(sample_valid_row)

    validator = CatalogueIngestionValidator()
    report = validator.validate_catalogue_file(csv_file_path=csv_file)
    json_str = json.dumps(report)
    loaded = json.loads(json_str)

    assert loaded["phase"] == "5L-03"
    assert loaded["component"] == "catalogue_ingestion_validator"
    assert "summary" in loaded
    assert "media_coverage" in loaded
    assert "verdict" in loaded

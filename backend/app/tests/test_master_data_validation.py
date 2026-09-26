import pytest
import csv
from pathlib import Path
from app.core.validate_master_data import MasterDataValidator, validate_master_data_directory


def test_valid_templates_pass(tmp_path: Path):
    # Copy valid templates from actual templates dir
    actual_templates = Path(__file__).resolve().parent.parent.parent.parent / "templates"
    summary = validate_master_data_directory(actual_templates)
    assert summary["is_valid"] is True
    assert len(summary["errors"]) == 0
    assert summary["stats"]["categories"]["valid"] >= 4
    assert summary["stats"]["products"]["valid"] >= 2


def test_validator_detects_duplicate_slug_and_product_code(tmp_path: Path):
    # Create invalid categories with duplicate slug
    cat_file = tmp_path / "category-import-template.csv"
    with open(cat_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["name", "slug", "description"])
        writer.writerow(["Category 1", "silk-saree", "Desc 1"])
        writer.writerow(["Category 2", "silk-saree", "Desc 2"])  # Duplicate slug

    validator = MasterDataValidator(tmp_path)
    cat_ok = validator.validate_categories()
    assert cat_ok is False
    assert any("Duplicate slug" in e for e in validator.errors)


def test_validator_detects_invalid_foreign_key_references(tmp_path: Path):
    # Setup valid categories
    cat_file = tmp_path / "category-import-template.csv"
    with open(cat_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["name", "slug", "description"])
        writer.writerow(["Bridal", "bridal", "Bridal desc"])

    # Setup product pointing to unknown category
    prod_file = tmp_path / "product-import-template.csv"
    with open(prod_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["product_code", "name", "category_slug", "retail_price", "wholesale_price"])
        writer.writerow(["PVS-001", "Bridal Saree", "non-existent-category", "25000", "20000"])

    validator = MasterDataValidator(tmp_path)
    validator.validate_categories()
    prod_ok = validator.validate_products()
    assert prod_ok is False
    assert any("Foreign key error" in e for e in validator.errors)


def test_validator_detects_invalid_gstin_and_phone(tmp_path: Path):
    sup_file = tmp_path / "supplier-import-template.csv"
    with open(sup_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["supplier_code", "supplier_name", "supplier_type", "phone", "gstin"])
        writer.writerow(["SUP-001", "Bad Supplier", "SILK_REELER", "123", "INVALID_GSTIN_123"])

    validator = MasterDataValidator(tmp_path)
    sup_ok = validator.validate_suppliers()
    assert sup_ok is False
    assert any("Malformed phone" in e for e in validator.errors)
    assert any("Invalid 15-char GSTIN" in e for e in validator.errors)


def test_validator_detects_negative_prices_and_costs(tmp_path: Path):
    # Setup supplier
    sup_file = tmp_path / "supplier-import-template.csv"
    with open(sup_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["supplier_code", "supplier_name", "supplier_type", "phone"])
        writer.writerow(["SUP-001", "Good Supplier", "SILK_REELER", "+919842111222"])

    # Setup raw material with negative unit cost
    rm_file = tmp_path / "raw-material-import-template.csv"
    with open(rm_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["material_code", "name", "material_type", "unit_of_measure", "supplier_code", "unit_cost"])
        writer.writerow(["RM-001", "Silk Yarn", "RAW_SILK", "KILOGRAMS", "SUP-001", "-500.00"])

    validator = MasterDataValidator(tmp_path)
    validator.validate_suppliers()
    rm_ok = validator.validate_raw_materials()
    assert rm_ok is False
    assert any("cannot be negative" in e for e in validator.errors)

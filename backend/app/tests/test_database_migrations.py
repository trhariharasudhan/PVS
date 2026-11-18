import pytest
from pathlib import Path
from alembic.config import Config
from alembic.script import ScriptDirectory
import app.models  # Ensures all model tables are loaded in Base.metadata
from app.models.base import Base


def test_alembic_migration_chain_is_linear_and_single_headed():
    """
    Automated Migration Chain Verification.
    Validates:
    1. Alembic configuration and versions directory exist.
    2. Exactly ONE revision head exists.
    3. The linear sequence:
       0001_initial_schema -> 0002_phase_4c_c_procurement_payments -> 0003_phase_4c_d_finance_invoicing.
    """
    backend_dir = Path(__file__).resolve().parent.parent.parent
    alembic_ini_path = backend_dir / "alembic.ini"
    assert alembic_ini_path.exists(), "alembic.ini must exist in backend directory"

    alembic_cfg = Config(str(alembic_ini_path))
    alembic_cfg.set_main_option("script_location", str(backend_dir / "alembic"))

    from app.core.migration_chain import check_linear_chain

    report = check_linear_chain(backend_dir)
    assert report.ok, report.problems
    # the chain must contain every known milestone, in order
    for rev in [
        "0001_initial_schema",
        "0002_phase_4c_c_procurement_payments",
        "0003_phase_4c_d_finance_invoicing",
        "0004_phase_6_01_dealer_pricing_tiers",
        "0005_phase_6_03_payment_webhook_events",
        "0006_phase_6_04_communication_events",
        "0007_custom_order_requests",
        "0008_custom_order_design_options",
    ]:
        assert rev in report.chain, f"{rev} missing from chain {report.chain}"


def test_sqlalchemy_metadata_tables_and_foreign_keys():
    """
    Validates that all essential tables and relationships are registered in SQLAlchemy metadata.
    """
    expected_tables = {
        "users",
        "categories",
        "products",
        "product_images",
        "product_pricing_tiers",
        "inventory",
        "payment_webhook_events",
        "communication_events",
        "custom_order_requests",



        "inventory_movements",
        "production_batches",
        "production_stages",
        "production_batch_materials",
        "customers",
        "orders",
        "order_items",
        "wholesale_enquiries",
        "suppliers",
        "raw_materials",
        "raw_material_stock",
        "raw_material_movements",
        "purchase_orders",
        "purchase_order_items",
        "payments",
        "invoices",
        "invoice_items",
    }

    registered_tables = set(Base.metadata.tables.keys())
    missing_tables = expected_tables - registered_tables
    assert not missing_tables, f"Missing tables in SQLAlchemy metadata: {missing_tables}"

    # Verify foreign key existence on child tables
    assert len(Base.metadata.tables["products"].foreign_keys) >= 1
    assert len(Base.metadata.tables["order_items"].foreign_keys) >= 2
    assert len(Base.metadata.tables["invoices"].foreign_keys) >= 1
    assert len(Base.metadata.tables["invoice_items"].foreign_keys) >= 1
    assert len(Base.metadata.tables["payments"].foreign_keys) >= 1

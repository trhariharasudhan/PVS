import pytest
from app.core.config import Settings
from app.db.seed import seed_development_data
from app.utils.pdf_generator import generate_invoice_pdf


@pytest.mark.asyncio
async def test_business_configuration_defaults():
    """Verify business settings defaults and address formatting."""
    cfg = Settings(
        ENVIRONMENT="development",
        BUSINESS_NAME="PVS Silk S",
        BUSINESS_ADDRESS_LINE1="42, Weavers Colony",
        BUSINESS_CITY="Kanchipuram",
        BUSINESS_STATE="Tamil Nadu",
        BUSINESS_PINCODE="631501",
        BUSINESS_COUNTRY="India",
    )
    assert cfg.is_development is True
    assert cfg.is_production is False
    assert "42, Weavers Colony" in cfg.full_business_address
    assert "Kanchipuram - 631501" in cfg.full_business_address


@pytest.mark.asyncio
async def test_production_readiness_validation_fails_on_insecure_defaults():
    """Verify that validate_production_readiness catches insecure keys and localhost DB in production."""
    prod_cfg = Settings(
        ENVIRONMENT="production",
        SECRET_KEY="pvs-silks-insecure-secret-key-change-in-production-2026",
        DATABASE_URL="postgresql+asyncpg://postgres:postgres@localhost:5432/pvs_silks_db",
        BUSINESS_GSTIN="33AAAAA0000A1Z5",
        GST_ENABLED=True,
    )
    errors = prod_cfg.validate_production_readiness()
    assert len(errors) >= 2
    assert any("SECRET_KEY" in e for e in errors)
    assert any("DATABASE_URL" in e for e in errors)


@pytest.mark.asyncio
async def test_production_readiness_validation_passes_on_valid_config():
    """Verify that validate_production_readiness passes with proper 64-char key and valid remote DB."""
    prod_cfg = Settings(
        ENVIRONMENT="production",
        SECRET_KEY="a" * 64,
        DATABASE_URL="postgresql+asyncpg://user:pass@prod-db.internal:5432/pvs_db",
        BUSINESS_GSTIN="33AAECP1234F1Z5",
        GST_ENABLED=True,
        CORS_ORIGINS=["https://pvssilks.com", "https://admin.pvssilks.com"],
        BANK_ACCOUNT_NUMBER="40991122334",
        BANK_IFSC="SBIN0001234",
    )
    errors = prod_cfg.validate_production_readiness()
    assert len(errors) == 0


@pytest.mark.asyncio
async def test_production_readiness_rejects_missing_or_demo_bank_details():
    """Bank details have no defaults; empty or known demo accounts must block production."""
    base = dict(
        ENVIRONMENT="production",
        SECRET_KEY="a" * 64,
        DATABASE_URL="postgresql+asyncpg://user:pass@prod-db.internal:5432/pvs_db",
        BUSINESS_GSTIN="33AAECP1234F1Z5",
        GST_ENABLED=True,
        CORS_ORIGINS=["https://pvssilks.com"],
    )
    missing = Settings(**base).validate_production_readiness()
    assert any("BANK_ACCOUNT_NUMBER" in e for e in missing)

    demo = Settings(**base, BANK_ACCOUNT_NUMBER="39882200192", BANK_IFSC="SBIN0001234").validate_production_readiness()
    assert any("BANK_ACCOUNT_NUMBER" in e for e in demo)


@pytest.mark.asyncio
async def test_seed_development_data_refuses_production(monkeypatch):
    """Verify seed_development_data raises RuntimeError if executed against production environment."""
    from app.core import config
    monkeypatch.setattr(config.settings, "ENVIRONMENT", "production")

    with pytest.raises(RuntimeError) as exc_info:
        await seed_development_data()

    assert "CRITICAL SAFETY VIOLATION" in str(exc_info.value)


@pytest.mark.asyncio
async def test_pdf_invoice_generation_uses_config():
    """Verify PDF invoice generation succeeds and reflects dynamic configuration."""
    invoice_payload = {
        "invoice_number": "INV-2026-TEST-001",
        "invoice_type": "TAX_INVOICE",
        "invoice_date": "2026-08-30",
        "due_date": "2026-09-15",
        "status": "ISSUED",
        "customer_name": "Verified Boutique Client",
        "customer_address": "Chennai, Tamil Nadu",
        "customer_phone": "+91 98400 11223",
        "customer_gstin": "33AABCC1234A1Z1",
        "place_of_supply": "Tamil Nadu (33)",
        "subtotal_amount": 10000.0,
        "cgst_rate": 2.5,
        "cgst_amount": 250.0,
        "sgst_rate": 2.5,
        "sgst_amount": 250.0,
        "igst_rate": 0.0,
        "igst_amount": 0.0,
        "total_tax_amount": 500.0,
        "total_amount": 10500.0,
        "paid_amount": 0.0,
        "balance_due": 10500.0,
        "items": [
            {
                "item_description": "Pure Kanchipuram Silk Saree",
                "hsn_sac_code": "5007",
                "quantity": 1,
                "unit_of_measure": "PCS",
                "unit_price": 10000.0,
                "taxable_amount": 10000.0,
                "gst_rate": 5.0,
                "tax_amount": 500.0,
                "total_amount": 10500.0,
            }
        ],
    }

    pdf_bytes = generate_invoice_pdf(invoice_payload)
    assert isinstance(pdf_bytes, bytes)
    assert len(pdf_bytes) > 1000
    assert pdf_bytes.startswith(b"%PDF-")


def test_asyncpg_ssl_normalization_preserves_query_params():
    """Verify that sslmode is converted to ssl for asyncpg while preserving all other query parameters."""
    cfg = Settings(
        DATABASE_URL="postgresql://postgres.testref:secretpass@aws-0-ap-south-1.pooler.supabase.com:5432/postgres?sslmode=require&connect_timeout=10",
        DIRECT_URL="postgres://postgres.testref:secretpass@aws-0-ap-south-1.pooler.supabase.com:5432/postgres?channel=app&sslmode=prefer&other=1",
    )
    db_url = cfg.effective_database_url
    mig_url = cfg.effective_migration_url

    # Check scheme and ssl normalization
    assert db_url.startswith("postgresql+asyncpg://")
    assert "ssl=require" in db_url
    assert "sslmode=" not in db_url
    assert "connect_timeout=10" in db_url

    assert mig_url.startswith("postgresql+asyncpg://")
    assert "ssl=prefer" in mig_url
    assert "sslmode=" not in mig_url
    assert "channel=app" in mig_url
    assert "other=1" in mig_url


def test_asyncpg_ssl_normalization_preserves_passwords_and_special_chars():
    """Verify that passwords containing percent-encoding or special characters are not modified or double-encoded."""
    raw_url = "postgresql://user_app:p%20ss#w?rd@host.pooler.supabase.com:6543/postgres?sslmode=require"
    cfg = Settings(DATABASE_URL=raw_url)
    normalized = cfg.effective_database_url

    assert normalized.startswith("postgresql+asyncpg://")
    assert "user_app:p%20ss#w?rd@host.pooler.supabase.com:6543" in normalized
    assert normalized.endswith("?ssl=require")


def test_asyncpg_ssl_compatibility_direct_connect_args():
    """Verify that SQLAlchemy asyncpg dialect generates 'ssl' argument and rejects 'sslmode'."""
    from sqlalchemy.engine import make_url
    from sqlalchemy.dialects.postgresql.asyncpg import PGDialect_asyncpg

    cfg = Settings(
        DATABASE_URL="postgresql://user:pass@host:5432/postgres?sslmode=require"
    )
    url_obj = make_url(cfg.effective_database_url)
    dialect = PGDialect_asyncpg()
    _, opts = dialect.create_connect_args(url_obj)

    assert opts["ssl"] == "require"
    assert "sslmode" not in opts

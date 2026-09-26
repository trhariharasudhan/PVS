"""Phase 6-01 B2B Dealer Authentication and Tiered Pricing Tiers Migration

Revision ID: 0004_phase_6_01_dealer_pricing_tiers
Revises: 0003_phase_4c_d_finance_invoicing
Create Date: 2026-08-31 18:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "0004_phase_6_01_dealer_pricing_tiers"
down_revision: Union[str, None] = "0003_phase_4c_d_finance_invoicing"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add customer_id column to users table for DEALER linkage
    op.add_column(
        "users",
        sa.Column("customer_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_foreign_key(
        "fk_users_customer_id_customers",
        "users",
        "customers",
        ["customer_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index(
        "ix_users_customer_id",
        "users",
        ["customer_id"],
    )

    # 2. Create product_pricing_tiers table
    op.create_table(
        "product_pricing_tiers",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("product_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("tier_name", sa.String(length=100), nullable=False),
        sa.Column("min_quantity", sa.Integer(), nullable=False),
        sa.Column("tier_price", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(
            ["product_id"],
            ["products.id"],
            name="fk_product_pricing_tiers_product_id_products",
            ondelete="CASCADE",
        ),
        sa.UniqueConstraint("product_id", "min_quantity", name="uq_product_pricing_tier_min_qty"),
        sa.CheckConstraint("min_quantity >= 1", name="ck_pricing_tier_min_quantity_positive"),
        sa.CheckConstraint("tier_price > 0", name="ck_pricing_tier_price_positive"),
    )
    op.create_index(
        "ix_product_pricing_tiers_product_id",
        "product_pricing_tiers",
        ["product_id"],
    )


def downgrade() -> None:
    # 1. Drop product_pricing_tiers table
    op.drop_index("ix_product_pricing_tiers_product_id", table_name="product_pricing_tiers")
    op.drop_table("product_pricing_tiers")

    # 2. Remove customer_id from users table
    op.drop_index("ix_users_customer_id", table_name="users")
    op.drop_constraint("fk_users_customer_id_customers", "users", type_="foreignkey")
    op.drop_column("users", "customer_id")

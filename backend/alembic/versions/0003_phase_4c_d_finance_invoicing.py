"""Phase 4C-D Finance, Invoicing, Tax Breakdown, and Payments Migration

Revision ID: 0003_phase_4c_d_finance_invoicing
Revises: 0002_phase_4c_c_procurement_payments
Create Date: 2026-08-30 19:15:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "0003_phase_4c_d_finance_invoicing"
down_revision: Union[str, None] = "0002_phase_4c_c_procurement_payments"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create invoices table
    op.create_table(
        "invoices",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("invoice_number", sa.String(length=50), nullable=False),
        sa.Column("invoice_type", sa.String(length=50), nullable=False, server_default="TAX_INVOICE"),
        sa.Column("order_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("purchase_order_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("customer_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("supplier_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("invoice_date", sa.Date(), nullable=False),
        sa.Column("due_date", sa.Date(), nullable=False),
        sa.Column("place_of_supply", sa.String(length=100), nullable=False, server_default="Tamil Nadu (33)"),
        sa.Column("customer_gstin", sa.String(length=20), nullable=True),
        sa.Column("subtotal_amount", sa.Numeric(precision=12, scale=2), nullable=False, server_default="0.00"),
        sa.Column("cgst_rate", sa.Numeric(precision=5, scale=2), nullable=False, server_default="2.50"),
        sa.Column("cgst_amount", sa.Numeric(precision=10, scale=2), nullable=False, server_default="0.00"),
        sa.Column("sgst_rate", sa.Numeric(precision=5, scale=2), nullable=False, server_default="2.50"),
        sa.Column("sgst_amount", sa.Numeric(precision=10, scale=2), nullable=False, server_default="0.00"),
        sa.Column("igst_rate", sa.Numeric(precision=5, scale=2), nullable=False, server_default="0.00"),
        sa.Column("igst_amount", sa.Numeric(precision=10, scale=2), nullable=False, server_default="0.00"),
        sa.Column("total_tax_amount", sa.Numeric(precision=10, scale=2), nullable=False, server_default="0.00"),
        sa.Column("total_amount", sa.Numeric(precision=12, scale=2), nullable=False, server_default="0.00"),
        sa.Column("paid_amount", sa.Numeric(precision=12, scale=2), nullable=False, server_default="0.00"),
        sa.Column("balance_due", sa.Numeric(precision=12, scale=2), nullable=False, server_default="0.00"),
        sa.Column("status", sa.String(length=50), nullable=False, server_default="DRAFT"),
        sa.Column("terms_and_conditions", sa.Text(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_by_user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["purchase_order_id"], ["purchase_orders.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["customer_id"], ["customers.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["supplier_id"], ["suppliers.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["created_by_user_id"], ["users.id"], ondelete="SET NULL"),
    )
    op.create_index("ix_invoices_invoice_number", "invoices", ["invoice_number"], unique=True)
    op.create_index("ix_invoices_invoice_type", "invoices", ["invoice_type"])
    op.create_index("ix_invoices_order_id", "invoices", ["order_id"])
    op.create_index("ix_invoices_customer_id", "invoices", ["customer_id"])
    op.create_index("ix_invoices_supplier_id", "invoices", ["supplier_id"])
    op.create_index("ix_invoices_status", "invoices", ["status"])

    # 2. Create invoice_items table
    op.create_table(
        "invoice_items",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("invoice_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("product_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("raw_material_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("item_description", sa.String(length=255), nullable=False),
        sa.Column("hsn_sac_code", sa.String(length=20), nullable=False, server_default="5007"),
        sa.Column("quantity", sa.Numeric(precision=12, scale=2), nullable=False, server_default="1.00"),
        sa.Column("unit_of_measure", sa.String(length=50), nullable=False, server_default="PCS"),
        sa.Column("unit_price", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column("discount_amount", sa.Numeric(precision=10, scale=2), nullable=False, server_default="0.00"),
        sa.Column("taxable_amount", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("gst_rate", sa.Numeric(precision=5, scale=2), nullable=False, server_default="5.00"),
        sa.Column("tax_amount", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column("total_amount", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.ForeignKeyConstraint(["invoice_id"], ["invoices.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["raw_material_id"], ["raw_materials.id"], ondelete="SET NULL"),
    )
    op.create_index("ix_invoice_items_invoice_id", "invoice_items", ["invoice_id"])

    # 3. Add invoice_id to payments table
    op.add_column("payments", sa.Column("invoice_id", postgresql.UUID(as_uuid=True), nullable=True))
    op.create_foreign_key("fk_payments_invoice_id", "payments", "invoices", ["invoice_id"], ["id"], ondelete="SET NULL")
    op.create_index("ix_payments_invoice_id", "payments", ["invoice_id"])


def downgrade() -> None:
    op.drop_constraint("fk_payments_invoice_id", "payments", type_="foreignkey")
    op.drop_index("ix_payments_invoice_id", "payments")
    op.drop_column("payments", "invoice_id")
    op.drop_table("invoice_items")
    op.drop_table("invoices")

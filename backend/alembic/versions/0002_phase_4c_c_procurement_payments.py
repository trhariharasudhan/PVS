"""Phase 4C-C Procurement, Material Ledger, Batch Consumption, and Payments Migration

Revision ID: 0002_phase_4c_c_procurement_payments
Revises: 0001_initial_schema
Create Date: 2026-08-30 18:55:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "0002_phase_4c_c_procurement_payments"
down_revision: Union[str, None] = "0001_initial_schema"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Update suppliers table
    op.add_column("suppliers", sa.Column("supplier_code", sa.String(length=50), nullable=True))
    op.add_column("suppliers", sa.Column("supplier_type", sa.String(length=50), nullable=False, server_default="GENERAL"))
    op.add_column("suppliers", sa.Column("address", sa.Text(), nullable=True))
    op.add_column("suppliers", sa.Column("gstin", sa.String(length=20), nullable=True))
    op.add_column("suppliers", sa.Column("notes", sa.Text(), nullable=True))
    op.add_column("suppliers", sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()))
    op.create_index("ix_suppliers_supplier_code", "suppliers", ["supplier_code"], unique=True)
    op.create_index("ix_suppliers_phone", "suppliers", ["phone"])

    # 2. Update raw_materials table
    op.add_column("raw_materials", sa.Column("unit_cost", sa.Numeric(precision=10, scale=2), nullable=True))
    op.add_column("raw_materials", sa.Column("description", sa.Text(), nullable=True))
    op.add_column("raw_materials", sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")))

    # 3. Update raw_material_stock table
    op.add_column("raw_material_stock", sa.Column("quantity_on_hand", sa.Numeric(precision=12, scale=2), nullable=False, server_default="0.00"))
    op.add_column("raw_material_stock", sa.Column("quantity_reserved", sa.Numeric(precision=12, scale=2), nullable=False, server_default="0.00"))
    op.add_column("raw_material_stock", sa.Column("warehouse_location", sa.String(length=100), nullable=True))
    op.add_column("raw_material_stock", sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()))

    # 4. Create raw_material_movements table
    op.create_table(
        "raw_material_movements",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("raw_material_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("movement_type", sa.String(length=50), nullable=False),
        sa.Column("quantity_delta", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("reference_id", sa.String(length=100), nullable=True),
        sa.Column("performed_by_user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["raw_material_id"], ["raw_materials.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["performed_by_user_id"], ["users.id"], ondelete="SET NULL"),
    )
    op.create_index("ix_raw_material_movements_raw_material_id", "raw_material_movements", ["raw_material_id"])
    op.create_index("ix_raw_material_movements_movement_type", "raw_material_movements", ["movement_type"])
    op.create_index("ix_raw_material_movements_reference_id", "raw_material_movements", ["reference_id"])
    op.create_index("ix_raw_material_movements_created_at", "raw_material_movements", ["created_at"])

    # 5. Create purchase_orders table
    op.create_table(
        "purchase_orders",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("po_number", sa.String(length=50), nullable=False),
        sa.Column("supplier_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False, server_default="DRAFT"),
        sa.Column("order_date", sa.Date(), nullable=False),
        sa.Column("expected_delivery_date", sa.Date(), nullable=True),
        sa.Column("subtotal_amount", sa.Numeric(precision=12, scale=2), nullable=False, server_default="0.00"),
        sa.Column("tax_amount", sa.Numeric(precision=10, scale=2), nullable=False, server_default="0.00"),
        sa.Column("total_amount", sa.Numeric(precision=12, scale=2), nullable=False, server_default="0.00"),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_by_user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["supplier_id"], ["suppliers.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["created_by_user_id"], ["users.id"], ondelete="SET NULL"),
    )
    op.create_index("ix_purchase_orders_po_number", "purchase_orders", ["po_number"], unique=True)
    op.create_index("ix_purchase_orders_supplier_id", "purchase_orders", ["supplier_id"])
    op.create_index("ix_purchase_orders_status", "purchase_orders", ["status"])

    # 6. Create purchase_order_items table
    op.create_table(
        "purchase_order_items",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("purchase_order_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("raw_material_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("quantity_ordered", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("quantity_received", sa.Numeric(precision=12, scale=2), nullable=False, server_default="0.00"),
        sa.Column("unit_cost", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column("line_total", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.ForeignKeyConstraint(["purchase_order_id"], ["purchase_orders.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["raw_material_id"], ["raw_materials.id"], ondelete="RESTRICT"),
    )
    op.create_index("ix_purchase_order_items_purchase_order_id", "purchase_order_items", ["purchase_order_id"])
    op.create_index("ix_purchase_order_items_raw_material_id", "purchase_order_items", ["raw_material_id"])

    # 7. Create production_batch_materials table
    op.create_table(
        "production_batch_materials",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("batch_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("raw_material_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("quantity_consumed", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("performed_by_user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["batch_id"], ["production_batches.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["raw_material_id"], ["raw_materials.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["performed_by_user_id"], ["users.id"], ondelete="SET NULL"),
    )
    op.create_index("ix_production_batch_materials_batch_id", "production_batch_materials", ["batch_id"])
    op.create_index("ix_production_batch_materials_raw_material_id", "production_batch_materials", ["raw_material_id"])

    # 8. Create payments table
    op.create_table(
        "payments",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("payment_number", sa.String(length=50), nullable=False),
        sa.Column("payment_type", sa.String(length=50), nullable=False),
        sa.Column("customer_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("supplier_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("order_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("purchase_order_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("amount", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("payment_method", sa.String(length=50), nullable=False),
        sa.Column("payment_status", sa.String(length=50), nullable=False, server_default="RECORDED"),
        sa.Column("reference_transaction_id", sa.String(length=100), nullable=True),
        sa.Column("payment_date", sa.Date(), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("recorded_by_user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["customer_id"], ["customers.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["supplier_id"], ["suppliers.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["purchase_order_id"], ["purchase_orders.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["recorded_by_user_id"], ["users.id"], ondelete="SET NULL"),
    )
    op.create_index("ix_payments_payment_number", "payments", ["payment_number"], unique=True)
    op.create_index("ix_payments_payment_type", "payments", ["payment_type"])
    op.create_index("ix_payments_customer_id", "payments", ["customer_id"])
    op.create_index("ix_payments_supplier_id", "payments", ["supplier_id"])
    op.create_index("ix_payments_order_id", "payments", ["order_id"])
    op.create_index("ix_payments_purchase_order_id", "payments", ["purchase_order_id"])
    op.create_index("ix_payments_payment_status", "payments", ["payment_status"])


def downgrade() -> None:
    op.drop_table("payments")
    op.drop_table("production_batch_materials")
    op.drop_table("purchase_order_items")
    op.drop_table("purchase_orders")
    op.drop_table("raw_material_movements")
    op.drop_column("raw_material_stock", "updated_at")
    op.drop_column("raw_material_stock", "warehouse_location")
    op.drop_column("raw_material_stock", "quantity_reserved")
    op.drop_column("raw_material_stock", "quantity_on_hand")
    op.drop_column("raw_materials", "is_active")
    op.drop_column("raw_materials", "description")
    op.drop_column("raw_materials", "unit_cost")
    op.drop_index("ix_suppliers_phone", "suppliers")
    op.drop_index("ix_suppliers_supplier_code", "suppliers")
    op.drop_column("suppliers", "updated_at")
    op.drop_column("suppliers", "notes")
    op.drop_column("suppliers", "gstin")
    op.drop_column("suppliers", "address")
    op.drop_column("suppliers", "supplier_type")
    op.drop_column("suppliers", "supplier_code")

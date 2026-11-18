"""custom (made-to-order) saree requests with design uploads

Revision ID: 0007_custom_order_requests
Revises: 0006_phase_6_04_communication_events
Create Date: 2026-11-18 09:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0007_custom_order_requests"
down_revision: Union[str, None] = "0006_phase_6_04_communication_events"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "custom_order_requests",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("reference_code", sa.String(length=20), nullable=False, unique=True),
        sa.Column("segment", sa.String(length=20), nullable=False),
        sa.Column("contact_name", sa.String(length=255), nullable=False),
        sa.Column("phone", sa.String(length=30), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column("city", sa.String(length=100), nullable=True),
        sa.Column("business_name", sa.String(length=255), nullable=True),
        sa.Column("preferred_contact", sa.String(length=20), nullable=False, server_default="whatsapp"),
        sa.Column("saree_type", sa.String(length=100), nullable=False),
        sa.Column("occasion", sa.String(length=100), nullable=True),
        sa.Column("body_colour", sa.String(length=7), nullable=False),
        sa.Column("border_colour", sa.String(length=7), nullable=False),
        sa.Column("pallu_colour", sa.String(length=7), nullable=False),
        sa.Column("silk_type", sa.String(length=100), nullable=False),
        sa.Column("silk_percentage", sa.Integer(), nullable=True),
        sa.Column("zari_type", sa.String(length=100), nullable=False),
        sa.Column("border_style", sa.String(length=100), nullable=True),
        sa.Column("design_notes", sa.Text(), nullable=True),
        sa.Column("quantity", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("needed_by", sa.Date(), nullable=True),
        sa.Column("budget_range", sa.String(length=50), nullable=True),
        sa.Column("attachments", sa.JSON(), nullable=False, server_default=sa.text("'[]'")),
        sa.Column("consent_to_contact", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="NEW"),
        sa.Column("internal_notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_custom_order_requests_reference_code", "custom_order_requests", ["reference_code"], unique=True)
    op.create_index("ix_custom_order_requests_segment", "custom_order_requests", ["segment"])
    op.create_index("ix_custom_order_requests_phone", "custom_order_requests", ["phone"])
    op.create_index("ix_custom_order_requests_status", "custom_order_requests", ["status"])


def downgrade() -> None:
    op.drop_index("ix_custom_order_requests_status", table_name="custom_order_requests")
    op.drop_index("ix_custom_order_requests_phone", table_name="custom_order_requests")
    op.drop_index("ix_custom_order_requests_segment", table_name="custom_order_requests")
    op.drop_index("ix_custom_order_requests_reference_code", table_name="custom_order_requests")
    op.drop_table("custom_order_requests")

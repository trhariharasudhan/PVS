"""phase 6_04 communication events table

Revision ID: 0006_phase_6_04_communication_events
Revises: 0005_phase_6_03_payment_webhook_events
Create Date: 2026-08-31 19:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "0006_phase_6_04_communication_events"
down_revision: Union[str, None] = "0005_phase_6_03_payment_webhook_events"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create communication_events table
    op.create_table(
        "communication_events",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("event_type", sa.String(length=50), nullable=False),
        sa.Column("channel", sa.String(length=30), nullable=False),
        sa.Column("provider", sa.String(length=50), nullable=False, server_default="neutral_stub"),
        sa.Column("recipient", sa.String(length=255), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False, server_default="QUEUED"),
        sa.Column("order_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("orders.id", ondelete="SET NULL"), nullable=True),
        sa.Column("invoice_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("invoices.id", ondelete="SET NULL"), nullable=True),
        sa.Column("customer_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("customers.id", ondelete="SET NULL"), nullable=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("subject", sa.String(length=255), nullable=True),
        sa.Column("rendered_content", sa.Text(), nullable=False),
        sa.Column("attachments_metadata", sa.JSON(), nullable=True),
        sa.Column("idempotency_key", sa.String(length=255), unique=True, nullable=False),
        sa.Column("attempt_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("max_attempts", sa.Integer(), nullable=False, server_default="3"),
        sa.Column("sent_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("delivered_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("provider_message_id", sa.String(length=150), nullable=True),
        sa.Column("correlation_id", sa.String(length=100), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_communication_events_event_type", "communication_events", ["event_type"])
    op.create_index("ix_communication_events_channel", "communication_events", ["channel"])
    op.create_index("ix_communication_events_provider", "communication_events", ["provider"])
    op.create_index("ix_communication_events_recipient", "communication_events", ["recipient"])
    op.create_index("ix_communication_events_status", "communication_events", ["status"])
    op.create_index("ix_communication_events_order_id", "communication_events", ["order_id"])
    op.create_index("ix_communication_events_invoice_id", "communication_events", ["invoice_id"])
    op.create_index("ix_communication_events_customer_id", "communication_events", ["customer_id"])
    op.create_index("ix_communication_events_user_id", "communication_events", ["user_id"])
    op.create_index("ix_communication_events_idempotency_key", "communication_events", ["idempotency_key"])


def downgrade() -> None:
    op.drop_index("ix_communication_events_idempotency_key", table_name="communication_events")
    op.drop_index("ix_communication_events_user_id", table_name="communication_events")
    op.drop_index("ix_communication_events_customer_id", table_name="communication_events")
    op.drop_index("ix_communication_events_invoice_id", table_name="communication_events")
    op.drop_index("ix_communication_events_order_id", table_name="communication_events")
    op.drop_index("ix_communication_events_status", table_name="communication_events")
    op.drop_index("ix_communication_events_recipient", table_name="communication_events")
    op.drop_index("ix_communication_events_provider", table_name="communication_events")
    op.drop_index("ix_communication_events_channel", table_name="communication_events")
    op.drop_index("ix_communication_events_event_type", table_name="communication_events")
    op.drop_table("communication_events")

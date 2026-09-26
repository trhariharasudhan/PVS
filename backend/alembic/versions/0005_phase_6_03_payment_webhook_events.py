"""phase 6_03 payment webhook events table

Revision ID: 0005_phase_6_03_payment_webhook_events
Revises: 0004_phase_6_01_dealer_pricing_tiers
Create Date: 2026-08-31 19:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "0005_phase_6_03_payment_webhook_events"
down_revision: Union[str, None] = "0004_phase_6_01_dealer_pricing_tiers"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create payment_webhook_events table
    op.create_table(
        "payment_webhook_events",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("provider", sa.String(length=50), nullable=False),
        sa.Column("event_id", sa.String(length=150), nullable=False),
        sa.Column("event_type", sa.String(length=100), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False, server_default="PENDING"),
        sa.Column("payload", sa.JSON(), nullable=False),
        sa.Column("signature_verified", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("processed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("retry_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.UniqueConstraint("provider", "event_id", name="uq_webhook_provider_event_id"),
    )
    op.create_index("ix_payment_webhook_events_provider", "payment_webhook_events", ["provider"])
    op.create_index("ix_payment_webhook_events_event_id", "payment_webhook_events", ["event_id"])
    op.create_index("ix_payment_webhook_events_event_type", "payment_webhook_events", ["event_type"])
    op.create_index("ix_payment_webhook_events_status", "payment_webhook_events", ["status"])


def downgrade() -> None:
    op.drop_index("ix_payment_webhook_events_status", table_name="payment_webhook_events")
    op.drop_index("ix_payment_webhook_events_event_type", table_name="payment_webhook_events")
    op.drop_index("ix_payment_webhook_events_event_id", table_name="payment_webhook_events")
    op.drop_index("ix_payment_webhook_events_provider", table_name="payment_webhook_events")
    op.drop_table("payment_webhook_events")

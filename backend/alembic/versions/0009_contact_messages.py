"""contact messages: store public contact-page messages (previously discarded)

Revision ID: 0009_contact_messages
Revises: 0008_custom_order_design_options
Create Date: 2026-11-18 21:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0009_contact_messages"
down_revision: Union[str, None] = "0008_custom_order_design_options"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "contact_messages",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("phone", sa.String(length=30), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column("subject", sa.String(length=255), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("language", sa.String(length=5), nullable=True),
        sa.Column(
            "status",
            sa.Enum("NEW", "REPLIED", "CLOSED", name="contact_message_status", native_enum=False),
            nullable=False,
        ),
        sa.Column("internal_notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_contact_messages_phone", "contact_messages", ["phone"])
    op.create_index("ix_contact_messages_status", "contact_messages", ["status"])


def downgrade() -> None:
    op.drop_index("ix_contact_messages_status", table_name="contact_messages")
    op.drop_index("ix_contact_messages_phone", table_name="contact_messages")
    op.drop_table("contact_messages")

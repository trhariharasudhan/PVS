"""custom orders: structured design options (border style, motifs, pallu style)

Revision ID: 0008_custom_order_design_options
Revises: 0007_custom_order_requests
Create Date: 2026-11-18 19:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0008_custom_order_design_options"
down_revision: Union[str, None] = "0007_custom_order_requests"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("custom_order_requests", sa.Column("design_options", sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column("custom_order_requests", "design_options")

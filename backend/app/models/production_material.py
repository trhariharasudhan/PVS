import uuid
from typing import Optional, TYPE_CHECKING
from decimal import Decimal
from datetime import datetime, timezone
from sqlalchemy import String, Text, Numeric, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.production import ProductionBatch
    from app.models.raw_material import RawMaterial
    from app.models.user import User


class ProductionBatchMaterial(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "production_batch_materials"

    batch_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("production_batches.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    raw_material_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("raw_materials.id", ondelete="RESTRICT"),
        index=True,
        nullable=False,
    )
    quantity_consumed: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    performed_by_user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    batch: Mapped["ProductionBatch"] = relationship("ProductionBatch", back_populates="materials_consumed")
    raw_material: Mapped["RawMaterial"] = relationship("RawMaterial", back_populates="batch_consumptions")
    performed_by_user: Mapped[Optional["User"]] = relationship("User")

    def __repr__(self) -> str:
        return f"<ProductionBatchMaterial {self.id}: Batch {self.batch_id} -> Mat {self.raw_material_id} ({self.quantity_consumed})>"

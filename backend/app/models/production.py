import enum
import uuid
from typing import Optional, TYPE_CHECKING
from datetime import date, datetime
from sqlalchemy import String, Text, Integer, Date, ForeignKey, DateTime, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, UUIDPrimaryKeyMixin, TimeStampedModel

if TYPE_CHECKING:
    from app.models.product import Product
    from app.models.production_material import ProductionBatchMaterial


class BatchStatus(str, enum.Enum):
    PLANNED = "PLANNED"
    WARPING = "WARPING"
    WEAVING_IN_PROGRESS = "WEAVING_IN_PROGRESS"
    FINISHING = "FINISHING"
    QUALITY_CHECK = "QUALITY_CHECK"
    COMPLETED = "COMPLETED"
    ABORTED = "ABORTED"


class StageStatus(str, enum.Enum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    PASSED_QC = "PASSED_QC"
    FAILED_REWORK = "FAILED_REWORK"


class ProductionBatch(Base, UUIDPrimaryKeyMixin, TimeStampedModel):
    __tablename__ = "production_batches"

    batch_number: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("products.id", ondelete="RESTRICT"),
        index=True,
        nullable=False,
    )
    loom_identifier: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    planned_quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    completed_quantity: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    status: Mapped[BatchStatus] = mapped_column(
        SAEnum(BatchStatus, name="batch_status", native_enum=False),
        default=BatchStatus.PLANNED,
        index=True,
        nullable=False,
    )
    start_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    estimated_completion_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    # Relationships
    product: Mapped["Product"] = relationship("Product", back_populates="production_batches")
    stages: Mapped[list["ProductionStage"]] = relationship(
        "ProductionStage",
        back_populates="batch",
        cascade="all, delete-orphan",
        order_by="ProductionStage.stage_sequence",
    )
    materials_consumed: Mapped[list["ProductionBatchMaterial"]] = relationship(
        "ProductionBatchMaterial",
        back_populates="batch",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<ProductionBatch {self.batch_number} ({self.status})>"


class ProductionStage(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "production_stages"

    batch_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("production_batches.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    stage_sequence: Mapped[int] = mapped_column(Integer, nullable=False)
    stage_name: Mapped[str] = mapped_column(String(100), nullable=False)
    status: Mapped[StageStatus] = mapped_column(
        SAEnum(StageStatus, name="stage_status", native_enum=False),
        default=StageStatus.PENDING,
        nullable=False,
    )
    inspected_by: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    batch: Mapped["ProductionBatch"] = relationship("ProductionBatch", back_populates="stages")

    def __repr__(self) -> str:
        return f"<ProductionStage {self.stage_sequence}: {self.stage_name} ({self.status})>"

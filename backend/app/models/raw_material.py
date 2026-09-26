import enum
import uuid
from typing import Optional, TYPE_CHECKING
from decimal import Decimal
from datetime import datetime, timezone
from sqlalchemy import String, Text, Numeric, Boolean, ForeignKey, DateTime, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, UUIDPrimaryKeyMixin, TimeStampedModel

if TYPE_CHECKING:
    from app.models.supplier import Supplier
    from app.models.user import User
    from app.models.purchase import PurchaseOrderItem
    from app.models.production_material import ProductionBatchMaterial


class MaterialType(str, enum.Enum):
    RAW_SILK = "RAW_SILK"
    PURE_ZARI = "PURE_ZARI"
    METALLIC_ZARI = "METALLIC_ZARI"
    ECO_DYES = "ECO_DYES"
    PACKAGING_SUPPLIES = "PACKAGING_SUPPLIES"
    LOOM_ACCESSORIES = "LOOM_ACCESSORIES"


class UnitOfMeasure(str, enum.Enum):
    KILOGRAMS = "KILOGRAMS"
    GRAMS = "GRAMS"
    METERS = "METERS"
    HANK_REELS = "HANK_REELS"
    UNITS = "UNITS"


class RawMaterialMovementType(str, enum.Enum):
    PURCHASE_RECEIPT = "PURCHASE_RECEIPT"
    PRODUCTION_CONSUMPTION = "PRODUCTION_CONSUMPTION"
    ADJUSTMENT = "ADJUSTMENT"
    WASTAGE_DAMAGE = "WASTAGE_DAMAGE"
    RETURN_TO_SUPPLIER = "RETURN_TO_SUPPLIER"


class RawMaterial(Base, UUIDPrimaryKeyMixin, TimeStampedModel):
    __tablename__ = "raw_materials"

    material_code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    material_type: Mapped[MaterialType] = mapped_column(
        SAEnum(MaterialType, name="material_type", native_enum=False),
        nullable=False,
    )
    unit_of_measure: Mapped[UnitOfMeasure] = mapped_column(
        SAEnum(UnitOfMeasure, name="unit_of_measure", native_enum=False),
        nullable=False,
    )
    reorder_level: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("10.00"), nullable=False)
    unit_cost: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    supplier_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("suppliers.id", ondelete="SET NULL"),
        nullable=True,
    )

    # Relationships
    supplier: Mapped[Optional["Supplier"]] = relationship("Supplier", back_populates="raw_materials")
    stock: Mapped[Optional["RawMaterialStock"]] = relationship(
        "RawMaterialStock",
        back_populates="raw_material",
        uselist=False,
        cascade="all, delete-orphan",
    )
    movements: Mapped[list["RawMaterialMovement"]] = relationship(
        "RawMaterialMovement",
        back_populates="raw_material",
        cascade="all, delete-orphan",
    )
    purchase_items: Mapped[list["PurchaseOrderItem"]] = relationship(
        "PurchaseOrderItem",
        back_populates="raw_material",
    )
    batch_consumptions: Mapped[list["ProductionBatchMaterial"]] = relationship(
        "ProductionBatchMaterial",
        back_populates="raw_material",
    )

    def __repr__(self) -> str:
        return f"<RawMaterial {self.material_code}: {self.name} ({self.material_type})>"


class RawMaterialStock(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "raw_material_stock"

    raw_material_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("raw_materials.id", ondelete="CASCADE"),
        unique=True,
        index=True,
        nullable=False,
    )
    quantity_on_hand: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    quantity_reserved: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    warehouse_location: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    last_restocked_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    raw_material: Mapped["RawMaterial"] = relationship("RawMaterial", back_populates="stock")

    @property
    def quantity_available(self) -> Decimal:
        return max(Decimal("0.00"), self.quantity_on_hand - self.quantity_reserved)

    def __repr__(self) -> str:
        return f"<RawMaterialStock {self.raw_material_id}: on_hand={self.quantity_on_hand}, available={self.quantity_available}>"


class RawMaterialMovement(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "raw_material_movements"

    raw_material_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("raw_materials.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    movement_type: Mapped[RawMaterialMovementType] = mapped_column(
        SAEnum(RawMaterialMovementType, name="raw_material_movement_type", native_enum=False),
        index=True,
        nullable=False,
    )
    quantity_delta: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)  # Positive or negative
    reference_id: Mapped[Optional[str]] = mapped_column(String(100), index=True, nullable=True)  # PO / Batch ID
    performed_by_user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        index=True,
        nullable=False,
    )

    # Relationships
    raw_material: Mapped["RawMaterial"] = relationship("RawMaterial", back_populates="movements")
    performed_by_user: Mapped[Optional["User"]] = relationship("User")

    def __repr__(self) -> str:
        return f"<RawMaterialMovement {self.id}: {self.movement_type} {self.quantity_delta} (Ref: {self.reference_id})>"

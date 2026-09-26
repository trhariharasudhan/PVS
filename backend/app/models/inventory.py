import enum
import uuid
from typing import Optional, TYPE_CHECKING
from datetime import datetime, timezone
from sqlalchemy import String, Text, Integer, ForeignKey, DateTime, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.product import Product
    from app.models.user import User


class MovementType(str, enum.Enum):
    PURCHASE = "PURCHASE"
    PRODUCTION = "PRODUCTION"
    SALE = "SALE"
    ADJUSTMENT = "ADJUSTMENT"
    DAMAGE = "DAMAGE"
    RETURN = "RETURN"


class Inventory(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "inventory"

    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("products.id", ondelete="CASCADE"),
        unique=True,
        index=True,
        nullable=False,
    )
    quantity_on_hand: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    quantity_reserved: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    reorder_threshold: Mapped[int] = mapped_column(Integer, default=5, nullable=False)
    warehouse_location: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    product: Mapped["Product"] = relationship("Product", back_populates="inventory")
    movements: Mapped[list["InventoryMovement"]] = relationship(
        "InventoryMovement",
        back_populates="inventory",
        cascade="all, delete-orphan",
    )

    @property
    def quantity_available(self) -> int:
        return max(0, self.quantity_on_hand - self.quantity_reserved)

    def __repr__(self) -> str:
        return f"<Inventory for Product {self.product_id}: on_hand={self.quantity_on_hand}, available={self.quantity_available}>"


class InventoryMovement(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "inventory_movements"

    inventory_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("inventory.id", ondelete="RESTRICT"),
        index=True,
        nullable=False,
    )
    movement_type: Mapped[MovementType] = mapped_column(
        SAEnum(MovementType, name="movement_type", native_enum=False),
        index=True,
        nullable=False,
    )
    quantity_delta: Mapped[int] = mapped_column(Integer, nullable=False)  # Positive or negative
    reference_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)  # Order ID / Batch ID
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
    inventory: Mapped["Inventory"] = relationship("Inventory", back_populates="movements")
    performed_by_user: Mapped[Optional["User"]] = relationship("User", back_populates="performed_movements")

    def __repr__(self) -> str:
        return f"<InventoryMovement {self.id}: {self.movement_type} {self.quantity_delta}>"

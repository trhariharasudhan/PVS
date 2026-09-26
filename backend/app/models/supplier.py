import enum
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, Boolean, Text, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, UUIDPrimaryKeyMixin, TimeStampedModel

if TYPE_CHECKING:
    from app.models.raw_material import RawMaterial
    from app.models.purchase import PurchaseOrder
    from app.models.payment import Payment


class SupplierType(str, enum.Enum):
    SILK_REELER = "SILK_REELER"
    ZARI_MANUFACTURER = "ZARI_MANUFACTURER"
    DYE_CHEMICALS = "DYE_CHEMICALS"
    PACKAGING = "PACKAGING"
    LOOM_SPARES = "LOOM_SPARES"
    GENERAL = "GENERAL"


class Supplier(Base, UUIDPrimaryKeyMixin, TimeStampedModel):
    __tablename__ = "suppliers"

    supplier_code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    supplier_name: Mapped[str] = mapped_column(String(255), nullable=False)
    supplier_type: Mapped[SupplierType] = mapped_column(
        SAEnum(SupplierType, name="supplier_type", native_enum=False),
        default=SupplierType.GENERAL,
        nullable=False,
    )
    contact_person: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str] = mapped_column(String(30), index=True, nullable=False)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    location: Mapped[str] = mapped_column(String(150), nullable=False)
    address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    gstin: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    raw_materials: Mapped[list["RawMaterial"]] = relationship("RawMaterial", back_populates="supplier")
    purchase_orders: Mapped[list["PurchaseOrder"]] = relationship("PurchaseOrder", back_populates="supplier")
    payments: Mapped[list["Payment"]] = relationship("Payment", back_populates="supplier")

    def __repr__(self) -> str:
        return f"<Supplier {self.supplier_code}: {self.supplier_name} ({self.supplier_type})>"

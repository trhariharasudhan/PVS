import enum
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, Text, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, UUIDPrimaryKeyMixin, TimeStampedModel

if TYPE_CHECKING:
    from app.models.order import Order


class CustomerType(str, enum.Enum):
    RETAIL = "RETAIL"
    BOUTIQUE = "BOUTIQUE"
    WHOLESALE_MERCHANT = "WHOLESALE_MERCHANT"
    EXPORTER = "EXPORTER"


class Customer(Base, UUIDPrimaryKeyMixin, TimeStampedModel):
    __tablename__ = "customers"

    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    company_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    customer_type: Mapped[CustomerType] = mapped_column(
        SAEnum(CustomerType, name="customer_type", native_enum=False),
        default=CustomerType.RETAIL,
        nullable=False,
    )
    phone: Mapped[str] = mapped_column(String(30), index=True, nullable=False)
    whatsapp_number: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String(255), index=True, nullable=True)
    gstin: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    state: Mapped[str] = mapped_column(String(100), default="Tamil Nadu", nullable=False)
    shipping_address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    orders: Mapped[list["Order"]] = relationship("Order", back_populates="customer")

    def __repr__(self) -> str:
        return f"<Customer {self.full_name} ({self.customer_type})>"

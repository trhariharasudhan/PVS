import enum
import uuid
from typing import Optional, TYPE_CHECKING
from decimal import Decimal
from datetime import date
from sqlalchemy import String, Text, Numeric, Date, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, UUIDPrimaryKeyMixin, TimeStampedModel

if TYPE_CHECKING:
    from app.models.customer import Customer
    from app.models.supplier import Supplier
    from app.models.order import Order
    from app.models.purchase import PurchaseOrder
    from app.models.user import User
    from app.models.invoice import Invoice


class PaymentType(str, enum.Enum):
    INBOUND_CUSTOMER_PAYMENT = "INBOUND_CUSTOMER_PAYMENT"
    OUTBOUND_SUPPLIER_PAYMENT = "OUTBOUND_SUPPLIER_PAYMENT"


class PaymentMethod(str, enum.Enum):
    BANK_TRANSFER_NEFT_RTGS = "BANK_TRANSFER_NEFT_RTGS"
    UPI = "UPI"
    CHEQUE = "CHEQUE"
    CASH = "CASH"
    TRADE_CREDIT = "TRADE_CREDIT"


class PaymentRecordStatus(str, enum.Enum):
    RECORDED = "RECORDED"
    CLEARED = "CLEARED"
    BOUNCED_FAILED = "BOUNCED_FAILED"
    VOID = "VOID"


class Payment(Base, UUIDPrimaryKeyMixin, TimeStampedModel):
    __tablename__ = "payments"

    payment_number: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    payment_type: Mapped[PaymentType] = mapped_column(
        SAEnum(PaymentType, name="payment_type", native_enum=False),
        index=True,
        nullable=False,
    )
    customer_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("customers.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    supplier_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("suppliers.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    order_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("orders.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    purchase_order_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("purchase_orders.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    invoice_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("invoices.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    payment_method: Mapped[PaymentMethod] = mapped_column(
        SAEnum(PaymentMethod, name="payment_method", native_enum=False),
        nullable=False,
    )
    payment_status: Mapped[PaymentRecordStatus] = mapped_column(
        SAEnum(PaymentRecordStatus, name="payment_record_status", native_enum=False),
        default=PaymentRecordStatus.RECORDED,
        index=True,
        nullable=False,
    )
    reference_transaction_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    payment_date: Mapped[date] = mapped_column(Date, default=date.today, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    recorded_by_user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    # Relationships
    customer: Mapped[Optional["Customer"]] = relationship("Customer")
    supplier: Mapped[Optional["Supplier"]] = relationship("Supplier", back_populates="payments")
    order: Mapped[Optional["Order"]] = relationship("Order")
    purchase_order: Mapped[Optional["PurchaseOrder"]] = relationship("PurchaseOrder", back_populates="payments")
    invoice: Mapped[Optional["Invoice"]] = relationship("Invoice", back_populates="payments")
    recorded_by_user: Mapped[Optional["User"]] = relationship("User")

    def __repr__(self) -> str:
        return f"<Payment {self.payment_number}: {self.payment_type} ₹{self.amount} ({self.payment_status})>"

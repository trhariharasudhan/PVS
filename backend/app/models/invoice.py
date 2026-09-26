import enum
import uuid
from typing import Optional, List, TYPE_CHECKING
from decimal import Decimal
from datetime import date, datetime, timezone
from sqlalchemy import String, Text, Numeric, Date, Boolean, ForeignKey, DateTime, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, UUIDPrimaryKeyMixin, TimeStampedModel

if TYPE_CHECKING:
    from app.models.customer import Customer
    from app.models.supplier import Supplier
    from app.models.order import Order
    from app.models.purchase import PurchaseOrder
    from app.models.user import User
    from app.models.payment import Payment
    from app.models.product import Product
    from app.models.raw_material import RawMaterial


class InvoiceType(str, enum.Enum):
    TAX_INVOICE = "TAX_INVOICE"
    PURCHASE_BILL = "PURCHASE_BILL"
    PROFORMA_INVOICE = "PROFORMA_INVOICE"


class InvoiceStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    ISSUED = "ISSUED"
    PARTIALLY_PAID = "PARTIALLY_PAID"
    PAID = "PAID"
    OVERDUE = "OVERDUE"
    CANCELLED = "CANCELLED"


class Invoice(Base, UUIDPrimaryKeyMixin, TimeStampedModel):
    __tablename__ = "invoices"

    invoice_number: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    invoice_type: Mapped[InvoiceType] = mapped_column(
        SAEnum(InvoiceType, name="invoice_type", native_enum=False),
        default=InvoiceType.TAX_INVOICE,
        index=True,
        nullable=False,
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
    invoice_date: Mapped[date] = mapped_column(Date, default=date.today, nullable=False)
    due_date: Mapped[date] = mapped_column(Date, default=date.today, nullable=False)
    place_of_supply: Mapped[str] = mapped_column(String(100), default="Tamil Nadu (33)", nullable=False)
    customer_gstin: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)

    subtotal_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    cgst_rate: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=Decimal("2.50"), nullable=False)
    cgst_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0.00"), nullable=False)
    sgst_rate: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=Decimal("2.50"), nullable=False)
    sgst_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0.00"), nullable=False)
    igst_rate: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=Decimal("0.00"), nullable=False)
    igst_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0.00"), nullable=False)
    total_tax_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0.00"), nullable=False)
    total_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    paid_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    balance_due: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)

    status: Mapped[InvoiceStatus] = mapped_column(
        SAEnum(InvoiceStatus, name="invoice_status", native_enum=False),
        default=InvoiceStatus.DRAFT,
        index=True,
        nullable=False,
    )
    terms_and_conditions: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_by_user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    # Relationships
    customer: Mapped[Optional["Customer"]] = relationship("Customer")
    supplier: Mapped[Optional["Supplier"]] = relationship("Supplier")
    order: Mapped[Optional["Order"]] = relationship("Order")
    purchase_order: Mapped[Optional["PurchaseOrder"]] = relationship("PurchaseOrder")
    created_by_user: Mapped[Optional["User"]] = relationship("User")
    items: Mapped[list["InvoiceItem"]] = relationship(
        "InvoiceItem",
        back_populates="invoice",
        cascade="all, delete-orphan",
    )
    payments: Mapped[list["Payment"]] = relationship(
        "Payment",
        back_populates="invoice",
    )

    def __repr__(self) -> str:
        return f"<Invoice {self.invoice_number}: {self.invoice_type} ₹{self.total_amount} ({self.status})>"


class InvoiceItem(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "invoice_items"

    invoice_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("invoices.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    product_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("products.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    raw_material_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("raw_materials.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    item_description: Mapped[str] = mapped_column(String(255), nullable=False)
    hsn_sac_code: Mapped[str] = mapped_column(String(20), default="5007", nullable=False)  # 5007 for woven silk sarees
    quantity: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("1.00"), nullable=False)
    unit_of_measure: Mapped[str] = mapped_column(String(50), default="PCS", nullable=False)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    discount_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0.00"), nullable=False)
    taxable_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    gst_rate: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=Decimal("5.00"), nullable=False)
    tax_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    total_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    # Relationships
    invoice: Mapped["Invoice"] = relationship("Invoice", back_populates="items")
    product: Mapped[Optional["Product"]] = relationship("Product")
    raw_material: Mapped[Optional["RawMaterial"]] = relationship("RawMaterial")

    def __repr__(self) -> str:
        return f"<InvoiceItem {self.id}: {self.item_description} x{self.quantity} (HSN: {self.hsn_sac_code})>"

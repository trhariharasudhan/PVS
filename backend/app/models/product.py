import enum
import uuid
from datetime import datetime, timezone
from typing import Optional, TYPE_CHECKING
from decimal import Decimal
from sqlalchemy import String, Text, Numeric, Integer, Boolean, JSON, ForeignKey, DateTime, UniqueConstraint, CheckConstraint, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, UUIDPrimaryKeyMixin, TimeStampedModel

if TYPE_CHECKING:
    from app.models.category import Category
    from app.models.inventory import Inventory
    from app.models.order import OrderItem
    from app.models.production import ProductionBatch


class AvailabilityStatus(str, enum.Enum):
    IN_STOCK = "IN_STOCK"
    MADE_TO_ORDER = "MADE_TO_ORDER"
    LIMITED_WEAVE = "LIMITED_WEAVE"
    BULK_AVAILABLE = "BULK_AVAILABLE"
    OUT_OF_STOCK = "OUT_OF_STOCK"


class Product(Base, UUIDPrimaryKeyMixin, TimeStampedModel):
    __tablename__ = "products"

    # Business identifier (unique, separate from internal PK)
    code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    category_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("categories.id", ondelete="RESTRICT"),
        index=True,
        nullable=False,
    )

    # Textile specifications
    fabric: Mapped[str] = mapped_column(String(150), nullable=False)
    color: Mapped[str] = mapped_column(String(150), nullable=False)
    border: Mapped[str] = mapped_column(String(255), nullable=False)
    pallu: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    motif: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    weave_type: Mapped[str] = mapped_column(String(150), nullable=False)

    # Editorial details
    description: Mapped[str] = mapped_column(Text, nullable=False)
    detailed_story: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Commercial & Pricing
    price: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)
    currency: Mapped[str] = mapped_column(String(3), default="INR", nullable=False)
    is_price_on_enquiry: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    price_note: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Availability & Dimensions
    availability_status: Mapped[AvailabilityStatus] = mapped_column(
        SAEnum(AvailabilityStatus, name="availability_status", native_enum=False),
        default=AvailabilityStatus.IN_STOCK,
        index=True,
        nullable=False,
    )
    saree_length_meters: Mapped[Decimal] = mapped_column(Numeric(4, 2), default=Decimal("5.50"), nullable=False)
    blouse_piece_description: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    weight_approx_grams: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    care_instructions: Mapped[Optional[list[str]]] = mapped_column(JSON, nullable=True)

    # Visibility Flags
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False, index=True, nullable=False)
    is_new_arrival: Mapped[bool] = mapped_column(Boolean, default=False, index=True, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True, nullable=False)

    # Relationships
    category: Mapped["Category"] = relationship("Category", back_populates="products")
    images: Mapped[list["ProductImage"]] = relationship(
        "ProductImage",
        back_populates="product",
        cascade="all, delete-orphan",
        order_by="ProductImage.display_order",
    )
    inventory: Mapped[Optional["Inventory"]] = relationship(
        "Inventory",
        back_populates="product",
        uselist=False,
        cascade="all, delete-orphan",
    )
    order_items: Mapped[list["OrderItem"]] = relationship("OrderItem", back_populates="product")
    production_batches: Mapped[list["ProductionBatch"]] = relationship("ProductionBatch", back_populates="product")
    pricing_tiers: Mapped[list["ProductPricingTier"]] = relationship(
        "ProductPricingTier",
        back_populates="product",
        cascade="all, delete-orphan",
        order_by="ProductPricingTier.min_quantity",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<Product {self.code}: {self.name}>"


class ProductImage(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "product_images"

    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("products.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    image_url: Mapped[str] = mapped_column(String(512), nullable=False)
    alt_text: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    tag: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    product: Mapped["Product"] = relationship("Product", back_populates="images")

    def __repr__(self) -> str:
        return f"<ProductImage {self.id} for Product {self.product_id}>"


class ProductPricingTier(Base, UUIDPrimaryKeyMixin, TimeStampedModel):
    """
    Phase 6-01: B2B Tiered Volume Pricing per SKU.
    Enforces deterministic server-side wholesale volume discounts without client price overrides.
    """
    __tablename__ = "product_pricing_tiers"
    __table_args__ = (
        UniqueConstraint("product_id", "min_quantity", name="uq_product_pricing_tier_min_qty"),
        CheckConstraint("min_quantity >= 1", name="ck_pricing_tier_min_quantity_positive"),
        CheckConstraint("tier_price > 0", name="ck_pricing_tier_price_positive"),
    )

    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("products.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    tier_name: Mapped[str] = mapped_column(String(100), nullable=False)
    min_quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    tier_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    product: Mapped["Product"] = relationship("Product", back_populates="pricing_tiers")

    def __repr__(self) -> str:
        return f"<ProductPricingTier {self.tier_name} (min {self.min_quantity} @ INR {self.tier_price})>"

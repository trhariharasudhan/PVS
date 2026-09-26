import enum
import uuid
from typing import Optional, TYPE_CHECKING
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, UUIDPrimaryKeyMixin, TimeStampedModel

if TYPE_CHECKING:
    from app.models.wholesale import WholesaleEnquiry
    from app.models.inventory import InventoryMovement
    from app.models.customer import Customer


class UserRole(str, enum.Enum):
    SUPER_ADMIN = "SUPER_ADMIN"
    FACTORY_MANAGER = "FACTORY_MANAGER"
    SALES_ADMIN = "SALES_ADMIN"
    DEALER = "DEALER"


class User(Base, UUIDPrimaryKeyMixin, TimeStampedModel):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        SAEnum(UserRole, name="user_role", native_enum=False),
        default=UserRole.SALES_ADMIN,
        nullable=False,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    last_login_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Phase 6-01: B2B Wholesale Dealer Customer Linkage (Tenant Isolation)
    customer_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("customers.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # Relationships
    customer: Mapped[Optional["Customer"]] = relationship(
        "Customer",
        foreign_keys=[customer_id],
        lazy="selectin",
    )
    assigned_enquiries: Mapped[list["WholesaleEnquiry"]] = relationship(
        "WholesaleEnquiry",
        back_populates="assigned_user",
        foreign_keys="WholesaleEnquiry.assigned_to_user_id",
    )
    performed_movements: Mapped[list["InventoryMovement"]] = relationship(
        "InventoryMovement",
        back_populates="performed_by_user",
        foreign_keys="InventoryMovement.performed_by_user_id",
    )

    def __repr__(self) -> str:
        return f"<User {self.email} ({self.role})>"


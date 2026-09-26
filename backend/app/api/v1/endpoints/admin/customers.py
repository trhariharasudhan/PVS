import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.api.deps import require_role
from app.models.user import User, UserRole
from app.services.admin.admin_customer_service import AdminCustomerService
from app.schemas.common import PaginatedResponse
from app.schemas.admin.customer import (
    AdminCustomerList,
    AdminCustomerDetail,
    AdminCustomerCreate,
)

router = APIRouter()


@router.get(
    "",
    response_model=PaginatedResponse[AdminCustomerList],
    summary="Admin List Customers",
    description="Query retail, boutique, and wholesale buyer profiles with total order metrics.",
)
async def list_customers(
    page: int = Query(1, ge=1),
    limit: int = Query(15, ge=1, le=100),
    search: Optional[str] = Query(None),
    customer_type: Optional[str] = Query(None),
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN, UserRole.SALES_ADMIN, UserRole.FACTORY_MANAGER)),
    db: AsyncSession = Depends(get_db),
) -> PaginatedResponse[AdminCustomerList]:
    service = AdminCustomerService(db)
    return await service.list_customers(
        page=page,
        limit=limit,
        search=search,
        customer_type=customer_type,
    )


@router.get(
    "/{customer_id}",
    response_model=AdminCustomerDetail,
    summary="Get Customer Detail",
    description="Retrieve customer profile, contact numbers, and billing/shipping address.",
)
async def get_customer(
    customer_id: uuid.UUID,
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN, UserRole.SALES_ADMIN, UserRole.FACTORY_MANAGER)),
    db: AsyncSession = Depends(get_db),
) -> AdminCustomerDetail:
    service = AdminCustomerService(db)
    return await service.get_customer(customer_id)


@router.post(
    "",
    response_model=AdminCustomerDetail,
    status_code=status.HTTP_201_CREATED,
    summary="Create Customer Profile",
    description="Register a new retail or boutique wholesale merchant customer profile.",
)
async def create_customer(
    payload: AdminCustomerCreate,
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN, UserRole.SALES_ADMIN)),
    db: AsyncSession = Depends(get_db),
) -> AdminCustomerDetail:
    service = AdminCustomerService(db)
    return await service.create_customer(payload)

import uuid
from decimal import Decimal
from typing import Optional, List, Any, Dict
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.api.deps import require_authenticated_user, require_role, require_dealer_user
from app.models.user import User, UserRole
from app.models.customer import Customer
from app.models.product import Product
from app.services.dealer_pricing_service import DealerPricingService
from app.services.dealer_portal_service import DealerPortalService

router = APIRouter()


# ------------------------------------------------------------------------------
# Pydantic Schemas for Phase 6-01 & Phase 6-02
# ------------------------------------------------------------------------------

class PricingTierCreate(BaseModel):
    tier_name: str = Field(..., min_length=2, max_length=100, description="Name of the pricing tier")
    min_quantity: int = Field(..., ge=1, description="Minimum quantity threshold for this tier")
    tier_price: Decimal = Field(..., gt=Decimal("0.00"), description="Wholesale price per unit for this tier")
    is_active: bool = True


class PricingTierResponse(BaseModel):
    id: uuid.UUID
    product_id: uuid.UUID
    tier_name: str
    min_quantity: int
    tier_price: Decimal
    is_active: bool

    model_config = {"from_attributes": True}


class QuoteRequest(BaseModel):
    product_id: uuid.UUID
    quantity: int = Field(..., ge=1, description="Requested purchase quantity")


class QuoteResponse(BaseModel):
    product_id: str
    product_code: str
    product_name: str
    quantity: int
    base_retail_price: float
    effective_unit_price: float
    total_amount: float
    discount_per_unit: float
    total_savings: float
    applied_tier_name: Optional[str] = None
    applied_min_quantity: Optional[int] = None


class DealerProfileResponse(BaseModel):
    user_id: uuid.UUID
    email: str
    full_name: str
    role: str
    customer_id: uuid.UUID
    company_name: Optional[str] = None
    contact_person: str
    gstin: Optional[str] = None
    phone: str
    city: str
    state: str
    shipping_address: Optional[str] = None


# Phase 6-02 Order Schemas
class DealerOrderItemCreate(BaseModel):
    product_id: uuid.UUID
    quantity: int = Field(..., ge=1, description="Order quantity")
    custom_notes: Optional[str] = None


class DealerOrderCreate(BaseModel):
    items: List[DealerOrderItemCreate] = Field(..., min_length=1, description="Order line items")
    notes: Optional[str] = None
    shipping_address_override: Optional[str] = None


class DealerOrderItemResponse(BaseModel):
    id: str
    product_id: str
    product_code: str
    product_name: str
    category_name: Optional[str] = None
    primary_image_url: Optional[str] = None
    unit_price: float
    quantity: int
    line_total: float
    custom_notes: Optional[str] = None


class DealerOrderListResponse(BaseModel):
    id: str
    order_number: str
    order_type: str
    order_status: str
    payment_status: str
    subtotal_amount: float
    tax_amount: float
    total_amount: float
    item_count: int
    invoice_number: Optional[str] = None
    created_at: Optional[str] = None


class DealerOrderDetailResponse(BaseModel):
    id: str
    order_number: str
    order_type: str
    order_status: str
    payment_status: str
    subtotal_amount: float
    tax_amount: float
    shipping_amount: float
    total_amount: float
    notes: Optional[str] = None
    items: List[DealerOrderItemResponse]
    invoices: List[Dict[str, Any]]
    created_at: Optional[str] = None


class DealerCreditSummaryResponse(BaseModel):
    customer_id: str
    credit_limit: float
    outstanding_balance: float
    available_credit: float
    unpaid_invoices_count: int
    credit_period_days: int


# ------------------------------------------------------------------------------
# Dealer Workspace Endpoints (/api/v1/dealer/*)
# ------------------------------------------------------------------------------

@router.get(
    "/profile",
    response_model=DealerProfileResponse,
    summary="Get Dealer Profile",
    description="Retrieve the authenticated dealer's user profile and linked wholesale customer account.",
)
async def get_dealer_profile(
    current_user: User = Depends(require_dealer_user),
    db: AsyncSession = Depends(get_db),
) -> DealerProfileResponse:
    customer = await db.get(Customer, current_user.customer_id)
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Linked wholesale customer profile not found.",
        )

    return DealerProfileResponse(
        user_id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role.value,
        customer_id=customer.id,
        company_name=customer.company_name,
        contact_person=customer.full_name,
        gstin=customer.gstin,
        phone=customer.phone,
        city=customer.city,
        state=customer.state,
        shipping_address=customer.shipping_address,
    )


@router.get(
    "/products",
    summary="Get Dealer Catalogue",
    description="Browse wholesale-eligible products with active volume pricing tiers and live inventory.",
)
async def get_dealer_products(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    category_id: Optional[uuid.UUID] = Query(None),
    current_user: User = Depends(require_dealer_user),
    db: AsyncSession = Depends(get_db),
):
    products, total = await DealerPortalService.get_dealer_catalogue(
        db=db,
        page=page,
        limit=limit,
        search=search,
        category_id=category_id,
    )
    return {
        "items": products,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit if limit else 1,
    }


@router.get(
    "/products/{product_id}",
    summary="Get Dealer Product Detail",
    description="Retrieve single product specifications, gallery, volume tiers, and available stock.",
)
async def get_dealer_product_detail(
    product_id: uuid.UUID,
    current_user: User = Depends(require_dealer_user),
    db: AsyncSession = Depends(get_db),
):
    prod = await DealerPortalService.get_dealer_product_detail(db, product_id)
    if not prod:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found or is inactive.",
        )
    return prod


@router.post(
    "/calculate-quote",
    response_model=QuoteResponse,
    summary="Calculate Tiered Quote",
    description="Deterministic server-side tiered pricing quote generator for wholesale dealers.",
)
async def calculate_quote(
    payload: QuoteRequest,
    current_user: User = Depends(require_dealer_user),
    db: AsyncSession = Depends(get_db),
) -> QuoteResponse:
    prod_data = await DealerPortalService.get_dealer_product_detail(db, payload.product_id)
    if not prod_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID '{payload.product_id}' not found or is inactive.",
        )

    # Reconstitute Product object for pricing engine
    p_obj = await db.get(Product, payload.product_id)
    if not p_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")

    try:
        quote = DealerPricingService.calculate_line_item_quote(p_obj, payload.quantity)
        return QuoteResponse(**quote)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post(
    "/orders",
    status_code=status.HTTP_201_CREATED,
    summary="Create Wholesale Order",
    description="Submit a wholesale order with server-calculated tiered pricing, inventory locking, and credit check.",
)
async def create_dealer_order(
    payload: DealerOrderCreate,
    current_user: User = Depends(require_dealer_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        order_dict = await DealerPortalService.create_dealer_order(
            db=db,
            dealer_user=current_user,
            items=[item.model_dump() for item in payload.items],
            notes=payload.notes,
            shipping_address_override=payload.shipping_address_override,
        )
        return order_dict
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get(
    "/orders",
    summary="List Dealer Orders",
    description="Retrieve paginated order history strictly for the authenticated wholesale dealer.",
)
async def get_dealer_orders(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_dealer_user),
    db: AsyncSession = Depends(get_db),
):
    orders, total = await DealerPortalService.get_dealer_orders(
        db=db,
        customer_id=current_user.customer_id,
        page=page,
        limit=limit,
    )
    return {
        "items": orders,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit if limit else 1,
    }


@router.get(
    "/orders/{order_id}",
    response_model=DealerOrderDetailResponse,
    summary="Get Dealer Order Detail",
    description="Retrieve full order breakdown, line items, and invoice references (Strictly IDOR protected).",
)
async def get_dealer_order_detail(
    order_id: uuid.UUID,
    current_user: User = Depends(require_dealer_user),
    db: AsyncSession = Depends(get_db),
) -> DealerOrderDetailResponse:
    order_data = await DealerPortalService.get_dealer_order_detail(
        db=db,
        customer_id=current_user.customer_id,
        order_id=order_id,
    )
    if not order_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found or you do not have permission to view it.",
        )
    return DealerOrderDetailResponse(**order_data)


@router.get(
    "/credit",
    response_model=DealerCreditSummaryResponse,
    summary="Get Dealer Credit Summary",
    description="Retrieve real-time credit limit, outstanding balance, and available trade credit.",
)
async def get_dealer_credit(
    current_user: User = Depends(require_dealer_user),
    db: AsyncSession = Depends(get_db),
) -> DealerCreditSummaryResponse:
    credit_info = await DealerPortalService.get_dealer_credit_summary(db, current_user.customer_id)
    return DealerCreditSummaryResponse(**credit_info)


@router.get(
    "/ledger",
    summary="Get Dealer Financial Ledger",
    description="Retrieve comprehensive statement of account: invoices, payments, and running balance.",
)
async def get_dealer_ledger(
    current_user: User = Depends(require_dealer_user),
    db: AsyncSession = Depends(get_db),
):
    return await DealerPortalService.get_dealer_ledger_statement(db, current_user.customer_id)


# ------------------------------------------------------------------------------
# Admin Pricing Tier Configuration Endpoints
# ------------------------------------------------------------------------------

@router.post(
    "/admin/products/{product_id}/pricing-tiers",
    response_model=PricingTierResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Product Pricing Tier",
    description="Configure a wholesale volume pricing tier for a product SKU (Admin only).",
)
async def create_product_pricing_tier(
    product_id: uuid.UUID,
    payload: PricingTierCreate,
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN, UserRole.SALES_ADMIN)),
    db: AsyncSession = Depends(get_db),
) -> PricingTierResponse:
    product = await db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")

    try:
        tier = await DealerPricingService.create_pricing_tier(
            db=db,
            product_id=product_id,
            tier_name=payload.tier_name,
            min_quantity=payload.min_quantity,
            tier_price=payload.tier_price,
            is_active=payload.is_active,
        )
        return PricingTierResponse.model_validate(tier)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get(
    "/admin/products/{product_id}/pricing-tiers",
    response_model=List[PricingTierResponse],
    summary="List Product Pricing Tiers",
    description="List all configured wholesale volume pricing tiers for a product (Admin only).",
)
async def list_product_pricing_tiers(
    product_id: uuid.UUID,
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN, UserRole.SALES_ADMIN)),
    db: AsyncSession = Depends(get_db),
) -> List[PricingTierResponse]:
    tiers = await DealerPricingService.get_pricing_tiers_for_product(db, product_id)
    return [PricingTierResponse.model_validate(t) for t in tiers]


@router.delete(
    "/admin/pricing-tiers/{tier_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete Product Pricing Tier",
    description="Remove a wholesale volume pricing tier (Admin only).",
)
async def delete_product_pricing_tier(
    tier_id: uuid.UUID,
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN, UserRole.SALES_ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    deleted = await DealerPricingService.delete_pricing_tier(db, tier_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pricing tier not found.")
    return None

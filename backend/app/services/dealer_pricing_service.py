import uuid
from decimal import Decimal
from typing import Optional, List, Tuple, Dict, Any
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.product import Product, ProductPricingTier


class DealerPricingService:
    """
    Phase 6-01: Deterministic B2B Wholesale Tiered Pricing Engine.
    Enforces server-side volume pricing calculation without client price overrides.
    """

    @staticmethod
    def calculate_tiered_unit_price(
        product: Product,
        quantity: int,
    ) -> Tuple[Decimal, Optional[ProductPricingTier]]:
        """
        Calculates the effective wholesale unit price for a given product and quantity.
        Deterministic Algorithm:
        1. Validates quantity >= 1.
        2. Filters active pricing tiers where tier.min_quantity <= quantity.
        3. Selects the tier with the highest min_quantity.
        4. If matching tier exists, returns (tier.tier_price, tier).
        5. If no tier matches, falls back to product.price (retail MSRP).
        """
        if quantity is None or not isinstance(quantity, int) or quantity < 1:
            raise ValueError(f"Order quantity must be an integer >= 1 (received {quantity}).")

        # Extract active pricing tiers
        active_tiers = [
            tier for tier in (product.pricing_tiers or [])
            if tier.is_active and tier.min_quantity <= quantity
        ]

        if active_tiers:
            # Select the tier with the highest qualifying min_quantity threshold
            best_tier = max(active_tiers, key=lambda t: t.min_quantity)
            return Decimal(str(best_tier.tier_price)), best_tier

        # Fallback to standard product price
        if product.price is None:
            raise ValueError(f"Product '{product.code}' has no base pricing configured.")

        return Decimal(str(product.price)), None

    @staticmethod
    def validate_moq(
        product: Product,
        quantity: int,
        moq_threshold: int = 1,
    ) -> bool:
        """
        Validates whether the requested quantity satisfies the minimum order quantity (MOQ).
        """
        if quantity < moq_threshold:
            raise ValueError(
                f"Requested quantity ({quantity}) is below the Minimum Order Quantity ({moq_threshold}) for '{product.name}'."
            )
        return True

    @classmethod
    def calculate_line_item_quote(
        cls,
        product: Product,
        quantity: int,
        moq_threshold: int = 1,
    ) -> Dict[str, Any]:
        """
        Generates a comprehensive line-item price breakdown with tiered discount calculation.
        """
        cls.validate_moq(product, quantity, moq_threshold)
        unit_price, applied_tier = cls.calculate_tiered_unit_price(product, quantity)
        base_price = Decimal(str(product.price or unit_price))

        total_amount = (unit_price * Decimal(quantity)).quantize(Decimal("0.01"))
        discount_per_unit = (base_price - unit_price).quantize(Decimal("0.01"))
        total_savings = (discount_per_unit * Decimal(quantity)).quantize(Decimal("0.01"))

        return {
            "product_id": str(product.id),
            "product_code": product.code,
            "product_name": product.name,
            "quantity": quantity,
            "base_retail_price": float(base_price),
            "effective_unit_price": float(unit_price),
            "total_amount": float(total_amount),
            "discount_per_unit": float(discount_per_unit),
            "total_savings": float(total_savings),
            "applied_tier_name": applied_tier.tier_name if applied_tier else None,
            "applied_min_quantity": applied_tier.min_quantity if applied_tier else None,
        }

    # --------------------------------------------------------------------------
    # Database Operations for Managing Pricing Tiers
    # --------------------------------------------------------------------------

    @staticmethod
    async def create_pricing_tier(
        db: AsyncSession,
        product_id: uuid.UUID,
        tier_name: str,
        min_quantity: int,
        tier_price: Decimal,
        is_active: bool = True,
    ) -> ProductPricingTier:
        """Create a new wholesale pricing tier for a product."""
        if min_quantity < 1:
            raise ValueError("Minimum quantity for a pricing tier must be >= 1.")
        if tier_price <= Decimal("0.00"):
            raise ValueError("Tier price must be strictly positive (> 0).")

        tier = ProductPricingTier(
            id=uuid.uuid4(),
            product_id=product_id,
            tier_name=tier_name.strip(),
            min_quantity=min_quantity,
            tier_price=tier_price,
            is_active=is_active,
        )
        db.add(tier)
        await db.commit()
        await db.refresh(tier)
        return tier

    @staticmethod
    async def get_pricing_tiers_for_product(
        db: AsyncSession,
        product_id: uuid.UUID,
    ) -> List[ProductPricingTier]:
        """Fetch all pricing tiers for a given product ordered by min_quantity."""
        query = (
            select(ProductPricingTier)
            .where(ProductPricingTier.product_id == product_id)
            .order_by(ProductPricingTier.min_quantity.asc())
        )
        res = await db.execute(query)
        return list(res.scalars().all())

    @staticmethod
    async def delete_pricing_tier(
        db: AsyncSession,
        tier_id: uuid.UUID,
    ) -> bool:
        """Delete a pricing tier by ID."""
        stmt = delete(ProductPricingTier).where(ProductPricingTier.id == tier_id)
        res = await db.execute(stmt)
        await db.commit()
        return res.rowcount > 0

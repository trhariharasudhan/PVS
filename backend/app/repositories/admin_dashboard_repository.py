from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.product import Product, AvailabilityStatus
from app.models.category import Category
from app.models.wholesale import WholesaleEnquiry, EnquiryStatus
from app.models.inventory import Inventory
from app.models.production import ProductionBatch, BatchStatus
from app.models.order import Order, OrderStatus
from app.models.supplier import Supplier
from app.models.raw_material import RawMaterial, RawMaterialStock
from app.models.purchase import PurchaseOrder, PurchaseOrderStatus
from app.models.payment import Payment
from app.schemas.admin.dashboard import AdminDashboardMetrics, RecentProductSummary


class AdminDashboardRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_metrics(self) -> AdminDashboardMetrics:
        """Query real database aggregates across products, categories, inventory, production, orders, suppliers, raw materials, purchases, and payments."""
        # 1. Total Active Products
        active_prod_q = select(func.count(Product.id)).where(Product.is_active.is_(True))
        active_prods = (await self.session.execute(active_prod_q)).scalar() or 0

        # 2. Total Inactive Products
        inactive_prod_q = select(func.count(Product.id)).where(Product.is_active.is_(False))
        inactive_prods = (await self.session.execute(inactive_prod_q)).scalar() or 0

        # 3. Featured Products
        featured_prod_q = select(func.count(Product.id)).where(
            Product.is_active.is_(True),
            Product.is_featured.is_(True),
        )
        featured_prods = (await self.session.execute(featured_prod_q)).scalar() or 0

        # 4. Out of Stock Products
        oos_q = select(func.count(Product.id)).where(
            Product.is_active.is_(True),
            Product.availability_status == AvailabilityStatus.OUT_OF_STOCK,
        )
        oos_prods = (await self.session.execute(oos_q)).scalar() or 0

        # 5. Made to Order Products
        mto_q = select(func.count(Product.id)).where(
            Product.is_active.is_(True),
            Product.availability_status == AvailabilityStatus.MADE_TO_ORDER,
        )
        mto_prods = (await self.session.execute(mto_q)).scalar() or 0

        # 6. Total Categories
        cat_q = select(func.count(Category.id))
        total_cats = (await self.session.execute(cat_q)).scalar() or 0

        # 7. Wholesale Enquiries
        enq_q = select(func.count(WholesaleEnquiry.id)).where(WholesaleEnquiry.status == EnquiryStatus.NEW)
        new_enqs = (await self.session.execute(enq_q)).scalar() or 0

        neg_q = select(func.count(WholesaleEnquiry.id)).where(WholesaleEnquiry.status == EnquiryStatus.NEGOTIATING)
        active_negs = (await self.session.execute(neg_q)).scalar() or 0

        conv_q = select(func.count(WholesaleEnquiry.id)).where(WholesaleEnquiry.status == EnquiryStatus.CONVERTED_TO_ORDER)
        conv_enqs = (await self.session.execute(conv_q)).scalar() or 0

        # 8. Saree Inventory Telemetry
        inv_units_q = select(func.sum(Inventory.quantity_on_hand))
        total_inv_units = (await self.session.execute(inv_units_q)).scalar() or 0

        inv_tracked_q = select(func.count(Inventory.id))
        total_tracked_prods = (await self.session.execute(inv_tracked_q)).scalar() or 0

        inv_in_stock_q = select(func.count(Inventory.id)).where(
            Inventory.quantity_on_hand > Inventory.reorder_threshold
        )
        inv_in_stock = (await self.session.execute(inv_in_stock_q)).scalar() or 0

        inv_low_stock_q = select(func.count(Inventory.id)).where(
            Inventory.quantity_on_hand > 0,
            Inventory.quantity_on_hand <= Inventory.reorder_threshold,
        )
        inv_low_stock = (await self.session.execute(inv_low_stock_q)).scalar() or 0

        # 9. Production Telemetry
        prod_active_q = select(func.count(ProductionBatch.id)).where(
            ProductionBatch.status.notin_([BatchStatus.COMPLETED, BatchStatus.ABORTED])
        )
        active_batches = (await self.session.execute(prod_active_q)).scalar() or 0

        prod_in_prog_q = select(func.count(ProductionBatch.id)).where(
            ProductionBatch.status.in_([
                BatchStatus.WARPING,
                BatchStatus.WEAVING_IN_PROGRESS,
                BatchStatus.FINISHING,
                BatchStatus.QUALITY_CHECK,
            ])
        )
        in_prog_batches = (await self.session.execute(prod_in_prog_q)).scalar() or 0

        prod_completed_q = select(func.count(ProductionBatch.id)).where(
            ProductionBatch.status == BatchStatus.COMPLETED
        )
        completed_batches = (await self.session.execute(prod_completed_q)).scalar() or 0

        # 10. Orders Telemetry
        ord_pending_q = select(func.count(Order.id)).where(Order.order_status == OrderStatus.PENDING)
        pending_ords = (await self.session.execute(ord_pending_q)).scalar() or 0

        ord_conf_q = select(func.count(Order.id)).where(Order.order_status == OrderStatus.CONFIRMED)
        conf_ords = (await self.session.execute(ord_conf_q)).scalar() or 0

        # 11. Procurement & Material Telemetry (Phase 4C-C)
        sup_q = select(func.count(Supplier.id)).where(Supplier.is_active.is_(True))
        total_sups = (await self.session.execute(sup_q)).scalar() or 0

        rm_q = select(func.count(RawMaterial.id)).where(RawMaterial.is_active.is_(True))
        total_rms = (await self.session.execute(rm_q)).scalar() or 0

        rm_low_q = (
            select(func.count(RawMaterial.id))
            .join(RawMaterial.stock)
            .where(
                RawMaterial.is_active.is_(True),
                RawMaterialStock.quantity_on_hand <= RawMaterial.reorder_level,
            )
        )
        low_stock_rms = (await self.session.execute(rm_low_q)).scalar() or 0

        po_pending_q = select(func.count(PurchaseOrder.id)).where(
            PurchaseOrder.status.in_([
                PurchaseOrderStatus.DRAFT,
                PurchaseOrderStatus.ORDERED,
                PurchaseOrderStatus.PARTIALLY_RECEIVED,
            ])
        )
        pending_pos = (await self.session.execute(po_pending_q)).scalar() or 0

        pay_q = select(func.count(Payment.id))
        total_payments = (await self.session.execute(pay_q)).scalar() or 0

        # 12. Recent 5 Products
        recent_q = (
            select(Product)
            .options(selectinload(Product.category))
            .order_by(Product.updated_at.desc(), Product.created_at.desc())
            .limit(5)
        )
        recent_res = await self.session.execute(recent_q)
        recent_items = recent_res.scalars().all()

        recent_summaries = [
            RecentProductSummary(
                id=p.id,
                code=p.code,
                name=p.name,
                category_name=p.category.name if p.category else "General",
                availability_status=p.availability_status,
                is_active=p.is_active,
                created_at=p.created_at,
                updated_at=p.updated_at,
            )
            for p in recent_items
        ]

        return AdminDashboardMetrics(
            total_active_products=active_prods,
            total_inactive_products=inactive_prods,
            total_featured_products=featured_prods,
            out_of_stock_products=oos_prods,
            made_to_order_products=mto_prods,
            total_categories=total_cats,
            new_wholesale_enquiries=new_enqs,
            total_inventory_units=total_inv_units,
            total_tracked_products=total_tracked_prods,
            in_stock_products=inv_in_stock,
            low_stock_products=inv_low_stock,
            active_production_batches=active_batches,
            in_progress_production_batches=in_prog_batches,
            completed_production_batches=completed_batches,
            pending_orders=pending_ords,
            confirmed_orders=conf_ords,
            active_crm_negotiations=active_negs,
            converted_crm_enquiries=conv_enqs,
            total_suppliers=total_sups,
            total_raw_materials=total_rms,
            low_stock_raw_materials=low_stock_rms,
            pending_purchase_orders=pending_pos,
            recorded_payments_count=total_payments,
            recent_products=recent_summaries,
        )

import uuid
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.models.product import AvailabilityStatus


class RecentProductSummary(BaseModel):
    id: uuid.UUID
    code: str
    name: str
    category_name: str
    availability_status: AvailabilityStatus
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AdminDashboardMetrics(BaseModel):
    total_active_products: int
    total_inactive_products: int
    total_featured_products: int
    out_of_stock_products: int
    made_to_order_products: int
    total_categories: int
    new_wholesale_enquiries: int

    # Finished Saree Inventory KPIs
    total_inventory_units: int = 0
    total_tracked_products: int = 0
    in_stock_products: int = 0
    low_stock_products: int = 0

    # Production KPIs
    active_production_batches: int = 0
    in_progress_production_batches: int = 0
    completed_production_batches: int = 0

    # Sales & CRM KPIs
    pending_orders: int = 0
    confirmed_orders: int = 0
    active_crm_negotiations: int = 0
    converted_crm_enquiries: int = 0

    # Procurement & Material KPIs (Phase 4C-C)
    total_suppliers: int = 0
    total_raw_materials: int = 0
    low_stock_raw_materials: int = 0
    pending_purchase_orders: int = 0
    recorded_payments_count: int = 0

    recent_products: List[RecentProductSummary]

    model_config = ConfigDict(from_attributes=True)

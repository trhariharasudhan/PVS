from fastapi import APIRouter
from app.api.v1.endpoints import health, categories, products, wholesale, contact, auth, dealer, webhooks, communications

from app.api.v1.endpoints.admin import dashboard as admin_dashboard
from app.api.v1.endpoints.admin import products as admin_products
from app.api.v1.endpoints.admin import categories as admin_categories
from app.api.v1.endpoints.admin import inventory as admin_inventory
from app.api.v1.endpoints.admin import production as admin_production
from app.api.v1.endpoints.admin import customers as admin_customers
from app.api.v1.endpoints.admin import orders as admin_orders
from app.api.v1.endpoints.admin import wholesale as admin_wholesale
from app.api.v1.endpoints.admin import suppliers as admin_suppliers
from app.api.v1.endpoints.admin import raw_materials as admin_raw_materials
from app.api.v1.endpoints.admin import purchases as admin_purchases
from app.api.v1.endpoints.admin import payments as admin_payments
from app.api.v1.endpoints.admin import invoices as admin_invoices
from app.api.v1.endpoints.admin import finance as admin_finance
from app.api.v1.endpoints.admin import reports as admin_reports

api_router = APIRouter()

# Public & Staff Auth Routers
api_router.include_router(health.router, tags=["Health"])
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication & Staff"])
api_router.include_router(categories.router, prefix="/categories", tags=["Public Categories"])
api_router.include_router(products.router, prefix="/products", tags=["Public Products"])
api_router.include_router(wholesale.router, prefix="/wholesale-enquiries", tags=["Public Wholesale Enquiries"])
api_router.include_router(contact.router, prefix="/contact", tags=["Public Contact"])

# Phase 6-01: B2B Wholesale Dealer & Tiered Pricing Routers
api_router.include_router(dealer.router, prefix="/dealer", tags=["B2B Dealer Workspace & Tiered Pricing"])

# Phase 6-03: Payment Gateway Webhooks Ingestion & Reconciliation
api_router.include_router(webhooks.router, prefix="/webhooks", tags=["Payment Gateway Webhooks"])

# Phase 6-04: Transactional Communications Engine
api_router.include_router(communications.router, prefix="/communications", tags=["Transactional Communications"])



# Admin Operations Workspace Routers
api_router.include_router(admin_dashboard.router, prefix="/admin/dashboard", tags=["Admin Dashboard"])
api_router.include_router(admin_products.router, prefix="/admin/products", tags=["Admin Products"])
api_router.include_router(admin_categories.router, prefix="/admin/categories", tags=["Admin Categories"])
api_router.include_router(admin_inventory.router, prefix="/admin/inventory", tags=["Admin Inventory & Stock"])
api_router.include_router(admin_production.router, prefix="/admin/production", tags=["Admin Loom Production"])
api_router.include_router(admin_customers.router, prefix="/admin/customers", tags=["Admin Customers"])
api_router.include_router(admin_orders.router, prefix="/admin/orders", tags=["Admin Orders & Sales"])
api_router.include_router(admin_wholesale.router, prefix="/admin/wholesale", tags=["Admin Wholesale CRM"])
api_router.include_router(admin_suppliers.router, prefix="/admin/suppliers", tags=["Admin Suppliers"])
api_router.include_router(admin_raw_materials.router, prefix="/admin/raw-materials", tags=["Admin Raw Materials & Stock"])
api_router.include_router(admin_purchases.router, prefix="/admin/purchases", tags=["Admin Purchasing & Material Receiving"])
api_router.include_router(admin_payments.router, prefix="/admin/payments", tags=["Admin Payments Foundation"])
api_router.include_router(admin_invoices.router, prefix="/admin/invoices", tags=["Admin Invoices & Tax Billing"])
api_router.include_router(admin_finance.router, prefix="/admin/finance", tags=["Admin Finance & Outstanding Balances"])
api_router.include_router(admin_reports.router, prefix="/admin/reports", tags=["Admin Business Analytics & Reports"])


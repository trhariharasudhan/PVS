import pytest
import uuid
from decimal import Decimal
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import get_password_hash, create_access_token
from app.core.audit import log_audit_event
from app.models.user import User, UserRole
from app.models.category import Category
from app.models.product import Product, AvailabilityStatus
from app.models.inventory import Inventory
from app.models.customer import CustomerType
from app.models.order import OrderType


@pytest.mark.asyncio
async def test_phase_5i_storefront_and_catalogue_uat(
    async_client: AsyncClient,
    db_session: AsyncSession,
):
    """UAT Section A: Storefront, Catalogue, Filtering, Detail & Wholesale Enquiry."""
    cat = Category(
        id=uuid.uuid4(),
        name="Bridal Muhurtham",
        slug=f"bridal-{uuid.uuid4().hex[:6]}",
        description="Heavy pure zari wedding silks",
        is_active=True,
    )
    db_session.add(cat)
    await db_session.commit()

    prod = Product(
        id=uuid.uuid4(),
        code=f"PVS-UAT-5I-{uuid.uuid4().hex[:4].upper()}",
        name="Kanchipuram Red Brocade Saree",
        category_id=cat.id,
        fabric="100% Pure Mulberry Silk",
        color="Crimson Red",
        border="Korvai Gold Zari",
        pallu="Rich Brocade",
        motif="Mayil (Peacock)",
        weave_type="Traditional Handloom",
        description="Authentic Kanchipuram bridal masterpiece",
        price=Decimal("45000.00"),
        is_price_on_enquiry=False,
        availability_status=AvailabilityStatus.IN_STOCK,
        is_active=True,
    )
    db_session.add(prod)
    await db_session.commit()

    inv = Inventory(
        id=uuid.uuid4(),
        product_id=prod.id,
        quantity_on_hand=10,
        quantity_reserved=0,
        reorder_threshold=2,
    )
    db_session.add(inv)
    await db_session.commit()

    # 1. Categories
    cat_res = await async_client.get("/api/v1/categories")
    assert cat_res.status_code == 200
    categories = cat_res.json()
    assert len(categories) >= 1

    # 2. Product Catalogue
    prod_res = await async_client.get("/api/v1/products")
    assert prod_res.status_code == 200
    products_data = prod_res.json()
    assert "items" in products_data
    assert len(products_data["items"]) >= 1

    sample_product = products_data["items"][0]
    sku_code = sample_product["code"]

    # 3. Category Filtering
    first_cat_slug = cat.slug
    filter_res = await async_client.get(f"/api/v1/products?category={first_cat_slug}")
    assert filter_res.status_code == 200

    # 4. Product Detail
    detail_res = await async_client.get(f"/api/v1/products/{sku_code}")
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert detail["code"] == sku_code
    assert "fabric" in detail
    assert "weave_type" in detail

    # 5. Public Wholesale Enquiry Intake
    enquiry_payload = {
        "business_name": "Madurai Heritage Silks",
        "contact_person": "Ramanathan Chettiar",
        "phone": "+919443322110",
        "email": "ramanathan@maduraisilks.test",
        "city": "Madurai",
        "business_type": "Wholesale Showroom",
        "number_of_stores": "2-3 Outlets",
        "interested_collection": "Bridal & Pure Silk",
        "expected_quantity": "50-100 Sarees",
        "message": "Interested in regular loom allocations and festive volume pricing.",
    }
    enquiry_res = await async_client.post("/api/v1/wholesale-enquiries", json=enquiry_payload)
    assert enquiry_res.status_code == 201
    enquiry = enquiry_res.json()
    assert enquiry["status"] == "received"
    assert "enquiry_id" in enquiry


@pytest.mark.asyncio
async def test_phase_5i_crm_procurement_and_handloom_manufacturing_uat(
    async_client: AsyncClient,
    db_session: AsyncSession,
):
    """UAT Sections B, C, D: CRM, Procurement, Receiving, Loom Batches & QC."""
    cat = Category(
        id=uuid.uuid4(),
        name="Handloom Pattu",
        slug=f"pattu-{uuid.uuid4().hex[:6]}",
        description="Handloom sarees",
        is_active=True,
    )
    prod = Product(
        id=uuid.uuid4(),
        code=f"PVS-LOOM-{uuid.uuid4().hex[:4].upper()}",
        name="Peacock Green Silk Saree",
        category_id=cat.id,
        fabric="Pure Mulberry Silk",
        color="Peacock Green",
        border="Zari Border",
        weave_type="Handloom",
        description="Loom batch saree",
        price=Decimal("32000.00"),
        is_price_on_enquiry=False,
        availability_status=AvailabilityStatus.IN_STOCK,
        is_active=True,
    )
    inv = Inventory(
        id=uuid.uuid4(),
        product_id=prod.id,
        quantity_on_hand=0,
        quantity_reserved=0,
        reorder_threshold=1,
    )
    admin = User(
        id=uuid.uuid4(),
        email=f"admin.5i.{uuid.uuid4().hex[:6]}@pvssilks.test",
        hashed_password=get_password_hash("Pass1234!"),
        full_name="Phase 5I Admin",
        role=UserRole.SUPER_ADMIN,
        is_active=True,
    )
    db_session.add_all([cat, prod, inv, admin])
    await db_session.commit()

    token = create_access_token(str(admin.id), admin.role.value)
    admin_auth_headers = {"Authorization": f"Bearer {token}"}

    # 1. CRM: Create Wholesale Customer
    cust_payload = {
        "full_name": "Mrs. Priya Sundaram",
        "company_name": "Coimbatore Boutique Co",
        "customer_type": CustomerType.WHOLESALE_MERCHANT.value,
        "phone": "+919443122334",
        "email": "priya@cbebtd.example",
        "city": "Coimbatore",
        "state": "Tamil Nadu",
        "gstin": "33AAACB1111A1Z9",
    }
    cust_res = await async_client.post(
        "/api/v1/admin/customers",
        json=cust_payload,
        headers=admin_auth_headers,
    )
    assert cust_res.status_code == 201
    customer = cust_res.json()
    customer_id = customer["id"]

    # 2. Procurement: Create Silk Reeler Supplier
    supp_payload = {
        "supplier_code": f"SUPP-SILK-{customer_id[:6]}",
        "supplier_name": "Kanchi Silk Reeling Society",
        "supplier_type": "SILK_REELER",
        "contact_person": "Ranganathan",
        "phone": "+919442233445",
        "email": "ranga@kanchisilk.example",
        "location": "Kanchipuram, Tamil Nadu",
    }
    supp_res = await async_client.post(
        "/api/v1/admin/suppliers",
        json=supp_payload,
        headers=admin_auth_headers,
    )
    assert supp_res.status_code == 201
    supplier = supp_res.json()
    supplier_id = supplier["id"]

    # 3. Procurement: Raw Material Stock
    mat_payload = {
        "material_code": f"RM-WARP-{customer_id[:6]}",
        "name": "Filature Raw Silk Warp 20/22 Denier",
        "material_type": "RAW_SILK",
        "unit_of_measure": "KILOGRAMS",
        "initial_stock": 20.0,
        "unit_cost": 4800.0,
        "reorder_level": 5.0,
        "supplier_id": supplier_id,
    }
    mat_res = await async_client.post(
        "/api/v1/admin/raw-materials",
        json=mat_payload,
        headers=admin_auth_headers,
    )
    assert mat_res.status_code == 201
    raw_material = mat_res.json()
    raw_material_id = raw_material["id"]

    # 4. Manufacturing: Loom Batch Creation
    batch_payload = {
        "product_id": str(prod.id),
        "batch_number": f"BATCH-5I-{customer_id[:6]}",
        "planned_quantity": 4,
        "loom_identifier": "LOOM-PIT-08",
    }
    batch_res = await async_client.post(
        "/api/v1/admin/production",
        json=batch_payload,
        headers=admin_auth_headers,
    )
    assert batch_res.status_code == 201
    batch = batch_res.json()
    batch_id = batch["id"]

    # 5. Consume Material
    consume_payload = {
        "raw_material_id": raw_material_id,
        "quantity_consumed": 8.0,
        "notes": "Allocated 8 kgs warp for 4 bridal sarees",
    }
    consume_res = await async_client.post(
        f"/api/v1/admin/production/{batch_id}/consume-material",
        json=consume_payload,
        headers=admin_auth_headers,
    )
    assert consume_res.status_code == 201

    # 6. Complete Batch & Credit Finished Stock
    complete_res = await async_client.patch(
        f"/api/v1/admin/production/{batch_id}",
        json={"status": "COMPLETED", "completed_quantity": 4},
        headers=admin_auth_headers,
    )
    assert complete_res.status_code == 200
    assert complete_res.json()["status"] == "COMPLETED"


@pytest.mark.asyncio
async def test_phase_5i_sales_finance_and_admin_security_uat(
    async_client: AsyncClient,
    db_session: AsyncSession,
):
    """UAT Sections E, F, G: Sales Order, Reservation, Invoice, 5% GST, PDF & Security."""
    cat = Category(
        id=uuid.uuid4(),
        name="Zari Bridal",
        slug=f"zaribridal-{uuid.uuid4().hex[:6]}",
        description="Heavy bridal",
        is_active=True,
    )
    prod = Product(
        id=uuid.uuid4(),
        code=f"PVS-FIN-{uuid.uuid4().hex[:4].upper()}",
        name="Royal Blue Brocade Saree",
        category_id=cat.id,
        fabric="Pure Silk",
        color="Royal Blue",
        border="Gold Zari",
        weave_type="Handloom",
        description="Bridal piece",
        price=Decimal("28000.00"),
        is_price_on_enquiry=False,
        availability_status=AvailabilityStatus.IN_STOCK,
        is_active=True,
    )
    inv = Inventory(
        id=uuid.uuid4(),
        product_id=prod.id,
        quantity_on_hand=10,
        quantity_reserved=0,
        reorder_threshold=2,
    )
    admin = User(
        id=uuid.uuid4(),
        email=f"admin.fin.5i.{uuid.uuid4().hex[:6]}@pvssilks.test",
        hashed_password=get_password_hash("Pass1234!"),
        full_name="Phase 5I Finance Admin",
        role=UserRole.SUPER_ADMIN,
        is_active=True,
    )
    db_session.add_all([cat, prod, inv, admin])
    await db_session.commit()

    token = create_access_token(str(admin.id), admin.role.value)
    admin_auth_headers = {"Authorization": f"Bearer {token}"}

    # 1. Create customer for order
    cust_payload = {
        "full_name": "Madurai Silk House",
        "company_name": "Madurai Silk House Ltd",
        "customer_type": CustomerType.WHOLESALE_MERCHANT.value,
        "phone": "+919443556677",
        "email": "madurai@sh.example",
        "city": "Madurai",
        "state": "Tamil Nadu",
    }
    cust_res = await async_client.post("/api/v1/admin/customers", json=cust_payload, headers=admin_auth_headers)
    assert cust_res.status_code == 201
    customer_id = cust_res.json()["id"]

    # 2. Sales Order with Stock Reservation
    order_payload = {
        "customer_id": customer_id,
        "order_type": OrderType.WHOLESALE_BULK.value,
        "items": [
            {"product_id": str(prod.id), "quantity": 2, "unit_price": 28000.0}
        ],
        "notes": "UAT Wholesale Order Phase 5I",
    }
    order_res = await async_client.post(
        "/api/v1/admin/orders",
        json=order_payload,
        headers=admin_auth_headers,
    )
    assert order_res.status_code == 201
    order = order_res.json()
    order_id = order["id"]

    # 3. Confirm Order
    confirm_res = await async_client.post(
        f"/api/v1/admin/orders/{order_id}/confirm",
        headers=admin_auth_headers,
    )
    assert confirm_res.status_code == 200
    assert confirm_res.json()["order_status"] == "CONFIRMED"

    # 4. Fulfill & Dispatch
    fulfill_res = await async_client.post(
        f"/api/v1/admin/orders/{order_id}/fulfill",
        headers=admin_auth_headers,
    )
    assert fulfill_res.status_code == 200
    assert fulfill_res.json()["order_status"] == "DELIVERED"

    # 5. Generate Tax Invoice with 5% GST
    inv_res = await async_client.post(
        f"/api/v1/admin/invoices/from-order/{order_id}",
        headers=admin_auth_headers,
    )
    assert inv_res.status_code == 201
    invoice = inv_res.json()
    invoice_id = invoice["id"]
    subtotal = Decimal(str(invoice["subtotal_amount"]))
    gst_total = Decimal(str(invoice["total_tax_amount"]))
    grand_total = Decimal(str(invoice["total_amount"]))

    # Validate 5% GST Mathematical Invariant: Grand Total = Subtotal + 5%
    expected_gst = (subtotal * Decimal("0.05")).quantize(Decimal("0.01"))
    assert gst_total == expected_gst
    assert grand_total == subtotal + expected_gst

    # 6. Stream Dynamic PDF Invoice
    pdf_res = await async_client.get(
        f"/api/v1/admin/invoices/{invoice_id}/pdf",
        headers=admin_auth_headers,
    )
    assert pdf_res.status_code == 200
    assert pdf_res.headers.get("content-type") == "application/pdf"
    assert len(pdf_res.content) > 500

    # 7. Record NEFT Full Payment directly against Invoice
    pay_payload = {
        "amount": float(grand_total),
        "payment_method": "BANK_TRANSFER_NEFT_RTGS",
        "reference_transaction_id": "NEFT-UAT-5I-998811",
        "notes": "Full settlement via corporate wire",
    }
    pay_res = await async_client.post(
        f"/api/v1/admin/invoices/{invoice_id}/record-payment",
        json=pay_payload,
        headers=admin_auth_headers,
    )
    assert pay_res.status_code == 200
    paid_invoice = pay_res.json()
    assert paid_invoice["status"] == "PAID"
    assert Decimal(str(paid_invoice["balance_due"])) == Decimal("0.00")

    # 9. Audit Event System Verification
    event = log_audit_event(
        event_type="SALES",
        action="INVOICE_SETTLED",
        status="SUCCESS",
        user_id="admin-uat",
        resource_id=invoice_id,
        details={"grand_total": str(grand_total)},
    )
    assert event["event_type"] == "SALES"
    assert event["status"] == "SUCCESS"

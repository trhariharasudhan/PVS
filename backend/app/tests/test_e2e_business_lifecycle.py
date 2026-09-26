import pytest
import uuid
from datetime import date
from decimal import Decimal
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.security import get_password_hash, create_access_token
from app.models.user import User, UserRole
from app.models.product import AvailabilityStatus
from app.models.customer import CustomerType
from app.models.order import PaymentStatus


@pytest.mark.asyncio
async def test_complete_end_to_end_business_lifecycle(
    async_client: AsyncClient,
    db_session: AsyncSession,
):
    """
    Complete End-to-End Business Lifecycle Test for PVS Silk S.
    Validates all 31 stages from Staff Setup -> Procurement -> Weaving Production
    -> Finished Goods -> Wholesale CRM -> Orders -> Invoicing -> Settlement -> Reports.
    """
    # ---------------------------------------------------------
    # 1. Staff Admin Setup & Authentication
    # ---------------------------------------------------------
    admin_id = uuid.uuid4()
    admin_email = f"e2e.admin.{uuid.uuid4().hex[:6]}@pvssilks.test"
    admin_pass = "E2E_Secure_Admin_Pass_2026!"
    admin_user = User(
        id=admin_id,
        email=admin_email,
        hashed_password=get_password_hash(admin_pass),
        full_name="E2E Super Administrator",
        role=UserRole.SUPER_ADMIN,
        is_active=True,
    )
    db_session.add(admin_user)
    await db_session.commit()

    login_resp = await async_client.post(
        "/api/v1/auth/login",
        json={"email": admin_email, "password": admin_pass},
    )
    assert login_resp.status_code == 200
    assert "user" in login_resp.json()

    token = create_access_token(subject=str(admin_user.id), role=admin_user.role.value)
    headers = {"Authorization": f"Bearer {token}"}

    # ---------------------------------------------------------
    # 2. Master Category & Product Creation
    # ---------------------------------------------------------
    cat_payload = {
        "name": "E2E Bridal Heritage",
        "slug": f"e2e-bridal-{uuid.uuid4().hex[:6]}",
        "tagline": "Handwoven Grandeur",
        "description": "Pure Mulberry silk handloom wedding sarees.",
        "display_order": 1,
        "is_active": True,
    }
    cat_resp = await async_client.post("/api/v1/admin/categories", json=cat_payload, headers=headers)
    assert cat_resp.status_code == 201
    category_id = cat_resp.json()["id"]

    prod_code = f"PVS-E2E-{uuid.uuid4().hex[:4].upper()}"
    prod_payload = {
        "code": prod_code,
        "name": "E2E Royal Crimson Brocade Saree",
        "category_id": category_id,
        "fabric": "Pure Silk",
        "color": "Crimson & Gold",
        "border": "Korvai Zari Border",
        "weave_type": "Korvai Handloom",
        "description": "Artisan woven pure silk.",
        "price": "35000.00",
        "availability_status": AvailabilityStatus.IN_STOCK.value,
        "is_featured": True,
        "is_active": True,
    }
    prod_resp = await async_client.post("/api/v1/admin/products", json=prod_payload, headers=headers)
    assert prod_resp.status_code == 201
    product_id = prod_resp.json()["id"]

    # ---------------------------------------------------------
    # 3. Supplier Management & Raw Material Setup
    # ---------------------------------------------------------
    sup_code = f"SUP-E2E-{uuid.uuid4().hex[:4].upper()}"
    sup_payload = {
        "supplier_code": sup_code,
        "supplier_name": "E2E Silk Filatures Cooperative",
        "supplier_type": "SILK_REELER",
        "contact_person": "M. Ramasamy",
        "phone": "+919842000001",
        "email": "filature@e2esilk.test",
        "location": "Salem Reeling Complex",
        "gstin": "33AAAAA1111A1Z1",
        "is_active": True,
    }
    sup_resp = await async_client.post("/api/v1/admin/suppliers", json=sup_payload, headers=headers)
    assert sup_resp.status_code == 201
    supplier_id = sup_resp.json()["id"]

    mat_code = f"RAW-E2E-{uuid.uuid4().hex[:4].upper()}"
    mat_payload = {
        "material_code": mat_code,
        "name": "E2E Mulberry Warp Yarn 20/22D",
        "material_type": "RAW_SILK",
        "unit_of_measure": "KILOGRAMS",
        "supplier_id": supplier_id,
        "unit_cost": 4500.00,
        "reorder_level": 5.000,
        "initial_stock": 0.0,
        "description": "Pure Mulberry raw silk",
    }
    mat_resp = await async_client.post("/api/v1/admin/raw-materials", json=mat_payload, headers=headers)
    assert mat_resp.status_code == 201
    raw_material_id = mat_resp.json()["id"]

    # ---------------------------------------------------------
    # 4. Procurement & Material Receiving
    # ---------------------------------------------------------
    po_payload = {
        "supplier_id": supplier_id,
        "order_date": str(date.today()),
        "items": [
            {
                "raw_material_id": raw_material_id,
                "quantity_ordered": 50.0,
                "unit_cost": 4500.0,
            }
        ],
        "tax_amount": 11250.0,
        "notes": "E2E bulk warp replenishment",
    }
    po_resp = await async_client.post("/api/v1/admin/purchases", json=po_payload, headers=headers)
    assert po_resp.status_code == 201
    po_data = po_resp.json()
    po_id = po_data["id"]
    po_item_id = po_data["items"][0]["id"]

    # Receive Purchase Order
    receive_payload = {
        "items": [
            {
                "item_id": po_item_id,
                "quantity_to_receive": 50.0,
            }
        ],
        "notes": "Checked filament strength and weight.",
        "warehouse_location": "Yarn Rack 1",
    }
    receive_resp = await async_client.post(f"/api/v1/admin/purchases/{po_id}/receive", json=receive_payload, headers=headers)
    assert receive_resp.status_code == 200

    # Verify Raw Material Stock increased
    mat_stock_resp = await async_client.get(f"/api/v1/admin/raw-materials/{raw_material_id}", headers=headers)
    assert mat_stock_resp.status_code == 200
    assert Decimal(str(mat_stock_resp.json()["stock"]["quantity_on_hand"])) == Decimal("50.00")

    # ---------------------------------------------------------
    # 5. Loom Production Batch & Material Consumption
    # ---------------------------------------------------------
    batch_num = f"BATCH-E2E-{uuid.uuid4().hex[:4].upper()}"
    batch_payload = {
        "batch_number": batch_num,
        "product_id": product_id,
        "loom_identifier": "LOOM-KANCHI-01",
        "artisan_name": "Master Weaver K. Natarajan",
        "planned_quantity": 5,
    }
    batch_resp = await async_client.post("/api/v1/admin/production", json=batch_payload, headers=headers)
    assert batch_resp.status_code == 201
    batch_id = batch_resp.json()["id"]

    # Consume 15 kg of Raw Silk
    consume_payload = {
        "raw_material_id": raw_material_id,
        "quantity_consumed": 15.00,
        "notes": "Allocated to 5-saree batch",
    }
    consume_resp = await async_client.post(f"/api/v1/admin/production/{batch_id}/consume-material", json=consume_payload, headers=headers)
    assert consume_resp.status_code == 201

    # Complete Production Batch -> Credits 5 sarees to finished inventory
    complete_resp = await async_client.patch(
        f"/api/v1/admin/production/{batch_id}",
        json={"status": "COMPLETED", "actual_quantity": 5},
        headers=headers,
    )
    assert complete_resp.status_code == 200

    # Verify Finished Inventory
    inv_list_resp = await async_client.get(f"/api/v1/admin/inventory?search={prod_code}", headers=headers)
    assert inv_list_resp.status_code == 200
    inv_items = inv_list_resp.json()["items"]
    assert len(inv_items) >= 1
    assert inv_items[0]["quantity_on_hand"] >= 5

    # ---------------------------------------------------------
    # 6. Customer & Sales Order Processing
    # ---------------------------------------------------------
    cust_payload = {
        "full_name": "Smt. Meenakshi Sundaram",
        "company_name": "Meenakshi Silks Heritage",
        "customer_type": CustomerType.WHOLESALE_MERCHANT.value,
        "phone": "+919842111222",
        "email": "meenakshi@silksheritage.test",
        "gstin": "33AAAAA9999A1Z9",
        "city": "Madurai",
        "state": "Tamil Nadu",
        "shipping_address": "100 South Masi Street, Madurai",
    }
    cust_resp = await async_client.post("/api/v1/admin/customers", json=cust_payload, headers=headers)
    assert cust_resp.status_code == 201
    customer_id = cust_resp.json()["id"]

    # Create Sales Order for 2 sarees
    order_payload = {
        "customer_id": customer_id,
        "order_type": "WHOLESALE_BULK",
        "payment_status": "PENDING",
        "items": [
            {
                "product_id": product_id,
                "quantity": 2,
                "unit_price": 35000.00,
            }
        ],
        "tax_amount": 3500.00,
        "shipping_amount": 1000.00,
        "notes": "E2E sales order",
    }
    order_resp = await async_client.post("/api/v1/admin/orders", json=order_payload, headers=headers)
    assert order_resp.status_code == 201
    order_id = order_resp.json()["id"]

    # Fulfill Order (atomic reservation release & sale ledger deduction)
    fulfill_resp = await async_client.post(f"/api/v1/admin/orders/{order_id}/fulfill", headers=headers)
    assert fulfill_resp.status_code == 200

    # ---------------------------------------------------------
    # 7. Tax Invoicing, Payment Settlement & PDF Clearance
    # ---------------------------------------------------------
    inv_from_order_resp = await async_client.post(f"/api/v1/admin/invoices/from-order/{order_id}", headers=headers)
    assert inv_from_order_resp.status_code == 201
    invoice_id = inv_from_order_resp.json()["id"]
    total_amount = Decimal(str(inv_from_order_resp.json()["total_amount"]))
    assert total_amount > Decimal("0.00")

    # Record Full Remittance
    pay_payload = {
        "amount": float(total_amount),
        "payment_method": "BANK_TRANSFER_NEFT_RTGS",
        "reference_transaction_id": "UTR-E2E-998877",
        "payment_date": str(date.today()),
        "notes": "Full bank wire clearance",
    }
    pay_resp = await async_client.post(f"/api/v1/admin/invoices/{invoice_id}/record-payment", json=pay_payload, headers=headers)
    assert pay_resp.status_code == 200
    assert pay_resp.json()["status"] == "PAID"
    assert Decimal(str(pay_resp.json()["balance_due"])) == Decimal("0.00")

    # Generate & Verify PDF Stream
    pdf_resp = await async_client.get(f"/api/v1/admin/invoices/{invoice_id}/pdf", headers=headers)
    assert pdf_resp.status_code == 200
    assert pdf_resp.headers["content-type"] == "application/pdf"
    assert len(pdf_resp.content) > 1000

    # ---------------------------------------------------------
    # 8. Wholesale CRM Lead -> Pipeline Conversion
    # ---------------------------------------------------------
    enquiry_payload = {
        "business_name": "Rajeshwari Heritage Boutique",
        "contact_person": "Rajeshwari",
        "email": "rajeshwari@boutique.test",
        "phone": "+919842555666",
        "city": "Chennai",
        "business_type": "Boutique",
        "expected_quantity": "10-25 sarees/month",
        "message": "Interested in pure zari bridal collection.",
    }
    enq_resp = await async_client.post("/api/v1/wholesale-enquiries", json=enquiry_payload)
    assert enq_resp.status_code == 201
    enquiry_id = enq_resp.json()["enquiry_id"]

    # Convert Lead to Wholesale Customer & Order
    convert_payload = {
        "items": [
            {
                "product_id": product_id,
                "quantity": 1,
                "unit_price": 32000.00,
            }
        ],
        "order_type": "WHOLESALE_BULK",
        "notes": "Converted from enquiry",
    }
    conv_resp = await async_client.post(f"/api/v1/admin/wholesale/{enquiry_id}/convert", json=convert_payload, headers=headers)
    assert conv_resp.status_code == 201

    # Idempotent second call returns existing order with same ID
    conv_repeat = await async_client.post(f"/api/v1/admin/wholesale/{enquiry_id}/convert", json=convert_payload, headers=headers)
    assert conv_repeat.status_code == 201
    assert conv_repeat.json()["id"] == conv_resp.json()["id"]

    # ---------------------------------------------------------
    # 9. Business Reports & Financial Dashboards
    # ---------------------------------------------------------
    fin_overview = await async_client.get("/api/v1/admin/finance/overview", headers=headers)
    assert fin_overview.status_code == 200
    assert "gross_revenue_mtd" in fin_overview.json()

    sales_report = await async_client.get("/api/v1/admin/reports/sales", headers=headers)
    assert sales_report.status_code == 200
    assert "gross_sales" in sales_report.json()

    csv_export = await async_client.get("/api/v1/admin/reports/sales?export=csv", headers=headers)
    assert csv_export.status_code == 200
    assert "text/csv" in csv_export.headers["content-type"]

    # ---------------------------------------------------------
    # 10. Logout & Unauthenticated Access Rejection
    # ---------------------------------------------------------
    logout_resp = await async_client.post("/api/v1/auth/logout", headers=headers)
    assert logout_resp.status_code == 200

    unauth_resp = await async_client.get("/api/v1/admin/dashboard")
    assert unauth_resp.status_code == 401

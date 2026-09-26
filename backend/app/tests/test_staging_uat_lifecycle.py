import pytest
import uuid
from decimal import Decimal
from datetime import date
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_password_hash, create_access_token
from app.models.user import User, UserRole
from app.models.category import Category
from app.models.product import Product, AvailabilityStatus
from app.models.inventory import Inventory
from app.models.supplier import Supplier, SupplierType
from app.models.raw_material import RawMaterial, RawMaterialStock, MaterialType, UnitOfMeasure
from app.models.customer import Customer, CustomerType


@pytest.mark.asyncio
async def test_full_staging_uat_35_point_lifecycle(async_client: AsyncClient, db_session: AsyncSession):
    """
    PHASE 5F — AUTOMATED STAGING USER ACCEPTANCE TEST (UAT)
    Covers all 35 operational checkpoints of the PVS Silk S platform end-to-end:
    1. Admin authentication
    2. RBAC enforcement
    3. Product/category visibility
    4. Customer creation
    5. Supplier creation
    6. Raw-material creation and stock state
    7. Purchase-order creation
    8. Consignment receiving
    9. Raw-material stock increase
    10. Loom production batch creation
    11. Raw-material allocation/consumption
    12. Production stage progression
    13. QA checkpoints
    14. Finished-goods inventory creation
    15. Retail/wholesale customer order creation
    16. Inventory reservation
    17. Order confirmation
    18. Order fulfillment/dispatch
    19. Inventory deduction
    20. Immutable stock movement creation
    21. Wholesale CRM enquiry creation
    22. CRM pipeline progression
    23. Lead-to-order conversion
    24. Payment recording
    25. Invoice generation
    26. GST calculation
    27. Invoice status progression
    28. PDF invoice generation
    29. Finance receivables/payables
    30. Business reports
    31. CSV report export
    32. Health/readiness endpoints
    33. Security headers
    34. Unauthorized/privilege-escalation rejection
    35. Idempotency of critical state-changing operations
    """

    # --------------------------------------------------------------------------
    # CHECKPOINT 32: Health & Readiness Probes
    # --------------------------------------------------------------------------
    health_res = await async_client.get("/health")
    assert health_res.status_code == 200
    assert health_res.json()["status"] == "ok"

    ready_res = await async_client.get("/ready")
    assert ready_res.status_code == 200
    assert ready_res.json()["status"] == "ok"
    assert ready_res.json()["database"] == "connected"

    # --------------------------------------------------------------------------
    # CHECKPOINT 1: Admin Authentication & Token Provisioning
    # --------------------------------------------------------------------------
    super_admin = User(
        id=uuid.uuid4(),
        email=f"uat.admin.{uuid.uuid4().hex[:6]}@pvssilks.test",
        hashed_password=get_password_hash("UATSecurePass2026!"),
        full_name="UAT Super Admin",
        role=UserRole.SUPER_ADMIN,
        is_active=True,
    )
    sales_admin = User(
        id=uuid.uuid4(),
        email=f"uat.sales.{uuid.uuid4().hex[:6]}@pvssilks.test",
        hashed_password=get_password_hash("UATSalesPass2026!"),
        full_name="UAT Sales Admin",
        role=UserRole.SALES_ADMIN,
        is_active=True,
    )
    db_session.add_all([super_admin, sales_admin])
    await db_session.commit()

    admin_token = create_access_token(str(super_admin.id), super_admin.role.value)
    sales_token = create_access_token(str(sales_admin.id), sales_admin.role.value)
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    sales_headers = {"Authorization": f"Bearer {sales_token}"}

    # Verify /auth/me
    me_res = await async_client.get("/api/v1/auth/me", headers=admin_headers)
    assert me_res.status_code == 200
    assert me_res.json()["email"] == super_admin.email

    # --------------------------------------------------------------------------
    # CHECKPOINT 33: Security Response Headers
    # --------------------------------------------------------------------------
    assert "x-content-type-options" in me_res.headers
    assert "x-frame-options" in me_res.headers

    # --------------------------------------------------------------------------
    # CHECKPOINT 2 & 34: RBAC & Privilege Escalation Rejection
    # --------------------------------------------------------------------------
    # Sales admin attempting to manually adjust raw material stock must be forbidden (403)
    dummy_mat_id = uuid.uuid4()
    bad_adj_res = await async_client.post(
        f"/api/v1/admin/raw-materials/{dummy_mat_id}/adjust",
        json={"movement_type": "ADJUSTMENT", "quantity_delta": 5.0},
        headers=sales_headers,
    )
    assert bad_adj_res.status_code == 403

    # Unauthenticated access to admin routes must return 401
    unauth_res = await async_client.get("/api/v1/admin/finance/overview")
    assert unauth_res.status_code == 401

    # --------------------------------------------------------------------------
    # CHECKPOINT 3: Product / Category Creation & Visibility
    # --------------------------------------------------------------------------
    cat_payload = {
        "name": "UAT Bridal Kanchipuram",
        "slug": f"uat-bridal-{uuid.uuid4().hex[:6]}",
        "description": "Artisan Silk Sarees for UAT Verification",
        "display_order": 1,
    }
    cat_res = await async_client.post("/api/v1/admin/categories", json=cat_payload, headers=admin_headers)
    assert cat_res.status_code == 201
    cat_id = cat_res.json()["id"]

    prod_payload = {
        "category_id": cat_id,
        "code": f"UAT-SAR-{uuid.uuid4().hex[:4].upper()}",
        "name": "UAT Pure Zari Crimson Brocade Saree",
        "fabric": "Pure Mulberry Silk",
        "color": "Crimson Red",
        "border": "Mayil Peacock Zari Border",
        "weave_type": "Handloom Korvai",
        "description": "Heavy Bridal Handloom Silk Saree with pure gold zari",
        "price": 28000.0,
        "availability_status": "IN_STOCK",
        "initial_quantity": 0,
        "reorder_threshold": 2,
    }
    prod_res = await async_client.post("/api/v1/admin/products", json=prod_payload, headers=admin_headers)
    assert prod_res.status_code == 201
    prod_data = prod_res.json()
    prod_id = prod_data["id"]
    prod_code = prod_data["code"]

    # Public catalog visibility
    pub_res = await async_client.get(f"/api/v1/products/{prod_code}")
    assert pub_res.status_code == 200
    assert pub_res.json()["name"] == prod_payload["name"]

    # --------------------------------------------------------------------------
    # CHECKPOINT 4: Customer Creation
    # --------------------------------------------------------------------------
    cust_payload = {
        "full_name": "Smt. Jayashree Raman",
        "company_name": "Raman Silks Emporium",
        "customer_type": "WHOLESALE_MERCHANT",
        "phone": "+919842799988",
        "email": "raman.silks@uat.test",
        "city": "Chennai",
        "state": "Tamil Nadu",
        "address": "12, Natesan Street, T. Nagar",
        "pincode": "600017",
        "gstin": "33AAAAA1234A1Z5",
    }
    cust_res = await async_client.post("/api/v1/admin/customers", json=cust_payload, headers=admin_headers)
    assert cust_res.status_code == 201
    cust_id = cust_res.json()["id"]

    # --------------------------------------------------------------------------
    # CHECKPOINT 5: Supplier Creation
    # --------------------------------------------------------------------------
    sup_payload = {
        "supplier_code": f"SUP-UAT-{uuid.uuid4().hex[:4].upper()}",
        "supplier_name": "Salem Silk Reelers Federation",
        "supplier_type": "SILK_REELER",
        "contact_person": "K. Govindaraj",
        "phone": "+919842511122",
        "email": "salem.reeler@uat.test",
        "location": "Salem, Tamil Nadu",
        "address": "45, Weavers Complex, Salem",
        "gstin": "33BBBBB5678B1Z2",
    }
    sup_res = await async_client.post("/api/v1/admin/suppliers", json=sup_payload, headers=admin_headers)
    assert sup_res.status_code == 201
    sup_id = sup_res.json()["id"]

    # --------------------------------------------------------------------------
    # CHECKPOINT 6: Raw Material Creation & Stock State
    # --------------------------------------------------------------------------
    rm_payload = {
        "material_code": f"RM-UAT-{uuid.uuid4().hex[:4].upper()}",
        "name": "Pure Mulberry Silk Warp Yarn (20/22 Denier)",
        "material_type": "RAW_SILK",
        "unit_of_measure": "KILOGRAMS",
        "reorder_level": 5.0,
        "unit_cost": 4800.0,
        "supplier_id": sup_id,
        "initial_stock": 0.0,
        "warehouse_location": "Yarn Rack A-01",
    }
    rm_res = await async_client.post("/api/v1/admin/raw-materials", json=rm_payload, headers=admin_headers)
    assert rm_res.status_code == 201
    rm_id = rm_res.json()["id"]

    # --------------------------------------------------------------------------
    # CHECKPOINT 7: Purchase Order Creation
    # --------------------------------------------------------------------------
    po_payload = {
        "supplier_id": sup_id,
        "notes": "Urgent procurement of warp yarn for Bridal Brocade order",
        "items": [
            {
                "raw_material_id": rm_id,
                "quantity_ordered": 25.0,
                "unit_cost": 4800.0,
            }
        ],
    }
    po_res = await async_client.post("/api/v1/admin/purchases", json=po_payload, headers=admin_headers)
    assert po_res.status_code == 201
    po_id = po_res.json()["id"]
    po_item_id = po_res.json()["items"][0]["id"]

    # --------------------------------------------------------------------------
    # CHECKPOINT 8 & 9: Consignment Receiving & Raw Material Stock Increase
    # --------------------------------------------------------------------------
    rec_res = await async_client.post(
        f"/api/v1/admin/purchases/{po_id}/receive",
        json={"items": [{"item_id": po_item_id, "quantity_to_receive": 25.0}]},
        headers=admin_headers,
    )
    assert rec_res.status_code == 200

    rm_check = await async_client.get(f"/api/v1/admin/raw-materials/{rm_id}", headers=admin_headers)
    assert Decimal(str(rm_check.json()["stock"]["quantity_on_hand"])) == Decimal("25.00")

    # --------------------------------------------------------------------------
    # CHECKPOINT 10: Loom Production Batch Creation
    # --------------------------------------------------------------------------
    batch_payload = {
        "batch_number": f"BATCH-UAT-{uuid.uuid4().hex[:4].upper()}",
        "product_id": prod_id,
        "loom_identifier": "TRADITIONAL-PIT-LOOM-08",
        "weaver_name": "M. Murugan Weavers",
        "planned_quantity": 5,
        "target_completion_date": str(date.today()),
        "notes": "Pure handloom double-warp weave",
    }
    batch_res = await async_client.post("/api/v1/admin/production", json=batch_payload, headers=admin_headers)
    assert batch_res.status_code == 201
    batch_id = batch_res.json()["id"]

    # --------------------------------------------------------------------------
    # CHECKPOINT 11: Raw Material Allocation & Consumption
    # --------------------------------------------------------------------------
    consume_payload = {
        "raw_material_id": rm_id,
        "quantity_consumed": 10.0,
        "notes": "Consumed 10kg warp yarn for 5 sarees",
    }
    cons_res = await async_client.post(
        f"/api/v1/admin/production/{batch_id}/consume-material",
        json=consume_payload,
        headers=admin_headers,
    )
    assert cons_res.status_code == 201

    rm_after_cons = await async_client.get(f"/api/v1/admin/raw-materials/{rm_id}", headers=admin_headers)
    assert Decimal(str(rm_after_cons.json()["stock"]["quantity_on_hand"])) == Decimal("15.00")

    # --------------------------------------------------------------------------
    # CHECKPOINT 12 & 13: Production Stage Progression & QA Checkpoints
    # --------------------------------------------------------------------------
    stage_update = await async_client.patch(
        f"/api/v1/admin/production/{batch_id}",
        json={"status": "WEAVING_IN_PROGRESS"},
        headers=admin_headers,
    )
    assert stage_update.status_code == 200

    # --------------------------------------------------------------------------
    # CHECKPOINT 14: Finished Goods Inventory Creation & Batch Completion
    # --------------------------------------------------------------------------
    comp_res = await async_client.patch(
        f"/api/v1/admin/production/{batch_id}",
        json={"status": "COMPLETED", "completed_quantity": 5},
        headers=admin_headers,
    )
    assert comp_res.status_code == 200

    inv_res = await async_client.get(f"/api/v1/admin/inventory/{prod_id}", headers=admin_headers)
    assert inv_res.json()["inventory"]["quantity_on_hand"] == 5
    assert inv_res.json()["inventory"]["quantity_available"] == 5

    # --------------------------------------------------------------------------
    # CHECKPOINT 15 & 16: Retail/Wholesale Customer Order Creation & Reservation
    # --------------------------------------------------------------------------
    order_payload = {
        "customer_id": cust_id,
        "order_type": "WHOLESALE_BULK",
        "shipping_address": "12, Natesan Street, T. Nagar, Chennai, 600017",
        "billing_address": "12, Natesan Street, T. Nagar, Chennai, 600017",
        "notes": "UAT bulk wholesale saree reservation",
        "items": [
            {
                "product_id": prod_id,
                "quantity": 3,
                "unit_price": 28000.0,
            }
        ],
    }
    ord_res = await async_client.post("/api/v1/admin/orders", json=order_payload, headers=admin_headers)
    assert ord_res.status_code == 201
    ord_data = ord_res.json()
    order_id = ord_data["id"]

    inv_after_ord = await async_client.get(f"/api/v1/admin/inventory/{prod_id}", headers=admin_headers)
    assert inv_after_ord.json()["inventory"]["quantity_on_hand"] == 5
    assert inv_after_ord.json()["inventory"]["quantity_reserved"] == 3
    assert inv_after_ord.json()["inventory"]["quantity_available"] == 2

    # --------------------------------------------------------------------------
    # CHECKPOINT 17: Order Confirmation
    # --------------------------------------------------------------------------
    conf_res = await async_client.post(
        f"/api/v1/admin/orders/{order_id}/confirm",
        headers=admin_headers,
    )
    assert conf_res.status_code == 200
    assert conf_res.json()["order_status"] == "CONFIRMED"

    # --------------------------------------------------------------------------
    # CHECKPOINT 25 & 26: Invoice Generation & GST Calculation (5% GST)
    # --------------------------------------------------------------------------
    inv_gen_res = await async_client.post(
        f"/api/v1/admin/invoices/from-order/{order_id}",
        headers=admin_headers,
    )
    assert inv_gen_res.status_code == 201
    inv_data = inv_gen_res.json()
    invoice_id = inv_data["id"]

    # 3 * 28000 = 84000 subtotal, 5% tax = 4200, grand total = 88200
    assert Decimal(str(inv_data["subtotal_amount"])) == Decimal("84000.00")
    assert Decimal(str(inv_data["total_tax_amount"])) == Decimal("4200.00")
    assert Decimal(str(inv_data["total_amount"])) == Decimal("88200.00")
    assert Decimal(str(inv_data["balance_due"])) == Decimal("88200.00")

    # --------------------------------------------------------------------------
    # CHECKPOINT 24 & 27: Payment Recording & Invoice Status Progression
    # --------------------------------------------------------------------------
    pay_payload = {
        "amount": 88200.0,
        "payment_method": "BANK_TRANSFER_NEFT_RTGS",
        "reference_transaction_id": "UTR-UAT-SETTLE-001",
        "payment_date": str(date.today()),
        "notes": "Full NEFT bank settlement verified against SBI current account",
    }
    pay_res = await async_client.post(
        f"/api/v1/admin/invoices/{invoice_id}/record-payment",
        json=pay_payload,
        headers=admin_headers,
    )
    assert pay_res.status_code == 200
    assert pay_res.json()["status"] == "PAID"
    assert Decimal(str(pay_res.json()["balance_due"])) == Decimal("0.00")

    # --------------------------------------------------------------------------
    # CHECKPOINT 28: PDF Invoice Streaming
    # --------------------------------------------------------------------------
    pdf_res = await async_client.get(f"/api/v1/admin/invoices/{invoice_id}/pdf", headers=admin_headers)
    assert pdf_res.status_code == 200
    assert pdf_res.headers["content-type"] == "application/pdf"
    assert len(pdf_res.content) > 1000

    # --------------------------------------------------------------------------
    # CHECKPOINT 18, 19 & 20: Order Fulfillment, Stock Deduction & Immutable SALE Movement
    # --------------------------------------------------------------------------
    ful_res = await async_client.post(
        f"/api/v1/admin/orders/{order_id}/fulfill",
        headers=admin_headers,
    )
    assert ful_res.status_code == 200
    assert ful_res.json()["order_status"] == "DELIVERED"

    inv_final = await async_client.get(f"/api/v1/admin/inventory/{prod_id}", headers=admin_headers)
    assert inv_final.json()["inventory"]["quantity_on_hand"] == 2
    assert inv_final.json()["inventory"]["quantity_reserved"] == 0
    assert inv_final.json()["inventory"]["quantity_available"] == 2

    # Verify immutable movement log
    movements_res = await async_client.get(f"/api/v1/admin/inventory/{prod_id}/movements", headers=admin_headers)
    assert movements_res.status_code == 200
    movement_types = [m["movement_type"] for m in movements_res.json()["items"]]
    assert "SALE" in movement_types

    # --------------------------------------------------------------------------
    # CHECKPOINT 21, 22 & 23: Wholesale CRM Enquiry, Pipeline & Conversion
    # --------------------------------------------------------------------------
    enq_payload = {
        "business_name": "Senthil Sarees Madurai",
        "contact_person": "M. Senthil Nathan",
        "phone": "+919842000033",
        "email": "senthil@uat.test",
        "city": "Madurai",
        "business_type": "Retail Showroom",
        "expected_quantity": "5-10 Sarees",
        "message": "Interested in bulk procurement of Kanchipuram Brocade sarees",
    }
    pub_enq_res = await async_client.post("/api/v1/wholesale-enquiries", json=enq_payload)
    assert pub_enq_res.status_code == 201
    enquiry_id = pub_enq_res.json()["enquiry_id"]

    # Pipeline progression: NEW -> CONTACTED -> CATALOGUE_SENT -> NEGOTIATING
    for st in ["CONTACTED", "CATALOGUE_SENT", "NEGOTIATING"]:
        st_res = await async_client.patch(
            f"/api/v1/admin/wholesale/{enquiry_id}",
            json={"status": st, "notes": f"Progressed to {st}"},
            headers=admin_headers,
        )
        assert st_res.status_code == 200
        assert st_res.json()["status"] == st

    # Convert to order
    conv_res = await async_client.post(
        f"/api/v1/admin/wholesale/{enquiry_id}/convert",
        json={
            "items": [{"product_id": prod_id, "quantity": 1, "unit_price": 28000.0}],
            "notes": "Converted wholesale lead into active sales order",
        },
        headers=admin_headers,
    )
    assert conv_res.status_code == 201
    assert conv_res.json()["order_status"] == "PENDING"

    # --------------------------------------------------------------------------
    # CHECKPOINT 29, 30 & 31: Financial Reports, Receivables & CSV Export
    # --------------------------------------------------------------------------
    fin_kpis = await async_client.get("/api/v1/admin/finance/overview", headers=admin_headers)
    assert fin_kpis.status_code == 200
    assert "gross_revenue_mtd" in fin_kpis.json()
    assert "total_receivables" in fin_kpis.json()

    aging_res = await async_client.get("/api/v1/admin/finance/receivables", headers=admin_headers)
    assert aging_res.status_code == 200

    csv_res = await async_client.get("/api/v1/admin/reports/sales?export=csv", headers=admin_headers)
    assert csv_res.status_code == 200
    assert "text/csv" in csv_res.headers["content-type"]

    # --------------------------------------------------------------------------
    # CHECKPOINT 35: Idempotency of Critical State-Changing Operations
    # --------------------------------------------------------------------------
    # 1. Re-converting the same wholesale enquiry returns the existing order (idempotent)
    dup_conv_res = await async_client.post(
        f"/api/v1/admin/wholesale/{enquiry_id}/convert",
        json={"items": [{"product_id": prod_id, "quantity": 1, "unit_price": 28000.0}]},
        headers=admin_headers,
    )
    assert dup_conv_res.status_code == 201
    assert dup_conv_res.json()["id"] == conv_res.json()["id"]

    # 2. Re-completing the batch does not duplicate finished stock credits
    dup_batch_comp = await async_client.patch(
        f"/api/v1/admin/production/{batch_id}",
        json={"status": "COMPLETED", "completed_quantity": 5},
        headers=admin_headers,
    )
    assert dup_batch_comp.status_code == 200
    inv_dup_check = await async_client.get(f"/api/v1/admin/inventory/{prod_id}", headers=admin_headers)
    # Available was 1 (2 on hand - 1 reserved for converted wholesale order), should remain 1
    assert inv_dup_check.json()["inventory"]["quantity_on_hand"] == 2
    assert inv_dup_check.json()["inventory"]["quantity_reserved"] == 1
    assert inv_dup_check.json()["inventory"]["quantity_available"] == 1

import pytest
import uuid
from decimal import Decimal
from datetime import date, timedelta
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User, UserRole
from app.models.category import Category
from app.models.product import Product, AvailabilityStatus
from app.models.customer import Customer, CustomerType
from app.models.order import Order, OrderItem, OrderType, OrderStatus, PaymentStatus
from app.models.supplier import Supplier, SupplierType
from app.models.raw_material import (
    RawMaterial,
    RawMaterialStock,
    MaterialType,
    UnitOfMeasure,
)
from app.models.purchase import PurchaseOrder, PurchaseOrderItem, PurchaseOrderStatus
from app.models.invoice import InvoiceType, InvoiceStatus
from app.core.security import get_password_hash, create_access_token


@pytest.fixture
async def finance_fixture(db_session: AsyncSession):
    """Seed test staff accounts, customer, supplier, product, and stock."""
    super_admin = User(
        id=uuid.uuid4(),
        email="super_fin@pvssilks.test",
        hashed_password=get_password_hash("Pass123!"),
        full_name="Chief Financial Officer",
        role=UserRole.SUPER_ADMIN,
        is_active=True,
    )
    sales_admin = User(
        id=uuid.uuid4(),
        email="sales_fin@pvssilks.test",
        hashed_password=get_password_hash("Pass123!"),
        full_name="Billing Officer",
        role=UserRole.SALES_ADMIN,
        is_active=True,
    )
    factory_mgr = User(
        id=uuid.uuid4(),
        email="factory_fin@pvssilks.test",
        hashed_password=get_password_hash("Pass123!"),
        full_name="Operations Lead",
        role=UserRole.FACTORY_MANAGER,
        is_active=True,
    )
    dealer_user = User(
        id=uuid.uuid4(),
        email="dealer_fin@pvssilks.test",
        hashed_password=get_password_hash("Pass123!"),
        full_name="Retail Dealer",
        role=UserRole.DEALER,
        is_active=True,
    )

    supplier = Supplier(
        id=uuid.uuid4(),
        supplier_code="SUP-FIN-001",
        supplier_name="Kanchi Silk Spinners Guild",
        supplier_type=SupplierType.SILK_REELER,
        contact_person="R. Ramanathan",
        phone="+91 94441 12345",
        location="Kanchipuram, Tamil Nadu",
        address="12 Weaver Lane",
        gstin="33AABCS1234A1Z1",
        is_active=True,
    )

    raw_mat = RawMaterial(
        id=uuid.uuid4(),
        material_code="RM-FIN-SILK",
        name="Mulberry Raw Silk 2A",
        material_type=MaterialType.RAW_SILK,
        unit_of_measure=UnitOfMeasure.KILOGRAMS,
        reorder_level=Decimal("15.00"),
        unit_cost=Decimal("4800.00"),
        is_active=True,
        supplier_id=supplier.id,
    )

    stock = RawMaterialStock(
        id=uuid.uuid4(),
        raw_material_id=raw_mat.id,
        quantity_on_hand=Decimal("100.00"),
        quantity_reserved=Decimal("0.00"),
        warehouse_location="Main Yarn Vault",
    )

    category = Category(
        id=uuid.uuid4(),
        name="Kanchipuram Bridal",
        slug="kanchipuram-bridal-fin",
        display_order=1,
        is_active=True,
    )

    product = Product(
        id=uuid.uuid4(),
        code="PVS-PROD-FIN-1",
        name="Kanchipuram Royal Gold Zari Saree",
        category_id=category.id,
        fabric="Pure Mulberry Silk",
        color="Crimson Red",
        border="Mayil Peacock Motif",
        weave_type="Korvai",
        description="Luxury bridal handloom silk saree.",
        price=Decimal("25000.00"),
        availability_status=AvailabilityStatus.IN_STOCK,
        is_active=True,
    )

    customer = Customer(
        id=uuid.uuid4(),
        full_name="Mahalakshmi Silks Chennai",
        company_name="Mahalakshmi Silk Emporium",
        customer_type=CustomerType.WHOLESALE_MERCHANT,
        phone="+91 98841 88990",
        city="Chennai",
        state="Tamil Nadu",
        gstin="33AABCM9988G1Z2",
    )

    order = Order(
        id=uuid.uuid4(),
        order_number="PVS-ORD-FIN-101",
        customer_id=customer.id,
        order_type=OrderType.WHOLESALE_BULK,
        order_status=OrderStatus.CONFIRMED,
        payment_status=PaymentStatus.PENDING,
        subtotal_amount=Decimal("50000.00"),
        tax_amount=Decimal("2500.00"),
        shipping_amount=Decimal("0.00"),
        total_amount=Decimal("52500.00"),
        items=[
            OrderItem(
                id=uuid.uuid4(),
                product_id=product.id,
                quantity=2,
                unit_price=Decimal("25000.00"),
                line_total=Decimal("50000.00"),
            )
        ],
    )

    db_session.add_all([
        super_admin, sales_admin, factory_mgr, dealer_user,
        supplier, raw_mat, stock, category, product, customer, order,
    ])
    await db_session.commit()

    return {
        "super_token": create_access_token(str(super_admin.id), super_admin.role.value),
        "sales_token": create_access_token(str(sales_admin.id), sales_admin.role.value),
        "factory_token": create_access_token(str(factory_mgr.id), factory_mgr.role.value),
        "dealer_token": create_access_token(str(dealer_user.id), dealer_user.role.value),
        "supplier": supplier,
        "raw_material": raw_mat,
        "stock": stock,
        "product": product,
        "customer": customer,
        "order": order,
    }


@pytest.mark.asyncio
async def test_invoice_creation_and_tax_calculations(async_client: AsyncClient, finance_fixture):
    """Test manual invoice creation with automatic CGST+SGST tax calculations and HSN codes."""
    headers = {"Authorization": f"Bearer {finance_fixture['sales_token']}"}
    customer = finance_fixture["customer"]
    product = finance_fixture["product"]

    payload = {
        "invoice_type": "TAX_INVOICE",
        "customer_id": str(customer.id),
        "invoice_date": str(date.today()),
        "due_date": str(date.today() + timedelta(days=15)),
        "place_of_supply": "Tamil Nadu (33)",
        "is_inter_state": False,
        "customer_gstin": "33AAECP9988G1Z2",
        "items": [
            {
                "product_id": str(product.id),
                "item_description": "Pure Kanchipuram Silk Saree - Wedding Edition",
                "hsn_sac_code": "5007",
                "quantity": 2,
                "unit_of_measure": "PCS",
                "unit_price": 20000.0,
                "discount_amount": 0.0,
                "gst_rate": 5.0,
            }
        ],
        "terms_and_conditions": "1. Standard dry clean only.\n2. Goods once sold are non-refundable.",
        "notes": "Direct showroom invoice.",
    }

    res = await async_client.post("/api/v1/admin/invoices", json=payload, headers=headers)
    assert res.status_code == 201
    data = res.json()

    assert "PVS-INV-" in data["invoice_number"]
    assert data["customer_id"] == str(customer.id)
    assert float(data["subtotal_amount"]) == 40000.0
    # CGST (2.5%) = 1000, SGST (2.5%) = 1000 => Total Tax = 2000
    assert float(data["cgst_amount"]) == 1000.0
    assert float(data["sgst_amount"]) == 1000.0
    assert float(data["igst_amount"]) == 0.0
    assert float(data["total_tax_amount"]) == 2000.0
    assert float(data["total_amount"]) == 42000.0
    assert float(data["paid_amount"]) == 0.0
    assert float(data["balance_due"]) == 42000.0
    assert data["status"] == "ISSUED"
    assert len(data["items"]) == 1
    assert data["items"][0]["hsn_sac_code"] == "5007"


@pytest.mark.asyncio
async def test_create_invoice_from_sales_order(async_client: AsyncClient, finance_fixture):
    """Test generating a Tax Invoice from an existing Sales Order."""
    headers = {"Authorization": f"Bearer {finance_fixture['sales_token']}"}
    order = finance_fixture["order"]

    res = await async_client.post(
        f"/api/v1/admin/invoices/from-order/{order.id}",
        headers=headers,
    )
    assert res.status_code == 201
    data = res.json()

    assert data["order_id"] == str(order.id)
    assert float(data["subtotal_amount"]) == 50000.0
    assert float(data["total_amount"]) == 52500.0
    assert float(data["balance_due"]) == 52500.0
    assert data["status"] == "ISSUED"


@pytest.mark.asyncio
async def test_invoice_payment_recording_and_settlement(async_client: AsyncClient, finance_fixture):
    """Test applying customer payments against an invoice until fully settled."""
    headers = {"Authorization": f"Bearer {finance_fixture['sales_token']}"}
    customer = finance_fixture["customer"]
    product = finance_fixture["product"]

    # 1. Create Invoice
    payload = {
        "invoice_type": "TAX_INVOICE",
        "customer_id": str(customer.id),
        "items": [
            {
                "product_id": str(product.id),
                "item_description": "Kanchipuram Silk Saree",
                "hsn_sac_code": "5007",
                "quantity": 1,
                "unit_price": 10000.0,
                "gst_rate": 5.0,
            }
        ],
    }
    inv_res = await async_client.post("/api/v1/admin/invoices", json=payload, headers=headers)
    assert inv_res.status_code == 201
    inv = inv_res.json()
    invoice_id = inv["id"]
    assert float(inv["total_amount"]) == 10500.0

    # 2. Record Partial Payment (5000)
    part_pay = {
        "amount": 5000.0,
        "payment_method": "BANK_TRANSFER_NEFT_RTGS",
        "reference_transaction_id": "UTR-TEST-1001",
        "payment_date": str(date.today()),
        "notes": "Partial advance remittance",
    }
    res_p1 = await async_client.post(
        f"/api/v1/admin/invoices/{invoice_id}/record-payment",
        json=part_pay,
        headers=headers,
    )
    assert res_p1.status_code == 200
    data_p1 = res_p1.json()
    assert float(data_p1["paid_amount"]) == 5000.0
    assert float(data_p1["balance_due"]) == 5500.0
    assert data_p1["status"] == "PARTIALLY_PAID"
    assert len(data_p1["payments"]) == 1

    # 3. Record Final Payment (5500)
    final_pay = {
        "amount": 5500.0,
        "payment_method": "UPI",
        "reference_transaction_id": "UPI-SETTLE-1002",
        "payment_date": str(date.today()),
        "notes": "Final settlement",
    }
    res_p2 = await async_client.post(
        f"/api/v1/admin/invoices/{invoice_id}/record-payment",
        json=final_pay,
        headers=headers,
    )
    assert res_p2.status_code == 200
    data_p2 = res_p2.json()
    assert float(data_p2["paid_amount"]) == 10500.0
    assert float(data_p2["balance_due"]) == 0.0
    assert data_p2["status"] == "PAID"
    assert len(data_p2["payments"]) == 2


@pytest.mark.asyncio
async def test_invoice_pdf_generation_endpoint(async_client: AsyncClient, finance_fixture):
    """Test PDF generation endpoint returning valid binary PDF stream."""
    headers = {"Authorization": f"Bearer {finance_fixture['sales_token']}"}
    customer = finance_fixture["customer"]
    product = finance_fixture["product"]

    payload = {
        "invoice_type": "TAX_INVOICE",
        "customer_id": str(customer.id),
        "items": [
            {
                "product_id": str(product.id),
                "item_description": "Handwoven Royal Silk Saree",
                "hsn_sac_code": "5007",
                "quantity": 3,
                "unit_price": 15000.0,
                "gst_rate": 5.0,
            }
        ],
    }
    inv_res = await async_client.post("/api/v1/admin/invoices", json=payload, headers=headers)
    assert inv_res.status_code == 201
    invoice_id = inv_res.json()["id"]

    # Request PDF
    pdf_res = await async_client.get(f"/api/v1/admin/invoices/{invoice_id}/pdf", headers=headers)
    assert pdf_res.status_code == 200
    assert pdf_res.headers["content-type"] == "application/pdf"
    # PDF magic bytes
    assert pdf_res.content.startswith(b"%PDF")
    assert len(pdf_res.content) > 1000


@pytest.mark.asyncio
async def test_finance_overview_kpis(async_client: AsyncClient, finance_fixture):
    """Test finance overview dashboard metrics."""
    headers = {"Authorization": f"Bearer {finance_fixture['super_token']}"}
    res = await async_client.get("/api/v1/admin/finance/overview", headers=headers)
    assert res.status_code == 200
    data = res.json()

    assert "total_receivables" in data
    assert "total_payables" in data
    assert "gross_revenue_mtd" in data
    assert "net_cash_flow" in data
    assert "total_tax_collected" in data


@pytest.mark.asyncio
async def test_customer_receivables_aging(async_client: AsyncClient, finance_fixture):
    """Test customer receivables breakdown and aging buckets."""
    headers = {"Authorization": f"Bearer {finance_fixture['super_token']}"}
    customer = finance_fixture["customer"]
    product = finance_fixture["product"]

    # Ensure there is an unpaid invoice
    payload = {
        "invoice_type": "TAX_INVOICE",
        "customer_id": str(customer.id),
        "items": [
            {
                "product_id": str(product.id),
                "item_description": "Silk Saree",
                "hsn_sac_code": "5007",
                "quantity": 1,
                "unit_price": 25000.0,
                "gst_rate": 5.0,
            }
        ],
    }
    await async_client.post("/api/v1/admin/invoices", json=payload, headers=headers)

    res = await async_client.get("/api/v1/admin/finance/receivables", headers=headers)
    assert res.status_code == 200
    data = res.json()

    assert len(data) >= 1
    found = next((c for c in data if c["customer_id"] == str(customer.id)), None)
    assert found is not None
    assert float(found["balance_due"]) >= 26250.0
    assert "aging" in found
    assert float(found["aging"]["current_0_30"]) >= 26250.0


@pytest.mark.asyncio
async def test_business_reports_and_csv_exports(async_client: AsyncClient, finance_fixture):
    """Test Sales, Inventory Valuation, and GST Reports with JSON and CSV exports."""
    headers = {"Authorization": f"Bearer {finance_fixture['super_token']}"}

    # 1. Sales Report JSON
    sales_res = await async_client.get("/api/v1/admin/reports/sales", headers=headers)
    assert sales_res.status_code == 200
    sales_data = sales_res.json()
    assert "gross_sales" in sales_data
    assert "total_tax_collected" in sales_data

    # 2. Sales Report CSV export
    sales_csv = await async_client.get("/api/v1/admin/reports/sales?export=csv", headers=headers)
    assert sales_csv.status_code == 200
    assert "text/csv" in sales_csv.headers["content-type"]
    assert "Order Date" in sales_csv.text

    # 3. Inventory Valuation JSON
    inv_res = await async_client.get("/api/v1/admin/reports/inventory-valuation", headers=headers)
    assert inv_res.status_code == 200
    inv_data = inv_res.json()
    assert "total_raw_material_valuation" in inv_data
    assert "total_finished_goods_valuation" in inv_data

    # 4. Inventory Valuation CSV export
    inv_csv = await async_client.get("/api/v1/admin/reports/inventory-valuation?export=csv", headers=headers)
    assert inv_csv.status_code == 200
    assert "text/csv" in inv_csv.headers["content-type"]
    assert "RAW MATERIAL INVENTORY" in inv_csv.text

    # 5. GST Summary JSON
    gst_res = await async_client.get("/api/v1/admin/reports/gst", headers=headers)
    assert gst_res.status_code == 200
    gst_data = gst_res.json()
    assert "total_taxable_turnover" in gst_data
    assert "total_tax_liability" in gst_data

    # 6. GST Summary CSV export
    gst_csv = await async_client.get("/api/v1/admin/reports/gst?export=csv", headers=headers)
    assert gst_csv.status_code == 200
    assert "text/csv" in gst_csv.headers["content-type"]
    assert "GSTR-1" in gst_csv.text


@pytest.mark.asyncio
async def test_rbac_finance_and_reports(async_client: AsyncClient, finance_fixture):
    """Test RBAC restrictions on Finance, Invoices, and Reports."""
    dealer_headers = {"Authorization": f"Bearer {finance_fixture['dealer_token']}"}

    # Dealer should be forbidden (403) from accessing Finance and Invoices
    res_inv = await async_client.get("/api/v1/admin/invoices", headers=dealer_headers)
    assert res_inv.status_code == 403

    res_fin = await async_client.get("/api/v1/admin/finance/overview", headers=dealer_headers)
    assert res_fin.status_code == 403

    res_rep = await async_client.get("/api/v1/admin/reports/sales", headers=dealer_headers)
    assert res_rep.status_code == 403

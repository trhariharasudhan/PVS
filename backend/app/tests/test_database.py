import pytest
import uuid
from decimal import Decimal
from datetime import datetime, timezone, date
from sqlalchemy import select, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import (
    User,
    UserRole,
    Category,
    Product,
    ProductImage,
    AvailabilityStatus,
    Inventory,
    InventoryMovement,
    MovementType,
    Customer,
    CustomerType,
    Order,
    OrderItem,
    OrderType,
    OrderStatus,
    PaymentStatus,
    WholesaleEnquiry,
    EnquiryStatus,
    ProductionBatch,
    ProductionStage,
    BatchStatus,
    StageStatus,
    Supplier,
    RawMaterial,
    RawMaterialStock,
    MaterialType,
    UnitOfMeasure,
)


@pytest.mark.asyncio
async def test_01_database_connection(db_session: AsyncSession):
    """1. Test database connection execution."""
    result = await db_session.execute(text("SELECT 1"))
    assert result.scalar() == 1


@pytest.mark.asyncio
async def test_02_model_creation_and_persistence(db_session: AsyncSession):
    """2. Test generic model creation and persistence (User & Supplier)."""
    user = User(
        id=uuid.uuid4(),
        email="test.weaver@pvssilks.test",
        hashed_password="hashed_secure_test_password",
        full_name="Master Weaver Test",
        role=UserRole.FACTORY_MANAGER,
        is_active=True,
    )
    supplier = Supplier(
        id=uuid.uuid4(),
        supplier_code="SUP-TEST-001",
        supplier_name="Kanchipuram Silk Filature",
        contact_person="Murugan S",
        phone="+919876543210",
        location="Kanchipuram, Tamil Nadu",
        is_active=True,
    )
    db_session.add_all([user, supplier])
    await db_session.commit()

    saved_user = await db_session.get(User, user.id)
    assert saved_user is not None
    assert saved_user.email == "test.weaver@pvssilks.test"
    assert saved_user.role == UserRole.FACTORY_MANAGER

    saved_supplier = await db_session.get(Supplier, supplier.id)
    assert saved_supplier is not None
    assert saved_supplier.supplier_name == "Kanchipuram Silk Filature"


@pytest.mark.asyncio
async def test_03_product_creation(db_session: AsyncSession):
    """3. Test creating a detailed silk saree Product."""
    category = Category(
        id=uuid.uuid4(),
        name="Traditional Weaves",
        slug="traditional-weaves",
        tagline="Heritage Motifs",
        is_active=True,
    )
    db_session.add(category)
    await db_session.commit()

    product = Product(
        id=uuid.uuid4(),
        code="PVS-TEST-001",
        name="Aadrika Crimson Silk Saree",
        category_id=category.id,
        fabric="100% Pure Mulberry Silk",
        color="Crimson Red",
        border="Korvai Temple Border",
        pallu="Brocade Floral Pallu",
        motif="Mayil Peacock",
        weave_type="Korvai Jacquard",
        description="Authentic testing silk saree",
        price=Decimal("15000.00"),
        currency="INR",
        availability_status=AvailabilityStatus.IN_STOCK,
        saree_length_meters=Decimal("5.50"),
        weight_approx_grams=750,
        is_featured=True,
        is_active=True,
    )
    db_session.add(product)
    await db_session.commit()

    saved_product = await db_session.get(Product, product.id)
    assert saved_product is not None
    assert saved_product.code == "PVS-TEST-001"
    assert saved_product.availability_status == AvailabilityStatus.IN_STOCK
    assert saved_product.weight_approx_grams == 750


@pytest.mark.asyncio
async def test_04_category_product_relationship(db_session: AsyncSession):
    """4. Test Category -> Product one-to-many relationship."""
    category = Category(
        id=uuid.uuid4(),
        name="Bridal Silk",
        slug="bridal-silk",
        is_active=True,
    )
    db_session.add(category)
    await db_session.flush()

    p1 = Product(
        id=uuid.uuid4(),
        code="PVS-TEST-002",
        name="Bridal Saree Alpha",
        category_id=category.id,
        fabric="Pure Silk",
        color="Maroon",
        border="Temple Border",
        weave_type="Jacquard",
        description="Bridal alpha description",
        is_active=True,
    )
    p2 = Product(
        id=uuid.uuid4(),
        code="PVS-TEST-003",
        name="Bridal Saree Beta",
        category_id=category.id,
        fabric="Pure Silk",
        color="Gold",
        border="Zari Border",
        weave_type="Jacquard",
        description="Bridal beta description",
        is_active=True,
    )
    db_session.add_all([p1, p2])
    await db_session.commit()

    # Query category with products
    result = await db_session.execute(
        select(Category).where(Category.id == category.id)
    )
    loaded_category = result.scalar_one()
    # Query products for this category
    prod_result = await db_session.execute(
        select(Product).where(Product.category_id == loaded_category.id)
    )
    prods = prod_result.scalars().all()
    assert len(prods) == 2
    assert {p.code for p in prods} == {"PVS-TEST-002", "PVS-TEST-003"}


@pytest.mark.asyncio
async def test_05_product_product_image_relationship(db_session: AsyncSession):
    """5. Test Product -> ProductImage one-to-many relationship and ordering."""
    category = Category(id=uuid.uuid4(), name="Soft Silk", slug="soft-silk")
    product = Product(
        id=uuid.uuid4(),
        code="PVS-TEST-004",
        name="Blush Soft Silk",
        category=category,
        fabric="Soft Silk",
        color="Pastel Blush",
        border="Chevron Zari",
        weave_type="Lightweight",
        description="Soft silk drape",
    )
    img1 = ProductImage(
        id=uuid.uuid4(),
        product=product,
        image_url="https://images.unsplash.com/photo-1",
        tag="Full Saree",
        display_order=1,
        is_primary=True,
    )
    img2 = ProductImage(
        id=uuid.uuid4(),
        product=product,
        image_url="https://images.unsplash.com/photo-2",
        tag="Border Detail",
        display_order=2,
        is_primary=False,
    )
    db_session.add_all([category, product, img1, img2])
    await db_session.commit()

    img_result = await db_session.execute(
        select(ProductImage).where(ProductImage.product_id == product.id).order_by(ProductImage.display_order)
    )
    images = img_result.scalars().all()
    assert len(images) == 2
    assert images[0].is_primary is True
    assert images[1].tag == "Border Detail"


@pytest.mark.asyncio
async def test_06_product_inventory_relationship(db_session: AsyncSession):
    """6. Test Product -> Inventory one-to-one relationship & movement tracking."""
    category = Category(id=uuid.uuid4(), name="Cat Test", slug="cat-test")
    product = Product(
        id=uuid.uuid4(),
        code="PVS-TEST-005",
        name="Emerald Silk",
        category=category,
        fabric="Pure Silk",
        color="Emerald",
        border="Ganga Jamuna",
        weave_type="Korvai",
        description="Emerald green test saree",
    )
    inventory = Inventory(
        id=uuid.uuid4(),
        product=product,
        quantity_on_hand=20,
        quantity_reserved=5,
        reorder_threshold=5,
        warehouse_location="SALEM-RACK-01",
    )
    movement = InventoryMovement(
        id=uuid.uuid4(),
        inventory=inventory,
        movement_type=MovementType.PRODUCTION,
        quantity_delta=20,
        notes="Initial production batch completed",
    )
    db_session.add_all([category, product, inventory, movement])
    await db_session.commit()

    loaded_inv = await db_session.get(Inventory, inventory.id)
    assert loaded_inv is not None
    assert loaded_inv.quantity_on_hand == 20
    assert loaded_inv.quantity_reserved == 5
    assert loaded_inv.quantity_available == 15


@pytest.mark.asyncio
async def test_07_order_order_item_relationship(db_session: AsyncSession):
    """7. Test Order -> OrderItem relationship and customer linking."""
    customer = Customer(
        id=uuid.uuid4(),
        full_name="Sundaram Ramaswamy",
        company_name="Sundaram Silks Showroom",
        customer_type=CustomerType.WHOLESALE_MERCHANT,
        phone="+919876543222",
        city="Madurai",
        state="Tamil Nadu",
    )
    category = Category(id=uuid.uuid4(), name="Order Cat", slug="order-cat")
    product = Product(
        id=uuid.uuid4(),
        code="PVS-TEST-006",
        name="Order Silk",
        category=category,
        fabric="Pure Silk",
        color="Yellow",
        border="Zari",
        weave_type="Jacquard",
        description="Order test saree",
    )
    order = Order(
        id=uuid.uuid4(),
        order_number="PVS-ORD-2026-TEST-01",
        customer=customer,
        order_type=OrderType.WHOLESALE_BULK,
        order_status=OrderStatus.CONFIRMED,
        payment_status=PaymentStatus.ADVANCE_PAID,
        subtotal_amount=Decimal("50000.00"),
        tax_amount=Decimal("2500.00"),
        shipping_amount=Decimal("0.00"),
        total_amount=Decimal("52500.00"),
    )
    item = OrderItem(
        id=uuid.uuid4(),
        order=order,
        product=product,
        unit_price=Decimal("10000.00"),
        quantity=5,
        line_total=Decimal("50000.00"),
    )
    db_session.add_all([customer, category, product, order, item])
    await db_session.commit()

    loaded_order = await db_session.get(Order, order.id)
    assert loaded_order is not None
    assert loaded_order.order_status == OrderStatus.CONFIRMED
    assert loaded_order.total_amount == Decimal("52500.00")

    item_result = await db_session.execute(
        select(OrderItem).where(OrderItem.order_id == loaded_order.id)
    )
    items = item_result.scalars().all()
    assert len(items) == 1
    assert items[0].quantity == 5


@pytest.mark.asyncio
async def test_08_production_batch_and_stages_relationship(db_session: AsyncSession):
    """8. Test ProductionBatch -> ProductionStage 7-step sequence tracking."""
    category = Category(id=uuid.uuid4(), name="Prod Cat", slug="prod-cat")
    product = Product(
        id=uuid.uuid4(),
        code="PVS-TEST-007",
        name="Loom Silk",
        category=category,
        fabric="Pure Silk",
        color="Violet",
        border="Brocade",
        weave_type="Jacquard",
        description="Loom test saree",
    )
    batch = ProductionBatch(
        id=uuid.uuid4(),
        batch_number="BATCH-TEST-2026-001",
        product=product,
        loom_identifier="LOOM-ELEC-01",
        planned_quantity=10,
        completed_quantity=2,
        status=BatchStatus.WEAVING_IN_PROGRESS,
        start_date=date.today(),
    )
    s1 = ProductionStage(
        id=uuid.uuid4(),
        batch=batch,
        stage_sequence=1,
        stage_name="Raw Material Silk Sourcing",
        status=StageStatus.PASSED_QC,
        inspected_by="Inspector Ganesan",
    )
    s2 = ProductionStage(
        id=uuid.uuid4(),
        batch=batch,
        stage_sequence=2,
        stage_name="Yarn Hank Dyeing",
        status=StageStatus.PASSED_QC,
    )
    s3 = ProductionStage(
        id=uuid.uuid4(),
        batch=batch,
        stage_sequence=3,
        stage_name="Electronic Jacquard Weaving",
        status=StageStatus.IN_PROGRESS,
    )
    db_session.add_all([category, product, batch, s1, s2, s3])
    await db_session.commit()

    loaded_batch = await db_session.get(ProductionBatch, batch.id)
    assert loaded_batch is not None
    assert loaded_batch.status == BatchStatus.WEAVING_IN_PROGRESS

    stages_result = await db_session.execute(
        select(ProductionStage).where(ProductionStage.batch_id == batch.id).order_by(ProductionStage.stage_sequence)
    )
    stages = stages_result.scalars().all()
    assert len(stages) == 3
    assert stages[0].status == StageStatus.PASSED_QC
    assert stages[2].status == StageStatus.IN_PROGRESS


@pytest.mark.asyncio
async def test_09_foreign_key_cascade_deletion(db_session: AsyncSession):
    """9. Test CASCADE deletion on dependent children (Product -> ProductImage)."""
    category = Category(id=uuid.uuid4(), name="Cascade Cat", slug="cascade-cat")
    product = Product(
        id=uuid.uuid4(),
        code="PVS-TEST-008",
        name="Cascade Saree",
        category=category,
        fabric="Pure Silk",
        color="Teal",
        border="Temple",
        weave_type="Jacquard",
        description="Cascade test",
    )
    img = ProductImage(
        id=uuid.uuid4(),
        product=product,
        image_url="https://images.unsplash.com/cascade-photo",
        is_primary=True,
    )
    db_session.add_all([category, product, img])
    await db_session.commit()

    # Delete product
    await db_session.delete(product)
    await db_session.commit()

    # Verify that image was cascaded
    img_check = await db_session.get(ProductImage, img.id)
    assert img_check is None


@pytest.mark.asyncio
async def test_10_unique_product_code_constraint(db_session: AsyncSession):
    """10. Test UNIQUE constraint violation on duplicate Product.code."""
    category = Category(id=uuid.uuid4(), name="Unique Cat", slug="unique-cat")
    db_session.add(category)
    await db_session.commit()

    p1 = Product(
        id=uuid.uuid4(),
        code="PVS-DUPLICATE-CODE",
        name="Saree One",
        category_id=category.id,
        fabric="Pure Silk",
        color="Red",
        border="Zari",
        weave_type="Jacquard",
        description="First product",
    )
    db_session.add(p1)
    await db_session.commit()

    p2 = Product(
        id=uuid.uuid4(),
        code="PVS-DUPLICATE-CODE",  # Duplicate code
        name="Saree Two",
        category_id=category.id,
        fabric="Pure Silk",
        color="Blue",
        border="Zari",
        weave_type="Jacquard",
        description="Second product with conflicting code",
    )
    db_session.add(p2)
    with pytest.raises(IntegrityError):
        await db_session.commit()
    await db_session.rollback()

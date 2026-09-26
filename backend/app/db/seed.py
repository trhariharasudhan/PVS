"""Development Database Seed Script for PVS Silk S.

WARNING: This seed script is strictly intended for local development and integration testing.
All records created here are explicitly designated as DEMO fixtures.
Never run this against production databases.
"""

import asyncio
import uuid
from decimal import Decimal
from datetime import datetime, timezone, date
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models import (
    User,
    UserRole,
    Category,
    Product,
    ProductImage,
    AvailabilityStatus,
    Inventory,
    Customer,
    CustomerType,
    WholesaleEnquiry,
    EnquiryStatus,
    Supplier,
    RawMaterial,
    RawMaterialStock,
    MaterialType,
    UnitOfMeasure,
    ProductionBatch,
    ProductionStage,
    BatchStatus,
    StageStatus,
)
from app.core.security import get_password_hash
from app.core.config import settings


async def seed_development_data():
    """Populates the database with demo records for local development."""
    if settings.is_production:
        raise RuntimeError(
            "CRITICAL SAFETY VIOLATION: Refusing to seed demo fixtures into a PRODUCTION environment. "
            "For production initialization, use app.db.init_prod to configure verified staff credentials."
        )

    async with AsyncSessionLocal() as session:
        print("[SEED] Checking existing records...")
        existing_cat = await session.execute(select(Category).limit(1))
        if existing_cat.scalars().first():
            print("[SEED] Database already contains records. Skipping seed.")
            return

        print("[SEED] Creating Development Demo Users...")
        dev_hash = get_password_hash("pvs_demo_admin_2026")
        admin_user = User(
            id=uuid.uuid4(),
            email="dev.admin@pvssilks.local",
            hashed_password=dev_hash,
            full_name="Local Dev Administrator",
            role=UserRole.SUPER_ADMIN,
            is_active=True,
        )
        factory_user = User(
            id=uuid.uuid4(),
            email="dev.factory@pvssilks.local",
            hashed_password=dev_hash,
            full_name="Local Dev Factory Manager",
            role=UserRole.FACTORY_MANAGER,
            is_active=True,
        )
        session.add_all([admin_user, factory_user])

        print("[SEED] Creating Categories...")
        cat_pure_silk = Category(
            id=uuid.uuid4(),
            name="Pure Silk Sarees",
            slug="pure-silk",
            tagline="Authentic Silk Mark Quality",
            description="Woven using high-twist pure mulberry silk warp and weft for unmatched luster.",
            banner_image_url="https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?q=80&w=900&auto=format&fit=crop",
            display_order=1,
            is_active=True,
        )
        cat_bridal = Category(
            id=uuid.uuid4(),
            name="Bridal & Wedding",
            slug="bridal",
            tagline="Timeless Grandeur for Auspicious Moments",
            description="Heavy brocade body, intricate temple borders, and rich zari pallu.",
            banner_image_url="https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=900&auto=format&fit=crop",
            display_order=2,
            is_active=True,
        )
        cat_traditional = Category(
            id=uuid.uuid4(),
            name="Traditional Weaves",
            slug="traditional",
            tagline="Heritage Motifs & Korvai Borders",
            description="Classic South Indian motifs including Mayil, Rudraksham, and Ganga-Jamuna dual borders.",
            banner_image_url="https://images.unsplash.com/photo-1610030469668-93530c17b58f?q=80&w=900&auto=format&fit=crop",
            display_order=3,
            is_active=True,
        )
        cat_soft_silk = Category(
            id=uuid.uuid4(),
            name="Soft Silk",
            slug="soft-silk",
            tagline="Lightweight Elegance & Effortless Drape",
            description="Feather-light silk weave offering modern color palettes and delicate zari accents.",
            banner_image_url="https://images.unsplash.com/photo-1610030469854-41125208f237?q=80&w=900&auto=format&fit=crop",
            display_order=4,
            is_active=True,
        )
        cat_new_arrivals = Category(
            id=uuid.uuid4(),
            name="New Arrivals",
            slug="new-arrivals",
            tagline="Fresh Off The Looms",
            description="Our newest creations straight from the master weavers' looms.",
            banner_image_url="https://images.unsplash.com/photo-1590736969955-71cc94801759?q=80&w=900&auto=format&fit=crop",
            display_order=5,
            is_active=True,
        )
        session.add_all([cat_pure_silk, cat_bridal, cat_traditional, cat_soft_silk, cat_new_arrivals])

        print("[SEED] Creating Demo Products...")
        products_data = [
            {
                "code": "PVS-DEMO-001",
                "name": "Aadrika Crimson Bridal Kanchipuram Silk",
                "category": cat_bridal,
                "fabric": "100% Pure Mulberry Silk (3-Ply Warp & Weft)",
                "color": "Deep Crimson Red with Antique Gold Zari",
                "border": "Broad Korvai Temple Border with Mayil & Rudraksham",
                "pallu": "Rich Floral Brocade Pallu with Heavy Gold Zari Work",
                "motif": "Mayil (Peacock) & Temple Gopuram",
                "weave_type": "Traditional Korvai Interlocking Jacquard Weave",
                "description": "A masterwork of traditional Tamil Nadu weaving, featuring authentic Korvai interlocking borders with intricate temple spires.",
                "detailed_story": "Crafted across 120 hours of continuous loom precision, this saree embodies the solemn dignity of South Indian bridal traditions.",
                "price": Decimal("18500.00"),
                "is_price_on_enquiry": True,
                "price_note": "Direct Manufacturer Pricing / Bulk Discounts for Boutiques",
                "availability_status": AvailabilityStatus.IN_STOCK,
                "saree_length_meters": Decimal("5.50"),
                "blouse_piece_description": "0.8 Metres Contrast Brocade Included",
                "weight_approx_grams": 780,
                "care_instructions": ["Dry clean only", "Store wrapped in cotton or muslin", "Reverse iron on silk mode"],
                "is_featured": True,
                "is_new_arrival": False,
                "images": [
                    ("https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1200&auto=format&fit=crop", "Full Saree Drape", "Full Saree", True),
                    ("https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?q=80&w=1200&auto=format&fit=crop", "Border & Zari Detail", "Border Detail", False),
                    ("https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=1200&auto=format&fit=crop", "Floral Brocade Pallu", "Pallu", False),
                ],
            },
            {
                "code": "PVS-DEMO-002",
                "name": "Mayuri Emerald & Mustard Traditional Silk",
                "category": cat_traditional,
                "fabric": "Pure Silk (Double Warp)",
                "color": "Emerald Green with Warm Mustard Gold",
                "border": "Dual Ganga-Jamuna Contrast Border with Paisley Motifs",
                "pallu": "Geometric Diamond & Elephant Motif Zari Pallu",
                "motif": "Elephant & Annapakshi Bird",
                "weave_type": "High-Density Precision Loom Weave",
                "description": "A classic heritage pairing of rich emerald green and warm mustard, finished with dual Ganga-Jamuna border accents.",
                "detailed_story": "Captures the timeless aesthetic of heritage celebrations with lustrous light reflection.",
                "price": Decimal("14200.00"),
                "is_price_on_enquiry": True,
                "price_note": "Wholesale MOQ: 5 units per colorway",
                "availability_status": AvailabilityStatus.IN_STOCK,
                "saree_length_meters": Decimal("5.50"),
                "blouse_piece_description": "0.8 Metres Plain Mustard with Border",
                "weight_approx_grams": 720,
                "care_instructions": ["Dry clean only", "Store in breathable cotton covers"],
                "is_featured": True,
                "is_new_arrival": False,
                "images": [
                    ("https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?q=80&w=1200&auto=format&fit=crop", "Emerald Green Full Drape", "Full Saree", True),
                    ("https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1200&auto=format&fit=crop", "Border & Pallu Detail", "Border Detail", False),
                ],
            },
            {
                "code": "PVS-DEMO-003",
                "name": "Rukmani Royal Violet & Champagne Zari Brocade",
                "category": cat_pure_silk,
                "fabric": "100% Pure Mulberry Silk",
                "color": "Imperial Royal Violet with Soft Champagne Zari",
                "border": "Intricate Floral Jaal with Scalloped Zari Edge",
                "pallu": "Grand Architectural Arch Pattern Pallu",
                "motif": "Floral Vines & Temple Arches",
                "weave_type": "Full Body Jacquard Weave",
                "description": "An imperial violet silk masterpiece featuring subtle all-over floral vines and grand architectural pallu.",
                "detailed_story": "Engineered for prestigious evening gatherings, providing high contrast without harsh glitter.",
                "price": Decimal("16800.00"),
                "is_price_on_enquiry": True,
                "price_note": "Direct from manufacturing looms",
                "availability_status": AvailabilityStatus.IN_STOCK,
                "saree_length_meters": Decimal("5.50"),
                "blouse_piece_description": "0.8 Metres Violet Brocade Included",
                "weight_approx_grams": 740,
                "care_instructions": ["Professional dry clean recommended"],
                "is_featured": True,
                "is_new_arrival": True,
                "images": [
                    ("https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=1200&auto=format&fit=crop", "Royal Violet Drape", "Full Saree", True),
                    ("https://images.unsplash.com/photo-1610030469668-93530c17b58f?q=80&w=1200&auto=format&fit=crop", "Floral Jaal Texture", "Fabric Texture", False),
                ],
            },
            {
                "code": "PVS-DEMO-004",
                "name": "Saundarya Pastel Blush Soft Silk Saree",
                "category": cat_soft_silk,
                "fabric": "Featherlight Pure Soft Silk",
                "color": "Pastel Blush Rose with Silver & Copper Zari",
                "border": "Minimalist Sleek Zari Piping with Chevron Trim",
                "pallu": "Modern Linear Geometric Stripes",
                "motif": "Chevron & Linear Geometrics",
                "weave_type": "Contemporary Lightweight Silk Weave",
                "description": "Crafted for modern sensibilities, merging airy comfort with dual-tone silver and copper zari accents.",
                "detailed_story": "Weighing under 500 grams, specially woven to achieve a butter-soft drape.",
                "price": Decimal("11500.00"),
                "is_price_on_enquiry": True,
                "price_note": "Ideal for bridesmaids and modern festive wear",
                "availability_status": AvailabilityStatus.IN_STOCK,
                "saree_length_meters": Decimal("5.50"),
                "blouse_piece_description": "0.8 Metres Matching Blush Silk",
                "weight_approx_grams": 480,
                "care_instructions": ["Dry clean or gentle hand wash with mild protein shampoo"],
                "is_featured": True,
                "is_new_arrival": True,
                "images": [
                    ("https://images.unsplash.com/photo-1610030469854-41125208f237?q=80&w=1200&auto=format&fit=crop", "Pastel Blush Saree View", "Full Saree", True),
                    ("https://images.unsplash.com/photo-1590736969955-71cc94801759?q=80&w=1200&auto=format&fit=crop", "Soft Silk Sheen", "Fabric Texture", False),
                ],
            },
            {
                "code": "PVS-DEMO-005",
                "name": "Kalyani Temple Gold Tissue Silk Saree",
                "category": cat_bridal,
                "fabric": "Pure Silk-Zari Tissue Blend",
                "color": "Liquid Antique Gold with Subtle Vermillion Sheen",
                "border": "Traditional Temple G願i Border with Yali Crests",
                "pallu": "Ornate Full-Zari Tree of Life Pallu",
                "motif": "Yali & Tree of Life",
                "weave_type": "Double Zari Metallic Warp Weave",
                "description": "An ethereal liquid gold tissue silk saree designed for the bride's ceremonial muhurtham.",
                "price": Decimal("22000.00"),
                "is_price_on_enquiry": True,
                "availability_status": AvailabilityStatus.LIMITED_WEAVE,
                "saree_length_meters": Decimal("5.50"),
                "weight_approx_grams": 820,
                "is_featured": False,
                "is_new_arrival": False,
                "images": [
                    ("https://images.unsplash.com/photo-1590736969955-71cc94801759?q=80&w=1200&auto=format&fit=crop", "Gold Tissue Full Saree", "Full Saree", True),
                ],
            },
            {
                "code": "PVS-DEMO-006",
                "name": "Meenakshi Peacock Teal & Coral Korvai Silk",
                "category": cat_traditional,
                "fabric": "100% Pure Mulberry Silk",
                "color": "Deep Peacock Teal with Vibrant Coral Red",
                "border": "Korvai Contrast Border with Annapakshi Motifs",
                "pallu": "Rich Chevron and Diamond Brocade",
                "motif": "Annapakshi (Mythical Bird)",
                "weave_type": "Handcrafted Korvai Technique",
                "description": "A quintessential South Indian color harmony of oceanic teal and auspicious coral red.",
                "price": Decimal("15500.00"),
                "is_price_on_enquiry": True,
                "availability_status": AvailabilityStatus.IN_STOCK,
                "saree_length_meters": Decimal("5.50"),
                "weight_approx_grams": 750,
                "is_featured": False,
                "is_new_arrival": False,
                "images": [
                    ("https://images.unsplash.com/photo-1610030469668-93530c17b58f?q=80&w=1200&auto=format&fit=crop", "Peacock Teal Saree Drape", "Full Saree", True),
                ],
            },
        ]

        for p_data in products_data:
            prod = Product(
                id=uuid.uuid4(),
                code=p_data["code"],
                name=p_data["name"],
                category=p_data["category"],
                fabric=p_data["fabric"],
                color=p_data["color"],
                border=p_data["border"],
                pallu=p_data.get("pallu"),
                motif=p_data.get("motif"),
                weave_type=p_data["weave_type"],
                description=p_data["description"],
                detailed_story=p_data.get("detailed_story"),
                price=p_data.get("price"),
                currency="INR",
                is_price_on_enquiry=p_data.get("is_price_on_enquiry", True),
                price_note=p_data.get("price_note"),
                availability_status=p_data.get("availability_status", AvailabilityStatus.IN_STOCK),
                saree_length_meters=p_data.get("saree_length_meters", Decimal("5.50")),
                blouse_piece_description=p_data.get("blouse_piece_description"),
                weight_approx_grams=p_data.get("weight_approx_grams"),
                care_instructions=p_data.get("care_instructions"),
                is_featured=p_data.get("is_featured", False),
                is_new_arrival=p_data.get("is_new_arrival", False),
                is_active=True,
            )
            session.add(prod)

            # Add images
            for order_idx, (img_url, alt, tag, is_prim) in enumerate(p_data["images"], start=1):
                img = ProductImage(
                    id=uuid.uuid4(),
                    product=prod,
                    image_url=img_url,
                    alt_text=alt,
                    tag=tag,
                    display_order=order_idx,
                    is_primary=is_prim,
                )
                session.add(img)

            # Add inventory
            inv = Inventory(
                id=uuid.uuid4(),
                product=prod,
                quantity_on_hand=10,
                quantity_reserved=1,
                reorder_threshold=3,
                warehouse_location="DEMO-BAY-1",
            )
            session.add(inv)

        print("[SEED] Creating Demo Wholesale Enquiry...")
        enquiry_1 = WholesaleEnquiry(
            id=uuid.uuid4(),
            business_name="Sri Krishna Silks Showroom [DEMO]",
            contact_person="Sundaram R",
            phone="+919876543210",
            email="sundaram@srikrishnasilks.test",
            city="Chennai",
            business_type="Retail Saree Showroom",
            number_of_stores="3-5 Stores",
            interested_collection="Pure Silk & Bridal Sarees",
            expected_quantity="25-50 Sarees",
            message="Interested in visiting the loom facility and ordering initial sample sets.",
            status=EnquiryStatus.NEW,
            assigned_user=admin_user,
        )
        session.add(enquiry_1)

        await session.commit()
        print("[SEED] ✅ Development demo dataset seeded successfully.")


if __name__ == "__main__":
    asyncio.run(seed_development_data())

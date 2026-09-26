import uuid
from typing import Optional, List, Tuple
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.supplier import Supplier, SupplierType
from app.models.raw_material import RawMaterial
from app.models.purchase import PurchaseOrder
from app.schemas.admin.supplier import AdminSupplierCreate, AdminSupplierUpdate


class AdminSupplierRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_code(self, supplier_code: str) -> Optional[Supplier]:
        query = select(Supplier).where(Supplier.supplier_code == supplier_code.strip().upper())
        result = await self.session.execute(query)
        return result.scalars().first()

    async def get_paginated(
        self,
        page: int = 1,
        limit: int = 15,
        search: Optional[str] = None,
        supplier_type: Optional[str] = None,
        is_active: Optional[bool] = None,
    ) -> Tuple[List[Tuple[Supplier, int, int]], int]:
        """Query suppliers with materials count and purchase orders count."""
        mat_subq = (
            select(RawMaterial.supplier_id, func.count(RawMaterial.id).label("mats_count"))
            .group_by(RawMaterial.supplier_id)
            .subquery()
        )

        po_subq = (
            select(PurchaseOrder.supplier_id, func.count(PurchaseOrder.id).label("pos_count"))
            .group_by(PurchaseOrder.supplier_id)
            .subquery()
        )

        base_query = (
            select(
                Supplier,
                func.coalesce(mat_subq.c.mats_count, 0).label("mats_count"),
                func.coalesce(po_subq.c.pos_count, 0).label("pos_count"),
            )
            .outerjoin(mat_subq, mat_subq.c.supplier_id == Supplier.id)
            .outerjoin(po_subq, po_subq.c.supplier_id == Supplier.id)
        )

        if is_active is not None:
            base_query = base_query.where(Supplier.is_active.is_(is_active))

        if supplier_type:
            try:
                stype_enum = SupplierType(supplier_type.upper().strip())
                base_query = base_query.where(Supplier.supplier_type == stype_enum)
            except ValueError:
                pass

        if search and search.strip():
            term = f"%{search.strip()}%"
            base_query = base_query.where(
                or_(
                    Supplier.supplier_code.ilike(term),
                    Supplier.supplier_name.ilike(term),
                    Supplier.contact_person.ilike(term),
                    Supplier.phone.ilike(term),
                    Supplier.location.ilike(term),
                )
            )

        count_q = select(func.count()).select_from(base_query.subquery())
        total = (await self.session.execute(count_q)).scalar() or 0

        offset = (page - 1) * limit
        query = (
            base_query
            .order_by(Supplier.created_at.desc())
            .offset(offset)
            .limit(limit)
        )

        result = await self.session.execute(query)
        return list(result.all()), total

    async def get_by_id(self, supplier_id: uuid.UUID) -> Optional[Supplier]:
        query = select(Supplier).where(Supplier.id == supplier_id)
        result = await self.session.execute(query)
        return result.scalars().first()

    async def create(self, data: AdminSupplierCreate) -> Supplier:
        existing = await self.get_by_code(data.supplier_code)
        if existing:
            raise ValueError(f"Supplier with code '{data.supplier_code}' already exists.")

        supplier = Supplier(
            id=uuid.uuid4(),
            supplier_code=data.supplier_code.strip().upper(),
            supplier_name=data.supplier_name.strip(),
            supplier_type=data.supplier_type,
            contact_person=data.contact_person.strip(),
            phone=data.phone.strip(),
            email=data.email.strip().lower() if data.email else None,
            location=data.location.strip(),
            address=data.address.strip() if data.address else None,
            gstin=data.gstin.strip().upper() if data.gstin else None,
            notes=data.notes.strip() if data.notes else None,
            is_active=data.is_active,
        )
        self.session.add(supplier)
        await self.session.commit()
        await self.session.refresh(supplier)
        return supplier

    async def update(self, supplier: Supplier, data: AdminSupplierUpdate) -> Supplier:
        update_dict = data.model_dump(exclude_unset=True)

        if "supplier_name" in update_dict and update_dict["supplier_name"]:
            supplier.supplier_name = update_dict["supplier_name"].strip()
        if "supplier_type" in update_dict and update_dict["supplier_type"]:
            supplier.supplier_type = update_dict["supplier_type"]
        if "contact_person" in update_dict and update_dict["contact_person"]:
            supplier.contact_person = update_dict["contact_person"].strip()
        if "phone" in update_dict and update_dict["phone"]:
            supplier.phone = update_dict["phone"].strip()
        if "email" in update_dict:
            supplier.email = update_dict["email"].strip().lower() if update_dict["email"] else None
        if "location" in update_dict and update_dict["location"]:
            supplier.location = update_dict["location"].strip()
        if "address" in update_dict:
            supplier.address = update_dict["address"].strip() if update_dict["address"] else None
        if "gstin" in update_dict:
            supplier.gstin = update_dict["gstin"].strip().upper() if update_dict["gstin"] else None
        if "notes" in update_dict:
            supplier.notes = update_dict["notes"].strip() if update_dict["notes"] else None
        if "is_active" in update_dict:
            supplier.is_active = update_dict["is_active"]

        await self.session.commit()
        await self.session.refresh(supplier)
        return supplier

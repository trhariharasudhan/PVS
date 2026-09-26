# PVS Silk S — PostgreSQL Database & Migration Guide
**Document Version:** 1.0.0  
**Phase:** Phase 2 — Database Foundation  
**Database:** PostgreSQL 16  
**ORM / Migration Engine:** SQLAlchemy 2.x / Alembic  

---

## 1. Overview & Setup

The PVS Silk S database platform is built on PostgreSQL 16 utilizing an asynchronous I/O driver (`asyncpg`) and migration version control via Alembic. All public primary keys use UUIDv4 identifiers to ensure data security and avoid exposing internal incremental database counters.

---

## 2. Environment Variables

The database connection is configured entirely through environment variables.

| Variable | Default Value (Dev) | Description |
|---|---|---|
| `POSTGRES_USER` | `postgres` | PostgreSQL database superuser |
| `POSTGRES_PASSWORD` | `postgres` | PostgreSQL database password |
| `POSTGRES_DB` | `pvs_silks_db` | Main application database name |
| `POSTGRES_PORT` | `5432` | Local PostgreSQL port |
| `DATABASE_URL` | `postgresql+asyncpg://postgres:postgres@localhost:5432/pvs_silks_db` | Async database connection string |

> [!CAUTION]
> Never commit `.env` files containing real production database credentials to Git. Always use `.env.example` as the safe template.

---

## 3. Docker Compose PostgreSQL Service

To start the local PostgreSQL 16 database with persistent Docker volume storage:

```bash
# Start PostgreSQL service in detached mode
docker compose up -d postgres

# Check database container status & health
docker compose ps postgres

# View PostgreSQL container logs
docker compose logs -f postgres
```

---

## 4. Alembic Database Migration Commands

All database schema evolutions must be performed via Alembic. `Base.metadata.create_all()` is strictly forbidden in production.

### 4.1 Apply Migrations
```bash
# Navigate to backend directory
cd backend

# Upgrade to the latest migration revision (head)
python -m alembic upgrade head
```

### 4.2 Rollback Migrations
```bash
# Rollback the last migration step (-1)
python -m alembic downgrade -1

# Rollback to a specific revision ID
python -m alembic downgrade <revision_id>

# Rollback all migrations to empty database
python -m alembic downgrade base
```

### 4.3 Generate New Migration (Auto-generate)
```bash
# After modifying models in backend/app/models/
python -m alembic revision --autogenerate -m "describe_schema_change"
```

### 4.4 Inspect Migration SQL (Offline Mode)
```bash
# Preview the generated SQL DDL without executing it against the database
python -m alembic upgrade head --sql
```

---

## 5. Development Seed Data

A dedicated development seed script is provided in `backend/app/db/seed.py`.

```bash
# Execute development seeding
python -m app.db.seed
```

> [!NOTE]
> All seeded records are explicitly designated with demo codes (e.g. `PVS-DEMO-001`, `demo-bridal`, `dev.admin@pvssilks.local`). The script will automatically skip execution if existing records are detected.

---

## 6. Automated Testing Strategy

Database tests are executed using an isolated in-memory asynchronous SQLite engine (`sqlite+aiosqlite:///:memory:`). This provides:
- 100% isolation from development or production PostgreSQL instances.
- Zero leftover test records or state pollution.
- Sub-second execution speeds (14 tests in ~1.5s).
- Full verification of constraints, foreign keys, and relationship cascades.

Run test suite:
```bash
cd backend
python -m pytest app/tests -v
```

---

## 7. Schema Architecture & Entity Matrix

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            PVS SILK S SCHEMA                                │
├─────────────────────────────────────────────────────────────────────────────┤
│ • users                : Administrator, manager, and dealer accounts        │
│ • categories           : Saree collection categories (Pure Silk, Bridal)    │
│ • products             : Saree models, weave specifications, pricing        │
│ • product_images       : Multi-angle high-res photography assets            │
│ • inventory            : Real-time stock counts (on-hand, reserved)         │
│ • inventory_movements  : Immutable stock audit ledger (Production, Sale)    │
│ • customers            : Retail, boutique, and wholesale buyer profiles     │
│ • orders               : Sales orders with status lifecycle & GST           │
│ • order_items          : Individual line items and custom color notes       │
│ • wholesale_enquiries  : B2B retail trade applications & follow-up CRM      │
│ • production_batches   : Loom weaving runs and planned quantities           │
│ • production_stages    : 7-stage milestone checkpoint progress              │
│ • suppliers            : Silk filature mills and zari vendors               │
│ • raw_materials        : Mulberry silk hanks, zari reels, eco dyes          │
│ • raw_material_stock   : Physical raw inventory available for weaving       │
└─────────────────────────────────────────────────────────────────────────────┘
```

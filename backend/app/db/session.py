from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import NullPool
from app.core.config import settings

# Configure engine options adaptively
engine_kwargs: dict = {
    "echo": settings.ENVIRONMENT == "development",
    "future": True,
    "pool_pre_ping": True,
}

# Connection pooling settings for non-SQLite databases
if "sqlite" not in settings.effective_database_url.lower():
    if settings.is_transaction_pooler:
        # In transaction pooling mode (Supavisor / PgBouncer on port 6543),
        # external pooling is already managed server-side. Using NullPool avoids
        # double-pooling, connection starvation, and unsupported pool_size args.
        engine_kwargs["poolclass"] = NullPool
    else:
        # In session pooling mode (port 5432), local PostgreSQL, or direct connections,
        # SQLAlchemy automatically uses AsyncAdaptedQueuePool with bounded sizing.
        engine_kwargs["pool_size"] = settings.DB_POOL_SIZE
        engine_kwargs["max_overflow"] = settings.DB_MAX_OVERFLOW
        engine_kwargs["pool_timeout"] = settings.DB_POOL_TIMEOUT
        engine_kwargs["pool_recycle"] = settings.DB_POOL_RECYCLE

# Configure driver connect_args for transaction vs session poolers
connect_args: dict = {}
if "postgresql" in settings.effective_database_url.lower():
    if settings.is_transaction_pooler:
        # In transaction pooling mode (Supavisor / PgBouncer on port 6543),
        # prepared statements cannot be cached across transactions by asyncpg.
        connect_args["statement_cache_size"] = 0
        connect_args["prepared_statement_cache_size"] = 0
    # In session pooling mode (port 5432) or direct connections,
    # prepared statement caching remains enabled for performance.

if connect_args:
    engine_kwargs["connect_args"] = connect_args

engine = create_async_engine(
    settings.effective_database_url,
    **engine_kwargs,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for obtaining an asynchronous database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

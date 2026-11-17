import os
import re
from typing import List, Union, Optional
from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # Core Application Settings
    PROJECT_NAME: str = "PVS Silk S API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"  # development | staging | production
    DEBUG: bool = False

    # Security & Tokens
    SECRET_KEY: str = "pvs-silks-insecure-secret-key-change-in-production-2026"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 12  # 12 hours for staff admin sessions

    # Cookie Configuration for Browser-based Admin Session
    AUTH_COOKIE_NAME: str = "pvs_access_token"
    COOKIE_SECURE: Optional[bool] = None  # None = auto-detect based on ENVIRONMENT
    COOKIE_SAMESITE: str = "lax"  # 'lax' or 'strict'

    # Initial Admin Seed Parameters (Never hardcode production credentials)
    ADMIN_INITIAL_EMAIL: str = "admin@pvssilks.local"
    ADMIN_INITIAL_PASSWORD: Optional[str] = None

    # CORS Configuration
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost",
        "https://pvssilks.com",
    ]

    # Database Configuration
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/pvs_silks_db"
    # Optional direct migration connection for Alembic DDL (recommended for Supabase direct/session port 5432)
    DIRECT_URL: Optional[str] = None
    # Connection Pooler configuration (e.g., 'session' or 'transaction', None for auto-detect based on port)
    DB_POOL_MODE: Optional[str] = None
    DB_POOL_SIZE: int = 5
    DB_MAX_OVERFLOW: int = 10
    DB_POOL_TIMEOUT: int = 30
    DB_POOL_RECYCLE: int = 1800

    # Business Identity Configuration
    BUSINESS_NAME: str = "PVS Silk S"
    BUSINESS_LEGAL_NAME: str = "PVS Silk S Private Limited"
    BUSINESS_TAGLINE: str = "Woven With Precision"
    BUSINESS_ADDRESS_LINE1: str = "42, Weavers Colony"
    BUSINESS_ADDRESS_LINE2: Optional[str] = None
    BUSINESS_CITY: str = "Kanchipuram"
    BUSINESS_DISTRICT: str = "Kanchipuram"
    BUSINESS_STATE: str = "Tamil Nadu"
    BUSINESS_PINCODE: str = "631501"
    BUSINESS_COUNTRY: str = "India"
    BUSINESS_PHONE: str = "+91 98427 12345"
    BUSINESS_WHATSAPP: str = "+919842712345"
    BUSINESS_EMAIL: str = "contact@pvssilks.com"
    BUSINESS_BILLING_EMAIL: str = "billing@pvssilks.com"
    BUSINESS_WEBSITE: str = "https://pvssilks.com"

    # Tax & Invoicing Configuration
    GST_ENABLED: bool = True
    BUSINESS_GSTIN: str = "33AAAAA0000A1Z5"
    BUSINESS_STATE_CODE: str = "33"
    DEFAULT_GST_RATE: float = 5.0
    INVOICE_PREFIX: str = "INV"

    # Bank Remittance Instructions for Invoices
    BANK_NAME: str = "State Bank of India"
    BANK_ACCOUNT_NAME: str = "PVS Silk S Private Limited"
    BANK_ACCOUNT_NUMBER: str = "39882200192"
    BANK_IFSC: str = "SBIN0000853"
    BANK_BRANCH: str = "Kanchipuram Main Branch"
    BANK_UPI_ID: str = "pvssilks@sbi"

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT.lower() in ("production", "prod")

    @property
    def is_staging(self) -> bool:
        return self.ENVIRONMENT.lower() in ("staging", "stage")

    @property
    def is_development(self) -> bool:
        return not self.is_production and not self.is_staging

    @property
    def effective_cookie_secure(self) -> bool:
        if self.COOKIE_SECURE is not None:
            return self.COOKIE_SECURE
        return self.is_production

    @property
    def full_business_address(self) -> str:
        parts = [
            self.BUSINESS_ADDRESS_LINE1,
            self.BUSINESS_ADDRESS_LINE2,
            f"{self.BUSINESS_CITY} - {self.BUSINESS_PINCODE}",
            self.BUSINESS_STATE,
            self.BUSINESS_COUNTRY,
        ]
        return ", ".join([p for p in parts if p])

    @property
    def is_transaction_pooler(self) -> bool:
        """
        Determines whether the database connection targets a transaction-mode pooler
        (such as Supavisor / PgBouncer in transaction mode on port 6543).
        """
        if self.DB_POOL_MODE:
            return self.DB_POOL_MODE.lower() in ("transaction", "tx")
        return ":6543" in str(self.DATABASE_URL).lower()

    @staticmethod
    def _normalize_asyncpg_url(raw: Optional[str]) -> str:
        """
        Normalizes a database URL for asyncpg and SQLAlchemy compatibility:
        1. Ensures the async driver prefix: postgresql+asyncpg://
        2. Normalizes SSL query parameter: converts 'sslmode=' to 'ssl=' because asyncpg
           specifically expects 'ssl=' and rejects 'sslmode=' with TypeError.
        3. Preserves all other query parameters, ports, and percent-encoded passwords.
        """
        url = str(raw or "").strip()
        if not url:
            return ""

        # Scheme normalization
        if url.startswith("postgres://"):
            url = "postgresql+asyncpg://" + url[len("postgres://"):]
        elif url.startswith("postgresql://"):
            url = "postgresql+asyncpg://" + url[len("postgresql://"):]

        # SSL parameter normalization for asyncpg:
        # In libpq / psycopg connection strings, 'sslmode=require' is standard.
        # asyncpg.connect() does not accept 'sslmode' keyword argument, raising:
        # TypeError: connect() got an unexpected keyword argument 'sslmode'
        # Instead, asyncpg expects 'ssl=require' (or boolean/SSLContext).
        # We safely replace 'sslmode=' only in the query string (after the last '?')
        # to avoid mutating passwords that might contain 'sslmode='.
        if "?" in url and "sslmode=" in url:
            base, query = url.rsplit("?", 1)
            query = re.sub(r"(^|&)sslmode=", r"\1ssl=", query)
            url = f"{base}?{query}"

        return url

    @property
    def effective_database_url(self) -> str:
        """
        Returns an asyncpg-compatible URL for the SQLAlchemy runtime engine.
        Normalizes standard postgresql:// or postgres:// schemes to postgresql+asyncpg://,
        and translates 'sslmode=' to 'ssl=' for asyncpg driver compatibility.
        """
        return self._normalize_asyncpg_url(self.DATABASE_URL)

    @property
    def effective_migration_url(self) -> str:
        """
        Returns the database URL for Alembic migrations.
        Prefers DIRECT_URL (direct port 5432 connection), falling back to DATABASE_URL.
        Normalizes schemes and SSL parameters for asyncpg driver compatibility.
        """
        return self._normalize_asyncpg_url(self.DIRECT_URL or self.DATABASE_URL)

    def validate_production_readiness(self) -> List[str]:
        """
        Returns a list of configuration warnings/errors when running in production.
        """
        errors = []
        if self.is_production:
            # 1. Security validation
            if "insecure" in self.SECRET_KEY.lower() or len(self.SECRET_KEY) < 32:
                errors.append("SECRET_KEY must be a cryptographically secure random string of at least 32 characters in production.")
            
            # 2. Database connection validation
            if "localhost" in self.DATABASE_URL or "127.0.0.1" in self.DATABASE_URL:
                errors.append("DATABASE_URL is pointing to localhost in production mode. Use managed cloud PostgreSQL.")
            
            # 3. GST Validation
            if self.GST_ENABLED:
                gstin_regex = r"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$"
                if not self.BUSINESS_GSTIN or "0000A1Z5" in self.BUSINESS_GSTIN or not re.match(gstin_regex, self.BUSINESS_GSTIN):
                    errors.append(f"BUSINESS_GSTIN ('{self.BUSINESS_GSTIN}') must be a valid 15-character Indian GSTIN format when GST_ENABLED is True.")
            
            # 4. Banking validation
            if not self.BANK_ACCOUNT_NUMBER or "REPLACE" in self.BANK_ACCOUNT_NUMBER:
                errors.append("BANK_ACCOUNT_NUMBER is required for production invoice remittance.")
            if not self.BANK_IFSC or len(self.BANK_IFSC) != 11:
                errors.append("BANK_IFSC must be a valid 11-character Indian Financial System Code.")

            # 5. CORS Validation
            for origin in self.CORS_ORIGINS:
                if "localhost" in origin or "127.0.0.1" in origin or origin == "*":
                    errors.append(f"CORS_ORIGINS contains unsecure/localhost origin '{origin}' in production.")
        return errors


settings = Settings()


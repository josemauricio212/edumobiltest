from collections.abc import AsyncGenerator

from datetime import datetime

from sqlalchemy import DateTime
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings


engine = create_async_engine(
    settings.database_url,
    echo=settings.database_echo,
)

SessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    # Os modelos gravam datetime.now(UTC) (com fuso); sem isso a coluna seria
    # TIMESTAMP sem fuso e o asyncpg recusa o valor.
    type_annotation_map = {datetime: DateTime(timezone=True)}


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with SessionLocal() as session:
        yield session


async def init_models() -> None:
    """Cria as tabelas ausentes. Atalho de desenvolvimento — em produção use Alembic."""
    import app.models  # noqa: F401  (registra os modelos no metadata)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

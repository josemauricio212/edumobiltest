from typing import Any, Generic, TypeVar
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

ModelType = TypeVar("ModelType")


class BaseRepository(Generic[ModelType]):
    def __init__(self, model: type[ModelType], session: AsyncSession):
        self.model = model
        self.session = session

    async def get_by_id(self, id: UUID) -> ModelType | None:
        return await self.session.get(self.model, id)

    async def find_one_by(self, **filtros: Any) -> ModelType | None:
        stmt = select(self.model).filter_by(**filtros).limit(1)
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def list_all(
        self,
        *,
        order_by: Any | None = None,
        offset: int = 0,
        limit: int | None = None,
        **filtros: Any,
    ) -> list[ModelType]:
        stmt = select(self.model)
        if filtros:
            stmt = stmt.filter_by(**filtros)
        if order_by is not None:
            stmt = stmt.order_by(order_by)
        if offset:
            stmt = stmt.offset(offset)
        if limit is not None:
            stmt = stmt.limit(limit)

        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def count(self, **filtros: Any) -> int:
        stmt = select(func.count()).select_from(self.model)
        if filtros:
            stmt = select(func.count()).select_from(
                select(self.model).filter_by(**filtros).subquery()
            )
        result = await self.session.execute(stmt)
        return int(result.scalar_one())

    async def create(self, obj: ModelType) -> ModelType:
        self.session.add(obj)
        await self.session.commit()
        await self.session.refresh(obj)
        return obj

    async def update(self, obj: ModelType) -> ModelType:
        self.session.add(obj)
        await self.session.commit()
        await self.session.refresh(obj)
        return obj

    async def delete(self, obj: ModelType) -> None:
        await self.session.delete(obj)
        await self.session.commit()

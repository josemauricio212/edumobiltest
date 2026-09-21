from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, NotFoundError
from app.models.motorista import Motorista
from app.repositories.base import BaseRepository

from .schemas import MotoristaCreate, MotoristaUpdate


class MotoristaService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = BaseRepository(Motorista, db)

    async def listar(
        self,
        *,
        busca: str | None = None,
        apenas_ativos: bool = False,
    ) -> list[Motorista]:
        stmt = select(Motorista)

        if busca:
            termo = f"%{busca.strip()}%"
            stmt = stmt.where(or_(Motorista.nome.ilike(termo), Motorista.cnh.ilike(termo)))
        if apenas_ativos:
            stmt = stmt.where(Motorista.ativo.is_(True))

        result = await self.db.execute(stmt.order_by(Motorista.nome))
        return list(result.scalars().all())

    async def contar(self, *, apenas_ativos: bool = False) -> int:
        stmt = select(func.count()).select_from(Motorista)
        if apenas_ativos:
            stmt = stmt.where(Motorista.ativo.is_(True))
        result = await self.db.execute(stmt)
        return int(result.scalar_one())

    async def obter(self, motorista_id: UUID) -> Motorista:
        motorista = await self.repo.get_by_id(motorista_id)
        if motorista is None:
            raise NotFoundError("Motorista não encontrado")
        return motorista

    async def _checar_cnh(self, cnh: str, ignorar_id: UUID | None = None) -> None:
        existente = await self.repo.find_one_by(cnh=cnh)
        if existente and existente.id != ignorar_id:
            raise ConflictError(f"Já existe um motorista com a CNH {cnh}")

    async def criar(self, dados: MotoristaCreate) -> Motorista:
        cnh = dados.cnh.strip()
        await self._checar_cnh(cnh)

        motorista = Motorista(
            nome=dados.nome.strip(),
            telefone=dados.telefone.strip(),
            cnh=cnh,
            ativo=True,
        )
        return await self.repo.create(motorista)

    async def atualizar(self, motorista_id: UUID, dados: MotoristaUpdate) -> Motorista:
        motorista = await self.obter(motorista_id)

        if dados.cnh is not None:
            cnh = dados.cnh.strip()
            await self._checar_cnh(cnh, ignorar_id=motorista.id)
            motorista.cnh = cnh
        if dados.nome is not None:
            motorista.nome = dados.nome.strip()
        if dados.telefone is not None:
            motorista.telefone = dados.telefone.strip()
        if dados.ativo is not None:
            motorista.ativo = dados.ativo

        return await self.repo.update(motorista)

    async def alternar_status(self, motorista_id: UUID) -> Motorista:
        motorista = await self.obter(motorista_id)
        motorista.ativo = not motorista.ativo
        return await self.repo.update(motorista)

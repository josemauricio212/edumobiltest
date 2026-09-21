from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppError, ConflictError, NotFoundError
from app.models.motorista import Motorista
from app.models.veiculo import Veiculo
from app.repositories.base import BaseRepository

from .schemas import StatusVeiculo, VeiculoCreate, VeiculoUpdate


class VeiculoService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = BaseRepository(Veiculo, db)

    async def listar(
        self,
        *,
        busca: str | None = None,
        status: str | None = None,
    ) -> list[Veiculo]:
        stmt = select(Veiculo)

        if busca:
            termo = f"%{busca.strip()}%"
            stmt = stmt.where(
                or_(
                    Veiculo.placa.ilike(termo),
                    Veiculo.modelo.ilike(termo),
                    Veiculo.tipo.ilike(termo),
                )
            )
        if status:
            stmt = stmt.where(Veiculo.status == status)

        result = await self.db.execute(stmt.order_by(Veiculo.placa))
        return list(result.scalars().all())

    async def listar_disponiveis(self) -> list[Veiculo]:
        return await self.listar(status=StatusVeiculo.DISPONIVEL.value)

    async def contar(self, *, status: str | None = None) -> int:
        stmt = select(func.count()).select_from(Veiculo)
        if status:
            stmt = stmt.where(Veiculo.status == status)
        result = await self.db.execute(stmt)
        return int(result.scalar_one())

    async def obter(self, veiculo_id: UUID) -> Veiculo:
        veiculo = await self.repo.get_by_id(veiculo_id)
        if veiculo is None:
            raise NotFoundError("Veículo não encontrado")
        return veiculo

    async def _checar_placa(self, placa: str, ignorar_id: UUID | None = None) -> None:
        existente = await self.repo.find_one_by(placa=placa)
        if existente and existente.id != ignorar_id:
            raise ConflictError(f"Já existe um veículo com a placa {placa}")

    async def _checar_motorista(self, motorista_id: UUID | None) -> None:
        if motorista_id is None:
            return
        motorista = await self.db.get(Motorista, motorista_id)
        if motorista is None:
            raise NotFoundError("Motorista informado não existe")
        if not motorista.ativo:
            raise AppError("Não é possível vincular um motorista inativo ao veículo")

    async def criar(self, dados: VeiculoCreate) -> Veiculo:
        await self._checar_placa(dados.placa)
        await self._checar_motorista(dados.proprietario_id)

        veiculo = Veiculo(
            placa=dados.placa,
            tipo=dados.tipo.strip(),
            modelo=dados.modelo.strip(),
            capacidade=dados.capacidade,
            consumo_medio=dados.consumo_medio,
            ano=dados.ano,
            proprietario_id=dados.proprietario_id,
            status=StatusVeiculo.DISPONIVEL.value,
        )
        return await self.repo.create(veiculo)

    async def atualizar(self, veiculo_id: UUID, dados: VeiculoUpdate) -> Veiculo:
        veiculo = await self.obter(veiculo_id)

        if dados.placa is not None:
            await self._checar_placa(dados.placa, ignorar_id=veiculo.id)
            veiculo.placa = dados.placa
        if dados.tipo is not None:
            veiculo.tipo = dados.tipo.strip()
        if dados.modelo is not None:
            veiculo.modelo = dados.modelo.strip()
        if dados.capacidade is not None:
            veiculo.capacidade = dados.capacidade
        if dados.consumo_medio is not None:
            veiculo.consumo_medio = dados.consumo_medio
        if dados.ano is not None:
            veiculo.ano = dados.ano
        if dados.status is not None:
            veiculo.status = dados.status.value
        if "proprietario_id" in dados.model_fields_set:
            await self._checar_motorista(dados.proprietario_id)
            veiculo.proprietario_id = dados.proprietario_id

        return await self.repo.update(veiculo)

    async def definir_status(self, veiculo_id: UUID, status: StatusVeiculo) -> Veiculo:
        veiculo = await self.obter(veiculo_id)
        veiculo.status = status.value
        return await self.repo.update(veiculo)

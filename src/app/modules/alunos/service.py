from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, NotFoundError
from app.models.aluno import Aluno
from app.repositories.base import BaseRepository

from .schemas import AlunoCreate, AlunoUpdate, StatusAluno


class AlunoService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = BaseRepository(Aluno, db)

    async def listar(
        self,
        *,
        busca: str | None = None,
        turno: str | None = None,
        status: str | None = None,
    ) -> list[Aluno]:
        stmt = select(Aluno)

        if busca:
            termo = f"%{busca.strip()}%"
            stmt = stmt.where(
                or_(
                    Aluno.nome.ilike(termo),
                    Aluno.matricula.ilike(termo),
                    Aluno.endereco.ilike(termo),
                )
            )
        if turno:
            stmt = stmt.where(Aluno.turno == turno)
        if status:
            stmt = stmt.where(Aluno.status == status)

        result = await self.db.execute(stmt.order_by(Aluno.nome))
        return list(result.scalars().all())

    async def listar_ativos_por_turno(self, turno: str) -> list[Aluno]:
        """Alunos elegíveis para uma rota. `integral` entra em qualquer turno."""
        stmt = select(Aluno).where(
            Aluno.status == StatusAluno.ATIVO.value,
            or_(Aluno.turno == turno, Aluno.turno == "integral"),
        )
        result = await self.db.execute(stmt.order_by(Aluno.nome))
        return list(result.scalars().all())

    async def contar(self, *, apenas_ativos: bool = False) -> int:
        stmt = select(func.count()).select_from(Aluno)
        if apenas_ativos:
            stmt = stmt.where(Aluno.status == StatusAluno.ATIVO.value)
        result = await self.db.execute(stmt)
        return int(result.scalar_one())

    async def obter(self, aluno_id: UUID) -> Aluno:
        aluno = await self.repo.get_by_id(aluno_id)
        if aluno is None:
            raise NotFoundError("Aluno não encontrado")
        return aluno

    async def _checar_matricula(self, matricula: str, ignorar_id: UUID | None = None) -> None:
        existente = await self.repo.find_one_by(matricula=matricula)
        if existente and existente.id != ignorar_id:
            raise ConflictError(f"Já existe um aluno com a matrícula {matricula}")

    async def criar(self, dados: AlunoCreate) -> Aluno:
        matricula = dados.matricula.strip()
        await self._checar_matricula(matricula)

        aluno = Aluno(
            matricula=matricula,
            nome=dados.nome.strip(),
            serie_ano=dados.serie_ano.strip(),
            turno=dados.turno.value,
            endereco=dados.endereco.strip(),
            latitude=dados.latitude,
            longitude=dados.longitude,
            responsavel_nome=(dados.responsavel_nome or "").strip() or None,
            responsavel_telefone=(dados.responsavel_telefone or "").strip() or None,
            status=StatusAluno.ATIVO.value,
        )
        return await self.repo.create(aluno)

    async def atualizar(self, aluno_id: UUID, dados: AlunoUpdate) -> Aluno:
        aluno = await self.obter(aluno_id)

        if dados.matricula is not None:
            matricula = dados.matricula.strip()
            await self._checar_matricula(matricula, ignorar_id=aluno.id)
            aluno.matricula = matricula
        if dados.nome is not None:
            aluno.nome = dados.nome.strip()
        if dados.serie_ano is not None:
            aluno.serie_ano = dados.serie_ano.strip()
        if dados.turno is not None:
            aluno.turno = dados.turno.value
        if dados.endereco is not None:
            aluno.endereco = dados.endereco.strip()
        if dados.latitude is not None:
            aluno.latitude = dados.latitude
        if dados.longitude is not None:
            aluno.longitude = dados.longitude
        if dados.responsavel_nome is not None:
            aluno.responsavel_nome = dados.responsavel_nome.strip() or None
        if dados.responsavel_telefone is not None:
            aluno.responsavel_telefone = dados.responsavel_telefone.strip() or None
        if dados.status is not None:
            aluno.status = dados.status.value

        return await self.repo.update(aluno)

    async def alternar_status(self, aluno_id: UUID) -> Aluno:
        aluno = await self.obter(aluno_id)
        aluno.status = (
            StatusAluno.INATIVO.value
            if aluno.status == StatusAluno.ATIVO.value
            else StatusAluno.ATIVO.value
        )
        return await self.repo.update(aluno)

    async def excluir(self, aluno_id: UUID) -> None:
        aluno = await self.obter(aluno_id)
        await self.repo.delete(aluno)

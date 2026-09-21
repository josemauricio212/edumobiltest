from uuid import UUID

from fastapi import APIRouter, Depends, Query, status

from app.core.deps import DbSession, require_cargo
from app.models.usuario import CargoUsuario

from .schemas import AlunoCreate, AlunoRead, AlunoUpdate
from .service import AlunoService

router = APIRouter()

pode_cadastrar = Depends(require_cargo(CargoUsuario.CADASTRAL, CargoUsuario.CHEFETRANSPORTE))
autenticado = Depends(
    require_cargo(CargoUsuario.CADASTRAL, CargoUsuario.CHEFETRANSPORTE, CargoUsuario.ADMIN)
)


@router.get("", response_model=list[AlunoRead], dependencies=[autenticado])
async def listar(
    db: DbSession,
    busca: str | None = Query(default=None),
    turno: str | None = Query(default=None),
    status_aluno: str | None = Query(default=None, alias="status"),
) -> list[AlunoRead]:
    alunos = await AlunoService(db).listar(busca=busca, turno=turno, status=status_aluno)
    return [AlunoRead.model_validate(a) for a in alunos]


@router.post(
    "",
    response_model=AlunoRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[pode_cadastrar],
)
async def criar(dados: AlunoCreate, db: DbSession) -> AlunoRead:
    aluno = await AlunoService(db).criar(dados)
    return AlunoRead.model_validate(aluno)


@router.get("/{aluno_id}", response_model=AlunoRead, dependencies=[autenticado])
async def obter(aluno_id: UUID, db: DbSession) -> AlunoRead:
    aluno = await AlunoService(db).obter(aluno_id)
    return AlunoRead.model_validate(aluno)


@router.patch("/{aluno_id}", response_model=AlunoRead, dependencies=[pode_cadastrar])
async def atualizar(aluno_id: UUID, dados: AlunoUpdate, db: DbSession) -> AlunoRead:
    aluno = await AlunoService(db).atualizar(aluno_id, dados)
    return AlunoRead.model_validate(aluno)


@router.post(
    "/{aluno_id}/alternar-status",
    response_model=AlunoRead,
    dependencies=[pode_cadastrar],
)
async def alternar_status(aluno_id: UUID, db: DbSession) -> AlunoRead:
    aluno = await AlunoService(db).alternar_status(aluno_id)
    return AlunoRead.model_validate(aluno)


@router.delete(
    "/{aluno_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[pode_cadastrar],
)
async def excluir(aluno_id: UUID, db: DbSession) -> None:
    await AlunoService(db).excluir(aluno_id)

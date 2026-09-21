from uuid import UUID

from fastapi import APIRouter, Depends, Query, status

from app.core.deps import DbSession, require_cargo
from app.models.usuario import CargoUsuario

from .schemas import MotoristaCreate, MotoristaRead, MotoristaUpdate
from .service import MotoristaService

router = APIRouter()

pode_cadastrar = Depends(require_cargo(CargoUsuario.CADASTRAL, CargoUsuario.CHEFETRANSPORTE))
autenticado = Depends(
    require_cargo(CargoUsuario.CADASTRAL, CargoUsuario.CHEFETRANSPORTE, CargoUsuario.ADMIN)
)


@router.get("", response_model=list[MotoristaRead], dependencies=[autenticado])
async def listar(
    db: DbSession,
    busca: str | None = Query(default=None),
    apenas_ativos: bool = Query(default=False),
) -> list[MotoristaRead]:
    motoristas = await MotoristaService(db).listar(busca=busca, apenas_ativos=apenas_ativos)
    return [MotoristaRead.model_validate(m) for m in motoristas]


@router.post(
    "",
    response_model=MotoristaRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[pode_cadastrar],
)
async def criar(dados: MotoristaCreate, db: DbSession) -> MotoristaRead:
    motorista = await MotoristaService(db).criar(dados)
    return MotoristaRead.model_validate(motorista)


@router.get("/{motorista_id}", response_model=MotoristaRead, dependencies=[autenticado])
async def obter(motorista_id: UUID, db: DbSession) -> MotoristaRead:
    motorista = await MotoristaService(db).obter(motorista_id)
    return MotoristaRead.model_validate(motorista)


@router.patch("/{motorista_id}", response_model=MotoristaRead, dependencies=[pode_cadastrar])
async def atualizar(motorista_id: UUID, dados: MotoristaUpdate, db: DbSession) -> MotoristaRead:
    motorista = await MotoristaService(db).atualizar(motorista_id, dados)
    return MotoristaRead.model_validate(motorista)


@router.post(
    "/{motorista_id}/alternar-status",
    response_model=MotoristaRead,
    dependencies=[pode_cadastrar],
)
async def alternar_status(motorista_id: UUID, db: DbSession) -> MotoristaRead:
    motorista = await MotoristaService(db).alternar_status(motorista_id)
    return MotoristaRead.model_validate(motorista)

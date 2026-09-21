from uuid import UUID

from fastapi import APIRouter, Depends, Query, status

from app.core.deps import DbSession, require_cargo
from app.models.usuario import CargoUsuario

from .schemas import StatusVeiculo, VeiculoCreate, VeiculoRead, VeiculoUpdate
from .service import VeiculoService

router = APIRouter()

pode_cadastrar = Depends(require_cargo(CargoUsuario.CADASTRAL, CargoUsuario.CHEFETRANSPORTE))
autenticado = Depends(
    require_cargo(CargoUsuario.CADASTRAL, CargoUsuario.CHEFETRANSPORTE, CargoUsuario.ADMIN)
)


@router.get("", response_model=list[VeiculoRead], dependencies=[autenticado])
async def listar(
    db: DbSession,
    busca: str | None = Query(default=None),
    status_veiculo: str | None = Query(default=None, alias="status"),
) -> list[VeiculoRead]:
    veiculos = await VeiculoService(db).listar(busca=busca, status=status_veiculo)
    return [VeiculoRead.model_validate(v) for v in veiculos]


@router.post(
    "",
    response_model=VeiculoRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[pode_cadastrar],
)
async def criar(dados: VeiculoCreate, db: DbSession) -> VeiculoRead:
    veiculo = await VeiculoService(db).criar(dados)
    return VeiculoRead.model_validate(veiculo)


@router.get("/{veiculo_id}", response_model=VeiculoRead, dependencies=[autenticado])
async def obter(veiculo_id: UUID, db: DbSession) -> VeiculoRead:
    veiculo = await VeiculoService(db).obter(veiculo_id)
    return VeiculoRead.model_validate(veiculo)


@router.patch("/{veiculo_id}", response_model=VeiculoRead, dependencies=[pode_cadastrar])
async def atualizar(veiculo_id: UUID, dados: VeiculoUpdate, db: DbSession) -> VeiculoRead:
    veiculo = await VeiculoService(db).atualizar(veiculo_id, dados)
    return VeiculoRead.model_validate(veiculo)


@router.post("/{veiculo_id}/status", response_model=VeiculoRead, dependencies=[pode_cadastrar])
async def definir_status(
    veiculo_id: UUID,
    novo_status: StatusVeiculo,
    db: DbSession,
) -> VeiculoRead:
    veiculo = await VeiculoService(db).definir_status(veiculo_id, novo_status)
    return VeiculoRead.model_validate(veiculo)

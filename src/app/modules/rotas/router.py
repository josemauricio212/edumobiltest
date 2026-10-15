from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status

from app.core.deps import DbSession, require_cargo
from app.models.usuario import CargoUsuario

from .schemas import (
    MarcarParada,
    ParadaRead,
    RelatorioRotas,
    ReordenarParadas,
    RotaCreate,
    RotaRead,
    RotaUpdate,
)
from .service import RotaService

router = APIRouter()

pode_operar = Depends(require_cargo(CargoUsuario.CHEFETRANSPORTE))
autenticado = Depends(
    require_cargo(CargoUsuario.CADASTRAL, CargoUsuario.CHEFETRANSPORTE, CargoUsuario.ADMIN)
)


@router.get("", response_model=list[RotaRead], dependencies=[autenticado])
async def listar(
    db: DbSession,
    status_rota: str | None = Query(default=None, alias="status"),
    turno: str | None = Query(default=None),
    data_inicio: date | None = Query(default=None),
    data_fim: date | None = Query(default=None),
) -> list[RotaRead]:
    rotas = await RotaService(db).listar(
        status=status_rota,
        turno=turno,
        data_inicio=data_inicio,
        data_fim=data_fim,
    )
    return [RotaRead.model_validate(r) for r in rotas]


@router.get("/relatorio", response_model=RelatorioRotas, dependencies=[autenticado])
async def relatorio(
    db: DbSession,
    data_inicio: date | None = Query(default=None),
    data_fim: date | None = Query(default=None),
) -> RelatorioRotas:
    return await RotaService(db).relatorio(data_inicio=data_inicio, data_fim=data_fim)


@router.post(
    "",
    response_model=RotaRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[pode_operar],
)
async def criar(dados: RotaCreate, db: DbSession) -> RotaRead:
    rota = await RotaService(db).criar(dados)
    return RotaRead.model_validate(rota)


@router.get("/{rota_id}", response_model=RotaRead, dependencies=[autenticado])
async def obter(rota_id: UUID, db: DbSession) -> RotaRead:
    rota = await RotaService(db).obter(rota_id)
    return RotaRead.model_validate(rota)


@router.patch("/{rota_id}", response_model=RotaRead, dependencies=[pode_operar])
async def atualizar(rota_id: UUID, dados: RotaUpdate, db: DbSession) -> RotaRead:
    rota = await RotaService(db).atualizar(rota_id, dados)
    return RotaRead.model_validate(rota)


@router.post("/{rota_id}/agrupar", response_model=RotaRead, dependencies=[pode_operar])
async def reagrupar(rota_id: UUID, db: DbSession) -> RotaRead:
    rota = await RotaService(db).reagrupar(rota_id)
    return RotaRead.model_validate(rota)


@router.post("/{rota_id}/otimizar", response_model=RotaRead, dependencies=[pode_operar])
async def otimizar(rota_id: UUID, db: DbSession) -> RotaRead:
    rota = await RotaService(db).otimizar(rota_id)
    return RotaRead.model_validate(rota)


@router.post("/{rota_id}/reordenar", response_model=RotaRead, dependencies=[pode_operar])
async def reordenar(rota_id: UUID, dados: ReordenarParadas, db: DbSession) -> RotaRead:
    rota = await RotaService(db).reordenar(rota_id, dados.parada_ids)
    return RotaRead.model_validate(rota)


@router.post("/{rota_id}/iniciar", response_model=RotaRead, dependencies=[pode_operar])
async def iniciar(rota_id: UUID, db: DbSession) -> RotaRead:
    rota = await RotaService(db).iniciar(rota_id)
    return RotaRead.model_validate(rota)


@router.post("/{rota_id}/concluir", response_model=RotaRead, dependencies=[pode_operar])
async def concluir(rota_id: UUID, db: DbSession) -> RotaRead:
    rota = await RotaService(db).concluir(rota_id)
    return RotaRead.model_validate(rota)


@router.post("/{rota_id}/cancelar", response_model=RotaRead, dependencies=[pode_operar])
async def cancelar(rota_id: UUID, db: DbSession) -> RotaRead:
    rota = await RotaService(db).cancelar(rota_id)
    return RotaRead.model_validate(rota)


@router.post("/paradas/{parada_id}", response_model=ParadaRead, dependencies=[pode_operar])
async def marcar_parada(parada_id: UUID, dados: MarcarParada, db: DbSession) -> ParadaRead:
    parada = await RotaService(db).marcar_parada(parada_id, dados.status)
    return ParadaRead.model_validate(parada)

from fastapi import APIRouter, Depends

from app.core.deps import DbSession, require_cargo
from app.models.usuario import CargoUsuario

from .schemas import EscolaRead, EscolaUpdate
from .service import EscolaService

router = APIRouter()

pode_configurar = Depends(require_cargo(CargoUsuario.CHEFETRANSPORTE))
autenticado = Depends(
    require_cargo(CargoUsuario.CADASTRAL, CargoUsuario.CHEFETRANSPORTE, CargoUsuario.ADMIN)
)


@router.get("", response_model=EscolaRead, dependencies=[autenticado])
async def obter(db: DbSession) -> EscolaRead:
    escola = await EscolaService(db).obter()
    return EscolaRead.model_validate(escola)


@router.put("", response_model=EscolaRead, dependencies=[pode_configurar])
async def atualizar(dados: EscolaUpdate, db: DbSession) -> EscolaRead:
    escola = await EscolaService(db).atualizar(dados)
    return EscolaRead.model_validate(escola)

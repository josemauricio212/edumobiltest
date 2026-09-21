from uuid import UUID

from fastapi import APIRouter, Depends, status

from app.core.deps import CurrentUser, DbSession, require_cargo
from app.core.exceptions import ConflictError
from app.core.security import create_access_token
from app.models.usuario import CargoUsuario

from .schemas import LoginRequest, TokenResponse, UsuarioCreate, UsuarioRead, UsuarioUpdate
from .service import UsuarioService

router = APIRouter()
auth_router = APIRouter()

somente_admin = Depends(require_cargo(CargoUsuario.ADMIN))


@auth_router.post("/login", response_model=TokenResponse)
async def login(dados: LoginRequest, db: DbSession) -> TokenResponse:
    usuario = await UsuarioService(db).autenticar(str(dados.email), dados.senha)
    token = create_access_token(
        subject=str(usuario.id),
        extra_claims={"cargo": usuario.cargo.value, "nome": usuario.nome},
    )
    return TokenResponse(access_token=token, usuario=UsuarioRead.model_validate(usuario))


@auth_router.get("/status")
async def status_instalacao(db: DbSession) -> dict[str, bool]:
    """Diz se o sistema ainda não tem usuários (tela de primeiro acesso)."""
    return {"primeiro_acesso": await UsuarioService(db).contar() == 0}


@auth_router.post("/primeiro-acesso", response_model=UsuarioRead, status_code=status.HTTP_201_CREATED)
async def primeiro_acesso(dados: UsuarioCreate, db: DbSession) -> UsuarioRead:
    """Cria o administrador inicial. Só funciona enquanto não existe nenhum usuário."""
    service = UsuarioService(db)
    if await service.contar() > 0:
        raise ConflictError("O sistema já possui usuários cadastrados")
    usuario = await service.garantir_admin_inicial(
        email=str(dados.email), senha=dados.senha, nome=dados.nome
    )
    return UsuarioRead.model_validate(usuario)


@auth_router.get("/me", response_model=UsuarioRead)
async def me(usuario: CurrentUser) -> UsuarioRead:
    return UsuarioRead.model_validate(usuario)


@router.get("", response_model=list[UsuarioRead], dependencies=[somente_admin])
async def listar(db: DbSession) -> list[UsuarioRead]:
    usuarios = await UsuarioService(db).listar()
    return [UsuarioRead.model_validate(u) for u in usuarios]


@router.post(
    "",
    response_model=UsuarioRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[somente_admin],
)
async def criar(dados: UsuarioCreate, db: DbSession) -> UsuarioRead:
    usuario = await UsuarioService(db).criar(dados)
    return UsuarioRead.model_validate(usuario)


@router.get("/{usuario_id}", response_model=UsuarioRead, dependencies=[somente_admin])
async def obter(usuario_id: UUID, db: DbSession) -> UsuarioRead:
    usuario = await UsuarioService(db).obter(usuario_id)
    return UsuarioRead.model_validate(usuario)


@router.patch("/{usuario_id}", response_model=UsuarioRead, dependencies=[somente_admin])
async def atualizar(usuario_id: UUID, dados: UsuarioUpdate, db: DbSession) -> UsuarioRead:
    usuario = await UsuarioService(db).atualizar(usuario_id, dados)
    return UsuarioRead.model_validate(usuario)


@router.post(
    "/{usuario_id}/alternar-status",
    response_model=UsuarioRead,
    dependencies=[somente_admin],
)
async def alternar_status(usuario_id: UUID, db: DbSession) -> UsuarioRead:
    usuario = await UsuarioService(db).alternar_status(usuario_id)
    return UsuarioRead.model_validate(usuario)

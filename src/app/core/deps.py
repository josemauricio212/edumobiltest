"""Dependências compartilhadas: sessão de banco e usuário autenticado."""

from collections.abc import Callable, Coroutine
from typing import Annotated, Any
from uuid import UUID

from fastapi import Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.exceptions import UnauthorizedError
from app.core.security import decode_access_token
from app.models.usuario import CargoUsuario, StatusUsuario, Usuario

DbSession = Annotated[AsyncSession, Depends(get_db)]


class ForbiddenError(UnauthorizedError):
    def __init__(self, message: str = "Você não tem permissão para esta ação"):
        super().__init__(message)
        self.status_code = 403


def _extract_token(request: Request) -> str | None:
    """Aceita o token pelo cookie da sessão (painel) ou pelo header Authorization (API)."""
    cookie_token = request.cookies.get(settings.session_cookie_name)
    if cookie_token:
        return cookie_token

    header = request.headers.get("Authorization")
    if header and header.lower().startswith("bearer "):
        return header[7:].strip()

    return None


async def get_current_user_optional(request: Request, db: DbSession) -> Usuario | None:
    token = _extract_token(request)
    if not token:
        return None

    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        return None

    try:
        user_id = UUID(str(payload["sub"]))
    except ValueError:
        return None

    usuario = await db.get(Usuario, user_id)
    if usuario is None or usuario.status != StatusUsuario.ATIVO:
        return None

    return usuario


async def get_current_user(
    usuario: Annotated[Usuario | None, Depends(get_current_user_optional)],
) -> Usuario:
    if usuario is None:
        raise UnauthorizedError("Sessão expirada ou inexistente. Faça login novamente.")
    return usuario


CurrentUser = Annotated[Usuario, Depends(get_current_user)]
OptionalUser = Annotated[Usuario | None, Depends(get_current_user_optional)]


def require_cargo(
    *cargos: CargoUsuario,
) -> Callable[[Usuario], Coroutine[Any, Any, Usuario]]:
    """Restringe o acesso aos cargos informados. O admin sempre passa."""
    permitidos = {*cargos, CargoUsuario.ADMIN}

    async def _dependency(usuario: CurrentUser) -> Usuario:
        if usuario.cargo not in permitidos:
            raise ForbiddenError()
        return usuario

    return _dependency

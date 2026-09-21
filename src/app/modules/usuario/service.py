from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, NotFoundError, UnauthorizedError
from app.core.security import hash_password, verify_password
from app.models.usuario import CargoUsuario, StatusUsuario, Usuario
from app.repositories.base import BaseRepository

from .schemas import UsuarioCreate, UsuarioUpdate


class UsuarioService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = BaseRepository(Usuario, db)

    async def listar(self) -> list[Usuario]:
        return await self.repo.list_all(order_by=Usuario.nome)

    async def contar(self) -> int:
        return await self.repo.count()

    async def obter(self, usuario_id: UUID) -> Usuario:
        usuario = await self.repo.get_by_id(usuario_id)
        if usuario is None:
            raise NotFoundError("Usuário não encontrado")
        return usuario

    async def obter_por_email(self, email: str) -> Usuario | None:
        return await self.repo.find_one_by(email=email.strip().lower())

    async def criar(self, dados: UsuarioCreate) -> Usuario:
        email = str(dados.email).strip().lower()
        if await self.obter_por_email(email):
            raise ConflictError(f"Já existe um usuário com o e-mail {email}")

        usuario = Usuario(
            nome=dados.nome.strip(),
            email=email,
            senha=hash_password(dados.senha),
            cargo=dados.cargo,
            status=StatusUsuario.ATIVO,
        )
        return await self.repo.create(usuario)

    async def atualizar(self, usuario_id: UUID, dados: UsuarioUpdate) -> Usuario:
        usuario = await self.obter(usuario_id)

        if dados.email is not None:
            email = str(dados.email).strip().lower()
            existente = await self.obter_por_email(email)
            if existente and existente.id != usuario.id:
                raise ConflictError(f"Já existe um usuário com o e-mail {email}")
            usuario.email = email

        if dados.nome is not None:
            usuario.nome = dados.nome.strip()
        if dados.cargo is not None:
            usuario.cargo = dados.cargo
        if dados.senha:
            usuario.senha = hash_password(dados.senha)

        return await self.repo.update(usuario)

    async def alternar_status(self, usuario_id: UUID) -> Usuario:
        usuario = await self.obter(usuario_id)
        usuario.status = (
            StatusUsuario.INATIVO
            if usuario.status == StatusUsuario.ATIVO
            else StatusUsuario.ATIVO
        )
        return await self.repo.update(usuario)

    async def autenticar(self, email: str, senha: str) -> Usuario:
        usuario = await self.obter_por_email(email)
        # Mensagem genérica de propósito: não revela se o e-mail existe.
        if usuario is None or not verify_password(senha, usuario.senha):
            raise UnauthorizedError("E-mail ou senha inválidos")
        if usuario.status != StatusUsuario.ATIVO:
            raise UnauthorizedError("Usuário inativo. Procure um administrador.")
        return usuario

    async def garantir_admin_inicial(self, email: str, senha: str, nome: str) -> Usuario | None:
        """Cria o primeiro admin quando o banco ainda não tem nenhum usuário."""
        if await self.contar() > 0:
            return None

        return await self.criar(
            UsuarioCreate(nome=nome, email=email, senha=senha, cargo=CargoUsuario.ADMIN)
        )

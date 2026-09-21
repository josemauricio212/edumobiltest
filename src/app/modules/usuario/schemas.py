from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.usuario import CargoUsuario, StatusUsuario


class UsuarioBase(BaseModel):
    nome: str = Field(min_length=3, max_length=150)
    email: EmailStr
    cargo: CargoUsuario = CargoUsuario.CADASTRAL


class UsuarioCreate(UsuarioBase):
    senha: str = Field(min_length=6, max_length=72)


class UsuarioUpdate(BaseModel):
    nome: str | None = Field(default=None, min_length=3, max_length=150)
    email: EmailStr | None = None
    cargo: CargoUsuario | None = None
    senha: str | None = Field(default=None, min_length=6, max_length=72)


class UsuarioRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    nome: str
    email: EmailStr
    cargo: CargoUsuario
    status: StatusUsuario
    created_at: datetime


class LoginRequest(BaseModel):
    email: EmailStr
    senha: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    usuario: UsuarioRead

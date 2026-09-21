from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class MotoristaBase(BaseModel):
    nome: str = Field(min_length=3, max_length=150)
    telefone: str = Field(min_length=8, max_length=20)
    cnh: str = Field(min_length=5, max_length=20)


class MotoristaCreate(MotoristaBase):
    pass


class MotoristaUpdate(BaseModel):
    nome: str | None = Field(default=None, min_length=3, max_length=150)
    telefone: str | None = Field(default=None, min_length=8, max_length=20)
    cnh: str | None = Field(default=None, min_length=5, max_length=20)
    ativo: bool | None = None


class MotoristaRead(MotoristaBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    ativo: bool
    created_at: datetime
    updated_at: datetime

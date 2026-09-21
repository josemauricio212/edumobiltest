import enum
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class TurnoAluno(str, enum.Enum):
    MANHA = "manha"
    TARDE = "tarde"
    INTEGRAL = "integral"


class StatusAluno(str, enum.Enum):
    ATIVO = "ativo"
    INATIVO = "inativo"


class AlunoBase(BaseModel):
    matricula: str = Field(min_length=1, max_length=30)
    nome: str = Field(min_length=3, max_length=150)
    serie_ano: str = Field(min_length=1, max_length=50)
    turno: TurnoAluno = TurnoAluno.MANHA
    endereco: str = Field(min_length=3, max_length=200)
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    responsavel_nome: str | None = Field(default=None, max_length=150)
    responsavel_telefone: str | None = Field(default=None, max_length=20)


class AlunoCreate(AlunoBase):
    pass


class AlunoUpdate(BaseModel):
    matricula: str | None = Field(default=None, min_length=1, max_length=30)
    nome: str | None = Field(default=None, min_length=3, max_length=150)
    serie_ano: str | None = Field(default=None, min_length=1, max_length=50)
    turno: TurnoAluno | None = None
    endereco: str | None = Field(default=None, min_length=3, max_length=200)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    responsavel_nome: str | None = Field(default=None, max_length=150)
    responsavel_telefone: str | None = Field(default=None, max_length=20)
    status: StatusAluno | None = None


class AlunoRead(AlunoBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    status: StatusAluno
    created_at: datetime
    updated_at: datetime

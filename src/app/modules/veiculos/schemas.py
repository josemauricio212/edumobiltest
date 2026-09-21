import enum
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


class StatusVeiculo(str, enum.Enum):
    DISPONIVEL = "disponivel"
    EM_ROTA = "em_rota"
    MANUTENCAO = "manutencao"
    INATIVO = "inativo"


class VeiculoBase(BaseModel):
    placa: str = Field(min_length=7, max_length=10)
    tipo: str = Field(min_length=2, max_length=50)
    modelo: str = Field(min_length=2, max_length=100)
    capacidade: float = Field(gt=0, le=100)
    consumo_medio: float = Field(gt=0, le=100, description="km por litro")
    ano: int = Field(ge=1950, le=2100)
    proprietario_id: UUID | None = None

    @field_validator("placa")
    @classmethod
    def normalizar_placa(cls, v: str) -> str:
        return v.strip().upper().replace("-", "")


class VeiculoCreate(VeiculoBase):
    pass


class VeiculoUpdate(BaseModel):
    placa: str | None = Field(default=None, min_length=7, max_length=10)
    tipo: str | None = Field(default=None, min_length=2, max_length=50)
    modelo: str | None = Field(default=None, min_length=2, max_length=100)
    capacidade: float | None = Field(default=None, gt=0, le=100)
    consumo_medio: float | None = Field(default=None, gt=0, le=100)
    ano: int | None = Field(default=None, ge=1950, le=2100)
    status: StatusVeiculo | None = None
    proprietario_id: UUID | None = None

    @field_validator("placa")
    @classmethod
    def normalizar_placa(cls, v: str | None) -> str | None:
        return v.strip().upper().replace("-", "") if v else v


class VeiculoRead(VeiculoBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    status: StatusVeiculo
    created_at: datetime
    updated_at: datetime

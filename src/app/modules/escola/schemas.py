from datetime import datetime, time

from pydantic import BaseModel, ConfigDict, Field


class EscolaUpdate(BaseModel):
    nome: str = Field(min_length=2, max_length=150)
    endereco: str = Field(min_length=3, max_length=200)
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    horario_entrada: time | None = None
    horario_saida: time | None = None
    preco_combustivel: float = Field(gt=0, le=100)
    duracao_maxima_rota_min: int = Field(ge=10, le=600)


class EscolaRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nome: str
    endereco: str
    latitude: float
    longitude: float
    horario_entrada: time | None
    horario_saida: time | None
    preco_combustivel: float
    duracao_maxima_rota_min: int
    updated_at: datetime

import json
from datetime import date, datetime, time
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.rotas import StatusParada, StatusRota, TipoRota, TurnoRota


class RotaCreate(BaseModel):
    nome: str = Field(min_length=3, max_length=150)
    turno: TurnoRota = TurnoRota.MANHA
    tipo: TipoRota = TipoRota.IDA
    data: date
    veiculo_id: UUID
    motorista_id: UUID
    aluno_ids: list[UUID] = Field(min_length=1)


class RotaUpdate(BaseModel):
    nome: str | None = Field(default=None, min_length=3, max_length=150)
    turno: TurnoRota | None = None
    tipo: TipoRota | None = None
    data: date | None = None
    veiculo_id: UUID | None = None
    motorista_id: UUID | None = None
    aluno_ids: list[UUID] | None = None


class ReordenarParadas(BaseModel):
    """Ajuste manual da sequência antes de confirmar a rota (RF07)."""

    parada_ids: list[UUID] = Field(min_length=1)


class MarcarParada(BaseModel):
    status: StatusParada


class AlunoResumo(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    nome: str
    matricula: str
    endereco: str
    latitude: float
    longitude: float
    responsavel_nome: str | None = None
    responsavel_telefone: str | None = None


class ParadaRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    ordem: int
    status: StatusParada
    horario_previsto: time | None
    registrado_em: datetime | None
    aluno: AlunoResumo


class MotoristaResumo(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    nome: str
    telefone: str


class VeiculoResumo(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    placa: str
    modelo: str
    capacidade: float
    consumo_medio: float


class RotaRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    nome: str
    turno: TurnoRota
    tipo: TipoRota
    data: date
    status: StatusRota
    veiculo_id: UUID | None
    motorista_id: UUID | None
    distancia_total_km: float | None
    tempo_estimado_min: int | None
    litros_estimados: float | None
    preco_combustivel: float | None
    custo_combustivel: float | None
    otimizada_em: datetime | None
    iniciada_em: datetime | None
    concluida_em: datetime | None
    created_at: datetime
    motorista: MotoristaResumo | None = None
    veiculo: VeiculoResumo | None = None
    total_alunos: int = 0
    total_embarcados: int = 0
    total_ausentes: int = 0
    # Pares [latitude, longitude] do trajeto calculado (vazio até otimizar).
    geometria: list[list[float]] = []
    paradas: list[ParadaRead] = []

    @field_validator("geometria", mode="before")
    @classmethod
    def _geometria_de_texto(cls, valor: object) -> object:
        """No banco a geometria é guardada como JSON em texto."""
        if not valor:
            return []
        if isinstance(valor, str):
            try:
                return json.loads(valor)
            except ValueError:
                return []
        return valor


class RelatorioRotas(BaseModel):
    total_rotas: int
    concluidas: int
    em_andamento: int
    planejadas: int
    canceladas: int
    distancia_total_km: float
    custo_total: float
    alunos_embarcados: int
    alunos_ausentes: int

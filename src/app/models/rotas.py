from __future__ import annotations

import enum
from datetime import UTC, date, datetime, time
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from sqlalchemy import JSON, Date, Enum, Float, ForeignKey, Integer, String, Text, Time
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.aluno import Aluno
    from app.models.motorista import Motorista
    from app.models.veiculo import Veiculo


class TurnoRota(str, enum.Enum):
    MANHA = "manha"
    TARDE = "tarde"
    INTEGRAL = "integral"


class TipoRota(str, enum.Enum):
    IDA = "ida"
    VOLTA = "volta"


class StatusRota(str, enum.Enum):
    PLANEJADA = "planejada"
    EM_ANDAMENTO = "em_andamento"
    CONCLUIDA = "concluida"
    CANCELADA = "cancelada"


class StatusParada(str, enum.Enum):
    PENDENTE = "pendente"
    EMBARCADO = "embarcado"
    NAO_COMPARECEU = "nao_compareceu"


class Rota(Base):
    __tablename__ = "rotas"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )

    nome: Mapped[str] = mapped_column(
        String(150),
    )

    motorista_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("motoristas.id", ondelete="SET NULL"),
        nullable=True,
    )

    veiculo_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("veiculos.id", ondelete="SET NULL"),
        nullable=True,
    )

    turno: Mapped[TurnoRota] = mapped_column(
        Enum(TurnoRota, name="turno_rota_enum", native_enum=True),
        default=TurnoRota.MANHA,
    )

    tipo: Mapped[TipoRota] = mapped_column(
        Enum(TipoRota, name="tipo_rota_enum", native_enum=True),
        default=TipoRota.IDA,
    )

    data: Mapped[date] = mapped_column(
        Date,
        default=lambda: datetime.now(UTC).date(),
        index=True,
    )

    status: Mapped[StatusRota] = mapped_column(
        Enum(StatusRota, name="status_rota_enum", native_enum=True),
        default=StatusRota.PLANEJADA,
        index=True,
    )

    # Resultado da otimização — preenchido quando a rota é calculada via OSRM.
    distancia_total_km: Mapped[float | None] = mapped_column(Float, nullable=True)
    tempo_estimado_min: Mapped[int | None] = mapped_column(Integer, nullable=True)
    litros_estimados: Mapped[float | None] = mapped_column(Float, nullable=True)
    preco_combustivel: Mapped[float | None] = mapped_column(Float, nullable=True)
    custo_combustivel: Mapped[float | None] = mapped_column(Float, nullable=True)

    # GeoJSON (LineString) devolvido pelo OSRM, guardado como texto para o mapa.
    geometria: Mapped[str | None] = mapped_column(Text, nullable=True)

    otimizada_em: Mapped[datetime | None] = mapped_column(nullable=True)
    iniciada_em: Mapped[datetime | None] = mapped_column(nullable=True)
    concluida_em: Mapped[datetime | None] = mapped_column(nullable=True)

    motorista: Mapped[Motorista | None] = relationship(lazy="selectin")
    veiculo: Mapped[Veiculo | None] = relationship(lazy="selectin")

    paradas: Mapped[list[RotaParada]] = relationship(
        back_populates="rota",
        cascade="all, delete-orphan",
        order_by="RotaParada.ordem",
        lazy="selectin",
    )

    pontos_parada: Mapped[list[RotaPontoParada]] = relationship(
        back_populates="rota",
        cascade="all, delete-orphan",
        order_by="RotaPontoParada.ordem",
        lazy="selectin",
    )

    created_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(UTC),
    )

    updated_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
    )

    @property
    def total_alunos(self) -> int:
        return len(self.paradas)

    @property
    def total_embarcados(self) -> int:
        return sum(1 for p in self.paradas if p.status == StatusParada.EMBARCADO)

    @property
    def total_ausentes(self) -> int:
        return sum(1 for p in self.paradas if p.status == StatusParada.NAO_COMPARECEU)


class RotaParada(Base):
    """Parada da rota — um aluno embarcado numa posição da sequência."""

    __tablename__ = "rota_paradas"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )

    rota_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("rotas.id", ondelete="CASCADE"),
        index=True,
    )

    aluno_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("alunos.id", ondelete="CASCADE"),
    )

    ordem: Mapped[int] = mapped_column(
        Integer,
        default=0,
    )

    status: Mapped[StatusParada] = mapped_column(
        Enum(StatusParada, name="status_parada_enum", native_enum=True),
        default=StatusParada.PENDENTE,
    )

    horario_previsto: Mapped[time | None] = mapped_column(Time, nullable=True)
    registrado_em: Mapped[datetime | None] = mapped_column(nullable=True)

    rota: Mapped[Rota] = relationship(back_populates="paradas")
    aluno: Mapped[Aluno] = relationship(lazy="selectin")

    created_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(UTC),
    )


class RotaPontoParada(Base):
    """Ponto de embarque compartilhado por um ou mais alunos da rota.

    A associação é armazenada como lista de UUIDs em JSON para preservar a
    tabela rota_paradas e evitar migração destrutiva nos embarques existentes.
    """

    __tablename__ = "rota_pontos_parada"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )
    rota_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("rotas.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    ordem: Mapped[int] = mapped_column(Integer, nullable=False)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    aluno_ids: Mapped[list[str]] = mapped_column(JSON, nullable=False)

    rota: Mapped[Rota] = relationship(back_populates="pontos_parada")

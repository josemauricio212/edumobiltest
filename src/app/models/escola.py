from datetime import UTC, datetime, time

from sqlalchemy import CheckConstraint, Float, Integer, String, Time
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Escola(Base):
    """Localização única da escola (singleton, travado em 1 linha via CHECK id = 1)."""

    __tablename__ = "escola"
    __table_args__ = (CheckConstraint("id = 1", name="ck_escola_singleton"),)

    SINGLETON_ID = 1

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        default=SINGLETON_ID,
    )

    nome: Mapped[str] = mapped_column(
        String(150),
        default="Escola",
    )

    endereco: Mapped[str] = mapped_column(
        String(200),
        default="",
    )

    latitude: Mapped[float] = mapped_column(Float, default=0.0)
    longitude: Mapped[float] = mapped_column(Float, default=0.0)

    horario_entrada: Mapped[time | None] = mapped_column(Time, nullable=True)
    horario_saida: Mapped[time | None] = mapped_column(Time, nullable=True)

    # Parâmetros de otimização configuráveis pelo gestor (RF13).
    preco_combustivel: Mapped[float] = mapped_column(Float, default=6.0)
    duracao_maxima_rota_min: Mapped[int] = mapped_column(Integer, default=90)

    updated_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
    )

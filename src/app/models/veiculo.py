from typing import TYPE_CHECKING

from datetime import UTC, datetime
from uuid import UUID, uuid4

from sqlalchemy import String, Float, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.motorista import Motorista

class Veiculo(Base):
    __tablename__ = "veiculos"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )

    placa: Mapped[str] = mapped_column(
        String(10),
        unique=True,
        index=True,
    )

    tipo: Mapped[str] = mapped_column(
        String(50),
    )

    modelo: Mapped[str] = mapped_column(
        String(100),
    )

    capacidade: Mapped[float] = mapped_column(
        Float,
    )

    consumo_medio: Mapped[float] = mapped_column(
        Float,
    )

    ano: Mapped[int] = mapped_column(
        default=datetime.now().year,
    )

    status: Mapped[str] = mapped_column(
        String(20),
        default="disponivel",
    )

    proprietario_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("motoristas.id", ondelete="SET NULL"),
        nullable=True,
    )

    proprietario: Mapped["Motorista"] = relationship(
        back_populates="veiculos",
    )

    created_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(UTC),
    )

    updated_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
    )
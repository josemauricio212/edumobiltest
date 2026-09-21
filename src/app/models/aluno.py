from datetime import UTC, datetime
from uuid import UUID, uuid4

from sqlalchemy import String, Float
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Aluno(Base):
    __tablename__ = "alunos"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )

    matricula: Mapped[str] = mapped_column(
        String(30),
        unique=True,
        index=True,
    )

    nome: Mapped[str] = mapped_column(
        String(150),
    )

    serie_ano: Mapped[str] = mapped_column(
        String(50),
    )

    # Define de qual rota o aluno participa (RF06 — otimização por turno).
    turno: Mapped[str] = mapped_column(
        String(20),
        default="manha",
        index=True,
    )

    responsavel_nome: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
    )

    responsavel_telefone: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True,
    )

    endereco: Mapped[str] = mapped_column(
        String(200),
    )

    latitude: Mapped[float] = mapped_column(
        Float,
    )

    longitude: Mapped[float] = mapped_column(
        Float,
    )

    status: Mapped[str] = mapped_column(
        String(20),
        default="ativo",
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(UTC),
    )

    updated_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
    )
from typing import TYPE_CHECKING

from datetime import UTC, datetime
from uuid import UUID, uuid4

from sqlalchemy import String
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.veiculo import Veiculo

class Motorista(Base):
    __tablename__ = "motoristas"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )

    nome: Mapped[str] = mapped_column(
        String(150),
    )

    telefone: Mapped[str] = mapped_column(
        String(20),
    )

    cnh: Mapped[str] = mapped_column(
        String(20),
        unique=True,
        index=True,
    )

    ativo: Mapped[bool] = mapped_column(
        default=True,
        index=True,
    )

    veiculos: Mapped[list["Veiculo"]] = relationship(
        back_populates="proprietario",
    )

    created_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(UTC),
    )

    updated_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
    )
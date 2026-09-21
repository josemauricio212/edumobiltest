from datetime import UTC, datetime
import enum
from uuid import UUID, uuid4

from sqlalchemy import Enum, String, Float
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base

class CargoUsuario(str, enum.Enum):
    ADMIN = "admin"
    CHEFETRANSPORTE = "chefetransporte"
    CADASTRAL = "cadastral"


class StatusUsuario(str, enum.Enum):
    ATIVO = "ativo"
    INATIVO = "inativo"


class Usuario(Base):
    __tablename__ = "usuarios"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )

    nome: Mapped[str] = mapped_column(
        String(150),
    )

    email: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        index=True,
    )

    senha: Mapped[str] = mapped_column(
        String(255),
    )

    cargo: Mapped[CargoUsuario] = mapped_column(
        Enum(CargoUsuario, name="cargo_usuario_enum", native_enum=True),
    )

    status: Mapped[StatusUsuario] = mapped_column(
        Enum(StatusUsuario, name="status_usuario_enum", native_enum=True),
        default=StatusUsuario.ATIVO,
    )

    created_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(UTC),
    )

    updated_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
    )
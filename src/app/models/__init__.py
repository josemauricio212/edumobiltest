from app.core.database import Base

from app.models.usuario import Usuario, CargoUsuario, StatusUsuario
from app.models.aluno import Aluno
from app.models.escola import Escola
from app.models.motorista import Motorista
from app.models.rotas import (
    Rota,
    RotaParada,
    RotaPontoParada,
    StatusParada,
    StatusRota,
    TipoRota,
    TurnoRota,
)
from app.models.veiculo import Veiculo

__all__ = [
    "Base",
    "Usuario",
    "CargoUsuario",
    "StatusUsuario",
    "Aluno",
    "Escola",
    "Motorista",
    "Rota",
    "RotaParada",
    "RotaPontoParada",
    "StatusParada",
    "StatusRota",
    "TipoRota",
    "TurnoRota",
    "Veiculo",
]

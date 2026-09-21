"""Cliente do OSRM para otimização da sequência de paradas (TSP).

Usa o serviço `/trip`, que resolve o Problema do Caixeiro Viajante fixando a escola
como primeiro ponto. A geometria volta em GeoJSON para ser desenhada direto no Leaflet,
sem precisar decodificar polyline.
"""

from __future__ import annotations

from dataclasses import dataclass, field

import httpx

from app.core.config import settings
from app.core.exceptions import AppError
from app.core.logging import get_logger

logger = get_logger(__name__)

# O serviço /trip do OSRM público degrada com muitos pontos; acima disso recusamos.
MAX_PONTOS = 60


class RoteirizacaoError(AppError):
    def __init__(self, message: str = "Não foi possível calcular a rota"):
        super().__init__(message, status_code=502)


@dataclass(frozen=True)
class Ponto:
    referencia: str
    latitude: float
    longitude: float


@dataclass
class PontoOrdenado:
    referencia: str
    ordem: int
    latitude: float
    longitude: float


@dataclass
class ResultadoRota:
    distancia_km: float
    duracao_min: float
    pontos: list[PontoOrdenado]
    # Lista de pares [latitude, longitude] no formato que o Leaflet consome.
    geometria: list[list[float]] = field(default_factory=list)


def _validar(pontos: list[Ponto]) -> None:
    if len(pontos) < 2:
        raise RoteirizacaoError("São necessários pelo menos 2 pontos para calcular uma rota")
    if len(pontos) > MAX_PONTOS:
        raise RoteirizacaoError(
            f"A rota tem {len(pontos)} pontos e o limite é {MAX_PONTOS}. "
            "Divida os alunos em mais de uma rota."
        )
    for ponto in pontos:
        if not (-90 <= ponto.latitude <= 90) or not (-180 <= ponto.longitude <= 180):
            raise RoteirizacaoError(
                f"Coordenada inválida em '{ponto.referencia}': "
                f"{ponto.latitude}, {ponto.longitude}"
            )


async def otimizar(pontos: list[Ponto], *, roundtrip: bool = False) -> ResultadoRota:
    """Ordena os pontos pelo menor trajeto, mantendo o primeiro como partida.

    `roundtrip=True` faz o trajeto retornar ao ponto inicial (útil na rota de volta).
    """
    _validar(pontos)

    coordenadas = ";".join(f"{p.longitude},{p.latitude}" for p in pontos)
    url = f"{settings.osrm_base_url.rstrip('/')}/trip/v1/driving/{coordenadas}"
    params = {
        "source": "first",
        "roundtrip": "true" if roundtrip else "false",
        "overview": "full",
        "geometries": "geojson",
        "steps": "false",
    }
    if not roundtrip:
        # Sem roundtrip o OSRM exige que o destino seja explícito.
        params["destination"] = "last"

    try:
        async with httpx.AsyncClient(timeout=settings.osrm_timeout_seconds) as client:
            resposta = await client.get(url, params=params)
            resposta.raise_for_status()
            dados = resposta.json()
    except httpx.HTTPError as exc:
        logger.warning("osrm_indisponivel", erro=str(exc), url=url)
        raise RoteirizacaoError(
            "Serviço de roteirização indisponível no momento. Tente novamente."
        ) from exc

    if dados.get("code") != "Ok":
        mensagem = dados.get("message", "resposta inesperada do OSRM")
        logger.warning("osrm_recusou", code=dados.get("code"), message=mensagem)
        raise RoteirizacaoError(f"O serviço de roteirização recusou o cálculo: {mensagem}")

    trip = dados["trips"][0]

    ordenados = [
        PontoOrdenado(
            referencia=pontos[indice].referencia,
            ordem=waypoint["waypoint_index"] + 1,
            latitude=waypoint["location"][1],
            longitude=waypoint["location"][0],
        )
        for indice, waypoint in enumerate(dados["waypoints"])
    ]
    ordenados.sort(key=lambda p: p.ordem)

    geometria = [[coord[1], coord[0]] for coord in trip.get("geometry", {}).get("coordinates", [])]

    return ResultadoRota(
        distancia_km=trip["distance"] / 1000,
        duracao_min=trip["duration"] / 60,
        pontos=ordenados,
        geometria=geometria,
    )


def calcular_custo(
    distancia_km: float,
    consumo_medio_km_l: float | None,
    preco_combustivel: float,
) -> tuple[float | None, float | None]:
    """Devolve (litros estimados, custo em R$) — None quando falta o consumo do veículo."""
    if not consumo_medio_km_l or consumo_medio_km_l <= 0:
        return None, None
    litros = distancia_km / consumo_medio_km_l
    return round(litros, 2), round(litros * preco_combustivel, 2)

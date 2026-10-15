"""Agrupamento geográfico de alunos em pontos de embarque sugeridos.

Sem dependências de ML: para dezenas/centenas de alunos, a busca quadrática
é suficiente e não torna a inicialização do backend dependente de scikit-learn.
As distâncias são em linha reta; a escolha final da parada exige avaliação humana.
"""

from dataclasses import dataclass
from math import asin, cos, isfinite, radians, sin, sqrt
from uuid import UUID


@dataclass(frozen=True)
class AlunoPonto:
    id: UUID
    latitude: float
    longitude: float


@dataclass(frozen=True)
class GrupoParada:
    aluno_ids: list[UUID]
    latitude: float
    longitude: float


def distancia_metros(a: AlunoPonto, b: AlunoPonto) -> float:
    """Distância haversine entre coordenadas WGS84, em metros."""
    lat1, lon1 = radians(a.latitude), radians(a.longitude)
    lat2, lon2 = radians(b.latitude), radians(b.longitude)
    dlat, dlon = lat2 - lat1, lon2 - lon1
    h = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    return 2 * 6371000 * asin(min(1.0, sqrt(h)))


def agrupar_alunos(
    alunos: list[AlunoPonto], *, raio_metros: float = 250.0
) -> list[GrupoParada]:
    """Agrupa alunos e garante distância radial máxima até a parada sugerida.

    O ponto escolhido é sempre a localização de um dos alunos do grupo (não
    um centroide que poderia cair no meio de um quarteirão sem acesso).
    O algoritmo é determinístico para a mesma ordem de entrada; os grupos
    não se sobrepõem e cada aluno aparece uma única vez.
    """
    if not isfinite(raio_metros) or raio_metros <= 0:
        raise ValueError("O raio do agrupamento precisa ser positivo e finito")

    grupos: list[list[AlunoPonto]] = []
    vistos: set[UUID] = set()

    for aluno in alunos:
        if aluno.id in vistos:
            raise ValueError("Há alunos repetidos na rota")
        vistos.add(aluno.id)

        if (
            not isfinite(aluno.latitude)
            or not isfinite(aluno.longitude)
            or not -90 <= aluno.latitude <= 90
            or not -180 <= aluno.longitude <= 180
        ):
            raise ValueError(f"Coordenadas inválidas para o aluno {aluno.id}")

        indice: int | None = None
        menor = float("inf")
        for i, membros in enumerate(grupos):
            # Manter a distância máxima à âncora impede o efeito de corrente.
            distancia = distancia_metros(aluno, membros[0])
            if distancia <= raio_metros and distancia < menor:
                indice, menor = i, distancia

        if indice is None:
            grupos.append([aluno])
        else:
            grupos[indice].append(aluno)

    resultado: list[GrupoParada] = []
    for membros in grupos:
        # Escolhe um endereço real e garante que TODOS possam alcançá-lo
        # dentro do raio. A âncora inicial é sempre uma candidata válida.
        candidatos = [
            (
                sum(distancia_metros(candidato, outro) for outro in membros),
                str(candidato.id),
                candidato,
            )
            for candidato in membros
            if all(distancia_metros(candidato, outro) <= raio_metros for outro in membros)
        ]
        escolhido = min(candidatos, key=lambda x: (x[0], x[1]))[2]
        resultado.append(
            GrupoParada(
                aluno_ids=[aluno.id for aluno in membros],
                latitude=escolhido.latitude,
                longitude=escolhido.longitude,
            )
        )

    return resultado

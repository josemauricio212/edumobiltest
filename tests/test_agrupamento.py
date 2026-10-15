"""Testes do algoritmo de sugestão de pontos de embarque."""
from uuid import UUID

import pytest

from app.ml.agrupamento import AlunoPonto, agrupar_alunos, distancia_metros


def aluno(numero: int, latitude: float, longitude: float) -> AlunoPonto:
    return AlunoPonto(UUID(int=numero), latitude, longitude)


def test_grupo_compartilhado_e_aluno_distante() -> None:
    pontos = [aluno(1, -5.0800, -42.8000), aluno(2, -5.0805, -42.8001),
              aluno(3, -5.0900, -42.8000)]
    grupos = agrupar_alunos(pontos, raio_metros=250)

    assert len(grupos) == 2
    assert grupos[0].aluno_ids == [pontos[0].id, pontos[1].id]
    assert grupos[1].aluno_ids == [pontos[2].id]
    assert sum(len(g.aluno_ids) for g in grupos) == len(pontos)


def test_nao_encadeia_alunos_fora_do_raio() -> None:
    # A--B e B--C ficam a ~200m, mas A--C fica a ~400m.
    pontos = [aluno(1, 0, 0), aluno(2, 0.0018, 0), aluno(3, 0.0036, 0)]
    grupos = agrupar_alunos(pontos, raio_metros=250)

    assert len(grupos) == 2
    assert sorted(len(g.aluno_ids) for g in grupos) == [1, 2]


def test_ponto_sugerido_e_endereco_real_e_respeita_raio() -> None:
    pontos = [
        aluno(1, -5.08000, -42.80000),
        aluno(2, -5.08032, -42.80030),
        aluno(3, -5.08010, -42.80015),
    ]
    grupo = agrupar_alunos(pontos, raio_metros=250)[0]
    coordenadas_origem = {(p.latitude, p.longitude) for p in pontos}

    assert (grupo.latitude, grupo.longitude) in coordenadas_origem
    parada = aluno(42, grupo.latitude, grupo.longitude)
    assert all(distancia_metros(p, parada) <= 250 for p in pontos)


def test_entrada_vazia_e_aluno_isolado() -> None:
    assert agrupar_alunos([]) == []
    isolado = aluno(1, -5.0, -42.0)
    grupo = agrupar_alunos([isolado])[0]
    assert grupo.aluno_ids == [isolado.id]


@pytest.mark.parametrize("raio", [0, -10, float("nan"), float("inf")])
def test_raio_invalido(raio: float) -> None:
    with pytest.raises(ValueError):
        agrupar_alunos([aluno(1, 0, 0)], raio_metros=raio)


def test_coordenada_invalida_e_duplicacao() -> None:
    with pytest.raises(ValueError, match="Coordenadas inválidas"):
        agrupar_alunos([aluno(1, 100, 0)])
    with pytest.raises(ValueError, match="repetidos"):
        agrupar_alunos([aluno(1, 0, 0), aluno(1, 0, 0)])

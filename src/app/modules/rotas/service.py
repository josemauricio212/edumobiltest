import json
from datetime import UTC, date, datetime
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppError, NotFoundError
from app.core.logging import get_logger
from app.ml.agrupamento import AlunoPonto, agrupar_alunos
from app.ml.roteirizacao import Ponto, calcular_custo, otimizar
from app.models.aluno import Aluno
from app.models.motorista import Motorista
from app.models.rotas import Rota, RotaParada, RotaPontoParada, StatusParada, StatusRota
from app.models.veiculo import Veiculo
from app.modules.escola.service import EscolaService
from app.modules.veiculos.schemas import StatusVeiculo

from .schemas import RelatorioRotas, RotaCreate, RotaUpdate

logger = get_logger(__name__)

# Estados a partir dos quais a composição da rota ainda pode mudar.
EDITAVEIS = {StatusRota.PLANEJADA}


class RotaService:
    def __init__(self, db: AsyncSession):
        self.db = db

    # ------------------------------------------------------------------ leitura

    async def listar(
        self,
        *,
        status: str | None = None,
        turno: str | None = None,
        data_inicio: date | None = None,
        data_fim: date | None = None,
    ) -> list[Rota]:
        stmt = select(Rota)

        if status:
            stmt = stmt.where(Rota.status == status)
        if turno:
            stmt = stmt.where(Rota.turno == turno)
        if data_inicio:
            stmt = stmt.where(Rota.data >= data_inicio)
        if data_fim:
            stmt = stmt.where(Rota.data <= data_fim)

        result = await self.db.execute(stmt.order_by(Rota.data.desc(), Rota.created_at.desc()))
        return list(result.scalars().all())

    async def obter(self, rota_id: UUID) -> Rota:
        rota = await self.db.get(Rota, rota_id)
        if rota is None:
            raise NotFoundError("Rota não encontrada")
        return rota

    async def _recarregar(self, rota_id: UUID) -> Rota:
        """Relê a rota do banco com todas as relações (paradas → aluno, motorista, veículo).

        `refresh` sozinho deixa as relações aninhadas sem carregar, e a serialização
        (Pydantic) tenta buscá-las fora do contexto assíncrono e falha.
        """
        resultado = await self.db.execute(
            select(Rota).where(Rota.id == rota_id).execution_options(populate_existing=True)
        )
        return resultado.scalar_one()

    async def contar(self, *, status: str | None = None) -> int:
        stmt = select(func.count()).select_from(Rota)
        if status:
            stmt = stmt.where(Rota.status == status)
        result = await self.db.execute(stmt)
        return int(result.scalar_one())

    async def rotas_do_dia(self, dia: date | None = None) -> list[Rota]:
        return await self.listar(data_inicio=dia or datetime.now(UTC).date(), data_fim=dia)

    # ------------------------------------------------------------------ escrita

    async def _carregar_alunos(self, aluno_ids: list[UUID]) -> list[Aluno]:
        if not aluno_ids:
            raise AppError("Selecione ao menos um aluno para a rota")

        result = await self.db.execute(select(Aluno).where(Aluno.id.in_(aluno_ids)))
        encontrados = {a.id: a for a in result.scalars().all()}

        faltando = [str(i) for i in aluno_ids if i not in encontrados]
        if faltando:
            raise NotFoundError(f"Aluno(s) não encontrado(s): {', '.join(faltando)}")

        inativos = [a.nome for a in encontrados.values() if a.status != "ativo"]
        if inativos:
            raise AppError(f"Alunos inativos não podem entrar na rota: {', '.join(inativos)}")

        # Preserva a ordem em que o gestor selecionou.
        return [encontrados[i] for i in aluno_ids]

    async def _validar_veiculo(self, veiculo_id: UUID, total_alunos: int) -> Veiculo:
        veiculo = await self.db.get(Veiculo, veiculo_id)
        if veiculo is None:
            raise NotFoundError("Veículo não encontrado")
        if veiculo.status in {StatusVeiculo.MANUTENCAO.value, StatusVeiculo.INATIVO.value}:
            raise AppError(
                f"O veículo {veiculo.placa} está em "
                f"{veiculo.status.replace('_', ' ')} e não pode ser usado"
            )
        if total_alunos > veiculo.capacidade:
            raise AppError(
                f"O veículo {veiculo.placa} comporta {int(veiculo.capacidade)} alunos, "
                f"mas foram selecionados {total_alunos}"
            )
        return veiculo

    async def _validar_motorista(self, motorista_id: UUID) -> Motorista:
        motorista = await self.db.get(Motorista, motorista_id)
        if motorista is None:
            raise NotFoundError("Motorista não encontrado")
        if not motorista.ativo:
            raise AppError(f"O motorista {motorista.nome} está inativo")
        return motorista

    @staticmethod
    def _montar_pontos(alunos: list[Aluno]) -> list[RotaPontoParada]:
        """Sugere paradas compartilhadas sem alterar registros individuais."""
        try:
            grupos = agrupar_alunos(
                [AlunoPonto(id=a.id, latitude=a.latitude, longitude=a.longitude) for a in alunos]
            )
        except ValueError as exc:
            raise AppError(str(exc)) from exc

        return [
            RotaPontoParada(
                ordem=indice,
                latitude=grupo.latitude,
                longitude=grupo.longitude,
                aluno_ids=[str(aluno_id) for aluno_id in grupo.aluno_ids],
            )
            for indice, grupo in enumerate(grupos, start=1)
        ]

    async def criar(self, dados: RotaCreate) -> Rota:
        alunos = await self._carregar_alunos(dados.aluno_ids)
        await self._validar_veiculo(dados.veiculo_id, len(alunos))
        await self._validar_motorista(dados.motorista_id)

        rota = Rota(
            nome=dados.nome.strip(),
            turno=dados.turno,
            tipo=dados.tipo,
            data=dados.data,
            veiculo_id=dados.veiculo_id,
            motorista_id=dados.motorista_id,
            status=StatusRota.PLANEJADA,
        )
        rota.paradas = [
            RotaParada(aluno_id=aluno.id, ordem=indice + 1)
            for indice, aluno in enumerate(alunos)
        ]
        rota.pontos_parada = self._montar_pontos(alunos)

        self.db.add(rota)
        await self.db.commit()
        return await self._recarregar(rota.id)

    async def atualizar(self, rota_id: UUID, dados: RotaUpdate) -> Rota:
        rota = await self.obter(rota_id)
        if rota.status not in EDITAVEIS:
            raise AppError("Só é possível editar rotas com status planejada")

        if dados.nome is not None:
            rota.nome = dados.nome.strip()
        if dados.turno is not None:
            rota.turno = dados.turno
        if dados.tipo is not None:
            rota.tipo = dados.tipo
        if dados.data is not None:
            rota.data = dados.data
        if dados.motorista_id is not None:
            await self._validar_motorista(dados.motorista_id)
            rota.motorista_id = dados.motorista_id

        if dados.aluno_ids is not None:
            alunos = await self._carregar_alunos(dados.aluno_ids)
            veiculo_id = dados.veiculo_id or rota.veiculo_id
            if veiculo_id:
                await self._validar_veiculo(veiculo_id, len(alunos))
            rota.paradas = [
                RotaParada(aluno_id=aluno.id, ordem=indice + 1)
                for indice, aluno in enumerate(alunos)
            ]
            rota.pontos_parada = self._montar_pontos(alunos)
            self._limpar_otimizacao(rota)
        elif dados.veiculo_id is not None:
            await self._validar_veiculo(dados.veiculo_id, len(rota.paradas))

        if dados.veiculo_id is not None:
            rota.veiculo_id = dados.veiculo_id

        self.db.add(rota)
        await self.db.commit()
        return await self._recarregar(rota.id)

    @staticmethod
    def _limpar_otimizacao(rota: Rota) -> None:
        """A composição mudou — os números calculados não valem mais."""
        rota.distancia_total_km = None
        rota.tempo_estimado_min = None
        rota.litros_estimados = None
        rota.custo_combustivel = None
        rota.preco_combustivel = None
        rota.geometria = None
        rota.otimizada_em = None

    # -------------------------------------------------------------- otimização

    async def reagrupar(self, rota_id: UUID) -> Rota:
        """Regenera as paradas sugeridas de uma rota planejada, sem chamar o OSRM."""
        rota = await self.obter(rota_id)
        if rota.status not in EDITAVEIS:
            raise AppError("Só é possível reagrupar rotas planejadas")
        if not rota.paradas:
            raise AppError("A rota não tem alunos para agrupar")
        ordenadas = sorted(rota.paradas, key=lambda p: p.ordem)
        rota.pontos_parada = self._montar_pontos([p.aluno for p in ordenadas])
        self._limpar_otimizacao(rota)
        self.db.add(rota)
        await self.db.commit()
        return await self._recarregar(rota.id)

    async def otimizar(self, rota_id: UUID) -> Rota:
        rota = await self.obter(rota_id)
        if rota.status not in {StatusRota.PLANEJADA, StatusRota.EM_ANDAMENTO}:
            raise AppError("Só é possível calcular rotas planejadas ou em andamento")
        if not rota.paradas:
            raise AppError("A rota não tem alunos para calcular")

        # Reconstrói agrupamentos para rotas legadas que ainda não os possuem.
        if not rota.pontos_parada:
            paradas_ordenadas = sorted(rota.paradas, key=lambda p: p.ordem)
            rota.pontos_parada = self._montar_pontos([p.aluno for p in paradas_ordenadas])

        escola = await EscolaService(self.db).obter_configurada()
        grupos = list(rota.pontos_parada)

        # O OSRM visita um ponto por grupo, e não um ponto por aluno.
        pontos = [Ponto(referencia="escola", latitude=escola.latitude, longitude=escola.longitude)]
        pontos.extend(
            Ponto(
                referencia=f"grupo:{indice}",
                latitude=grupo.latitude,
                longitude=grupo.longitude,
            )
            for indice, grupo in enumerate(grupos)
        )
        resultado = await otimizar(pontos, roundtrip=True)

        sequencia = [p.referencia for p in resultado.pontos if p.referencia != "escola"]
        posicoes = {referencia: indice + 1 for indice, referencia in enumerate(sequencia)}
        paradas_por_aluno = {str(p.aluno_id): p for p in rota.paradas}
        proxima_ordem_aluno = 1
        for indice, grupo in sorted(
            enumerate(grupos), key=lambda item: posicoes[f"grupo:{item[0]}"]
        ):
            grupo.ordem = posicoes[f"grupo:{indice}"]
            for aluno_id in grupo.aluno_ids:
                parada = paradas_por_aluno[aluno_id]
                parada.ordem = proxima_ordem_aluno
                proxima_ordem_aluno += 1

        veiculo = await self.db.get(Veiculo, rota.veiculo_id) if rota.veiculo_id else None
        litros, custo = calcular_custo(
            resultado.distancia_km,
            veiculo.consumo_medio if veiculo else None,
            escola.preco_combustivel,
        )

        rota.distancia_total_km = round(resultado.distancia_km, 2)
        rota.tempo_estimado_min = int(round(resultado.duracao_min))
        rota.litros_estimados = litros
        rota.preco_combustivel = escola.preco_combustivel
        rota.custo_combustivel = custo
        rota.geometria = json.dumps(resultado.geometria)
        rota.otimizada_em = datetime.now(UTC)

        self.db.add(rota)
        await self.db.commit()
        rota = await self._recarregar(rota.id)

        logger.info(
            "rota_otimizada",
            rota_id=str(rota.id),
            distancia_km=rota.distancia_total_km,
            paradas=len(rota.paradas),
        )
        return rota

    async def reordenar(self, rota_id: UUID, parada_ids: list[UUID]) -> Rota:
        rota = await self.obter(rota_id)
        if rota.status not in EDITAVEIS:
            raise AppError("Só é possível reordenar rotas com status planejada")

        atuais = {parada.id for parada in rota.paradas}
        if len(parada_ids) != len(atuais) or atuais != set(parada_ids):
            raise AppError("A nova ordem precisa conter exatamente as paradas da rota")

        posicoes = {parada_id: indice + 1 for indice, parada_id in enumerate(parada_ids)}
        for parada in rota.paradas:
            parada.ordem = posicoes[parada.id]

        # A ordem manual redefine a sequência dos grupos e invalida as métricas.
        ordenadas = sorted(rota.paradas, key=lambda p: p.ordem)
        rota.pontos_parada = self._montar_pontos([p.aluno for p in ordenadas])
        self._limpar_otimizacao(rota)

        self.db.add(rota)
        await self.db.commit()
        return await self._recarregar(rota.id)

    # ---------------------------------------------------------------- execução

    async def iniciar(self, rota_id: UUID) -> Rota:
        rota = await self.obter(rota_id)
        if rota.status != StatusRota.PLANEJADA:
            raise AppError(f"Só é possível iniciar uma rota planejada (atual: {rota.status.value})")

        rota.status = StatusRota.EM_ANDAMENTO
        rota.iniciada_em = datetime.now(UTC)

        if rota.veiculo_id:
            veiculo = await self.db.get(Veiculo, rota.veiculo_id)
            if veiculo:
                veiculo.status = StatusVeiculo.EM_ROTA.value
                self.db.add(veiculo)

        self.db.add(rota)
        await self.db.commit()
        return await self._recarregar(rota.id)

    async def concluir(self, rota_id: UUID) -> Rota:
        rota = await self.obter(rota_id)
        if rota.status != StatusRota.EM_ANDAMENTO:
            raise AppError("Só é possível concluir uma rota em andamento")

        rota.status = StatusRota.CONCLUIDA
        rota.concluida_em = datetime.now(UTC)

        await self._liberar_veiculo(rota)

        self.db.add(rota)
        await self.db.commit()
        return await self._recarregar(rota.id)

    async def cancelar(self, rota_id: UUID) -> Rota:
        rota = await self.obter(rota_id)
        if rota.status == StatusRota.CONCLUIDA:
            raise AppError("Rota concluída não pode ser cancelada")

        rota.status = StatusRota.CANCELADA
        await self._liberar_veiculo(rota)

        self.db.add(rota)
        await self.db.commit()
        return await self._recarregar(rota.id)

    async def _liberar_veiculo(self, rota: Rota) -> None:
        if not rota.veiculo_id:
            return
        veiculo = await self.db.get(Veiculo, rota.veiculo_id)
        if veiculo and veiculo.status == StatusVeiculo.EM_ROTA.value:
            veiculo.status = StatusVeiculo.DISPONIVEL.value
            self.db.add(veiculo)

    async def marcar_parada(self, parada_id: UUID, status: StatusParada) -> RotaParada:
        parada = await self.db.get(RotaParada, parada_id)
        if parada is None:
            raise NotFoundError("Parada não encontrada")

        rota = await self.obter(parada.rota_id)
        if rota.status != StatusRota.EM_ANDAMENTO:
            raise AppError("Só é possível marcar embarque em uma rota em andamento")

        parada.status = status
        parada.registrado_em = None if status == StatusParada.PENDENTE else datetime.now(UTC)

        self.db.add(parada)
        await self.db.commit()
        await self.db.refresh(parada)
        await self.db.refresh(parada, attribute_names=["aluno"])
        return parada

    # --------------------------------------------------------------- relatório

    async def relatorio(
        self,
        *,
        data_inicio: date | None = None,
        data_fim: date | None = None,
    ) -> RelatorioRotas:
        rotas = await self.listar(data_inicio=data_inicio, data_fim=data_fim)

        return RelatorioRotas(
            total_rotas=len(rotas),
            concluidas=sum(1 for r in rotas if r.status == StatusRota.CONCLUIDA),
            em_andamento=sum(1 for r in rotas if r.status == StatusRota.EM_ANDAMENTO),
            planejadas=sum(1 for r in rotas if r.status == StatusRota.PLANEJADA),
            canceladas=sum(1 for r in rotas if r.status == StatusRota.CANCELADA),
            distancia_total_km=round(sum(r.distancia_total_km or 0.0 for r in rotas), 2),
            custo_total=round(sum(r.custo_combustivel or 0.0 for r in rotas), 2),
            alunos_embarcados=sum(r.total_embarcados for r in rotas),
            alunos_ausentes=sum(r.total_ausentes for r in rotas),
        )

    @staticmethod
    def geometria_como_lista(rota: Rota) -> list[list[float]]:
        if not rota.geometria:
            return []
        try:
            return list(json.loads(rota.geometria))
        except (TypeError, ValueError):
            return []

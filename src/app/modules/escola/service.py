from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppError
from app.models.escola import Escola

from .schemas import EscolaUpdate


class EscolaService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def obter(self) -> Escola:
        """Devolve a linha singleton, criando-a vazia na primeira execução."""
        escola = await self.db.get(Escola, Escola.SINGLETON_ID)
        if escola is None:
            escola = Escola(id=Escola.SINGLETON_ID)
            self.db.add(escola)
            await self.db.commit()
            await self.db.refresh(escola)
        return escola

    async def esta_configurada(self) -> bool:
        escola = await self.obter()
        return bool(escola.endereco) and (escola.latitude != 0.0 or escola.longitude != 0.0)

    async def obter_configurada(self) -> Escola:
        escola = await self.obter()
        if not escola.endereco or (escola.latitude == 0.0 and escola.longitude == 0.0):
            raise AppError(
                "Configure a localização da escola antes de calcular rotas "
                "(menu Escola)."
            )
        return escola

    async def atualizar(self, dados: EscolaUpdate) -> Escola:
        escola = await self.obter()

        escola.nome = dados.nome.strip()
        escola.endereco = dados.endereco.strip()
        escola.latitude = dados.latitude
        escola.longitude = dados.longitude
        escola.horario_entrada = dados.horario_entrada
        escola.horario_saida = dados.horario_saida
        escola.preco_combustivel = dados.preco_combustivel
        escola.duracao_maxima_rota_min = dados.duracao_maxima_rota_min

        self.db.add(escola)
        await self.db.commit()
        await self.db.refresh(escola)
        return escola

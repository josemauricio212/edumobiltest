from fastapi import APIRouter

from app.modules.alunos.router import router as alunos_router
from app.modules.escola.router import router as escola_router
from app.modules.motoristas.router import router as motoristas_router
from app.modules.rotas.router import router as rotas_router
from app.modules.usuario.router import auth_router, router as usuarios_router
from app.modules.veiculos.router import router as veiculos_router

api_router = APIRouter(prefix="/api")

api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(usuarios_router, prefix="/usuarios", tags=["usuarios"])
api_router.include_router(alunos_router, prefix="/alunos", tags=["alunos"])
api_router.include_router(motoristas_router, prefix="/motoristas", tags=["motoristas"])
api_router.include_router(veiculos_router, prefix="/veiculos", tags=["veiculos"])
api_router.include_router(rotas_router, prefix="/rotas", tags=["rotas"])
api_router.include_router(escola_router, prefix="/escola", tags=["escola"])

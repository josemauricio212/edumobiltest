from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import settings
from app.core.database import init_models
from app.core.exceptions import AppError, app_error_handler
from app.core.logging import configure_logging, get_logger

configure_logging()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    logger.info("app_startup", environment=settings.environment)
    if settings.auto_create_tables:
        await init_models()
    yield
    logger.info("app_shutdown")


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        debug=settings.debug,
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.add_exception_handler(AppError, app_error_handler) # type: ignore
    app.include_router(api_router)

    return app


app = create_app()


@app.get("/health", tags=["health"])
async def health_check() -> dict[str, str]:
    return {"status": "ok"}

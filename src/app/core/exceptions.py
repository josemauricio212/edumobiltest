from fastapi import Request, status
from fastapi.responses import JSONResponse


class AppError(Exception):
    """Exceção base da aplicação. Módulos devem herdar dela."""

    def __init__(self, message: str, status_code: int = status.HTTP_400_BAD_REQUEST):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class NotFoundError(AppError):
    def __init__(self, message: str = "Recurso não encontrado"):
        super().__init__(message, status_code=status.HTTP_404_NOT_FOUND)


class ConflictError(AppError):
    def __init__(self, message: str = "Conflito de dados"):
        super().__init__(message, status_code=status.HTTP_409_CONFLICT)


class UnauthorizedError(AppError):
    def __init__(self, message: str = "Não autorizado"):
        super().__init__(message, status_code=status.HTTP_401_UNAUTHORIZED)


async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.message},
    )
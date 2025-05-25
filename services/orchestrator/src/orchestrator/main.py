"""Main FastAPI application for the orchestrator service."""

import logging
import sys
from contextlib import asynccontextmanager

import structlog
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .api.dependencies import cleanup_services, initialize_services
from .api.routes import router
from .config import settings
from .models import ErrorResponse


# Configure structured logging
def configure_logging() -> None:
    """Configure structured logging with structlog."""
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=getattr(logging, settings.log_level.upper()),
    )

    structlog.configure(
        processors=[
            structlog.stdlib.filter_by_level,
            structlog.stdlib.add_logger_name,
            structlog.stdlib.add_log_level,
            structlog.stdlib.PositionalArgumentsFormatter(),
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.UnicodeDecoder(),
            structlog.processors.JSONRenderer(),
        ],
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )


# Configure logging
configure_logging()
logger = structlog.get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    # Startup
    logger.info("Starting ZAMC Orchestrator service", version="0.1.0")
    try:
        await initialize_services()
        logger.info("Service startup completed successfully")
    except Exception as e:
        logger.error("Service startup failed", error=str(e))
        raise

    yield

    # Shutdown
    logger.info("Shutting down ZAMC Orchestrator service")
    try:
        await cleanup_services()
        logger.info("Service shutdown completed successfully")
    except Exception as e:
        logger.error("Service shutdown failed", error=str(e))


# Create FastAPI application
app = FastAPI(
    title="ZAMC AI Strategy Generator",
    description="AI-powered marketing strategy and content generation microservice",
    version="0.1.0",
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
    lifespan=lifespan,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.is_development else ["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler for unhandled exceptions."""
    logger.error(
        "Unhandled exception occurred",
        path=str(request.url),
        method=request.method,
        error=str(exc),
        exc_info=True,
    )
    
    if isinstance(exc, HTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content=ErrorResponse(
                error=exc.detail,
                detail=getattr(exc, "detail", None),
            ).model_dump(),
        )
    
    return JSONResponse(
        status_code=500,
        content=ErrorResponse(
            error="Internal server error",
            detail=str(exc) if settings.debug else None,
        ).model_dump(),
    )


# Include API routes
app.include_router(router, prefix="/api/v1", tags=["Strategy Generation"])


# Root endpoint
@app.get("/", include_in_schema=False)
async def root():
    """Root endpoint with service information."""
    return {
        "service": "ZAMC AI Strategy Generator",
        "version": "0.1.0",
        "status": "running",
        "docs": "/docs" if settings.debug else "disabled",
        "health": "/api/v1/health",
    }


def main() -> None:
    """Main entry point for running the service."""
    logger.info(
        "Starting server",
        host=settings.host,
        port=settings.port,
        debug=settings.debug,
        environment=settings.environment,
    )
    
    uvicorn.run(
        "orchestrator.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level=settings.log_level.lower(),
        access_log=settings.debug,
    )


if __name__ == "__main__":
    main() 
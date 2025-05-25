"""FastAPI dependencies for dependency injection."""

import logging
from functools import lru_cache

from ..services.langchain_service import LangChainService
from ..services.nats_service import NATSService
from ..services.qdrant_service import QdrantService
from ..services.strategy_service import StrategyService

logger = logging.getLogger(__name__)

# Global service instances
_langchain_service: LangChainService = None
_qdrant_service: QdrantService = None
_nats_service: NATSService = None
_strategy_service: StrategyService = None


@lru_cache()
def get_langchain_service() -> LangChainService:
    """Get or create LangChain service instance."""
    global _langchain_service
    if _langchain_service is None:
        _langchain_service = LangChainService()
    return _langchain_service


@lru_cache()
def get_qdrant_service() -> QdrantService:
    """Get or create Qdrant service instance."""
    global _qdrant_service
    if _qdrant_service is None:
        _qdrant_service = QdrantService()
    return _qdrant_service


@lru_cache()
def get_nats_service() -> NATSService:
    """Get or create NATS service instance."""
    global _nats_service
    if _nats_service is None:
        _nats_service = NATSService()
    return _nats_service


@lru_cache()
def get_strategy_service() -> StrategyService:
    """Get or create Strategy service instance."""
    global _strategy_service
    if _strategy_service is None:
        _strategy_service = StrategyService(
            langchain_service=get_langchain_service(),
            qdrant_service=get_qdrant_service(),
            nats_service=get_nats_service(),
        )
    return _strategy_service


async def initialize_services() -> None:
    """Initialize all services and their connections."""
    try:
        logger.info("Initializing services...")
        
        # Initialize Qdrant
        qdrant_service = get_qdrant_service()
        await qdrant_service.initialize()
        
        # Initialize NATS
        nats_service = get_nats_service()
        await nats_service.connect()
        
        logger.info("All services initialized successfully")
        
    except Exception as e:
        logger.error(f"Failed to initialize services: {e}")
        raise


async def cleanup_services() -> None:
    """Cleanup all services and their connections."""
    try:
        logger.info("Cleaning up services...")
        
        # Cleanup NATS
        if _nats_service:
            await _nats_service.disconnect()
        
        logger.info("All services cleaned up successfully")
        
    except Exception as e:
        logger.error(f"Failed to cleanup services: {e}") 
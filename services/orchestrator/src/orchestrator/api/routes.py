"""FastAPI routes for the orchestrator service."""

import logging
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query
from fastapi.responses import JSONResponse

from ..models import (
    ContentDraft,
    ContentType,
    ErrorResponse,
    GenerateStrategyRequest,
    GenerateStrategyResponse,
    HealthCheck,
    MarketingStrategy,
)
from ..services.strategy_service import StrategyService
from .dependencies import get_strategy_service

logger = logging.getLogger(__name__)

# Create API router
router = APIRouter()


@router.post(
    "/generate-strategy",
    response_model=GenerateStrategyResponse,
    summary="Generate Marketing Strategy",
    description="Generate a comprehensive 90-day marketing strategy with content drafts for a project",
    responses={
        200: {"description": "Strategy generated successfully"},
        400: {"description": "Invalid request parameters"},
        404: {"description": "Project not found"},
        500: {"description": "Internal server error"},
    },
)
async def generate_strategy(
    request: GenerateStrategyRequest,
    background_tasks: BackgroundTasks,
    strategy_service: StrategyService = Depends(get_strategy_service),
) -> GenerateStrategyResponse:
    """
    Generate a comprehensive 90-day marketing strategy for a project.
    
    This endpoint creates:
    - A detailed marketing strategy with phases, objectives, and metrics
    - Content drafts for various types (blog posts, social media, etc.)
    - Vector embeddings stored in Qdrant for similarity search
    - NATS events for downstream processing
    
    The generation process runs asynchronously and may take several minutes
    depending on the number of content pieces requested.
    """
    try:
        logger.info(f"Received strategy generation request for project {request.project_id}")
        
        # Generate strategy (this may take a while)
        response = await strategy_service.generate_strategy(request)
        
        logger.info(f"Strategy generation completed with status: {response.status}")
        return response
        
    except Exception as e:
        logger.error(f"Strategy generation failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Strategy generation failed: {str(e)}"
        )


@router.get(
    "/strategies/{strategy_id}",
    response_model=MarketingStrategy,
    summary="Get Strategy by ID",
    description="Retrieve a marketing strategy by its ID",
    responses={
        200: {"description": "Strategy found"},
        404: {"description": "Strategy not found"},
        500: {"description": "Internal server error"},
    },
)
async def get_strategy(
    strategy_id: UUID,
    strategy_service: StrategyService = Depends(get_strategy_service),
) -> MarketingStrategy:
    """Get a marketing strategy by its ID."""
    try:
        strategy = await strategy_service.get_strategy_by_id(strategy_id)
        if not strategy:
            raise HTTPException(status_code=404, detail="Strategy not found")
        return strategy
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get strategy {strategy_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/strategies/{strategy_id}/content",
    response_model=List[ContentDraft],
    summary="Get Content Drafts",
    description="Get all content drafts for a specific strategy",
    responses={
        200: {"description": "Content drafts retrieved"},
        404: {"description": "Strategy not found"},
        500: {"description": "Internal server error"},
    },
)
async def get_content_drafts(
    strategy_id: UUID,
    strategy_service: StrategyService = Depends(get_strategy_service),
) -> List[ContentDraft]:
    """Get all content drafts for a specific strategy."""
    try:
        # Verify strategy exists
        strategy = await strategy_service.get_strategy_by_id(strategy_id)
        if not strategy:
            raise HTTPException(status_code=404, detail="Strategy not found")
        
        content_drafts = await strategy_service.get_content_drafts_by_strategy(strategy_id)
        return content_drafts
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get content drafts for strategy {strategy_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/search/strategies",
    response_model=List[MarketingStrategy],
    summary="Search Similar Strategies",
    description="Search for similar strategies using semantic search",
    responses={
        200: {"description": "Similar strategies found"},
        400: {"description": "Invalid search parameters"},
        500: {"description": "Internal server error"},
    },
)
async def search_strategies(
    query: str = Query(..., description="Search query text"),
    project_id: Optional[UUID] = Query(None, description="Filter by project ID"),
    limit: int = Query(5, ge=1, le=20, description="Maximum number of results"),
    strategy_service: StrategyService = Depends(get_strategy_service),
) -> List[MarketingStrategy]:
    """Search for similar strategies using semantic search."""
    try:
        if not query.strip():
            raise HTTPException(status_code=400, detail="Query cannot be empty")
        
        strategies = await strategy_service.search_similar_strategies(
            query, project_id, limit
        )
        return strategies
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to search strategies: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/search/content",
    response_model=List[ContentDraft],
    summary="Search Similar Content",
    description="Search for similar content drafts using semantic search",
    responses={
        200: {"description": "Similar content found"},
        400: {"description": "Invalid search parameters"},
        500: {"description": "Internal server error"},
    },
)
async def search_content(
    query: str = Query(..., description="Search query text"),
    project_id: Optional[UUID] = Query(None, description="Filter by project ID"),
    content_type: Optional[ContentType] = Query(None, description="Filter by content type"),
    limit: int = Query(10, ge=1, le=50, description="Maximum number of results"),
    strategy_service: StrategyService = Depends(get_strategy_service),
) -> List[ContentDraft]:
    """Search for similar content drafts using semantic search."""
    try:
        if not query.strip():
            raise HTTPException(status_code=400, detail="Query cannot be empty")
        
        content_drafts = await strategy_service.search_similar_content(
            query, project_id, content_type, limit
        )
        return content_drafts
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to search content: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete(
    "/strategies/{strategy_id}",
    summary="Delete Strategy",
    description="Delete a strategy and all its associated content drafts",
    responses={
        200: {"description": "Strategy deleted successfully"},
        404: {"description": "Strategy not found"},
        500: {"description": "Internal server error"},
    },
)
async def delete_strategy(
    strategy_id: UUID,
    strategy_service: StrategyService = Depends(get_strategy_service),
) -> JSONResponse:
    """Delete a strategy and all its associated content drafts."""
    try:
        # Verify strategy exists
        strategy = await strategy_service.get_strategy_by_id(strategy_id)
        if not strategy:
            raise HTTPException(status_code=404, detail="Strategy not found")
        
        success = await strategy_service.delete_strategy(strategy_id)
        if success:
            return JSONResponse(
                content={"message": "Strategy deleted successfully"},
                status_code=200
            )
        else:
            raise HTTPException(status_code=500, detail="Failed to delete strategy")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete strategy {strategy_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/health",
    response_model=HealthCheck,
    summary="Health Check",
    description="Check the health status of the orchestrator service and its dependencies",
    responses={
        200: {"description": "Service is healthy"},
        503: {"description": "Service is unhealthy"},
    },
)
async def health_check(
    strategy_service: StrategyService = Depends(get_strategy_service),
) -> HealthCheck:
    """Check the health status of the service and its dependencies."""
    try:
        # Check service dependencies
        qdrant_health = await strategy_service.qdrant.health_check()
        nats_health = await strategy_service.nats.health_check()
        
        services = {
            "qdrant": qdrant_health["status"],
            "nats": nats_health["status"],
            "langchain": "healthy",  # LangChain doesn't have a health check
        }
        
        # Determine overall health
        all_healthy = all(status == "healthy" for status in services.values())
        
        health = HealthCheck(
            status="healthy" if all_healthy else "degraded",
            services=services,
        )
        
        return health
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return HealthCheck(
            status="unhealthy",
            services={"error": str(e)},
        ) 
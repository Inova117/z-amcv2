"""Campaign performance API endpoints."""

import logging
from typing import Dict, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from ..models import CampaignMetrics, CampaignPlatform
from ..services.campaign_performance_service import CampaignPerformanceService
from .dependencies import get_campaign_performance_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/campaign-performance", tags=["campaign-performance"])


class RegisterCampaignRequest(BaseModel):
    """Request model for registering a campaign."""

    project_id: UUID
    campaign_id: str
    campaign_name: str
    platform: CampaignPlatform
    budget_limit: Optional[float] = None


class UpdateMetricsRequest(BaseModel):
    """Request model for updating campaign metrics."""

    project_id: UUID
    campaign_id: str
    impressions: Optional[int] = None
    clicks: Optional[int] = None
    spend: Optional[float] = None
    conversions: Optional[int] = None
    revenue: Optional[float] = None


class CampaignMetricsResponse(BaseModel):
    """Response model for campaign metrics."""

    campaign_id: str
    campaign_name: str
    platform: CampaignPlatform
    impressions: int
    clicks: int
    spend: float
    conversions: int
    revenue: float
    ctr: float
    cpc: float
    cpm: float
    roas: float
    timestamp: str
    date: str


class HealthResponse(BaseModel):
    """Health check response."""

    status: str
    active_campaigns: int
    monitoring_active: bool
    nats_status: str


# Use dependency injection from dependencies module


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register_campaign(
    request: RegisterCampaignRequest,
    service: CampaignPerformanceService = Depends(get_campaign_performance_service),
) -> Dict[str, str]:
    """Register a campaign for performance monitoring."""
    try:
        await service.register_campaign(
            project_id=request.project_id,
            campaign_id=request.campaign_id,
            campaign_name=request.campaign_name,
            platform=request.platform,
            budget_limit=request.budget_limit,
        )

        return {
            "message": f"Campaign {request.campaign_id} registered successfully",
            "campaign_id": request.campaign_id,
        }

    except Exception as e:
        logger.error(f"Failed to register campaign {request.campaign_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to register campaign: {str(e)}"
        )


@router.post("/update-metrics", status_code=status.HTTP_200_OK)
async def update_campaign_metrics(
    request: UpdateMetricsRequest,
    service: CampaignPerformanceService = Depends(get_campaign_performance_service),
) -> Dict[str, str]:
    """Update campaign metrics."""
    try:
        metrics_data = {}
        if request.impressions is not None:
            metrics_data["impressions"] = request.impressions
        if request.clicks is not None:
            metrics_data["clicks"] = request.clicks
        if request.spend is not None:
            metrics_data["spend"] = request.spend
        if request.conversions is not None:
            metrics_data["conversions"] = request.conversions
        if request.revenue is not None:
            metrics_data["revenue"] = request.revenue

        await service.update_campaign_metrics(
            project_id=request.project_id,
            campaign_id=request.campaign_id,
            metrics_data=metrics_data,
        )

        return {
            "message": f"Metrics updated for campaign {request.campaign_id}",
            "campaign_id": request.campaign_id,
        }

    except Exception as e:
        logger.error(f"Failed to update metrics for campaign {request.campaign_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update metrics: {str(e)}"
        )


@router.get("/metrics/{campaign_id}", response_model=CampaignMetricsResponse)
async def get_campaign_metrics(
    campaign_id: str,
    service: CampaignPerformanceService = Depends(get_campaign_performance_service),
) -> CampaignMetricsResponse:
    """Get current metrics for a specific campaign."""
    try:
        metrics = service.get_campaign_metrics(campaign_id)
        if not metrics:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Campaign {campaign_id} not found"
            )

        return CampaignMetricsResponse(
            campaign_id=metrics.campaign_id,
            campaign_name=metrics.campaign_name,
            platform=metrics.platform,
            impressions=metrics.impressions,
            clicks=metrics.clicks,
            spend=metrics.spend,
            conversions=metrics.conversions,
            revenue=metrics.revenue,
            ctr=metrics.ctr,
            cpc=metrics.cpc,
            cpm=metrics.cpm,
            roas=metrics.roas,
            timestamp=metrics.timestamp.isoformat(),
            date=metrics.date,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get metrics for campaign {campaign_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get campaign metrics: {str(e)}"
        )


@router.get("/metrics", response_model=List[CampaignMetricsResponse])
async def get_all_campaign_metrics(
    service: CampaignPerformanceService = Depends(get_campaign_performance_service),
) -> List[CampaignMetricsResponse]:
    """Get metrics for all active campaigns."""
    try:
        all_metrics = service.get_all_campaign_metrics()
        
        return [
            CampaignMetricsResponse(
                campaign_id=metrics.campaign_id,
                campaign_name=metrics.campaign_name,
                platform=metrics.platform,
                impressions=metrics.impressions,
                clicks=metrics.clicks,
                spend=metrics.spend,
                conversions=metrics.conversions,
                revenue=metrics.revenue,
                ctr=metrics.ctr,
                cpc=metrics.cpc,
                cpm=metrics.cpm,
                roas=metrics.roas,
                timestamp=metrics.timestamp.isoformat(),
                date=metrics.date,
            )
            for metrics in all_metrics
        ]

    except Exception as e:
        logger.error(f"Failed to get all campaign metrics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get campaign metrics: {str(e)}"
        )


@router.post("/start-monitoring", status_code=status.HTTP_200_OK)
async def start_monitoring(
    service: CampaignPerformanceService = Depends(get_campaign_performance_service),
) -> Dict[str, str]:
    """Start campaign performance monitoring."""
    try:
        await service.start_monitoring()
        return {"message": "Campaign performance monitoring started"}

    except Exception as e:
        logger.error(f"Failed to start monitoring: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start monitoring: {str(e)}"
        )


@router.post("/stop-monitoring", status_code=status.HTTP_200_OK)
async def stop_monitoring(
    service: CampaignPerformanceService = Depends(get_campaign_performance_service),
) -> Dict[str, str]:
    """Stop campaign performance monitoring."""
    try:
        await service.stop_monitoring()
        return {"message": "Campaign performance monitoring stopped"}

    except Exception as e:
        logger.error(f"Failed to stop monitoring: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to stop monitoring: {str(e)}"
        )


@router.post("/simulate-metrics/{project_id}", status_code=status.HTTP_200_OK)
async def simulate_metrics(
    project_id: UUID,
    service: CampaignPerformanceService = Depends(get_campaign_performance_service),
) -> Dict[str, str]:
    """Generate simulated metrics for demo purposes."""
    try:
        await service.generate_simulated_metrics(project_id)
        return {
            "message": f"Simulated metrics generated for project {project_id}",
            "project_id": str(project_id),
        }

    except Exception as e:
        logger.error(f"Failed to simulate metrics for project {project_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to simulate metrics: {str(e)}"
        )


@router.get("/health", response_model=HealthResponse)
async def health_check(
    service: CampaignPerformanceService = Depends(get_campaign_performance_service),
) -> HealthResponse:
    """Health check for campaign performance service."""
    try:
        health_data = await service.health_check()
        
        return HealthResponse(
            status=health_data["service"],
            active_campaigns=int(health_data["active_campaigns"]),
            monitoring_active=health_data["monitoring_active"] == "True",
            nats_status=health_data["nats"],
        )

    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Health check failed: {str(e)}"
        ) 
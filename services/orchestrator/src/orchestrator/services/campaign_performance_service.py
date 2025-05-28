"""Campaign performance service for generating and publishing metrics events."""

import asyncio
import logging
import random
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from uuid import UUID

from ..models import (
    CampaignBudgetExceededEvent,
    CampaignMetrics,
    CampaignMetricsUpdatedEvent,
    CampaignPerformanceAlert,
    CampaignPerformanceAlertEvent,
    CampaignPerformanceThresholdEvent,
    CampaignPlatform,
)
from .nats_service import NATSService

logger = logging.getLogger(__name__)


class CampaignPerformanceService:
    """Service for campaign performance monitoring and event emission."""

    def __init__(self, nats_service: NATSService) -> None:
        """Initialize campaign performance service."""
        self.nats = nats_service
        self.active_campaigns: Dict[str, CampaignMetrics] = {}
        self.performance_thresholds = {
            "roas_low": 2.0,
            "roas_high": 5.0,
            "ctr_low": 1.0,
            "ctr_high": 5.0,
            "cpc_high": 2.0,
        }
        self.budget_limits: Dict[str, float] = {}
        self._monitoring_task: Optional[asyncio.Task] = None

    async def start_monitoring(self) -> None:
        """Start campaign performance monitoring."""
        if self._monitoring_task is None or self._monitoring_task.done():
            self._monitoring_task = asyncio.create_task(self._monitoring_loop())
            logger.info("Campaign performance monitoring started")

    async def stop_monitoring(self) -> None:
        """Stop campaign performance monitoring."""
        if self._monitoring_task and not self._monitoring_task.done():
            self._monitoring_task.cancel()
            try:
                await self._monitoring_task
            except asyncio.CancelledError:
                pass
            logger.info("Campaign performance monitoring stopped")

    async def register_campaign(
        self,
        project_id: UUID,
        campaign_id: str,
        campaign_name: str,
        platform: CampaignPlatform,
        budget_limit: Optional[float] = None,
    ) -> None:
        """Register a campaign for performance monitoring."""
        initial_metrics = CampaignMetrics(
            campaign_id=campaign_id,
            campaign_name=campaign_name,
            platform=platform,
        )
        
        self.active_campaigns[campaign_id] = initial_metrics
        
        if budget_limit:
            self.budget_limits[campaign_id] = budget_limit

        logger.info(f"Registered campaign {campaign_id} for monitoring")

        # Publish initial metrics
        await self._publish_metrics_update(project_id, initial_metrics)

    async def update_campaign_metrics(
        self, project_id: UUID, campaign_id: str, metrics_data: Dict
    ) -> None:
        """Update campaign metrics and publish events."""
        if campaign_id not in self.active_campaigns:
            logger.warning(f"Campaign {campaign_id} not registered for monitoring")
            return

        current_metrics = self.active_campaigns[campaign_id]
        
        # Update metrics
        updated_metrics = CampaignMetrics(
            campaign_id=current_metrics.campaign_id,
            campaign_name=current_metrics.campaign_name,
            platform=current_metrics.platform,
            impressions=metrics_data.get("impressions", current_metrics.impressions),
            clicks=metrics_data.get("clicks", current_metrics.clicks),
            spend=metrics_data.get("spend", current_metrics.spend),
            conversions=metrics_data.get("conversions", current_metrics.conversions),
            revenue=metrics_data.get("revenue", current_metrics.revenue),
            timestamp=datetime.utcnow(),
        )

        # Calculate derived metrics
        updated_metrics.ctr = (
            (updated_metrics.clicks / updated_metrics.impressions) * 100
            if updated_metrics.impressions > 0
            else 0.0
        )
        updated_metrics.cpc = (
            updated_metrics.spend / updated_metrics.clicks
            if updated_metrics.clicks > 0
            else 0.0
        )
        updated_metrics.cpm = (
            (updated_metrics.spend / updated_metrics.impressions) * 1000
            if updated_metrics.impressions > 0
            else 0.0
        )
        updated_metrics.roas = (
            updated_metrics.revenue / updated_metrics.spend
            if updated_metrics.spend > 0
            else 0.0
        )

        # Store updated metrics
        self.active_campaigns[campaign_id] = updated_metrics

        # Publish metrics update
        await self._publish_metrics_update(project_id, updated_metrics)

        # Check for alerts
        await self._check_performance_alerts(project_id, current_metrics, updated_metrics)

    async def generate_simulated_metrics(self, project_id: UUID) -> None:
        """Generate simulated campaign metrics for demo purposes."""
        # Create demo campaigns if none exist
        if not self.active_campaigns:
            demo_campaigns = [
                {
                    "campaign_id": "demo_summer_sale_2024",
                    "campaign_name": "Summer Sale 2024",
                    "platform": CampaignPlatform.GOOGLE_ADS,
                    "budget_limit": 1000.0,
                },
                {
                    "campaign_id": "demo_brand_awareness_q4",
                    "campaign_name": "Brand Awareness Q4",
                    "platform": CampaignPlatform.META,
                    "budget_limit": 1500.0,
                },
                {
                    "campaign_id": "demo_product_launch",
                    "campaign_name": "Product Launch Campaign",
                    "platform": CampaignPlatform.LINKEDIN,
                    "budget_limit": 800.0,
                },
            ]

            for campaign in demo_campaigns:
                await self.register_campaign(
                    project_id=project_id,
                    campaign_id=campaign["campaign_id"],
                    campaign_name=campaign["campaign_name"],
                    platform=campaign["platform"],
                    budget_limit=campaign["budget_limit"],
                )

        # Generate realistic metrics updates
        for campaign_id, current_metrics in self.active_campaigns.items():
            # Simulate realistic performance variations
            base_impressions = random.randint(1000, 5000)
            base_clicks = int(base_impressions * random.uniform(0.02, 0.08))  # 2-8% CTR
            base_spend = random.uniform(50, 200)
            base_conversions = int(base_clicks * random.uniform(0.05, 0.15))  # 5-15% conversion
            base_revenue = base_conversions * random.uniform(25, 100)  # $25-100 per conversion

            metrics_update = {
                "impressions": current_metrics.impressions + base_impressions,
                "clicks": current_metrics.clicks + base_clicks,
                "spend": current_metrics.spend + base_spend,
                "conversions": current_metrics.conversions + base_conversions,
                "revenue": current_metrics.revenue + base_revenue,
            }

            await self.update_campaign_metrics(project_id, campaign_id, metrics_update)

    async def _monitoring_loop(self) -> None:
        """Main monitoring loop for campaign performance."""
        while True:
            try:
                # Generate simulated metrics for demo
                # In production, this would fetch real metrics from platform APIs
                demo_project_id = UUID("12345678-1234-5678-9012-123456789012")
                await self.generate_simulated_metrics(demo_project_id)
                
                # Wait before next update (30 seconds for demo, would be longer in production)
                await asyncio.sleep(30)
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in monitoring loop: {e}")
                await asyncio.sleep(60)  # Wait longer on error

    async def _publish_metrics_update(
        self, project_id: UUID, metrics: CampaignMetrics
    ) -> None:
        """Publish campaign metrics update event."""
        event = CampaignMetricsUpdatedEvent(
            project_id=project_id,
            campaign_id=metrics.campaign_id,
            metrics=metrics,
        )

        success = await self.nats.publish_campaign_metrics_updated(event)
        if success:
            logger.info(f"Published metrics update for campaign {metrics.campaign_id}")
        else:
            logger.error(f"Failed to publish metrics update for campaign {metrics.campaign_id}")

    async def _check_performance_alerts(
        self,
        project_id: UUID,
        previous_metrics: CampaignMetrics,
        current_metrics: CampaignMetrics,
    ) -> None:
        """Check for performance alerts and publish events."""
        campaign_id = current_metrics.campaign_id

        # Check budget exceeded
        if campaign_id in self.budget_limits:
            budget_limit = self.budget_limits[campaign_id]
            if current_metrics.spend > budget_limit:
                percentage_exceeded = ((current_metrics.spend - budget_limit) / budget_limit) * 100
                
                event = CampaignBudgetExceededEvent(
                    project_id=project_id,
                    campaign_id=campaign_id,
                    budget_limit=budget_limit,
                    current_spend=current_metrics.spend,
                    percentage_exceeded=percentage_exceeded,
                )
                
                await self.nats.publish_campaign_budget_exceeded(event)
                
                # Also create a performance alert
                alert = CampaignPerformanceAlert(
                    campaign_id=campaign_id,
                    alert_type="budget_exceeded",
                    severity="high",
                    message=f"Campaign budget exceeded by {percentage_exceeded:.1f}%",
                    threshold=budget_limit,
                    current_value=current_metrics.spend,
                )
                
                alert_event = CampaignPerformanceAlertEvent(
                    project_id=project_id,
                    alert=alert,
                )
                
                await self.nats.publish_campaign_performance_alert(alert_event)

        # Check ROAS thresholds
        await self._check_metric_threshold(
            project_id, campaign_id, "roas", current_metrics.roas, previous_metrics.roas
        )

        # Check CTR thresholds
        await self._check_metric_threshold(
            project_id, campaign_id, "ctr", current_metrics.ctr, previous_metrics.ctr
        )

        # Check CPC thresholds
        await self._check_metric_threshold(
            project_id, campaign_id, "cpc", current_metrics.cpc, previous_metrics.cpc
        )

    async def _check_metric_threshold(
        self,
        project_id: UUID,
        campaign_id: str,
        metric_name: str,
        current_value: float,
        previous_value: float,
    ) -> None:
        """Check if a metric has crossed a threshold."""
        low_threshold = self.performance_thresholds.get(f"{metric_name}_low")
        high_threshold = self.performance_thresholds.get(f"{metric_name}_high")

        # Check if crossed low threshold (downward)
        if (
            low_threshold
            and previous_value >= low_threshold
            and current_value < low_threshold
        ):
            event = CampaignPerformanceThresholdEvent(
                project_id=project_id,
                campaign_id=campaign_id,
                metric_name=metric_name,
                threshold_type="below",
                threshold_value=low_threshold,
                current_value=current_value,
            )
            await self.nats.publish_campaign_performance_threshold(event)

        # Check if crossed high threshold (upward)
        if (
            high_threshold
            and previous_value <= high_threshold
            and current_value > high_threshold
        ):
            event = CampaignPerformanceThresholdEvent(
                project_id=project_id,
                campaign_id=campaign_id,
                metric_name=metric_name,
                threshold_type="above",
                threshold_value=high_threshold,
                current_value=current_value,
            )
            await self.nats.publish_campaign_performance_threshold(event)

    def get_campaign_metrics(self, campaign_id: str) -> Optional[CampaignMetrics]:
        """Get current metrics for a campaign."""
        return self.active_campaigns.get(campaign_id)

    def get_all_campaign_metrics(self) -> List[CampaignMetrics]:
        """Get metrics for all active campaigns."""
        return list(self.active_campaigns.values())

    async def health_check(self) -> Dict[str, str]:
        """Perform health check."""
        health = {
            "service": "healthy",
            "active_campaigns": str(len(self.active_campaigns)),
            "monitoring_active": str(self._monitoring_task is not None and not self._monitoring_task.done()),
        }

        # Check NATS connection
        try:
            # Simple check - in production you'd want more comprehensive health checks
            health["nats"] = "healthy"
        except Exception as e:
            health["nats"] = f"unhealthy: {e}"

        return health 
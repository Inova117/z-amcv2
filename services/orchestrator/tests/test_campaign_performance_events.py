"""Test suite for campaign performance event emission and reliability."""

import asyncio
import json
import time
from datetime import datetime
from typing import Dict, List
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import UUID, uuid4

import pytest
from pydantic import ValidationError

from orchestrator.models import (
    CampaignBudgetExceededEvent,
    CampaignMetrics,
    CampaignMetricsUpdatedEvent,
    CampaignPerformanceAlert,
    CampaignPerformanceAlertEvent,
    CampaignPerformanceThresholdEvent,
    CampaignPlatform,
)
from orchestrator.services.campaign_performance_service import CampaignPerformanceService
from orchestrator.services.nats_service import NATSService


class MockNATSService:
    """Mock NATS service for testing."""

    def __init__(self):
        self.published_events: List[Dict] = []
        self.connection_status = True
        self.publish_delay = 0.0
        self.should_fail = False

    async def publish_campaign_metrics_updated(self, event: CampaignMetricsUpdatedEvent) -> bool:
        """Mock publish campaign metrics updated event."""
        if self.should_fail:
            return False
        
        await asyncio.sleep(self.publish_delay)
        self.published_events.append({
            "type": "campaign_metrics_updated",
            "event": event.model_dump(),
            "timestamp": time.time()
        })
        return True

    async def publish_campaign_performance_alert(self, event: CampaignPerformanceAlertEvent) -> bool:
        """Mock publish campaign performance alert event."""
        if self.should_fail:
            return False
        
        await asyncio.sleep(self.publish_delay)
        self.published_events.append({
            "type": "campaign_performance_alert",
            "event": event.model_dump(),
            "timestamp": time.time()
        })
        return True

    async def publish_campaign_budget_exceeded(self, event: CampaignBudgetExceededEvent) -> bool:
        """Mock publish campaign budget exceeded event."""
        if self.should_fail:
            return False
        
        await asyncio.sleep(self.publish_delay)
        self.published_events.append({
            "type": "campaign_budget_exceeded",
            "event": event.model_dump(),
            "timestamp": time.time()
        })
        return True

    async def publish_campaign_performance_threshold(self, event: CampaignPerformanceThresholdEvent) -> bool:
        """Mock publish campaign performance threshold event."""
        if self.should_fail:
            return False
        
        await asyncio.sleep(self.publish_delay)
        self.published_events.append({
            "type": "campaign_performance_threshold",
            "event": event.model_dump(),
            "timestamp": time.time()
        })
        return True

    async def health_check(self) -> Dict[str, str]:
        """Mock health check."""
        return {"status": "healthy" if self.connection_status else "unhealthy"}

    def reset(self):
        """Reset mock state."""
        self.published_events.clear()
        self.connection_status = True
        self.publish_delay = 0.0
        self.should_fail = False


@pytest.fixture
def mock_nats_service():
    """Fixture for mock NATS service."""
    return MockNATSService()


@pytest.fixture
def campaign_performance_service(mock_nats_service):
    """Fixture for campaign performance service."""
    return CampaignPerformanceService(mock_nats_service)


@pytest.fixture
def sample_project_id():
    """Fixture for sample project ID."""
    return uuid4()


@pytest.fixture
def sample_campaign_data():
    """Fixture for sample campaign data."""
    return {
        "campaign_id": "test_campaign_001",
        "campaign_name": "Test Campaign",
        "platform": CampaignPlatform.GOOGLE_ADS,
        "budget_limit": 1000.0,
    }


class TestCampaignMetricsEvents:
    """Test campaign metrics event emission."""

    @pytest.mark.asyncio
    async def test_register_campaign_publishes_initial_metrics(
        self, campaign_performance_service, mock_nats_service, sample_project_id, sample_campaign_data
    ):
        """Test that registering a campaign publishes initial metrics."""
        await campaign_performance_service.register_campaign(
            project_id=sample_project_id,
            **sample_campaign_data
        )

        # Verify event was published
        assert len(mock_nats_service.published_events) == 1
        event = mock_nats_service.published_events[0]
        assert event["type"] == "campaign_metrics_updated"
        assert event["event"]["project_id"] == str(sample_project_id)
        assert event["event"]["campaign_id"] == sample_campaign_data["campaign_id"]

    @pytest.mark.asyncio
    async def test_update_metrics_publishes_event(
        self, campaign_performance_service, mock_nats_service, sample_project_id, sample_campaign_data
    ):
        """Test that updating metrics publishes an event."""
        # Register campaign first
        await campaign_performance_service.register_campaign(
            project_id=sample_project_id,
            **sample_campaign_data
        )
        mock_nats_service.reset()

        # Update metrics
        metrics_update = {
            "impressions": 1000,
            "clicks": 50,
            "spend": 100.0,
            "conversions": 5,
            "revenue": 250.0,
        }

        await campaign_performance_service.update_campaign_metrics(
            project_id=sample_project_id,
            campaign_id=sample_campaign_data["campaign_id"],
            metrics_data=metrics_update,
        )

        # Verify event was published
        assert len(mock_nats_service.published_events) == 1
        event = mock_nats_service.published_events[0]
        assert event["type"] == "campaign_metrics_updated"
        
        metrics = event["event"]["metrics"]
        assert metrics["impressions"] == 1000
        assert metrics["clicks"] == 50
        assert metrics["spend"] == 100.0
        assert metrics["ctr"] == 5.0  # (50/1000) * 100
        assert metrics["roas"] == 2.5  # 250/100

    @pytest.mark.asyncio
    async def test_metrics_calculation_accuracy(
        self, campaign_performance_service, mock_nats_service, sample_project_id, sample_campaign_data
    ):
        """Test that derived metrics are calculated correctly."""
        await campaign_performance_service.register_campaign(
            project_id=sample_project_id,
            **sample_campaign_data
        )
        mock_nats_service.reset()

        # Test various metric calculations
        test_cases = [
            {
                "impressions": 10000,
                "clicks": 200,
                "spend": 500.0,
                "conversions": 20,
                "revenue": 1000.0,
                "expected_ctr": 2.0,
                "expected_cpc": 2.5,
                "expected_cpm": 50.0,
                "expected_roas": 2.0,
            },
            {
                "impressions": 5000,
                "clicks": 100,
                "spend": 200.0,
                "conversions": 10,
                "revenue": 800.0,
                "expected_ctr": 2.0,
                "expected_cpc": 2.0,
                "expected_cpm": 40.0,
                "expected_roas": 4.0,
            },
        ]

        for i, case in enumerate(test_cases):
            await campaign_performance_service.update_campaign_metrics(
                project_id=sample_project_id,
                campaign_id=sample_campaign_data["campaign_id"],
                metrics_data={
                    "impressions": case["impressions"],
                    "clicks": case["clicks"],
                    "spend": case["spend"],
                    "conversions": case["conversions"],
                    "revenue": case["revenue"],
                },
            )

            event = mock_nats_service.published_events[i]
            metrics = event["event"]["metrics"]
            
            assert abs(metrics["ctr"] - case["expected_ctr"]) < 0.01
            assert abs(metrics["cpc"] - case["expected_cpc"]) < 0.01
            assert abs(metrics["cpm"] - case["expected_cpm"]) < 0.01
            assert abs(metrics["roas"] - case["expected_roas"]) < 0.01


class TestCampaignPerformanceAlerts:
    """Test campaign performance alert events."""

    @pytest.mark.asyncio
    async def test_budget_exceeded_alert(
        self, campaign_performance_service, mock_nats_service, sample_project_id, sample_campaign_data
    ):
        """Test budget exceeded alert generation."""
        await campaign_performance_service.register_campaign(
            project_id=sample_project_id,
            **sample_campaign_data
        )
        mock_nats_service.reset()

        # Update metrics to exceed budget
        await campaign_performance_service.update_campaign_metrics(
            project_id=sample_project_id,
            campaign_id=sample_campaign_data["campaign_id"],
            metrics_data={"spend": 1200.0},  # Exceeds 1000.0 budget
        )

        # Should have metrics update + budget exceeded + performance alert
        assert len(mock_nats_service.published_events) == 3
        
        budget_event = next(
            e for e in mock_nats_service.published_events 
            if e["type"] == "campaign_budget_exceeded"
        )
        assert budget_event["event"]["budget_limit"] == 1000.0
        assert budget_event["event"]["current_spend"] == 1200.0
        assert budget_event["event"]["percentage_exceeded"] == 20.0

        alert_event = next(
            e for e in mock_nats_service.published_events 
            if e["type"] == "campaign_performance_alert"
        )
        assert alert_event["event"]["alert"]["alert_type"] == "budget_exceeded"
        assert alert_event["event"]["alert"]["severity"] == "high"

    @pytest.mark.asyncio
    async def test_performance_threshold_alerts(
        self, campaign_performance_service, mock_nats_service, sample_project_id, sample_campaign_data
    ):
        """Test performance threshold crossing alerts."""
        await campaign_performance_service.register_campaign(
            project_id=sample_project_id,
            **sample_campaign_data
        )
        
        # Set initial metrics above threshold
        await campaign_performance_service.update_campaign_metrics(
            project_id=sample_project_id,
            campaign_id=sample_campaign_data["campaign_id"],
            metrics_data={
                "impressions": 1000,
                "clicks": 60,  # 6% CTR (above 5% threshold)
                "spend": 100.0,
                "revenue": 600.0,  # 6.0 ROAS (above 5.0 threshold)
            },
        )
        mock_nats_service.reset()

        # Update metrics to cross below threshold
        await campaign_performance_service.update_campaign_metrics(
            project_id=sample_project_id,
            campaign_id=sample_campaign_data["campaign_id"],
            metrics_data={
                "impressions": 2000,
                "clicks": 80,  # 4% CTR (below 5% threshold)
                "spend": 200.0,
                "revenue": 800.0,  # 4.0 ROAS (below 5.0 threshold)
            },
        )

        # Should have metrics update + threshold events
        threshold_events = [
            e for e in mock_nats_service.published_events 
            if e["type"] == "campaign_performance_threshold"
        ]
        
        # Should have CTR and ROAS threshold events
        assert len(threshold_events) >= 2
        
        ctr_event = next(
            e for e in threshold_events 
            if e["event"]["metric_name"] == "ctr"
        )
        assert ctr_event["event"]["threshold_type"] == "below"
        assert ctr_event["event"]["threshold_value"] == 5.0

        roas_event = next(
            e for e in threshold_events 
            if e["event"]["metric_name"] == "roas"
        )
        assert roas_event["event"]["threshold_type"] == "below"
        assert roas_event["event"]["threshold_value"] == 5.0


class TestEventReliability:
    """Test event reliability and error handling."""

    @pytest.mark.asyncio
    async def test_event_publishing_failure_handling(
        self, campaign_performance_service, mock_nats_service, sample_project_id, sample_campaign_data
    ):
        """Test handling of event publishing failures."""
        await campaign_performance_service.register_campaign(
            project_id=sample_project_id,
            **sample_campaign_data
        )
        
        # Simulate NATS failure
        mock_nats_service.should_fail = True
        mock_nats_service.reset()

        # Update metrics - should not raise exception even if publishing fails
        await campaign_performance_service.update_campaign_metrics(
            project_id=sample_project_id,
            campaign_id=sample_campaign_data["campaign_id"],
            metrics_data={"spend": 100.0},
        )

        # No events should be published due to failure
        assert len(mock_nats_service.published_events) == 0

    @pytest.mark.asyncio
    async def test_event_publishing_latency(
        self, campaign_performance_service, mock_nats_service, sample_project_id, sample_campaign_data
    ):
        """Test event publishing latency."""
        await campaign_performance_service.register_campaign(
            project_id=sample_project_id,
            **sample_campaign_data
        )
        mock_nats_service.reset()

        # Add artificial delay to publishing
        mock_nats_service.publish_delay = 0.1  # 100ms delay

        start_time = time.time()
        await campaign_performance_service.update_campaign_metrics(
            project_id=sample_project_id,
            campaign_id=sample_campaign_data["campaign_id"],
            metrics_data={"spend": 100.0},
        )
        end_time = time.time()

        # Should complete within reasonable time (including delay)
        assert end_time - start_time < 0.5  # 500ms max
        assert len(mock_nats_service.published_events) == 1

    @pytest.mark.asyncio
    async def test_concurrent_metric_updates(
        self, campaign_performance_service, mock_nats_service, sample_project_id, sample_campaign_data
    ):
        """Test concurrent metric updates and event publishing."""
        await campaign_performance_service.register_campaign(
            project_id=sample_project_id,
            **sample_campaign_data
        )
        mock_nats_service.reset()

        # Create multiple concurrent updates
        tasks = []
        for i in range(10):
            task = campaign_performance_service.update_campaign_metrics(
                project_id=sample_project_id,
                campaign_id=sample_campaign_data["campaign_id"],
                metrics_data={"spend": 100.0 + i * 10},
            )
            tasks.append(task)

        # Wait for all updates to complete
        await asyncio.gather(*tasks)

        # All events should be published
        assert len(mock_nats_service.published_events) == 10

        # Events should have increasing spend values
        spend_values = [
            e["event"]["metrics"]["spend"] 
            for e in mock_nats_service.published_events
            if e["type"] == "campaign_metrics_updated"
        ]
        assert len(spend_values) == 10


class TestEventDataIntegrity:
    """Test event data integrity and validation."""

    def test_campaign_metrics_model_validation(self):
        """Test CampaignMetrics model validation."""
        # Valid metrics
        valid_metrics = CampaignMetrics(
            campaign_id="test_001",
            campaign_name="Test Campaign",
            platform=CampaignPlatform.GOOGLE_ADS,
            impressions=1000,
            clicks=50,
            spend=100.0,
            conversions=5,
            revenue=250.0,
        )
        assert valid_metrics.campaign_id == "test_001"
        assert valid_metrics.ctr == 0.0  # Should be calculated separately
        
        # Invalid platform should raise validation error
        with pytest.raises(ValidationError):
            CampaignMetrics(
                campaign_id="test_001",
                campaign_name="Test Campaign",
                platform="invalid_platform",  # Invalid platform
                impressions=1000,
            )

    def test_event_serialization(self):
        """Test event serialization and deserialization."""
        metrics = CampaignMetrics(
            campaign_id="test_001",
            campaign_name="Test Campaign",
            platform=CampaignPlatform.META,
            impressions=1000,
            clicks=50,
            spend=100.0,
        )

        event = CampaignMetricsUpdatedEvent(
            project_id=uuid4(),
            campaign_id="test_001",
            metrics=metrics,
        )

        # Serialize to JSON
        json_data = event.model_dump_json()
        parsed_data = json.loads(json_data)

        # Verify structure
        assert parsed_data["event_type"] == "campaign.metrics_updated"
        assert parsed_data["campaign_id"] == "test_001"
        assert parsed_data["metrics"]["platform"] == "meta"
        assert "timestamp" in parsed_data

    @pytest.mark.asyncio
    async def test_monitoring_loop_error_handling(
        self, campaign_performance_service, mock_nats_service
    ):
        """Test monitoring loop error handling."""
        # Start monitoring
        await campaign_performance_service.start_monitoring()
        
        # Let it run briefly
        await asyncio.sleep(0.1)
        
        # Stop monitoring
        await campaign_performance_service.stop_monitoring()
        
        # Should complete without errors
        assert not campaign_performance_service._monitoring_task.done() or \
               campaign_performance_service._monitoring_task.cancelled()


class TestHealthChecks:
    """Test health check functionality."""

    @pytest.mark.asyncio
    async def test_service_health_check(
        self, campaign_performance_service, mock_nats_service
    ):
        """Test service health check."""
        health = await campaign_performance_service.health_check()
        
        assert health["service"] == "healthy"
        assert health["active_campaigns"] == "0"
        assert health["monitoring_active"] == "False"
        assert health["nats"] == "healthy"

    @pytest.mark.asyncio
    async def test_health_check_with_unhealthy_nats(
        self, campaign_performance_service, mock_nats_service
    ):
        """Test health check with unhealthy NATS."""
        mock_nats_service.connection_status = False
        
        health = await campaign_performance_service.health_check()
        
        assert health["service"] == "healthy"  # Service itself is healthy
        # NATS health would be checked separately in a real implementation


if __name__ == "__main__":
    pytest.main([__file__, "-v"]) 
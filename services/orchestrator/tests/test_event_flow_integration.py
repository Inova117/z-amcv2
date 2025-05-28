"""Integration test for complete event flow: Orchestrator → NATS → BFF → Frontend."""

import asyncio
import json
import time
from typing import Dict, List
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest
import websockets
from fastapi.testclient import TestClient

from orchestrator.main import app
from orchestrator.models import CampaignPlatform
from orchestrator.services.campaign_performance_service import CampaignPerformanceService
from orchestrator.services.nats_service import NATSService


class MockWebSocketConnection:
    """Mock WebSocket connection for testing GraphQL subscriptions."""

    def __init__(self):
        self.messages: List[Dict] = []
        self.is_connected = True

    async def send(self, message: str):
        """Mock send message."""
        if self.is_connected:
            self.messages.append(json.loads(message))

    async def recv(self):
        """Mock receive message."""
        if self.messages:
            return json.dumps(self.messages.pop(0))
        await asyncio.sleep(0.1)
        return json.dumps({"type": "ping"})

    def close(self):
        """Mock close connection."""
        self.is_connected = False


class EventFlowTracker:
    """Track events through the complete flow."""

    def __init__(self):
        self.orchestrator_events: List[Dict] = []
        self.nats_events: List[Dict] = []
        self.bff_events: List[Dict] = []
        self.frontend_events: List[Dict] = []
        self.latency_measurements: List[float] = []

    def record_orchestrator_event(self, event_type: str, data: Dict):
        """Record event from orchestrator."""
        self.orchestrator_events.append({
            "type": event_type,
            "data": data,
            "timestamp": time.time(),
            "source": "orchestrator"
        })

    def record_nats_event(self, subject: str, data: Dict):
        """Record event from NATS."""
        self.nats_events.append({
            "subject": subject,
            "data": data,
            "timestamp": time.time(),
            "source": "nats"
        })

    def record_bff_event(self, event_type: str, data: Dict):
        """Record event from BFF."""
        self.bff_events.append({
            "type": event_type,
            "data": data,
            "timestamp": time.time(),
            "source": "bff"
        })

    def record_frontend_event(self, subscription_id: str, data: Dict):
        """Record event received by frontend."""
        self.frontend_events.append({
            "subscription_id": subscription_id,
            "data": data,
            "timestamp": time.time(),
            "source": "frontend"
        })

    def calculate_end_to_end_latency(self) -> float:
        """Calculate end-to-end latency from orchestrator to frontend."""
        if not self.orchestrator_events or not self.frontend_events:
            return 0.0

        start_time = self.orchestrator_events[0]["timestamp"]
        end_time = self.frontend_events[-1]["timestamp"]
        latency = (end_time - start_time) * 1000  # Convert to milliseconds
        self.latency_measurements.append(latency)
        return latency

    def get_event_count_by_source(self) -> Dict[str, int]:
        """Get event count by source."""
        return {
            "orchestrator": len(self.orchestrator_events),
            "nats": len(self.nats_events),
            "bff": len(self.bff_events),
            "frontend": len(self.frontend_events),
        }

    def verify_event_integrity(self) -> bool:
        """Verify that events maintain integrity through the flow."""
        if not self.orchestrator_events or not self.frontend_events:
            return False

        # Check that campaign ID is preserved
        orchestrator_campaign_id = self.orchestrator_events[0]["data"].get("campaign_id")
        frontend_campaign_id = self.frontend_events[-1]["data"].get("campaignId")
        
        return orchestrator_campaign_id == frontend_campaign_id


@pytest.fixture
def event_tracker():
    """Fixture for event flow tracker."""
    return EventFlowTracker()


@pytest.fixture
def mock_websocket():
    """Fixture for mock WebSocket connection."""
    return MockWebSocketConnection()


class TestCompleteEventFlow:
    """Test complete event flow from orchestrator to frontend."""

    @pytest.mark.asyncio
    async def test_campaign_metrics_event_flow(self, event_tracker, mock_websocket):
        """Test complete campaign metrics event flow."""
        project_id = uuid4()
        campaign_id = "test_campaign_flow"

        # Step 1: Create mock NATS service that tracks events
        class TrackingNATSService:
            async def publish_campaign_metrics_updated(self, event):
                event_tracker.record_nats_event(
                    "zamc.events.campaign.metrics_updated",
                    event.model_dump()
                )
                return True

            async def health_check(self):
                return {"status": "healthy"}

        # Step 2: Create campaign performance service with tracking
        nats_service = TrackingNATSService()
        campaign_service = CampaignPerformanceService(nats_service)

        # Step 3: Register campaign and update metrics
        await campaign_service.register_campaign(
            project_id=project_id,
            campaign_id=campaign_id,
            campaign_name="Test Flow Campaign",
            platform=CampaignPlatform.GOOGLE_ADS,
            budget_limit=1000.0,
        )

        event_tracker.record_orchestrator_event(
            "campaign_registered",
            {"campaign_id": campaign_id, "project_id": str(project_id)}
        )

        # Step 4: Update metrics to trigger event
        await campaign_service.update_campaign_metrics(
            project_id=project_id,
            campaign_id=campaign_id,
            metrics_data={
                "impressions": 1000,
                "clicks": 50,
                "spend": 100.0,
                "conversions": 5,
                "revenue": 250.0,
            }
        )

        event_tracker.record_orchestrator_event(
            "metrics_updated",
            {"campaign_id": campaign_id, "metrics": {"impressions": 1000}}
        )

        # Step 5: Simulate BFF receiving NATS event
        if event_tracker.nats_events:
            nats_event = event_tracker.nats_events[-1]
            event_tracker.record_bff_event(
                "campaign_metrics_received",
                nats_event["data"]
            )

            # Step 6: Simulate BFF sending to frontend via GraphQL subscription
            frontend_data = {
                "campaignId": nats_event["data"]["campaign_id"],
                "metrics": nats_event["data"]["metrics"],
                "timestamp": nats_event["data"]["timestamp"]
            }
            
            event_tracker.record_frontend_event(
                "campaignMetricsUpdated",
                frontend_data
            )

        # Verify complete flow
        event_counts = event_tracker.get_event_count_by_source()
        assert event_counts["orchestrator"] >= 2  # Register + update
        assert event_counts["nats"] >= 1  # At least one NATS event
        assert event_counts["bff"] >= 1  # BFF received event
        assert event_counts["frontend"] >= 1  # Frontend received event

        # Verify event integrity
        assert event_tracker.verify_event_integrity()

        # Verify latency is reasonable (< 100ms for mock)
        latency = event_tracker.calculate_end_to_end_latency()
        assert latency < 100.0  # 100ms max for mock flow

    @pytest.mark.asyncio
    async def test_performance_alert_event_flow(self, event_tracker):
        """Test performance alert event flow."""
        project_id = uuid4()
        campaign_id = "test_alert_flow"

        # Create tracking NATS service
        class AlertTrackingNATSService:
            async def publish_campaign_metrics_updated(self, event):
                event_tracker.record_nats_event(
                    "zamc.events.campaign.metrics_updated",
                    event.model_dump()
                )
                return True

            async def publish_campaign_budget_exceeded(self, event):
                event_tracker.record_nats_event(
                    "zamc.events.campaign.budget_exceeded",
                    event.model_dump()
                )
                return True

            async def publish_campaign_performance_alert(self, event):
                event_tracker.record_nats_event(
                    "zamc.events.campaign.performance_alert",
                    event.model_dump()
                )
                return True

            async def health_check(self):
                return {"status": "healthy"}

        nats_service = AlertTrackingNATSService()
        campaign_service = CampaignPerformanceService(nats_service)

        # Register campaign with budget limit
        await campaign_service.register_campaign(
            project_id=project_id,
            campaign_id=campaign_id,
            campaign_name="Test Alert Campaign",
            platform=CampaignPlatform.META,
            budget_limit=500.0,
        )

        # Update metrics to exceed budget (trigger alert)
        await campaign_service.update_campaign_metrics(
            project_id=project_id,
            campaign_id=campaign_id,
            metrics_data={"spend": 600.0},  # Exceeds 500.0 budget
        )

        event_tracker.record_orchestrator_event(
            "budget_exceeded",
            {"campaign_id": campaign_id, "spend": 600.0, "budget": 500.0}
        )

        # Verify alert events were generated
        alert_events = [
            e for e in event_tracker.nats_events
            if "alert" in e["subject"] or "budget_exceeded" in e["subject"]
        ]
        assert len(alert_events) >= 2  # Budget exceeded + performance alert

        # Simulate frontend receiving alerts
        for alert_event in alert_events:
            event_tracker.record_frontend_event(
                "campaignPerformanceAlert",
                alert_event["data"]
            )

        # Verify alert flow
        event_counts = event_tracker.get_event_count_by_source()
        assert event_counts["frontend"] >= 2  # Multiple alert events

    @pytest.mark.asyncio
    async def test_concurrent_event_flow(self, event_tracker):
        """Test concurrent event processing."""
        project_id = uuid4()
        campaign_ids = [f"concurrent_campaign_{i}" for i in range(5)]

        # Create concurrent tracking NATS service
        class ConcurrentTrackingNATSService:
            def __init__(self):
                self.event_count = 0

            async def publish_campaign_metrics_updated(self, event):
                self.event_count += 1
                event_tracker.record_nats_event(
                    f"zamc.events.campaign.metrics_updated.{self.event_count}",
                    event.model_dump()
                )
                # Add small delay to simulate network latency
                await asyncio.sleep(0.01)
                return True

            async def health_check(self):
                return {"status": "healthy"}

        nats_service = ConcurrentTrackingNATSService()
        campaign_service = CampaignPerformanceService(nats_service)

        # Register multiple campaigns concurrently
        register_tasks = []
        for campaign_id in campaign_ids:
            task = campaign_service.register_campaign(
                project_id=project_id,
                campaign_id=campaign_id,
                campaign_name=f"Concurrent Campaign {campaign_id}",
                platform=CampaignPlatform.GOOGLE_ADS,
            )
            register_tasks.append(task)

        await asyncio.gather(*register_tasks)

        # Update metrics for all campaigns concurrently
        update_tasks = []
        for i, campaign_id in enumerate(campaign_ids):
            task = campaign_service.update_campaign_metrics(
                project_id=project_id,
                campaign_id=campaign_id,
                metrics_data={
                    "impressions": 1000 + i * 100,
                    "clicks": 50 + i * 5,
                    "spend": 100.0 + i * 10,
                }
            )
            update_tasks.append(task)

        await asyncio.gather(*update_tasks)

        # Verify all events were processed
        event_counts = event_tracker.get_event_count_by_source()
        assert event_counts["nats"] >= len(campaign_ids) * 2  # Register + update for each

    @pytest.mark.asyncio
    async def test_event_ordering_and_consistency(self, event_tracker):
        """Test event ordering and consistency."""
        project_id = uuid4()
        campaign_id = "ordering_test_campaign"

        # Create ordering tracking NATS service
        class OrderingTrackingNATSService:
            def __init__(self):
                self.sequence_number = 0

            async def publish_campaign_metrics_updated(self, event):
                self.sequence_number += 1
                event_data = event.model_dump()
                event_data["sequence"] = self.sequence_number
                event_tracker.record_nats_event(
                    "zamc.events.campaign.metrics_updated",
                    event_data
                )
                return True

            async def health_check(self):
                return {"status": "healthy"}

        nats_service = OrderingTrackingNATSService()
        campaign_service = CampaignPerformanceService(nats_service)

        # Register campaign
        await campaign_service.register_campaign(
            project_id=project_id,
            campaign_id=campaign_id,
            campaign_name="Ordering Test Campaign",
            platform=CampaignPlatform.LINKEDIN,
        )

        # Send multiple sequential updates
        for i in range(10):
            await campaign_service.update_campaign_metrics(
                project_id=project_id,
                campaign_id=campaign_id,
                metrics_data={
                    "impressions": 1000 + i * 100,
                    "spend": 100.0 + i * 10,
                }
            )
            # Small delay to ensure ordering
            await asyncio.sleep(0.001)

        # Verify events are in correct order
        nats_events = [e for e in event_tracker.nats_events if "sequence" in e["data"]]
        sequences = [e["data"]["sequence"] for e in nats_events]
        
        # Should be in ascending order
        assert sequences == sorted(sequences)
        assert len(set(sequences)) == len(sequences)  # No duplicates

    @pytest.mark.asyncio
    async def test_error_recovery_and_resilience(self, event_tracker):
        """Test error recovery and system resilience."""
        project_id = uuid4()
        campaign_id = "resilience_test_campaign"

        # Create resilient NATS service that fails intermittently
        class ResilientNATSService:
            def __init__(self):
                self.failure_count = 0
                self.max_failures = 3

            async def publish_campaign_metrics_updated(self, event):
                self.failure_count += 1
                
                # Fail first few attempts
                if self.failure_count <= self.max_failures:
                    event_tracker.record_nats_event(
                        "zamc.events.campaign.metrics_updated.failed",
                        {"error": "simulated_failure", "attempt": self.failure_count}
                    )
                    return False
                
                # Succeed after max failures
                event_tracker.record_nats_event(
                    "zamc.events.campaign.metrics_updated.success",
                    event.model_dump()
                )
                return True

            async def health_check(self):
                return {"status": "degraded" if self.failure_count <= self.max_failures else "healthy"}

        nats_service = ResilientNATSService()
        campaign_service = CampaignPerformanceService(nats_service)

        # Register campaign
        await campaign_service.register_campaign(
            project_id=project_id,
            campaign_id=campaign_id,
            campaign_name="Resilience Test Campaign",
            platform=CampaignPlatform.TWITTER,
        )

        # Update metrics multiple times (some will fail, some will succeed)
        for i in range(5):
            await campaign_service.update_campaign_metrics(
                project_id=project_id,
                campaign_id=campaign_id,
                metrics_data={"spend": 100.0 + i * 10}
            )

        # Verify that system recovered and some events succeeded
        success_events = [
            e for e in event_tracker.nats_events
            if "success" in e["subject"]
        ]
        failure_events = [
            e for e in event_tracker.nats_events
            if "failed" in e["subject"]
        ]

        assert len(success_events) > 0  # Some events should succeed
        assert len(failure_events) > 0  # Some events should fail initially


class TestEventLatencyAndPerformance:
    """Test event latency and performance characteristics."""

    @pytest.mark.asyncio
    async def test_event_latency_measurement(self, event_tracker):
        """Test event latency measurement and benchmarking."""
        project_id = uuid4()
        campaign_id = "latency_test_campaign"
        
        # Create latency measuring NATS service
        class LatencyMeasuringNATSService:
            async def publish_campaign_metrics_updated(self, event):
                start_time = time.time()
                
                # Simulate network delay
                await asyncio.sleep(0.005)  # 5ms simulated network delay
                
                end_time = time.time()
                latency = (end_time - start_time) * 1000  # Convert to ms
                
                event_data = event.model_dump()
                event_data["publish_latency_ms"] = latency
                
                event_tracker.record_nats_event(
                    "zamc.events.campaign.metrics_updated",
                    event_data
                )
                return True

            async def health_check(self):
                return {"status": "healthy"}

        nats_service = LatencyMeasuringNATSService()
        campaign_service = CampaignPerformanceService(nats_service)

        # Register campaign
        await campaign_service.register_campaign(
            project_id=project_id,
            campaign_id=campaign_id,
            campaign_name="Latency Test Campaign",
            platform=CampaignPlatform.GOOGLE_ADS,
        )

        # Measure latency for multiple updates
        latencies = []
        for i in range(20):
            start_time = time.time()
            
            await campaign_service.update_campaign_metrics(
                project_id=project_id,
                campaign_id=campaign_id,
                metrics_data={"spend": 100.0 + i}
            )
            
            end_time = time.time()
            latencies.append((end_time - start_time) * 1000)

        # Verify latency characteristics
        avg_latency = sum(latencies) / len(latencies)
        max_latency = max(latencies)
        min_latency = min(latencies)

        assert avg_latency < 50.0  # Average latency should be < 50ms
        assert max_latency < 100.0  # Max latency should be < 100ms
        assert min_latency > 0.0  # Min latency should be > 0

        # Verify 95th percentile latency
        sorted_latencies = sorted(latencies)
        p95_latency = sorted_latencies[int(0.95 * len(sorted_latencies))]
        assert p95_latency < 75.0  # 95th percentile should be < 75ms

    @pytest.mark.asyncio
    async def test_throughput_and_scalability(self, event_tracker):
        """Test event throughput and scalability."""
        project_id = uuid4()
        num_campaigns = 50
        updates_per_campaign = 10

        # Create throughput measuring NATS service
        class ThroughputMeasuringNATSService:
            def __init__(self):
                self.event_count = 0
                self.start_time = None

            async def publish_campaign_metrics_updated(self, event):
                if self.start_time is None:
                    self.start_time = time.time()
                
                self.event_count += 1
                
                event_tracker.record_nats_event(
                    f"zamc.events.campaign.metrics_updated.{self.event_count}",
                    event.model_dump()
                )
                return True

            def get_throughput(self):
                if self.start_time is None:
                    return 0.0
                elapsed = time.time() - self.start_time
                return self.event_count / elapsed if elapsed > 0 else 0.0

            async def health_check(self):
                return {"status": "healthy"}

        nats_service = ThroughputMeasuringNATSService()
        campaign_service = CampaignPerformanceService(nats_service)

        # Register multiple campaigns
        register_tasks = []
        for i in range(num_campaigns):
            task = campaign_service.register_campaign(
                project_id=project_id,
                campaign_id=f"throughput_campaign_{i}",
                campaign_name=f"Throughput Campaign {i}",
                platform=CampaignPlatform.GOOGLE_ADS,
            )
            register_tasks.append(task)

        await asyncio.gather(*register_tasks)

        # Generate high volume of updates
        update_tasks = []
        for i in range(num_campaigns):
            for j in range(updates_per_campaign):
                task = campaign_service.update_campaign_metrics(
                    project_id=project_id,
                    campaign_id=f"throughput_campaign_{i}",
                    metrics_data={"spend": 100.0 + j}
                )
                update_tasks.append(task)

        start_time = time.time()
        await asyncio.gather(*update_tasks)
        end_time = time.time()

        # Calculate throughput
        total_events = num_campaigns * updates_per_campaign
        elapsed_time = end_time - start_time
        throughput = total_events / elapsed_time

        # Verify throughput is reasonable
        assert throughput > 100.0  # Should handle > 100 events/second
        assert elapsed_time < 10.0  # Should complete within 10 seconds

        # Verify all events were processed
        event_counts = event_tracker.get_event_count_by_source()
        assert event_counts["nats"] >= total_events


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--asyncio-mode=auto"]) 
"""NATS service for event pub/sub functionality."""

import json
import logging
from typing import Any, Dict, Optional

import nats
from nats.aio.client import Client as NATSClient
from tenacity import retry, stop_after_attempt, wait_exponential

from ..config import settings
from ..models import AssetDraftCreatedEvent, PlanCreatedEvent

logger = logging.getLogger(__name__)


class NATSService:
    """Service for NATS event pub/sub."""

    def __init__(self) -> None:
        """Initialize NATS service."""
        self.client: Optional[NATSClient] = None
        self.subject_prefix = settings.nats_subject_prefix

    async def connect(self) -> None:
        """Connect to NATS server."""
        try:
            self.client = await nats.connect(settings.nats_url)
            logger.info(f"Connected to NATS at {settings.nats_url}")
        except Exception as e:
            logger.error(f"Failed to connect to NATS: {e}")
            raise

    async def disconnect(self) -> None:
        """Disconnect from NATS server."""
        if self.client:
            await self.client.close()
            logger.info("Disconnected from NATS")

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10),
    )
    async def publish_event(self, subject: str, event_data: Dict[str, Any]) -> bool:
        """Publish an event to NATS."""
        if not self.client:
            logger.error("NATS client not connected")
            return False

        try:
            full_subject = f"{self.subject_prefix}.{subject}"
            message = json.dumps(event_data, default=str)
            
            await self.client.publish(full_subject, message.encode())
            logger.info(f"Published event to {full_subject}: {event_data.get('event_type', 'unknown')}")
            return True

        except Exception as e:
            logger.error(f"Failed to publish event to {subject}: {e}")
            raise

    async def publish_asset_draft_created(
        self, event: AssetDraftCreatedEvent
    ) -> bool:
        """Publish asset draft created event."""
        return await self.publish_event(
            "events.asset.draft_created",
            event.model_dump()
        )

    async def publish_plan_created(self, event: PlanCreatedEvent) -> bool:
        """Publish plan created event."""
        return await self.publish_event(
            "events.plan.created",
            event.model_dump()
        )

    async def subscribe_to_events(
        self,
        subject_pattern: str,
        callback,
        queue_group: Optional[str] = None,
    ) -> None:
        """Subscribe to events with a callback function."""
        if not self.client:
            logger.error("NATS client not connected")
            return

        try:
            full_subject = f"{self.subject_prefix}.{subject_pattern}"
            
            async def message_handler(msg):
                try:
                    data = json.loads(msg.data.decode())
                    await callback(msg.subject, data)
                except Exception as e:
                    logger.error(f"Error processing message from {msg.subject}: {e}")

            await self.client.subscribe(
                full_subject,
                cb=message_handler,
                queue=queue_group,
            )
            
            logger.info(f"Subscribed to {full_subject}")

        except Exception as e:
            logger.error(f"Failed to subscribe to {subject_pattern}: {e}")
            raise

    async def health_check(self) -> Dict[str, str]:
        """Check NATS service health."""
        try:
            if not self.client:
                return {"status": "unhealthy", "error": "Not connected"}

            if self.client.is_connected:
                return {
                    "status": "healthy",
                    "connected_url": str(self.client.connected_url),
                }
            else:
                return {"status": "unhealthy", "error": "Connection lost"}

        except Exception as e:
            logger.error(f"NATS health check failed: {e}")
            return {"status": "unhealthy", "error": str(e)} 
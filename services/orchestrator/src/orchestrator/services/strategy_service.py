"""Main strategy service that orchestrates the generation process."""

import asyncio
import logging
from typing import List, Optional
from uuid import UUID

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

from ..config import settings
from ..models import (
    AssetDraftCreatedEvent,
    ContentDraft,
    ContentType,
    GenerateStrategyRequest,
    GenerateStrategyResponse,
    MarketingStrategy,
    PlanCreatedEvent,
    ProjectInfo,
    StrategyStatus,
)
from .langchain_service import LangChainService
from .nats_service import NATSService
from .qdrant_service import QdrantService

logger = logging.getLogger(__name__)


class StrategyService:
    """Main service for strategy generation orchestration."""

    def __init__(
        self,
        langchain_service: LangChainService,
        qdrant_service: QdrantService,
        nats_service: NATSService,
    ) -> None:
        """Initialize strategy service with dependencies."""
        self.langchain = langchain_service
        self.qdrant = qdrant_service
        self.nats = nats_service

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10),
    )
    async def get_project_info(self, project_id: UUID) -> Optional[ProjectInfo]:
        """Fetch project information from BFF service."""
        try:
            async with httpx.AsyncClient() as client:
                headers = {}
                if settings.bff_api_key:
                    headers["Authorization"] = f"Bearer {settings.bff_api_key}"

                response = await client.get(
                    f"{settings.bff_url}/api/projects/{project_id}",
                    headers=headers,
                    timeout=30.0,
                )

                if response.status_code == 200:
                    project_data = response.json()
                    return ProjectInfo(
                        id=UUID(project_data["id"]),
                        name=project_data["name"],
                        description=project_data.get("description"),
                        industry=project_data.get("industry"),
                        target_audience=project_data.get("target_audience"),
                        brand_voice=project_data.get("brand_voice"),
                        goals=project_data.get("goals", []),
                    )
                elif response.status_code == 404:
                    logger.warning(f"Project {project_id} not found")
                    return None
                else:
                    logger.error(f"Failed to fetch project {project_id}: {response.status_code}")
                    return None

        except Exception as e:
            logger.error(f"Error fetching project info for {project_id}: {e}")
            # Return mock project info for development/testing
            if settings.is_development:
                return ProjectInfo(
                    id=project_id,
                    name="Sample Project",
                    description="A sample project for testing strategy generation",
                    industry="Technology",
                    target_audience="Tech-savvy professionals",
                    brand_voice="Professional and innovative",
                    goals=["Increase brand awareness", "Generate leads", "Build community"],
                )
            return None

    async def generate_strategy(
        self, request: GenerateStrategyRequest
    ) -> GenerateStrategyResponse:
        """Generate a complete marketing strategy with content drafts."""
        try:
            logger.info(f"Starting strategy generation for project {request.project_id}")

            # Check if strategy already exists and regeneration is not forced
            if not request.regenerate:
                existing_strategy = await self.qdrant.get_strategy_by_id(request.project_id)
                if existing_strategy:
                    logger.info(f"Existing strategy found for project {request.project_id}")
                    content_drafts = await self.qdrant.get_content_drafts_by_strategy(
                        existing_strategy.id
                    )
                    return GenerateStrategyResponse(
                        strategy_id=existing_strategy.id,
                        project_id=request.project_id,
                        status=StrategyStatus.COMPLETED,
                        message="Strategy already exists",
                        strategy=existing_strategy,
                        content_drafts=content_drafts,
                    )

            # Get project information
            project_info = await self.get_project_info(request.project_id)
            if not project_info:
                return GenerateStrategyResponse(
                    strategy_id=UUID("00000000-0000-0000-0000-000000000000"),
                    project_id=request.project_id,
                    status=StrategyStatus.FAILED,
                    message="Project not found or inaccessible",
                )

            # Generate marketing strategy
            logger.info(f"Generating strategy for project: {project_info.name}")
            strategy = await self.langchain.generate_strategy(project_info)

            # Generate strategy embedding and store in Qdrant
            strategy_embedding = await self.langchain.generate_strategy_embedding(strategy)
            await self.qdrant.store_strategy(strategy, strategy_embedding)

            # Determine content types to generate
            content_types = request.content_types or [
                ContentType.BLOG_POST,
                ContentType.SOCIAL_MEDIA,
                ContentType.EMAIL_CAMPAIGN,
                ContentType.VIDEO_SCRIPT,
                ContentType.INFOGRAPHIC,
            ]

            # Limit content pieces
            max_pieces = min(
                request.max_content_pieces or settings.max_content_pieces,
                settings.max_content_pieces,
            )
            content_types = content_types[:max_pieces]

            # Generate content drafts concurrently
            logger.info(f"Generating {len(content_types)} content drafts")
            content_tasks = [
                self._generate_and_store_content(strategy, content_type)
                for content_type in content_types
            ]

            content_drafts = await asyncio.gather(*content_tasks, return_exceptions=True)

            # Filter out exceptions and log errors
            valid_drafts = []
            for i, result in enumerate(content_drafts):
                if isinstance(result, Exception):
                    logger.error(f"Failed to generate {content_types[i].value} content: {result}")
                else:
                    valid_drafts.append(result)

            # Publish events
            await self._publish_events(strategy, valid_drafts)

            logger.info(
                f"Strategy generation completed for project {request.project_id}. "
                f"Generated {len(valid_drafts)} content drafts."
            )

            return GenerateStrategyResponse(
                strategy_id=strategy.id,
                project_id=request.project_id,
                status=StrategyStatus.COMPLETED,
                message=f"Strategy generated successfully with {len(valid_drafts)} content drafts",
                strategy=strategy,
                content_drafts=valid_drafts,
            )

        except Exception as e:
            logger.error(f"Strategy generation failed for project {request.project_id}: {e}")
            return GenerateStrategyResponse(
                strategy_id=UUID("00000000-0000-0000-0000-000000000000"),
                project_id=request.project_id,
                status=StrategyStatus.FAILED,
                message=f"Strategy generation failed: {str(e)}",
            )

    async def _generate_and_store_content(
        self, strategy: MarketingStrategy, content_type: ContentType
    ) -> ContentDraft:
        """Generate and store a single content draft."""
        try:
            # Generate content draft
            draft = await self.langchain.generate_content_draft(content_type, strategy)

            # Generate embedding and store in Qdrant
            content_embedding = await self.langchain.generate_content_embedding(draft)
            await self.qdrant.store_content_draft(draft, content_embedding)

            return draft

        except Exception as e:
            logger.error(f"Failed to generate {content_type.value} content: {e}")
            raise

    async def _publish_events(
        self, strategy: MarketingStrategy, content_drafts: List[ContentDraft]
    ) -> None:
        """Publish NATS events for strategy and content creation."""
        try:
            # Publish plan created event
            plan_event = PlanCreatedEvent(
                project_id=strategy.project_id,
                strategy_id=strategy.id,
                plan_title=strategy.title,
                phases_count=len(strategy.phases),
                content_pieces_count=len(content_drafts),
            )
            await self.nats.publish_plan_created(plan_event)

            # Publish asset draft created events
            for draft in content_drafts:
                asset_event = AssetDraftCreatedEvent(
                    project_id=draft.project_id,
                    strategy_id=draft.strategy_id,
                    draft_id=draft.id,
                    content_type=draft.content_type,
                    title=draft.title,
                )
                await self.nats.publish_asset_draft_created(asset_event)

            logger.info(f"Published events for strategy {strategy.id}")

        except Exception as e:
            logger.error(f"Failed to publish events: {e}")
            # Don't raise exception as this is not critical for strategy generation

    async def get_strategy_by_id(self, strategy_id: UUID) -> Optional[MarketingStrategy]:
        """Get a strategy by its ID."""
        return await self.qdrant.get_strategy_by_id(strategy_id)

    async def get_content_drafts_by_strategy(
        self, strategy_id: UUID
    ) -> List[ContentDraft]:
        """Get all content drafts for a strategy."""
        return await self.qdrant.get_content_drafts_by_strategy(strategy_id)

    async def search_similar_strategies(
        self,
        query_text: str,
        project_id: Optional[UUID] = None,
        limit: int = 5,
    ) -> List[MarketingStrategy]:
        """Search for similar strategies using semantic search."""
        try:
            # Generate embedding for query
            query_embedding = await self.langchain.generate_embedding(query_text)

            # Search in Qdrant
            results = await self.qdrant.search_similar_strategies(
                query_embedding, project_id, limit
            )

            return [result["strategy"] for result in results]

        except Exception as e:
            logger.error(f"Failed to search similar strategies: {e}")
            return []

    async def search_similar_content(
        self,
        query_text: str,
        project_id: Optional[UUID] = None,
        content_type: Optional[ContentType] = None,
        limit: int = 10,
    ) -> List[ContentDraft]:
        """Search for similar content drafts using semantic search."""
        try:
            # Generate embedding for query
            query_embedding = await self.langchain.generate_embedding(query_text)

            # Search in Qdrant
            results = await self.qdrant.search_similar_content(
                query_embedding,
                project_id,
                content_type.value if content_type else None,
                limit,
            )

            return [result["draft"] for result in results]

        except Exception as e:
            logger.error(f"Failed to search similar content: {e}")
            return []

    async def delete_strategy(self, strategy_id: UUID) -> bool:
        """Delete a strategy and all its content drafts."""
        try:
            return await self.qdrant.delete_strategy(strategy_id)
        except Exception as e:
            logger.error(f"Failed to delete strategy {strategy_id}: {e}")
            return False 
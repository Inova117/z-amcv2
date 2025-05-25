"""Qdrant vector database service for storing and retrieving strategy drafts."""

import json
import logging
from typing import Any, Dict, List, Optional
from uuid import UUID

from qdrant_client import QdrantClient
from qdrant_client.http import models
from qdrant_client.http.exceptions import ResponseHandlingException
from tenacity import retry, stop_after_attempt, wait_exponential

from ..config import settings
from ..models import ContentDraft, MarketingStrategy

logger = logging.getLogger(__name__)


class QdrantService:
    """Service for interacting with Qdrant vector database."""

    def __init__(self) -> None:
        """Initialize Qdrant client."""
        self.client = QdrantClient(
            url=settings.qdrant_url,
            api_key=settings.qdrant_api_key,
        )
        self.collection_name = settings.qdrant_collection_name
        self.vector_size = settings.qdrant_vector_size

    async def initialize(self) -> None:
        """Initialize Qdrant collection if it doesn't exist."""
        try:
            # Check if collection exists
            collections = self.client.get_collections()
            collection_names = [col.name for col in collections.collections]

            if self.collection_name not in collection_names:
                logger.info(f"Creating Qdrant collection: {self.collection_name}")
                self.client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=models.VectorParams(
                        size=self.vector_size,
                        distance=models.Distance.COSINE,
                    ),
                )
                logger.info(f"Collection {self.collection_name} created successfully")
            else:
                logger.info(f"Collection {self.collection_name} already exists")

        except Exception as e:
            logger.error(f"Failed to initialize Qdrant collection: {e}")
            raise

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10),
    )
    async def store_strategy(
        self,
        strategy: MarketingStrategy,
        embedding: List[float],
    ) -> bool:
        """Store a marketing strategy with its embedding."""
        try:
            point = models.PointStruct(
                id=str(strategy.id),
                vector=embedding,
                payload={
                    "type": "strategy",
                    "project_id": str(strategy.project_id),
                    "title": strategy.title,
                    "description": strategy.description,
                    "target_audience": strategy.target_audience,
                    "brand_positioning": strategy.brand_positioning,
                    "key_messages": strategy.key_messages,
                    "phases_count": len(strategy.phases),
                    "status": strategy.status.value,
                    "created_at": strategy.created_at.isoformat(),
                    "updated_at": strategy.updated_at.isoformat(),
                    "strategy_data": strategy.model_dump_json(),
                },
            )

            self.client.upsert(
                collection_name=self.collection_name,
                points=[point],
            )

            logger.info(f"Stored strategy {strategy.id} in Qdrant")
            return True

        except Exception as e:
            logger.error(f"Failed to store strategy {strategy.id}: {e}")
            raise

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10),
    )
    async def store_content_draft(
        self,
        draft: ContentDraft,
        embedding: List[float],
    ) -> bool:
        """Store a content draft with its embedding."""
        try:
            point = models.PointStruct(
                id=str(draft.id),
                vector=embedding,
                payload={
                    "type": "content_draft",
                    "project_id": str(draft.project_id),
                    "strategy_id": str(draft.strategy_id),
                    "content_type": draft.content_type.value,
                    "title": draft.title,
                    "content_preview": draft.content[:500],  # Store preview
                    "status": draft.status.value,
                    "created_at": draft.created_at.isoformat(),
                    "updated_at": draft.updated_at.isoformat(),
                    "draft_data": draft.model_dump_json(),
                },
            )

            self.client.upsert(
                collection_name=self.collection_name,
                points=[point],
            )

            logger.info(f"Stored content draft {draft.id} in Qdrant")
            return True

        except Exception as e:
            logger.error(f"Failed to store content draft {draft.id}: {e}")
            raise

    async def search_similar_strategies(
        self,
        query_embedding: List[float],
        project_id: Optional[UUID] = None,
        limit: int = 5,
    ) -> List[Dict[str, Any]]:
        """Search for similar strategies using vector similarity."""
        try:
            search_filter = models.Filter(
                must=[
                    models.FieldCondition(
                        key="type",
                        match=models.MatchValue(value="strategy"),
                    )
                ]
            )

            if project_id:
                search_filter.must.append(
                    models.FieldCondition(
                        key="project_id",
                        match=models.MatchValue(value=str(project_id)),
                    )
                )

            results = self.client.search(
                collection_name=self.collection_name,
                query_vector=query_embedding,
                query_filter=search_filter,
                limit=limit,
                with_payload=True,
            )

            strategies = []
            for result in results:
                if result.payload:
                    strategy_data = json.loads(result.payload["strategy_data"])
                    strategies.append({
                        "strategy": MarketingStrategy(**strategy_data),
                        "score": result.score,
                    })

            logger.info(f"Found {len(strategies)} similar strategies")
            return strategies

        except Exception as e:
            logger.error(f"Failed to search similar strategies: {e}")
            return []

    async def search_similar_content(
        self,
        query_embedding: List[float],
        project_id: Optional[UUID] = None,
        content_type: Optional[str] = None,
        limit: int = 10,
    ) -> List[Dict[str, Any]]:
        """Search for similar content drafts using vector similarity."""
        try:
            search_filter = models.Filter(
                must=[
                    models.FieldCondition(
                        key="type",
                        match=models.MatchValue(value="content_draft"),
                    )
                ]
            )

            if project_id:
                search_filter.must.append(
                    models.FieldCondition(
                        key="project_id",
                        match=models.MatchValue(value=str(project_id)),
                    )
                )

            if content_type:
                search_filter.must.append(
                    models.FieldCondition(
                        key="content_type",
                        match=models.MatchValue(value=content_type),
                    )
                )

            results = self.client.search(
                collection_name=self.collection_name,
                query_vector=query_embedding,
                query_filter=search_filter,
                limit=limit,
                with_payload=True,
            )

            content_drafts = []
            for result in results:
                if result.payload:
                    draft_data = json.loads(result.payload["draft_data"])
                    content_drafts.append({
                        "draft": ContentDraft(**draft_data),
                        "score": result.score,
                    })

            logger.info(f"Found {len(content_drafts)} similar content drafts")
            return content_drafts

        except Exception as e:
            logger.error(f"Failed to search similar content: {e}")
            return []

    async def get_strategy_by_id(self, strategy_id: UUID) -> Optional[MarketingStrategy]:
        """Retrieve a strategy by its ID."""
        try:
            result = self.client.retrieve(
                collection_name=self.collection_name,
                ids=[str(strategy_id)],
                with_payload=True,
            )

            if result and result[0].payload:
                strategy_data = json.loads(result[0].payload["strategy_data"])
                return MarketingStrategy(**strategy_data)

            return None

        except Exception as e:
            logger.error(f"Failed to get strategy {strategy_id}: {e}")
            return None

    async def get_content_drafts_by_strategy(
        self, strategy_id: UUID
    ) -> List[ContentDraft]:
        """Get all content drafts for a specific strategy."""
        try:
            search_filter = models.Filter(
                must=[
                    models.FieldCondition(
                        key="type",
                        match=models.MatchValue(value="content_draft"),
                    ),
                    models.FieldCondition(
                        key="strategy_id",
                        match=models.MatchValue(value=str(strategy_id)),
                    ),
                ]
            )

            results = self.client.scroll(
                collection_name=self.collection_name,
                scroll_filter=search_filter,
                with_payload=True,
                limit=100,
            )

            content_drafts = []
            for result in results[0]:
                if result.payload:
                    draft_data = json.loads(result.payload["draft_data"])
                    content_drafts.append(ContentDraft(**draft_data))

            logger.info(f"Found {len(content_drafts)} content drafts for strategy {strategy_id}")
            return content_drafts

        except Exception as e:
            logger.error(f"Failed to get content drafts for strategy {strategy_id}: {e}")
            return []

    async def delete_strategy(self, strategy_id: UUID) -> bool:
        """Delete a strategy and all its content drafts."""
        try:
            # Delete strategy
            self.client.delete(
                collection_name=self.collection_name,
                points_selector=models.PointIdsList(
                    points=[str(strategy_id)],
                ),
            )

            # Delete associated content drafts
            search_filter = models.Filter(
                must=[
                    models.FieldCondition(
                        key="strategy_id",
                        match=models.MatchValue(value=str(strategy_id)),
                    )
                ]
            )

            self.client.delete(
                collection_name=self.collection_name,
                points_selector=models.FilterSelector(filter=search_filter),
            )

            logger.info(f"Deleted strategy {strategy_id} and its content drafts")
            return True

        except Exception as e:
            logger.error(f"Failed to delete strategy {strategy_id}: {e}")
            return False

    async def health_check(self) -> Dict[str, str]:
        """Check Qdrant service health."""
        try:
            collections = self.client.get_collections()
            return {
                "status": "healthy",
                "collections_count": str(len(collections.collections)),
            }
        except Exception as e:
            logger.error(f"Qdrant health check failed: {e}")
            return {"status": "unhealthy", "error": str(e)} 
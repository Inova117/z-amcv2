"""Unit tests for the strategy service."""

import pytest
from unittest.mock import AsyncMock, patch
from uuid import uuid4

from orchestrator.models import (
    ContentType,
    GenerateStrategyRequest,
    StrategyStatus,
)
from orchestrator.services.strategy_service import StrategyService


class TestStrategyService:
    """Test cases for StrategyService."""

    @pytest.mark.asyncio
    async def test_generate_strategy_success(
        self,
        mock_strategy_service: StrategyService,
        sample_project_info,
    ):
        """Test successful strategy generation."""
        # Arrange
        request = GenerateStrategyRequest(
            project_id=sample_project_info.id,
            content_types=[ContentType.BLOG_POST, ContentType.SOCIAL_MEDIA],
            max_content_pieces=2,
        )

        # Mock project info retrieval
        mock_strategy_service.get_project_info = AsyncMock(return_value=sample_project_info)

        # Act
        response = await mock_strategy_service.generate_strategy(request)

        # Assert
        assert response.status == StrategyStatus.COMPLETED
        assert response.project_id == sample_project_info.id
        assert response.strategy is not None
        assert len(response.content_drafts) == 2
        assert response.message.startswith("Strategy generated successfully")

        # Verify service calls
        mock_strategy_service.langchain.generate_strategy.assert_called_once_with(sample_project_info)
        mock_strategy_service.qdrant.store_strategy.assert_called_once()
        mock_strategy_service.nats.publish_plan_created.assert_called_once()

    @pytest.mark.asyncio
    async def test_generate_strategy_project_not_found(
        self,
        mock_strategy_service: StrategyService,
    ):
        """Test strategy generation when project is not found."""
        # Arrange
        project_id = uuid4()
        request = GenerateStrategyRequest(project_id=project_id)

        # Mock project info retrieval to return None
        mock_strategy_service.get_project_info = AsyncMock(return_value=None)

        # Act
        response = await mock_strategy_service.generate_strategy(request)

        # Assert
        assert response.status == StrategyStatus.FAILED
        assert response.project_id == project_id
        assert response.strategy is None
        assert response.message == "Project not found or inaccessible"

    @pytest.mark.asyncio
    async def test_generate_strategy_existing_strategy(
        self,
        mock_strategy_service: StrategyService,
        sample_marketing_strategy,
        sample_content_draft,
    ):
        """Test strategy generation when strategy already exists."""
        # Arrange
        request = GenerateStrategyRequest(
            project_id=sample_marketing_strategy.project_id,
            regenerate=False,
        )

        # Mock existing strategy
        mock_strategy_service.qdrant.get_strategy_by_id.return_value = sample_marketing_strategy
        mock_strategy_service.qdrant.get_content_drafts_by_strategy.return_value = [sample_content_draft]

        # Act
        response = await mock_strategy_service.generate_strategy(request)

        # Assert
        assert response.status == StrategyStatus.COMPLETED
        assert response.strategy == sample_marketing_strategy
        assert len(response.content_drafts) == 1
        assert response.message == "Strategy already exists"

    @pytest.mark.asyncio
    async def test_generate_strategy_force_regenerate(
        self,
        mock_strategy_service: StrategyService,
        sample_project_info,
        sample_marketing_strategy,
    ):
        """Test strategy generation with force regenerate."""
        # Arrange
        request = GenerateStrategyRequest(
            project_id=sample_project_info.id,
            regenerate=True,
            content_types=[ContentType.BLOG_POST],
            max_content_pieces=1,
        )

        # Mock existing strategy (should be ignored due to regenerate=True)
        mock_strategy_service.qdrant.get_strategy_by_id.return_value = sample_marketing_strategy
        mock_strategy_service.get_project_info = AsyncMock(return_value=sample_project_info)

        # Act
        response = await mock_strategy_service.generate_strategy(request)

        # Assert
        assert response.status == StrategyStatus.COMPLETED
        assert response.strategy is not None
        assert len(response.content_drafts) == 1

        # Verify new strategy was generated despite existing one
        mock_strategy_service.langchain.generate_strategy.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_strategy_by_id(
        self,
        mock_strategy_service: StrategyService,
        sample_marketing_strategy,
    ):
        """Test getting strategy by ID."""
        # Arrange
        strategy_id = sample_marketing_strategy.id
        mock_strategy_service.qdrant.get_strategy_by_id.return_value = sample_marketing_strategy

        # Act
        result = await mock_strategy_service.get_strategy_by_id(strategy_id)

        # Assert
        assert result == sample_marketing_strategy
        mock_strategy_service.qdrant.get_strategy_by_id.assert_called_once_with(strategy_id)

    @pytest.mark.asyncio
    async def test_get_content_drafts_by_strategy(
        self,
        mock_strategy_service: StrategyService,
        sample_content_draft,
    ):
        """Test getting content drafts by strategy."""
        # Arrange
        strategy_id = sample_content_draft.strategy_id
        mock_strategy_service.qdrant.get_content_drafts_by_strategy.return_value = [sample_content_draft]

        # Act
        result = await mock_strategy_service.get_content_drafts_by_strategy(strategy_id)

        # Assert
        assert len(result) == 1
        assert result[0] == sample_content_draft
        mock_strategy_service.qdrant.get_content_drafts_by_strategy.assert_called_once_with(strategy_id)

    @pytest.mark.asyncio
    async def test_search_similar_strategies(
        self,
        mock_strategy_service: StrategyService,
        sample_marketing_strategy,
    ):
        """Test searching for similar strategies."""
        # Arrange
        query = "technology marketing strategy"
        project_id = sample_marketing_strategy.project_id
        mock_strategy_service.qdrant.search_similar_strategies.return_value = [
            {"strategy": sample_marketing_strategy, "score": 0.9}
        ]

        # Act
        result = await mock_strategy_service.search_similar_strategies(query, project_id, 5)

        # Assert
        assert len(result) == 1
        assert result[0] == sample_marketing_strategy
        mock_strategy_service.langchain.generate_embedding.assert_called_once_with(query)
        mock_strategy_service.qdrant.search_similar_strategies.assert_called_once()

    @pytest.mark.asyncio
    async def test_search_similar_content(
        self,
        mock_strategy_service: StrategyService,
        sample_content_draft,
    ):
        """Test searching for similar content."""
        # Arrange
        query = "blog post about technology"
        content_type = ContentType.BLOG_POST
        mock_strategy_service.qdrant.search_similar_content.return_value = [
            {"draft": sample_content_draft, "score": 0.8}
        ]

        # Act
        result = await mock_strategy_service.search_similar_content(
            query, None, content_type, 10
        )

        # Assert
        assert len(result) == 1
        assert result[0] == sample_content_draft
        mock_strategy_service.langchain.generate_embedding.assert_called_once_with(query)
        mock_strategy_service.qdrant.search_similar_content.assert_called_once()

    @pytest.mark.asyncio
    async def test_delete_strategy(
        self,
        mock_strategy_service: StrategyService,
    ):
        """Test deleting a strategy."""
        # Arrange
        strategy_id = uuid4()
        mock_strategy_service.qdrant.delete_strategy.return_value = True

        # Act
        result = await mock_strategy_service.delete_strategy(strategy_id)

        # Assert
        assert result is True
        mock_strategy_service.qdrant.delete_strategy.assert_called_once_with(strategy_id)

    @pytest.mark.asyncio
    async def test_get_project_info_success(
        self,
        mock_strategy_service: StrategyService,
        sample_project_info,
    ):
        """Test successful project info retrieval."""
        # Arrange
        project_id = sample_project_info.id

        with patch("httpx.AsyncClient") as mock_client:
            mock_response = AsyncMock()
            mock_response.status_code = 200
            mock_response.json.return_value = {
                "id": str(sample_project_info.id),
                "name": sample_project_info.name,
                "description": sample_project_info.description,
                "industry": sample_project_info.industry,
                "target_audience": sample_project_info.target_audience,
                "brand_voice": sample_project_info.brand_voice,
                "goals": sample_project_info.goals,
            }
            mock_client.return_value.__aenter__.return_value.get.return_value = mock_response

            # Act
            result = await mock_strategy_service.get_project_info(project_id)

            # Assert
            assert result is not None
            assert result.id == sample_project_info.id
            assert result.name == sample_project_info.name

    @pytest.mark.asyncio
    async def test_get_project_info_not_found(
        self,
        mock_strategy_service: StrategyService,
    ):
        """Test project info retrieval when project not found."""
        # Arrange
        project_id = uuid4()

        with patch("httpx.AsyncClient") as mock_client:
            mock_response = AsyncMock()
            mock_response.status_code = 404
            mock_client.return_value.__aenter__.return_value.get.return_value = mock_response

            # Act
            result = await mock_strategy_service.get_project_info(project_id)

            # Assert
            assert result is None

    @pytest.mark.asyncio
    async def test_generate_and_store_content_success(
        self,
        mock_strategy_service: StrategyService,
        sample_marketing_strategy,
    ):
        """Test successful content generation and storage."""
        # Arrange
        content_type = ContentType.BLOG_POST

        # Act
        result = await mock_strategy_service._generate_and_store_content(
            sample_marketing_strategy, content_type
        )

        # Assert
        assert result is not None
        assert result.content_type == content_type
        assert result.strategy_id == sample_marketing_strategy.id
        mock_strategy_service.langchain.generate_content_draft.assert_called_once()
        mock_strategy_service.qdrant.store_content_draft.assert_called_once()

    @pytest.mark.asyncio
    async def test_publish_events_success(
        self,
        mock_strategy_service: StrategyService,
        sample_marketing_strategy,
        sample_content_draft,
    ):
        """Test successful event publishing."""
        # Arrange
        content_drafts = [sample_content_draft]

        # Act
        await mock_strategy_service._publish_events(sample_marketing_strategy, content_drafts)

        # Assert
        mock_strategy_service.nats.publish_plan_created.assert_called_once()
        mock_strategy_service.nats.publish_asset_draft_created.assert_called_once() 
"""Pytest configuration and fixtures for the orchestrator service tests."""

import asyncio
from typing import AsyncGenerator, Generator
from unittest.mock import AsyncMock, MagicMock
from uuid import UUID, uuid4

import pytest
import pytest_asyncio
from fastapi.testclient import TestClient

from orchestrator.main import app
from orchestrator.models import (
    ContentDraft,
    ContentType,
    MarketingStrategy,
    ProjectInfo,
    StrategyPhase,
    StrategyStatus,
)
from orchestrator.services.langchain_service import LangChainService
from orchestrator.services.nats_service import NATSService
from orchestrator.services.qdrant_service import QdrantService
from orchestrator.services.strategy_service import StrategyService


@pytest.fixture(scope="session")
def event_loop() -> Generator[asyncio.AbstractEventLoop, None, None]:
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
def client() -> TestClient:
    """Create a test client for the FastAPI application."""
    return TestClient(app)


@pytest.fixture
def sample_project_id() -> UUID:
    """Sample project ID for testing."""
    return uuid4()


@pytest.fixture
def sample_strategy_id() -> UUID:
    """Sample strategy ID for testing."""
    return uuid4()


@pytest.fixture
def sample_project_info(sample_project_id: UUID) -> ProjectInfo:
    """Sample project info for testing."""
    return ProjectInfo(
        id=sample_project_id,
        name="Test Project",
        description="A test project for unit testing",
        industry="Technology",
        target_audience="Tech professionals",
        brand_voice="Professional and innovative",
        goals=["Increase awareness", "Generate leads"],
    )


@pytest.fixture
def sample_strategy_phase() -> StrategyPhase:
    """Sample strategy phase for testing."""
    return StrategyPhase(
        phase_number=1,
        name="Foundation Phase",
        duration_days=30,
        objectives=["Build brand awareness", "Establish online presence"],
        key_activities=["Content creation", "Social media setup"],
        success_metrics=["Reach", "Engagement"],
        content_focus=[ContentType.BLOG_POST, ContentType.SOCIAL_MEDIA],
    )


@pytest.fixture
def sample_marketing_strategy(
    sample_project_id: UUID, sample_strategy_id: UUID, sample_strategy_phase: StrategyPhase
) -> MarketingStrategy:
    """Sample marketing strategy for testing."""
    return MarketingStrategy(
        id=sample_strategy_id,
        project_id=sample_project_id,
        title="Test Marketing Strategy",
        description="A comprehensive test marketing strategy",
        target_audience="Tech professionals aged 25-45",
        brand_positioning="Innovative technology solutions provider",
        key_messages=["Innovation", "Reliability", "Excellence"],
        phases=[sample_strategy_phase],
        content_calendar_overview="90-day content calendar with weekly themes",
        budget_considerations=["Content creation", "Advertising", "Tools"],
        success_metrics=["ROI", "Lead generation", "Brand awareness"],
        status=StrategyStatus.COMPLETED,
    )


@pytest.fixture
def sample_content_draft(
    sample_project_id: UUID, sample_strategy_id: UUID
) -> ContentDraft:
    """Sample content draft for testing."""
    return ContentDraft(
        project_id=sample_project_id,
        strategy_id=sample_strategy_id,
        content_type=ContentType.BLOG_POST,
        title="Test Blog Post",
        content="This is a test blog post content for unit testing purposes.",
        metadata={"generated_by": "test", "content_type": "blog_post"},
    )


@pytest.fixture
def mock_langchain_service() -> AsyncMock:
    """Mock LangChain service for testing."""
    mock = AsyncMock(spec=LangChainService)
    
    # Mock strategy generation
    async def mock_generate_strategy(project_info: ProjectInfo) -> MarketingStrategy:
        return MarketingStrategy(
            project_id=project_info.id,
            title=f"Generated Strategy for {project_info.name}",
            description="AI-generated marketing strategy",
            target_audience="Target audience",
            brand_positioning="Brand positioning",
            key_messages=["Message 1", "Message 2"],
            phases=[
                StrategyPhase(
                    phase_number=1,
                    name="Phase 1",
                    duration_days=30,
                    objectives=["Objective 1"],
                    key_activities=["Activity 1"],
                    success_metrics=["Metric 1"],
                    content_focus=[ContentType.BLOG_POST],
                )
            ],
            content_calendar_overview="Content calendar",
            budget_considerations=["Budget item 1"],
            success_metrics=["Success metric 1"],
            status=StrategyStatus.COMPLETED,
        )
    
    mock.generate_strategy.side_effect = mock_generate_strategy
    
    # Mock content generation
    async def mock_generate_content_draft(
        content_type: ContentType, strategy: MarketingStrategy, additional_context=None
    ) -> ContentDraft:
        return ContentDraft(
            project_id=strategy.project_id,
            strategy_id=strategy.id,
            content_type=content_type,
            title=f"Generated {content_type.value}",
            content=f"Generated content for {content_type.value}",
            metadata={"generated_by": "mock"},
        )
    
    mock.generate_content_draft.side_effect = mock_generate_content_draft
    
    # Mock embedding generation
    mock.generate_embedding.return_value = [0.1] * 1536
    mock.generate_strategy_embedding.return_value = [0.1] * 1536
    mock.generate_content_embedding.return_value = [0.1] * 1536
    
    return mock


@pytest.fixture
def mock_qdrant_service() -> AsyncMock:
    """Mock Qdrant service for testing."""
    mock = AsyncMock(spec=QdrantService)
    
    # Mock initialization
    mock.initialize.return_value = None
    
    # Mock storage operations
    mock.store_strategy.return_value = True
    mock.store_content_draft.return_value = True
    
    # Mock retrieval operations
    mock.get_strategy_by_id.return_value = None
    mock.get_content_drafts_by_strategy.return_value = []
    
    # Mock search operations
    mock.search_similar_strategies.return_value = []
    mock.search_similar_content.return_value = []
    
    # Mock deletion
    mock.delete_strategy.return_value = True
    
    # Mock health check
    mock.health_check.return_value = {"status": "healthy"}
    
    return mock


@pytest.fixture
def mock_nats_service() -> AsyncMock:
    """Mock NATS service for testing."""
    mock = AsyncMock(spec=NATSService)
    
    # Mock connection operations
    mock.connect.return_value = None
    mock.disconnect.return_value = None
    
    # Mock publishing
    mock.publish_event.return_value = True
    mock.publish_asset_draft_created.return_value = True
    mock.publish_plan_created.return_value = True
    
    # Mock health check
    mock.health_check.return_value = {"status": "healthy"}
    
    return mock


@pytest.fixture
def mock_strategy_service(
    mock_langchain_service: AsyncMock,
    mock_qdrant_service: AsyncMock,
    mock_nats_service: AsyncMock,
) -> StrategyService:
    """Mock strategy service for testing."""
    return StrategyService(
        langchain_service=mock_langchain_service,
        qdrant_service=mock_qdrant_service,
        nats_service=mock_nats_service,
    )


@pytest.fixture
def mock_httpx_client() -> MagicMock:
    """Mock httpx client for testing external API calls."""
    mock = MagicMock()
    
    # Mock successful project fetch
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "id": str(uuid4()),
        "name": "Test Project",
        "description": "Test description",
        "industry": "Technology",
        "target_audience": "Tech professionals",
        "brand_voice": "Professional",
        "goals": ["Goal 1", "Goal 2"],
    }
    
    mock.get.return_value.__aenter__.return_value = mock_response
    
    return mock 
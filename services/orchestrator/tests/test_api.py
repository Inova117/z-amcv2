"""Unit tests for the API endpoints."""

import pytest
from unittest.mock import patch
from uuid import uuid4

from fastapi.testclient import TestClient

from orchestrator.models import (
    ContentType,
    GenerateStrategyRequest,
    StrategyStatus,
)


class TestAPIEndpoints:
    """Test cases for API endpoints."""

    def test_root_endpoint(self, client: TestClient):
        """Test the root endpoint."""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["service"] == "ZAMC AI Strategy Generator"
        assert data["version"] == "0.1.0"
        assert data["status"] == "running"

    @patch("orchestrator.api.dependencies.get_strategy_service")
    def test_generate_strategy_success(
        self,
        mock_get_service,
        client: TestClient,
        mock_strategy_service,
        sample_project_info,
        sample_marketing_strategy,
        sample_content_draft,
    ):
        """Test successful strategy generation endpoint."""
        # Arrange
        mock_get_service.return_value = mock_strategy_service
        
        # Mock the generate_strategy method
        from orchestrator.models import GenerateStrategyResponse
        mock_response = GenerateStrategyResponse(
            strategy_id=sample_marketing_strategy.id,
            project_id=sample_project_info.id,
            status=StrategyStatus.COMPLETED,
            message="Strategy generated successfully",
            strategy=sample_marketing_strategy,
            content_drafts=[sample_content_draft],
        )
        mock_strategy_service.generate_strategy.return_value = mock_response

        request_data = {
            "project_id": str(sample_project_info.id),
            "content_types": ["blog_post", "social_media"],
            "max_content_pieces": 2,
        }

        # Act
        response = client.post("/api/v1/generate-strategy", json=request_data)

        # Assert
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "completed"
        assert data["project_id"] == str(sample_project_info.id)
        assert data["strategy"] is not None
        assert len(data["content_drafts"]) == 1

    @patch("orchestrator.api.dependencies.get_strategy_service")
    def test_generate_strategy_invalid_request(
        self,
        mock_get_service,
        client: TestClient,
    ):
        """Test strategy generation with invalid request."""
        # Arrange
        request_data = {
            "project_id": "invalid-uuid",
        }

        # Act
        response = client.post("/api/v1/generate-strategy", json=request_data)

        # Assert
        assert response.status_code == 422  # Validation error

    @patch("orchestrator.api.dependencies.get_strategy_service")
    def test_get_strategy_success(
        self,
        mock_get_service,
        client: TestClient,
        mock_strategy_service,
        sample_marketing_strategy,
    ):
        """Test successful strategy retrieval."""
        # Arrange
        mock_get_service.return_value = mock_strategy_service
        mock_strategy_service.get_strategy_by_id.return_value = sample_marketing_strategy

        strategy_id = str(sample_marketing_strategy.id)

        # Act
        response = client.get(f"/api/v1/strategies/{strategy_id}")

        # Assert
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == strategy_id
        assert data["title"] == sample_marketing_strategy.title

    @patch("orchestrator.api.dependencies.get_strategy_service")
    def test_get_strategy_not_found(
        self,
        mock_get_service,
        client: TestClient,
        mock_strategy_service,
    ):
        """Test strategy retrieval when strategy not found."""
        # Arrange
        mock_get_service.return_value = mock_strategy_service
        mock_strategy_service.get_strategy_by_id.return_value = None

        strategy_id = str(uuid4())

        # Act
        response = client.get(f"/api/v1/strategies/{strategy_id}")

        # Assert
        assert response.status_code == 404
        data = response.json()
        assert data["error"] == "Strategy not found"

    @patch("orchestrator.api.dependencies.get_strategy_service")
    def test_get_content_drafts_success(
        self,
        mock_get_service,
        client: TestClient,
        mock_strategy_service,
        sample_marketing_strategy,
        sample_content_draft,
    ):
        """Test successful content drafts retrieval."""
        # Arrange
        mock_get_service.return_value = mock_strategy_service
        mock_strategy_service.get_strategy_by_id.return_value = sample_marketing_strategy
        mock_strategy_service.get_content_drafts_by_strategy.return_value = [sample_content_draft]

        strategy_id = str(sample_marketing_strategy.id)

        # Act
        response = client.get(f"/api/v1/strategies/{strategy_id}/content")

        # Assert
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["id"] == str(sample_content_draft.id)
        assert data[0]["title"] == sample_content_draft.title

    @patch("orchestrator.api.dependencies.get_strategy_service")
    def test_search_strategies_success(
        self,
        mock_get_service,
        client: TestClient,
        mock_strategy_service,
        sample_marketing_strategy,
    ):
        """Test successful strategy search."""
        # Arrange
        mock_get_service.return_value = mock_strategy_service
        mock_strategy_service.search_similar_strategies.return_value = [sample_marketing_strategy]

        # Act
        response = client.get("/api/v1/search/strategies?query=technology marketing")

        # Assert
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["id"] == str(sample_marketing_strategy.id)

    @patch("orchestrator.api.dependencies.get_strategy_service")
    def test_search_strategies_empty_query(
        self,
        mock_get_service,
        client: TestClient,
    ):
        """Test strategy search with empty query."""
        # Act
        response = client.get("/api/v1/search/strategies?query=")

        # Assert
        assert response.status_code == 400
        data = response.json()
        assert data["error"] == "Query cannot be empty"

    @patch("orchestrator.api.dependencies.get_strategy_service")
    def test_search_content_success(
        self,
        mock_get_service,
        client: TestClient,
        mock_strategy_service,
        sample_content_draft,
    ):
        """Test successful content search."""
        # Arrange
        mock_get_service.return_value = mock_strategy_service
        mock_strategy_service.search_similar_content.return_value = [sample_content_draft]

        # Act
        response = client.get(
            "/api/v1/search/content?query=blog post&content_type=blog_post"
        )

        # Assert
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["id"] == str(sample_content_draft.id)

    @patch("orchestrator.api.dependencies.get_strategy_service")
    def test_delete_strategy_success(
        self,
        mock_get_service,
        client: TestClient,
        mock_strategy_service,
        sample_marketing_strategy,
    ):
        """Test successful strategy deletion."""
        # Arrange
        mock_get_service.return_value = mock_strategy_service
        mock_strategy_service.get_strategy_by_id.return_value = sample_marketing_strategy
        mock_strategy_service.delete_strategy.return_value = True

        strategy_id = str(sample_marketing_strategy.id)

        # Act
        response = client.delete(f"/api/v1/strategies/{strategy_id}")

        # Assert
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Strategy deleted successfully"

    @patch("orchestrator.api.dependencies.get_strategy_service")
    def test_delete_strategy_not_found(
        self,
        mock_get_service,
        client: TestClient,
        mock_strategy_service,
    ):
        """Test strategy deletion when strategy not found."""
        # Arrange
        mock_get_service.return_value = mock_strategy_service
        mock_strategy_service.get_strategy_by_id.return_value = None

        strategy_id = str(uuid4())

        # Act
        response = client.delete(f"/api/v1/strategies/{strategy_id}")

        # Assert
        assert response.status_code == 404
        data = response.json()
        assert data["error"] == "Strategy not found"

    @patch("orchestrator.api.dependencies.get_strategy_service")
    def test_health_check_healthy(
        self,
        mock_get_service,
        client: TestClient,
        mock_strategy_service,
    ):
        """Test health check when all services are healthy."""
        # Arrange
        mock_get_service.return_value = mock_strategy_service
        mock_strategy_service.qdrant.health_check.return_value = {"status": "healthy"}
        mock_strategy_service.nats.health_check.return_value = {"status": "healthy"}

        # Act
        response = client.get("/api/v1/health")

        # Assert
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["services"]["qdrant"] == "healthy"
        assert data["services"]["nats"] == "healthy"
        assert data["services"]["langchain"] == "healthy"

    @patch("orchestrator.api.dependencies.get_strategy_service")
    def test_health_check_degraded(
        self,
        mock_get_service,
        client: TestClient,
        mock_strategy_service,
    ):
        """Test health check when some services are unhealthy."""
        # Arrange
        mock_get_service.return_value = mock_strategy_service
        mock_strategy_service.qdrant.health_check.return_value = {"status": "unhealthy"}
        mock_strategy_service.nats.health_check.return_value = {"status": "healthy"}

        # Act
        response = client.get("/api/v1/health")

        # Assert
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "degraded"
        assert data["services"]["qdrant"] == "unhealthy"
        assert data["services"]["nats"] == "healthy" 
"""Configuration management for the orchestrator service."""

from typing import List, Optional

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Server Configuration
    host: str = Field(default="0.0.0.0", description="Server host")
    port: int = Field(default=8001, description="Server port")
    debug: bool = Field(default=False, description="Debug mode")
    log_level: str = Field(default="INFO", description="Logging level")

    # OpenAI Configuration
    openai_api_key: str = Field(..., description="OpenAI API key")
    openai_model: str = Field(
        default="gpt-4-turbo-preview", description="OpenAI model to use"
    )
    openai_temperature: float = Field(
        default=0.7, ge=0.0, le=2.0, description="OpenAI temperature"
    )
    openai_max_tokens: int = Field(
        default=4000, ge=1, le=8000, description="OpenAI max tokens"
    )

    # Qdrant Configuration
    qdrant_url: str = Field(
        default="http://localhost:6333", description="Qdrant server URL"
    )
    qdrant_api_key: Optional[str] = Field(default=None, description="Qdrant API key")
    qdrant_collection_name: str = Field(
        default="zamc_strategies", description="Qdrant collection name"
    )
    qdrant_vector_size: int = Field(
        default=1536, description="Vector embedding size"
    )

    # NATS Configuration
    nats_url: str = Field(
        default="nats://localhost:4222", description="NATS server URL"
    )
    nats_subject_prefix: str = Field(
        default="zamc", description="NATS subject prefix"
    )

    # External Services
    bff_url: str = Field(
        default="http://localhost:8080", description="BFF service URL"
    )
    bff_api_key: Optional[str] = Field(default=None, description="BFF API key")

    # Strategy Generation Configuration
    strategy_duration_days: int = Field(
        default=90, ge=1, le=365, description="Strategy duration in days"
    )
    max_content_pieces: int = Field(
        default=50, ge=1, le=200, description="Maximum content pieces to generate"
    )
    content_types: List[str] = Field(
        default=[
            "blog_post",
            "social_media",
            "email_campaign",
            "video_script",
            "infographic",
        ],
        description="Available content types",
    )

    # Rate Limiting
    rate_limit_requests: int = Field(
        default=100, ge=1, description="Rate limit requests per window"
    )
    rate_limit_window: int = Field(
        default=3600, ge=1, description="Rate limit window in seconds"
    )

    # Monitoring
    enable_metrics: bool = Field(default=True, description="Enable metrics collection")
    metrics_port: int = Field(default=8002, description="Metrics server port")

    # Environment
    environment: str = Field(default="development", description="Environment name")

    @property
    def is_development(self) -> bool:
        """Check if running in development mode."""
        return self.environment.lower() in ("development", "dev", "local")

    @property
    def is_production(self) -> bool:
        """Check if running in production mode."""
        return self.environment.lower() in ("production", "prod")


# Global settings instance
settings = Settings() 
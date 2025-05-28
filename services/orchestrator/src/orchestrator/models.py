"""Pydantic models for the orchestrator service."""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


class ContentType(str, Enum):
    """Available content types for generation."""

    BLOG_POST = "blog_post"
    SOCIAL_MEDIA = "social_media"
    EMAIL_CAMPAIGN = "email_campaign"
    VIDEO_SCRIPT = "video_script"
    INFOGRAPHIC = "infographic"


class StrategyStatus(str, Enum):
    """Strategy generation status."""

    PENDING = "pending"
    GENERATING = "generating"
    COMPLETED = "completed"
    FAILED = "failed"


class ContentStatus(str, Enum):
    """Content draft status."""

    DRAFT = "draft"
    REVIEW = "review"
    APPROVED = "approved"
    REJECTED = "rejected"


class ProjectInfo(BaseModel):
    """Project information from BFF."""

    id: UUID
    name: str
    description: Optional[str] = None
    industry: Optional[str] = None
    target_audience: Optional[str] = None
    brand_voice: Optional[str] = None
    goals: Optional[List[str]] = None


class GenerateStrategyRequest(BaseModel):
    """Request model for strategy generation."""

    project_id: UUID = Field(..., description="Project ID to generate strategy for")
    regenerate: bool = Field(
        default=False, description="Force regeneration of existing strategy"
    )
    content_types: Optional[List[ContentType]] = Field(
        default=None, description="Specific content types to generate"
    )
    max_content_pieces: Optional[int] = Field(
        default=None, ge=1, le=200, description="Maximum content pieces to generate"
    )


class ContentDraft(BaseModel):
    """Content draft model."""

    id: UUID = Field(default_factory=uuid4)
    project_id: UUID
    strategy_id: UUID
    content_type: ContentType
    title: str
    content: str
    metadata: Dict[str, Any] = Field(default_factory=dict)
    status: ContentStatus = ContentStatus.DRAFT
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        """Pydantic configuration."""

        json_encoders = {datetime: lambda v: v.isoformat()}


class StrategyPhase(BaseModel):
    """A phase within the 90-day strategy."""

    phase_number: int = Field(..., ge=1, le=3, description="Phase number (1-3)")
    name: str = Field(..., description="Phase name")
    duration_days: int = Field(..., ge=1, description="Duration in days")
    objectives: List[str] = Field(..., description="Phase objectives")
    key_activities: List[str] = Field(..., description="Key activities")
    success_metrics: List[str] = Field(..., description="Success metrics")
    content_focus: List[ContentType] = Field(..., description="Content focus areas")


class MarketingStrategy(BaseModel):
    """90-day marketing strategy model."""

    id: UUID = Field(default_factory=uuid4)
    project_id: UUID
    title: str
    description: str
    target_audience: str
    brand_positioning: str
    key_messages: List[str]
    phases: List[StrategyPhase]
    content_calendar_overview: str
    budget_considerations: List[str]
    success_metrics: List[str]
    status: StrategyStatus = StrategyStatus.PENDING
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        """Pydantic configuration."""

        json_encoders = {datetime: lambda v: v.isoformat()}


class GenerateStrategyResponse(BaseModel):
    """Response model for strategy generation."""

    strategy_id: UUID
    project_id: UUID
    status: StrategyStatus
    message: str
    strategy: Optional[MarketingStrategy] = None
    content_drafts: List[ContentDraft] = Field(default_factory=list)
    estimated_completion_time: Optional[int] = Field(
        default=None, description="Estimated completion time in seconds"
    )


class HealthCheck(BaseModel):
    """Health check response model."""

    status: str = "healthy"
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    version: str = "0.1.0"
    services: Dict[str, str] = Field(default_factory=dict)

    class Config:
        """Pydantic configuration."""

        json_encoders = {datetime: lambda v: v.isoformat()}


class ErrorResponse(BaseModel):
    """Error response model."""

    error: str
    detail: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        """Pydantic configuration."""

        json_encoders = {datetime: lambda v: v.isoformat()}


# Event models for NATS
class AssetDraftCreatedEvent(BaseModel):
    """Event emitted when an asset draft is created."""

    event_type: str = "asset.draft_created"
    project_id: UUID
    strategy_id: UUID
    draft_id: UUID
    content_type: ContentType
    title: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        """Pydantic configuration."""

        json_encoders = {datetime: lambda v: v.isoformat()}


class PlanCreatedEvent(BaseModel):
    """Event emitted when a marketing plan is created."""

    event_type: str = "plan.created"
    project_id: UUID
    strategy_id: UUID
    plan_title: str
    phases_count: int
    content_pieces_count: int
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        """Pydantic configuration."""

        json_encoders = {datetime: lambda v: v.isoformat()}


# Campaign Performance Models
class CampaignPlatform(str, Enum):
    """Supported campaign platforms."""

    GOOGLE_ADS = "google_ads"
    META = "meta"
    LINKEDIN = "linkedin"
    TWITTER = "twitter"


class CampaignMetrics(BaseModel):
    """Campaign performance metrics."""

    campaign_id: str
    campaign_name: str
    platform: CampaignPlatform
    impressions: int = 0
    clicks: int = 0
    spend: float = 0.0
    conversions: int = 0
    revenue: float = 0.0
    ctr: float = 0.0  # Click-through rate
    cpc: float = 0.0  # Cost per click
    cpm: float = 0.0  # Cost per mille
    roas: float = 0.0  # Return on ad spend
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    date: str = Field(default_factory=lambda: datetime.utcnow().strftime("%Y-%m-%d"))

    class Config:
        """Pydantic configuration."""

        json_encoders = {datetime: lambda v: v.isoformat()}


class CampaignPerformanceAlert(BaseModel):
    """Campaign performance alert."""

    alert_id: UUID = Field(default_factory=uuid4)
    campaign_id: str
    alert_type: str  # "budget_exceeded", "low_performance", "high_performance", etc.
    severity: str  # "low", "medium", "high", "critical"
    message: str
    threshold: Optional[float] = None
    current_value: Optional[float] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        """Pydantic configuration."""

        json_encoders = {datetime: lambda v: v.isoformat()}


# Campaign Performance Events
class CampaignMetricsUpdatedEvent(BaseModel):
    """Event emitted when campaign metrics are updated."""

    event_type: str = "campaign.metrics_updated"
    project_id: UUID
    campaign_id: str
    metrics: CampaignMetrics
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        """Pydantic configuration."""

        json_encoders = {datetime: lambda v: v.isoformat()}


class CampaignPerformanceAlertEvent(BaseModel):
    """Event emitted when a campaign performance alert is triggered."""

    event_type: str = "campaign.performance_alert"
    project_id: UUID
    alert: CampaignPerformanceAlert
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        """Pydantic configuration."""

        json_encoders = {datetime: lambda v: v.isoformat()}


class CampaignBudgetExceededEvent(BaseModel):
    """Event emitted when campaign budget is exceeded."""

    event_type: str = "campaign.budget_exceeded"
    project_id: UUID
    campaign_id: str
    budget_limit: float
    current_spend: float
    percentage_exceeded: float
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        """Pydantic configuration."""

        json_encoders = {datetime: lambda v: v.isoformat()}


class CampaignPerformanceThresholdEvent(BaseModel):
    """Event emitted when campaign performance crosses a threshold."""

    event_type: str = "campaign.performance_threshold"
    project_id: UUID
    campaign_id: str
    metric_name: str  # "roas", "ctr", "cpc", etc.
    threshold_type: str  # "above", "below"
    threshold_value: float
    current_value: float
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        """Pydantic configuration."""

        json_encoders = {datetime: lambda v: v.isoformat()} 
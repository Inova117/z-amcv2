package models

import (
	"time"

	"github.com/google/uuid"
)

// AssetStatus represents the status of an asset
type AssetStatus string

const (
	AssetStatusDraft     AssetStatus = "draft"
	AssetStatusReview    AssetStatus = "review"
	AssetStatusApproved  AssetStatus = "approved"
	AssetStatusRejected  AssetStatus = "rejected"
	AssetStatusDeployed  AssetStatus = "deployed"
	AssetStatusFailed    AssetStatus = "failed"
)

// Platform represents the advertising platform
type Platform string

const (
	PlatformGoogleAds Platform = "google_ads"
	PlatformMeta      Platform = "meta"
)

// ContentType represents the type of content
type ContentType string

const (
	ContentTypeBlogPost      ContentType = "blog_post"
	ContentTypeSocialMedia   ContentType = "social_media"
	ContentTypeEmailCampaign ContentType = "email_campaign"
	ContentTypeVideoScript   ContentType = "video_script"
	ContentTypeInfographic   ContentType = "infographic"
)

// AssetStatusChangedEvent represents the NATS event for asset status changes
type AssetStatusChangedEvent struct {
	EventType   string      `json:"event_type"`
	AssetID     uuid.UUID   `json:"asset_id"`
	ProjectID   uuid.UUID   `json:"project_id"`
	StrategyID  uuid.UUID   `json:"strategy_id"`
	Status      AssetStatus `json:"status"`
	PrevStatus  AssetStatus `json:"prev_status"`
	ContentType ContentType `json:"content_type"`
	Title       string      `json:"title"`
	Content     string      `json:"content"`
	Metadata    Metadata    `json:"metadata"`
	Timestamp   time.Time   `json:"timestamp"`
}

// Metadata holds additional asset information
type Metadata struct {
	Platforms       []Platform `json:"platforms"`
	TargetAudience  string     `json:"target_audience"`
	Budget          float64    `json:"budget"`
	CampaignType    string     `json:"campaign_type"`
	Keywords        []string   `json:"keywords"`
	Demographics    Demographics `json:"demographics"`
	CreativeSpecs   CreativeSpecs `json:"creative_specs"`
}

// Demographics holds targeting demographics
type Demographics struct {
	AgeMin      int      `json:"age_min"`
	AgeMax      int      `json:"age_max"`
	Genders     []string `json:"genders"`
	Locations   []string `json:"locations"`
	Interests   []string `json:"interests"`
	Behaviors   []string `json:"behaviors"`
}

// CreativeSpecs holds creative specifications
type CreativeSpecs struct {
	ImageURL     string            `json:"image_url"`
	VideoURL     string            `json:"video_url"`
	Headline     string            `json:"headline"`
	Description  string            `json:"description"`
	CallToAction string            `json:"call_to_action"`
	LandingURL   string            `json:"landing_url"`
	Dimensions   map[string]string `json:"dimensions"`
}

// DeploymentRequest represents a deployment request
type DeploymentRequest struct {
	AssetID     uuid.UUID   `json:"asset_id"`
	ProjectID   uuid.UUID   `json:"project_id"`
	StrategyID  uuid.UUID   `json:"strategy_id"`
	Platform    Platform    `json:"platform"`
	ContentType ContentType `json:"content_type"`
	Title       string      `json:"title"`
	Content     string      `json:"content"`
	Metadata    Metadata    `json:"metadata"`
	CreatedAt   time.Time   `json:"created_at"`
}

// DeploymentResult represents the result of a deployment
type DeploymentResult struct {
	AssetID       uuid.UUID       `json:"asset_id"`
	Platform      Platform        `json:"platform"`
	Status        DeploymentStatus `json:"status"`
	PlatformID    string          `json:"platform_id"`
	PlatformURL   string          `json:"platform_url"`
	Error         string          `json:"error,omitempty"`
	DeployedAt    time.Time       `json:"deployed_at"`
	Metrics       DeploymentMetrics `json:"metrics"`
}

// DeploymentStatus represents the status of a deployment
type DeploymentStatus string

const (
	DeploymentStatusPending   DeploymentStatus = "pending"
	DeploymentStatusRunning   DeploymentStatus = "running"
	DeploymentStatusSuccess   DeploymentStatus = "success"
	DeploymentStatusFailed    DeploymentStatus = "failed"
	DeploymentStatusCancelled DeploymentStatus = "cancelled"
)

// DeploymentMetrics holds deployment metrics
type DeploymentMetrics struct {
	Duration    time.Duration `json:"duration"`
	RetryCount  int           `json:"retry_count"`
	DataSent    int64         `json:"data_sent"`
	DataReceived int64        `json:"data_received"`
}

// GoogleAdsDeployment represents a Google Ads specific deployment
type GoogleAdsDeployment struct {
	CampaignID    string `json:"campaign_id"`
	AdGroupID     string `json:"ad_group_id"`
	AdID          string `json:"ad_id"`
	KeywordIDs    []string `json:"keyword_ids"`
	ExtensionIDs  []string `json:"extension_ids"`
}

// MetaDeployment represents a Meta specific deployment
type MetaDeployment struct {
	CampaignID  string `json:"campaign_id"`
	AdSetID     string `json:"ad_set_id"`
	AdID        string `json:"ad_id"`
	CreativeID  string `json:"creative_id"`
	AudienceID  string `json:"audience_id"`
}

// HealthStatus represents the health status of the service
type HealthStatus struct {
	Status    string            `json:"status"`
	Timestamp time.Time         `json:"timestamp"`
	Version   string            `json:"version"`
	Services  map[string]string `json:"services"`
	Uptime    time.Duration     `json:"uptime"`
}

// ErrorResponse represents an error response
type ErrorResponse struct {
	Error     string    `json:"error"`
	Code      string    `json:"code"`
	Details   string    `json:"details,omitempty"`
	Timestamp time.Time `json:"timestamp"`
}

// DeploymentStatusChangedEvent represents the event emitted after deployment
type DeploymentStatusChangedEvent struct {
	EventType        string           `json:"event_type"`
	AssetID          uuid.UUID        `json:"asset_id"`
	ProjectID        uuid.UUID        `json:"project_id"`
	StrategyID       uuid.UUID        `json:"strategy_id"`
	Platform         Platform         `json:"platform"`
	Status           AssetStatus      `json:"status"`
	PrevStatus       AssetStatus      `json:"prev_status"`
	DeploymentResult DeploymentResult `json:"deployment_result"`
	Timestamp        time.Time        `json:"timestamp"`
} 
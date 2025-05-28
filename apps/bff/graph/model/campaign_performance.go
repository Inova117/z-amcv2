package model

import "time"

// CampaignPlatform represents the advertising platform
type CampaignPlatform string

const (
	CampaignPlatformGoogleAds CampaignPlatform = "GOOGLE_ADS"
	CampaignPlatformMeta      CampaignPlatform = "META"
	CampaignPlatformLinkedin  CampaignPlatform = "LINKEDIN"
	CampaignPlatformTwitter   CampaignPlatform = "TWITTER"
)

// AlertSeverity represents the severity level of an alert
type AlertSeverity string

const (
	AlertSeverityLow      AlertSeverity = "LOW"
	AlertSeverityMedium   AlertSeverity = "MEDIUM"
	AlertSeverityHigh     AlertSeverity = "HIGH"
	AlertSeverityCritical AlertSeverity = "CRITICAL"
)

// CampaignMetrics represents campaign performance metrics
type CampaignMetrics struct {
	CampaignID   string           `json:"campaignId"`
	CampaignName string           `json:"campaignName"`
	Platform     CampaignPlatform `json:"platform"`
	Impressions  int              `json:"impressions"`
	Clicks       int              `json:"clicks"`
	Spend        float64          `json:"spend"`
	Conversions  int              `json:"conversions"`
	Revenue      float64          `json:"revenue"`
	CTR          float64          `json:"ctr"`
	CPC          float64          `json:"cpc"`
	CPM          float64          `json:"cpm"`
	ROAS         float64          `json:"roas"`
	Timestamp    time.Time        `json:"timestamp"`
	Date         string           `json:"date"`
}

// CampaignMetricsUpdate represents a campaign metrics update event
type CampaignMetricsUpdate struct {
	ProjectID  string           `json:"projectId"`
	CampaignID string           `json:"campaignId"`
	Metrics    *CampaignMetrics `json:"metrics"`
	Timestamp  time.Time        `json:"timestamp"`
}

// CampaignPerformanceAlert represents a campaign performance alert
type CampaignPerformanceAlert struct {
	AlertID      string        `json:"alertId"`
	ProjectID    string        `json:"projectId"`
	CampaignID   string        `json:"campaignId"`
	AlertType    string        `json:"alertType"`
	Severity     AlertSeverity `json:"severity"`
	Message      string        `json:"message"`
	Threshold    *float64      `json:"threshold,omitempty"`
	CurrentValue *float64      `json:"currentValue,omitempty"`
	Timestamp    time.Time     `json:"timestamp"`
} 
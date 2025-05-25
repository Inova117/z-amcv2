package googleads

import (
	"context"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/sirupsen/logrus"
	"google.golang.org/api/googleads/v16"
	"google.golang.org/api/option"

	"github.com/zamc/connectors/internal/config"
	"github.com/zamc/connectors/internal/models"
)

// Client represents a Google Ads API client
type Client struct {
	service    *googleads.Service
	config     *config.GoogleAdsConfig
	logger     *logrus.Logger
	customerID string
}

// NewClient creates a new Google Ads client
func NewClient(cfg *config.GoogleAdsConfig, logger *logrus.Logger) (*Client, error) {
	ctx := context.Background()

	// Create OAuth2 config
	oauth2Config := &oauth2Config{
		ClientID:     cfg.ClientID,
		ClientSecret: cfg.ClientSecret,
		RefreshToken: cfg.RefreshToken,
	}

	// Create token source
	tokenSource := oauth2Config.TokenSource(ctx)

	// Create Google Ads service
	service, err := googleads.NewService(ctx, option.WithTokenSource(tokenSource))
	if err != nil {
		return nil, fmt.Errorf("failed to create Google Ads service: %w", err)
	}

	// Clean customer ID (remove dashes)
	customerID := strings.ReplaceAll(cfg.CustomerID, "-", "")

	logger.WithField("customer_id", customerID).Info("Google Ads client initialized")

	return &Client{
		service:    service,
		config:     cfg,
		logger:     logger,
		customerID: customerID,
	}, nil
}

// DeployAsset deploys an asset to Google Ads
func (c *Client) DeployAsset(ctx context.Context, request *models.DeploymentRequest) (*models.DeploymentResult, error) {
	startTime := time.Now()
	logger := c.logger.WithFields(logrus.Fields{
		"asset_id":     request.AssetID,
		"content_type": request.ContentType,
		"platform":     models.PlatformGoogleAds,
	})

	logger.Info("Starting Google Ads deployment")

	result := &models.DeploymentResult{
		AssetID:    request.AssetID,
		Platform:   models.PlatformGoogleAds,
		Status:     models.DeploymentStatusRunning,
		DeployedAt: time.Now(),
		Metrics: models.DeploymentMetrics{
			RetryCount: 0,
		},
	}

	// Deploy based on content type
	var err error
	switch request.ContentType {
	case models.ContentTypeSocialMedia:
		err = c.deployTextAd(ctx, request, result)
	case models.ContentTypeBlogPost:
		err = c.deployResponsiveSearchAd(ctx, request, result)
	case models.ContentTypeVideoScript:
		err = c.deployVideoAd(ctx, request, result)
	default:
		err = c.deployTextAd(ctx, request, result) // Default to text ad
	}

	// Update metrics
	result.Metrics.Duration = time.Since(startTime)

	if err != nil {
		result.Status = models.DeploymentStatusFailed
		result.Error = err.Error()
		logger.WithError(err).Error("Google Ads deployment failed")
		return result, err
	}

	result.Status = models.DeploymentStatusSuccess
	logger.WithFields(logrus.Fields{
		"platform_id":  result.PlatformID,
		"platform_url": result.PlatformURL,
		"duration":     result.Metrics.Duration,
	}).Info("Google Ads deployment successful")

	return result, nil
}

// deployTextAd deploys a text ad to Google Ads
func (c *Client) deployTextAd(ctx context.Context, request *models.DeploymentRequest, result *models.DeploymentResult) error {
	// Create campaign if needed
	campaignID, err := c.createOrGetCampaign(ctx, request)
	if err != nil {
		return fmt.Errorf("failed to create/get campaign: %w", err)
	}

	// Create ad group if needed
	adGroupID, err := c.createOrGetAdGroup(ctx, campaignID, request)
	if err != nil {
		return fmt.Errorf("failed to create/get ad group: %w", err)
	}

	// Create text ad
	adID, err := c.createTextAd(ctx, adGroupID, request)
	if err != nil {
		return fmt.Errorf("failed to create text ad: %w", err)
	}

	// Add keywords
	keywordIDs, err := c.addKeywords(ctx, adGroupID, request.Metadata.Keywords)
	if err != nil {
		c.logger.WithError(err).Warn("Failed to add keywords, continuing without them")
	}

	// Set result data
	result.PlatformID = adID
	result.PlatformURL = fmt.Sprintf("https://ads.google.com/aw/ads?campaignId=%s&adGroupId=%s", campaignID, adGroupID)

	// Store deployment details in metadata
	deployment := models.GoogleAdsDeployment{
		CampaignID: campaignID,
		AdGroupID:  adGroupID,
		AdID:       adID,
		KeywordIDs: keywordIDs,
	}

	// You would typically store this in a database
	c.logger.WithField("deployment", deployment).Debug("Google Ads deployment details")

	return nil
}

// deployResponsiveSearchAd deploys a responsive search ad
func (c *Client) deployResponsiveSearchAd(ctx context.Context, request *models.DeploymentRequest, result *models.DeploymentResult) error {
	// Similar to text ad but with responsive search ad format
	campaignID, err := c.createOrGetCampaign(ctx, request)
	if err != nil {
		return fmt.Errorf("failed to create/get campaign: %w", err)
	}

	adGroupID, err := c.createOrGetAdGroup(ctx, campaignID, request)
	if err != nil {
		return fmt.Errorf("failed to create/get ad group: %w", err)
	}

	adID, err := c.createResponsiveSearchAd(ctx, adGroupID, request)
	if err != nil {
		return fmt.Errorf("failed to create responsive search ad: %w", err)
	}

	result.PlatformID = adID
	result.PlatformURL = fmt.Sprintf("https://ads.google.com/aw/ads?campaignId=%s&adGroupId=%s", campaignID, adGroupID)

	return nil
}

// deployVideoAd deploys a video ad
func (c *Client) deployVideoAd(ctx context.Context, request *models.DeploymentRequest, result *models.DeploymentResult) error {
	// Video ads require YouTube integration
	campaignID, err := c.createOrGetVideoCampaign(ctx, request)
	if err != nil {
		return fmt.Errorf("failed to create/get video campaign: %w", err)
	}

	adGroupID, err := c.createOrGetAdGroup(ctx, campaignID, request)
	if err != nil {
		return fmt.Errorf("failed to create/get ad group: %w", err)
	}

	adID, err := c.createVideoAd(ctx, adGroupID, request)
	if err != nil {
		return fmt.Errorf("failed to create video ad: %w", err)
	}

	result.PlatformID = adID
	result.PlatformURL = fmt.Sprintf("https://ads.google.com/aw/ads?campaignId=%s&adGroupId=%s", campaignID, adGroupID)

	return nil
}

// createOrGetCampaign creates a new campaign or returns existing one
func (c *Client) createOrGetCampaign(ctx context.Context, request *models.DeploymentRequest) (string, error) {
	// In a real implementation, you would:
	// 1. Check if a campaign already exists for this project/strategy
	// 2. Create a new campaign if needed
	// 3. Configure campaign settings based on metadata

	campaignName := fmt.Sprintf("ZAMC-%s-%s", request.ProjectID.String()[:8], request.StrategyID.String()[:8])
	
	// For demo purposes, return a mock campaign ID
	// In production, you would use the Google Ads API to create the campaign
	campaignID := fmt.Sprintf("campaign_%d", time.Now().Unix())
	
	c.logger.WithFields(logrus.Fields{
		"campaign_name": campaignName,
		"campaign_id":   campaignID,
	}).Info("Created/retrieved Google Ads campaign")

	return campaignID, nil
}

// createOrGetAdGroup creates a new ad group or returns existing one
func (c *Client) createOrGetAdGroup(ctx context.Context, campaignID string, request *models.DeploymentRequest) (string, error) {
	adGroupName := fmt.Sprintf("AdGroup-%s", request.ContentType)
	
	// For demo purposes, return a mock ad group ID
	adGroupID := fmt.Sprintf("adgroup_%d", time.Now().Unix())
	
	c.logger.WithFields(logrus.Fields{
		"ad_group_name": adGroupName,
		"ad_group_id":   adGroupID,
		"campaign_id":   campaignID,
	}).Info("Created/retrieved Google Ads ad group")

	return adGroupID, nil
}

// createTextAd creates a text ad
func (c *Client) createTextAd(ctx context.Context, adGroupID string, request *models.DeploymentRequest) (string, error) {
	// Extract headlines and descriptions from content
	headlines := c.extractHeadlines(request.Content, request.Metadata.CreativeSpecs.Headline)
	descriptions := c.extractDescriptions(request.Content, request.Metadata.CreativeSpecs.Description)
	
	// For demo purposes, return a mock ad ID
	adID := fmt.Sprintf("ad_%d", time.Now().Unix())
	
	c.logger.WithFields(logrus.Fields{
		"ad_id":        adID,
		"ad_group_id":  adGroupID,
		"headlines":    len(headlines),
		"descriptions": len(descriptions),
	}).Info("Created Google Ads text ad")

	return adID, nil
}

// createResponsiveSearchAd creates a responsive search ad
func (c *Client) createResponsiveSearchAd(ctx context.Context, adGroupID string, request *models.DeploymentRequest) (string, error) {
	// Similar to text ad but with more headlines and descriptions
	adID := fmt.Sprintf("rsa_%d", time.Now().Unix())
	
	c.logger.WithFields(logrus.Fields{
		"ad_id":       adID,
		"ad_group_id": adGroupID,
		"ad_type":     "responsive_search_ad",
	}).Info("Created Google Ads responsive search ad")

	return adID, nil
}

// createVideoAd creates a video ad
func (c *Client) createVideoAd(ctx context.Context, adGroupID string, request *models.DeploymentRequest) (string, error) {
	adID := fmt.Sprintf("video_%d", time.Now().Unix())
	
	c.logger.WithFields(logrus.Fields{
		"ad_id":       adID,
		"ad_group_id": adGroupID,
		"ad_type":     "video_ad",
		"video_url":   request.Metadata.CreativeSpecs.VideoURL,
	}).Info("Created Google Ads video ad")

	return adID, nil
}

// createOrGetVideoCampaign creates a video campaign
func (c *Client) createOrGetVideoCampaign(ctx context.Context, request *models.DeploymentRequest) (string, error) {
	campaignID := fmt.Sprintf("video_campaign_%d", time.Now().Unix())
	
	c.logger.WithField("campaign_id", campaignID).Info("Created Google Ads video campaign")
	
	return campaignID, nil
}

// addKeywords adds keywords to an ad group
func (c *Client) addKeywords(ctx context.Context, adGroupID string, keywords []string) ([]string, error) {
	if len(keywords) == 0 {
		return nil, nil
	}

	var keywordIDs []string
	for i, keyword := range keywords {
		keywordID := fmt.Sprintf("keyword_%d_%d", time.Now().Unix(), i)
		keywordIDs = append(keywordIDs, keywordID)
	}
	
	c.logger.WithFields(logrus.Fields{
		"ad_group_id": adGroupID,
		"keywords":    len(keywords),
	}).Info("Added keywords to Google Ads ad group")

	return keywordIDs, nil
}

// extractHeadlines extracts headlines from content
func (c *Client) extractHeadlines(content, primaryHeadline string) []string {
	headlines := []string{}
	
	if primaryHeadline != "" {
		headlines = append(headlines, c.truncateText(primaryHeadline, 30))
	}
	
	// Extract additional headlines from content
	lines := strings.Split(content, "\n")
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if len(line) > 10 && len(line) <= 30 && !strings.Contains(line, ".") {
			headlines = append(headlines, line)
			if len(headlines) >= 15 { // Google Ads limit
				break
			}
		}
	}
	
	// Ensure we have at least 3 headlines
	for len(headlines) < 3 {
		headlines = append(headlines, fmt.Sprintf("Headline %d", len(headlines)+1))
	}
	
	return headlines
}

// extractDescriptions extracts descriptions from content
func (c *Client) extractDescriptions(content, primaryDescription string) []string {
	descriptions := []string{}
	
	if primaryDescription != "" {
		descriptions = append(descriptions, c.truncateText(primaryDescription, 90))
	}
	
	// Extract sentences from content
	sentences := strings.Split(content, ".")
	for _, sentence := range sentences {
		sentence = strings.TrimSpace(sentence)
		if len(sentence) > 20 && len(sentence) <= 90 {
			descriptions = append(descriptions, sentence+".")
			if len(descriptions) >= 4 { // Google Ads limit
				break
			}
		}
	}
	
	// Ensure we have at least 2 descriptions
	for len(descriptions) < 2 {
		descriptions = append(descriptions, fmt.Sprintf("Description %d", len(descriptions)+1))
	}
	
	return descriptions
}

// truncateText truncates text to specified length
func (c *Client) truncateText(text string, maxLength int) string {
	if len(text) <= maxLength {
		return text
	}
	return text[:maxLength-3] + "..."
}

// HealthCheck checks the health of the Google Ads client
func (c *Client) HealthCheck(ctx context.Context) error {
	// Try to make a simple API call to verify connectivity
	if c.service == nil {
		return fmt.Errorf("Google Ads service is not initialized")
	}

	// In a real implementation, you would make a lightweight API call
	// For now, just check if the service is initialized
	return nil
}

// oauth2Config represents OAuth2 configuration for Google Ads
type oauth2Config struct {
	ClientID     string
	ClientSecret string
	RefreshToken string
}

// TokenSource creates a token source for OAuth2
func (c *oauth2Config) TokenSource(ctx context.Context) oauth2.TokenSource {
	// In a real implementation, you would create a proper OAuth2 token source
	// This is a simplified version for demonstration
	return &mockTokenSource{
		accessToken: "mock_access_token",
	}
}

// mockTokenSource is a mock token source for demonstration
type mockTokenSource struct {
	accessToken string
}

func (ts *mockTokenSource) Token() (*oauth2.Token, error) {
	return &oauth2.Token{
		AccessToken: ts.accessToken,
		TokenType:   "Bearer",
		Expiry:      time.Now().Add(time.Hour),
	}, nil
}

// oauth2 types for compatibility
type oauth2 struct{}

type TokenSource interface {
	Token() (*oauth2.Token, error)
}

type Token struct {
	AccessToken string
	TokenType   string
	Expiry      time.Time
} 
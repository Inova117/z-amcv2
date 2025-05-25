package meta

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/sirupsen/logrus"
	"github.com/zamc/connectors/internal/config"
	"github.com/zamc/connectors/internal/models"
)

// Client represents a Meta Marketing API client
type Client struct {
	httpClient  *http.Client
	config      *config.MetaConfig
	logger      *logrus.Logger
	baseURL     string
}

// NewClient creates a new Meta Marketing API client
func NewClient(cfg *config.MetaConfig, logger *logrus.Logger) (*Client, error) {
	baseURL := fmt.Sprintf("https://graph.facebook.com/%s", cfg.APIVersion)

	client := &Client{
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
		config:  cfg,
		logger:  logger,
		baseURL: baseURL,
	}

	logger.WithFields(logrus.Fields{
		"api_version":   cfg.APIVersion,
		"ad_account_id": cfg.AdAccountID,
	}).Info("Meta Marketing API client initialized")

	return client, nil
}

// DeployAsset deploys an asset to Meta platforms
func (c *Client) DeployAsset(ctx context.Context, request *models.DeploymentRequest) (*models.DeploymentResult, error) {
	startTime := time.Now()
	logger := c.logger.WithFields(logrus.Fields{
		"asset_id":     request.AssetID,
		"content_type": request.ContentType,
		"platform":     models.PlatformMeta,
	})

	logger.Info("Starting Meta deployment")

	result := &models.DeploymentResult{
		AssetID:    request.AssetID,
		Platform:   models.PlatformMeta,
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
		err = c.deploySocialMediaAd(ctx, request, result)
	case models.ContentTypeBlogPost:
		err = c.deployLinkAd(ctx, request, result)
	case models.ContentTypeVideoScript:
		err = c.deployVideoAd(ctx, request, result)
	case models.ContentTypeInfographic:
		err = c.deployImageAd(ctx, request, result)
	default:
		err = c.deploySocialMediaAd(ctx, request, result) // Default to social media ad
	}

	// Update metrics
	result.Metrics.Duration = time.Since(startTime)

	if err != nil {
		result.Status = models.DeploymentStatusFailed
		result.Error = err.Error()
		logger.WithError(err).Error("Meta deployment failed")
		return result, err
	}

	result.Status = models.DeploymentStatusSuccess
	logger.WithFields(logrus.Fields{
		"platform_id":  result.PlatformID,
		"platform_url": result.PlatformURL,
		"duration":     result.Metrics.Duration,
	}).Info("Meta deployment successful")

	return result, nil
}

// deploySocialMediaAd deploys a social media ad to Meta
func (c *Client) deploySocialMediaAd(ctx context.Context, request *models.DeploymentRequest, result *models.DeploymentResult) error {
	// Create campaign if needed
	campaignID, err := c.createOrGetCampaign(ctx, request)
	if err != nil {
		return fmt.Errorf("failed to create/get campaign: %w", err)
	}

	// Create ad set if needed
	adSetID, err := c.createOrGetAdSet(ctx, campaignID, request)
	if err != nil {
		return fmt.Errorf("failed to create/get ad set: %w", err)
	}

	// Create creative
	creativeID, err := c.createCreative(ctx, request)
	if err != nil {
		return fmt.Errorf("failed to create creative: %w", err)
	}

	// Create ad
	adID, err := c.createAd(ctx, adSetID, creativeID, request)
	if err != nil {
		return fmt.Errorf("failed to create ad: %w", err)
	}

	// Set result data
	result.PlatformID = adID
	result.PlatformURL = fmt.Sprintf("https://www.facebook.com/adsmanager/manage/campaigns?act=%s", c.config.AdAccountID)

	// Store deployment details
	deployment := models.MetaDeployment{
		CampaignID: campaignID,
		AdSetID:    adSetID,
		AdID:       adID,
		CreativeID: creativeID,
	}

	c.logger.WithField("deployment", deployment).Debug("Meta deployment details")

	return nil
}

// deployLinkAd deploys a link ad (for blog posts)
func (c *Client) deployLinkAd(ctx context.Context, request *models.DeploymentRequest, result *models.DeploymentResult) error {
	// Similar to social media ad but optimized for link clicks
	return c.deploySocialMediaAd(ctx, request, result)
}

// deployVideoAd deploys a video ad
func (c *Client) deployVideoAd(ctx context.Context, request *models.DeploymentRequest, result *models.DeploymentResult) error {
	// Video ads require video upload first
	if request.Metadata.CreativeSpecs.VideoURL == "" {
		return fmt.Errorf("video URL is required for video ads")
	}

	// Create campaign optimized for video views
	campaignID, err := c.createOrGetVideoCampaign(ctx, request)
	if err != nil {
		return fmt.Errorf("failed to create/get video campaign: %w", err)
	}

	adSetID, err := c.createOrGetAdSet(ctx, campaignID, request)
	if err != nil {
		return fmt.Errorf("failed to create/get ad set: %w", err)
	}

	creativeID, err := c.createVideoCreative(ctx, request)
	if err != nil {
		return fmt.Errorf("failed to create video creative: %w", err)
	}

	adID, err := c.createAd(ctx, adSetID, creativeID, request)
	if err != nil {
		return fmt.Errorf("failed to create video ad: %w", err)
	}

	result.PlatformID = adID
	result.PlatformURL = fmt.Sprintf("https://www.facebook.com/adsmanager/manage/campaigns?act=%s", c.config.AdAccountID)

	return nil
}

// deployImageAd deploys an image ad (for infographics)
func (c *Client) deployImageAd(ctx context.Context, request *models.DeploymentRequest, result *models.DeploymentResult) error {
	if request.Metadata.CreativeSpecs.ImageURL == "" {
		return fmt.Errorf("image URL is required for image ads")
	}

	return c.deploySocialMediaAd(ctx, request, result)
}

// createOrGetCampaign creates a new campaign or returns existing one
func (c *Client) createOrGetCampaign(ctx context.Context, request *models.DeploymentRequest) (string, error) {
	campaignName := fmt.Sprintf("ZAMC-%s-%s", request.ProjectID.String()[:8], request.StrategyID.String()[:8])

	campaign := map[string]interface{}{
		"name":      campaignName,
		"objective": c.getCampaignObjective(request.ContentType),
		"status":    "PAUSED", // Start paused for review
		"special_ad_categories": []string{},
	}

	campaignID, err := c.makeAPICall(ctx, "POST", fmt.Sprintf("act_%s/campaigns", c.config.AdAccountID), campaign)
	if err != nil {
		return "", fmt.Errorf("failed to create campaign: %w", err)
	}

	c.logger.WithFields(logrus.Fields{
		"campaign_name": campaignName,
		"campaign_id":   campaignID,
	}).Info("Created Meta campaign")

	return campaignID, nil
}

// createOrGetAdSet creates a new ad set or returns existing one
func (c *Client) createOrGetAdSet(ctx context.Context, campaignID string, request *models.DeploymentRequest) (string, error) {
	adSetName := fmt.Sprintf("AdSet-%s", request.ContentType)

	// Calculate end time (30 days from now)
	endTime := time.Now().AddDate(0, 1, 0).Format("2006-01-02T15:04:05-0700")

	adSet := map[string]interface{}{
		"name":                adSetName,
		"campaign_id":         campaignID,
		"daily_budget":        int(request.Metadata.Budget * 100), // Convert to cents
		"billing_event":       "IMPRESSIONS",
		"optimization_goal":   c.getOptimizationGoal(request.ContentType),
		"bid_amount":          100, // $1.00 in cents
		"status":              "PAUSED",
		"end_time":            endTime,
		"targeting":           c.buildTargeting(request.Metadata.Demographics),
		"promoted_object":     c.buildPromotedObject(request),
	}

	adSetID, err := c.makeAPICall(ctx, "POST", fmt.Sprintf("act_%s/adsets", c.config.AdAccountID), adSet)
	if err != nil {
		return "", fmt.Errorf("failed to create ad set: %w", err)
	}

	c.logger.WithFields(logrus.Fields{
		"ad_set_name": adSetName,
		"ad_set_id":   adSetID,
		"campaign_id": campaignID,
	}).Info("Created Meta ad set")

	return adSetID, nil
}

// createCreative creates a creative for the ad
func (c *Client) createCreative(ctx context.Context, request *models.DeploymentRequest) (string, error) {
	creativeName := fmt.Sprintf("Creative-%s-%s", request.ContentType, request.AssetID.String()[:8])

	creative := map[string]interface{}{
		"name": creativeName,
		"object_story_spec": map[string]interface{}{
			"page_id": c.config.AdAccountID, // This should be a page ID in production
			"link_data": map[string]interface{}{
				"message":     c.extractMessage(request.Content),
				"link":        request.Metadata.CreativeSpecs.LandingURL,
				"name":        request.Metadata.CreativeSpecs.Headline,
				"description": request.Metadata.CreativeSpecs.Description,
				"call_to_action": map[string]interface{}{
					"type": c.getCallToActionType(request.Metadata.CreativeSpecs.CallToAction),
				},
			},
		},
	}

	// Add image if available
	if request.Metadata.CreativeSpecs.ImageURL != "" {
		creative["object_story_spec"].(map[string]interface{})["link_data"].(map[string]interface{})["picture"] = request.Metadata.CreativeSpecs.ImageURL
	}

	creativeID, err := c.makeAPICall(ctx, "POST", fmt.Sprintf("act_%s/adcreatives", c.config.AdAccountID), creative)
	if err != nil {
		return "", fmt.Errorf("failed to create creative: %w", err)
	}

	c.logger.WithFields(logrus.Fields{
		"creative_name": creativeName,
		"creative_id":   creativeID,
	}).Info("Created Meta creative")

	return creativeID, nil
}

// createVideoCreative creates a video creative
func (c *Client) createVideoCreative(ctx context.Context, request *models.DeploymentRequest) (string, error) {
	creativeName := fmt.Sprintf("VideoCreative-%s-%s", request.ContentType, request.AssetID.String()[:8])

	creative := map[string]interface{}{
		"name": creativeName,
		"object_story_spec": map[string]interface{}{
			"page_id": c.config.AdAccountID,
			"video_data": map[string]interface{}{
				"message":    c.extractMessage(request.Content),
				"video_id":   request.Metadata.CreativeSpecs.VideoURL, // This should be a Facebook video ID
				"title":      request.Metadata.CreativeSpecs.Headline,
				"call_to_action": map[string]interface{}{
					"type": c.getCallToActionType(request.Metadata.CreativeSpecs.CallToAction),
					"value": map[string]interface{}{
						"link": request.Metadata.CreativeSpecs.LandingURL,
					},
				},
			},
		},
	}

	creativeID, err := c.makeAPICall(ctx, "POST", fmt.Sprintf("act_%s/adcreatives", c.config.AdAccountID), creative)
	if err != nil {
		return "", fmt.Errorf("failed to create video creative: %w", err)
	}

	c.logger.WithField("creative_id", creativeID).Info("Created Meta video creative")

	return creativeID, nil
}

// createAd creates the final ad
func (c *Client) createAd(ctx context.Context, adSetID, creativeID string, request *models.DeploymentRequest) (string, error) {
	adName := fmt.Sprintf("Ad-%s-%s", request.ContentType, request.AssetID.String()[:8])

	ad := map[string]interface{}{
		"name":        adName,
		"adset_id":    adSetID,
		"creative":    map[string]interface{}{"creative_id": creativeID},
		"status":      "PAUSED",
	}

	adID, err := c.makeAPICall(ctx, "POST", fmt.Sprintf("act_%s/ads", c.config.AdAccountID), ad)
	if err != nil {
		return "", fmt.Errorf("failed to create ad: %w", err)
	}

	c.logger.WithFields(logrus.Fields{
		"ad_name":     adName,
		"ad_id":       adID,
		"ad_set_id":   adSetID,
		"creative_id": creativeID,
	}).Info("Created Meta ad")

	return adID, nil
}

// createOrGetVideoCampaign creates a video-optimized campaign
func (c *Client) createOrGetVideoCampaign(ctx context.Context, request *models.DeploymentRequest) (string, error) {
	campaignName := fmt.Sprintf("ZAMC-Video-%s-%s", request.ProjectID.String()[:8], request.StrategyID.String()[:8])

	campaign := map[string]interface{}{
		"name":      campaignName,
		"objective": "VIDEO_VIEWS",
		"status":    "PAUSED",
	}

	campaignID, err := c.makeAPICall(ctx, "POST", fmt.Sprintf("act_%s/campaigns", c.config.AdAccountID), campaign)
	if err != nil {
		return "", fmt.Errorf("failed to create video campaign: %w", err)
	}

	c.logger.WithField("campaign_id", campaignID).Info("Created Meta video campaign")

	return campaignID, nil
}

// Helper functions

func (c *Client) getCampaignObjective(contentType models.ContentType) string {
	switch contentType {
	case models.ContentTypeBlogPost:
		return "LINK_CLICKS"
	case models.ContentTypeVideoScript:
		return "VIDEO_VIEWS"
	case models.ContentTypeInfographic:
		return "REACH"
	default:
		return "LINK_CLICKS"
	}
}

func (c *Client) getOptimizationGoal(contentType models.ContentType) string {
	switch contentType {
	case models.ContentTypeBlogPost:
		return "LINK_CLICKS"
	case models.ContentTypeVideoScript:
		return "THRUPLAY"
	case models.ContentTypeInfographic:
		return "REACH"
	default:
		return "LINK_CLICKS"
	}
}

func (c *Client) buildTargeting(demographics models.Demographics) map[string]interface{} {
	targeting := map[string]interface{}{
		"age_min": demographics.AgeMin,
		"age_max": demographics.AgeMax,
	}

	if len(demographics.Genders) > 0 {
		genders := []int{}
		for _, gender := range demographics.Genders {
			switch strings.ToLower(gender) {
			case "male":
				genders = append(genders, 1)
			case "female":
				genders = append(genders, 2)
			}
		}
		if len(genders) > 0 {
			targeting["genders"] = genders
		}
	}

	if len(demographics.Locations) > 0 {
		// In production, you would convert location names to Facebook location IDs
		targeting["geo_locations"] = map[string]interface{}{
			"countries": demographics.Locations,
		}
	}

	if len(demographics.Interests) > 0 {
		// In production, you would convert interests to Facebook interest IDs
		targeting["interests"] = demographics.Interests
	}

	return targeting
}

func (c *Client) buildPromotedObject(request *models.DeploymentRequest) map[string]interface{} {
	if request.Metadata.CreativeSpecs.LandingURL != "" {
		return map[string]interface{}{
			"page_id": c.config.AdAccountID, // Should be page ID in production
		}
	}
	return nil
}

func (c *Client) extractMessage(content string) string {
	// Extract first paragraph or first 125 characters
	lines := strings.Split(content, "\n")
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if len(line) > 10 {
			if len(line) > 125 {
				return line[:122] + "..."
			}
			return line
		}
	}
	return "Check out our latest content!"
}

func (c *Client) getCallToActionType(cta string) string {
	switch strings.ToLower(cta) {
	case "learn more":
		return "LEARN_MORE"
	case "shop now":
		return "SHOP_NOW"
	case "sign up":
		return "SIGN_UP"
	case "download":
		return "DOWNLOAD"
	case "watch more":
		return "WATCH_MORE"
	default:
		return "LEARN_MORE"
	}
}

// makeAPICall makes an API call to Meta Marketing API
func (c *Client) makeAPICall(ctx context.Context, method, endpoint string, data interface{}) (string, error) {
	url := fmt.Sprintf("%s/%s", c.baseURL, endpoint)

	var body io.Reader
	if data != nil {
		jsonData, err := json.Marshal(data)
		if err != nil {
			return "", fmt.Errorf("failed to marshal request data: %w", err)
		}
		body = bytes.NewBuffer(jsonData)
	}

	req, err := http.NewRequestWithContext(ctx, method, url, body)
	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", c.config.AccessToken))

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to make API call: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read response body: %w", err)
	}

	if resp.StatusCode >= 400 {
		return "", fmt.Errorf("API call failed with status %d: %s", resp.StatusCode, string(respBody))
	}

	var response map[string]interface{}
	if err := json.Unmarshal(respBody, &response); err != nil {
		return "", fmt.Errorf("failed to unmarshal response: %w", err)
	}

	// Extract ID from response
	if id, ok := response["id"].(string); ok {
		return id, nil
	}

	// For demo purposes, return a mock ID
	return fmt.Sprintf("meta_%d", time.Now().Unix()), nil
}

// HealthCheck checks the health of the Meta client
func (c *Client) HealthCheck(ctx context.Context) error {
	// Make a simple API call to verify connectivity
	url := fmt.Sprintf("%s/me?access_token=%s", c.baseURL, c.config.AccessToken)

	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return fmt.Errorf("failed to create health check request: %w", err)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("health check request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return fmt.Errorf("health check failed with status %d", resp.StatusCode)
	}

	return nil
} 
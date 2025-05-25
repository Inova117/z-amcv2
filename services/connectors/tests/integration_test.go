package tests

import (
	"context"
	"fmt"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/zamc/connectors/internal/config"
	"github.com/zamc/connectors/internal/mocks"
	"github.com/zamc/connectors/internal/models"
	"github.com/zamc/connectors/internal/service"
)

func TestDeploymentService_HandleAssetStatusChanged_Success(t *testing.T) {
	// Setup
	logger := logrus.New()
	logger.SetLevel(logrus.DebugLevel)

	mockGoogleAds := mocks.NewMockGoogleAdsClient()
	mockMeta := mocks.NewMockMetaClient()
	mockNATS := mocks.NewMockNATSClient()

	deploymentConfig := &config.DeploymentConfig{
		MaxRetryAttempts: 3,
		RetryDelay:       100 * time.Millisecond,
		Timeout:          30 * time.Second,
	}

	deploymentService := service.NewDeploymentService(
		mockGoogleAds,
		mockMeta,
		mockNATS,
		deploymentConfig,
		logger,
	)

	// Create test event
	assetID := uuid.New()
	projectID := uuid.New()
	strategyID := uuid.New()

	event := &models.AssetStatusChangedEvent{
		EventType:   "asset.status_changed",
		AssetID:     assetID,
		ProjectID:   projectID,
		StrategyID:  strategyID,
		Status:      models.AssetStatusApproved,
		PrevStatus:  models.AssetStatusReview,
		ContentType: models.ContentTypeSocialMedia,
		Title:       "Test Social Media Post",
		Content:     "This is a test social media post content for deployment testing.",
		Metadata: models.Metadata{
			Platforms:      []models.Platform{models.PlatformGoogleAds, models.PlatformMeta},
			TargetAudience: "Tech professionals",
			Budget:         100.0,
			CampaignType:   "awareness",
			Keywords:       []string{"technology", "innovation", "software"},
			Demographics: models.Demographics{
				AgeMin:    25,
				AgeMax:    45,
				Genders:   []string{"male", "female"},
				Locations: []string{"US", "CA"},
				Interests: []string{"technology", "business"},
			},
			CreativeSpecs: models.CreativeSpecs{
				ImageURL:     "https://example.com/image.jpg",
				Headline:     "Innovative Technology Solutions",
				Description:  "Discover cutting-edge technology solutions for your business",
				CallToAction: "Learn More",
				LandingURL:   "https://example.com/landing",
			},
		},
		Timestamp: time.Now(),
	}

	// Execute
	ctx := context.Background()
	err := deploymentService.HandleAssetStatusChanged(ctx, event)

	// Assert
	require.NoError(t, err)

	// Verify deployments were made to both platforms
	googleAdsDeployments := mockGoogleAds.GetDeployments()
	metaDeployments := mockMeta.GetDeployments()

	assert.Len(t, googleAdsDeployments, 1)
	assert.Len(t, metaDeployments, 1)

	// Verify Google Ads deployment
	googleAdsDeployment := googleAdsDeployments[0]
	assert.Equal(t, assetID, googleAdsDeployment.AssetID)
	assert.Equal(t, models.PlatformGoogleAds, googleAdsDeployment.Platform)
	assert.Equal(t, models.ContentTypeSocialMedia, googleAdsDeployment.ContentType)

	// Verify Meta deployment
	metaDeployment := metaDeployments[0]
	assert.Equal(t, assetID, metaDeployment.AssetID)
	assert.Equal(t, models.PlatformMeta, metaDeployment.Platform)
	assert.Equal(t, models.ContentTypeSocialMedia, metaDeployment.ContentType)

	// Verify events were published
	publishedEvents := mockNATS.GetPublishedEvents()
	assert.GreaterOrEqual(t, len(publishedEvents), 2) // At least deployment status events

	// Check for deployment status events
	deploymentEvents := mockNATS.GetPublishedEventsOfType("asset.deployment_status_changed")
	assert.Len(t, deploymentEvents, 2) // One for each platform

	// Check for final asset status event
	assetStatusEvents := mockNATS.GetPublishedEventsOfType("asset.status_changed")
	assert.GreaterOrEqual(t, len(assetStatusEvents), 1)

	// Verify final status is deployed
	finalEvent := assetStatusEvents[len(assetStatusEvents)-1].(*models.AssetStatusChangedEvent)
	assert.Equal(t, models.AssetStatusDeployed, finalEvent.Status)
}

func TestDeploymentService_HandleAssetStatusChanged_PartialFailure(t *testing.T) {
	// Setup
	logger := logrus.New()
	logger.SetLevel(logrus.DebugLevel)

	mockGoogleAds := mocks.NewMockGoogleAdsClient()
	mockMeta := mocks.NewMockMetaClient()
	mockNATS := mocks.NewMockNATSClient()

	// Make Google Ads deployment fail
	mockGoogleAds.SetShouldFailDeployment(true)

	deploymentConfig := &config.DeploymentConfig{
		MaxRetryAttempts: 2,
		RetryDelay:       50 * time.Millisecond,
		Timeout:          10 * time.Second,
	}

	deploymentService := service.NewDeploymentService(
		mockGoogleAds,
		mockMeta,
		mockNATS,
		deploymentConfig,
		logger,
	)

	// Create test event
	event := &models.AssetStatusChangedEvent{
		EventType:   "asset.status_changed",
		AssetID:     uuid.New(),
		ProjectID:   uuid.New(),
		StrategyID:  uuid.New(),
		Status:      models.AssetStatusApproved,
		PrevStatus:  models.AssetStatusReview,
		ContentType: models.ContentTypeBlogPost,
		Title:       "Test Blog Post",
		Content:     "This is a test blog post content.",
		Metadata: models.Metadata{
			Platforms: []models.Platform{models.PlatformGoogleAds, models.PlatformMeta},
			Budget:    50.0,
		},
		Timestamp: time.Now(),
	}

	// Execute
	ctx := context.Background()
	err := deploymentService.HandleAssetStatusChanged(ctx, event)

	// Assert
	require.NoError(t, err) // Service should handle partial failures gracefully

	// Verify Meta deployment succeeded
	metaDeployments := mockMeta.GetDeployments()
	assert.Len(t, metaDeployments, 1)

	// Verify Google Ads deployment failed (no deployments recorded)
	googleAdsDeployments := mockGoogleAds.GetDeployments()
	assert.Len(t, googleAdsDeployments, 0)

	// Verify final status is failed due to partial failure
	assetStatusEvents := mockNATS.GetPublishedEventsOfType("asset.status_changed")
	assert.GreaterOrEqual(t, len(assetStatusEvents), 1)

	finalEvent := assetStatusEvents[len(assetStatusEvents)-1].(*models.AssetStatusChangedEvent)
	assert.Equal(t, models.AssetStatusFailed, finalEvent.Status)
}

func TestDeploymentService_HandleAssetStatusChanged_NonApprovedAsset(t *testing.T) {
	// Setup
	logger := logrus.New()
	mockGoogleAds := mocks.NewMockGoogleAdsClient()
	mockMeta := mocks.NewMockMetaClient()
	mockNATS := mocks.NewMockNATSClient()

	deploymentConfig := &config.DeploymentConfig{
		MaxRetryAttempts: 3,
		RetryDelay:       100 * time.Millisecond,
		Timeout:          30 * time.Second,
	}

	deploymentService := service.NewDeploymentService(
		mockGoogleAds,
		mockMeta,
		mockNATS,
		deploymentConfig,
		logger,
	)

	// Create test event with non-approved status
	event := &models.AssetStatusChangedEvent{
		EventType:   "asset.status_changed",
		AssetID:     uuid.New(),
		ProjectID:   uuid.New(),
		StrategyID:  uuid.New(),
		Status:      models.AssetStatusReview, // Not approved
		PrevStatus:  models.AssetStatusDraft,
		ContentType: models.ContentTypeSocialMedia,
		Title:       "Test Asset",
		Content:     "Test content",
		Metadata: models.Metadata{
			Platforms: []models.Platform{models.PlatformGoogleAds},
		},
		Timestamp: time.Now(),
	}

	// Execute
	ctx := context.Background()
	err := deploymentService.HandleAssetStatusChanged(ctx, event)

	// Assert
	require.NoError(t, err)

	// Verify no deployments were made
	googleAdsDeployments := mockGoogleAds.GetDeployments()
	metaDeployments := mockMeta.GetDeployments()

	assert.Len(t, googleAdsDeployments, 0)
	assert.Len(t, metaDeployments, 0)

	// Verify no events were published
	publishedEvents := mockNATS.GetPublishedEvents()
	assert.Len(t, publishedEvents, 0)
}

func TestDeploymentService_RetryLogic(t *testing.T) {
	// Setup
	logger := logrus.New()
	logger.SetLevel(logrus.DebugLevel)

	mockGoogleAds := mocks.NewMockGoogleAdsClient()
	mockMeta := mocks.NewMockMetaClient()
	mockNATS := mocks.NewMockNATSClient()

	// Set deployment delay to test timeout
	mockGoogleAds.SetDeploymentDelay(200 * time.Millisecond)

	deploymentConfig := &config.DeploymentConfig{
		MaxRetryAttempts: 3,
		RetryDelay:       50 * time.Millisecond,
		Timeout:          100 * time.Millisecond, // Shorter than deployment delay
	}

	deploymentService := service.NewDeploymentService(
		mockGoogleAds,
		mockMeta,
		mockNATS,
		deploymentConfig,
		logger,
	)

	// Create test event
	event := &models.AssetStatusChangedEvent{
		EventType:   "asset.status_changed",
		AssetID:     uuid.New(),
		ProjectID:   uuid.New(),
		StrategyID:  uuid.New(),
		Status:      models.AssetStatusApproved,
		PrevStatus:  models.AssetStatusReview,
		ContentType: models.ContentTypeVideoScript,
		Title:       "Test Video",
		Content:     "Test video script",
		Metadata: models.Metadata{
			Platforms: []models.Platform{models.PlatformGoogleAds},
			CreativeSpecs: models.CreativeSpecs{
				VideoURL: "https://example.com/video.mp4",
			},
		},
		Timestamp: time.Now(),
	}

	// Execute
	ctx := context.Background()
	start := time.Now()
	err := deploymentService.HandleAssetStatusChanged(ctx, event)
	duration := time.Since(start)

	// Assert
	require.NoError(t, err) // Service handles failures gracefully

	// Verify retry logic was executed (should take at least retry attempts * retry delay)
	expectedMinDuration := time.Duration(deploymentConfig.MaxRetryAttempts-1) * deploymentConfig.RetryDelay
	assert.GreaterOrEqual(t, duration, expectedMinDuration)

	// Verify no successful deployments due to timeout
	googleAdsDeployments := mockGoogleAds.GetDeployments()
	assert.Len(t, googleAdsDeployments, 0)

	// Verify final status is failed
	assetStatusEvents := mockNATS.GetPublishedEventsOfType("asset.status_changed")
	assert.GreaterOrEqual(t, len(assetStatusEvents), 1)

	finalEvent := assetStatusEvents[len(assetStatusEvents)-1].(*models.AssetStatusChangedEvent)
	assert.Equal(t, models.AssetStatusFailed, finalEvent.Status)
}

func TestDeploymentService_HealthCheck(t *testing.T) {
	// Setup
	logger := logrus.New()
	mockGoogleAds := mocks.NewMockGoogleAdsClient()
	mockMeta := mocks.NewMockMetaClient()
	mockNATS := mocks.NewMockNATSClient()

	deploymentConfig := &config.DeploymentConfig{}

	deploymentService := service.NewDeploymentService(
		mockGoogleAds,
		mockMeta,
		mockNATS,
		deploymentConfig,
		logger,
	)

	// Test all healthy
	ctx := context.Background()
	health := deploymentService.HealthCheck(ctx)

	assert.Equal(t, "healthy", health["google_ads"])
	assert.Equal(t, "healthy", health["meta"])
	assert.Equal(t, "healthy", health["nats"])

	// Test Google Ads unhealthy
	mockGoogleAds.SetShouldFailHealthCheck(true)
	health = deploymentService.HealthCheck(ctx)

	assert.Contains(t, health["google_ads"], "unhealthy")
	assert.Equal(t, "healthy", health["meta"])
	assert.Equal(t, "healthy", health["nats"])

	// Test Meta unhealthy
	mockGoogleAds.SetShouldFailHealthCheck(false)
	mockMeta.SetShouldFailHealthCheck(true)
	health = deploymentService.HealthCheck(ctx)

	assert.Equal(t, "healthy", health["google_ads"])
	assert.Contains(t, health["meta"], "unhealthy")
	assert.Equal(t, "healthy", health["nats"])

	// Test NATS unhealthy
	mockMeta.SetShouldFailHealthCheck(false)
	mockNATS.SetShouldFailHealthCheck(true)
	health = deploymentService.HealthCheck(ctx)

	assert.Equal(t, "healthy", health["google_ads"])
	assert.Equal(t, "healthy", health["meta"])
	assert.Contains(t, health["nats"], "unhealthy")
}

func TestDeploymentService_DifferentContentTypes(t *testing.T) {
	// Setup
	logger := logrus.New()
	mockGoogleAds := mocks.NewMockGoogleAdsClient()
	mockMeta := mocks.NewMockMetaClient()
	mockNATS := mocks.NewMockNATSClient()

	deploymentConfig := &config.DeploymentConfig{
		MaxRetryAttempts: 1,
		RetryDelay:       10 * time.Millisecond,
		Timeout:          5 * time.Second,
	}

	deploymentService := service.NewDeploymentService(
		mockGoogleAds,
		mockMeta,
		mockNATS,
		deploymentConfig,
		logger,
	)

	contentTypes := []models.ContentType{
		models.ContentTypeBlogPost,
		models.ContentTypeSocialMedia,
		models.ContentTypeEmailCampaign,
		models.ContentTypeVideoScript,
		models.ContentTypeInfographic,
	}

	ctx := context.Background()

	for _, contentType := range contentTypes {
		t.Run(string(contentType), func(t *testing.T) {
			// Clear previous deployments
			mockGoogleAds.ClearDeployments()
			mockMeta.ClearDeployments()
			mockNATS.ClearPublishedEvents()

			event := &models.AssetStatusChangedEvent{
				EventType:   "asset.status_changed",
				AssetID:     uuid.New(),
				ProjectID:   uuid.New(),
				StrategyID:  uuid.New(),
				Status:      models.AssetStatusApproved,
				PrevStatus:  models.AssetStatusReview,
				ContentType: contentType,
				Title:       fmt.Sprintf("Test %s", contentType),
				Content:     fmt.Sprintf("Test content for %s", contentType),
				Metadata: models.Metadata{
					Platforms: []models.Platform{models.PlatformGoogleAds, models.PlatformMeta},
					CreativeSpecs: models.CreativeSpecs{
						ImageURL:     "https://example.com/image.jpg",
						VideoURL:     "https://example.com/video.mp4",
						Headline:     "Test Headline",
						Description:  "Test Description",
						CallToAction: "Learn More",
						LandingURL:   "https://example.com/landing",
					},
				},
				Timestamp: time.Now(),
			}

			// Execute
			err := deploymentService.HandleAssetStatusChanged(ctx, event)

			// Assert
			require.NoError(t, err)

			// Verify deployments were made
			googleAdsDeployments := mockGoogleAds.GetDeployments()
			metaDeployments := mockMeta.GetDeployments()

			assert.Len(t, googleAdsDeployments, 1)
			assert.Len(t, metaDeployments, 1)

			// Verify content type is preserved
			assert.Equal(t, contentType, googleAdsDeployments[0].ContentType)
			assert.Equal(t, contentType, metaDeployments[0].ContentType)
		})
	}
}

func TestNATSEventFlow(t *testing.T) {
	// Setup
	logger := logrus.New()
	mockGoogleAds := mocks.NewMockGoogleAdsClient()
	mockMeta := mocks.NewMockMetaClient()
	mockNATS := mocks.NewMockNATSClient()

	deploymentConfig := &config.DeploymentConfig{
		MaxRetryAttempts: 1,
		RetryDelay:       10 * time.Millisecond,
		Timeout:          5 * time.Second,
	}

	deploymentService := service.NewDeploymentService(
		mockGoogleAds,
		mockMeta,
		mockNATS,
		deploymentConfig,
		logger,
	)

	// Simulate NATS subscription setup
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Start subscription in background
	go func() {
		mockNATS.SubscribeToAssetStatusChanged(ctx, deploymentService)
	}()

	// Give subscription time to set up
	time.Sleep(10 * time.Millisecond)

	// Create and simulate event
	event := &models.AssetStatusChangedEvent{
		EventType:   "asset.status_changed",
		AssetID:     uuid.New(),
		ProjectID:   uuid.New(),
		StrategyID:  uuid.New(),
		Status:      models.AssetStatusApproved,
		PrevStatus:  models.AssetStatusReview,
		ContentType: models.ContentTypeSocialMedia,
		Title:       "NATS Test Asset",
		Content:     "Test content via NATS",
		Metadata: models.Metadata{
			Platforms: []models.Platform{models.PlatformMeta},
		},
		Timestamp: time.Now(),
	}

	// Simulate receiving the event via NATS
	err := mockNATS.SimulateAssetStatusChangedEvent(context.Background(), event)

	// Assert
	require.NoError(t, err)

	// Verify deployment was triggered
	metaDeployments := mockMeta.GetDeployments()
	assert.Len(t, metaDeployments, 1)
	assert.Equal(t, event.AssetID, metaDeployments[0].AssetID)

	// Verify events were published back to NATS
	publishedEvents := mockNATS.GetPublishedEvents()
	assert.GreaterOrEqual(t, len(publishedEvents), 1)
} 
package service

import (
	"context"
	"fmt"
	"time"

	"github.com/sirupsen/logrus"
	"github.com/zamc/connectors/internal/config"
	"github.com/zamc/connectors/internal/models"
	"github.com/zamc/connectors/internal/nats"
	"github.com/zamc/connectors/internal/platforms/googleads"
	"github.com/zamc/connectors/internal/platforms/meta"
)

// DeploymentService handles asset deployment to advertising platforms
type DeploymentService struct {
	googleAdsClient *googleads.Client
	metaClient      *meta.Client
	natsClient      *nats.Client
	config          *config.DeploymentConfig
	logger          *logrus.Logger
}

// NewDeploymentService creates a new deployment service
func NewDeploymentService(
	googleAdsClient *googleads.Client,
	metaClient *meta.Client,
	natsClient *nats.Client,
	cfg *config.DeploymentConfig,
	logger *logrus.Logger,
) *DeploymentService {
	return &DeploymentService{
		googleAdsClient: googleAdsClient,
		metaClient:      metaClient,
		natsClient:      natsClient,
		config:          cfg,
		logger:          logger,
	}
}

// HandleAssetStatusChanged handles asset status changed events
func (s *DeploymentService) HandleAssetStatusChanged(ctx context.Context, event *models.AssetStatusChangedEvent) error {
	logger := s.logger.WithFields(logrus.Fields{
		"asset_id":     event.AssetID,
		"project_id":   event.ProjectID,
		"strategy_id":  event.StrategyID,
		"status":       event.Status,
		"content_type": event.ContentType,
	})

	logger.Info("Processing asset status changed event")

	// Only process approved assets
	if event.Status != models.AssetStatusApproved {
		logger.Debug("Ignoring non-approved asset")
		return nil
	}

	// Create deployment request
	deploymentRequest := &models.DeploymentRequest{
		AssetID:     event.AssetID,
		ProjectID:   event.ProjectID,
		StrategyID:  event.StrategyID,
		ContentType: event.ContentType,
		Title:       event.Title,
		Content:     event.Content,
		Metadata:    event.Metadata,
		CreatedAt:   time.Now(),
	}

	// Deploy to all specified platforms
	var deploymentResults []models.DeploymentResult
	var hasErrors bool

	for _, platform := range event.Metadata.Platforms {
		deploymentRequest.Platform = platform
		
		result, err := s.deployToplatform(ctx, deploymentRequest)
		if err != nil {
			logger.WithError(err).WithField("platform", platform).Error("Deployment failed")
			hasErrors = true
			
			// Create failed result
			result = &models.DeploymentResult{
				AssetID:    event.AssetID,
				Platform:   platform,
				Status:     models.DeploymentStatusFailed,
				Error:      err.Error(),
				DeployedAt: time.Now(),
				Metrics: models.DeploymentMetrics{
					Duration: 0,
				},
			}
		}
		
		deploymentResults = append(deploymentResults, *result)
		
		// Publish deployment status event for each platform
		if err := s.publishDeploymentStatusEvent(ctx, event, *result); err != nil {
			logger.WithError(err).Error("Failed to publish deployment status event")
		}
	}

	// Update overall asset status
	var finalStatus models.AssetStatus
	if hasErrors {
		finalStatus = models.AssetStatusFailed
	} else {
		finalStatus = models.AssetStatusDeployed
	}

	// Publish final asset status update
	finalEvent := &models.AssetStatusChangedEvent{
		EventType:   "asset.status_changed",
		AssetID:     event.AssetID,
		ProjectID:   event.ProjectID,
		StrategyID:  event.StrategyID,
		Status:      finalStatus,
		PrevStatus:  event.Status,
		ContentType: event.ContentType,
		Title:       event.Title,
		Content:     event.Content,
		Metadata:    event.Metadata,
		Timestamp:   time.Now(),
	}

	if err := s.natsClient.PublishAssetStatusChanged(ctx, finalEvent); err != nil {
		logger.WithError(err).Error("Failed to publish final asset status event")
	}

	logger.WithFields(logrus.Fields{
		"final_status":       finalStatus,
		"deployments_count":  len(deploymentResults),
		"successful_deploys": len(deploymentResults) - countFailedDeployments(deploymentResults),
	}).Info("Asset deployment processing completed")

	return nil
}

// deployToplatform deploys an asset to a specific platform with retry logic
func (s *DeploymentService) deployToplatform(ctx context.Context, request *models.DeploymentRequest) (*models.DeploymentResult, error) {
	logger := s.logger.WithFields(logrus.Fields{
		"asset_id": request.AssetID,
		"platform": request.Platform,
	})

	var lastErr error
	
	for attempt := 1; attempt <= s.config.MaxRetryAttempts; attempt++ {
		logger.WithField("attempt", attempt).Info("Attempting deployment")
		
		// Create context with timeout
		deployCtx, cancel := context.WithTimeout(ctx, s.config.Timeout)
		
		result, err := s.executeDeployment(deployCtx, request)
		cancel()
		
		if err == nil {
			logger.WithField("attempt", attempt).Info("Deployment successful")
			result.Metrics.RetryCount = attempt - 1
			return result, nil
		}
		
		lastErr = err
		logger.WithError(err).WithField("attempt", attempt).Warn("Deployment attempt failed")
		
		// Don't retry on the last attempt
		if attempt < s.config.MaxRetryAttempts {
			logger.WithField("delay", s.config.RetryDelay).Info("Retrying deployment")
			
			select {
			case <-time.After(s.config.RetryDelay):
				// Continue to next attempt
			case <-ctx.Done():
				return nil, ctx.Err()
			}
		}
	}
	
	logger.WithError(lastErr).Error("All deployment attempts failed")
	return nil, fmt.Errorf("deployment failed after %d attempts: %w", s.config.MaxRetryAttempts, lastErr)
}

// executeDeployment executes the actual deployment to a platform
func (s *DeploymentService) executeDeployment(ctx context.Context, request *models.DeploymentRequest) (*models.DeploymentResult, error) {
	switch request.Platform {
	case models.PlatformGoogleAds:
		return s.googleAdsClient.DeployAsset(ctx, request)
	case models.PlatformMeta:
		return s.metaClient.DeployAsset(ctx, request)
	default:
		return nil, fmt.Errorf("unsupported platform: %s", request.Platform)
	}
}

// publishDeploymentStatusEvent publishes a deployment status changed event
func (s *DeploymentService) publishDeploymentStatusEvent(ctx context.Context, originalEvent *models.AssetStatusChangedEvent, result models.DeploymentResult) error {
	var newStatus models.AssetStatus
	switch result.Status {
	case models.DeploymentStatusSuccess:
		newStatus = models.AssetStatusDeployed
	case models.DeploymentStatusFailed:
		newStatus = models.AssetStatusFailed
	default:
		newStatus = originalEvent.Status // Keep original status for pending/running
	}

	event := &models.DeploymentStatusChangedEvent{
		EventType:        "asset.deployment_status_changed",
		AssetID:          originalEvent.AssetID,
		ProjectID:        originalEvent.ProjectID,
		StrategyID:       originalEvent.StrategyID,
		Platform:         result.Platform,
		Status:           newStatus,
		PrevStatus:       originalEvent.Status,
		DeploymentResult: result,
		Timestamp:        time.Now(),
	}

	return s.natsClient.PublishDeploymentStatusChanged(ctx, event)
}

// HealthCheck checks the health of all platform clients
func (s *DeploymentService) HealthCheck(ctx context.Context) map[string]string {
	health := make(map[string]string)

	// Check Google Ads client
	if err := s.googleAdsClient.HealthCheck(ctx); err != nil {
		health["google_ads"] = fmt.Sprintf("unhealthy: %v", err)
	} else {
		health["google_ads"] = "healthy"
	}

	// Check Meta client
	if err := s.metaClient.HealthCheck(ctx); err != nil {
		health["meta"] = fmt.Sprintf("unhealthy: %v", err)
	} else {
		health["meta"] = "healthy"
	}

	// Check NATS client
	if err := s.natsClient.HealthCheck(); err != nil {
		health["nats"] = fmt.Sprintf("unhealthy: %v", err)
	} else {
		health["nats"] = "healthy"
	}

	return health
}

// GetDeploymentStats returns deployment statistics
func (s *DeploymentService) GetDeploymentStats() map[string]interface{} {
	// In a real implementation, you would track these metrics
	return map[string]interface{}{
		"total_deployments":     0,
		"successful_deployments": 0,
		"failed_deployments":    0,
		"average_duration":      "0s",
		"platforms": map[string]interface{}{
			"google_ads": map[string]interface{}{
				"deployments": 0,
				"success_rate": "0%",
			},
			"meta": map[string]interface{}{
				"deployments": 0,
				"success_rate": "0%",
			},
		},
	}
}

// Helper functions

func countFailedDeployments(results []models.DeploymentResult) int {
	count := 0
	for _, result := range results {
		if result.Status == models.DeploymentStatusFailed {
			count++
		}
	}
	return count
} 
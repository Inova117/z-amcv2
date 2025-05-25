package mocks

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/zamc/connectors/internal/models"
)

// MockGoogleAdsClient is a mock implementation of the Google Ads client
type MockGoogleAdsClient struct {
	mu                    sync.RWMutex
	deployments           []models.DeploymentRequest
	shouldFailDeployment  bool
	shouldFailHealthCheck bool
	deploymentDelay       time.Duration
}

// NewMockGoogleAdsClient creates a new mock Google Ads client
func NewMockGoogleAdsClient() *MockGoogleAdsClient {
	return &MockGoogleAdsClient{
		deployments: make([]models.DeploymentRequest, 0),
	}
}

// DeployAsset mocks deploying an asset to Google Ads
func (m *MockGoogleAdsClient) DeployAsset(ctx context.Context, request *models.DeploymentRequest) (*models.DeploymentResult, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	// Simulate deployment delay
	if m.deploymentDelay > 0 {
		select {
		case <-time.After(m.deploymentDelay):
		case <-ctx.Done():
			return nil, ctx.Err()
		}
	}

	if m.shouldFailDeployment {
		return &models.DeploymentResult{
			AssetID:    request.AssetID,
			Platform:   models.PlatformGoogleAds,
			Status:     models.DeploymentStatusFailed,
			Error:      "mock deployment failure",
			DeployedAt: time.Now(),
			Metrics: models.DeploymentMetrics{
				Duration: m.deploymentDelay,
			},
		}, &MockError{Message: "mock deployment failure"}
	}

	m.deployments = append(m.deployments, *request)

	return &models.DeploymentResult{
		AssetID:     request.AssetID,
		Platform:    models.PlatformGoogleAds,
		Status:      models.DeploymentStatusSuccess,
		PlatformID:  fmt.Sprintf("gads_%d", time.Now().Unix()),
		PlatformURL: "https://ads.google.com/aw/ads?campaignId=mock_campaign",
		DeployedAt:  time.Now(),
		Metrics: models.DeploymentMetrics{
			Duration:     m.deploymentDelay,
			RetryCount:   0,
			DataSent:     1024,
			DataReceived: 512,
		},
	}, nil
}

// HealthCheck mocks the health check
func (m *MockGoogleAdsClient) HealthCheck(ctx context.Context) error {
	m.mu.RLock()
	defer m.mu.RUnlock()

	if m.shouldFailHealthCheck {
		return &MockError{Message: "mock Google Ads health check failed"}
	}
	return nil
}

// Test helper methods

// GetDeployments returns all deployments
func (m *MockGoogleAdsClient) GetDeployments() []models.DeploymentRequest {
	m.mu.RLock()
	defer m.mu.RUnlock()

	deployments := make([]models.DeploymentRequest, len(m.deployments))
	copy(deployments, m.deployments)
	return deployments
}

// SetShouldFailDeployment sets whether deployments should fail
func (m *MockGoogleAdsClient) SetShouldFailDeployment(shouldFail bool) {
	m.mu.Lock()
	defer m.mu.Unlock()

	m.shouldFailDeployment = shouldFail
}

// SetShouldFailHealthCheck sets whether health checks should fail
func (m *MockGoogleAdsClient) SetShouldFailHealthCheck(shouldFail bool) {
	m.mu.Lock()
	defer m.mu.Unlock()

	m.shouldFailHealthCheck = shouldFail
}

// SetDeploymentDelay sets the deployment delay
func (m *MockGoogleAdsClient) SetDeploymentDelay(delay time.Duration) {
	m.mu.Lock()
	defer m.mu.Unlock()

	m.deploymentDelay = delay
}

// ClearDeployments clears all deployments
func (m *MockGoogleAdsClient) ClearDeployments() {
	m.mu.Lock()
	defer m.mu.Unlock()

	m.deployments = make([]models.DeploymentRequest, 0)
}

// MockMetaClient is a mock implementation of the Meta client
type MockMetaClient struct {
	mu                    sync.RWMutex
	deployments           []models.DeploymentRequest
	shouldFailDeployment  bool
	shouldFailHealthCheck bool
	deploymentDelay       time.Duration
}

// NewMockMetaClient creates a new mock Meta client
func NewMockMetaClient() *MockMetaClient {
	return &MockMetaClient{
		deployments: make([]models.DeploymentRequest, 0),
	}
}

// DeployAsset mocks deploying an asset to Meta
func (m *MockMetaClient) DeployAsset(ctx context.Context, request *models.DeploymentRequest) (*models.DeploymentResult, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	// Simulate deployment delay
	if m.deploymentDelay > 0 {
		select {
		case <-time.After(m.deploymentDelay):
		case <-ctx.Done():
			return nil, ctx.Err()
		}
	}

	if m.shouldFailDeployment {
		return &models.DeploymentResult{
			AssetID:    request.AssetID,
			Platform:   models.PlatformMeta,
			Status:     models.DeploymentStatusFailed,
			Error:      "mock deployment failure",
			DeployedAt: time.Now(),
			Metrics: models.DeploymentMetrics{
				Duration: m.deploymentDelay,
			},
		}, &MockError{Message: "mock deployment failure"}
	}

	m.deployments = append(m.deployments, *request)

	return &models.DeploymentResult{
		AssetID:     request.AssetID,
		Platform:    models.PlatformMeta,
		Status:      models.DeploymentStatusSuccess,
		PlatformID:  fmt.Sprintf("meta_%d", time.Now().Unix()),
		PlatformURL: "https://www.facebook.com/adsmanager/manage/campaigns?act=mock_account",
		DeployedAt:  time.Now(),
		Metrics: models.DeploymentMetrics{
			Duration:     m.deploymentDelay,
			RetryCount:   0,
			DataSent:     2048,
			DataReceived: 1024,
		},
	}, nil
}

// HealthCheck mocks the health check
func (m *MockMetaClient) HealthCheck(ctx context.Context) error {
	m.mu.RLock()
	defer m.mu.RUnlock()

	if m.shouldFailHealthCheck {
		return &MockError{Message: "mock Meta health check failed"}
	}
	return nil
}

// Test helper methods

// GetDeployments returns all deployments
func (m *MockMetaClient) GetDeployments() []models.DeploymentRequest {
	m.mu.RLock()
	defer m.mu.RUnlock()

	deployments := make([]models.DeploymentRequest, len(m.deployments))
	copy(deployments, m.deployments)
	return deployments
}

// SetShouldFailDeployment sets whether deployments should fail
func (m *MockMetaClient) SetShouldFailDeployment(shouldFail bool) {
	m.mu.Lock()
	defer m.mu.Unlock()

	m.shouldFailDeployment = shouldFail
}

// SetShouldFailHealthCheck sets whether health checks should fail
func (m *MockMetaClient) SetShouldFailHealthCheck(shouldFail bool) {
	m.mu.Lock()
	defer m.mu.Unlock()

	m.shouldFailHealthCheck = shouldFail
}

// SetDeploymentDelay sets the deployment delay
func (m *MockMetaClient) SetDeploymentDelay(delay time.Duration) {
	m.mu.Lock()
	defer m.mu.Unlock()

	m.deploymentDelay = delay
}

// ClearDeployments clears all deployments
func (m *MockMetaClient) ClearDeployments() {
	m.mu.Lock()
	defer m.mu.Unlock()

	m.deployments = make([]models.DeploymentRequest, 0)
} 
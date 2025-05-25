package mocks

import (
	"context"
	"sync"

	"github.com/zamc/connectors/internal/models"
	"github.com/zamc/connectors/internal/nats"
)

// MockNATSClient is a mock implementation of the NATS client
type MockNATSClient struct {
	mu                    sync.RWMutex
	connected             bool
	publishedEvents       []interface{}
	subscriptionHandler   nats.EventHandler
	shouldFailHealthCheck bool
	shouldFailPublish     bool
}

// NewMockNATSClient creates a new mock NATS client
func NewMockNATSClient() *MockNATSClient {
	return &MockNATSClient{
		connected:       true,
		publishedEvents: make([]interface{}, 0),
	}
}

// SubscribeToAssetStatusChanged mocks the subscription to asset status changed events
func (m *MockNATSClient) SubscribeToAssetStatusChanged(ctx context.Context, handler nats.EventHandler) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	
	m.subscriptionHandler = handler
	
	// Wait for context cancellation
	<-ctx.Done()
	return nil
}

// PublishDeploymentStatusChanged mocks publishing deployment status changed events
func (m *MockNATSClient) PublishDeploymentStatusChanged(ctx context.Context, event *models.DeploymentStatusChangedEvent) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	
	if m.shouldFailPublish {
		return &MockError{Message: "mock publish error"}
	}
	
	m.publishedEvents = append(m.publishedEvents, event)
	return nil
}

// PublishAssetStatusChanged mocks publishing asset status changed events
func (m *MockNATSClient) PublishAssetStatusChanged(ctx context.Context, event *models.AssetStatusChangedEvent) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	
	if m.shouldFailPublish {
		return &MockError{Message: "mock publish error"}
	}
	
	m.publishedEvents = append(m.publishedEvents, event)
	return nil
}

// HealthCheck mocks the health check
func (m *MockNATSClient) HealthCheck() error {
	m.mu.RLock()
	defer m.mu.RUnlock()
	
	if m.shouldFailHealthCheck || !m.connected {
		return &MockError{Message: "mock health check failed"}
	}
	return nil
}

// Close mocks closing the connection
func (m *MockNATSClient) Close() error {
	m.mu.Lock()
	defer m.mu.Unlock()
	
	m.connected = false
	return nil
}

// Test helper methods

// SimulateAssetStatusChangedEvent simulates receiving an asset status changed event
func (m *MockNATSClient) SimulateAssetStatusChangedEvent(ctx context.Context, event *models.AssetStatusChangedEvent) error {
	m.mu.RLock()
	handler := m.subscriptionHandler
	m.mu.RUnlock()
	
	if handler == nil {
		return &MockError{Message: "no subscription handler set"}
	}
	
	return handler.HandleAssetStatusChanged(ctx, event)
}

// GetPublishedEvents returns all published events
func (m *MockNATSClient) GetPublishedEvents() []interface{} {
	m.mu.RLock()
	defer m.mu.RUnlock()
	
	events := make([]interface{}, len(m.publishedEvents))
	copy(events, m.publishedEvents)
	return events
}

// GetPublishedEventsOfType returns published events of a specific type
func (m *MockNATSClient) GetPublishedEventsOfType(eventType string) []interface{} {
	m.mu.RLock()
	defer m.mu.RUnlock()
	
	var filteredEvents []interface{}
	for _, event := range m.publishedEvents {
		switch e := event.(type) {
		case *models.AssetStatusChangedEvent:
			if e.EventType == eventType {
				filteredEvents = append(filteredEvents, e)
			}
		case *models.DeploymentStatusChangedEvent:
			if e.EventType == eventType {
				filteredEvents = append(filteredEvents, e)
			}
		}
	}
	return filteredEvents
}

// ClearPublishedEvents clears all published events
func (m *MockNATSClient) ClearPublishedEvents() {
	m.mu.Lock()
	defer m.mu.Unlock()
	
	m.publishedEvents = make([]interface{}, 0)
}

// SetShouldFailHealthCheck sets whether health checks should fail
func (m *MockNATSClient) SetShouldFailHealthCheck(shouldFail bool) {
	m.mu.Lock()
	defer m.mu.Unlock()
	
	m.shouldFailHealthCheck = shouldFail
}

// SetShouldFailPublish sets whether publish operations should fail
func (m *MockNATSClient) SetShouldFailPublish(shouldFail bool) {
	m.mu.Lock()
	defer m.mu.Unlock()
	
	m.shouldFailPublish = shouldFail
}

// SetConnected sets the connection status
func (m *MockNATSClient) SetConnected(connected bool) {
	m.mu.Lock()
	defer m.mu.Unlock()
	
	m.connected = connected
}

// MockError represents a mock error
type MockError struct {
	Message string
}

func (e *MockError) Error() string {
	return e.Message
} 
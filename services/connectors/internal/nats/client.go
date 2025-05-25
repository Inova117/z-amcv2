package nats

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/nats-io/nats.go"
	"github.com/sirupsen/logrus"
	"github.com/zamc/connectors/internal/config"
	"github.com/zamc/connectors/internal/models"
)

// Client represents a NATS client
type Client struct {
	conn   *nats.Conn
	config *config.NATSConfig
	logger *logrus.Logger
}

// EventHandler defines the interface for handling events
type EventHandler interface {
	HandleAssetStatusChanged(ctx context.Context, event *models.AssetStatusChangedEvent) error
}

// NewClient creates a new NATS client
func NewClient(cfg *config.NATSConfig, logger *logrus.Logger) (*Client, error) {
	conn, err := nats.Connect(cfg.URL,
		nats.ReconnectWait(2*time.Second),
		nats.MaxReconnects(-1),
		nats.DisconnectErrHandler(func(nc *nats.Conn, err error) {
			logger.WithError(err).Warn("NATS disconnected")
		}),
		nats.ReconnectHandler(func(nc *nats.Conn) {
			logger.Info("NATS reconnected")
		}),
		nats.ClosedHandler(func(nc *nats.Conn) {
			logger.Info("NATS connection closed")
		}),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to NATS: %w", err)
	}

	logger.WithField("url", cfg.URL).Info("Connected to NATS")

	return &Client{
		conn:   conn,
		config: cfg,
		logger: logger,
	}, nil
}

// SubscribeToAssetStatusChanged subscribes to asset status changed events
func (c *Client) SubscribeToAssetStatusChanged(ctx context.Context, handler EventHandler) error {
	subject := fmt.Sprintf("%s.events.asset.status_changed", c.config.SubjectPrefix)
	
	subscription, err := c.conn.QueueSubscribe(subject, c.config.QueueGroup, func(msg *nats.Msg) {
		c.handleAssetStatusChangedMessage(ctx, msg, handler)
	})
	if err != nil {
		return fmt.Errorf("failed to subscribe to %s: %w", subject, err)
	}

	c.logger.WithFields(logrus.Fields{
		"subject":     subject,
		"queue_group": c.config.QueueGroup,
	}).Info("Subscribed to asset status changed events")

	// Wait for context cancellation
	<-ctx.Done()
	
	if err := subscription.Unsubscribe(); err != nil {
		c.logger.WithError(err).Error("Failed to unsubscribe from asset status changed events")
	}

	return nil
}

// handleAssetStatusChangedMessage handles incoming asset status changed messages
func (c *Client) handleAssetStatusChangedMessage(ctx context.Context, msg *nats.Msg, handler EventHandler) {
	logger := c.logger.WithField("subject", msg.Subject)

	var event models.AssetStatusChangedEvent
	if err := json.Unmarshal(msg.Data, &event); err != nil {
		logger.WithError(err).Error("Failed to unmarshal asset status changed event")
		return
	}

	logger = logger.WithFields(logrus.Fields{
		"asset_id":   event.AssetID,
		"project_id": event.ProjectID,
		"status":     event.Status,
		"prev_status": event.PrevStatus,
	})

	// Only process approved assets
	if event.Status != models.AssetStatusApproved {
		logger.Debug("Ignoring non-approved asset status change")
		return
	}

	logger.Info("Processing approved asset for deployment")

	if err := handler.HandleAssetStatusChanged(ctx, &event); err != nil {
		logger.WithError(err).Error("Failed to handle asset status changed event")
		// Don't acknowledge the message so it can be retried
		return
	}

	// Acknowledge the message
	if err := msg.Ack(); err != nil {
		logger.WithError(err).Error("Failed to acknowledge message")
	}
}

// PublishDeploymentStatusChanged publishes a deployment status changed event
func (c *Client) PublishDeploymentStatusChanged(ctx context.Context, event *models.DeploymentStatusChangedEvent) error {
	subject := fmt.Sprintf("%s.events.asset.status_changed", c.config.SubjectPrefix)

	data, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("failed to marshal deployment status changed event: %w", err)
	}

	if err := c.conn.Publish(subject, data); err != nil {
		return fmt.Errorf("failed to publish deployment status changed event: %w", err)
	}

	c.logger.WithFields(logrus.Fields{
		"subject":   subject,
		"asset_id":  event.AssetID,
		"platform":  event.Platform,
		"status":    event.Status,
	}).Info("Published deployment status changed event")

	return nil
}

// PublishAssetStatusChanged publishes an asset status changed event
func (c *Client) PublishAssetStatusChanged(ctx context.Context, event *models.AssetStatusChangedEvent) error {
	subject := fmt.Sprintf("%s.events.asset.status_changed", c.config.SubjectPrefix)

	data, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("failed to marshal asset status changed event: %w", err)
	}

	if err := c.conn.Publish(subject, data); err != nil {
		return fmt.Errorf("failed to publish asset status changed event: %w", err)
	}

	c.logger.WithFields(logrus.Fields{
		"subject":  subject,
		"asset_id": event.AssetID,
		"status":   event.Status,
	}).Info("Published asset status changed event")

	return nil
}

// HealthCheck checks the health of the NATS connection
func (c *Client) HealthCheck() error {
	if c.conn == nil {
		return fmt.Errorf("NATS connection is nil")
	}

	if !c.conn.IsConnected() {
		return fmt.Errorf("NATS is not connected")
	}

	return nil
}

// Close closes the NATS connection
func (c *Client) Close() error {
	if c.conn != nil {
		c.conn.Close()
		c.logger.Info("NATS connection closed")
	}
	return nil
} 
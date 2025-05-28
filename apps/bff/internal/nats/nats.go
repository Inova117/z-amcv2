package nats

import (
	"encoding/json"
	"fmt"

	"github.com/nats-io/nats.go"
)

type Conn struct {
	*nats.Conn
}

func Connect(natsURL string) (*Conn, error) {
	nc, err := nats.Connect(natsURL)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to NATS: %w", err)
	}

	return &Conn{Conn: nc}, nil
}

func (c *Conn) Close() {
	c.Conn.Close()
}

func (c *Conn) PublishBoardUpdate(boardID string, data interface{}) error {
	subject := fmt.Sprintf("board.%s.updated", boardID)
	
	payload, err := json.Marshal(data)
	if err != nil {
		return fmt.Errorf("failed to marshal data: %w", err)
	}

	return c.Publish(subject, payload)
}

func (c *Conn) SubscribeBoardUpdates(boardID string, handler func([]byte)) (*nats.Subscription, error) {
	subject := fmt.Sprintf("board.%s.updated", boardID)
	
	return c.Subscribe(subject, func(msg *nats.Msg) {
		handler(msg.Data)
	})
}

func (c *Conn) SubscribeCampaignMetricsUpdated(projectID string, handler func([]byte)) (*nats.Subscription, error) {
	subject := "zamc.events.campaign.metrics_updated"
	
	return c.Subscribe(subject, func(msg *nats.Msg) {
		handler(msg.Data)
	})
}

func (c *Conn) SubscribeCampaignPerformanceAlert(projectID string, handler func([]byte)) (*nats.Subscription, error) {
	subject := "zamc.events.campaign.performance_alert"
	
	return c.Subscribe(subject, func(msg *nats.Msg) {
		handler(msg.Data)
	})
}

func (c *Conn) SubscribeCampaignBudgetExceeded(projectID string, handler func([]byte)) (*nats.Subscription, error) {
	subject := "zamc.events.campaign.budget_exceeded"
	
	return c.Subscribe(subject, func(msg *nats.Msg) {
		handler(msg.Data)
	})
}

func (c *Conn) SubscribeCampaignPerformanceThreshold(projectID string, handler func([]byte)) (*nats.Subscription, error) {
	subject := "zamc.events.campaign.performance_threshold"
	
	return c.Subscribe(subject, func(msg *nats.Msg) {
		handler(msg.Data)
	})
} 
package config

import (
	"time"

	"github.com/kelseyhightower/envconfig"
)

// Config holds all configuration for the connectors service
type Config struct {
	// Server Configuration
	Port        int    `envconfig:"PORT" default:"8002"`
	LogLevel    string `envconfig:"LOG_LEVEL" default:"info"`
	Environment string `envconfig:"ENVIRONMENT" default:"development"`

	// NATS Configuration
	NATS NATSConfig

	// Google Ads Configuration
	GoogleAds GoogleAdsConfig

	// Meta Marketing API Configuration
	Meta MetaConfig

	// Deployment Configuration
	Deployment DeploymentConfig

	// Health Check Configuration
	HealthCheck HealthCheckConfig

	// Monitoring Configuration
	Monitoring MonitoringConfig
}

// NATSConfig holds NATS-specific configuration
type NATSConfig struct {
	URL           string `envconfig:"NATS_URL" default:"nats://localhost:4222"`
	SubjectPrefix string `envconfig:"NATS_SUBJECT_PREFIX" default:"zamc"`
	QueueGroup    string `envconfig:"NATS_QUEUE_GROUP" default:"connectors"`
}

// GoogleAdsConfig holds Google Ads API configuration
type GoogleAdsConfig struct {
	DeveloperToken    string `envconfig:"GOOGLE_ADS_DEVELOPER_TOKEN" required:"true"`
	ClientID          string `envconfig:"GOOGLE_ADS_CLIENT_ID" required:"true"`
	ClientSecret      string `envconfig:"GOOGLE_ADS_CLIENT_SECRET" required:"true"`
	RefreshToken      string `envconfig:"GOOGLE_ADS_REFRESH_TOKEN" required:"true"`
	CustomerID        string `envconfig:"GOOGLE_ADS_CUSTOMER_ID" required:"true"`
	LoginCustomerID   string `envconfig:"GOOGLE_ADS_LOGIN_CUSTOMER_ID"`
}

// MetaConfig holds Meta Marketing API configuration
type MetaConfig struct {
	AppID       string `envconfig:"META_APP_ID" required:"true"`
	AppSecret   string `envconfig:"META_APP_SECRET" required:"true"`
	AccessToken string `envconfig:"META_ACCESS_TOKEN" required:"true"`
	AdAccountID string `envconfig:"META_AD_ACCOUNT_ID" required:"true"`
	APIVersion  string `envconfig:"META_API_VERSION" default:"v18.0"`
}

// DeploymentConfig holds deployment-specific configuration
type DeploymentConfig struct {
	MaxRetryAttempts int           `envconfig:"MAX_RETRY_ATTEMPTS" default:"3"`
	RetryDelay       time.Duration `envconfig:"RETRY_DELAY_SECONDS" default:"5s"`
	Timeout          time.Duration `envconfig:"DEPLOYMENT_TIMEOUT_SECONDS" default:"300s"`
}

// HealthCheckConfig holds health check configuration
type HealthCheckConfig struct {
	Interval time.Duration `envconfig:"HEALTH_CHECK_INTERVAL" default:"30s"`
	Timeout  time.Duration `envconfig:"HEALTH_CHECK_TIMEOUT" default:"10s"`
}

// MonitoringConfig holds monitoring configuration
type MonitoringConfig struct {
	EnableMetrics bool `envconfig:"ENABLE_METRICS" default:"true"`
	MetricsPort   int  `envconfig:"METRICS_PORT" default:"8003"`
}

// Load loads configuration from environment variables
func Load() (*Config, error) {
	var cfg Config
	if err := envconfig.Process("", &cfg); err != nil {
		return nil, err
	}
	return &cfg, nil
}

// IsDevelopment returns true if running in development mode
func (c *Config) IsDevelopment() bool {
	return c.Environment == "development" || c.Environment == "dev"
}

// IsProduction returns true if running in production mode
func (c *Config) IsProduction() bool {
	return c.Environment == "production" || c.Environment == "prod"
} 
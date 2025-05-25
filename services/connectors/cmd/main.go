package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/joho/godotenv"
	"github.com/sirupsen/logrus"

	"github.com/zamc/connectors/internal/config"
	"github.com/zamc/connectors/internal/nats"
	"github.com/zamc/connectors/internal/platforms/googleads"
	"github.com/zamc/connectors/internal/platforms/meta"
	"github.com/zamc/connectors/internal/service"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		logrus.Warn("No .env file found, using environment variables")
	}

	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		logrus.WithError(err).Fatal("Failed to load configuration")
	}

	// Setup logging
	logger := setupLogging(cfg.LogLevel)
	logger.WithFields(logrus.Fields{
		"version":     "1.0.0",
		"environment": cfg.Environment,
		"port":        cfg.Port,
	}).Info("Starting ZAMC Ad Deployment Connectors service")

	// Initialize clients
	googleAdsClient, err := googleads.NewClient(&cfg.GoogleAds, logger)
	if err != nil {
		logger.WithError(err).Fatal("Failed to initialize Google Ads client")
	}

	metaClient, err := meta.NewClient(&cfg.Meta, logger)
	if err != nil {
		logger.WithError(err).Fatal("Failed to initialize Meta client")
	}

	natsClient, err := nats.NewClient(&cfg.NATS, logger)
	if err != nil {
		logger.WithError(err).Fatal("Failed to initialize NATS client")
	}

	// Initialize deployment service
	deploymentService := service.NewDeploymentService(
		googleAdsClient,
		metaClient,
		natsClient,
		&cfg.Deployment,
		logger,
	)

	// Create context for graceful shutdown
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Start HTTP server for health checks
	httpServer := startHTTPServer(cfg.Port, deploymentService, logger)

	// Start NATS event listener
	go func() {
		logger.Info("Starting NATS event listener")
		if err := natsClient.SubscribeToAssetStatusChanged(ctx, deploymentService); err != nil {
			logger.WithError(err).Error("NATS subscription failed")
		}
	}()

	// Wait for shutdown signal
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	logger.Info("Service started successfully, waiting for events...")
	<-sigChan

	logger.Info("Shutdown signal received, gracefully shutting down...")

	// Cancel context to stop NATS subscription
	cancel()

	// Shutdown HTTP server
	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer shutdownCancel()

	if err := httpServer.Shutdown(shutdownCtx); err != nil {
		logger.WithError(err).Error("HTTP server shutdown failed")
	}

	// Close NATS connection
	if err := natsClient.Close(); err != nil {
		logger.WithError(err).Error("Failed to close NATS connection")
	}

	logger.Info("Service shutdown completed")
}

// setupLogging configures the logger
func setupLogging(level string) *logrus.Logger {
	logger := logrus.New()
	
	// Set log level
	logLevel, err := logrus.ParseLevel(level)
	if err != nil {
		logLevel = logrus.InfoLevel
	}
	logger.SetLevel(logLevel)

	// Set JSON formatter for structured logging
	logger.SetFormatter(&logrus.JSONFormatter{
		TimestampFormat: time.RFC3339,
	})

	return logger
}

// startHTTPServer starts the HTTP server for health checks and metrics
func startHTTPServer(port int, deploymentService *service.DeploymentService, logger *logrus.Logger) *http.Server {
	mux := http.NewServeMux()

	// Health check endpoint
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
		defer cancel()

		health := deploymentService.HealthCheck(ctx)
		
		// Determine overall health
		allHealthy := true
		for _, status := range health {
			if status != "healthy" {
				allHealthy = false
				break
			}
		}

		w.Header().Set("Content-Type", "application/json")
		if !allHealthy {
			w.WriteHeader(http.StatusServiceUnavailable)
		}

		response := map[string]interface{}{
			"status":    getOverallStatus(allHealthy),
			"timestamp": time.Now().Format(time.RFC3339),
			"version":   "1.0.0",
			"services":  health,
		}

		if err := writeJSONResponse(w, response); err != nil {
			logger.WithError(err).Error("Failed to write health check response")
		}
	})

	// Metrics endpoint
	mux.HandleFunc("/metrics", func(w http.ResponseWriter, r *http.Request) {
		stats := deploymentService.GetDeploymentStats()
		
		w.Header().Set("Content-Type", "application/json")
		if err := writeJSONResponse(w, stats); err != nil {
			logger.WithError(err).Error("Failed to write metrics response")
		}
	})

	// Ready endpoint
	mux.HandleFunc("/ready", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		response := map[string]interface{}{
			"status": "ready",
			"timestamp": time.Now().Format(time.RFC3339),
		}
		
		if err := writeJSONResponse(w, response); err != nil {
			logger.WithError(err).Error("Failed to write ready response")
		}
	})

	// Root endpoint
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		response := map[string]interface{}{
			"service":     "ZAMC Ad Deployment Connectors",
			"version":     "1.0.0",
			"description": "Deploys approved assets to Google Ads and Meta Marketing platforms",
			"endpoints": map[string]string{
				"health":  "/health",
				"metrics": "/metrics",
				"ready":   "/ready",
			},
		}
		
		if err := writeJSONResponse(w, response); err != nil {
			logger.WithError(err).Error("Failed to write root response")
		}
	})

	server := &http.Server{
		Addr:         fmt.Sprintf(":%d", port),
		Handler:      mux,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		logger.WithField("port", port).Info("Starting HTTP server")
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.WithError(err).Fatal("HTTP server failed to start")
		}
	}()

	return server
}

// Helper functions

func getOverallStatus(allHealthy bool) string {
	if allHealthy {
		return "healthy"
	}
	return "unhealthy"
}

func writeJSONResponse(w http.ResponseWriter, data interface{}) error {
	w.Header().Set("Content-Type", "application/json")
	
	// Simple JSON encoding without external dependencies
	switch v := data.(type) {
	case map[string]interface{}:
		return writeMapAsJSON(w, v)
	default:
		fmt.Fprintf(w, `{"error": "unsupported data type"}`)
		return nil
	}
}

func writeMapAsJSON(w http.ResponseWriter, data map[string]interface{}) error {
	fmt.Fprint(w, "{")
	first := true
	
	for key, value := range data {
		if !first {
			fmt.Fprint(w, ",")
		}
		first = false
		
		fmt.Fprintf(w, `"%s":`, key)
		
		switch v := value.(type) {
		case string:
			fmt.Fprintf(w, `"%s"`, v)
		case int:
			fmt.Fprintf(w, "%d", v)
		case bool:
			fmt.Fprintf(w, "%t", v)
		case map[string]interface{}:
			writeMapAsJSON(w, v)
		case map[string]string:
			fmt.Fprint(w, "{")
			firstInner := true
			for k, val := range v {
				if !firstInner {
					fmt.Fprint(w, ",")
				}
				firstInner = false
				fmt.Fprintf(w, `"%s":"%s"`, k, val)
			}
			fmt.Fprint(w, "}")
		default:
			fmt.Fprintf(w, `"%v"`, v)
		}
	}
	
	fmt.Fprint(w, "}")
	return nil
} 
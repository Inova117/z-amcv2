package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/99designs/gqlgen/graphql/handler/extension"
	"github.com/99designs/gqlgen/graphql/handler/lru"
	"github.com/99designs/gqlgen/graphql/handler/transport"
	"github.com/99designs/gqlgen/graphql/playground"
	"github.com/go-redis/redis/v8"
	"github.com/gorilla/websocket"
	"github.com/joho/godotenv"
	"github.com/rs/cors"

	"github.com/zerionstudio/zamc-v2/apps/bff/graph"
"github.com/zerionstudio/zamc-v2/apps/bff/graph/generated"
"github.com/zerionstudio/zamc-v2/apps/bff/internal/auth"
"github.com/zerionstudio/zamc-v2/apps/bff/internal/config"
"github.com/zerionstudio/zamc-v2/apps/bff/internal/database"
	"github.com/zerionstudio/zamc-v2/apps/bff/internal/middleware"
"github.com/zerionstudio/zamc-v2/apps/bff/internal/nats"
)

var startTime = time.Now()

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Printf("Warning: .env file not found: %v", err)
	}

	// Initialize configuration
	cfg := config.Load()

	// Initialize database connection
	db, err := database.Connect(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Initialize Redis connection for rate limiting
	redisClient := redis.NewClient(&redis.Options{
		Addr: getRedisAddr(cfg.DatabaseURL), // Extract Redis URL from config
	})
	defer redisClient.Close()

	// Test Redis connection
	if err := redisClient.Ping(context.Background()).Err(); err != nil {
		log.Printf("Warning: Redis connection failed, rate limiting disabled: %v", err)
		redisClient = nil
	}

	// Initialize NATS connection
	natsConn, err := nats.Connect(cfg.NatsURL)
	if err != nil {
		log.Fatalf("Failed to connect to NATS: %v", err)
	}
	defer natsConn.Close()

	// Initialize auth service with Redis support
	var authService *auth.Service
	if redisClient != nil {
		authService = auth.NewServiceWithRedis(cfg.SupabaseJWTSecret, redisClient)
	} else {
		authService = auth.NewService(cfg.SupabaseJWTSecret)
		log.Println("Warning: JWT token blacklisting disabled (Redis unavailable)")
	}

	// Validate JWT secret strength
	if err := authService.ValidateTokenStrength(); err != nil {
		log.Fatalf("JWT configuration error: %v", err)
	}

	// Initialize security middleware
	var rateLimiter *middleware.RateLimiter
	var securityMonitor *middleware.SecurityMonitor
	if redisClient != nil {
		rateLimiter = middleware.NewRateLimiter(redisClient)
		securityMonitor = middleware.NewSecurityMonitor(redisClient)
	}
	inputValidator := middleware.NewInputValidator()

	// Create GraphQL server
	srv := handler.New(generated.NewExecutableSchema(generated.Config{
		Resolvers: &graph.Resolver{
			DB:          db,
			NatsConn:    natsConn,
			AuthService: authService,
		},
	}))

	// Add transports
	srv.AddTransport(transport.Websocket{
		KeepAlivePingInterval: 10,
		Upgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool {
				return checkCORSOrigin(r, cfg.CorsOrigins)
			},
		},
	})
	srv.AddTransport(transport.Options{})
	srv.AddTransport(transport.GET{})
	srv.AddTransport(transport.POST{})
	srv.AddTransport(transport.MultipartForm{})

	// Add extensions based on environment
	srv.SetQueryCache(lru.New(1000))
	
	// SECURITY: Only enable introspection in development
	if cfg.Environment == "development" {
	srv.Use(extension.Introspection{})
		log.Println("GraphQL introspection enabled (development mode)")
	} else {
		log.Println("GraphQL introspection disabled (production mode)")
	}
	
	srv.Use(extension.AutomaticPersistedQuery{
		Cache: lru.New(100),
	})

	// Setup CORS
	c := cors.New(cors.Options{
		AllowedOrigins:   strings.Split(cfg.CorsOrigins, ","),
		AllowedMethods:   []string{"GET", "POST", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type", "Authorization", "X-Requested-With"},
		AllowCredentials: true,
		MaxAge:           300, // 5 minutes
	})

	// Setup routes with security middleware
	mux := http.NewServeMux()

	// Health check endpoint (no security middleware)
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		healthStatus := map[string]interface{}{
			"status":    "healthy",
			"timestamp": time.Now().Format(time.RFC3339),
			"version":   "1.0.0",
			"service":   "ZAMC BFF GraphQL API",
			"services": map[string]string{
				"database": "healthy", // TODO: Add actual database health check
				"redis":    "healthy", // TODO: Add actual Redis health check
				"nats":     "healthy", // TODO: Add actual NATS health check
				"graphql":  "healthy",
			},
			"uptime": time.Since(startTime).String(),
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(healthStatus)
	})

	// GraphQL playground (development only)
	if cfg.Environment == "development" {
		mux.Handle("/", playground.Handler("GraphQL playground", "/query"))
		log.Println("GraphQL playground enabled at /")
	} else {
		mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
			http.Error(w, "Not found", http.StatusNotFound)
		})
	}

	// Security metrics endpoint (protected)
	mux.HandleFunc("/security/metrics", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		// Verify admin access
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			http.Error(w, "Missing authorization header", http.StatusUnauthorized)
			return
		}

		token := strings.TrimPrefix(authHeader, "Bearer ")
		user, err := authService.VerifyToken(token)
		if err != nil || user.Role != "admin" {
			http.Error(w, "Unauthorized", http.StatusForbidden)
			return
		}

		if securityMonitor == nil {
			http.Error(w, "Security monitoring not available", http.StatusServiceUnavailable)
			return
		}

		metrics := securityMonitor.GetSecurityMetrics()
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(metrics)
	})

	// GraphQL endpoint with full security middleware stack
	graphqlHandler := srv
	
	// Apply security middleware in order
	if securityMonitor != nil {
		graphqlHandler = securityMonitor.SecurityMonitoringMiddleware()(graphqlHandler)
		// Use validation middleware with security monitoring
		graphqlHandler = inputValidator.SecurityValidationMiddlewareWithMonitor(securityMonitor)(graphqlHandler)
	} else {
		// Use standard validation middleware
		graphqlHandler = inputValidator.SecurityValidationMiddleware()(graphqlHandler)
	}
	if rateLimiter != nil {
		graphqlHandler = rateLimiter.GraphQLRateLimitMiddleware()(graphqlHandler)
	}
	graphqlHandler = authMiddleware(authService, securityMonitor, graphqlHandler)
	graphqlHandler = c.Handler(graphqlHandler)

	mux.Handle("/query", graphqlHandler)

	// Add authentication endpoints
	mux.HandleFunc("/auth/refresh", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		var request struct {
			RefreshToken string `json:"refresh_token"`
		}

		if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		// Validate refresh token and generate new token pair
		tokenPair, err := authService.RefreshTokens(request.RefreshToken)
		if err != nil {
			log.Printf("Token refresh failed: %v", err)
			http.Error(w, "Invalid refresh token", http.StatusUnauthorized)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(tokenPair)
	})

	mux.HandleFunc("/auth/logout", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		// Extract token from Authorization header
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			http.Error(w, "Missing authorization header", http.StatusBadRequest)
			return
		}

		token := strings.TrimPrefix(authHeader, "Bearer ")

		// Revoke the token
		if err := authService.RevokeToken(token); err != nil {
			log.Printf("Token revocation failed: %v", err)
			// Don't fail the logout - just log the error
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"status": "logged out"})
	})

	mux.HandleFunc("/auth/logout-all", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		// Extract user from token
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			http.Error(w, "Missing authorization header", http.StatusBadRequest)
			return
		}

		token := strings.TrimPrefix(authHeader, "Bearer ")
		user, err := authService.VerifyToken(token)
		if err != nil {
			http.Error(w, "Invalid token", http.StatusUnauthorized)
			return
		}

		// Revoke all tokens for the user
		if err := authService.RevokeAllUserTokens(user.ID); err != nil {
			log.Printf("Failed to revoke all user tokens: %v", err)
			http.Error(w, "Failed to logout from all devices", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"status": "logged out from all devices"})
	})

	// Start server
	port := cfg.Port
	if port == "" {
		port = "8080"
	}

	log.Printf("Starting server on port %s", port)
	log.Printf("Environment: %s", cfg.Environment)
	log.Printf("CORS origins: %s", cfg.CorsOrigins)
	
	if rateLimiter != nil {
		log.Println("Rate limiting enabled")
	} else {
		log.Println("Rate limiting disabled (Redis unavailable)")
	}

	if err := http.ListenAndServe(":"+port, mux); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}

// checkCORSOrigin validates WebSocket origin against allowed origins
func checkCORSOrigin(r *http.Request, allowedOrigins string) bool {
	origin := r.Header.Get("Origin")
	if origin == "" {
		return false // Reject requests without origin
	}

	for _, allowedOrigin := range strings.Split(allowedOrigins, ",") {
		allowedOrigin = strings.TrimSpace(allowedOrigin)
		if origin == allowedOrigin {
			return true
		}
	}
	
	log.Printf("CORS: Rejected origin %s", origin)
	return false
}

// authMiddleware handles JWT authentication with security monitoring
func authMiddleware(authService *auth.Service, securityMonitor *middleware.SecurityMonitor, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()

		// Extract token from Authorization header
		authHeader := r.Header.Get("Authorization")
		if authHeader != "" && strings.HasPrefix(authHeader, "Bearer ") {
			token := strings.TrimPrefix(authHeader, "Bearer ")
			
			// Verify token and extract user
			user, err := authService.VerifyToken(token)
			if err == nil && user != nil {
				ctx = context.WithValue(ctx, "user", user)
			} else {
				// Log failed authentication attempt
				if securityMonitor != nil {
					securityMonitor.LogFailedAuthentication(r, err.Error())
				}
				log.Printf("Auth: Token verification failed: %v", err)
			}
		}

		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// getRedisAddr extracts Redis address from configuration
func getRedisAddr(databaseURL string) string {
	// This is a simple implementation - in production, you'd have a separate Redis URL
	// For now, assume Redis is on localhost:6379
	redisURL := os.Getenv("REDIS_URL")
	if redisURL == "" {
		return "localhost:6379"
	}
	
	// Parse Redis URL to extract address
	if strings.HasPrefix(redisURL, "redis://") {
		redisURL = strings.TrimPrefix(redisURL, "redis://")
		if idx := strings.Index(redisURL, "@"); idx != -1 {
			redisURL = redisURL[idx+1:]
		}
	}
	
	return redisURL
} 
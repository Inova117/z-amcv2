package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/99designs/gqlgen/graphql/handler/extension"
	"github.com/99designs/gqlgen/graphql/handler/lru"
	"github.com/99designs/gqlgen/graphql/handler/transport"
	"github.com/99designs/gqlgen/graphql/playground"
	"github.com/gorilla/websocket"
	"github.com/joho/godotenv"

	"github.com/zerionstudio/zamc-v2/apps/bff/graph"
"github.com/zerionstudio/zamc-v2/apps/bff/graph/generated"
"github.com/zerionstudio/zamc-v2/apps/bff/internal/auth"
"github.com/zerionstudio/zamc-v2/apps/bff/internal/config"
"github.com/zerionstudio/zamc-v2/apps/bff/internal/database"
"github.com/zerionstudio/zamc-v2/apps/bff/internal/nats"


)

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

	// Initialize NATS connection
	natsConn, err := nats.Connect(cfg.NatsURL)
	if err != nil {
		log.Fatalf("Failed to connect to NATS: %v", err)
	}
	defer natsConn.Close()

	// Initialize auth service
	authService := auth.NewService(cfg.SupabaseJWTSecret)

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
				origin := r.Header.Get("Origin")
				for _, allowedOrigin := range strings.Split(cfg.CorsOrigins, ",") {
					if origin == strings.TrimSpace(allowedOrigin) {
						return true
					}
				}
				return false
			},
		},
	})
	srv.AddTransport(transport.Options{})
	srv.AddTransport(transport.GET{})
	srv.AddTransport(transport.POST{})
	srv.AddTransport(transport.MultipartForm{})

	// Add extensions
	srv.SetQueryCache(lru.New(1000))
	srv.Use(extension.Introspection{})
	srv.Use(extension.AutomaticPersistedQuery{
		Cache: lru.New(100),
	})

	// Setup routes
	http.Handle("/", playground.Handler("GraphQL playground", "/query"))
	http.Handle("/query", corsMiddleware(authMiddleware(authService, srv), cfg.CorsOrigins))

	// Health check endpoint
	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	})

	log.Printf("Server starting on port %s", cfg.Port)
	log.Printf("GraphQL playground available at http://localhost:%s/", cfg.Port)
	log.Fatal(http.ListenAndServe(":"+cfg.Port, nil))
}

func corsMiddleware(next http.Handler, origins string) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		for _, allowedOrigin := range strings.Split(origins, ",") {
			if origin == strings.TrimSpace(allowedOrigin) {
				w.Header().Set("Access-Control-Allow-Origin", origin)
				break
			}
		}
		
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Access-Control-Allow-Credentials", "true")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func authMiddleware(authService *auth.Service, next http.Handler) http.Handler {
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
			}
		}

		next.ServeHTTP(w, r.WithContext(ctx))
	})
} 
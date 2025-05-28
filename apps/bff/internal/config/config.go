package config

import (
	"os"
)

type Config struct {
	Port               string
	DatabaseURL        string
	NatsURL           string
	SupabaseURL       string
	SupabaseServiceKey string
	SupabaseJWTSecret string
	CorsOrigins       string
	Environment       string
}

func Load() *Config {
	return &Config{
		Port:               getEnv("PORT", "8080"),
		DatabaseURL:        getEnv("DATABASE_URL", "postgresql://postgres:password@localhost:54322/postgres"),
		NatsURL:           getEnv("NATS_URL", "nats://localhost:4222"),
		SupabaseURL:       getEnv("SUPABASE_URL", ""),
		SupabaseServiceKey: getEnv("SUPABASE_SERVICE_KEY", ""),
		SupabaseJWTSecret: getEnv("SUPABASE_JWT_SECRET", ""),
		CorsOrigins:       getEnv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000"),
		Environment:       getEnv("ENVIRONMENT", "development"),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
} 
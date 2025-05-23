# ZAMC BFF Makefile

.PHONY: help build run test clean generate docker-build docker-run docker-stop deps install

# Default target
help:
	@echo "Available targets:"
	@echo "  build        - Build the Go binary"
	@echo "  run          - Run the server locally"
	@echo "  test         - Run tests"
	@echo "  clean        - Clean build artifacts"
	@echo "  generate     - Generate GraphQL code"
	@echo "  docker-build - Build Docker image"
	@echo "  docker-run   - Run with Docker Compose"
	@echo "  docker-stop  - Stop Docker Compose"
	@echo "  deps         - Download Go dependencies"
	@echo "  install      - Install development tools"

# Build the Go binary
build:
	go build -o bin/zamc-bff main.go

# Run the server locally
run:
	go run main.go

# Run tests
test:
	go test ./...

# Clean build artifacts
clean:
	rm -rf bin/
	rm -rf graph/generated/

# Generate GraphQL code
generate:
	go run github.com/99designs/gqlgen generate

# Download Go dependencies
deps:
	go mod download
	go mod tidy

# Install development tools
install:
	go install github.com/99designs/gqlgen@latest

# Docker targets
docker-build:
	docker build -t zamc-bff .

docker-run:
	docker-compose up -d

docker-stop:
	docker-compose down

docker-logs:
	docker-compose logs -f bff

# Development database setup
db-setup:
	@echo "Setting up database schema..."
	@if [ -z "$(DATABASE_URL)" ]; then \
		echo "DATABASE_URL environment variable is required"; \
		exit 1; \
	fi
	psql "$(DATABASE_URL)" -f schema.sql

# Lint code
lint:
	golangci-lint run

# Format code
fmt:
	go fmt ./...

# Security check
security:
	gosec ./...

# Full development setup
dev-setup: install deps generate
	@echo "Development setup complete!"

# Production build
prod-build:
	CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -ldflags '-w -s' -o bin/zamc-bff main.go 
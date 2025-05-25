# Variables
APP_NAME := zamc-connectors
VERSION := $(shell git describe --tags --always --dirty 2>/dev/null || echo "dev")
BUILD_TIME := $(shell date -u +"%Y-%m-%dT%H:%M:%SZ")
GO_VERSION := $(shell go version | awk '{print $$3}')

# Docker
DOCKER_IMAGE := $(APP_NAME)
DOCKER_TAG := $(VERSION)

# Directories
BUILD_DIR := ./build
COVERAGE_DIR := ./coverage

# Go build flags
LDFLAGS := -ldflags="-X main.Version=$(VERSION) -X main.BuildTime=$(BUILD_TIME) -X main.GoVersion=$(GO_VERSION)"

.PHONY: help
help: ## Show this help message
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

.PHONY: setup
setup: ## Install development dependencies
	@echo "Installing development dependencies..."
	go mod download
	go mod tidy
	go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
	go install github.com/securecodewarrior/sast-scan@latest

.PHONY: clean
clean: ## Clean build artifacts
	@echo "Cleaning build artifacts..."
	rm -rf $(BUILD_DIR)
	rm -rf $(COVERAGE_DIR)
	go clean -cache
	go clean -testcache

.PHONY: fmt
fmt: ## Format Go code
	@echo "Formatting Go code..."
	go fmt ./...
	goimports -w .

.PHONY: lint
lint: ## Run linters
	@echo "Running linters..."
	golangci-lint run ./...

.PHONY: vet
vet: ## Run go vet
	@echo "Running go vet..."
	go vet ./...

.PHONY: test
test: ## Run tests
	@echo "Running tests..."
	mkdir -p $(COVERAGE_DIR)
	go test -v -race -coverprofile=$(COVERAGE_DIR)/coverage.out ./...

.PHONY: test-integration
test-integration: ## Run integration tests
	@echo "Running integration tests..."
	mkdir -p $(COVERAGE_DIR)
	go test -v -race -tags=integration -coverprofile=$(COVERAGE_DIR)/integration.out ./tests/...

.PHONY: test-coverage
test-coverage: test ## Generate test coverage report
	@echo "Generating coverage report..."
	go tool cover -html=$(COVERAGE_DIR)/coverage.out -o $(COVERAGE_DIR)/coverage.html
	go tool cover -func=$(COVERAGE_DIR)/coverage.out

.PHONY: test-all
test-all: test test-integration ## Run all tests

.PHONY: build
build: ## Build the application
	@echo "Building $(APP_NAME)..."
	mkdir -p $(BUILD_DIR)
	go build $(LDFLAGS) -o $(BUILD_DIR)/$(APP_NAME) ./cmd/main.go

.PHONY: build-linux
build-linux: ## Build for Linux
	@echo "Building $(APP_NAME) for Linux..."
	mkdir -p $(BUILD_DIR)
	GOOS=linux GOARCH=amd64 go build $(LDFLAGS) -o $(BUILD_DIR)/$(APP_NAME)-linux-amd64 ./cmd/main.go

.PHONY: build-windows
build-windows: ## Build for Windows
	@echo "Building $(APP_NAME) for Windows..."
	mkdir -p $(BUILD_DIR)
	GOOS=windows GOARCH=amd64 go build $(LDFLAGS) -o $(BUILD_DIR)/$(APP_NAME)-windows-amd64.exe ./cmd/main.go

.PHONY: build-darwin
build-darwin: ## Build for macOS
	@echo "Building $(APP_NAME) for macOS..."
	mkdir -p $(BUILD_DIR)
	GOOS=darwin GOARCH=amd64 go build $(LDFLAGS) -o $(BUILD_DIR)/$(APP_NAME)-darwin-amd64 ./cmd/main.go

.PHONY: build-all
build-all: build-linux build-windows build-darwin ## Build for all platforms

.PHONY: run
run: ## Run the application locally
	@echo "Running $(APP_NAME)..."
	go run ./cmd/main.go

.PHONY: run-dev
run-dev: ## Run with development settings
	@echo "Running $(APP_NAME) in development mode..."
	LOG_LEVEL=debug ENVIRONMENT=development go run ./cmd/main.go

.PHONY: docker-build
docker-build: ## Build Docker image
	@echo "Building Docker image $(DOCKER_IMAGE):$(DOCKER_TAG)..."
	docker build -t $(DOCKER_IMAGE):$(DOCKER_TAG) .
	docker tag $(DOCKER_IMAGE):$(DOCKER_TAG) $(DOCKER_IMAGE):latest

.PHONY: docker-run
docker-run: ## Run Docker container
	@echo "Running Docker container..."
	docker run --rm -p 8002:8002 --env-file .env $(DOCKER_IMAGE):$(DOCKER_TAG)

.PHONY: docker-push
docker-push: docker-build ## Push Docker image
	@echo "Pushing Docker image..."
	docker push $(DOCKER_IMAGE):$(DOCKER_TAG)
	docker push $(DOCKER_IMAGE):latest

.PHONY: docker-compose-up
docker-compose-up: ## Start services with docker-compose
	@echo "Starting services with docker-compose..."
	docker-compose up -d

.PHONY: docker-compose-down
docker-compose-down: ## Stop services with docker-compose
	@echo "Stopping services with docker-compose..."
	docker-compose down

.PHONY: docker-compose-logs
docker-compose-logs: ## View docker-compose logs
	docker-compose logs -f

.PHONY: deps
deps: ## Download dependencies
	@echo "Downloading dependencies..."
	go mod download
	go mod tidy

.PHONY: deps-update
deps-update: ## Update dependencies
	@echo "Updating dependencies..."
	go get -u ./...
	go mod tidy

.PHONY: security-scan
security-scan: ## Run security scan
	@echo "Running security scan..."
	gosec ./...

.PHONY: benchmark
benchmark: ## Run benchmarks
	@echo "Running benchmarks..."
	go test -bench=. -benchmem ./...

.PHONY: profile
profile: ## Run with profiling
	@echo "Running with profiling..."
	go run ./cmd/main.go -cpuprofile=cpu.prof -memprofile=mem.prof

.PHONY: install
install: build ## Install the binary
	@echo "Installing $(APP_NAME)..."
	cp $(BUILD_DIR)/$(APP_NAME) $(GOPATH)/bin/

.PHONY: uninstall
uninstall: ## Uninstall the binary
	@echo "Uninstalling $(APP_NAME)..."
	rm -f $(GOPATH)/bin/$(APP_NAME)

.PHONY: generate
generate: ## Run go generate
	@echo "Running go generate..."
	go generate ./...

.PHONY: mod-verify
mod-verify: ## Verify dependencies
	@echo "Verifying dependencies..."
	go mod verify

.PHONY: check
check: fmt vet lint test ## Run all checks

.PHONY: ci
ci: deps mod-verify check test-integration security-scan ## Run CI pipeline

.PHONY: release
release: clean check build-all docker-build ## Prepare release

.PHONY: dev-setup
dev-setup: setup ## Setup development environment
	@echo "Setting up development environment..."
	cp env.example .env
	@echo "Please edit .env file with your configuration"

.PHONY: health-check
health-check: ## Check service health
	@echo "Checking service health..."
	curl -f http://localhost:8002/health || exit 1

.PHONY: logs
logs: ## View application logs
	@echo "Viewing logs..."
	tail -f /var/log/$(APP_NAME).log

.PHONY: version
version: ## Show version information
	@echo "Version: $(VERSION)"
	@echo "Build Time: $(BUILD_TIME)"
	@echo "Go Version: $(GO_VERSION)"

# Default target
.DEFAULT_GOAL := help 
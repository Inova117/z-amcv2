# ZAMC BFF Service Makefile

# Variables
BINARY_NAME=zamc-bff
DOCKER_IMAGE=zamc-bff
VERSION?=latest
GO_VERSION=1.21

# Database
DB_HOST?=localhost
DB_PORT?=5432
DB_NAME?=zamc
DB_USER?=postgres
DB_PASSWORD?=password
DB_SSL_MODE?=disable
DATABASE_URL?=postgres://$(DB_USER):$(DB_PASSWORD)@$(DB_HOST):$(DB_PORT)/$(DB_NAME)?sslmode=$(DB_SSL_MODE)

# Test Database
TEST_DB_NAME?=zamc_test
TEST_DATABASE_URL?=postgres://$(DB_USER):$(DB_PASSWORD)@$(DB_HOST):$(DB_PORT)/$(TEST_DB_NAME)?sslmode=$(DB_SSL_MODE)

# Build flags
LDFLAGS=-ldflags "-X main.Version=$(VERSION) -X main.BuildTime=$(shell date -u '+%Y-%m-%d_%H:%M:%S')"

.PHONY: help
help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-20s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# Development
.PHONY: dev
dev: ## Run development server with hot reload
	@echo "Starting development server..."
	air

.PHONY: build
build: ## Build the binary
	@echo "Building $(BINARY_NAME)..."
	go build $(LDFLAGS) -o bin/$(BINARY_NAME) .

.PHONY: run
run: build ## Build and run the binary
	@echo "Running $(BINARY_NAME)..."
	./bin/$(BINARY_NAME)

# Dependencies
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

# Code Quality
.PHONY: fmt
fmt: ## Format code
	@echo "Formatting code..."
	go fmt ./...

.PHONY: lint
lint: ## Run linter
	@echo "Running linter..."
	golangci-lint run

.PHONY: vet
vet: ## Run go vet
	@echo "Running go vet..."
	go vet ./...

.PHONY: check
check: fmt vet lint ## Run all code quality checks

# Testing
.PHONY: test
test: ## Run unit tests
	@echo "Running unit tests..."
	go test -v -race -coverprofile=coverage.out ./...

.PHONY: test-short
test-short: ## Run unit tests (short mode, skips integration tests)
	@echo "Running unit tests (short mode)..."
	go test -v -race -short -coverprofile=coverage.out ./...

.PHONY: test-integration
test-integration: ## Run integration tests
	@echo "Running integration tests..."
	@echo "Setting up test database..."
	@$(MAKE) db-test-setup
	TEST_DATABASE_URL=$(TEST_DATABASE_URL) go test -v -race -run TestIntegrationSuite ./graph/...
	@$(MAKE) db-test-cleanup

.PHONY: test-coverage
test-coverage: test ## Generate test coverage report
	@echo "Generating coverage report..."
	go tool cover -html=coverage.out -o coverage.html
	@echo "Coverage report generated: coverage.html"

.PHONY: test-coverage-func
test-coverage-func: test ## Show test coverage by function
	@echo "Coverage by function:"
	go tool cover -func=coverage.out

# Benchmarking
.PHONY: bench
bench: ## Run benchmarks
	@echo "Running benchmarks..."
	go test -bench=. -benchmem -run=^$$ ./graph/...

.PHONY: bench-resolver
bench-resolver: ## Run resolver benchmarks
	@echo "Running resolver benchmarks..."
	go test -bench=BenchmarkQueryResolver -benchmem -run=^$$ ./graph/...
	go test -bench=BenchmarkMutationResolver -benchmem -run=^$$ ./graph/...
	go test -bench=BenchmarkBoardResolver -benchmem -run=^$$ ./graph/...
	go test -bench=BenchmarkAssetResolver -benchmem -run=^$$ ./graph/...

.PHONY: bench-analytics
bench-analytics: ## Run live analytics benchmarks
	@echo "Running live analytics benchmarks..."
	go test -bench=BenchmarkLiveAnalytics -benchmem -run=^$$ ./graph/...

.PHONY: bench-concurrent
bench-concurrent: ## Run concurrent access benchmarks
	@echo "Running concurrent access benchmarks..."
	go test -bench=BenchmarkConcurrent -benchmem -run=^$$ ./graph/...

.PHONY: bench-memory
bench-memory: ## Run memory allocation benchmarks
	@echo "Running memory allocation benchmarks..."
	go test -bench=BenchmarkMemoryAllocation -benchmem -run=^$$ ./graph/...

.PHONY: bench-compare
bench-compare: ## Compare benchmark results (requires benchstat)
	@echo "Running benchmark comparison..."
	@if ! command -v benchstat >/dev/null 2>&1; then \
		echo "Installing benchstat..."; \
		go install golang.org/x/perf/cmd/benchstat@latest; \
	fi
	go test -bench=. -benchmem -count=5 -run=^$$ ./graph/... > bench-new.txt
	@echo "Benchmark results saved to bench-new.txt"
	@echo "To compare with previous results, run: benchstat bench-old.txt bench-new.txt"

.PHONY: profile-cpu
profile-cpu: ## Run CPU profiling
	@echo "Running CPU profiling..."
	go test -bench=BenchmarkQueryResolver_Projects -cpuprofile=cpu.prof -run=^$$ ./graph/...
	@echo "CPU profile saved to cpu.prof"
	@echo "View with: go tool pprof cpu.prof"

.PHONY: profile-mem
profile-mem: ## Run memory profiling
	@echo "Running memory profiling..."
	go test -bench=BenchmarkBoardResolver_Assets -memprofile=mem.prof -run=^$$ ./graph/...
	@echo "Memory profile saved to mem.prof"
	@echo "View with: go tool pprof mem.prof"

# Database
.PHONY: db-setup
db-setup: ## Setup development database
	@echo "Setting up development database..."
	createdb -h $(DB_HOST) -p $(DB_PORT) -U $(DB_USER) $(DB_NAME) || true
	psql -h $(DB_HOST) -p $(DB_PORT) -U $(DB_USER) -d $(DB_NAME) -f schema.sql

.PHONY: db-test-setup
db-test-setup: ## Setup test database
	@echo "Setting up test database..."
	createdb -h $(DB_HOST) -p $(DB_PORT) -U $(DB_USER) $(TEST_DB_NAME) || true
	psql -h $(DB_HOST) -p $(DB_PORT) -U $(DB_USER) -d $(TEST_DB_NAME) -f schema.sql

.PHONY: db-test-cleanup
db-test-cleanup: ## Cleanup test database
	@echo "Cleaning up test database..."
	dropdb -h $(DB_HOST) -p $(DB_PORT) -U $(DB_USER) $(TEST_DB_NAME) || true

.PHONY: db-migrate
db-migrate: ## Run database migrations
	@echo "Running database migrations..."
	# Add migration tool commands here

.PHONY: db-reset
db-reset: ## Reset development database
	@echo "Resetting development database..."
	dropdb -h $(DB_HOST) -p $(DB_PORT) -U $(DB_USER) $(DB_NAME) || true
	$(MAKE) db-setup

# GraphQL
.PHONY: generate
generate: ## Generate GraphQL code
	@echo "Generating GraphQL code..."
	go run github.com/99designs/gqlgen generate

.PHONY: schema-validate
schema-validate: ## Validate GraphQL schema
	@echo "Validating GraphQL schema..."
	go run github.com/99designs/gqlgen validate

# Docker
.PHONY: docker-build
docker-build: ## Build Docker image
	@echo "Building Docker image..."
	docker build -t $(DOCKER_IMAGE):$(VERSION) .

.PHONY: docker-run
docker-run: ## Run Docker container
	@echo "Running Docker container..."
	docker run -p 8080:8080 --env-file .env $(DOCKER_IMAGE):$(VERSION)

.PHONY: docker-push
docker-push: docker-build ## Push Docker image
	@echo "Pushing Docker image..."
	docker push $(DOCKER_IMAGE):$(VERSION)

# Performance Testing
.PHONY: load-test
load-test: ## Run load tests (requires k6)
	@echo "Running load tests..."
	@if ! command -v k6 >/dev/null 2>&1; then \
		echo "k6 not found. Please install k6 for load testing."; \
		exit 1; \
	fi
	k6 run scripts/load-test.js

.PHONY: stress-test
stress-test: ## Run stress tests
	@echo "Running stress tests..."
	go test -bench=BenchmarkConcurrent -benchtime=30s -cpu=1,2,4,8 ./graph/...

# Monitoring
.PHONY: metrics
metrics: ## Show performance metrics
	@echo "Performance metrics:"
	@echo "TODO: Implement metrics collection endpoint"

# Clean
.PHONY: clean
clean: ## Clean build artifacts
	@echo "Cleaning build artifacts..."
	rm -rf bin/
	rm -f coverage.out coverage.html
	rm -f cpu.prof mem.prof
	rm -f bench-*.txt

.PHONY: clean-all
clean-all: clean ## Clean all artifacts including dependencies
	@echo "Cleaning all artifacts..."
	go clean -modcache

# CI/CD
.PHONY: ci
ci: deps check test-short bench ## Run CI pipeline
	@echo "CI pipeline completed successfully"

.PHONY: ci-full
ci-full: deps check test test-integration bench ## Run full CI pipeline with integration tests
	@echo "Full CI pipeline completed successfully"

# Development Tools
.PHONY: tools
tools: ## Install development tools
	@echo "Installing development tools..."
	go install github.com/cosmtrek/air@latest
	go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
	go install github.com/99designs/gqlgen@latest
	go install golang.org/x/perf/cmd/benchstat@latest

# Performance Optimization
.PHONY: optimize
optimize: ## Run performance optimization analysis
	@echo "Running performance optimization analysis..."
	@echo "1. Running benchmarks..."
	@$(MAKE) bench
	@echo "2. Analyzing memory usage..."
	@$(MAKE) profile-mem
	@echo "3. Analyzing CPU usage..."
	@$(MAKE) profile-cpu
	@echo "4. Checking for race conditions..."
	go test -race ./...
	@echo "Optimization analysis complete. Check generated profiles."

.PHONY: perf-report
perf-report: ## Generate comprehensive performance report
	@echo "Generating performance report..."
	@mkdir -p reports
	@echo "# Performance Report - $(shell date)" > reports/performance.md
	@echo "" >> reports/performance.md
	@echo "## Benchmark Results" >> reports/performance.md
	@echo "\`\`\`" >> reports/performance.md
	@go test -bench=. -benchmem -run=^$$ ./graph/... >> reports/performance.md 2>&1
	@echo "\`\`\`" >> reports/performance.md
	@echo "" >> reports/performance.md
	@echo "## Test Coverage" >> reports/performance.md
	@echo "\`\`\`" >> reports/performance.md
	@$(MAKE) test-coverage-func >> reports/performance.md 2>&1
	@echo "\`\`\`" >> reports/performance.md
	@echo "Performance report generated: reports/performance.md"

# All-in-one commands
.PHONY: all
all: clean deps generate check test bench build ## Run complete build pipeline

.PHONY: quick
quick: fmt test-short ## Quick development check

.PHONY: full-test
full-test: test test-integration bench ## Run all tests and benchmarks 
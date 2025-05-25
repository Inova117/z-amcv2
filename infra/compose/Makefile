# ZAMC Infrastructure Management Makefile
# This Makefile provides commands to manage the entire ZAMC platform infrastructure

# Variables
COMPOSE_FILE := docker-compose.yml
ENV_FILE := .env
PROJECT_NAME := zamc

# Colors for output
RED := \033[0;31m
GREEN := \033[0;32m
YELLOW := \033[1;33m
BLUE := \033[0;34m
NC := \033[0m # No Color

.PHONY: help
help: ## Show this help message
	@echo "$(BLUE)ZAMC Infrastructure Management$(NC)"
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "$(GREEN)%-20s$(NC) %s\n", $$1, $$2}'

# =============================================================================
# Environment Setup
# =============================================================================

.PHONY: setup
setup: ## Initial setup - copy environment file and create directories
	@echo "$(YELLOW)Setting up ZAMC infrastructure...$(NC)"
	@if [ ! -f $(ENV_FILE) ]; then \
		cp env.example $(ENV_FILE); \
		echo "$(GREEN)Created .env file from env.example$(NC)"; \
		echo "$(YELLOW)Please edit .env file with your configuration$(NC)"; \
	else \
		echo "$(YELLOW).env file already exists$(NC)"; \
	fi
	@mkdir -p monitoring/grafana/dashboards monitoring/grafana/datasources
	@echo "$(GREEN)Setup completed!$(NC)"

.PHONY: check-env
check-env: ## Check if required environment variables are set
	@echo "$(YELLOW)Checking environment configuration...$(NC)"
	@if [ ! -f $(ENV_FILE) ]; then \
		echo "$(RED)Error: .env file not found. Run 'make setup' first.$(NC)"; \
		exit 1; \
	fi
	@echo "$(GREEN)Environment file found$(NC)"

# =============================================================================
# Core Infrastructure Commands
# =============================================================================

.PHONY: up
up: check-env ## Start all services
	@echo "$(YELLOW)Starting ZAMC infrastructure...$(NC)"
	docker-compose -f $(COMPOSE_FILE) up -d
	@echo "$(GREEN)All services started!$(NC)"
	@make status

.PHONY: down
down: ## Stop all services
	@echo "$(YELLOW)Stopping ZAMC infrastructure...$(NC)"
	docker-compose -f $(COMPOSE_FILE) down
	@echo "$(GREEN)All services stopped$(NC)"

.PHONY: restart
restart: ## Restart all services
	@echo "$(YELLOW)Restarting ZAMC infrastructure...$(NC)"
	docker-compose -f $(COMPOSE_FILE) restart
	@echo "$(GREEN)All services restarted$(NC)"

.PHONY: build
build: ## Build all services
	@echo "$(YELLOW)Building ZAMC services...$(NC)"
	docker-compose -f $(COMPOSE_FILE) build --no-cache
	@echo "$(GREEN)All services built$(NC)"

.PHONY: rebuild
rebuild: ## Rebuild and restart all services
	@echo "$(YELLOW)Rebuilding and restarting ZAMC infrastructure...$(NC)"
	docker-compose -f $(COMPOSE_FILE) down
	docker-compose -f $(COMPOSE_FILE) build --no-cache
	docker-compose -f $(COMPOSE_FILE) up -d
	@echo "$(GREEN)All services rebuilt and restarted$(NC)"

# =============================================================================
# Service Management
# =============================================================================

.PHONY: up-core
up-core: check-env ## Start only core infrastructure (postgres, redis, nats)
	@echo "$(YELLOW)Starting core infrastructure...$(NC)"
	docker-compose -f $(COMPOSE_FILE) up -d postgres redis nats
	@echo "$(GREEN)Core infrastructure started$(NC)"

.PHONY: up-apps
up-apps: check-env ## Start application services
	@echo "$(YELLOW)Starting application services...$(NC)"
	docker-compose -f $(COMPOSE_FILE) up -d zamc-web zamc-bff zamc-orchestrator zamc-connectors
	@echo "$(GREEN)Application services started$(NC)"

.PHONY: up-monitoring
up-monitoring: check-env ## Start monitoring services
	@echo "$(YELLOW)Starting monitoring services...$(NC)"
	docker-compose -f $(COMPOSE_FILE) --profile monitoring up -d
	@echo "$(GREEN)Monitoring services started$(NC)"

.PHONY: up-dev-tools
up-dev-tools: check-env ## Start development tools
	@echo "$(YELLOW)Starting development tools...$(NC)"
	docker-compose -f $(COMPOSE_FILE) --profile dev-tools up -d
	@echo "$(GREEN)Development tools started$(NC)"

.PHONY: up-full
up-full: check-env ## Start all services including monitoring and dev tools
	@echo "$(YELLOW)Starting full ZAMC stack...$(NC)"
	docker-compose -f $(COMPOSE_FILE) --profile monitoring --profile dev-tools up -d
	@echo "$(GREEN)Full stack started$(NC)"

# =============================================================================
# Individual Service Management
# =============================================================================

.PHONY: restart-web
restart-web: ## Restart web frontend
	docker-compose -f $(COMPOSE_FILE) restart zamc-web

.PHONY: restart-bff
restart-bff: ## Restart BFF service
	docker-compose -f $(COMPOSE_FILE) restart zamc-bff

.PHONY: restart-orchestrator
restart-orchestrator: ## Restart orchestrator service
	docker-compose -f $(COMPOSE_FILE) restart zamc-orchestrator

.PHONY: restart-connectors
restart-connectors: ## Restart connectors service
	docker-compose -f $(COMPOSE_FILE) restart zamc-connectors

# =============================================================================
# Logs and Monitoring
# =============================================================================

.PHONY: logs
logs: ## Show logs for all services
	docker-compose -f $(COMPOSE_FILE) logs -f

.PHONY: logs-web
logs-web: ## Show logs for web frontend
	docker-compose -f $(COMPOSE_FILE) logs -f zamc-web

.PHONY: logs-bff
logs-bff: ## Show logs for BFF service
	docker-compose -f $(COMPOSE_FILE) logs -f zamc-bff

.PHONY: logs-orchestrator
logs-orchestrator: ## Show logs for orchestrator service
	docker-compose -f $(COMPOSE_FILE) logs -f zamc-orchestrator

.PHONY: logs-connectors
logs-connectors: ## Show logs for connectors service
	docker-compose -f $(COMPOSE_FILE) logs -f zamc-connectors

.PHONY: logs-postgres
logs-postgres: ## Show logs for PostgreSQL
	docker-compose -f $(COMPOSE_FILE) logs -f postgres

.PHONY: logs-redis
logs-redis: ## Show logs for Redis
	docker-compose -f $(COMPOSE_FILE) logs -f redis

.PHONY: logs-nats
logs-nats: ## Show logs for NATS
	docker-compose -f $(COMPOSE_FILE) logs -f nats

.PHONY: status
status: ## Show status of all services
	@echo "$(BLUE)ZAMC Services Status:$(NC)"
	@docker-compose -f $(COMPOSE_FILE) ps

.PHONY: health
health: ## Check health of all services
	@echo "$(BLUE)ZAMC Services Health Check:$(NC)"
	@echo "$(YELLOW)Web Frontend:$(NC)"
	@curl -s http://localhost:3000/health || echo "$(RED)❌ Web frontend not responding$(NC)"
	@echo "$(YELLOW)BFF GraphQL:$(NC)"
	@curl -s http://localhost:4000/health || echo "$(RED)❌ BFF not responding$(NC)"
	@echo "$(YELLOW)Orchestrator:$(NC)"
	@curl -s http://localhost:8001/health || echo "$(RED)❌ Orchestrator not responding$(NC)"
	@echo "$(YELLOW)Connectors:$(NC)"
	@curl -s http://localhost:8002/health || echo "$(RED)❌ Connectors not responding$(NC)"

# =============================================================================
# Database Management
# =============================================================================

.PHONY: db-shell
db-shell: ## Connect to PostgreSQL shell
	docker-compose -f $(COMPOSE_FILE) exec postgres psql -U postgres -d zamc

.PHONY: db-backup
db-backup: ## Backup PostgreSQL database
	@echo "$(YELLOW)Creating database backup...$(NC)"
	@mkdir -p backups
	docker-compose -f $(COMPOSE_FILE) exec postgres pg_dump -U postgres zamc > backups/zamc_backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "$(GREEN)Database backup created$(NC)"

.PHONY: db-restore
db-restore: ## Restore PostgreSQL database (requires BACKUP_FILE variable)
	@if [ -z "$(BACKUP_FILE)" ]; then \
		echo "$(RED)Error: Please specify BACKUP_FILE variable$(NC)"; \
		echo "Usage: make db-restore BACKUP_FILE=backups/zamc_backup_20240101_120000.sql"; \
		exit 1; \
	fi
	@echo "$(YELLOW)Restoring database from $(BACKUP_FILE)...$(NC)"
	docker-compose -f $(COMPOSE_FILE) exec -T postgres psql -U postgres zamc < $(BACKUP_FILE)
	@echo "$(GREEN)Database restored$(NC)"

.PHONY: db-reset
db-reset: ## Reset database (WARNING: This will delete all data)
	@echo "$(RED)WARNING: This will delete all data in the database!$(NC)"
	@read -p "Are you sure? (y/N): " confirm && [ "$$confirm" = "y" ]
	docker-compose -f $(COMPOSE_FILE) down postgres
	docker volume rm zamc_postgres_data || true
	docker-compose -f $(COMPOSE_FILE) up -d postgres
	@echo "$(GREEN)Database reset completed$(NC)"

# =============================================================================
# Development and Testing
# =============================================================================

.PHONY: test
test: ## Run tests for all services
	@echo "$(YELLOW)Running tests...$(NC)"
	@echo "$(BLUE)Testing BFF service...$(NC)"
	docker-compose -f $(COMPOSE_FILE) exec zamc-bff go test ./...
	@echo "$(BLUE)Testing Orchestrator service...$(NC)"
	docker-compose -f $(COMPOSE_FILE) exec zamc-orchestrator python -m pytest
	@echo "$(BLUE)Testing Connectors service...$(NC)"
	docker-compose -f $(COMPOSE_FILE) exec zamc-connectors go test ./...
	@echo "$(GREEN)All tests completed$(NC)"

.PHONY: shell-web
shell-web: ## Open shell in web container
	docker-compose -f $(COMPOSE_FILE) exec zamc-web sh

.PHONY: shell-bff
shell-bff: ## Open shell in BFF container
	docker-compose -f $(COMPOSE_FILE) exec zamc-bff sh

.PHONY: shell-orchestrator
shell-orchestrator: ## Open shell in orchestrator container
	docker-compose -f $(COMPOSE_FILE) exec zamc-orchestrator bash

.PHONY: shell-connectors
shell-connectors: ## Open shell in connectors container
	docker-compose -f $(COMPOSE_FILE) exec zamc-connectors sh

# =============================================================================
# Cleanup and Maintenance
# =============================================================================

.PHONY: clean
clean: ## Remove all containers and volumes
	@echo "$(YELLOW)Cleaning up ZAMC infrastructure...$(NC)"
	docker-compose -f $(COMPOSE_FILE) down -v --remove-orphans
	docker system prune -f
	@echo "$(GREEN)Cleanup completed$(NC)"

.PHONY: clean-images
clean-images: ## Remove all ZAMC images
	@echo "$(YELLOW)Removing ZAMC images...$(NC)"
	docker images | grep zamc | awk '{print $$3}' | xargs docker rmi -f || true
	@echo "$(GREEN)Images removed$(NC)"

.PHONY: clean-volumes
clean-volumes: ## Remove all volumes (WARNING: This will delete all data)
	@echo "$(RED)WARNING: This will delete all persistent data!$(NC)"
	@read -p "Are you sure? (y/N): " confirm && [ "$$confirm" = "y" ]
	docker-compose -f $(COMPOSE_FILE) down -v
	@echo "$(GREEN)Volumes removed$(NC)"

.PHONY: update
update: ## Update all images and rebuild
	@echo "$(YELLOW)Updating ZAMC infrastructure...$(NC)"
	docker-compose -f $(COMPOSE_FILE) pull
	docker-compose -f $(COMPOSE_FILE) build --pull
	docker-compose -f $(COMPOSE_FILE) up -d
	@echo "$(GREEN)Update completed$(NC)"

# =============================================================================
# Monitoring and URLs
# =============================================================================

.PHONY: urls
urls: ## Show all service URLs
	@echo "$(BLUE)ZAMC Service URLs:$(NC)"
	@echo "$(GREEN)Frontend:$(NC)           http://localhost:3000"
	@echo "$(GREEN)GraphQL API:$(NC)        http://localhost:4000/graphql"
	@echo "$(GREEN)Orchestrator:$(NC)       http://localhost:8001"
	@echo "$(GREEN)Connectors:$(NC)         http://localhost:8002"
	@echo ""
	@echo "$(BLUE)Infrastructure URLs:$(NC)"
	@echo "$(GREEN)PostgreSQL:$(NC)         localhost:5432"
	@echo "$(GREEN)Redis:$(NC)              localhost:6379"
	@echo "$(GREEN)NATS:$(NC)               localhost:4222"
	@echo "$(GREEN)NATS Monitor:$(NC)       http://localhost:8222"
	@echo ""
	@echo "$(BLUE)Monitoring URLs (if enabled):$(NC)"
	@echo "$(GREEN)Prometheus:$(NC)         http://localhost:9090"
	@echo "$(GREEN)Grafana:$(NC)            http://localhost:3001 (admin/admin)"
	@echo "$(GREEN)Jaeger:$(NC)             http://localhost:16686"
	@echo "$(GREEN)NATS Surveyor:$(NC)      http://localhost:7777"
	@echo ""
	@echo "$(BLUE)Development Tools (if enabled):$(NC)"
	@echo "$(GREEN)pgAdmin:$(NC)            http://localhost:5050"
	@echo "$(GREEN)Redis Commander:$(NC)    http://localhost:8081"

.PHONY: open
open: ## Open all service URLs in browser (macOS/Linux)
	@echo "$(YELLOW)Opening ZAMC services in browser...$(NC)"
	@if command -v open >/dev/null 2>&1; then \
		open http://localhost:3000; \
		open http://localhost:4000/graphql; \
	elif command -v xdg-open >/dev/null 2>&1; then \
		xdg-open http://localhost:3000; \
		xdg-open http://localhost:4000/graphql; \
	else \
		echo "$(YELLOW)Please open http://localhost:3000 and http://localhost:4000/graphql manually$(NC)"; \
	fi

# =============================================================================
# Production Deployment
# =============================================================================

.PHONY: prod-build
prod-build: ## Build production images
	@echo "$(YELLOW)Building production images...$(NC)"
	docker-compose -f $(COMPOSE_FILE) -f docker-compose.prod.yml build
	@echo "$(GREEN)Production images built$(NC)"

.PHONY: prod-up
prod-up: ## Start production environment
	@echo "$(YELLOW)Starting production environment...$(NC)"
	docker-compose -f $(COMPOSE_FILE) -f docker-compose.prod.yml up -d
	@echo "$(GREEN)Production environment started$(NC)"

# Default target
.DEFAULT_GOAL := help
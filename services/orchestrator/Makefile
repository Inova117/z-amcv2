# ZAMC Orchestrator Makefile

.PHONY: help install dev test lint format clean docker-build docker-run docker-stop logs

# Default target
help:
	@echo "Available targets:"
	@echo "  install      - Install dependencies with Poetry"
	@echo "  dev          - Run development server"
	@echo "  test         - Run tests"
	@echo "  test-cov     - Run tests with coverage"
	@echo "  lint         - Run linting (flake8, mypy)"
	@echo "  format       - Format code (black, isort)"
	@echo "  clean        - Clean cache and temporary files"
	@echo "  docker-build - Build Docker image"
	@echo "  docker-run   - Run with Docker Compose"
	@echo "  docker-stop  - Stop Docker Compose"
	@echo "  logs         - View Docker logs"

# Install dependencies
install:
	poetry install

# Run development server
dev:
	poetry run python -m orchestrator.main

# Run tests
test:
	poetry run pytest

# Run tests with coverage
test-cov:
	poetry run pytest --cov=orchestrator --cov-report=html --cov-report=term

# Run linting
lint:
	poetry run flake8 src/ tests/
	poetry run mypy src/

# Format code
format:
	poetry run black src/ tests/
	poetry run isort src/ tests/

# Clean cache and temporary files
clean:
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	find . -type d -name "*.egg-info" -exec rm -rf {} +
	rm -rf .pytest_cache/
	rm -rf .coverage
	rm -rf htmlcov/
	rm -rf dist/
	rm -rf build/

# Docker targets
docker-build:
	docker build -t zamc-orchestrator .

docker-run:
	docker-compose up -d

docker-stop:
	docker-compose down

docker-logs:
	docker-compose logs -f orchestrator

# Development setup
setup: install
	@echo "Setting up development environment..."
	@if [ ! -f .env ]; then cp env.example .env; echo "Created .env file from template"; fi
	@echo "Development setup complete!"
	@echo "Please update .env with your OpenAI API key and other settings"

# Run all checks
check: lint test
	@echo "All checks passed!"

# Production build
build:
	poetry build

# Install pre-commit hooks
pre-commit:
	poetry run pre-commit install

# Update dependencies
update:
	poetry update

# Generate requirements.txt for compatibility
requirements:
	poetry export -f requirements.txt --output requirements.txt --without-hashes 
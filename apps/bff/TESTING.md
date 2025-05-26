# Testing Guide for ZAMC BFF Service

This document provides comprehensive testing guidelines for the ZAMC BFF (Backend for Frontend) GraphQL service, including unit tests, integration tests, benchmarks, and performance optimization strategies.

## Table of Contents

1. [Overview](#overview)
2. [Test Structure](#test-structure)
3. [Unit Testing](#unit-testing)
4. [Integration Testing](#integration-testing)
5. [Benchmarking](#benchmarking)
6. [Performance Optimization](#performance-optimization)
7. [Running Tests](#running-tests)
8. [CI/CD Integration](#cicd-integration)
9. [Best Practices](#best-practices)

## Overview

The ZAMC BFF service uses a comprehensive testing strategy that includes:

- **Unit Tests**: Test individual resolver functions and business logic
- **Integration Tests**: Test end-to-end workflows with real database connections
- **Benchmark Tests**: Measure and optimize performance of critical paths
- **Load Tests**: Validate system behavior under high load
- **Performance Profiling**: Identify bottlenecks and optimization opportunities

## Test Structure

```
apps/bff/
├── graph/
│   ├── resolver_test.go           # Unit tests for resolvers
│   ├── resolver_benchmark_test.go # Benchmark tests
│   ├── integration_test.go        # Integration tests
│   └── optimized_resolvers.go     # Performance-optimized implementations
├── internal/
│   ├── auth/
│   │   └── auth_test.go          # Auth service tests
│   ├── database/
│   │   └── database_test.go      # Database layer tests
│   └── nats/
│       └── nats_test.go          # NATS messaging tests
└── Makefile                      # Test automation commands
```

## Unit Testing

### Test Coverage Goals

- **Minimum Coverage**: 80% for all packages
- **Critical Path Coverage**: 95% for resolver functions
- **Error Handling**: 100% coverage for error scenarios

### Key Test Files

#### `resolver_test.go`

Contains unit tests for all GraphQL resolvers:

```go
// Example test structure
func TestQueryResolver_Me(t *testing.T) {
    t.Run("Success - Existing User", func(t *testing.T) {
        // Test successful user retrieval
    })
    
    t.Run("Error - Unauthorized", func(t *testing.T) {
        // Test unauthorized access
    })
}
```

### Mock Strategy

- **Database Mocking**: Use `MockDB` interface for database operations
- **NATS Mocking**: Use `MockNatsConn` for message publishing
- **Auth Mocking**: Use `MockAuthService` for authentication

### Running Unit Tests

```bash
# Run all unit tests
make test

# Run unit tests with coverage
make test-coverage

# Run unit tests in short mode (skip integration tests)
make test-short

# View coverage report
make test-coverage-func
```

## Integration Testing

### Test Database Setup

Integration tests require a PostgreSQL test database:

```bash
# Setup test database
make db-test-setup

# Run integration tests
make test-integration

# Cleanup test database
make db-test-cleanup
```

### Environment Variables

```bash
export TEST_DATABASE_URL="postgres://postgres:password@localhost:5432/zamc_test?sslmode=disable"
```

### Integration Test Scenarios

1. **Complete Entity Lifecycles**: Create → Read → Update → Delete workflows
2. **Cross-Entity Relationships**: Test resolver relationships between entities
3. **Concurrent Operations**: Test thread safety and race conditions
4. **Performance Under Load**: Test behavior with realistic data volumes

### Key Integration Tests

- `TestProjectLifecycle`: Complete project CRUD operations
- `TestAssetLifecycle`: Asset upload, approval, and management
- `TestComplexScenario`: Multi-entity operations with performance validation
- `TestConcurrentOperations`: Concurrent asset uploads and data access

## Benchmarking

### Benchmark Categories

#### 1. Resolver Performance
```bash
# Run resolver benchmarks
make bench-resolver
```

Tests individual resolver performance:
- `BenchmarkQueryResolver_Me`
- `BenchmarkQueryResolver_Projects`
- `BenchmarkMutationResolver_UploadAsset`
- `BenchmarkBoardResolver_Assets`

#### 2. Live Analytics Performance
```bash
# Run analytics benchmarks
make bench-analytics
```

Tests live analytics and dashboard performance:
- `BenchmarkLiveAnalytics_MultipleBoards`
- `BenchmarkLiveAnalytics_AssetMetrics`

#### 3. Concurrent Access
```bash
# Run concurrent benchmarks
make bench-concurrent
```

Tests system behavior under concurrent load:
- `BenchmarkConcurrentAssetUpload`
- `BenchmarkConcurrentBoardAccess`

#### 4. Memory Allocation
```bash
# Run memory benchmarks
make bench-memory
```

Tests memory efficiency:
- `BenchmarkMemoryAllocation_AssetCreation`
- `BenchmarkMemoryAllocation_BoardWithAssets`

### Benchmark Analysis

```bash
# Compare benchmark results
make bench-compare

# Generate performance report
make perf-report
```

### Performance Targets

| Operation | Target Latency | Target Throughput |
|-----------|---------------|-------------------|
| User Query | < 10ms | > 1000 req/s |
| Asset Upload | < 100ms | > 100 req/s |
| Board Assets | < 50ms | > 500 req/s |
| Live Analytics | < 200ms | > 50 req/s |

## Performance Optimization

### Optimization Strategies

#### 1. Caching Layer
- **In-Memory Cache**: 5-minute TTL for frequently accessed data
- **Cache Invalidation**: Smart invalidation on mutations
- **Cache Hit Ratio**: Target > 80% for read operations

#### 2. Database Optimization
- **Query Batching**: Reduce N+1 query problems
- **Connection Pooling**: Optimize database connections
- **Index Optimization**: Ensure proper indexing for common queries

#### 3. GraphQL Optimization
- **Query Complexity Analysis**: Prevent expensive queries
- **DataLoader Pattern**: Batch and cache data loading
- **Field-Level Caching**: Cache expensive field resolutions

### Optimized Resolver Implementation

The `optimized_resolvers.go` file provides performance-enhanced implementations:

```go
// Example optimized resolver with caching
func (r *OptimizedResolver) OptimizedBoardAssets(ctx context.Context, obj *model.Board) ([]*model.Asset, error) {
    // Check cache first
    if assets, exists := r.cache.GetBoardAssets(obj.ID); exists {
        return assets, nil
    }
    
    // Load from database with performance tracking
    // Cache results for future requests
}
```

### Performance Monitoring

```bash
# Run performance analysis
make optimize

# Generate CPU profile
make profile-cpu

# Generate memory profile
make profile-mem
```

## Running Tests

### Quick Development Check
```bash
make quick
```

### Complete Test Suite
```bash
make full-test
```

### CI Pipeline
```bash
# Short CI (for pull requests)
make ci

# Full CI (for main branch)
make ci-full
```

### Individual Test Categories
```bash
# Unit tests only
make test-short

# Integration tests only
make test-integration

# Benchmarks only
make bench

# Specific benchmark category
make bench-analytics
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: BFF Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: password
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Go
      uses: actions/setup-go@v3
      with:
        go-version: 1.21
    
    - name: Install dependencies
      run: make deps
      working-directory: apps/bff
    
    - name: Run tests
      run: make ci
      working-directory: apps/bff
      env:
        TEST_DATABASE_URL: postgres://postgres:password@localhost:5432/zamc_test?sslmode=disable
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        file: apps/bff/coverage.out
```

### Performance Regression Detection

```bash
# Save baseline benchmarks
make bench > baseline-bench.txt

# Compare with new results
make bench-compare
benchstat baseline-bench.txt bench-new.txt
```

## Best Practices

### Test Organization

1. **Arrange-Act-Assert Pattern**: Structure tests clearly
2. **Table-Driven Tests**: Use for multiple test cases
3. **Test Isolation**: Each test should be independent
4. **Cleanup**: Always clean up test data

### Performance Testing

1. **Realistic Data**: Use production-like data volumes
2. **Warm-up Runs**: Allow JIT optimization before measuring
3. **Statistical Significance**: Run multiple iterations
4. **Environment Consistency**: Use consistent test environments

### Mock Usage

1. **Interface-Based Mocking**: Mock at interface boundaries
2. **Behavior Verification**: Verify mock interactions
3. **Realistic Responses**: Mock responses should match real behavior
4. **Error Simulation**: Test error scenarios with mocks

### Continuous Improvement

1. **Regular Benchmark Reviews**: Monitor performance trends
2. **Test Coverage Monitoring**: Maintain high coverage
3. **Performance Budgets**: Set and enforce performance limits
4. **Automated Alerts**: Alert on performance regressions

## Troubleshooting

### Common Issues

#### Test Database Connection
```bash
# Check database connectivity
psql -h localhost -p 5432 -U postgres -d zamc_test -c "SELECT 1;"
```

#### Slow Tests
```bash
# Run with verbose output
go test -v -timeout 30s ./...

# Profile test execution
go test -cpuprofile=test.prof -memprofile=test.mem ./...
```

#### Memory Leaks
```bash
# Check for goroutine leaks
go test -race ./...

# Memory profiling
go test -memprofile=mem.prof -bench=. ./...
go tool pprof mem.prof
```

### Performance Debugging

1. **Enable Query Logging**: Log slow database queries
2. **Use Profiling Tools**: CPU and memory profiling
3. **Monitor Metrics**: Track key performance indicators
4. **Load Testing**: Use tools like k6 for load testing

## Metrics and Monitoring

### Key Metrics

- **Test Coverage**: Percentage of code covered by tests
- **Test Execution Time**: Time to run full test suite
- **Benchmark Results**: Performance measurements over time
- **Error Rates**: Test failure rates and error patterns

### Reporting

```bash
# Generate comprehensive performance report
make perf-report

# View test coverage
make test-coverage

# Check benchmark trends
make bench-compare
```

This testing strategy ensures the ZAMC BFF service maintains high quality, performance, and reliability while supporting rapid development and deployment cycles. 
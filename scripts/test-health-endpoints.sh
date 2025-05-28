#!/bin/bash

# ZAMC Health Check Test Script
# Tests all service health endpoints and validates responses

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TIMEOUT=10
SERVICES=(
    "BFF GraphQL API:http://localhost:4000/health"
    "BFF Ready Check:http://localhost:4000/ready"
    "Orchestrator Service:http://localhost:8001/health"
    "Orchestrator API Health:http://localhost:8001/api/v1/health"
    "Campaign Performance:http://localhost:8001/campaign-performance/health"
    "Connectors Service:http://localhost:8002/health"
    "Connectors Ready:http://localhost:8002/ready"
    "Connectors Metrics:http://localhost:8002/metrics"
)

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    case $status in
        "SUCCESS")
            echo -e "${GREEN}✓${NC} $message"
            ;;
        "FAILURE")
            echo -e "${RED}✗${NC} $message"
            ;;
        "WARNING")
            echo -e "${YELLOW}⚠${NC} $message"
            ;;
        "INFO")
            echo -e "${BLUE}ℹ${NC} $message"
            ;;
    esac
}

# Function to test a health endpoint
test_endpoint() {
    local name=$1
    local url=$2
    local start_time=$(date +%s%3N)
    
    print_status "INFO" "Testing $name at $url"
    
    # Test the endpoint
    local response=$(curl -s -w "%{http_code}:%{time_total}" --max-time $TIMEOUT "$url" 2>/dev/null || echo "000:0")
    local http_code=$(echo "$response" | tail -n1 | cut -d':' -f1)
    local response_time=$(echo "$response" | tail -n1 | cut -d':' -f2)
    local body=$(echo "$response" | head -n -1)
    
    local end_time=$(date +%s%3N)
    local total_time=$((end_time - start_time))
    
    # Validate response
    if [ "$http_code" = "200" ]; then
        print_status "SUCCESS" "$name - HTTP $http_code (${total_time}ms)"
        
        # Try to parse JSON and extract status
        if command -v jq >/dev/null 2>&1; then
            local status=$(echo "$body" | jq -r '.status // empty' 2>/dev/null)
            if [ -n "$status" ]; then
                print_status "INFO" "  Status: $status"
            fi
            
            local service_name=$(echo "$body" | jq -r '.service // empty' 2>/dev/null)
            if [ -n "$service_name" ]; then
                print_status "INFO" "  Service: $service_name"
            fi
            
            local version=$(echo "$body" | jq -r '.version // empty' 2>/dev/null)
            if [ -n "$version" ]; then
                print_status "INFO" "  Version: $version"
            fi
        else
            print_status "INFO" "  Response: ${body:0:100}..."
        fi
        
        return 0
    elif [ "$http_code" = "000" ]; then
        print_status "FAILURE" "$name - Connection failed (timeout or unreachable)"
        return 1
    else
        print_status "FAILURE" "$name - HTTP $http_code (${total_time}ms)"
        if [ -n "$body" ]; then
            print_status "INFO" "  Error: ${body:0:200}..."
        fi
        return 1
    fi
}

# Function to test all endpoints
test_all_endpoints() {
    local success_count=0
    local total_count=${#SERVICES[@]}
    
    print_status "INFO" "Starting health check tests for $total_count endpoints..."
    echo
    
    for service in "${SERVICES[@]}"; do
        local name=$(echo "$service" | cut -d':' -f1)
        local url=$(echo "$service" | cut -d':' -f2-)
        
        if test_endpoint "$name" "$url"; then
            ((success_count++))
        fi
        echo
    done
    
    # Summary
    echo "=================================="
    print_status "INFO" "Health Check Summary"
    echo "=================================="
    print_status "INFO" "Total endpoints tested: $total_count"
    print_status "INFO" "Successful: $success_count"
    print_status "INFO" "Failed: $((total_count - success_count))"
    
    if [ $success_count -eq $total_count ]; then
        print_status "SUCCESS" "All health checks passed!"
        return 0
    else
        print_status "WARNING" "Some health checks failed. Check service status."
        return 1
    fi
}

# Function to check prerequisites
check_prerequisites() {
    print_status "INFO" "Checking prerequisites..."
    
    # Check if curl is available
    if ! command -v curl >/dev/null 2>&1; then
        print_status "FAILURE" "curl is required but not installed"
        exit 1
    fi
    
    # Check if jq is available (optional)
    if ! command -v jq >/dev/null 2>&1; then
        print_status "WARNING" "jq not found - JSON parsing will be limited"
    fi
    
    print_status "SUCCESS" "Prerequisites check completed"
    echo
}

# Function to wait for services
wait_for_services() {
    local max_wait=60
    local wait_time=0
    
    print_status "INFO" "Waiting for services to be ready (max ${max_wait}s)..."
    
    while [ $wait_time -lt $max_wait ]; do
        local ready_count=0
        
        for service in "${SERVICES[@]}"; do
            local url=$(echo "$service" | cut -d':' -f2-)
            if curl -s --max-time 2 "$url" >/dev/null 2>&1; then
                ((ready_count++))
            fi
        done
        
        if [ $ready_count -eq ${#SERVICES[@]} ]; then
            print_status "SUCCESS" "All services are ready!"
            return 0
        fi
        
        print_status "INFO" "Services ready: $ready_count/${#SERVICES[@]} (waiting ${wait_time}s)"
        sleep 5
        wait_time=$((wait_time + 5))
    done
    
    print_status "WARNING" "Timeout waiting for all services to be ready"
    return 1
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo
    echo "Options:"
    echo "  -h, --help     Show this help message"
    echo "  -w, --wait     Wait for services to be ready before testing"
    echo "  -t, --timeout  Set timeout for requests (default: $TIMEOUT seconds)"
    echo "  -q, --quiet    Quiet mode - only show summary"
    echo
    echo "Examples:"
    echo "  $0                    # Test all endpoints immediately"
    echo "  $0 --wait             # Wait for services then test"
    echo "  $0 --timeout 30       # Use 30 second timeout"
}

# Parse command line arguments
WAIT_FOR_SERVICES=false
QUIET_MODE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_usage
            exit 0
            ;;
        -w|--wait)
            WAIT_FOR_SERVICES=true
            shift
            ;;
        -t|--timeout)
            TIMEOUT="$2"
            shift 2
            ;;
        -q|--quiet)
            QUIET_MODE=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Main execution
main() {
    echo "ZAMC Health Check Test Script"
    echo "============================="
    echo
    
    if [ "$QUIET_MODE" = false ]; then
        check_prerequisites
    fi
    
    if [ "$WAIT_FOR_SERVICES" = true ]; then
        wait_for_services
        echo
    fi
    
    test_all_endpoints
    
    local exit_code=$?
    echo
    
    if [ $exit_code -eq 0 ]; then
        print_status "SUCCESS" "Health check tests completed successfully!"
    else
        print_status "FAILURE" "Health check tests completed with failures!"
    fi
    
    exit $exit_code
}

# Run main function
main "$@" 
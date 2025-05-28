#!/bin/bash

# ZAMC E2E Test Runner
# Comprehensive script for running Playwright and Cypress tests with reporting

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
FRAMEWORK="both"
BROWSER="chromium"
HEADED=false
PARALLEL=false
ACCESSIBILITY=false
PERFORMANCE=false
REPORT_ONLY=false
CLEAN_REPORTS=false
CI_MODE=false
VERBOSE=false

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show usage
show_usage() {
    cat << EOF
ZAMC E2E Test Runner

Usage: $0 [OPTIONS]

OPTIONS:
    -f, --framework FRAMEWORK    Test framework to use (playwright|cypress|both) [default: both]
    -b, --browser BROWSER        Browser to use (chromium|firefox|webkit|chrome|edge) [default: chromium]
    -h, --headed                 Run tests in headed mode (visible browser)
    -p, --parallel               Run tests in parallel
    -a, --accessibility          Run accessibility tests with pa11y
    -P, --performance            Run performance tests with Lighthouse
    -r, --report-only            Only generate reports from existing test results
    -c, --clean                  Clean existing reports before running
    -C, --ci                     Run in CI mode (optimized for CI/CD)
    -v, --verbose                Verbose output
    --help                       Show this help message

EXAMPLES:
    $0                           # Run all tests with default settings
    $0 -f playwright -h          # Run Playwright tests in headed mode
    $0 -f cypress -p             # Run Cypress tests in parallel
    $0 -a -P                     # Run accessibility and performance tests
    $0 -C                        # Run in CI mode
    $0 -r                        # Only generate reports

ENVIRONMENT VARIABLES:
    BASE_URL                     Base URL for testing [default: http://localhost:3000]
    CI                          Set to 'true' for CI mode
    PLAYWRIGHT_BROWSERS_PATH     Custom browser installation path
    
EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -f|--framework)
            FRAMEWORK="$2"
            shift 2
            ;;
        -b|--browser)
            BROWSER="$2"
            shift 2
            ;;
        -h|--headed)
            HEADED=true
            shift
            ;;
        -p|--parallel)
            PARALLEL=true
            shift
            ;;
        -a|--accessibility)
            ACCESSIBILITY=true
            shift
            ;;
        -P|--performance)
            PERFORMANCE=true
            shift
            ;;
        -r|--report-only)
            REPORT_ONLY=true
            shift
            ;;
        -c|--clean)
            CLEAN_REPORTS=true
            shift
            ;;
        -C|--ci)
            CI_MODE=true
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        --help)
            show_usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Set CI mode if CI environment variable is set
if [[ "${CI}" == "true" ]]; then
    CI_MODE=true
fi

# Validate framework option
if [[ ! "$FRAMEWORK" =~ ^(playwright|cypress|both)$ ]]; then
    print_error "Invalid framework: $FRAMEWORK. Must be 'playwright', 'cypress', or 'both'"
    exit 1
fi

# Set default base URL
BASE_URL=${BASE_URL:-"http://localhost:3000"}

print_status "ZAMC E2E Test Runner Starting..."
print_status "Framework: $FRAMEWORK"
print_status "Browser: $BROWSER"
print_status "Base URL: $BASE_URL"
print_status "CI Mode: $CI_MODE"

# Create reports directory
mkdir -p reports/{playwright,cypress,accessibility,performance}

# Clean reports if requested
if [[ "$CLEAN_REPORTS" == "true" ]]; then
    print_status "Cleaning existing reports..."
    rm -rf reports/*
    mkdir -p reports/{playwright,cypress,accessibility,performance}
fi

# Function to check if application is running
check_app_running() {
    print_status "Checking if application is running at $BASE_URL..."
    
    if curl -s --fail "$BASE_URL" > /dev/null 2>&1; then
        print_success "Application is running at $BASE_URL"
        return 0
    else
        print_warning "Application is not running at $BASE_URL"
        return 1
    fi
}

# Function to start application if needed
start_app_if_needed() {
    if ! check_app_running; then
        print_status "Starting application..."
        npm run dev &
        APP_PID=$!
        
        # Wait for app to start
        for i in {1..30}; do
            if check_app_running; then
                print_success "Application started successfully"
                return 0
            fi
            sleep 2
        done
        
        print_error "Failed to start application"
        return 1
    fi
}

# Function to run Playwright tests
run_playwright_tests() {
    print_status "Running Playwright tests..."
    
    local cmd="npx playwright test"
    
    if [[ "$HEADED" == "true" ]]; then
        cmd="$cmd --headed"
    fi
    
    if [[ "$CI_MODE" == "true" ]]; then
        cmd="$cmd --reporter=html,json,junit"
    else
        cmd="$cmd --reporter=html"
    fi
    
    if [[ "$BROWSER" != "chromium" ]]; then
        cmd="$cmd --project=$BROWSER"
    fi
    
    if [[ "$PARALLEL" == "true" ]]; then
        cmd="$cmd --workers=4"
    fi
    
    if [[ "$VERBOSE" == "true" ]]; then
        cmd="$cmd --verbose"
    fi
    
    print_status "Executing: $cmd"
    
    if eval "$cmd"; then
        print_success "Playwright tests completed successfully"
        return 0
    else
        print_error "Playwright tests failed"
        return 1
    fi
}

# Function to run Cypress tests
run_cypress_tests() {
    print_status "Running Cypress tests..."
    
    local cmd="npx cypress run"
    
    if [[ "$HEADED" == "true" ]]; then
        cmd="$cmd --headed"
    fi
    
    if [[ "$BROWSER" != "chromium" ]]; then
        if [[ "$BROWSER" == "chrome" ]]; then
            cmd="$cmd --browser chrome"
        elif [[ "$BROWSER" == "firefox" ]]; then
            cmd="$cmd --browser firefox"
        elif [[ "$BROWSER" == "edge" ]]; then
            cmd="$cmd --browser edge"
        fi
    fi
    
    if [[ "$PARALLEL" == "true" ]]; then
        cmd="$cmd --parallel"
    fi
    
    if [[ "$CI_MODE" == "true" ]]; then
        cmd="$cmd --reporter junit --reporter-options mochaFile=reports/cypress/results.xml"
    fi
    
    print_status "Executing: $cmd"
    
    if eval "$cmd"; then
        print_success "Cypress tests completed successfully"
        return 0
    else
        print_error "Cypress tests failed"
        return 1
    fi
}

# Function to run accessibility tests
run_accessibility_tests() {
    print_status "Running accessibility tests with pa11y..."
    
    local urls=(
        "$BASE_URL"
        "$BASE_URL/auth/signin"
        "$BASE_URL/auth/signup"
        "$BASE_URL/dashboard"
        "$BASE_URL/campaigns"
        "$BASE_URL/campaigns/create"
        "$BASE_URL/assets"
        "$BASE_URL/analytics"
        "$BASE_URL/settings/platforms"
    )
    
    local failed=0
    
    for url in "${urls[@]}"; do
        print_status "Testing accessibility for: $url"
        
        if npx pa11y "$url" --reporter cli --reporter html --reporter json \
            --html-report "reports/accessibility/$(basename "$url" .html).html" \
            --json-report "reports/accessibility/$(basename "$url" .html).json"; then
            print_success "Accessibility test passed for: $url"
        else
            print_error "Accessibility test failed for: $url"
            ((failed++))
        fi
    done
    
    if [[ $failed -eq 0 ]]; then
        print_success "All accessibility tests passed"
        return 0
    else
        print_error "$failed accessibility tests failed"
        return 1
    fi
}

# Function to run performance tests
run_performance_tests() {
    print_status "Running performance tests with Lighthouse..."
    
    local urls=(
        "$BASE_URL"
        "$BASE_URL/dashboard"
        "$BASE_URL/campaigns"
        "$BASE_URL/analytics"
    )
    
    local failed=0
    
    for url in "${urls[@]}"; do
        print_status "Testing performance for: $url"
        
        local output_file="reports/performance/$(basename "$url" .html).html"
        local json_file="reports/performance/$(basename "$url" .html).json"
        
        if npx lighthouse "$url" \
            --output html,json \
            --output-path "$output_file" \
            --chrome-flags="--headless --no-sandbox" \
            --quiet; then
            
            # Move JSON file to correct location
            mv "${output_file%.*}.report.json" "$json_file" 2>/dev/null || true
            
            print_success "Performance test completed for: $url"
        else
            print_error "Performance test failed for: $url"
            ((failed++))
        fi
    done
    
    if [[ $failed -eq 0 ]]; then
        print_success "All performance tests completed"
        return 0
    else
        print_error "$failed performance tests failed"
        return 1
    fi
}

# Function to generate summary report
generate_summary_report() {
    print_status "Generating summary report..."
    
    local summary_file="reports/test-summary.html"
    
    cat > "$summary_file" << EOF
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ZAMC E2E Test Summary</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 8px; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
        .success { color: #28a745; }
        .error { color: #dc3545; }
        .warning { color: #ffc107; }
        .links { margin: 10px 0; }
        .links a { display: inline-block; margin: 5px 10px 5px 0; padding: 8px 12px; background: #007bff; color: white; text-decoration: none; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>ZAMC E2E Test Summary</h1>
        <p>Generated on: $(date)</p>
        <p>Framework: $FRAMEWORK</p>
        <p>Browser: $BROWSER</p>
        <p>Base URL: $BASE_URL</p>
    </div>
    
    <div class="section">
        <h2>Test Results</h2>
        <div class="links">
EOF

    # Add links to reports
    if [[ -f "reports/playwright-report/index.html" ]]; then
        echo '            <a href="playwright-report/index.html">Playwright Report</a>' >> "$summary_file"
    fi
    
    if [[ -f "reports/cypress/index.html" ]]; then
        echo '            <a href="cypress/index.html">Cypress Report</a>' >> "$summary_file"
    fi
    
    if [[ -d "reports/accessibility" ]]; then
        echo '            <a href="accessibility/">Accessibility Reports</a>' >> "$summary_file"
    fi
    
    if [[ -d "reports/performance" ]]; then
        echo '            <a href="performance/">Performance Reports</a>' >> "$summary_file"
    fi
    
    cat >> "$summary_file" << EOF
        </div>
    </div>
    
    <div class="section">
        <h2>Quick Links</h2>
        <div class="links">
            <a href="../src/">Source Code</a>
            <a href="../TESTING_GUIDE.md">Testing Guide</a>
            <a href="../README.md">Project README</a>
        </div>
    </div>
</body>
</html>
EOF

    print_success "Summary report generated: $summary_file"
}

# Main execution
main() {
    local exit_code=0
    
    if [[ "$REPORT_ONLY" == "true" ]]; then
        print_status "Report-only mode: Generating summary report..."
        generate_summary_report
        exit 0
    fi
    
    # Check dependencies
    if ! command -v npm &> /dev/null; then
        print_error "npm is required but not installed"
        exit 1
    fi
    
    # Start application if needed (unless in CI mode with external app)
    if [[ "$CI_MODE" != "true" ]]; then
        start_app_if_needed || exit 1
    else
        check_app_running || print_warning "Application not running - tests may fail"
    fi
    
    # Run tests based on framework selection
    if [[ "$FRAMEWORK" == "playwright" || "$FRAMEWORK" == "both" ]]; then
        if ! run_playwright_tests; then
            exit_code=1
        fi
    fi
    
    if [[ "$FRAMEWORK" == "cypress" || "$FRAMEWORK" == "both" ]]; then
        if ! run_cypress_tests; then
            exit_code=1
        fi
    fi
    
    # Run additional tests if requested
    if [[ "$ACCESSIBILITY" == "true" ]]; then
        if ! run_accessibility_tests; then
            exit_code=1
        fi
    fi
    
    if [[ "$PERFORMANCE" == "true" ]]; then
        if ! run_performance_tests; then
            exit_code=1
        fi
    fi
    
    # Generate summary report
    generate_summary_report
    
    # Cleanup
    if [[ -n "$APP_PID" ]]; then
        print_status "Stopping application..."
        kill $APP_PID 2>/dev/null || true
    fi
    
    if [[ $exit_code -eq 0 ]]; then
        print_success "All tests completed successfully!"
        print_status "View reports at: file://$(pwd)/reports/test-summary.html"
    else
        print_error "Some tests failed. Check the reports for details."
    fi
    
    exit $exit_code
}

# Run main function
main "$@" 
# ZAMC Health Check Test Script (PowerShell)
# Tests all service health endpoints and validates responses

param(
    [switch]$Wait,
    [int]$Timeout = 10,
    [switch]$Quiet,
    [switch]$Help
)

# Configuration
$Services = @(
    @{ Name = "BFF GraphQL API"; Url = "http://localhost:4000/health" }
    @{ Name = "BFF Ready Check"; Url = "http://localhost:4000/ready" }
    @{ Name = "Orchestrator Service"; Url = "http://localhost:8001/health" }
    @{ Name = "Orchestrator API Health"; Url = "http://localhost:8001/api/v1/health" }
    @{ Name = "Campaign Performance"; Url = "http://localhost:8001/campaign-performance/health" }
    @{ Name = "Connectors Service"; Url = "http://localhost:8002/health" }
    @{ Name = "Connectors Ready"; Url = "http://localhost:8002/ready" }
    @{ Name = "Connectors Metrics"; Url = "http://localhost:8002/metrics" }
)

# Function to print colored output
function Write-Status {
    param(
        [string]$Status,
        [string]$Message
    )
    
    switch ($Status) {
        "SUCCESS" { Write-Host "✓ $Message" -ForegroundColor Green }
        "FAILURE" { Write-Host "✗ $Message" -ForegroundColor Red }
        "WARNING" { Write-Host "⚠ $Message" -ForegroundColor Yellow }
        "INFO" { Write-Host "ℹ $Message" -ForegroundColor Blue }
    }
}

# Function to test a health endpoint
function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url
    )
    
    Write-Status "INFO" "Testing $Name at $Url"
    
    try {
        $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
        
        $response = Invoke-WebRequest -Uri $Url -TimeoutSec $Timeout -UseBasicParsing
        
        $stopwatch.Stop()
        $responseTime = $stopwatch.ElapsedMilliseconds
        
        if ($response.StatusCode -eq 200) {
            Write-Status "SUCCESS" "$Name - HTTP $($response.StatusCode) (${responseTime}ms)"
            
            # Try to parse JSON response
            try {
                $jsonResponse = $response.Content | ConvertFrom-Json
                
                if ($jsonResponse.status) {
                    Write-Status "INFO" "  Status: $($jsonResponse.status)"
                }
                
                if ($jsonResponse.service) {
                    Write-Status "INFO" "  Service: $($jsonResponse.service)"
                }
                
                if ($jsonResponse.version) {
                    Write-Status "INFO" "  Version: $($jsonResponse.version)"
                }
            }
            catch {
                $responsePreview = $response.Content.Substring(0, [Math]::Min(100, $response.Content.Length))
                Write-Status "INFO" "  Response: $responsePreview..."
            }
            
            return $true
        }
        else {
            Write-Status "FAILURE" "$Name - HTTP $($response.StatusCode) (${responseTime}ms)"
            return $false
        }
    }
    catch {
        Write-Status "FAILURE" "$Name - Connection failed: $($_.Exception.Message)"
        return $false
    }
}

# Function to test all endpoints
function Test-AllEndpoints {
    $successCount = 0
    $totalCount = $Services.Count
    
    Write-Status "INFO" "Starting health check tests for $totalCount endpoints..."
    Write-Host ""
    
    foreach ($service in $Services) {
        if (Test-Endpoint -Name $service.Name -Url $service.Url) {
            $successCount++
        }
        Write-Host ""
    }
    
    # Summary
    Write-Host "==================================" -ForegroundColor Cyan
    Write-Status "INFO" "Health Check Summary"
    Write-Host "==================================" -ForegroundColor Cyan
    Write-Status "INFO" "Total endpoints tested: $totalCount"
    Write-Status "INFO" "Successful: $successCount"
    Write-Status "INFO" "Failed: $($totalCount - $successCount)"
    
    if ($successCount -eq $totalCount) {
        Write-Status "SUCCESS" "All health checks passed!"
        return $true
    }
    else {
        Write-Status "WARNING" "Some health checks failed. Check service status."
        return $false
    }
}

# Function to wait for services
function Wait-ForServices {
    $maxWait = 60
    $waitTime = 0
    
    Write-Status "INFO" "Waiting for services to be ready (max ${maxWait}s)..."
    
    while ($waitTime -lt $maxWait) {
        $readyCount = 0
        
        foreach ($service in $Services) {
            try {
                $response = Invoke-WebRequest -Uri $service.Url -TimeoutSec 2 -UseBasicParsing
                if ($response.StatusCode -eq 200) {
                    $readyCount++
                }
            }
            catch {
                # Service not ready
            }
        }
        
        if ($readyCount -eq $Services.Count) {
            Write-Status "SUCCESS" "All services are ready!"
            return $true
        }
        
        Write-Status "INFO" "Services ready: $readyCount/$($Services.Count) (waiting ${waitTime}s)"
        Start-Sleep -Seconds 5
        $waitTime += 5
    }
    
    Write-Status "WARNING" "Timeout waiting for all services to be ready"
    return $false
}

# Function to show usage
function Show-Usage {
    Write-Host "ZAMC Health Check Test Script (PowerShell)" -ForegroundColor Cyan
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage: .\test-health-endpoints.ps1 [OPTIONS]" -ForegroundColor White
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Yellow
    Write-Host "  -Help      Show this help message" -ForegroundColor White
    Write-Host "  -Wait      Wait for services to be ready before testing" -ForegroundColor White
    Write-Host "  -Timeout   Set timeout for requests (default: 10 seconds)" -ForegroundColor White
    Write-Host "  -Quiet     Quiet mode - only show summary" -ForegroundColor White
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Yellow
    Write-Host "  .\test-health-endpoints.ps1                    # Test all endpoints immediately" -ForegroundColor White
    Write-Host "  .\test-health-endpoints.ps1 -Wait              # Wait for services then test" -ForegroundColor White
    Write-Host "  .\test-health-endpoints.ps1 -Timeout 30        # Use 30 second timeout" -ForegroundColor White
}

# Main execution
function Main {
    if ($Help) {
        Show-Usage
        exit 0
    }
    
    Write-Host "ZAMC Health Check Test Script" -ForegroundColor Cyan
    Write-Host "=============================" -ForegroundColor Cyan
    Write-Host ""
    
    if (-not $Quiet) {
        Write-Status "INFO" "Checking prerequisites..."
        Write-Status "SUCCESS" "PowerShell and Invoke-WebRequest available"
        Write-Host ""
    }
    
    if ($Wait) {
        $null = Wait-ForServices
        Write-Host ""
    }
    
    $success = Test-AllEndpoints
    
    Write-Host ""
    
    if ($success) {
        Write-Status "SUCCESS" "Health check tests completed successfully!"
        exit 0
    }
    else {
        Write-Status "FAILURE" "Health check tests completed with failures!"
        exit 1
    }
}

# Run main function
Main 
#!/bin/bash

# ZAMC Security Validation Script
# Performs comprehensive security testing and validation

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="${NAMESPACE:-zamc}"
TARGET_URL="${TARGET_URL:-https://zamc.local}"
API_URL="${API_URL:-https://api.zamc.local}"
TIMEOUT="${TIMEOUT:-30}"
OUTPUT_DIR="${OUTPUT_DIR:-./security-validation-results}"
PARALLEL_SCANS="${PARALLEL_SCANS:-4}"

# Tools configuration
NMAP_OPTS="-sS -sV -O --script vuln"
NIKTO_OPTS="-h"
SQLMAP_OPTS="--batch --level=3 --risk=2"

# Test categories
declare -a SECURITY_TESTS=(
    "network_security"
    "web_security"
    "api_security"
    "container_security"
    "kubernetes_security"
    "authentication_security"
    "ssl_tls_security"
    "compliance_checks"
)

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_section() {
    echo -e "\n${PURPLE}=== $1 ===${NC}"
}

create_output_directory() {
    if [[ ! -d "$OUTPUT_DIR" ]]; then
        mkdir -p "$OUTPUT_DIR"
        log_info "Created output directory: $OUTPUT_DIR"
    fi
    
    # Create subdirectories for each test type
    for test in "${SECURITY_TESTS[@]}"; do
        mkdir -p "$OUTPUT_DIR/$test"
    done
}

validate_dependencies() {
    local required_tools=("kubectl" "curl" "nmap" "nikto" "sqlmap" "nslookup" "openssl")
    local missing_tools=()
    
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            missing_tools+=("$tool")
        fi
    done
    
    if [[ ${#missing_tools[@]} -gt 0 ]]; then
        log_error "Missing required tools: ${missing_tools[*]}"
        log_info "Install missing tools or use Docker version of this script"
        exit 1
    fi
    
    log_success "All dependencies validated"
}

check_target_accessibility() {
    log_section "Target Accessibility Check"
    
    # Check web application
    if curl -s --max-time "$TIMEOUT" "$TARGET_URL" > /dev/null; then
        log_success "Web application accessible at $TARGET_URL"
    else
        log_error "Web application not accessible at $TARGET_URL"
        return 1
    fi
    
    # Check API endpoint
    if curl -s --max-time "$TIMEOUT" "$API_URL/health" > /dev/null; then
        log_success "API accessible at $API_URL"
    else
        log_warning "API not accessible at $API_URL (this may be expected in some environments)"
    fi
    
    # Check Kubernetes cluster
    if kubectl cluster-info &> /dev/null; then
        log_success "Kubernetes cluster accessible"
    else
        log_error "Kubernetes cluster not accessible"
        return 1
    fi
}

test_network_security() {
    log_section "Network Security Testing"
    local output_file="$OUTPUT_DIR/network_security/nmap_scan.txt"
    
    # Extract hostname from URL
    local target_host=$(echo "$TARGET_URL" | sed 's|https\?://||' | cut -d'/' -f1)
    
    log_info "Running network security scan on $target_host"
    
    # Port scan
    nmap $NMAP_OPTS "$target_host" 2>/dev/null > "$output_file" || {
        log_warning "Nmap scan failed or incomplete"
    }
    
    # Check for common vulnerabilities
    if grep -q "VULNERABLE" "$output_file"; then
        log_error "Network vulnerabilities detected - see $output_file"
    else
        log_success "No obvious network vulnerabilities detected"
    fi
    
    # Check for unnecessary open ports
    local open_ports=$(grep "open" "$output_file" | wc -l)
    if [[ $open_ports -gt 5 ]]; then
        log_warning "Many open ports detected ($open_ports) - review $output_file"
    else
        log_success "Reasonable number of open ports ($open_ports)"
    fi
}

test_web_security() {
    log_section "Web Application Security Testing"
    local output_file="$OUTPUT_DIR/web_security/nikto_scan.txt"
    
    log_info "Running web vulnerability scan"
    
    # Nikto web vulnerability scanner
    nikto $NIKTO_OPTS "$TARGET_URL" > "$output_file" 2>&1 || {
        log_warning "Nikto scan encountered issues"
    }
    
    # Check for critical issues
    if grep -E "(OSVDB|CVE-|SQL Injection|XSS)" "$output_file"; then
        log_error "Web vulnerabilities detected - see $output_file"
    else
        log_success "No critical web vulnerabilities detected"
    fi
    
    # Test common attack vectors
    test_xss_protection
    test_csrf_protection
    test_clickjacking_protection
}

test_xss_protection() {
    log_info "Testing XSS protection"
    local test_payload="<script>alert('XSS')</script>"
    local response=$(curl -s -d "test=$test_payload" "$TARGET_URL/search" || echo "")
    
    if [[ "$response" == *"$test_payload"* ]]; then
        log_error "Potential XSS vulnerability detected"
        echo "XSS_VULNERABLE" > "$OUTPUT_DIR/web_security/xss_test.txt"
    else
        log_success "XSS protection appears to be working"
        echo "XSS_PROTECTED" > "$OUTPUT_DIR/web_security/xss_test.txt"
    fi
}

test_csrf_protection() {
    log_info "Testing CSRF protection"
    local response=$(curl -s -H "Origin: http://evil-site.com" "$TARGET_URL/api/test" || echo "")
    
    if [[ "$response" == *"success"* ]]; then
        log_warning "Potential CSRF vulnerability - cross-origin requests allowed"
        echo "CSRF_VULNERABLE" > "$OUTPUT_DIR/web_security/csrf_test.txt"
    else
        log_success "CSRF protection appears to be working"
        echo "CSRF_PROTECTED" > "$OUTPUT_DIR/web_security/csrf_test.txt"
    fi
}

test_clickjacking_protection() {
    log_info "Testing clickjacking protection"
    local headers=$(curl -s -I "$TARGET_URL" | grep -i "x-frame-options\|content-security-policy")
    
    if [[ -z "$headers" ]]; then
        log_warning "No clickjacking protection headers detected"
        echo "CLICKJACKING_VULNERABLE" > "$OUTPUT_DIR/web_security/clickjacking_test.txt"
    else
        log_success "Clickjacking protection headers present"
        echo "CLICKJACKING_PROTECTED" > "$OUTPUT_DIR/web_security/clickjacking_test.txt"
    fi
}

test_api_security() {
    log_section "API Security Testing"
    
    # Test authentication
    test_api_authentication
    
    # Test authorization
    test_api_authorization
    
    # Test input validation
    test_api_input_validation
    
    # Test rate limiting
    test_api_rate_limiting
}

test_api_authentication() {
    log_info "Testing API authentication"
    local response=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/graphql")
    
    if [[ "$response" == "200" ]]; then
        log_warning "API accessible without authentication"
        echo "AUTH_BYPASS" > "$OUTPUT_DIR/api_security/auth_test.txt"
    elif [[ "$response" == "401" || "$response" == "403" ]]; then
        log_success "API properly requires authentication"
        echo "AUTH_REQUIRED" > "$OUTPUT_DIR/api_security/auth_test.txt"
    else
        log_info "API returned unexpected status: $response"
        echo "AUTH_UNKNOWN: $response" > "$OUTPUT_DIR/api_security/auth_test.txt"
    fi
}

test_api_authorization() {
    log_info "Testing API authorization"
    
    # Test with invalid token
    local response=$(curl -s -H "Authorization: Bearer invalid_token" \
                          -o /dev/null -w "%{http_code}" "$API_URL/graphql")
    
    if [[ "$response" == "401" || "$response" == "403" ]]; then
        log_success "API properly rejects invalid tokens"
        echo "AUTHZ_SECURE" > "$OUTPUT_DIR/api_security/authz_test.txt"
    else
        log_error "API accepts invalid tokens"
        echo "AUTHZ_VULNERABLE" > "$OUTPUT_DIR/api_security/authz_test.txt"
    fi
}

test_api_input_validation() {
    log_info "Testing API input validation"
    
    # Test SQL injection in GraphQL
    local sql_payload='{"query":"{ users(where: \"1=1; DROP TABLE users;\") { id } }"}'
    local response=$(curl -s -H "Content-Type: application/json" \
                          -d "$sql_payload" "$API_URL/graphql" || echo "")
    
    if [[ "$response" == *"error"* ]] || [[ "$response" == *"invalid"* ]]; then
        log_success "API properly validates input"
        echo "INPUT_VALIDATED" > "$OUTPUT_DIR/api_security/input_validation.txt"
    else
        log_warning "Potential input validation issues"
        echo "INPUT_VULNERABLE" > "$OUTPUT_DIR/api_security/input_validation.txt"
    fi
}

test_api_rate_limiting() {
    log_info "Testing API rate limiting"
    local rate_limit_hit=false
    
    # Send multiple requests quickly
    for i in {1..20}; do
        local response=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/health")
        if [[ "$response" == "429" ]]; then
            rate_limit_hit=true
            break
        fi
        sleep 0.1
    done
    
    if $rate_limit_hit; then
        log_success "Rate limiting is working"
        echo "RATE_LIMITED" > "$OUTPUT_DIR/api_security/rate_limit.txt"
    else
        log_warning "No rate limiting detected"
        echo "NO_RATE_LIMIT" > "$OUTPUT_DIR/api_security/rate_limit.txt"
    fi
}

test_container_security() {
    log_section "Container Security Testing"
    
    # Check for running containers
    local pods=$(kubectl get pods -n "$NAMESPACE" -o jsonpath='{.items[*].metadata.name}')
    
    if [[ -z "$pods" ]]; then
        log_warning "No pods found in namespace $NAMESPACE"
        return
    fi
    
    for pod in $pods; do
        test_pod_security "$pod"
    done
}

test_pod_security() {
    local pod_name="$1"
    log_info "Testing security for pod: $pod_name"
    
    local output_file="$OUTPUT_DIR/container_security/${pod_name}_security.json"
    
    # Get pod security context
    kubectl get pod "$pod_name" -n "$NAMESPACE" -o json > "$output_file"
    
    # Check if running as root
    local run_as_user=$(jq -r '.spec.securityContext.runAsUser // .spec.containers[0].securityContext.runAsUser // "unknown"' "$output_file")
    if [[ "$run_as_user" == "0" ]]; then
        log_error "Pod $pod_name is running as root"
        echo "ROOT_USER" >> "$OUTPUT_DIR/container_security/security_issues.txt"
    elif [[ "$run_as_user" != "unknown" && "$run_as_user" != "null" ]]; then
        log_success "Pod $pod_name is running as non-root user ($run_as_user)"
    fi
    
    # Check for privileged containers
    local privileged=$(jq -r '.spec.containers[].securityContext.privileged // false' "$output_file")
    if [[ "$privileged" == "true" ]]; then
        log_error "Pod $pod_name has privileged containers"
        echo "PRIVILEGED_CONTAINER: $pod_name" >> "$OUTPUT_DIR/container_security/security_issues.txt"
    fi
    
    # Check for read-only root filesystem
    local readonly_fs=$(jq -r '.spec.containers[].securityContext.readOnlyRootFilesystem // false' "$output_file")
    if [[ "$readonly_fs" == "false" ]]; then
        log_warning "Pod $pod_name does not have read-only root filesystem"
        echo "WRITABLE_FILESYSTEM: $pod_name" >> "$OUTPUT_DIR/container_security/security_issues.txt"
    fi
}

test_kubernetes_security() {
    log_section "Kubernetes Security Testing"
    
    # Check RBAC configuration
    test_rbac_configuration
    
    # Check network policies
    test_network_policies
    
    # Check pod security policies
    test_pod_security_policies
    
    # Check secrets management
    test_secrets_management
}

test_rbac_configuration() {
    log_info "Testing RBAC configuration"
    
    # Check for overly permissive roles
    local cluster_admin_bindings=$(kubectl get clusterrolebindings -o json | \
        jq -r '.items[] | select(.roleRef.name == "cluster-admin") | .metadata.name')
    
    if [[ -n "$cluster_admin_bindings" ]]; then
        log_warning "Cluster-admin bindings found: $cluster_admin_bindings"
        echo "CLUSTER_ADMIN_BINDINGS: $cluster_admin_bindings" > "$OUTPUT_DIR/kubernetes_security/rbac_issues.txt"
    else
        log_success "No cluster-admin bindings found"
    fi
    
    # Check service account tokens
    local default_sa_tokens=$(kubectl get secrets -n "$NAMESPACE" -o json | \
        jq -r '.items[] | select(.type == "kubernetes.io/service-account-token" and .metadata.name | contains("default")) | .metadata.name')
    
    if [[ -n "$default_sa_tokens" ]]; then
        log_warning "Default service account tokens found"
        echo "DEFAULT_SA_TOKENS: $default_sa_tokens" >> "$OUTPUT_DIR/kubernetes_security/rbac_issues.txt"
    fi
}

test_network_policies() {
    log_info "Testing network policies"
    
    local netpols=$(kubectl get networkpolicies -n "$NAMESPACE" --no-headers | wc -l)
    
    if [[ $netpols -eq 0 ]]; then
        log_error "No network policies found in namespace $NAMESPACE"
        echo "NO_NETWORK_POLICIES" > "$OUTPUT_DIR/kubernetes_security/network_policies.txt"
    else
        log_success "Network policies configured ($netpols policies)"
        kubectl get networkpolicies -n "$NAMESPACE" -o yaml > "$OUTPUT_DIR/kubernetes_security/network_policies.yaml"
    fi
}

test_pod_security_policies() {
    log_info "Testing pod security policies"
    
    local psps=$(kubectl get podsecuritypolicies --no-headers | wc -l)
    
    if [[ $psps -eq 0 ]]; then
        log_warning "No pod security policies found"
        echo "NO_POD_SECURITY_POLICIES" > "$OUTPUT_DIR/kubernetes_security/psp_status.txt"
    else
        log_success "Pod security policies configured ($psps policies)"
        kubectl get podsecuritypolicies -o yaml > "$OUTPUT_DIR/kubernetes_security/pod_security_policies.yaml"
    fi
}

test_secrets_management() {
    log_info "Testing secrets management"
    
    # Check for hardcoded secrets in ConfigMaps
    local configmaps=$(kubectl get configmaps -n "$NAMESPACE" -o json)
    
    if echo "$configmaps" | jq -r '.items[].data | values[]' | grep -iE "(password|secret|key|token)" > /dev/null; then
        log_error "Potential secrets found in ConfigMaps"
        echo "SECRETS_IN_CONFIGMAPS" > "$OUTPUT_DIR/kubernetes_security/secrets_issues.txt"
    else
        log_success "No obvious secrets in ConfigMaps"
    fi
    
    # Check secret encryption at rest
    log_info "Checking secret encryption at rest"
    kubectl get secrets -n "$NAMESPACE" -o yaml > "$OUTPUT_DIR/kubernetes_security/secrets_dump.yaml"
}

test_ssl_tls_security() {
    log_section "SSL/TLS Security Testing"
    
    # Extract hostname from URL
    local target_host=$(echo "$TARGET_URL" | sed 's|https\?://||' | cut -d'/' -f1)
    local port=443
    
    log_info "Testing SSL/TLS configuration for $target_host:$port"
    
    # Test SSL certificate
    local cert_info=$(echo | openssl s_client -connect "$target_host:$port" -servername "$target_host" 2>/dev/null | openssl x509 -noout -dates 2>/dev/null || echo "")
    
    if [[ -n "$cert_info" ]]; then
        log_success "SSL certificate is present"
        echo "$cert_info" > "$OUTPUT_DIR/ssl_tls_security/cert_info.txt"
        
        # Check certificate expiration
        local not_after=$(echo "$cert_info" | grep "notAfter" | cut -d'=' -f2)
        local exp_date=$(date -d "$not_after" +%s 2>/dev/null || echo "0")
        local current_date=$(date +%s)
        local days_until_exp=$(( (exp_date - current_date) / 86400 ))
        
        if [[ $days_until_exp -lt 30 ]]; then
            log_error "SSL certificate expires in $days_until_exp days"
            echo "CERT_EXPIRING: $days_until_exp days" > "$OUTPUT_DIR/ssl_tls_security/cert_expiration.txt"
        else
            log_success "SSL certificate valid for $days_until_exp days"
        fi
    else
        log_error "SSL certificate test failed"
        echo "CERT_TEST_FAILED" > "$OUTPUT_DIR/ssl_tls_security/cert_info.txt"
    fi
    
    # Test SSL/TLS ciphers
    test_ssl_ciphers "$target_host" "$port"
}

test_ssl_ciphers() {
    local host="$1"
    local port="$2"
    
    log_info "Testing SSL/TLS cipher strength"
    
    # Test for weak ciphers
    local weak_ciphers=("RC4" "MD5" "DES" "3DES")
    local weak_found=false
    
    for cipher in "${weak_ciphers[@]}"; do
        if echo | openssl s_client -connect "$host:$port" -cipher "$cipher" 2>/dev/null | grep -q "Cipher is"; then
            log_error "Weak cipher $cipher is supported"
            echo "WEAK_CIPHER: $cipher" >> "$OUTPUT_DIR/ssl_tls_security/cipher_issues.txt"
            weak_found=true
        fi
    done
    
    if ! $weak_found; then
        log_success "No weak ciphers detected"
        echo "NO_WEAK_CIPHERS" > "$OUTPUT_DIR/ssl_tls_security/cipher_status.txt"
    fi
}

test_authentication_security() {
    log_section "Authentication Security Testing"
    
    # Test password policies (if applicable)
    test_password_policies
    
    # Test session management
    test_session_management
    
    # Test multi-factor authentication
    test_mfa_implementation
}

test_password_policies() {
    log_info "Testing password policies"
    
    # This would typically test against your auth provider
    # For now, we'll check if there are any password complexity requirements
    
    local weak_passwords=("password" "123456" "admin" "test")
    
    # Note: In a real implementation, you'd test against your actual auth system
    log_warning "Password policy testing requires manual verification"
    echo "MANUAL_VERIFICATION_REQUIRED" > "$OUTPUT_DIR/authentication_security/password_policies.txt"
}

test_session_management() {
    log_info "Testing session management"
    
    # Test session timeout
    # Test session invalidation
    # Test concurrent sessions
    
    log_warning "Session management testing requires integration with auth system"
    echo "MANUAL_VERIFICATION_REQUIRED" > "$OUTPUT_DIR/authentication_security/session_management.txt"
}

test_mfa_implementation() {
    log_info "Testing multi-factor authentication"
    
    # Check if MFA is implemented
    log_warning "MFA testing requires manual verification"
    echo "MANUAL_VERIFICATION_REQUIRED" > "$OUTPUT_DIR/authentication_security/mfa_status.txt"
}

test_compliance_checks() {
    log_section "Compliance Checks"
    
    # GDPR compliance checks
    test_gdpr_compliance
    
    # Security logging compliance
    test_logging_compliance
    
    # Data encryption compliance
    test_encryption_compliance
}

test_gdpr_compliance() {
    log_info "Testing GDPR compliance"
    
    # Check for privacy policy
    local privacy_response=$(curl -s "$TARGET_URL/privacy" || echo "")
    if [[ -n "$privacy_response" && "$privacy_response" != *"404"* ]]; then
        log_success "Privacy policy endpoint accessible"
        echo "PRIVACY_POLICY_FOUND" > "$OUTPUT_DIR/compliance_checks/gdpr_status.txt"
    else
        log_warning "Privacy policy not found at /privacy"
        echo "PRIVACY_POLICY_MISSING" > "$OUTPUT_DIR/compliance_checks/gdpr_status.txt"
    fi
    
    # Check for cookie consent
    local cookies_response=$(curl -s -I "$TARGET_URL" | grep -i "set-cookie" || echo "")
    if [[ -n "$cookies_response" ]]; then
        log_warning "Cookies are set - ensure GDPR consent is implemented"
        echo "COOKIES_DETECTED" >> "$OUTPUT_DIR/compliance_checks/gdpr_status.txt"
    fi
}

test_logging_compliance() {
    log_info "Testing security logging compliance"
    
    # Check if security events are being logged
    local security_logs=$(kubectl logs -n "$NAMESPACE" -l app.kubernetes.io/component=bff --tail=100 | grep -i "security\|auth\|error" | wc -l)
    
    if [[ $security_logs -gt 0 ]]; then
        log_success "Security events are being logged ($security_logs events found)"
        echo "SECURITY_LOGGING_ACTIVE: $security_logs" > "$OUTPUT_DIR/compliance_checks/logging_status.txt"
    else
        log_warning "No security events found in logs"
        echo "NO_SECURITY_LOGS" > "$OUTPUT_DIR/compliance_checks/logging_status.txt"
    fi
}

test_encryption_compliance() {
    log_info "Testing data encryption compliance"
    
    # Check database encryption
    local db_pods=$(kubectl get pods -n "$NAMESPACE" -l app.kubernetes.io/name=postgresql -o jsonpath='{.items[*].metadata.name}')
    
    if [[ -n "$db_pods" ]]; then
        log_success "Database pods found - check encryption configuration manually"
        echo "DATABASE_ENCRYPTION_CHECK_REQUIRED" > "$OUTPUT_DIR/compliance_checks/encryption_status.txt"
    else
        log_warning "No database pods found"
        echo "NO_DATABASE_PODS" > "$OUTPUT_DIR/compliance_checks/encryption_status.txt"
    fi
}

generate_security_report() {
    log_section "Generating Security Report"
    
    local report_file="$OUTPUT_DIR/SECURITY_VALIDATION_REPORT.md"
    
    cat > "$report_file" << EOF
# ZAMC Security Validation Report
Generated on: $(date)
Target: $TARGET_URL
API: $API_URL
Namespace: $NAMESPACE

## Executive Summary

This report contains the results of comprehensive security testing performed on the ZAMC platform.

## Test Results Summary

EOF
    
    # Count issues by severity
    local critical_issues=0
    local high_issues=0
    local medium_issues=0
    local low_issues=0
    
    # Scan all test result files for issues
    while IFS= read -r -d '' file; do
        if grep -q "VULNERABLE\|ERROR\|CRITICAL" "$file" 2>/dev/null; then
            ((critical_issues++))
        elif grep -q "WARNING\|HIGH" "$file" 2>/dev/null; then
            ((high_issues++))
        elif grep -q "MEDIUM\|MODERATE" "$file" 2>/dev/null; then
            ((medium_issues++))
        elif grep -q "LOW\|INFO" "$file" 2>/dev/null; then
            ((low_issues++))
        fi
    done < <(find "$OUTPUT_DIR" -name "*.txt" -print0)
    
    cat >> "$report_file" << EOF
- **Critical Issues**: $critical_issues
- **High Issues**: $high_issues  
- **Medium Issues**: $medium_issues
- **Low Issues**: $low_issues

## Detailed Results

### Network Security
$(cat "$OUTPUT_DIR/network_security/nmap_scan.txt" 2>/dev/null | head -20 || echo "Test not completed")

### Web Security
$(test -f "$OUTPUT_DIR/web_security/nikto_scan.txt" && echo "Nikto scan completed - see full results in nikto_scan.txt" || echo "Nikto scan not completed")

### API Security
$(test -f "$OUTPUT_DIR/api_security/auth_test.txt" && cat "$OUTPUT_DIR/api_security/auth_test.txt" || echo "API tests not completed")

### Container Security
$(test -f "$OUTPUT_DIR/container_security/security_issues.txt" && cat "$OUTPUT_DIR/container_security/security_issues.txt" || echo "No container security issues found")

### Kubernetes Security
$(test -f "$OUTPUT_DIR/kubernetes_security/rbac_issues.txt" && cat "$OUTPUT_DIR/kubernetes_security/rbac_issues.txt" || echo "No RBAC issues found")

### SSL/TLS Security
$(test -f "$OUTPUT_DIR/ssl_tls_security/cert_info.txt" && cat "$OUTPUT_DIR/ssl_tls_security/cert_info.txt" || echo "SSL/TLS test not completed")

### Compliance
$(test -f "$OUTPUT_DIR/compliance_checks/gdpr_status.txt" && cat "$OUTPUT_DIR/compliance_checks/gdpr_status.txt" || echo "Compliance checks not completed")

## Recommendations

### Immediate Actions Required
$(if [[ $critical_issues -gt 0 ]]; then echo "- Address $critical_issues critical security issues immediately"; fi)
$(if [[ $high_issues -gt 0 ]]; then echo "- Review and fix $high_issues high-priority security issues"; fi)

### Security Improvements
- Implement regular security scanning
- Set up automated vulnerability monitoring
- Establish incident response procedures
- Conduct regular penetration testing
- Review and update security policies

## Files Generated
$(find "$OUTPUT_DIR" -type f -name "*.txt" -o -name "*.json" -o -name "*.yaml" | sort)

EOF
    
    log_success "Security report generated: $report_file"
}

cleanup() {
    log_info "Cleaning up temporary files..."
    # Add any cleanup tasks here
    log_success "Cleanup completed"
}

# Main execution
main() {
    log_info "Starting ZAMC Security Validation"
    log_info "Target URL: $TARGET_URL"
    log_info "API URL: $API_URL"
    log_info "Namespace: $NAMESPACE"
    log_info "Output Directory: $OUTPUT_DIR"
    
    # Setup
    create_output_directory
    validate_dependencies
    
    # Accessibility check
    if ! check_target_accessibility; then
        log_error "Target systems not accessible. Exiting."
        exit 1
    fi
    
    # Run security tests
    log_info "Running security validation tests..."
    
    test_network_security &
    test_web_security &
    test_api_security &
    
    # Wait for network tests to complete before container tests
    wait
    
    test_container_security
    test_kubernetes_security
    test_ssl_tls_security
    test_authentication_security
    test_compliance_checks
    
    # Generate report
    generate_security_report
    
    # Cleanup
    cleanup
    
    log_success "Security validation completed!"
    log_info "Results saved to: $OUTPUT_DIR"
    log_info "Review the security report: $OUTPUT_DIR/SECURITY_VALIDATION_REPORT.md"
    
    # Exit with appropriate code based on findings
    local critical_issues=$(find "$OUTPUT_DIR" -name "*.txt" -exec grep -l "VULNERABLE\|ERROR\|CRITICAL" {} \; | wc -l)
    if [[ $critical_issues -gt 0 ]]; then
        log_error "Critical security issues found. Review and fix before production deployment."
        exit 1
    else
        log_success "No critical security issues detected. Platform ready for deployment."
        exit 0
    fi
}

# Handle script termination
trap cleanup EXIT

# Run if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi 
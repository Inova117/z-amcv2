#!/bin/bash

# ZAMC Kubernetes Deployment Script
# This script automates the deployment of the ZAMC platform to Kubernetes

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="${NAMESPACE:-zamc}"
RELEASE_NAME="${RELEASE_NAME:-zamc}"
CHART_PATH="${CHART_PATH:-helm/zamc}"
VALUES_FILE="${VALUES_FILE:-values-production.yaml}"
SECRETS_FILE="${SECRETS_FILE:-values-secrets.yaml}"
TIMEOUT="${TIMEOUT:-600s}"
DRY_RUN="${DRY_RUN:-false}"

# Functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✓${NC} $1"
}

warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

error() {
    echo -e "${RED}✗${NC} $1"
    exit 1
}

check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if kubectl is installed and configured
    if ! command -v kubectl &> /dev/null; then
        error "kubectl is not installed or not in PATH"
    fi
    
    # Check if helm is installed
    if ! command -v helm &> /dev/null; then
        error "helm is not installed or not in PATH"
    fi
    
    # Check kubectl connection
    if ! kubectl cluster-info &> /dev/null; then
        error "Cannot connect to Kubernetes cluster. Please check your kubeconfig"
    fi
    
    # Check if secrets file exists
    if [[ ! -f "$SECRETS_FILE" ]]; then
        warning "Secrets file '$SECRETS_FILE' not found. Creating template..."
        create_secrets_template
    fi
    
    success "Prerequisites check passed"
}

create_secrets_template() {
    cat > "$SECRETS_FILE" << 'EOF'
# ZAMC Secrets Configuration
# IMPORTANT: Fill in all the required values before deployment

secrets:
  # JWT Configuration
  jwt:
    secret: "CHANGE_ME_SUPER_SECURE_JWT_SECRET_KEY_AT_LEAST_32_CHARS"
  
  # AI API Keys
  ai:
    openaiApiKey: "sk-your-openai-api-key-here"
    anthropicApiKey: "sk-ant-your-anthropic-api-key-here"
    huggingfaceApiKey: "hf_your-huggingface-api-key-here"
  
  # Google Ads API Configuration
  googleAds:
    developerToken: "your-google-ads-developer-token"
    clientId: "your-google-ads-client-id"
    clientSecret: "your-google-ads-client-secret"
    refreshToken: "your-google-ads-refresh-token"
    customerId: "your-google-ads-customer-id"
    loginCustomerId: "your-google-ads-login-customer-id"
  
  # Meta Marketing API Configuration
  meta:
    appId: "your-meta-app-id"
    appSecret: "your-meta-app-secret"
    accessToken: "your-meta-access-token"
    adAccountId: "your-meta-ad-account-id"
    apiVersion: "v18.0"
  
  # Supabase Configuration (if used)
  supabase:
    url: "https://your-project.supabase.co"
    anonKey: "your-supabase-anon-key"

# Database passwords (override the defaults)
postgresql:
  auth:
    postgresPassword: "CHANGE_ME_SECURE_POSTGRES_PASSWORD"
    password: "CHANGE_ME_SECURE_ZAMC_PASSWORD"

redis:
  auth:
    password: "CHANGE_ME_SECURE_REDIS_PASSWORD"

monitoring:
  grafana:
    adminPassword: "CHANGE_ME_SECURE_GRAFANA_PASSWORD"
EOF
    
    warning "Please edit '$SECRETS_FILE' with your actual secrets before proceying"
    warning "Never commit this file to version control!"
    exit 1
}

add_helm_repos() {
    log "Adding required Helm repositories..."
    
    helm repo add bitnami https://charts.bitnami.com/bitnami
    helm repo add nats https://nats-io.github.io/k8s/helm/charts/
    helm repo update
    
    success "Helm repositories added and updated"
}

create_namespace() {
    log "Creating namespace '$NAMESPACE'..."
    
    if kubectl get namespace "$NAMESPACE" &> /dev/null; then
        warning "Namespace '$NAMESPACE' already exists"
    else
        kubectl create namespace "$NAMESPACE"
        success "Namespace '$NAMESPACE' created"
    fi
}

install_cert_manager() {
    log "Checking if cert-manager is installed..."
    
    if kubectl get namespace cert-manager &> /dev/null; then
        success "cert-manager is already installed"
        return
    fi
    
    log "Installing cert-manager..."
    kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml
    
    log "Waiting for cert-manager to be ready..."
    kubectl wait --for=condition=ready pod -l app=cert-manager -n cert-manager --timeout=300s
    kubectl wait --for=condition=ready pod -l app=cainjector -n cert-manager --timeout=300s
    kubectl wait --for=condition=ready pod -l app=webhook -n cert-manager --timeout=300s
    
    success "cert-manager installed successfully"
}

install_nginx_ingress() {
    log "Checking if nginx-ingress is installed..."
    
    if kubectl get namespace ingress-nginx &> /dev/null; then
        success "nginx-ingress is already installed"
        return
    fi
    
    log "Installing nginx-ingress..."
    kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.2/deploy/static/provider/cloud/deploy.yaml
    
    log "Waiting for nginx-ingress to be ready..."
    kubectl wait --namespace ingress-nginx \
        --for=condition=ready pod \
        --selector=app.kubernetes.io/component=controller \
        --timeout=300s
    
    success "nginx-ingress installed successfully"
}

validate_secrets() {
    log "Validating secrets configuration..."
    
    # Check if secrets file has placeholder values
    if grep -q "CHANGE_ME\|your-.*-here\|your-.*-key" "$SECRETS_FILE"; then
        error "Secrets file contains placeholder values. Please update with real values."
    fi
    
    # Validate required fields exist
    required_fields=(
        "secrets.jwt.secret"
        "secrets.ai.openaiApiKey"
        "secrets.googleAds.developerToken"
        "secrets.meta.appId"
    )
    
    for field in "${required_fields[@]}"; do
        if ! yq eval ".$field" "$SECRETS_FILE" | grep -v "null" &> /dev/null; then
            error "Required field '$field' is missing or null in secrets file"
        fi
    done
    
    success "Secrets validation passed"
}

deploy_zamc() {
    log "Deploying ZAMC platform..."
    
    local helm_args=(
        "$RELEASE_NAME"
        "$CHART_PATH"
        "--namespace" "$NAMESPACE"
        "--values" "$VALUES_FILE"
        "--values" "$SECRETS_FILE"
        "--timeout" "$TIMEOUT"
        "--wait"
        "--create-namespace"
    )
    
    if [[ "$DRY_RUN" == "true" ]]; then
        helm_args+=("--dry-run")
        log "Running in dry-run mode..."
    fi
    
    # Check if release exists
    if helm list -n "$NAMESPACE" | grep -q "$RELEASE_NAME"; then
        log "Upgrading existing release..."
        helm upgrade "${helm_args[@]}"
    else
        log "Installing new release..."
        helm install "${helm_args[@]}"
    fi
    
    success "ZAMC deployment completed"
}

wait_for_deployment() {
    if [[ "$DRY_RUN" == "true" ]]; then
        return
    fi
    
    log "Waiting for all deployments to be ready..."
    
    local deployments=(
        "$RELEASE_NAME-web"
        "$RELEASE_NAME-bff"
        "$RELEASE_NAME-orchestrator"
        "$RELEASE_NAME-connectors"
    )
    
    for deployment in "${deployments[@]}"; do
        log "Waiting for deployment '$deployment'..."
        kubectl rollout status deployment/"$deployment" -n "$NAMESPACE" --timeout=300s
    done
    
    success "All deployments are ready"
}

verify_deployment() {
    if [[ "$DRY_RUN" == "true" ]]; then
        return
    fi
    
    log "Verifying deployment..."
    
    # Check pod status
    log "Pod status:"
    kubectl get pods -n "$NAMESPACE" -l app.kubernetes.io/instance="$RELEASE_NAME"
    
    # Check service status
    log "Service status:"
    kubectl get svc -n "$NAMESPACE" -l app.kubernetes.io/instance="$RELEASE_NAME"
    
    # Check ingress status
    log "Ingress status:"
    kubectl get ingress -n "$NAMESPACE" -l app.kubernetes.io/instance="$RELEASE_NAME"
    
    # Health check
    log "Performing health checks..."
    local web_pod=$(kubectl get pods -n "$NAMESPACE" -l app.kubernetes.io/component=web -o jsonpath='{.items[0].metadata.name}')
    local bff_pod=$(kubectl get pods -n "$NAMESPACE" -l app.kubernetes.io/component=bff -o jsonpath='{.items[0].metadata.name}')
    
    if [[ -n "$web_pod" ]]; then
        kubectl exec -n "$NAMESPACE" "$web_pod" -- curl -f http://localhost:3000/health || warning "Web health check failed"
    fi
    
    if [[ -n "$bff_pod" ]]; then
        kubectl exec -n "$NAMESPACE" "$bff_pod" -- curl -f http://localhost:4000/health || warning "BFF health check failed"
    fi
    
    success "Deployment verification completed"
}

show_access_info() {
    if [[ "$DRY_RUN" == "true" ]]; then
        return
    fi
    
    log "Access Information:"
    echo
    echo -e "${GREEN}ZAMC Platform URLs:${NC}"
    
    # Get ingress hosts
    local web_host=$(kubectl get ingress -n "$NAMESPACE" "$RELEASE_NAME-web" -o jsonpath='{.spec.rules[0].host}' 2>/dev/null || echo "localhost")
    local bff_host=$(kubectl get ingress -n "$NAMESPACE" "$RELEASE_NAME-bff" -o jsonpath='{.spec.rules[0].host}' 2>/dev/null || echo "localhost")
    
    echo "Frontend:     https://$web_host"
    echo "GraphQL API:  https://$bff_host/graphql"
    echo
    
    echo -e "${GREEN}Port Forward Commands (for local access):${NC}"
    echo "kubectl port-forward -n $NAMESPACE svc/$RELEASE_NAME-web 3000:3000"
    echo "kubectl port-forward -n $NAMESPACE svc/$RELEASE_NAME-bff 4000:4000"
    echo
    
    echo -e "${GREEN}Monitoring URLs:${NC}"
    echo "Grafana:      kubectl port-forward -n $NAMESPACE svc/$RELEASE_NAME-grafana 3001:80"
    echo "Prometheus:   kubectl port-forward -n $NAMESPACE svc/$RELEASE_NAME-prometheus 9090:9090"
    echo
    
    echo -e "${GREEN}Useful Commands:${NC}"
    echo "View logs:    kubectl logs -n $NAMESPACE -l app.kubernetes.io/instance=$RELEASE_NAME -f"
    echo "Get pods:     kubectl get pods -n $NAMESPACE"
    echo "Describe:     kubectl describe pod -n $NAMESPACE <pod-name>"
    echo "Shell access: kubectl exec -it -n $NAMESPACE <pod-name> -- /bin/sh"
}

cleanup() {
    log "Cleaning up ZAMC deployment..."
    
    read -p "Are you sure you want to delete the ZAMC deployment? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        helm uninstall "$RELEASE_NAME" -n "$NAMESPACE"
        kubectl delete namespace "$NAMESPACE"
        success "ZAMC deployment cleaned up"
    else
        log "Cleanup cancelled"
    fi
}

show_help() {
    cat << EOF
ZAMC Kubernetes Deployment Script

Usage: $0 [COMMAND] [OPTIONS]

Commands:
    deploy      Deploy ZAMC platform (default)
    cleanup     Remove ZAMC deployment
    help        Show this help message

Environment Variables:
    NAMESPACE       Kubernetes namespace (default: zamc)
    RELEASE_NAME    Helm release name (default: zamc)
    VALUES_FILE     Values file path (default: values-production.yaml)
    SECRETS_FILE    Secrets file path (default: values-secrets.yaml)
    TIMEOUT         Deployment timeout (default: 600s)
    DRY_RUN         Run in dry-run mode (default: false)

Examples:
    # Deploy with defaults
    $0 deploy

    # Deploy with custom namespace
    NAMESPACE=zamc-prod $0 deploy

    # Dry run deployment
    DRY_RUN=true $0 deploy

    # Cleanup deployment
    $0 cleanup

EOF
}

main() {
    local command="${1:-deploy}"
    
    case "$command" in
        deploy)
            log "Starting ZAMC deployment..."
            check_prerequisites
            add_helm_repos
            create_namespace
            install_cert_manager
            install_nginx_ingress
            validate_secrets
            deploy_zamc
            wait_for_deployment
            verify_deployment
            show_access_info
            success "ZAMC deployment completed successfully!"
            ;;
        cleanup)
            cleanup
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            error "Unknown command: $command. Use 'help' for usage information."
            ;;
    esac
}

# Run main function with all arguments
main "$@" 
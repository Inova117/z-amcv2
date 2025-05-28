#!/bin/bash

# ZAMC Production Secrets Generator
# Generates cryptographically secure secrets for production deployment

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="${NAMESPACE:-zamc}"
ENVIRONMENT="${ENVIRONMENT:-production}"
OUTPUT_DIR="${OUTPUT_DIR:-./production-secrets}"
SECRET_LENGTH=64

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

generate_secret() {
    local length=${1:-$SECRET_LENGTH}
    openssl rand -hex $length
}

generate_jwt_secret() {
    # Generate a 512-bit (64 byte) JWT secret
    openssl rand -base64 64 | tr -d '\n'
}

generate_password() {
    # Generate a 32 character password with special characters
    openssl rand -base64 32 | tr -d '\n' | head -c 32
}

create_directory() {
    if [[ ! -d "$OUTPUT_DIR" ]]; then
        mkdir -p "$OUTPUT_DIR"
        log_info "Created output directory: $OUTPUT_DIR"
    fi
}

validate_dependencies() {
    local deps=("openssl" "kubectl")
    for dep in "${deps[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            log_error "Required dependency '$dep' is not installed"
            exit 1
        fi
    done
    log_success "All dependencies validated"
}

backup_existing_secrets() {
    local backup_dir="$OUTPUT_DIR/backup-$(date +%Y%m%d-%H%M%S)"
    
    if kubectl get namespace "$NAMESPACE" &> /dev/null; then
        log_info "Backing up existing secrets to $backup_dir"
        mkdir -p "$backup_dir"
        
        # Backup existing secrets
        kubectl get secrets -n "$NAMESPACE" -o yaml > "$backup_dir/secrets-backup.yaml" 2>/dev/null || true
        log_success "Existing secrets backed up"
    else
        log_warning "Namespace '$NAMESPACE' does not exist. Skipping backup."
    fi
}

generate_database_secrets() {
    log_info "Generating database secrets..."
    
    # PostgreSQL secrets
    POSTGRES_ROOT_PASSWORD=$(generate_password)
    POSTGRES_USER="zamc"
    POSTGRES_PASSWORD=$(generate_password)
    POSTGRES_DB="zamc"
    
    # Database URL
    DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@zamc-postgresql:5432/${POSTGRES_DB}?sslmode=require"
    
    cat > "$OUTPUT_DIR/database-secrets.env" << EOF
# PostgreSQL Database Secrets
POSTGRES_ROOT_PASSWORD=${POSTGRES_ROOT_PASSWORD}
POSTGRES_USER=${POSTGRES_USER}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
POSTGRES_DB=${POSTGRES_DB}
DATABASE_URL=${DATABASE_URL}
EOF
    
    log_success "Database secrets generated"
}

generate_cache_secrets() {
    log_info "Generating cache secrets..."
    
    # Redis secrets
    REDIS_PASSWORD=$(generate_password)
    REDIS_URL="redis://:${REDIS_PASSWORD}@zamc-redis-master:6379"
    
    cat > "$OUTPUT_DIR/cache-secrets.env" << EOF
# Redis Cache Secrets
REDIS_PASSWORD=${REDIS_PASSWORD}
REDIS_URL=${REDIS_URL}
EOF
    
    log_success "Cache secrets generated"
}

generate_messaging_secrets() {
    log_info "Generating messaging secrets..."
    
    # NATS secrets
    NATS_USERNAME="zamc"
    NATS_PASSWORD=$(generate_password)
    NATS_URL="nats://${NATS_USERNAME}:${NATS_PASSWORD}@zamc-nats:4222"
    
    cat > "$OUTPUT_DIR/messaging-secrets.env" << EOF
# NATS Messaging Secrets
NATS_USERNAME=${NATS_USERNAME}
NATS_PASSWORD=${NATS_PASSWORD}
NATS_URL=${NATS_URL}
EOF
    
    log_success "Messaging secrets generated"
}

generate_jwt_secrets() {
    log_info "Generating JWT secrets..."
    
    # JWT secrets for authentication
    JWT_SECRET=$(generate_jwt_secret)
    JWT_REFRESH_SECRET=$(generate_jwt_secret)
    JWT_ACCESS_EXPIRY="15m"
    JWT_REFRESH_EXPIRY="7d"
    
    cat > "$OUTPUT_DIR/jwt-secrets.env" << EOF
# JWT Authentication Secrets
JWT_SECRET=${JWT_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
JWT_ACCESS_EXPIRY=${JWT_ACCESS_EXPIRY}
JWT_REFRESH_EXPIRY=${JWT_REFRESH_EXPIRY}
EOF
    
    log_success "JWT secrets generated"
}

generate_encryption_secrets() {
    log_info "Generating encryption secrets..."
    
    # Database encryption key
    DATABASE_ENCRYPTION_KEY=$(generate_secret 32)
    
    # Backup encryption key
    BACKUP_ENCRYPTION_KEY=$(generate_secret 32)
    
    # Session encryption key
    SESSION_ENCRYPTION_KEY=$(generate_secret 32)
    
    cat > "$OUTPUT_DIR/encryption-secrets.env" << EOF
# Encryption Keys
DATABASE_ENCRYPTION_KEY=${DATABASE_ENCRYPTION_KEY}
BACKUP_ENCRYPTION_KEY=${BACKUP_ENCRYPTION_KEY}
SESSION_ENCRYPTION_KEY=${SESSION_ENCRYPTION_KEY}
EOF
    
    log_success "Encryption secrets generated"
}

generate_monitoring_secrets() {
    log_info "Generating monitoring secrets..."
    
    # Grafana admin password
    GRAFANA_ADMIN_PASSWORD=$(generate_password)
    
    # Prometheus web password
    PROMETHEUS_PASSWORD=$(generate_password)
    
    cat > "$OUTPUT_DIR/monitoring-secrets.env" << EOF
# Monitoring Secrets
GRAFANA_ADMIN_PASSWORD=${GRAFANA_ADMIN_PASSWORD}
PROMETHEUS_PASSWORD=${PROMETHEUS_PASSWORD}
EOF
    
    log_success "Monitoring secrets generated"
}

generate_ssl_certificates() {
    log_info "Generating SSL certificates..."
    
    local ssl_dir="$OUTPUT_DIR/ssl"
    mkdir -p "$ssl_dir"
    
    # Generate CA private key
    openssl genrsa -out "$ssl_dir/ca-key.pem" 4096
    
    # Generate CA certificate
    openssl req -new -x509 -days 365 -key "$ssl_dir/ca-key.pem" \
        -out "$ssl_dir/ca-cert.pem" \
        -subj "/C=US/ST=CA/L=San Francisco/O=ZAMC/OU=Security/CN=ZAMC-CA"
    
    # Generate server private key
    openssl genrsa -out "$ssl_dir/server-key.pem" 4096
    
    # Generate server certificate signing request
    openssl req -new -key "$ssl_dir/server-key.pem" \
        -out "$ssl_dir/server.csr" \
        -subj "/C=US/ST=CA/L=San Francisco/O=ZAMC/OU=Security/CN=zamc.local"
    
    # Generate server certificate
    openssl x509 -req -days 365 -in "$ssl_dir/server.csr" \
        -CA "$ssl_dir/ca-cert.pem" -CAkey "$ssl_dir/ca-key.pem" \
        -CAcreateserial -out "$ssl_dir/server-cert.pem"
    
    # Clean up CSR
    rm "$ssl_dir/server.csr"
    
    log_success "SSL certificates generated"
}

create_kubernetes_secrets() {
    log_info "Creating Kubernetes secrets..."

# Create namespace if it doesn't exist
    if ! kubectl get namespace "$NAMESPACE" &> /dev/null; then
        kubectl create namespace "$NAMESPACE"
        log_info "Created namespace: $NAMESPACE"
    fi
    
    # Source all generated secrets
    source "$OUTPUT_DIR/database-secrets.env"
    source "$OUTPUT_DIR/cache-secrets.env"
    source "$OUTPUT_DIR/messaging-secrets.env"
    source "$OUTPUT_DIR/jwt-secrets.env"
    source "$OUTPUT_DIR/encryption-secrets.env"
    source "$OUTPUT_DIR/monitoring-secrets.env"
    
    # Create main application secrets
    kubectl create secret generic zamc-secrets -n "$NAMESPACE" \
        --from-literal=database-url="$DATABASE_URL" \
        --from-literal=redis-url="$REDIS_URL" \
        --from-literal=nats-url="$NATS_URL" \
        --from-literal=jwt-secret="$JWT_SECRET" \
        --from-literal=jwt-refresh-secret="$JWT_REFRESH_SECRET" \
        --from-literal=database-encryption-key="$DATABASE_ENCRYPTION_KEY" \
        --from-literal=session-encryption-key="$SESSION_ENCRYPTION_KEY" \
        --dry-run=client -o yaml > "$OUTPUT_DIR/zamc-secrets.yaml"
    
    # Create database secrets
    kubectl create secret generic zamc-database-secrets -n "$NAMESPACE" \
        --from-literal=postgres-password="$POSTGRES_ROOT_PASSWORD" \
        --from-literal=password="$POSTGRES_PASSWORD" \
        --from-literal=username="$POSTGRES_USER" \
        --from-literal=database="$POSTGRES_DB" \
        --dry-run=client -o yaml > "$OUTPUT_DIR/database-k8s-secrets.yaml"
    
    # Create monitoring secrets
    kubectl create secret generic zamc-monitoring-secrets -n "$NAMESPACE" \
        --from-literal=grafana-admin-password="$GRAFANA_ADMIN_PASSWORD" \
        --from-literal=prometheus-password="$PROMETHEUS_PASSWORD" \
        --dry-run=client -o yaml > "$OUTPUT_DIR/monitoring-k8s-secrets.yaml"
    
    # Create TLS secrets from generated certificates
    kubectl create secret tls zamc-tls -n "$NAMESPACE" \
        --cert="$OUTPUT_DIR/ssl/server-cert.pem" \
        --key="$OUTPUT_DIR/ssl/server-key.pem" \
        --dry-run=client -o yaml > "$OUTPUT_DIR/tls-secrets.yaml"
    
    log_success "Kubernetes secret manifests created"
}

create_sealed_secrets() {
    if command -v kubeseal &> /dev/null; then
        log_info "Creating sealed secrets..."
        
        # Convert secrets to sealed secrets for GitOps
        for secret_file in "$OUTPUT_DIR"/*-secrets.yaml; do
            if [[ -f "$secret_file" ]]; then
                local basename=$(basename "$secret_file" .yaml)
                kubeseal -f "$secret_file" -w "$OUTPUT_DIR/${basename}-sealed.yaml"
            fi
        done
        
        log_success "Sealed secrets created"
    else
        log_warning "kubeseal not found. Skipping sealed secrets generation."
    fi
}

generate_deployment_values() {
    log_info "Generating production Helm values..."
    
    cat > "$OUTPUT_DIR/values-production.yaml" << 'EOF'
# ZAMC Production Values - Auto-generated
global:
  imageRegistry: ""
  imagePullSecrets: []

# Security Configuration
podSecurityPolicy:
  enabled: true

networkPolicy:
  enabled: true

securityContext:
  runAsNonRoot: true
  runAsUser: 65532
  runAsGroup: 65532
  fsGroup: 65532
  capabilities:
    drop:
      - ALL
  readOnlyRootFilesystem: true
  allowPrivilegeEscalation: false

# PostgreSQL with encryption
postgresql:
  enabled: true
  auth:
    existingSecret: "zamc-database-secrets"
    secretKeys:
      adminPasswordKey: "postgres-password"
      userPasswordKey: "password"
  primary:
    initdb:
      scripts:
        init-encryption.sql: |
          -- Enable encryption at rest
          ALTER SYSTEM SET ssl = on;
          ALTER SYSTEM SET ssl_cert_file = '/etc/ssl/certs/server.crt';
          ALTER SYSTEM SET ssl_key_file = '/etc/ssl/private/server.key';
          SELECT pg_reload_conf();
    persistence:
      enabled: true
      size: 100Gi
      storageClass: "encrypted-ssd"
    securityContext:
      enabled: true
      fsGroup: 1001
      runAsUser: 1001

# Redis with authentication
redis:
  enabled: true
  auth:
    enabled: true
    existingSecret: "zamc-secrets"
    existingSecretPasswordKey: "redis-password"

# Enable monitoring
monitoring:
  enabled: true
  prometheus:
    enabled: true
  grafana:
    enabled: true
    admin:
      existingSecret: "zamc-monitoring-secrets"
      userKey: "admin"
      passwordKey: "grafana-admin-password"

# Production environment settings
bff:
  env:
    ENVIRONMENT: "production"
    GRAPHQL_PLAYGROUND: "false"
    GRAPHQL_INTROSPECTION: "false"

web:
  env:
    NODE_ENV: "production"
    VITE_ENABLE_ANALYTICS: "true"

orchestrator:
  env:
    ENVIRONMENT: "production"

connectors:
  env:
    ENVIRONMENT: "production"
EOF
    
    log_success "Production values file generated"
}

create_security_checklist() {
    log_info "Creating security deployment checklist..."
    
    cat > "$OUTPUT_DIR/SECURITY_DEPLOYMENT_CHECKLIST.md" << 'EOF'
# ZAMC Production Security Deployment Checklist

## Pre-Deployment Security Verification

### 1. Secrets Management ✅
- [ ] All secrets generated with cryptographically secure methods
- [ ] JWT secrets are minimum 512-bit length
- [ ] Database passwords are complex and unique
- [ ] No hardcoded secrets in configuration files
- [ ] Secrets are stored in Kubernetes secrets, not ConfigMaps

### 2. Container Security ✅
- [ ] All containers run as non-root users (UID 65532)
- [ ] Read-only root filesystems enabled
- [ ] All Linux capabilities dropped
- [ ] SecurityContext properly configured
- [ ] Distroless base images used where possible

### 3. Network Security ✅
- [ ] Network policies implemented and tested
- [ ] Default deny-all policy in place
- [ ] Only required ports are exposed
- [ ] Service-to-service communication restricted
- [ ] External egress limited to necessary endpoints

### 4. Pod Security ✅
- [ ] Pod Security Policies enabled
- [ ] Privilege escalation disabled
- [ ] Host network/PID/IPC access disabled
- [ ] Seccomp profiles set to RuntimeDefault
- [ ] AppArmor profiles enabled where available

### 5. TLS/SSL Configuration ✅
- [ ] TLS certificates generated and configured
- [ ] All internal communication encrypted
- [ ] Strong cipher suites configured
- [ ] Certificate rotation plan in place

### 6. Monitoring and Alerting ✅
- [ ] Security event monitoring enabled
- [ ] Failed authentication alerts configured
- [ ] Anomaly detection thresholds set
- [ ] Log aggregation and retention configured
- [ ] SIEM integration tested

### 7. Access Control ✅
- [ ] RBAC properly configured
- [ ] Service accounts with minimal permissions
- [ ] No default service account usage
- [ ] Admin access properly restricted

### 8. Data Protection ✅
- [ ] Database encryption at rest enabled
- [ ] Backup encryption configured
- [ ] PII data handling verified
- [ ] Data retention policies implemented

## Deployment Commands

### 1. Apply Secrets
```bash
kubectl apply -f zamc-secrets.yaml
kubectl apply -f database-k8s-secrets.yaml
kubectl apply -f monitoring-k8s-secrets.yaml
kubectl apply -f tls-secrets.yaml
```

### 2. Deploy Application
```bash
helm upgrade --install zamc ./infra/k8s/helm/zamc \
  --namespace zamc \
  --values values-production.yaml \
  --wait --timeout=10m
```

### 3. Verify Security Configuration
```bash
# Check pod security contexts
kubectl get pods -n zamc -o jsonpath='{.items[*].spec.securityContext}'

# Verify network policies
kubectl get networkpolicies -n zamc

# Check TLS configuration
kubectl get ingress -n zamc
```

## Post-Deployment Verification

### 1. Security Testing
- [ ] Run security scanner against deployed containers
- [ ] Verify network isolation
- [ ] Test authentication and authorization
- [ ] Validate TLS configuration
- [ ] Check for exposed secrets

### 2. Monitoring Validation
- [ ] Verify security alerts are working
- [ ] Test incident response procedures
- [ ] Validate log collection
- [ ] Check metrics availability

### 3. Backup and Recovery
- [ ] Test encrypted backup procedures
- [ ] Verify disaster recovery plan
- [ ] Validate secret rotation procedures

## Emergency Contacts
- Security Team: security@zamc.com
- DevOps Team: devops@zamc.com
- Incident Response: incident@zamc.com
EOF
    
    log_success "Security deployment checklist created"
}

# Main execution
main() {
    log_info "Starting ZAMC Production Secrets Generation"
    log_info "Environment: $ENVIRONMENT"
    log_info "Namespace: $NAMESPACE"
    log_info "Output Directory: $OUTPUT_DIR"
    
    validate_dependencies
    create_directory
    backup_existing_secrets
    
    # Generate all secrets
    generate_database_secrets
    generate_cache_secrets
    generate_messaging_secrets
    generate_jwt_secrets
    generate_encryption_secrets
    generate_monitoring_secrets
    generate_ssl_certificates
    
    # Create Kubernetes manifests
    create_kubernetes_secrets
    create_sealed_secrets
    generate_deployment_values
    create_security_checklist
    
    # Set secure permissions
    chmod 600 "$OUTPUT_DIR"/*.env
    chmod 600 "$OUTPUT_DIR"/ssl/*.pem
    
    log_success "Production secrets generation completed!"
    log_info "Secrets location: $OUTPUT_DIR"
    log_warning "IMPORTANT: Store these secrets securely and remove from disk after deployment"
    log_info "Next steps:"
    echo "1. Review generated secrets and values"
    echo "2. Follow the security deployment checklist"
    echo "3. Deploy using the generated Helm values"
    echo "4. Verify security configuration post-deployment"
    echo "5. Securely delete the generated files"
}

# Run if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
main "$@" 
fi 
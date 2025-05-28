#!/bin/bash

# ZAMC Production Secrets Generator
# This script generates cryptographically secure secrets for production deployment

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="${NAMESPACE:-zamc}"
SECRET_NAME="${SECRET_NAME:-zamc-secrets}"
OUTPUT_DIR="${OUTPUT_DIR:-./secrets}"
BACKUP_DIR="${BACKUP_DIR:-./secrets/backup}"

# Ensure required tools are available
check_dependencies() {
    local deps=("openssl" "base64" "kubectl")
    for dep in "${deps[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            echo -e "${RED}Error: $dep is required but not installed${NC}"
            exit 1
        fi
    done
}

# Generate a random password
generate_password() {
    local length=${1:-32}
    openssl rand -base64 $((length * 3 / 4)) | tr -d "=+/" | cut -c1-${length}
}

# Generate a JWT secret (256-bit minimum)
generate_jwt_secret() {
    openssl rand -base64 64 | tr -d "=+/" | cut -c1-64
}

# Generate a database encryption key
generate_encryption_key() {
    openssl rand -hex 32
}

# Generate API key
generate_api_key() {
    echo "zamc_$(openssl rand -hex 16)"
}

# Create backup of existing secrets
backup_existing_secrets() {
    if kubectl get secret "$SECRET_NAME" -n "$NAMESPACE" &> /dev/null; then
        echo -e "${YELLOW}Backing up existing secrets...${NC}"
        mkdir -p "$BACKUP_DIR"
        kubectl get secret "$SECRET_NAME" -n "$NAMESPACE" -o yaml > "$BACKUP_DIR/secrets-backup-$(date +%Y%m%d-%H%M%S).yaml"
        echo -e "${GREEN}Backup created in $BACKUP_DIR${NC}"
    fi
}

# Generate all secrets
generate_secrets() {
    echo -e "${BLUE}Generating production secrets...${NC}"
    
    # Database secrets
    POSTGRES_PASSWORD=$(generate_password 32)
    POSTGRES_USER="zamc_prod"
    POSTGRES_DB="zamc_production"
    DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgresql:5432/${POSTGRES_DB}?sslmode=require"
    
    # Redis secrets
    REDIS_PASSWORD=$(generate_password 32)
    REDIS_URL="redis://:${REDIS_PASSWORD}@redis:6379/0"
    
    # NATS secrets
    NATS_PASSWORD=$(generate_password 32)
    NATS_URL="nats://zamc:${NATS_PASSWORD}@nats:4222"
    
    # JWT secrets
    JWT_SECRET=$(generate_jwt_secret)
    JWT_REFRESH_SECRET=$(generate_jwt_secret)
    
    # Encryption keys
    DATABASE_ENCRYPTION_KEY=$(generate_encryption_key)
    BACKUP_ENCRYPTION_KEY=$(generate_encryption_key)
    SESSION_SECRET=$(generate_password 64)
    
    # API keys
    INTERNAL_API_KEY=$(generate_api_key)
    WEBHOOK_SECRET=$(generate_password 32)
    
    # External service placeholders (to be filled manually)
    SUPABASE_URL="https://your-project.supabase.co"
    SUPABASE_ANON_KEY="REPLACE_WITH_ACTUAL_SUPABASE_ANON_KEY"
    SUPABASE_SERVICE_KEY="REPLACE_WITH_ACTUAL_SUPABASE_SERVICE_KEY"
    
    OPENAI_API_KEY="REPLACE_WITH_ACTUAL_OPENAI_API_KEY"
    
    GOOGLE_ADS_CLIENT_ID="REPLACE_WITH_ACTUAL_GOOGLE_ADS_CLIENT_ID"
    GOOGLE_ADS_CLIENT_SECRET="REPLACE_WITH_ACTUAL_GOOGLE_ADS_CLIENT_SECRET"
    GOOGLE_ADS_DEVELOPER_TOKEN="REPLACE_WITH_ACTUAL_GOOGLE_ADS_DEVELOPER_TOKEN"
    
    META_APP_ID="REPLACE_WITH_ACTUAL_META_APP_ID"
    META_APP_SECRET="REPLACE_WITH_ACTUAL_META_APP_SECRET"
    META_ACCESS_TOKEN="REPLACE_WITH_ACTUAL_META_ACCESS_TOKEN"
    
    # Monitoring secrets
    GRAFANA_ADMIN_PASSWORD=$(generate_password 24)
    PROMETHEUS_PASSWORD=$(generate_password 24)
    
    # Create output directory
    mkdir -p "$OUTPUT_DIR"
    
    # Generate Kubernetes secret YAML
    cat > "$OUTPUT_DIR/secrets.yaml" << EOF
apiVersion: v1
kind: Secret
metadata:
  name: $SECRET_NAME
  namespace: $NAMESPACE
  labels:
    app.kubernetes.io/name: zamc
    app.kubernetes.io/component: secrets
type: Opaque
data:
  # Database Configuration
  database-url: $(echo -n "$DATABASE_URL" | base64 -w 0)
  postgres-user: $(echo -n "$POSTGRES_USER" | base64 -w 0)
  postgres-password: $(echo -n "$POSTGRES_PASSWORD" | base64 -w 0)
  postgres-db: $(echo -n "$POSTGRES_DB" | base64 -w 0)
  database-encryption-key: $(echo -n "$DATABASE_ENCRYPTION_KEY" | base64 -w 0)
  
  # Redis Configuration
  redis-url: $(echo -n "$REDIS_URL" | base64 -w 0)
  redis-password: $(echo -n "$REDIS_PASSWORD" | base64 -w 0)
  
  # NATS Configuration
  nats-url: $(echo -n "$NATS_URL" | base64 -w 0)
  nats-password: $(echo -n "$NATS_PASSWORD" | base64 -w 0)
  
  # JWT Configuration
  jwt-secret: $(echo -n "$JWT_SECRET" | base64 -w 0)
  jwt-refresh-secret: $(echo -n "$JWT_REFRESH_SECRET" | base64 -w 0)
  session-secret: $(echo -n "$SESSION_SECRET" | base64 -w 0)
  
  # API Keys
  internal-api-key: $(echo -n "$INTERNAL_API_KEY" | base64 -w 0)
  webhook-secret: $(echo -n "$WEBHOOK_SECRET" | base64 -w 0)
  
  # Backup Encryption
  backup-encryption-key: $(echo -n "$BACKUP_ENCRYPTION_KEY" | base64 -w 0)
  
  # External Services (REPLACE WITH ACTUAL VALUES)
  supabase-url: $(echo -n "$SUPABASE_URL" | base64 -w 0)
  supabase-anon-key: $(echo -n "$SUPABASE_ANON_KEY" | base64 -w 0)
  supabase-service-key: $(echo -n "$SUPABASE_SERVICE_KEY" | base64 -w 0)
  
  openai-api-key: $(echo -n "$OPENAI_API_KEY" | base64 -w 0)
  
  google-ads-client-id: $(echo -n "$GOOGLE_ADS_CLIENT_ID" | base64 -w 0)
  google-ads-client-secret: $(echo -n "$GOOGLE_ADS_CLIENT_SECRET" | base64 -w 0)
  google-ads-developer-token: $(echo -n "$GOOGLE_ADS_DEVELOPER_TOKEN" | base64 -w 0)
  
  meta-app-id: $(echo -n "$META_APP_ID" | base64 -w 0)
  meta-app-secret: $(echo -n "$META_APP_SECRET" | base64 -w 0)
  meta-access-token: $(echo -n "$META_ACCESS_TOKEN" | base64 -w 0)
  
  # Monitoring
  grafana-admin-password: $(echo -n "$GRAFANA_ADMIN_PASSWORD" | base64 -w 0)
  prometheus-password: $(echo -n "$PROMETHEUS_PASSWORD" | base64 -w 0)
EOF

    # Generate environment file for local development
    cat > "$OUTPUT_DIR/.env.production" << EOF
# ZAMC Production Environment Variables
# Generated on $(date)

# Database Configuration
DATABASE_URL=$DATABASE_URL
POSTGRES_USER=$POSTGRES_USER
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
POSTGRES_DB=$POSTGRES_DB
DATABASE_ENCRYPTION_KEY=$DATABASE_ENCRYPTION_KEY

# Redis Configuration
REDIS_URL=$REDIS_URL
REDIS_PASSWORD=$REDIS_PASSWORD

# NATS Configuration
NATS_URL=$NATS_URL
NATS_PASSWORD=$NATS_PASSWORD

# JWT Configuration
JWT_SECRET=$JWT_SECRET
JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET
SESSION_SECRET=$SESSION_SECRET

# API Keys
INTERNAL_API_KEY=$INTERNAL_API_KEY
WEBHOOK_SECRET=$WEBHOOK_SECRET

# Backup Encryption
BACKUP_ENCRYPTION_KEY=$BACKUP_ENCRYPTION_KEY

# External Services (REPLACE WITH ACTUAL VALUES)
SUPABASE_URL=$SUPABASE_URL
SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
SUPABASE_SERVICE_KEY=$SUPABASE_SERVICE_KEY

OPENAI_API_KEY=$OPENAI_API_KEY

GOOGLE_ADS_CLIENT_ID=$GOOGLE_ADS_CLIENT_ID
GOOGLE_ADS_CLIENT_SECRET=$GOOGLE_ADS_CLIENT_SECRET
GOOGLE_ADS_DEVELOPER_TOKEN=$GOOGLE_ADS_DEVELOPER_TOKEN

META_APP_ID=$META_APP_ID
META_APP_SECRET=$META_APP_SECRET
META_ACCESS_TOKEN=$META_ACCESS_TOKEN

# Monitoring
GRAFANA_ADMIN_PASSWORD=$GRAFANA_ADMIN_PASSWORD
PROMETHEUS_PASSWORD=$PROMETHEUS_PASSWORD
EOF

    # Generate deployment script
    cat > "$OUTPUT_DIR/deploy-secrets.sh" << 'EOF'
#!/bin/bash

# Deploy secrets to Kubernetes
set -euo pipefail

NAMESPACE="${NAMESPACE:-zamc}"
SECRET_FILE="${SECRET_FILE:-./secrets.yaml}"

echo "Deploying secrets to namespace: $NAMESPACE"

# Create namespace if it doesn't exist
kubectl create namespace "$NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -

# Apply secrets
kubectl apply -f "$SECRET_FILE"

echo "Secrets deployed successfully!"
echo "Remember to update external service credentials manually."
EOF

    chmod +x "$OUTPUT_DIR/deploy-secrets.sh"
    
    # Generate validation script
    cat > "$OUTPUT_DIR/validate-secrets.sh" << 'EOF'
#!/bin/bash

# Validate deployed secrets
set -euo pipefail

NAMESPACE="${NAMESPACE:-zamc}"
SECRET_NAME="${SECRET_NAME:-zamc-secrets}"

echo "Validating secrets in namespace: $NAMESPACE"

# Check if secret exists
if ! kubectl get secret "$SECRET_NAME" -n "$NAMESPACE" &> /dev/null; then
    echo "Error: Secret $SECRET_NAME not found in namespace $NAMESPACE"
    exit 1
fi

# Validate secret keys
required_keys=(
    "database-url"
    "redis-url"
    "nats-url"
    "jwt-secret"
    "jwt-refresh-secret"
    "session-secret"
    "internal-api-key"
    "webhook-secret"
    "backup-encryption-key"
)

echo "Checking required secret keys..."
for key in "${required_keys[@]}"; do
    if kubectl get secret "$SECRET_NAME" -n "$NAMESPACE" -o jsonpath="{.data.$key}" | base64 -d &> /dev/null; then
        echo "✓ $key"
    else
        echo "✗ $key (missing or invalid)"
    fi
done

echo "Validation complete!"
EOF

    chmod +x "$OUTPUT_DIR/validate-secrets.sh"
}

# Main execution
main() {
    echo -e "${BLUE}ZAMC Production Secrets Generator${NC}"
    echo -e "${BLUE}===================================${NC}"
    
    check_dependencies
    backup_existing_secrets
    generate_secrets
    
    echo -e "${GREEN}✓ Secrets generated successfully!${NC}"
    echo -e "${YELLOW}Files created:${NC}"
    echo "  - $OUTPUT_DIR/secrets.yaml (Kubernetes secret)"
    echo "  - $OUTPUT_DIR/.env.production (Environment file)"
    echo "  - $OUTPUT_DIR/deploy-secrets.sh (Deployment script)"
    echo "  - $OUTPUT_DIR/validate-secrets.sh (Validation script)"
    
    echo -e "${RED}IMPORTANT SECURITY NOTES:${NC}"
    echo "1. Update external service credentials in the generated files"
    echo "2. Store these files securely and never commit to version control"
    echo "3. Use proper secret management in production (e.g., HashiCorp Vault)"
    echo "4. Rotate secrets regularly"
    echo "5. Restrict access to these files (chmod 600)"
    
    # Set secure permissions
    chmod 600 "$OUTPUT_DIR"/.env.production
    chmod 600 "$OUTPUT_DIR"/secrets.yaml
    
    echo -e "${GREEN}Deployment ready! Run: $OUTPUT_DIR/deploy-secrets.sh${NC}"
}

# Run main function
main "$@" 
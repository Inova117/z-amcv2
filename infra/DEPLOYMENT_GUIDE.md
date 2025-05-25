# ZAMC Infrastructure Deployment Guide

This guide provides step-by-step instructions for deploying the ZAMC platform using either Docker Compose or Kubernetes.

## 🚀 Quick Start

### Option 1: Docker Compose (Development)

```bash
# 1. Navigate to compose directory
cd infra/compose

# 2. Setup environment
make setup

# 3. Edit environment variables
# Edit .env file with your API keys and configuration

# 4. Start all services
make up

# 5. Access the platform
# Frontend: http://localhost:3000
# GraphQL API: http://localhost:4000/graphql
```

### Option 2: Kubernetes (Production)

```bash
# 1. Navigate to k8s directory
cd infra/k8s

# 2. Run deployment script
./deploy.sh

# 3. Follow the prompts to configure secrets
# 4. Access via ingress or port forwarding
```

## 📋 Prerequisites

### Docker Compose
- Docker 20.10+
- Docker Compose 2.0+
- 8GB RAM minimum
- 20GB disk space

### Kubernetes
- Kubernetes 1.24+
- Helm 3.8+
- kubectl configured
- 16GB RAM minimum (production)
- 100GB disk space

## 🔧 Configuration

### Required Environment Variables

#### AI Services
```bash
OPENAI_API_KEY=sk-your-openai-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key
HUGGINGFACE_API_KEY=hf_your-huggingface-key
```

#### Google Ads API
```bash
GOOGLE_ADS_DEVELOPER_TOKEN=your-token
GOOGLE_ADS_CLIENT_ID=your-client-id
GOOGLE_ADS_CLIENT_SECRET=your-secret
GOOGLE_ADS_REFRESH_TOKEN=your-refresh-token
GOOGLE_ADS_CUSTOMER_ID=your-customer-id
```

#### Meta Marketing API
```bash
META_APP_ID=your-app-id
META_APP_SECRET=your-app-secret
META_ACCESS_TOKEN=your-access-token
META_AD_ACCOUNT_ID=your-ad-account-id
```

## 🐳 Docker Compose Deployment

### 1. Initial Setup
```bash
cd infra/compose
make setup
```

### 2. Configure Environment
```bash
# Copy and edit environment file
cp env.example .env
# Edit .env with your configuration
```

### 3. Start Services
```bash
# Core infrastructure only
make up-core

# Application services
make up-apps

# Full stack with monitoring
make up-full
```

### 4. Verify Deployment
```bash
# Check service status
make status

# View logs
make logs

# Health check
make health
```

### 5. Access Services
| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | React web app |
| GraphQL API | http://localhost:4000/graphql | BFF API |
| Orchestrator | http://localhost:8001 | AI service |
| Connectors | http://localhost:8002 | Ad deployment |
| Grafana | http://localhost:3001 | Monitoring |
| Prometheus | http://localhost:9090 | Metrics |

## ☸️ Kubernetes Deployment

### 1. Prerequisites Setup
```bash
# Add Helm repositories
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo add nats https://nats-io.github.io/k8s/helm/charts/
helm repo update

# Install cert-manager (for TLS)
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Install nginx-ingress
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.2/deploy/static/provider/cloud/deploy.yaml
```

### 2. Configure Secrets
```bash
cd infra/k8s

# Create secrets file
cat > values-secrets.yaml << EOF
secrets:
  jwt:
    secret: "your-super-secure-jwt-secret"
  ai:
    openaiApiKey: "sk-your-openai-key"
    anthropicApiKey: "sk-ant-your-anthropic-key"
  googleAds:
    developerToken: "your-google-ads-token"
    clientId: "your-google-ads-client-id"
    clientSecret: "your-google-ads-secret"
    refreshToken: "your-google-ads-refresh-token"
    customerId: "your-google-ads-customer-id"
  meta:
    appId: "your-meta-app-id"
    appSecret: "your-meta-app-secret"
    accessToken: "your-meta-access-token"
    adAccountId: "your-meta-ad-account-id"
EOF
```

### 3. Deploy with Helm
```bash
# Create namespace
kubectl create namespace zamc

# Deploy ZAMC
helm install zamc helm/zamc/ \
  --namespace zamc \
  --values values-production.yaml \
  --values values-secrets.yaml \
  --wait
```

### 4. Verify Deployment
```bash
# Check pods
kubectl get pods -n zamc

# Check services
kubectl get svc -n zamc

# Check ingress
kubectl get ingress -n zamc

# View logs
kubectl logs -n zamc -l app.kubernetes.io/name=zamc -f
```

### 5. Access Services
```bash
# Port forward for local access
kubectl port-forward -n zamc svc/zamc-web 3000:3000
kubectl port-forward -n zamc svc/zamc-bff 4000:4000

# Or configure DNS for ingress hosts
# zamc.yourdomain.com -> Frontend
# api.yourdomain.com -> GraphQL API
```

## 🔒 Security Considerations

### Production Security Checklist
- [ ] Change all default passwords
- [ ] Use strong JWT secrets (32+ characters)
- [ ] Enable TLS/SSL certificates
- [ ] Configure network policies
- [ ] Use non-root containers
- [ ] Enable read-only root filesystems
- [ ] Set resource limits
- [ ] Configure backup procedures
- [ ] Enable monitoring and alerting
- [ ] Secure API keys in secrets management

### Secrets Management
```bash
# Kubernetes secrets
kubectl create secret generic zamc-secrets \
  --from-literal=jwt-secret="your-jwt-secret" \
  --from-literal=openai-api-key="your-openai-key" \
  -n zamc

# Docker Compose
# Use .env file (never commit to git)
echo ".env" >> .gitignore
```

## 📊 Monitoring and Observability

### Metrics
- **Prometheus**: Metrics collection
- **Grafana**: Visualization dashboards
- **Service monitors**: Automatic discovery

### Logging
- **Structured logging**: JSON format
- **Centralized collection**: All services
- **Log levels**: Configurable verbosity

### Health Checks
```bash
# Docker Compose
make health

# Kubernetes
kubectl get pods -n zamc
kubectl describe pod <pod-name> -n zamc
```

## 🔧 Troubleshooting

### Common Issues

#### Docker Compose
1. **Port conflicts**
   ```bash
   # Check port usage
   netstat -tulpn | grep :3000
   # Stop conflicting services
   ```

2. **Database connection issues**
   ```bash
   # Check PostgreSQL logs
   make logs-postgres
   # Connect to database
   make db-shell
   ```

3. **Service startup failures**
   ```bash
   # Check logs
   make logs
   # Restart specific service
   make restart-web
   ```

#### Kubernetes
1. **Pods not starting**
   ```bash
   # Check pod status
   kubectl get pods -n zamc
   # Describe problematic pod
   kubectl describe pod <pod-name> -n zamc
   # Check logs
   kubectl logs <pod-name> -n zamc
   ```

2. **Ingress not working**
   ```bash
   # Check ingress controller
   kubectl get pods -n ingress-nginx
   # Check ingress configuration
   kubectl describe ingress -n zamc
   ```

3. **Persistent volume issues**
   ```bash
   # Check PVCs
   kubectl get pvc -n zamc
   # Check storage class
   kubectl get storageclass
   ```

### Debug Commands
```bash
# Docker Compose
make shell-web              # Shell into web container
make shell-bff              # Shell into BFF container
make db-shell               # Connect to database

# Kubernetes
kubectl exec -it <pod-name> -n zamc -- /bin/sh
kubectl port-forward <pod-name> 8080:8080 -n zamc
kubectl top pods -n zamc    # Resource usage
```

## 🔄 Scaling and Performance

### Docker Compose Scaling
```bash
# Scale specific service
docker-compose up -d --scale zamc-web=3

# Resource monitoring
docker stats
```

### Kubernetes Scaling
```bash
# Manual scaling
kubectl scale deployment zamc-web --replicas=5 -n zamc

# Auto-scaling (HPA already configured)
kubectl get hpa -n zamc

# Resource monitoring
kubectl top pods -n zamc
kubectl top nodes
```

### Performance Tuning
- **Database**: Tune PostgreSQL configuration
- **Cache**: Optimize Redis memory settings
- **Load balancing**: Configure ingress properly
- **Resource limits**: Set appropriate CPU/memory limits

## 🔄 Backup and Recovery

### Database Backup
```bash
# Docker Compose
make db-backup

# Kubernetes
kubectl exec -it zamc-postgresql-0 -n zamc -- pg_dump -U zamc zamc > backup.sql
```

### Full System Backup
```bash
# Docker Compose
docker-compose down
docker run --rm -v zamc_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz /data

# Kubernetes
# Use Velero or similar backup solution
```

## 📚 Additional Resources

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Helm Documentation](https://helm.sh/docs/)
- [NATS Documentation](https://docs.nats.io/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## 🆘 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review service logs for error messages
3. Verify configuration and secrets
4. Check resource availability (CPU, memory, disk)
5. Consult the documentation links

For additional support:
- 📧 Email: support@zamc.dev
- 💬 Discord: [ZAMC Community](https://discord.gg/zamc)
- 📖 Documentation: [docs.zamc.dev](https://docs.zamc.dev) 
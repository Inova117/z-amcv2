# ZAMC Ad Deployment Connectors Service

A Go microservice that automatically deploys approved marketing assets to Google Ads and Meta Marketing platforms via NATS event-driven architecture.

## 🏗️ Architecture

```
┌─────────────────┐    NATS Events    ┌─────────────────┐
│   ZAMC System   │ ──────────────────▶│   Connectors    │
│                 │                    │    Service      │
└─────────────────┘                    └─────────────────┘
                                              │
                                              ▼
                                    ┌─────────────────┐
                                    │   Deployment    │
                                    │   Orchestrator  │
                                    └─────────────────┘
                                              │
                        ┌─────────────────────┼─────────────────────┐
                        ▼                     ▼                     ▼
                ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
                │ Google Ads   │    │ Meta Marketing│    │   Future     │
                │   API v16    │    │     API       │    │  Platforms   │
                └──────────────┘    └──────────────┘    └──────────────┘
```

## 🚀 Features

- **Event-Driven Architecture**: Listens for `asset.status_changed: approved` events via NATS
- **Multi-Platform Deployment**: Supports Google Ads v16 and Meta Marketing API
- **Intelligent Content Mapping**: Automatically maps content types to appropriate ad formats
- **Retry Logic**: Configurable retry mechanisms with exponential backoff
- **Health Monitoring**: Comprehensive health checks and metrics
- **Graceful Shutdown**: Proper cleanup and connection management
- **Security**: Non-root container execution and secure credential management

## 📋 Prerequisites

- Go 1.21+
- Docker & Docker Compose
- NATS Server
- Google Ads API credentials
- Meta Marketing API credentials

## 🛠️ Installation

### Local Development

1. **Clone and setup**:
```bash
git clone <repository>
cd services/connectors
make dev-setup
```

2. **Configure environment**:
```bash
cp env.example .env
# Edit .env with your API credentials
```

3. **Install dependencies**:
```bash
make setup
```

4. **Run locally**:
```bash
make run-dev
```

### Docker Deployment

1. **Build and run with Docker Compose**:
```bash
make docker-compose-up
```

2. **View logs**:
```bash
make docker-compose-logs
```

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | HTTP server port | `8002` | No |
| `LOG_LEVEL` | Logging level | `info` | No |
| `ENVIRONMENT` | Environment name | `development` | No |

#### NATS Configuration
| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NATS_URL` | NATS server URL | `nats://localhost:4222` | Yes |
| `NATS_SUBJECT_PREFIX` | Event subject prefix | `zamc` | No |
| `NATS_QUEUE_GROUP` | Queue group name | `connectors` | No |

#### Google Ads Configuration
| Variable | Description | Required |
|----------|-------------|----------|
| `GOOGLE_ADS_DEVELOPER_TOKEN` | Developer token | Yes |
| `GOOGLE_ADS_CLIENT_ID` | OAuth2 client ID | Yes |
| `GOOGLE_ADS_CLIENT_SECRET` | OAuth2 client secret | Yes |
| `GOOGLE_ADS_REFRESH_TOKEN` | OAuth2 refresh token | Yes |
| `GOOGLE_ADS_CUSTOMER_ID` | Customer ID | Yes |
| `GOOGLE_ADS_LOGIN_CUSTOMER_ID` | Login customer ID | No |

#### Meta Marketing API Configuration
| Variable | Description | Required |
|----------|-------------|----------|
| `META_APP_ID` | Facebook App ID | Yes |
| `META_APP_SECRET` | Facebook App Secret | Yes |
| `META_ACCESS_TOKEN` | Access token | Yes |
| `META_AD_ACCOUNT_ID` | Ad account ID | Yes |
| `META_API_VERSION` | API version | No |

#### Deployment Configuration
| Variable | Description | Default |
|----------|-------------|---------|
| `DEPLOYMENT_MAX_RETRY_ATTEMPTS` | Max retry attempts | `3` |
| `DEPLOYMENT_RETRY_DELAY` | Retry delay | `5s` |
| `DEPLOYMENT_TIMEOUT` | Operation timeout | `30s` |
| `DEPLOYMENT_CONCURRENT_LIMIT` | Concurrent deployments | `10` |

## 📡 API Endpoints

### Health Check
```http
GET /health
```

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0",
  "services": {
    "google_ads": "healthy",
    "meta": "healthy",
    "nats": "healthy"
  }
}
```

### Metrics
```http
GET /metrics
```

**Response**:
```json
{
  "total_deployments": 150,
  "successful_deployments": 142,
  "failed_deployments": 8,
  "average_duration": "2.3s",
  "platforms": {
    "google_ads": {
      "deployments": 75,
      "success_rate": "96%"
    },
    "meta": {
      "deployments": 75,
      "success_rate": "92%"
    }
  }
}
```

### Ready Check
```http
GET /ready
```

### Service Info
```http
GET /
```

## 🔄 Event Flow

### Input Event: `asset.status_changed`

```json
{
  "event_type": "asset.status_changed",
  "asset_id": "uuid",
  "project_id": "uuid",
  "strategy_id": "uuid",
  "status": "approved",
  "prev_status": "review",
  "content_type": "social_media",
  "title": "Marketing Campaign",
  "content": "Campaign content...",
  "metadata": {
    "platforms": ["google_ads", "meta"],
    "target_audience": "Tech professionals",
    "budget": 100.0,
    "campaign_type": "awareness",
    "keywords": ["technology", "innovation"],
    "demographics": {
      "age_min": 25,
      "age_max": 45,
      "genders": ["male", "female"],
      "locations": ["US", "CA"],
      "interests": ["technology", "business"]
    },
    "creative_specs": {
      "image_url": "https://example.com/image.jpg",
      "headline": "Innovative Solutions",
      "description": "Discover cutting-edge technology",
      "call_to_action": "Learn More",
      "landing_url": "https://example.com/landing"
    }
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Output Events

#### Deployment Status Event: `asset.deployment_status_changed`

```json
{
  "event_type": "asset.deployment_status_changed",
  "asset_id": "uuid",
  "project_id": "uuid",
  "strategy_id": "uuid",
  "platform": "google_ads",
  "status": "deployed",
  "prev_status": "approved",
  "deployment_result": {
    "asset_id": "uuid",
    "platform": "google_ads",
    "status": "success",
    "platform_id": "campaign_123",
    "platform_url": "https://ads.google.com/aw/ads?campaignId=123",
    "deployed_at": "2024-01-15T10:31:00Z",
    "metrics": {
      "duration": "2.3s",
      "retry_count": 0,
      "data_sent": 1024,
      "data_received": 512
    }
  },
  "timestamp": "2024-01-15T10:31:00Z"
}
```

#### Final Asset Status Event: `asset.status_changed`

```json
{
  "event_type": "asset.status_changed",
  "asset_id": "uuid",
  "project_id": "uuid",
  "strategy_id": "uuid",
  "status": "deployed",
  "prev_status": "approved",
  "content_type": "social_media",
  "title": "Marketing Campaign",
  "content": "Campaign content...",
  "metadata": { /* same as input */ },
  "timestamp": "2024-01-15T10:31:30Z"
}
```

## 🎯 Content Type Mapping

| Content Type | Google Ads Format | Meta Format |
|--------------|-------------------|-------------|
| `social_media` | Text Ad | Link Ad |
| `blog_post` | Responsive Search Ad | Link Ad |
| `video_script` | Video Ad | Video Ad |
| `infographic` | Image Ad | Image Ad |
| `email_campaign` | Text Ad | Link Ad |

## 🧪 Testing

### Run Tests
```bash
# Unit tests
make test

# Integration tests
make test-integration

# All tests with coverage
make test-all
make test-coverage
```

### Test Coverage
```bash
# Generate coverage report
make test-coverage

# View coverage in browser
open coverage/coverage.html
```

### Manual Testing

1. **Start services**:
```bash
make docker-compose-up
```

2. **Publish test event**:
```bash
# Using NATS CLI
nats pub zamc.asset.status_changed '{"event_type":"asset.status_changed","asset_id":"test-123","status":"approved","content_type":"social_media","metadata":{"platforms":["google_ads"]}}'
```

3. **Check logs**:
```bash
make docker-compose-logs
```

## 🚀 Deployment

### Production Deployment

1. **Build production image**:
```bash
make docker-build
```

2. **Deploy with environment variables**:
```bash
docker run -d \
  --name zamc-connectors \
  -p 8002:8002 \
  --env-file .env.production \
  zamc-connectors:latest
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: zamc-connectors
spec:
  replicas: 3
  selector:
    matchLabels:
      app: zamc-connectors
  template:
    metadata:
      labels:
        app: zamc-connectors
    spec:
      containers:
      - name: connectors
        image: zamc-connectors:latest
        ports:
        - containerPort: 8002
        env:
        - name: NATS_URL
          value: "nats://nats-service:4222"
        envFrom:
        - secretRef:
            name: connectors-secrets
        livenessProbe:
          httpGet:
            path: /health
            port: 8002
          initialDelaySeconds: 30
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /ready
            port: 8002
          initialDelaySeconds: 5
          periodSeconds: 10
```

## 📊 Monitoring

### Health Checks

The service provides multiple health check endpoints:

- `/health` - Overall service health
- `/ready` - Readiness for traffic
- `/metrics` - Deployment statistics

### Logging

Structured JSON logging with configurable levels:

```json
{
  "level": "info",
  "time": "2024-01-15T10:30:00Z",
  "msg": "Deployment successful",
  "asset_id": "uuid",
  "platform": "google_ads",
  "duration": "2.3s"
}
```

### Metrics Collection

Optional Prometheus integration for metrics collection:

```bash
# Start with monitoring
docker-compose --profile monitoring up -d

# Access Grafana
open http://localhost:3000
# Username: admin, Password: admin
```

## 🔧 Development

### Code Quality

```bash
# Format code
make fmt

# Run linters
make lint

# Security scan
make security-scan

# All checks
make check
```

### Debugging

```bash
# Run with debug logging
LOG_LEVEL=debug make run-dev

# Profile performance
make profile

# View profiling results
go tool pprof cpu.prof
```

## 🔐 Security

### Credentials Management

- Store API credentials in environment variables
- Use Docker secrets in production
- Never commit credentials to version control
- Rotate credentials regularly

### Network Security

- Service runs as non-root user
- Minimal container image (scratch-based)
- TLS encryption for external API calls
- Network isolation with Docker networks

### API Security

- Input validation and sanitization
- Rate limiting on external API calls
- Timeout protection
- Error handling without information leakage

## 🐛 Troubleshooting

### Common Issues

1. **NATS Connection Failed**
   ```bash
   # Check NATS server status
   curl http://localhost:8222/healthz
   
   # Verify NATS URL configuration
   echo $NATS_URL
   ```

2. **Google Ads API Errors**
   ```bash
   # Verify credentials
   echo $GOOGLE_ADS_DEVELOPER_TOKEN
   
   # Check customer ID format (no dashes)
   echo $GOOGLE_ADS_CUSTOMER_ID
   ```

3. **Meta API Errors**
   ```bash
   # Test access token
   curl "https://graph.facebook.com/me?access_token=$META_ACCESS_TOKEN"
   
   # Verify ad account permissions
   curl "https://graph.facebook.com/act_$META_AD_ACCOUNT_ID?access_token=$META_ACCESS_TOKEN"
   ```

4. **Deployment Failures**
   ```bash
   # Check service logs
   make docker-compose-logs
   
   # Verify health status
   curl http://localhost:8002/health
   ```

### Debug Mode

```bash
# Enable debug logging
export LOG_LEVEL=debug

# Run with verbose output
make run-dev
```

## 📚 API Documentation

### Google Ads Integration

- **API Version**: v16
- **Authentication**: OAuth2
- **Supported Ad Types**: Text, Responsive Search, Video
- **Rate Limits**: Handled automatically

### Meta Marketing Integration

- **API Version**: v18.0 (configurable)
- **Authentication**: Access Token
- **Supported Ad Types**: Link, Image, Video
- **Rate Limits**: Handled automatically

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Run quality checks: `make check`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:

- Create an issue in the repository
- Check the troubleshooting section
- Review the logs for error details

---

**Version**: 1.0.0  
**Last Updated**: January 2024 
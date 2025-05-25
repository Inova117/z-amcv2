# ZAMC AI Strategy Generator (Orchestrator)

A Python 3.12 microservice using FastAPI that generates comprehensive 90-day marketing strategies and content drafts using LangChain, OpenAI, Qdrant vector database, and NATS for event pub/sub.

## Features

- **AI-Powered Strategy Generation**: Creates comprehensive 90-day marketing strategies using LangChain and OpenAI GPT-4
- **Content Draft Creation**: Generates various content types (blog posts, social media, email campaigns, video scripts, infographics)
- **Vector Search**: Stores and retrieves strategies/content using Qdrant vector database with semantic search
- **Event-Driven Architecture**: Publishes events via NATS for downstream processing
- **RESTful API**: FastAPI-based REST API with automatic OpenAPI documentation
- **Production Ready**: Comprehensive logging, health checks, error handling, and monitoring

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │───▶│   Orchestrator   │───▶│   OpenAI API    │
│   (React)       │    │   (FastAPI)      │    │   (LangChain)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │   Qdrant Vector  │
                       │   Database       │
                       └──────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │   NATS Pub/Sub   │
                       │   (Events)       │
                       └──────────────────┘
```

## Prerequisites

- Python 3.12+
- Poetry (for dependency management)
- Docker & Docker Compose (for containerized deployment)
- OpenAI API Key
- Access to Qdrant vector database
- Access to NATS server

## Installation

### Local Development

1. **Clone and navigate to the service:**
   ```bash
   cd services/orchestrator
   ```

2. **Install dependencies:**
   ```bash
   make install
   # or
   poetry install
   ```

3. **Set up environment variables:**
   ```bash
   make setup
   # or
   cp env.example .env
   ```

4. **Configure your `.env` file:**
   ```env
   # Required: OpenAI API Key
   OPENAI_API_KEY=your_openai_api_key_here
   
   # Optional: Customize other settings
   QDRANT_URL=http://localhost:6333
   NATS_URL=nats://localhost:4222
   BFF_URL=http://localhost:8080
   ```

### Docker Development

1. **Build and run with Docker Compose:**
   ```bash
   make docker-run
   # or
   docker-compose up -d
   ```

2. **View logs:**
   ```bash
   make logs
   # or
   docker-compose logs -f orchestrator
   ```

## Usage

### Starting the Service

**Local development:**
```bash
make dev
# or
poetry run python -m orchestrator.main
```

**Docker:**
```bash
make docker-run
```

The service will be available at:
- API: `http://localhost:8001`
- Documentation: `http://localhost:8001/docs`
- Health Check: `http://localhost:8001/api/v1/health`

### API Endpoints

#### Generate Strategy
```bash
POST /api/v1/generate-strategy
```

Generate a comprehensive 90-day marketing strategy with content drafts.

**Request:**
```json
{
  "project_id": "123e4567-e89b-12d3-a456-426614174000",
  "content_types": ["blog_post", "social_media", "email_campaign"],
  "max_content_pieces": 10,
  "regenerate": false
}
```

**Response:**
```json
{
  "strategy_id": "987fcdeb-51a2-43d1-b789-123456789abc",
  "project_id": "123e4567-e89b-12d3-a456-426614174000",
  "status": "completed",
  "message": "Strategy generated successfully with 3 content drafts",
  "strategy": {
    "id": "987fcdeb-51a2-43d1-b789-123456789abc",
    "title": "90-Day Tech Startup Marketing Strategy",
    "description": "Comprehensive marketing strategy...",
    "phases": [...],
    "key_messages": [...],
    "success_metrics": [...]
  },
  "content_drafts": [...]
}
```

#### Get Strategy
```bash
GET /api/v1/strategies/{strategy_id}
```

#### Search Similar Strategies
```bash
GET /api/v1/search/strategies?query=technology marketing&limit=5
```

#### Search Similar Content
```bash
GET /api/v1/search/content?query=blog post about AI&content_type=blog_post&limit=10
```

#### Health Check
```bash
GET /api/v1/health
```

### Example Usage

**Generate a strategy:**
```bash
curl -X POST "http://localhost:8001/api/v1/generate-strategy" \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "123e4567-e89b-12d3-a456-426614174000",
    "content_types": ["blog_post", "social_media"],
    "max_content_pieces": 5
  }'
```

**Search for similar strategies:**
```bash
curl "http://localhost:8001/api/v1/search/strategies?query=technology%20marketing%20strategy&limit=3"
```

## Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `OPENAI_API_KEY` | OpenAI API key for LangChain | - | ✅ |
| `HOST` | Server host | `0.0.0.0` | ❌ |
| `PORT` | Server port | `8001` | ❌ |
| `DEBUG` | Debug mode | `false` | ❌ |
| `LOG_LEVEL` | Logging level | `INFO` | ❌ |
| `QDRANT_URL` | Qdrant server URL | `http://localhost:6333` | ❌ |
| `NATS_URL` | NATS server URL | `nats://localhost:4222` | ❌ |
| `BFF_URL` | BFF service URL | `http://localhost:8080` | ❌ |
| `STRATEGY_DURATION_DAYS` | Strategy duration | `90` | ❌ |
| `MAX_CONTENT_PIECES` | Max content pieces | `50` | ❌ |

### Content Types

The service supports generating the following content types:

- `blog_post` - Blog post outlines and introductions
- `social_media` - Social media post ideas for various platforms
- `email_campaign` - Email marketing campaigns
- `video_script` - Video scripts with scene breakdowns
- `infographic` - Infographic concepts and layouts

## Development

### Running Tests

```bash
# Run all tests
make test

# Run tests with coverage
make test-cov

# Run specific test file
poetry run pytest tests/test_strategy_service.py -v
```

### Code Quality

```bash
# Format code
make format

# Run linting
make lint

# Run all checks
make check
```

### Project Structure

```
services/orchestrator/
├── src/orchestrator/           # Main application code
│   ├── api/                   # FastAPI routes and dependencies
│   ├── services/              # Business logic services
│   ├── models.py              # Pydantic models
│   ├── config.py              # Configuration management
│   └── main.py                # Application entry point
├── tests/                     # Unit tests
├── docker-compose.yml         # Local development setup
├── Dockerfile                 # Container definition
├── pyproject.toml            # Poetry configuration
├── Makefile                  # Development tasks
└── README.md                 # This file
```

### Adding New Content Types

1. **Add to ContentType enum** in `models.py`:
   ```python
   class ContentType(str, Enum):
       NEW_TYPE = "new_type"
   ```

2. **Add prompt template** in `langchain_service.py`:
   ```python
   ContentType.NEW_TYPE: """
   Create new content type for: {strategy_title}
   ...
   """
   ```

3. **Update configuration** in `config.py` if needed.

## Events

The service publishes the following NATS events:

### `zamc.events.plan.created`
Published when a marketing strategy is successfully generated.

```json
{
  "event_type": "plan.created",
  "project_id": "uuid",
  "strategy_id": "uuid",
  "plan_title": "Strategy Title",
  "phases_count": 3,
  "content_pieces_count": 10,
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### `zamc.events.asset.draft_created`
Published for each content draft created.

```json
{
  "event_type": "asset.draft_created",
  "project_id": "uuid",
  "strategy_id": "uuid",
  "draft_id": "uuid",
  "content_type": "blog_post",
  "title": "Content Title",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## Monitoring

### Health Checks

The service provides comprehensive health checks:

```bash
curl http://localhost:8001/api/v1/health
```

Response includes status of all dependencies:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z",
  "version": "0.1.0",
  "services": {
    "qdrant": "healthy",
    "nats": "healthy",
    "langchain": "healthy"
  }
}
```

### Logging

The service uses structured logging with JSON output:

```json
{
  "timestamp": "2024-01-01T00:00:00Z",
  "level": "info",
  "logger": "orchestrator.services.strategy_service",
  "message": "Strategy generation completed",
  "project_id": "uuid",
  "strategy_id": "uuid",
  "content_drafts_count": 5
}
```

## Deployment

### Docker Production

1. **Build production image:**
   ```bash
   docker build -t zamc-orchestrator:latest .
   ```

2. **Run with environment variables:**
   ```bash
   docker run -d \
     --name zamc-orchestrator \
     -p 8001:8001 \
     -e OPENAI_API_KEY=your_key \
     -e QDRANT_URL=http://qdrant:6333 \
     -e NATS_URL=nats://nats:4222 \
     zamc-orchestrator:latest
   ```

### Kubernetes

Example Kubernetes deployment:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: zamc-orchestrator
spec:
  replicas: 3
  selector:
    matchLabels:
      app: zamc-orchestrator
  template:
    metadata:
      labels:
        app: zamc-orchestrator
    spec:
      containers:
      - name: orchestrator
        image: zamc-orchestrator:latest
        ports:
        - containerPort: 8001
        env:
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: openai-secret
              key: api-key
        - name: QDRANT_URL
          value: "http://qdrant-service:6333"
        - name: NATS_URL
          value: "nats://nats-service:4222"
        livenessProbe:
          httpGet:
            path: /api/v1/health
            port: 8001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/v1/health
            port: 8001
          initialDelaySeconds: 5
          periodSeconds: 5
```

## Troubleshooting

### Common Issues

1. **OpenAI API Key not set:**
   ```
   Error: OpenAI API key not configured
   Solution: Set OPENAI_API_KEY environment variable
   ```

2. **Qdrant connection failed:**
   ```
   Error: Failed to connect to Qdrant
   Solution: Ensure Qdrant is running and accessible at QDRANT_URL
   ```

3. **NATS connection failed:**
   ```
   Error: Failed to connect to NATS
   Solution: Ensure NATS server is running and accessible at NATS_URL
   ```

4. **Strategy generation timeout:**
   ```
   Error: Strategy generation timed out
   Solution: Check OpenAI API limits and network connectivity
   ```

### Debug Mode

Enable debug mode for detailed logging:

```bash
export DEBUG=true
export LOG_LEVEL=DEBUG
make dev
```

### Performance Tuning

1. **Adjust OpenAI parameters:**
   ```env
   OPENAI_TEMPERATURE=0.5  # Lower for more consistent output
   OPENAI_MAX_TOKENS=2000  # Reduce for faster generation
   ```

2. **Limit content generation:**
   ```env
   MAX_CONTENT_PIECES=20   # Reduce for faster processing
   ```

3. **Configure Qdrant collection:**
   ```env
   QDRANT_VECTOR_SIZE=768  # Use smaller embeddings if possible
   ```

## Contributing

1. **Fork the repository**
2. **Create a feature branch:** `git checkout -b feature/new-feature`
3. **Make changes and add tests**
4. **Run quality checks:** `make check`
5. **Commit changes:** `git commit -am 'Add new feature'`
6. **Push to branch:** `git push origin feature/new-feature`
7. **Create Pull Request**

### Development Guidelines

- Follow PEP 8 style guidelines
- Add type hints to all functions
- Write comprehensive tests for new features
- Update documentation for API changes
- Use structured logging for all log messages

## License

MIT License - see LICENSE file for details.

## Support

For support and questions:

- Create an issue in the repository
- Check the troubleshooting section
- Review the API documentation at `/docs`

---

**ZAMC AI Strategy Generator** - Empowering marketing teams with AI-driven strategy and content generation. 
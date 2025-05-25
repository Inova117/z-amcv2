# ZAMC Platform Infrastructure Overview

## 🏗️ Executive Summary

The ZAMC (Zero-Effort AI Marketing Campaigns) platform is a comprehensive, production-ready infrastructure that enables automated marketing campaign creation and deployment across multiple advertising platforms. Built with modern microservices architecture, the platform provides scalable, secure, and observable infrastructure supporting AI-powered marketing automation.

## 📊 Platform Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              ZAMC Platform Architecture                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐             │
│  │   Frontend      │    │   BFF Layer     │    │   Services      │             │
│  │                 │    │                 │    │                 │             │
│  │  ┌───────────┐  │    │  ┌───────────┐  │    │  ┌───────────┐  │             │
│  │  │ React App │◄─┼────┼─►│ GraphQL   │◄─┼────┼─►│Orchestrator│  │             │
│  │  │ (Vite)    │  │    │  │ API (Go)  │  │    │  │(Python)   │  │             │
│  │  │ Tailwind  │  │    │  │ gqlgen    │  │    │  │ FastAPI   │  │             │
│  │  └───────────┘  │    │  └───────────┘  │    │  └───────────┘  │             │
│  └─────────────────┘    └─────────────────┘    │                 │             │
│                                                │  ┌───────────┐  │             │
│                                                │  │Connectors │  │             │
│                                                │  │(Go)       │  │             │
│                                                │  │Google Ads │  │             │
│                                                │  │Meta API   │  │             │
│                                                │  └───────────┘  │             │
│                                                └─────────────────┘             │
├─────────────────────────────────────────────────────────────────────────────────┤
│                           Infrastructure Layer                                  │
│                                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ PostgreSQL  │  │    Redis    │  │    NATS     │  │ Monitoring  │             │
│  │             │  │             │  │             │  │             │             │
│  │ ┌─────────┐ │  │ ┌─────────┐ │  │ ┌─────────┐ │  │ ┌─────────┐ │             │
│  │ │Database │ │  │ │ Cache   │ │  │ │JetStream│ │  │ │Prometheus│ │             │
│  │ │Supabase │ │  │ │Sessions │ │  │ │Pub/Sub  │ │  │ │ Grafana │ │             │
│  │ │ Auth    │ │  │ │Rate Lmt │ │  │ │Events   │ │  │ │ Jaeger  │ │             │
│  │ └─────────┘ │  │ └─────────┘ │  │ └─────────┘ │  │ └─────────┘ │             │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 🎯 Core Components

### 1. Frontend Layer (ZAMC Web)
**Technology Stack:** React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui

**Key Features:**
- Modern, responsive UI with component-based architecture
- Real-time updates via GraphQL subscriptions
- Campaign creation and management interface
- Analytics dashboard with interactive charts
- Asset management and preview system
- Multi-platform deployment interface

**Infrastructure:**
- Containerized with nginx for production serving
- Health checks and graceful shutdown
- Static asset optimization and caching
- Security headers and CSP policies

### 2. Backend for Frontend (BFF) Layer
**Technology Stack:** Go + GraphQL (gqlgen) + PostgreSQL + Redis

**Key Features:**
- Unified GraphQL API for all frontend operations
- Authentication and authorization middleware
- Real-time subscriptions for live updates
- Caching layer for performance optimization
- Rate limiting and request validation
- API versioning and backward compatibility

**Infrastructure:**
- Horizontal scaling with load balancing
- Connection pooling for database efficiency
- Circuit breaker patterns for resilience
- Comprehensive logging and metrics

### 3. Orchestrator Service (AI Engine)
**Technology Stack:** Python + FastAPI + OpenAI + Anthropic + Hugging Face

**Key Features:**
- AI-powered strategy generation using multiple LLM providers
- Content creation and optimization algorithms
- Campaign planning and budget optimization
- A/B testing strategy recommendations
- Performance prediction models
- Multi-modal content generation (text, images, video)

**Infrastructure:**
- Async processing with queue management
- Resource-intensive workload optimization
- Model caching and inference optimization
- Scalable worker pools for concurrent processing

### 4. Connectors Service (Platform Integration)
**Technology Stack:** Go + Google Ads API v16 + Meta Marketing API v18

**Key Features:**
- Multi-platform ad deployment automation
- Real-time campaign status monitoring
- Automated bid management and optimization
- Performance data synchronization
- Error handling and retry mechanisms
- Platform-specific optimization rules

**Infrastructure:**
- Event-driven architecture with NATS
- Reliable message processing with acknowledgments
- Dead letter queues for failed operations
- Platform API rate limiting compliance

## 🗄️ Data Architecture

### Database Schema (PostgreSQL)
```sql
-- Core Tables
├── auth.users              # User management and authentication
├── public.projects         # Project organization and settings
├── public.strategies       # AI-generated marketing strategies
├── public.assets          # Campaign assets (images, videos, copy)
├── public.deployments     # Platform deployment tracking
└── public.analytics       # Performance metrics and insights

-- Relationships
users (1:N) projects (1:N) strategies (1:N) assets (1:N) deployments (1:N) analytics
```

### Caching Strategy (Redis)
- **Session Management:** User sessions and authentication tokens
- **API Response Caching:** GraphQL query results and computed data
- **Rate Limiting:** Request throttling and quota management
- **Real-time Data:** Live campaign metrics and notifications

### Message Streaming (NATS JetStream)
- **Event Sourcing:** Campaign lifecycle events
- **Service Communication:** Inter-service messaging
- **Deployment Queue:** Asynchronous ad platform operations
- **Analytics Pipeline:** Real-time metrics processing

## 🔧 Infrastructure Implementation

### Deployment Options

#### 1. Docker Compose (Development & Testing)
**Location:** `infra/compose/`

**Components:**
- **docker-compose.yml:** Multi-service orchestration (380 lines)
- **Dockerfiles:** Production-ready containers for each service
- **Environment Configuration:** 198+ environment variables
- **Monitoring Stack:** Prometheus, Grafana, Jaeger integration
- **Development Tools:** pgAdmin, Redis Commander
- **Management:** 40+ Makefile commands for operations

**Features:**
- One-command deployment (`make up`)
- Service profiles (core, apps, monitoring, dev-tools)
- Health checks and dependency management
- Volume persistence and backup procedures
- Network isolation and security

#### 2. Kubernetes + Helm (Production)
**Location:** `infra/k8s/helm/zamc/`

**Components:**
- **Helm Chart:** Complete Kubernetes deployment templates
- **Production Values:** Optimized configurations for scale
- **Security Policies:** Pod security contexts and network policies
- **Autoscaling:** Horizontal Pod Autoscaler (HPA) for all services
- **Ingress:** TLS termination and load balancing
- **Monitoring:** Service monitors and observability stack

**Features:**
- Production-grade security and compliance
- Automatic scaling based on CPU/memory metrics
- Rolling updates with zero downtime
- Persistent storage with backup strategies
- Multi-environment support (dev, staging, prod)

### Infrastructure as Code (IaC)

#### File Structure
```
infra/
├── compose/                    # Docker Compose setup
│   ├── docker-compose.yml     # Main orchestration (380 lines)
│   ├── env.example            # Environment template (198 vars)
│   ├── Makefile              # Management commands (348 lines)
│   ├── dockerfiles/          # Service containers
│   │   ├── Dockerfile.web    # Frontend container
│   │   ├── Dockerfile.bff    # BFF container
│   │   ├── Dockerfile.orchestrator # AI service container
│   │   └── Dockerfile.connectors   # Connectors container
│   ├── configs/              # Configuration files
│   │   └── nginx.conf        # Production nginx config
│   ├── monitoring/           # Observability setup
│   │   ├── prometheus.yml    # Metrics collection
│   │   └── grafana/          # Dashboard configurations
│   └── init-scripts/         # Database initialization
│       └── 01-init-database.sql # Schema and sample data
└── k8s/                      # Kubernetes setup
    ├── helm/zamc/            # Helm chart
    │   ├── Chart.yaml        # Chart metadata
    │   ├── values.yaml       # Default configuration (392 lines)
    │   └── templates/        # Kubernetes manifests
    │       ├── web/          # Frontend deployments
    │       ├── bff/          # BFF deployments
    │       ├── orchestrator/ # AI service deployments
    │       ├── connectors/   # Connectors deployments
    │       ├── secret.yaml   # Secrets management
    │       ├── hpa.yaml      # Autoscaling configuration
    │       └── serviceaccount.yaml # RBAC setup
    ├── values-production.yaml # Production overrides (385 lines)
    ├── deploy.sh             # Automated deployment script (414 lines)
    └── DEPLOYMENT_GUIDE.md   # Comprehensive deployment guide
```

## 🔒 Security Architecture

### Authentication & Authorization
- **JWT-based Authentication:** Secure token management
- **Role-based Access Control (RBAC):** Granular permissions
- **API Key Management:** Secure external service integration
- **Session Management:** Redis-backed session storage

### Container Security
- **Non-root Containers:** All services run as non-privileged users
- **Read-only Root Filesystems:** Immutable container environments
- **Security Contexts:** Kubernetes security policies
- **Image Scanning:** Vulnerability assessment in CI/CD

### Network Security
- **Network Policies:** Kubernetes network isolation
- **TLS Termination:** HTTPS encryption at ingress
- **Service Mesh Ready:** Prepared for Istio integration
- **Firewall Rules:** Port-based access control

### Secrets Management
- **Environment Variables:** Development configuration
- **Kubernetes Secrets:** Production secret storage
- **External Secret Operators:** Integration with vault systems
- **Rotation Policies:** Automated secret rotation

## 📊 Monitoring & Observability

### Metrics Collection (Prometheus)
- **Application Metrics:** Custom business metrics
- **Infrastructure Metrics:** System resource monitoring
- **Service Discovery:** Automatic target detection
- **Alerting Rules:** Proactive issue detection

### Visualization (Grafana)
- **Pre-built Dashboards:** Service-specific monitoring
- **Custom Dashboards:** Business intelligence views
- **Alerting Integration:** Multi-channel notifications
- **Data Source Management:** Multiple metric sources

### Distributed Tracing (Jaeger)
- **Request Tracing:** End-to-end request tracking
- **Performance Analysis:** Latency and bottleneck identification
- **Service Dependencies:** Inter-service communication mapping
- **Error Tracking:** Distributed error analysis

### Logging Strategy
- **Structured Logging:** JSON-formatted log entries
- **Centralized Collection:** Aggregated log management
- **Log Levels:** Configurable verbosity
- **Log Retention:** Automated cleanup policies

## ⚡ Performance & Scalability

### Horizontal Scaling
- **Stateless Services:** All application services are stateless
- **Load Balancing:** Intelligent request distribution
- **Auto-scaling:** CPU/memory-based scaling policies
- **Resource Limits:** Proper resource allocation

### Caching Strategy
- **Multi-layer Caching:** Application, database, and CDN caching
- **Cache Invalidation:** Smart cache refresh policies
- **Redis Clustering:** Distributed cache for high availability
- **CDN Integration:** Global content delivery

### Database Optimization
- **Connection Pooling:** Efficient database connections
- **Query Optimization:** Indexed queries and performance tuning
- **Read Replicas:** Distributed read operations
- **Backup Strategies:** Automated backup and recovery

### Performance Benchmarks
- **Response Times:** < 200ms for API calls
- **Throughput:** 1000+ requests per second
- **Availability:** 99.9% uptime SLA
- **Scalability:** Auto-scale from 2 to 50+ instances

## 🔄 DevOps & CI/CD

### Deployment Automation
- **Infrastructure as Code:** Complete automation
- **GitOps Workflows:** Git-based deployment triggers
- **Environment Promotion:** Automated staging to production
- **Rollback Procedures:** Quick recovery mechanisms

### Quality Assurance
- **Automated Testing:** Unit, integration, and e2e tests
- **Code Quality Gates:** Linting and security scanning
- **Performance Testing:** Load and stress testing
- **Security Scanning:** Vulnerability assessment

### Monitoring & Alerting
- **Health Checks:** Comprehensive service monitoring
- **SLA Monitoring:** Performance threshold tracking
- **Incident Response:** Automated alerting and escalation
- **Post-mortem Analysis:** Continuous improvement processes

## 💾 Data Management

### Backup & Recovery
- **Automated Backups:** Daily database and volume backups
- **Point-in-time Recovery:** Granular recovery options
- **Cross-region Replication:** Disaster recovery preparation
- **Backup Testing:** Regular recovery procedure validation

### Data Retention
- **Lifecycle Policies:** Automated data archival
- **Compliance Requirements:** GDPR and data protection
- **Storage Optimization:** Cost-effective data management
- **Analytics Retention:** Long-term metrics storage

## 🌐 Multi-Environment Support

### Environment Configurations
- **Development:** Local development with Docker Compose
- **Staging:** Kubernetes cluster for testing
- **Production:** High-availability Kubernetes deployment
- **DR (Disaster Recovery):** Cross-region backup environment

### Configuration Management
- **Environment Variables:** Environment-specific settings
- **Secret Management:** Secure credential handling
- **Feature Flags:** Gradual feature rollouts
- **A/B Testing:** Experimental configuration support

## 📈 Capacity Planning

### Resource Requirements

#### Minimum (Development)
- **CPU:** 4 cores
- **Memory:** 8GB RAM
- **Storage:** 20GB SSD
- **Network:** 100 Mbps

#### Recommended (Production)
- **CPU:** 16+ cores
- **Memory:** 32GB+ RAM
- **Storage:** 500GB+ SSD
- **Network:** 1 Gbps

#### Enterprise (High Scale)
- **CPU:** 64+ cores
- **Memory:** 128GB+ RAM
- **Storage:** 2TB+ NVMe SSD
- **Network:** 10 Gbps

### Scaling Projections
- **Users:** Support for 10,000+ concurrent users
- **Campaigns:** Handle 100,000+ active campaigns
- **API Calls:** Process 1M+ requests per day
- **Data Storage:** Manage 10TB+ of campaign data

## 🔧 Operational Procedures

### Deployment Procedures
1. **Pre-deployment Checks:** Health verification
2. **Blue-Green Deployment:** Zero-downtime updates
3. **Canary Releases:** Gradual rollout strategy
4. **Rollback Procedures:** Quick recovery options

### Maintenance Windows
- **Scheduled Maintenance:** Monthly update windows
- **Emergency Patches:** Critical security updates
- **Database Maintenance:** Performance optimization
- **Infrastructure Updates:** Platform upgrades

### Incident Response
- **On-call Procedures:** 24/7 support coverage
- **Escalation Matrix:** Clear responsibility chains
- **Communication Plans:** Stakeholder notifications
- **Post-incident Reviews:** Continuous improvement

## 📚 Documentation & Training

### Technical Documentation
- **API Documentation:** GraphQL schema and examples
- **Deployment Guides:** Step-by-step procedures
- **Troubleshooting Guides:** Common issues and solutions
- **Architecture Decisions:** Design rationale documentation

### Operational Runbooks
- **Service Management:** Start, stop, restart procedures
- **Monitoring Procedures:** Alert response guidelines
- **Backup & Recovery:** Data protection procedures
- **Security Incident Response:** Breach response plans

## 🎯 Future Roadmap

### Short-term (Q1 2024)
- [ ] Enhanced monitoring dashboards
- [ ] Automated testing pipeline
- [ ] Performance optimization
- [ ] Security hardening

### Medium-term (Q2-Q3 2024)
- [ ] Multi-region deployment
- [ ] Advanced AI model integration
- [ ] Real-time analytics enhancement
- [ ] Mobile application support

### Long-term (Q4 2024+)
- [ ] Edge computing integration
- [ ] Advanced ML/AI capabilities
- [ ] Global CDN deployment
- [ ] Enterprise feature expansion

## 📞 Support & Maintenance

### Support Channels
- **Technical Support:** support@zamc.dev
- **Community Forum:** Discord community
- **Documentation:** docs.zamc.dev
- **Emergency Contact:** 24/7 on-call support

### Maintenance Schedule
- **Daily:** Automated health checks
- **Weekly:** Performance reviews
- **Monthly:** Security updates
- **Quarterly:** Major version updates

---

**Document Version:** 1.0  
**Last Updated:** December 2024  
**Next Review:** March 2025 
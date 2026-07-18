# System Architecture

## Overview

Contract AI Platform is built on a modern microservices architecture with clear separation of concerns, scalability, and enterprise-grade reliability.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Browser / Mobile App / Desktop (Next.js Frontend)       │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │ HTTPS
┌─────────────────────────────────────────────────────────────────┐
│                      API Gateway Layer                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Nginx (Routing, Rate Limiting, Load Balancing)         │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                    │             │             │
        ┌───────────┼─────────────┼─────────────┤
        │           │             │             │
        ▼           ▼             ▼             ▼
  ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐
  │  Web    │ │   API    │ │    AI    │ │  OCR Service │
  │ Backend │ │ Service  │ │ Service  │ │              │
  │(Next.js)│ │(NestJS)  │ │(FastAPI) │ │  (FastAPI)   │
  └─────────┘ └──────────┘ └──────────┘ └──────────────┘
        │           │             │             │
        └───────────┼─────────────┼─────────────┘
                    │
        ┌───────────┼─────────────────────┐
        │           │                     │
        ▼           ▼                     ▼
  ┌─────────┐ ┌──────────┐        ┌─────────────┐
  │ Primary │ │  Cache   │        │   Message   │
  │Database │ │  (Redis) │        │  Queue      │
  │(Postgres)│ └──────────┘        │ (Kafka/BQ)  │
  └─────────┘                      └─────────────┘
        │
        ▼
  ┌─────────────┐
  │ Vector DB   │
  │  (Qdrant)   │
  └─────────────┘
```

## Service Architecture

### 1. Frontend Service (Next.js)

- **Purpose**: User interface and client-side rendering
- **Technology**: Next.js 15, React 19, TypeScript
- **Port**: 3000
- **Responsibilities**:
  - User authentication UI
  - Dashboard and analytics
  - Contract upload and review interface
  - Real-time updates via WebSocket
  - Responsive design (mobile, tablet, desktop)

### 2. API Gateway (Nginx)

- **Purpose**: Request routing, rate limiting, load balancing
- **Port**: 80/443
- **Responsibilities**:
  - Route requests to appropriate services
  - SSL/TLS termination
  - Rate limiting and DDoS protection
  - CORS handling
  - Request/response compression

### 3. Backend API Service (NestJS)

- **Purpose**: Core business logic and REST/GraphQL API
- **Technology**: NestJS, Prisma ORM, PostgreSQL
- **Port**: 3001
- **Key Modules**:
  - **Authentication**: JWT, OAuth2, Keycloak integration
  - **Contracts**: CRUD operations, versioning
  - **Workflows**: Approval workflows, state management
  - **Users & Organizations**: Multi-tenancy, RBAC
  - **Audit Logs**: Comprehensive audit trail

### 4. AI Analysis Service (Python FastAPI)

- **Purpose**: Intelligent contract analysis and risk detection
- **Technology**: Python, FastAPI, LangChain, LangGraph
- **Port**: 8000
- **Key Capabilities**:
  - Clause extraction
  - Risk detection
  - Compliance checking
  - AI summaries (Executive, Legal, Business)
  - AI Chat integration

### 5. OCR Service (Python FastAPI)

- **Purpose**: Document parsing and text extraction
- **Technology**: Python, FastAPI, PaddleOCR, Tesseract
- **Port**: 8001
- **Capabilities**:
  - PDF text extraction
  - Scanned document OCR
  - DOCX, TXT, RTF parsing
  - Image document processing
  - Bulk document processing

### 6. Notification Service (Node.js/TypeScript)

- **Purpose**: Event-driven notifications
- **Technology**: NestJS, BullMQ, Kafka
- **Port**: 8002
- **Supported Channels**:
  - Email (SMTP)
  - Slack
  - Microsoft Teams
  - Push notifications
  - Webhooks

## Data Layer Architecture

### Primary Database (PostgreSQL)

Schema Overview:

```
Organizations
├── Teams
├── Users (with RBAC)
├── Contracts
│   ├── Contract Versions
│   ├── Clauses
│   ├── AI Reviews
│   ├── Risk Reports
│   ├── Compliance Reports
│   ├── Comments
│   └── Approvals
├── Clause Library
│   ├── Reusable Clauses
│   ├── Templates
│   └── Categories
├── Workflows
│   ├── Approval Steps
│   └── Transitions
├── Audit Logs
└── Notifications
```

### Caching Layer (Redis)

- Session storage
- Real-time data caching
- Rate limiting
- Job queue (BullMQ)
- Pub/Sub for real-time updates

### Vector Database (Qdrant)

- Clause embeddings
- Semantic search
- Similarity matching
- Legal document vectors

### Message Queue (Kafka)

- Async contract analysis
- Document processing events
- Notification delivery
- Audit log streaming

## Communication Patterns

### Synchronous

- REST API for CRUD operations
- GraphQL for flexible queries
- WebSocket for real-time updates

### Asynchronous

- Kafka for event streaming
- BullMQ for job processing
- Webhooks for external integrations

## Data Flow

### Contract Upload Flow

```
1. User uploads document
   ↓
2. Frontend sends to API (REST)
   ↓
3. API stores file in S3/Blob storage
   ↓
4. API publishes event to Kafka
   ↓
5. OCR Service processes document
   ↓
6. AI Service analyzes contract
   ↓
7. Results stored in PostgreSQL + Qdrant
   ↓
8. Notification Service sends update
   ↓
9. WebSocket notifies frontend in real-time
```

### Risk Detection Flow

```
1. AI Service receives contract
   ↓
2. Extracts clauses using LLM
   ↓
3. Checks against compliance rules
   ↓
4. Detects missing clauses
   ↓
5. Identifies financial risks
   ↓
6. Generates risk report
   ↓
7. Stores in PostgreSQL
   ↓
8. Indexes in vector DB for search
```

## Security Architecture

### Authentication & Authorization

- **JWT Tokens**: Stateless authentication
- **Refresh Tokens**: Long-lived token renewal
- **OAuth2**: Social login integration
- **Keycloak**: Enterprise SSO
- **RBAC**: Role-based access control

### Data Protection

- **TLS/SSL**: In-transit encryption
- **At-Rest Encryption**: Encrypted database columns
- **API Keys**: Secrets management via environment
- **Row-Level Security**: Multi-tenant isolation

### API Security

- **Rate Limiting**: Per-user and global limits
- **CORS**: Cross-origin resource sharing
- **CSRF Protection**: Token-based CSRF prevention
- **Input Validation**: Zod schemas on frontend/backend
- **Output Encoding**: XSS prevention

### Audit & Compliance

- **Audit Logs**: All user actions logged
- **Encryption Keys**: Rotate regularly
- **Data Residency**: Configurable storage location
- **GDPR Compliance**: Data deletion, export

## Deployment Architecture

### Local Development

- Docker Compose for all services
- Local PostgreSQL and Redis
- Shared development database

### Staging Environment

- Kubernetes cluster
- Managed PostgreSQL (Cloud SQL/RDS)
- Managed Redis (ElastiCache/MemoryStor)
- Separate secrets management

### Production Environment

- Multi-zone Kubernetes cluster
- Auto-scaling based on metrics
- High availability setup
- Blue-green deployments
- Canary deployments for AI models

## Scalability Considerations

### Horizontal Scaling

- Stateless services scale easily
- Load balancing via Nginx/K8s
- Database connection pooling
- Redis cluster for caching

### Vertical Scaling

- Increase resource requests in K8s
- Database instance upsizing
- Vector DB sharding

### Performance Optimization

- Database indexes on frequently queried columns
- Caching frequently accessed data
- Pagination for large result sets
- Asynchronous processing for heavy tasks
- Vector search indexing for semantic queries

## Monitoring & Observability

### Logging

- ELK Stack (Elasticsearch, Logstash, Kibana)
- Structured logging with JSON
- Log aggregation from all services
- Centralized log search

### Metrics

- Prometheus for metrics collection
- Grafana for visualization
- Custom business metrics
- Infrastructure metrics (CPU, Memory, Disk)

### Tracing

- OpenTelemetry for distributed tracing
- Request flow tracking across services
- Performance bottleneck identification
- Error tracking with Sentry

### Alerting

- Alert rules based on thresholds
- Multi-channel notifications (email, Slack)
- On-call rotation management
- Incident escalation

## Technology Decisions

### Why NestJS for Backend?

- Enterprise-grade framework
- Built-in dependency injection
- TypeScript support
- GraphQL integration
- Testing utilities

### Why FastAPI for AI Service?

- High performance async framework
- Automatic API documentation
- Type hints with Pydantic
- Easy deployment
- Large ML ecosystem

### Why PostgreSQL?

- ACID compliance
- Complex queries support
- JSON/JSONB support
- Row-level security
- Proven reliability

### Why Kafka for Messaging?

- High throughput
- Event replay capability
- Multiple subscribers
- Fault tolerance
- Stream processing

## Future Enhancements

1. **Service Mesh**: Istio for inter-service communication
2. **API Versioning**: Multiple API versions
3. **Multi-Region**: Cross-region replication
4. **Real-time Collaboration**: WebSocket multiplayer editing
5. **Machine Learning Pipeline**: Custom model training
6. **Advanced Analytics**: Real-time dashboards with WebSockets

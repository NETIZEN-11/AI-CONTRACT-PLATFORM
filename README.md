# Contract AI Platform

Enterprise-grade AI-powered contract review and management platform built for legal teams, compliance officers, and procurement professionals.

## Overview

Contract AI Platform is a comprehensive SaaS solution that automates contract analysis, risk detection, compliance checking, and collaboration workflows. Powered by advanced AI and machine learning, it transforms how organizations manage their contract lifecycle.

### Key Features

- **AI-Powered Analysis**: Automatic detection of clauses, risks, and compliance issues
- **Multi-Document Support**: PDF, DOCX, TXT, RTF, scanned documents, and bulk uploads
- **Risk Engine**: Identifies missing clauses, conflicting terms, and financial risks
- **Compliance Management**: GDPR, HIPAA, SOC2, ISO27001, PCI DSS compliance checking
- **AI Chat Interface**: Natural language Q&A against contract content
- **Version Comparison**: Track changes, additions, and removals across contract versions
- **Collaboration Tools**: Comments, approvals, e-signatures, and workflow management
- **Advanced Search**: NLP-powered search across contract databases
- **Analytics Dashboard**: Track metrics, performance, and organizational analytics

## Technology Stack

### Frontend

- **Next.js 15** - React framework
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - Component library
- **TanStack Query** - Data fetching
- **Zustand** - State management

### Backend

- **NestJS** - Node.js framework
- **Prisma ORM** - Database ORM
- **PostgreSQL** - Primary database
- **Redis** - Caching & sessions
- **BullMQ** - Job queue
- **Kafka** - Event streaming

### AI/ML Services

- **Python FastAPI** - AI service framework
- **LangGraph** - Agentic workflows
- **LangChain** - LLM orchestration
- **OpenAI/Claude/Gemini** - LLM providers
- **spaCy** - NLP
- **Qdrant** - Vector database
- **PaddleOCR/Tesseract** - Document OCR

### Infrastructure

- **Docker** - Containerization
- **Kubernetes** - Orchestration
- **Terraform** - IaC
- **GitHub Actions** - CI/CD

## Project Structure

```
contract-ai-platform/
├── apps/                      # Applications
│   ├── web/                  # Next.js frontend
│   ├── api/                  # NestJS backend API
│   ├── ai-service/           # Python AI service
│   ├── ocr-service/          # Document OCR service
│   └── notification-service/ # Notification service
├── packages/                  # Shared packages
│   ├── ui/                   # Shared UI components
│   ├── database/             # Database schemas
│   ├── auth/                 # Auth utilities
│   ├── shared/               # Shared types
│   ├── utils/                # Utility functions
│   ├── hooks/                # React hooks
│   └── api-client/           # API client
├── infrastructure/            # Infrastructure
│   ├── docker/               # Docker configs
│   ├── kubernetes/           # K8s manifests
│   ├── terraform/            # Terraform IaC
│   └── nginx/                # Nginx configs
├── docs/                      # Documentation
├── scripts/                   # Utility scripts
└── tests/                     # Test suites
```

## Getting Started

### Prerequisites

- **Node.js** >= 18.0.0
- **pnpm** >= 8.0.0
- **PostgreSQL** >= 14
- **Redis** >= 7
- **Python** >= 3.11 (for AI service)
- **Docker** & **Docker Compose** (for containerized setup)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd contract-ai-platform
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Setup environment variables**

   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Start infrastructure services**

   ```bash
   docker-compose -f infrastructure/docker/docker-compose.yml up -d
   ```

5. **Setup database**

   ```bash
   pnpm db:migrate
   pnpm db:seed
   ```

6. **Start development servers**
   ```bash
   pnpm dev
   ```

The application will be available at:

- Frontend: http://localhost:3000
- API: http://localhost:3001
- AI Service: http://localhost:8000

## Development

### Available Commands

```bash
# Development
pnpm dev              # Start all services in development mode
pnpm build            # Build all packages and apps
pnpm start            # Start production build

# Code Quality
pnpm lint             # Run ESLint
pnpm format           # Format code with Prettier
pnpm type-check       # Type check all packages

# Database
pnpm db:migrate       # Run database migrations
pnpm db:seed          # Seed database with sample data
pnpm db:studio        # Open Prisma Studio

# Docker
pnpm docker:build     # Build Docker images
pnpm docker:up        # Start Docker containers
pnpm docker:down      # Stop Docker containers

# Testing
pnpm test             # Run all tests

# Cleaning
pnpm clean            # Clean all build artifacts
```

### Project Scripts

Located in `/scripts/`:

- `setup-dev.sh` - Development environment setup
- `backup-db.sh` - Database backup script
- `generate-docs.sh` - Generate API documentation

## Architecture

### System Design

The platform is built using a microservices architecture:

1. **API Gateway** - Request routing and authentication
2. **Authentication Service** - JWT/OAuth with Keycloak
3. **Contract Service** - Contract CRUD operations
4. **AI Analysis Service** - Contract analysis and risk detection
5. **OCR Service** - Document parsing and extraction
6. **Notification Service** - Email, Slack, Teams notifications
7. **Search Service** - Vector-based semantic search
8. **Analytics Service** - Metrics and insights

### Data Flow

```
Upload Document
    ↓
OCR & Parsing
    ↓
Clause Extraction
    ↓
AI Analysis
    ↓
Risk Detection
    ↓
Compliance Checking
    ↓
Store & Index
    ↓
Display Results
```

## API Documentation

API documentation is available at:

- **Swagger UI**: http://localhost:3001/api/docs
- **GraphQL**: http://localhost:3001/graphql

## Database Schema

Prisma schema is located at `packages/database/prisma/schema.prisma`

Key models:

- Users & Organizations
- Contracts & Contract Versions
- Clauses & Clause Library
- AI Reviews & Risk Reports
- Compliance Reports
- Audit Logs
- Workflows & Approvals

## Security

- **RBAC**: Role-based access control
- **SSO**: OAuth2 & OpenID Connect
- **Encryption**: TLS in transit, encryption at rest
- **Rate Limiting**: API rate limiting
- **Audit Logs**: Comprehensive audit trail
- **Secrets Management**: Environment-based secrets

## Deployment

### Production Deployment

1. **Build Docker images**

   ```bash
   pnpm docker:build
   ```

2. **Deploy to Kubernetes**

   ```bash
   kubectl apply -f infrastructure/kubernetes/
   ```

3. **Verify deployment**
   ```bash
   kubectl get pods
   ```

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## License

Proprietary - All rights reserved

## Support

For issues and questions, please contact support@contractai.com

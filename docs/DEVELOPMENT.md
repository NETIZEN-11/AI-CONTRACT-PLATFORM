# Development Guide

This guide explains how to set up and work with the Contract AI Platform codebase.

## Project Structure

### Apps
- **`apps/web`**: Next.js 15 frontend application
- **`apps/api`**: NestJS REST/GraphQL API server
- **`apps/ai-service`**: Python FastAPI AI analysis service
- **`apps/ocr-service`**: Python FastAPI document OCR service
- **`apps/notification-service`**: Event-driven notification service

### Packages
- **`packages/ui`**: Shared React components (shadcn/ui based)
- **`packages/database`**: Prisma schema and database utilities
- **`packages/auth`**: Authentication utilities and types
- **`packages/shared`**: Shared types and interfaces
- **`packages/utils`**: Utility functions
- **`packages/hooks`**: Reusable React hooks
- **`packages/api-client`**: API client SDK

### Infrastructure
- **`infrastructure/docker`**: Docker and Docker Compose configs
- **`infrastructure/kubernetes`**: Kubernetes manifests
- **`infrastructure/terraform`**: Terraform IaC
- **`infrastructure/nginx`**: Nginx configuration (API Gateway)

## Prerequisites

- Node.js 18+
- pnpm 8+
- Python 3.11+ (for AI services)
- PostgreSQL 14+
- Redis 7+
- Docker & Docker Compose (optional, for containerized setup)

## Initial Setup

### 1. Clone and Install

```bash
git clone <repository>
cd contract-ai-platform
pnpm install
```

### 2. Environment Configuration

```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:
- Database credentials
- API keys (OpenAI, etc.)
- OAuth credentials
- Service URLs

### 3. Start Infrastructure

Option A: Using Docker Compose
```bash
docker-compose -f infrastructure/docker/docker-compose.yml up -d
```

Option B: Manual local setup
- Start PostgreSQL on port 5432
- Start Redis on port 6379

### 4. Database Setup

```bash
cd apps/api
pnpm db:migrate
pnpm db:seed
```

### 5. Start Development Servers

Terminal 1 - Web App:
```bash
cd apps/web
pnpm dev
```

Terminal 2 - API Server:
```bash
cd apps/api
pnpm start:dev
```

Terminal 3 - AI Service:
```bash
cd apps/ai-service
python -m uvicorn app.main:app --reload
```

Or start all at once:
```bash
pnpm dev  # From root (requires Turbo)
```

## Development Workflow

### Creating a New Feature

1. **Create feature branch**
   ```bash
   git checkout -b feature/my-feature
   ```

2. **Make changes** in the relevant app or package

3. **Test your changes**
   ```bash
   pnpm lint
   pnpm type-check
   pnpm test
   ```

4. **Commit with conventional commits**
   ```bash
   git commit -m "feat: add new feature"
   ```

5. **Push and create PR**
   ```bash
   git push origin feature/my-feature
   ```

### Code Quality

**Linting**
```bash
pnpm lint          # Lint all packages
cd apps/web && pnpm lint    # Lint specific app
```

**Formatting**
```bash
pnpm format        # Format all files
pnpm format:check  # Check formatting
```

**Type Checking**
```bash
pnpm type-check    # Type check all packages
```

### Database Changes

**Create migration**
```bash
cd apps/api
pnpm prisma migrate dev --name add_new_table
```

**View schema**
```bash
cd apps/api
pnpm db:studio    # Opens Prisma Studio
```

## API Development

### Adding an Endpoint

1. Create a new controller in `apps/api/src/modules/<feature>/`
2. Define DTO in `apps/api/src/modules/<feature>/dto/`
3. Add service logic in `apps/api/src/modules/<feature>/services/`
4. Add routes in the controller

Example controller:
```typescript
// apps/api/src/modules/contracts/contracts.controller.ts
import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ContractsService } from './contracts.service';
import { CreateContractDto } from './dto/create-contract.dto';

@Controller('api/contracts')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Get()
  findAll() {
    return this.contractsService.findAll();
  }

  @Post()
  create(@Body() createContractDto: CreateContractDto) {
    return this.contractsService.create(createContractDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.contractsService.findOne(id);
  }
}
```

## Frontend Development

### Creating a Component

Create components in `apps/web/src/components/`

```typescript
// apps/web/src/components/ContractCard.tsx
'use client';

import { Card } from '@/components/ui/card';

interface ContractCardProps {
  title: string;
  status: 'draft' | 'review' | 'approved';
}

export function ContractCard({ title, status }: ContractCardProps) {
  return (
    <Card className="p-4">
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-gray-500">{status}</p>
    </Card>
  );
}
```

### Using API Client

```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export function ContractsList() {
  const { data, isLoading } = useQuery({
    queryKey: ['contracts'],
    queryFn: () => apiClient.get('/api/contracts'),
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {data?.map((contract) => (
        <ContractCard key={contract.id} {...contract} />
      ))}
    </div>
  );
}
```

## Python Service Development

### AI Service

Located in `apps/ai-service/`

Structure:
```
app/
├── main.py              # FastAPI app
├── config/              # Configuration
├── routers/             # API routes
├── agents/              # AI agents
├── services/            # Business logic
├── models/              # Data models
└── utils/               # Utilities
```

Example route:
```python
# apps/ai-service/app/routers/analysis.py
from fastapi import APIRouter, UploadFile, File
from app.services.analyzer import ContractAnalyzer

router = APIRouter(prefix="/api/analysis", tags=["analysis"])
analyzer = ContractAnalyzer()

@router.post("/analyze")
async def analyze_contract(file: UploadFile = File(...)):
    content = await file.read()
    result = await analyzer.analyze(content)
    return result
```

## Testing

### Run Tests

```bash
pnpm test              # Run all tests
pnpm test:watch        # Watch mode
pnpm test:cov          # With coverage
```

### Unit Testing

Example test:
```typescript
// apps/api/src/modules/contracts/contracts.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ContractsService } from './contracts.service';

describe('ContractsService', () => {
  let service: ContractsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ContractsService],
    }).compile();

    service = module.get<ContractsService>(ContractsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
```

## Debugging

### Backend Debugging

VSCode launch config (`.vscode/launch.json`):
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Nest Debug",
      "program": "${workspaceFolder}/apps/api/node_modules/@nestjs/cli/bin/nest.js",
      "args": ["start", "--debug"],
      "cwd": "${workspaceFolder}/apps/api"
    }
  ]
}
```

### Frontend Debugging

Use Chrome DevTools or VSCode debugger for Next.js.

## Performance Optimization

### Frontend
- Use React.memo for expensive components
- Implement code splitting with dynamic imports
- Optimize images with next/image
- Use SWR for data fetching with caching

### Backend
- Add database indexes
- Implement caching with Redis
- Use pagination for large datasets
- Monitor with Prometheus/Grafana

## Common Issues

### PostgreSQL Connection Issues
```bash
# Check connection string
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL
```

### Redis Connection Issues
```bash
# Check Redis is running
redis-cli ping
# Should return: PONG
```

### Build Errors
```bash
# Clean and rebuild
pnpm clean
pnpm install
pnpm build
```

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment instructions.

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [NestJS Docs](https://docs.nestjs.com)
- [Prisma Docs](https://www.prisma.io/docs)
- [FastAPI Docs](https://fastapi.tiangolo.com)

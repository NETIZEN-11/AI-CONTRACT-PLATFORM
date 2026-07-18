# Database Schema Documentation

## Overview

The Contract AI Platform uses PostgreSQL with Prisma ORM. The database is designed to support multi-tenant SaaS architecture with comprehensive contract lifecycle management, AI analysis, and compliance tracking.

## Architecture

### Multi-Tenancy
- Organization-level isolation
- Team-based grouping within organizations
- All data queries filtered by `organizationId`
- Row-level security ready for PostgreSQL RLS

### Performance Optimization
- Strategic indexing on frequently queried columns
- Full-text search indexes for contract and clause content
- Vector embeddings for semantic search (pgvector)
- Connection pooling ready

## Core Data Models

### Organization
Top-level entity representing a company/legal firm.

```prisma
model Organization {
  id                String     @id @default(cuid())
  name              String
  description       String?
  logo              String?
  website           String?
  industry          String?
  country           String?
  timezone          String     @default("UTC")
  internalPolicies  String?    // JSON with custom compliance policies
}
```

**Key Fields**:
- `internalPolicies`: Custom compliance rules in JSON format
- `timezone`: For scheduling and date handling
- Relations: Teams, Users, Contracts, Reports

### User
Represents team members with role-based access control.

```prisma
model User {
  id                String     @id @default(cuid())
  email             String     @unique
  name              String
  role              UserRole   // ADMIN, LAWYER, MANAGER, etc.
  organizationId    String
  teamId            String?
  isActive          Boolean    @default(true)
  
  // Authentication
  hashedPassword    String?
  emailVerified     DateTime?
  mfaEnabled        Boolean    @default(false)
}

enum UserRole {
  ADMIN
  LEGAL_MANAGER
  LAWYER
  PROCUREMENT
  HR
  FINANCE
  COMPLIANCE_OFFICER
  EXTERNAL_CLIENT
}
```

**Security**:
- Passwords stored as bcrypt hashes
- Email verification tracking
- MFA support
- Last login tracking

### Team
Organizational subgroups within an organization.

```prisma
model Team {
  id                String     @id @default(cuid())
  organizationId    String
  name              String
  description       String?
  
  @@unique([organizationId, name])
}
```

## Contract Models

### Contract
Main contract document entity.

```prisma
model Contract {
  id                String     @id @default(cuid())
  organizationId    String
  teamId            String?
  title             String
  contractType      ContractType
  status            ContractStatus
  
  // Dates
  effectiveDate     DateTime?
  expirationDate    DateTime?
  
  // Financial
  value             Float?
  currency          String?    @default("USD")
  paymentTerms      String?
  
  // Document Storage
  fileUrl           String?    // S3/Blob URL
  fileKey           String?    // Storage key
  fileSize          Int?
  
  // Extracted Content
  extractedText     String?    // Full text for search
  embedding         Vector?    // OpenAI embeddings for semantic search
}

enum ContractStatus {
  DRAFT
  UNDER_REVIEW
  AI_REVIEW
  LEGAL_REVIEW
  COMPLIANCE_REVIEW
  APPROVED
  SIGNED
  EXECUTED
  ARCHIVED
  REJECTED
  EXPIRED
}

enum ContractType {
  NDA
  EMPLOYMENT
  VENDOR
  CLIENT
  SERVICE
  PARTNERSHIP
  PURCHASE
  LEASE
  LICENSE
  INSURANCE
  OTHER
}
```

**Key Features**:
- Status tracking through entire lifecycle
- Expiration date tracking for compliance
- OCR-extracted text for full-text search
- Vector embeddings for AI-powered search
- Multi-tenancy via organizationId

### ContractVersion
Version control for contracts.

```prisma
model ContractVersion {
  id                String     @id @default(cuid())
  contractId        String
  version           Int
  title             String
  changesSummary    String?
  createdAt         DateTime   @default(now())
  createdBy         String
  
  @@unique([contractId, version])
}
```

**Purpose**: Track contract changes over time for audit and comparison.

### Clause
Individual contract clauses extracted during parsing.

```prisma
model Clause {
  id                String     @id @default(cuid())
  organizationId    String
  contractId        String?
  versionId         String?
  title             String
  content           String
  category          String    // "Parties", "Payment Terms", etc.
  embedding         Vector?
  
  isTemplate        Boolean    @default(false)
  isFavorite        Boolean    @default(false)
  riskLevel         RiskLevel? @default(INFO)
}
```

**Categories**:
- Parties
- Effective Date
- Expiration Date
- Payment Terms
- Termination
- Confidentiality
- IP Rights
- Indemnity
- Arbitration
- Force Majeure
- Liability
- Warranty
- SLA
- Custom categories

## AI Analysis Models

### AIReview
Result of AI analysis on a contract.

```prisma
model AIReview {
  id                    String     @id @default(cuid())
  contractId            String
  
  // Analysis Results
  executiveSummary      String?
  legalSummary          String?
  businessSummary       String?
  plainEnglishSummary   String?
  riskSummary           String?
  obligationSummary     String?
  timelineSummary       String?
  
  // Extracted Data
  extractedParties      String[]   // JSON array
  extractedEffectiveDate DateTime?
  extractedExpirationDate DateTime?
  extractedPaymentTerms String?
  
  // Metadata
  status                String     @default("PENDING")
  confidence            Float?     // 0-1 score
  aiModel               String?    // "gpt-4", "claude-3", etc.
  tokensUsed            Int?
  processingTimeMs      Int?
}
```

### Risk
Identified risks during analysis.

```prisma
model Risk {
  id                String     @id @default(cuid())
  reviewId          String
  type              String     // "Missing Clause", "Unlimited Liability", etc.
  description       String
  riskLevel         RiskLevel  // CRITICAL, HIGH, MEDIUM, LOW, INFO
  impact            String?
  recommendation    String?
  status            String     @default("OPEN")
  acknowledged      Boolean    @default(false)
  mitigated         Boolean    @default(false)
}

enum RiskLevel {
  CRITICAL
  HIGH
  MEDIUM
  LOW
  INFO
}
```

**Risk Types**:
- Missing clauses
- Conflicting clauses
- Unlimited liability
- Data privacy gaps
- Security risks
- Compliance violations
- Financial risks

### RiskReport
Aggregated risk assessment for a contract.

```prisma
model RiskReport {
  id                String     @id @default(cuid())
  contractId        String     @unique
  
  totalRisks        Int        @default(0)
  criticalCount     Int        @default(0)
  highCount         Int        @default(0)
  mediumCount       Int        @default(0)
  lowCount          Int        @default(0)
  
  riskScore         Float?     // 0-100
  overallRiskLevel  RiskLevel  @default(MEDIUM)
  
  missingClauses    String[]   // JSON array
  conflictingClauses String[]
  financialRisks    String?
  dataPrivacyRisks  String?
}
```

### ComplianceReport
Compliance assessment across frameworks.

```prisma
model ComplianceReport {
  id                    String     @id @default(cuid())
  contractId            String     @unique
  
  gdprCompliant         ComplianceStatus
  hipaaCompliant        ComplianceStatus
  soc2Compliant         ComplianceStatus
  iso27001Compliant     ComplianceStatus
  pciDssCompliant       ComplianceStatus
  soxCompliant          ComplianceStatus
  
  customPolicies        String?    // JSON with custom policy compliance
  
  complianceScore       Float?     // 0-100
  overallStatus         ComplianceStatus
  
  issues                String?    // JSON array
  recommendations       String?
}

enum ComplianceStatus {
  COMPLIANT
  NON_COMPLIANT
  REQUIRES_REVIEW
  PARTIALLY_COMPLIANT
  UNKNOWN
}
```

**Frameworks**:
- GDPR (EU data protection)
- HIPAA (US healthcare)
- SOC2 (service organization controls)
- ISO27001 (information security)
- PCI DSS (payment card security)
- SOX (financial reporting)
- Custom internal policies

## Collaboration Models

### Comment
Team comments and discussions on contracts.

```prisma
model Comment {
  id                String     @id @default(cuid())
  contractId        String
  createdBy         String
  
  content           String
  mentions          String[]   // @mentioned user IDs
  resolved          Boolean    @default(false)
  parentId          String?    // For comment threads
}
```

### Approval
Approval tracking through workflow.

```prisma
model Approval {
  id                String     @id @default(cuid())
  contractId        String
  assignedTo        String
  
  status            ApprovalStatus
  reason            String?
  notes             String?
  dueDate           DateTime?
  respondedAt       DateTime?
}

enum ApprovalStatus {
  PENDING
  APPROVED
  REJECTED
  CHANGES_REQUESTED
}
```

### Signature
E-signature tracking.

```prisma
model Signature {
  id                String     @id @default(cuid())
  contractId        String
  
  signedBy          String     // User name or email
  signatureUrl      String?    // Image URL
  signatureData     String?    // Base64 encoded
  signatureDate     DateTime
  ipAddress         String?
  userAgent         String?
}
```

## Workflow Models

### Workflow
Defines approval workflow steps.

```prisma
model Workflow {
  id                String     @id @default(cuid())
  organizationId    String
  name              String
  description       String?
  status            WorkflowStatus
  
  steps             WorkflowStep[]
}

enum WorkflowStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  REJECTED
  CANCELLED
}
```

### WorkflowStep
Individual steps in a workflow.

```prisma
model WorkflowStep {
  id                String     @id @default(cuid())
  workflowId        String
  order             Int
  
  name              String
  type              String     // "REVIEW", "APPROVAL", "SIGNATURE"
  requiredRole      UserRole?
  
  @@unique([workflowId, order])
}
```

### WorkflowItem
Active workflow instance for a contract.

```prisma
model WorkflowItem {
  id                String     @id @default(cuid())
  workflowId        String
  contractId        String
  
  currentStep       Int        @default(0)
  status            WorkflowStatus
  
  startedAt         DateTime   @default(now())
  completedAt       DateTime?
}
```

## Notification Models

### Notification
System notifications for users.

```prisma
model Notification {
  id                String     @id @default(cuid())
  organizationId    String
  userId            String
  contractId        String?
  
  type              String     // "CONTRACT_APPROVED", "RISK_DETECTED"
  title             String
  message           String
  data              String?    // JSON
  
  channel           NotificationChannel
  status            NotificationStatus
  recipient         String     // Email, Slack ID
  
  isRead            Boolean    @default(false)
  readAt            DateTime?
}

enum NotificationChannel {
  EMAIL
  SLACK
  TEAMS
  PUSH
  WEBHOOK
}

enum NotificationStatus {
  PENDING
  SENT
  DELIVERED
  FAILED
  BOUNCED
}
```

## Audit Logging

### AuditLog
Complete audit trail of all actions.

```prisma
model AuditLog {
  id                String     @id @default(cuid())
  organizationId    String
  userId            String?
  contractId        String?
  
  action            AuditAction
  entityType        String     // "CONTRACT", "USER", "WORKFLOW"
  entityId          String
  changes           String?    // JSON diff
  
  ipAddress         String?
  userAgent         String?
  
  createdAt         DateTime   @default(now())
}

enum AuditAction {
  CREATE
  UPDATE
  DELETE
  VIEW
  EXPORT
  SHARE
  COMMENT
  APPROVE
  REJECT
  SIGN
  ARCHIVE
  RESTORE
}
```

## Indexing Strategy

### Foreign Key Indexes
All foreign keys automatically indexed for join performance.

### Search Indexes
```sql
-- Full-text search on contract content
CREATE INDEX idx_contracts_fulltext ON "Contract" USING GIN (
  to_tsvector('english', title || ' ' || description || ' ' || "extractedText")
);

-- Full-text search on clauses
CREATE INDEX idx_clauses_fulltext ON "Clause" USING GIN (
  to_tsvector('english', title || ' ' || content)
);
```

### Status/State Indexes
```sql
-- Fast filtering by status
CREATE INDEX idx_contracts_status ON "Contract"("status");
CREATE INDEX idx_approvals_status ON "Approval"("status");
CREATE INDEX idx_workflows_status ON "WorkflowItem"("status");
```

### Date Range Indexes
```sql
-- Efficient expiration tracking
CREATE INDEX idx_contracts_expiration ON "Contract"("expirationDate");
CREATE INDEX idx_contracts_created ON "Contract"("createdAt");
```

### Multi-column Indexes
```sql
-- Organization + Team filtering
CREATE INDEX idx_contracts_org_team ON "Contract"("organizationId", "teamId");
CREATE INDEX idx_users_org_team ON "User"("organizationId", "teamId");
```

### Vector Indexes
```sql
-- Vector similarity search for embeddings
CREATE INDEX idx_contracts_embedding ON "Contract" USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_clauses_embedding ON "Clause" USING ivfflat (embedding vector_cosine_ops);
```

## Database Setup

### Create Migration
```bash
cd packages/database
pnpm prisma migrate dev --name initial_schema
```

### Reset Database
```bash
pnpm prisma migrate reset
```

### Seed Sample Data
```bash
pnpm seed
```

### View Schema
```bash
pnpm db:studio
```

## Row-Level Security (RLS)

Ready for PostgreSQL RLS policies:

```sql
-- Example: Users can only see contracts in their organization
CREATE POLICY organization_isolation ON "Contract"
  USING (organizationId = current_user_organization_id());

-- Example: Users can only see users in their organization
CREATE POLICY user_organization_isolation ON "User"
  USING (organizationId = current_user_organization_id());
```

## Query Patterns

### Get all contracts for organization
```typescript
const contracts = await prisma.contract.findMany({
  where: { organizationId },
  include: { versions: true, clauses: true }
});
```

### Get contract with full analysis
```typescript
const contract = await prisma.contract.findUnique({
  where: { id },
  include: {
    versions: true,
    clauses: true,
    aiReviews: { include: { risks: true } },
    riskReport: true,
    complianceReport: true,
    comments: { include: { creator: true } },
    approvals: { include: { user: true } },
    signatures: true
  }
});
```

### Search contracts by text
```typescript
const contracts = await prisma.$queryRaw`
  SELECT * FROM "Contract"
  WHERE "organizationId" = ${orgId}
  AND to_tsvector('english', title || ' ' || "extractedText") @@ 
      plainto_tsquery('english', ${searchTerm})
  ORDER BY ts_rank(to_tsvector('english', title || ' ' || "extractedText"), 
           plainto_tsquery('english', ${searchTerm})) DESC
`;
```

### Get expiring contracts
```typescript
const expiringContracts = await prisma.contract.findMany({
  where: {
    organizationId,
    expirationDate: {
      lte: addDays(new Date(), 30),
      gte: new Date()
    }
  }
});
```

## Performance Considerations

1. **Pagination**: Always paginate when querying large result sets
2. **Eager Loading**: Use `include` to fetch related data in one query
3. **Selective Fields**: Use `select` when you don't need all columns
4. **Indexes**: Query analyzer will use indexes for frequently filtered columns
5. **Connection Pooling**: Use PgBouncer in production
6. **Caching**: Cache frequently accessed data in Redis

## Backup & Recovery

### Daily Backup
```bash
pg_dump $DATABASE_URL > backups/contract_ai_$(date +%Y%m%d).sql
```

### Restore from Backup
```bash
psql $DATABASE_URL < backups/contract_ai_20240715.sql
```

## Monitoring

### Database Size
```sql
SELECT pg_size_pretty(pg_database_size('contract_ai'));
```

### Table Sizes
```sql
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
FROM pg_tables
WHERE schemaname != 'information_schema'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Index Usage
```sql
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

## Scaling Strategies

1. **Read Replicas**: For high-read workloads
2. **Partitioning**: Partition contracts/audit logs by date
3. **Caching Layer**: Redis for frequently accessed data
4. **Vector Search**: Use Qdrant for semantic search instead of pgvector
5. **Archival**: Move old contracts to archive tables

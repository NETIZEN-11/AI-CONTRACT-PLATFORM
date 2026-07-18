# Deployment Guide

This guide covers deploying the Contract AI Platform to production environments.

## Prerequisites

- Docker & Docker Compose
- Kubernetes cluster (v1.24+)
- kubectl configured
- Terraform (for infrastructure as code)
- Access to container registry (Docker Hub, ECR, GCR)
- PostgreSQL managed service (Cloud SQL, RDS, Azure Database)
- Redis managed service (ElastiCache, MemoryStore, Azure Cache)

## Deployment Environments

### Development
- Local Docker Compose
- All services in single environment
- Shared test database

### Staging
- Kubernetes cluster (1-2 nodes)
- Cloud-managed PostgreSQL and Redis
- Same code as production
- For testing before release

### Production
- Kubernetes cluster (3+ nodes, multi-zone)
- High-availability setup
- Auto-scaling enabled
- Monitoring and alerting
- Blue-green deployments

## Docker Image Build

### Building Images

```bash
# Build all images
docker-compose -f infrastructure/docker/docker-compose.yml build

# Build specific service
docker build -f infrastructure/docker/Dockerfile.api -t contract-ai-api:latest .
docker build -f infrastructure/docker/Dockerfile.web -t contract-ai-web:latest .
docker build -f infrastructure/docker/Dockerfile.ai -t contract-ai-ai:latest .
```

### Pushing to Registry

```bash
# Docker Hub
docker tag contract-ai-api:latest myregistry/contract-ai-api:latest
docker push myregistry/contract-ai-api:latest

# AWS ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789.dkr.ecr.us-east-1.amazonaws.com
docker tag contract-ai-api:latest 123456789.dkr.ecr.us-east-1.amazonaws.com/contract-ai-api:latest
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/contract-ai-api:latest

# Google Container Registry
docker tag contract-ai-api:latest gcr.io/my-project/contract-ai-api:latest
docker push gcr.io/my-project/contract-ai-api:latest
```

## Kubernetes Deployment

### Prerequisites Setup

```bash
# Create namespace
kubectl create namespace contract-ai

# Create secrets
kubectl create secret generic app-secrets \
  --from-literal=DATABASE_URL=postgresql://user:pass@host:5432/db \
  --from-literal=REDIS_URL=redis://host:6379 \
  --from-literal=JWT_SECRET=your-secret-key \
  -n contract-ai

# Create ConfigMap for non-sensitive config
kubectl create configmap app-config \
  --from-literal=NODE_ENV=production \
  --from-literal=API_LOG_LEVEL=info \
  -n contract-ai
```

### Deploy Using Manifests

```bash
# Navigate to kubernetes directory
cd infrastructure/kubernetes

# Apply configurations
kubectl apply -f namespace.yml
kubectl apply -f postgres-pvc.yml
kubectl apply -f redis-deployment.yml
kubectl apply -f api-deployment.yml
kubectl apply -f web-deployment.yml
kubectl apply -f ai-service-deployment.yml
kubectl apply -f ocr-service-deployment.yml
kubectl apply -f ingress.yml

# Verify deployments
kubectl get deployments -n contract-ai
kubectl get services -n contract-ai
kubectl get pods -n contract-ai
```

### Example Kubernetes Manifests

**API Deployment:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: contract-ai-api
  namespace: contract-ai
spec:
  replicas: 3
  selector:
    matchLabels:
      app: contract-ai-api
  template:
    metadata:
      labels:
        app: contract-ai-api
    spec:
      containers:
      - name: api
        image: your-registry/contract-ai-api:latest
        ports:
        - containerPort: 3001
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: DATABASE_URL
        - name: NODE_ENV
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: NODE_ENV
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 10
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: contract-ai-api
  namespace: contract-ai
spec:
  selector:
    app: contract-ai-api
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3001
  type: ClusterIP
```

**Horizontal Pod Autoscaler:**
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-hpa
  namespace: contract-ai
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: contract-ai-api
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

## Database Migrations

### Running Migrations in Production

```bash
# Option 1: Using kubectl exec
kubectl exec -it deployment/contract-ai-api -n contract-ai -- \
  npm run db:migrate:deploy

# Option 2: Using init container (recommended)
# Add to Deployment spec.template.spec:
initContainers:
- name: db-migration
  image: your-registry/contract-ai-api:latest
  command: ["npm", "run", "db:migrate:deploy"]
  env:
  - name: DATABASE_URL
    valueFrom:
      secretKeyRef:
        name: app-secrets
        key: DATABASE_URL
```

## Secrets Management

### Using External Secrets Operator

```yaml
apiVersion: external-secrets.io/v1beta1
kind: SecretStore
metadata:
  name: aws-secrets
  namespace: contract-ai
spec:
  provider:
    aws:
      service: SecretsManager
      region: us-east-1
      auth:
        jwt:
          serviceAccountRef:
            name: external-secrets
---
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: app-secrets
  namespace: contract-ai
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: aws-secrets
    kind: SecretStore
  target:
    name: app-secrets
    creationPolicy: Owner
  data:
  - secretKey: DATABASE_URL
    remoteRef:
      key: contract-ai/database-url
  - secretKey: REDIS_URL
    remoteRef:
      key: contract-ai/redis-url
```

## Monitoring & Logging

### Prometheus Setup

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
  namespace: contract-ai
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s
    scrape_configs:
    - job_name: 'api'
      static_configs:
      - targets: ['contract-ai-api:3001']
    - job_name: 'ai-service'
      static_configs:
      - targets: ['contract-ai-ai:8000']
```

### Grafana Dashboards

```bash
# Deploy Prometheus
kubectl apply -f infrastructure/monitoring/prometheus.yml

# Deploy Grafana
kubectl apply -f infrastructure/monitoring/grafana.yml

# Access Grafana
kubectl port-forward -n contract-ai svc/grafana 3000:3000
# Open: http://localhost:3000
# Default: admin / admin
```

## Blue-Green Deployment

```bash
#!/bin/bash
# Deploy new version
kubectl set image deployment/contract-ai-api \
  api=your-registry/contract-ai-api:v2.0.0 \
  -n contract-ai

# Wait for rollout
kubectl rollout status deployment/contract-ai-api -n contract-ai

# If successful, rollout is complete
# If failed, rollback
kubectl rollout undo deployment/contract-ai-api -n contract-ai
```

## Canary Deployment

```yaml
apiVersion: flagger.app/v1beta1
kind: Canary
metadata:
  name: contract-ai-api
  namespace: contract-ai
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: contract-ai-api
  service:
    port: 3001
  analysis:
    interval: 1m
    threshold: 10
    metrics:
    - name: request-success-rate
      thresholdRange:
        min: 99
      interval: 1m
  deployment:
    progressDeadlineSeconds: 60
  skipAnalysis: false
  maxWeight: 50
  stepWeight: 5
```

## Health Checks

### Readiness Probe
```bash
curl -f http://localhost:3001/health/ready || exit 1
```

### Liveness Probe
```bash
curl -f http://localhost:3001/health/live || exit 1
```

## Scaling

### Manual Scaling
```bash
# Scale API to 5 replicas
kubectl scale deployment contract-ai-api --replicas=5 -n contract-ai

# Check status
kubectl get deployment contract-ai-api -n contract-ai
```

### Automatic Scaling
Already configured in HPA manifest above.

## Disaster Recovery

### Database Backup

```bash
# Automated daily backup
0 2 * * * pg_dump $DATABASE_URL > /backups/db-$(date +\%Y\%m\%d).sql

# Restore from backup
psql $DATABASE_URL < /backups/db-backup.sql
```

### Pod Disruption Budget

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: api-pdb
  namespace: contract-ai
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app: contract-ai-api
```

## Rollback Procedures

```bash
# Check rollout history
kubectl rollout history deployment/contract-ai-api -n contract-ai

# Rollback to previous version
kubectl rollout undo deployment/contract-ai-api -n contract-ai

# Rollback to specific revision
kubectl rollout undo deployment/contract-ai-api --to-revision=2 -n contract-ai
```

## Performance Tuning

### Pod Resource Limits
- API: 512Mi RAM, 250m CPU minimum; 1Gi RAM, 500m CPU maximum
- Web: 256Mi RAM, 100m CPU minimum; 512Mi RAM, 250m CPU maximum
- AI Service: 2Gi RAM, 500m CPU minimum; 4Gi RAM, 2000m CPU maximum

### Database Connection Pooling
```
PgBouncer config:
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 25
```

## Security Considerations

1. **Network Policies**: Restrict inter-pod communication
2. **RBAC**: Use least privilege principle
3. **Secrets Rotation**: Rotate credentials regularly
4. **Image Scanning**: Scan for vulnerabilities
5. **Audit Logging**: Enable Kubernetes audit logs
6. **Pod Security Policies**: Enforce security standards

## Post-Deployment Verification

```bash
# Check all pods running
kubectl get pods -n contract-ai

# Check services
kubectl get svc -n contract-ai

# Check ingress
kubectl get ingress -n contract-ai

# View logs
kubectl logs -f deployment/contract-ai-api -n contract-ai

# Test endpoints
curl https://your-domain.com/api/health
curl https://your-domain.com/health
```

## Troubleshooting

### Pod not starting
```bash
kubectl describe pod <pod-name> -n contract-ai
kubectl logs <pod-name> -n contract-ai
```

### Service unreachable
```bash
kubectl get svc -n contract-ai
kubectl get endpoints -n contract-ai
```

### Database connection issues
```bash
kubectl exec -it <pod-name> -n contract-ai -- \
  psql $DATABASE_URL -c "SELECT 1"
```

## CI/CD Integration

GitHub Actions workflow triggers deployment:
```yaml
- name: Deploy to Kubernetes
  run: |
    kubectl set image deployment/contract-ai-api \
      api=myregistry/contract-ai-api:${{ github.sha }} \
      -n contract-ai
    kubectl rollout status deployment/contract-ai-api -n contract-ai
```

## Maintenance Windows

Schedule maintenance during off-peak hours:
```bash
# Drain node for maintenance
kubectl drain node-name --ignore-daemonsets

# Perform maintenance

# Uncordon node
kubectl uncordon node-name
```

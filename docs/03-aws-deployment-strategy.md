# AWS deployment strategy — DBIE

## Overview

This document outlines the recommended AWS deployment architecture for DBIE, including infrastructure requirements, costs, and implementation steps.

---

## Current stack

Based on the existing implementation:
- **Backend**: Go/Gin API with Excel parsers, currently reads from local files
- **Frontend**: Next.js 15 with Plotly charts and AG Grid tables
- **Data**: PostgreSQL (ready but unused), Redis (ready but unused)
- **Architecture**: Server components fetching from Go API

---

## Recommended architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      CloudFront (CDN)                       │
│  - Global edge caching for static assets                   │
│  - Custom domain with SSL/TLS                               │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌──────────────────────────────────┬──────────────────────────┐
│   Frontend (Next.js)             │   Backend (Go API)       │
│   AWS Amplify or ECS Fargate     │   ECS Fargate           │
│   - Auto-scaling                 │   - Auto-scaling         │
│   - Built-in CI/CD              │   - Health checks        │
└──────────────────────────────────┴──────────────────────────┘
                         ↓                      ↓
┌──────────────────────────────────┬──────────────────────────┐
│   S3 bucket                      │   RDS PostgreSQL         │
│   - Excel/data files             │   + ElastiCache Redis    │
│   - Versioned storage            │   - Multi-AZ for HA      │
└──────────────────────────────────┴──────────────────────────┘
```

---

## Core AWS services needed

### 1. Frontend hosting

**Option A: AWS Amplify** (recommended for simplicity)
- **Why**: Built for Next.js, automatic CI/CD, easy SSL
- **Cost**: ~$15-50/month (depends on build minutes)
- **Setup**: Connect GitHub repo, auto-deploys on push

**Option B: ECS Fargate**
- **Why**: More control, Docker-based
- **Cost**: ~$30-100/month (2 tasks minimum for HA)
- **Setup**: Build Docker image, push to ECR, run on Fargate

### 2. Backend API

**ECS Fargate with Application Load Balancer**
- **Service**: Fargate tasks running Go API
- **Load balancer**: ALB with health checks
- **Auto-scaling**: Scale on CPU/memory or request count
- **Cost**: ~$50-150/month (2-4 tasks)

**Container specs**:
- 0.5 vCPU, 1GB RAM per task (start small, scale as needed)
- Health check: `GET /health`
- Environment variables from AWS Secrets Manager

### 3. Data storage

**S3 bucket** (for Excel files)
- Standard storage tier
- Versioning enabled
- Lifecycle policy: Move old versions to Glacier after 90 days
- **Cost**: ~$1-5/month (data is small)

**RDS PostgreSQL**
- Instance: `db.t4g.micro` or `db.t4g.small` (start small)
- Multi-AZ for production (recommended)
- Automated backups (7-day retention)
- **Cost**: ~$20-50/month (single-AZ) or ~$40-100/month (Multi-AZ)

**ElastiCache Redis**
- Node type: `cache.t4g.micro`
- Single node for dev/staging, cluster for production
- **Cost**: ~$15-30/month

### 4. Networking

**VPC setup**:
- Public subnets: ALB, NAT Gateway
- Private subnets: ECS tasks, RDS, ElastiCache
- Security groups for strict access control

### 5. CI/CD

**AWS CodePipeline + CodeBuild**
- Source: GitHub
- Build: Docker images for backend
- Deploy: ECS service updates
- **Cost**: ~$5-15/month

### 6. Monitoring and logs

**CloudWatch**
- Container logs (stdout/stderr)
- Metrics (CPU, memory, requests)
- Alarms for error rates
- **Cost**: ~$10-20/month

**Optional**: AWS X-Ray for tracing

### 7. DNS and SSL

**Route 53**
- Hosted zone for your domain
- **Cost**: $0.50/month + $0.40 per million queries

**ACM (AWS Certificate Manager)**
- Free SSL/TLS certificates
- Auto-renewal

---

## Detailed setup requirements

### 1. S3 bucket configuration

**Bucket structure**:
```
dbie-data-files/
├── exchange-rates/
│   └── Daily Exchange Rate of the Indian Rupee.xlsx
├── forex-reserves/
│   └── Foreign Exchange Reserves.xlsx
└── publications/
    └── Credit Classification.xlsx
```

**Bucket policy**: Private, accessed only by backend ECS tasks via IAM role

**Backend code changes needed**:
```go
// Update service layer to read from S3 instead of local files
func (s *IndicatorsService) GetExchangeRates() (*models.ParsedExchangeRates, error) {
    result, err := s.s3Client.GetObject(ctx, &s3.GetObjectInput{
        Bucket: aws.String(s.bucketName),
        Key:    aws.String("exchange-rates/Daily Exchange Rate.xlsx"),
    })
    if err != nil {
        return nil, err
    }
    defer result.Body.Close()

    return parser.ParseExchangeRate(result.Body) // Parser already uses io.Reader!
}
```

### 2. ECS task definition (backend)

```json
{
  "family": "dbie-backend",
  "cpu": "512",
  "memory": "1024",
  "requiresCompatibilities": ["FARGATE"],
  "networkMode": "awsvpc",
  "containerDefinitions": [
    {
      "name": "dbie-api",
      "image": "<account-id>.dkr.ecr.<region>.amazonaws.com/dbie-backend:latest",
      "portMappings": [{"containerPort": 8080}],
      "environment": [
        {"name": "PORT", "value": "8080"},
        {"name": "ENVIRONMENT", "value": "production"},
        {"name": "S3_BUCKET_NAME", "value": "dbie-data-files"}
      ],
      "secrets": [
        {"name": "DATABASE_URL", "valueFrom": "arn:aws:secretsmanager:..."},
        {"name": "REDIS_URL", "valueFrom": "arn:aws:secretsmanager:..."}
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/dbie-backend",
          "awslogs-region": "ap-south-1",
          "awslogs-stream-prefix": "api"
        }
      }
    }
  ]
}
```

### 3. RDS PostgreSQL setup

**Initial setup**:
- Engine: PostgreSQL 16
- Instance class: `db.t4g.micro` (2 vCPU, 1GB RAM)
- Storage: 20GB GP3 (auto-scaling enabled)
- Multi-AZ: Yes (for production)
- VPC: Private subnets only
- Security group: Allow 5432 only from ECS security group

**Connection string** (stored in Secrets Manager):
```
postgresql://dbie_user:password@dbie-prod.xxxxx.ap-south-1.rds.amazonaws.com:5432/dbie
```

### 4. ElastiCache Redis setup

- Engine: Redis 7.x
- Node type: `cache.t4g.micro`
- Replicas: 1 (for production)
- VPC: Private subnets
- Security group: Allow 6379 only from ECS security group

---

## Estimated monthly costs

| Service | Tier | Monthly cost |
|---------|------|--------------|
| **ECS Fargate (backend)** | 2 tasks × 0.5 vCPU, 1GB | $30-50 |
| **Application load balancer** | 1 ALB | $16 |
| **RDS PostgreSQL** | db.t4g.micro, Multi-AZ | $40-100 |
| **ElastiCache Redis** | cache.t4g.micro | $15-30 |
| **S3 storage** | Standard, 5GB | $1-5 |
| **CloudFront** | Low traffic | $1-10 |
| **Amplify hosting** | Frontend | $15-50 |
| **CloudWatch logs** | 10GB/month | $5-10 |
| **Route 53** | Hosted zone + queries | $1-5 |
| **Data transfer** | 100GB/month | $9 |
| **NAT gateway** | 1 gateway | $32 |
| **Secrets Manager** | 5 secrets | $2 |
| **TOTAL** | | **$167-318/month** |

**Cost optimisation tips**:
- Use Reserved Instances for RDS (save 30-40%)
- Single-AZ RDS for dev/staging
- Delete NAT Gateway in dev (use public subnets)
- Use S3 Intelligent-Tiering for data files

---

## Deployment steps

### Phase 1: Infrastructure (Terraform recommended)

1. Create VPC with public/private subnets
2. Set up RDS PostgreSQL + ElastiCache Redis
3. Create S3 bucket with versioning
4. Set up ECR repository for Docker images
5. Create ECS cluster (Fargate)
6. Set up Application Load Balancer
7. Configure Route 53 + ACM certificates

### Phase 2: Backend deployment

1. Modify backend code to use S3 SDK
2. Create Dockerfile for Go API
3. Build and push Docker image to ECR
4. Create ECS task definition
5. Deploy ECS service with ALB target group
6. Upload Excel files to S3
7. Run database migrations (when needed)
8. Test API health check

### Phase 3: Frontend deployment

1. Update API endpoint in `.env.production`:
   ```
   NEXT_PUBLIC_API_URL=https://api.dbie.yourdomain.com
   ```
2. Connect GitHub to AWS Amplify
3. Configure build settings
4. Deploy and test

### Phase 4: Production hardening

1. Enable CloudWatch alarms
2. Set up auto-scaling policies
3. Configure backup retention
4. Enable VPC Flow Logs
5. Set up AWS WAF (optional, for DDoS protection)
6. Run load tests

---

## Alternative: Simpler setup (lower cost)

If you want to start smaller:

**Option: Lightsail + S3**
- **Lightsail instance**: $10-20/month (runs both frontend + backend)
- **Lightsail database**: $15/month (PostgreSQL)
- **S3**: $1-5/month
- **Total**: ~$30-50/month

**Trade-offs**:
- No auto-scaling
- Manual deployment
- Less resilient
- Good for MVP/staging

---

## Recommended next steps

1. **Start with staging environment**:
   - Use smaller instances
   - Single-AZ RDS
   - Test S3 integration

2. **Create Terraform/CDK infrastructure**:
   - Infrastructure as code
   - Easy to replicate for prod

3. **Set up CI/CD pipeline**:
   - GitHub Actions or CodePipeline
   - Automated testing + deployment

4. **Migrate data to S3**:
   - Upload Excel files
   - Test parser with S3 reader

---

**Document version:** 1.0
**Last updated:** 2025-11-24
**Status:** Planning phase

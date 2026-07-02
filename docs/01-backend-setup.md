# Backend setup guide — DBIE

## Current implementation

This document describes the **actual implementation** of the DBIE backend, not just recommendations.

---

## Tech stack

### Frontend (implemented)

- ✅ **Next.js 15** with App Router & Server Components
- ✅ **TypeScript** (strict mode)
- ✅ **Plotly.js** for data visualisation
- ✅ **Axios** for HTTP client
- ✅ **Fictoan React** for UI components

### Backend (implemented)

```
Backend stack:
├── Framework: Gin (Go web framework)
├── Hot reload: Air (automatic recompilation on file changes)
├── Data source: Local files (RBI text format)
├── Database: PostgreSQL 16 (ready, not yet used)
├── Cache: Redis 7 (ready, not yet used)
└── Testing: Go's built-in testing
```

---

## Architecture

### Current data flow

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                   │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Server Components (SSR)                            │ │
│  │  - Fetch data from Go API with Suspense            │ │
│  │  - Show loading.tsx while fetching                 │ │
│  │  - Pass to Client Components                       │ │
│  └────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Client Components (interactive)                    │ │
│  │  - Charts (Plotly)                                 │ │
│  │  - Tables, filters                                 │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                         ↕ HTTP/JSON
┌─────────────────────────────────────────────────────────┐
│                    BACKEND (Go)                         │
│  ┌────────────────────────────────────────────────────┐ │
│  │ API layer (Gin)                                    │ │
│  │  - REST endpoints                                  │ │
│  │  - CORS middleware                                 │ │
│  └────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Service layer (indicators_service)                 │ │
│  │  - Business logic                                  │ │
│  │  - File path configuration                         │ │
│  └────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Parser layer                                       │ │
│  │  - Reads io.Reader (S3-ready!)                     │ │
│  │  - Parses RBI text format                          │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                         ↕
┌────────────────────────────────────────────────────────┐
│                  DATA LAYER (current)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Local files  │  │ PostgreSQL   │  │    Redis     │  │
│  │ (active)     │  │ (ready)      │  │   (ready)    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└────────────────────────────────────────────────────────┘
```

---

## Backend structure

### Directory structure (as implemented)

```
backend/
├── cmd/
│   └── server/
│       └── main.go                    # Entry point with Gin setup
├── internal/
│   ├── handlers/
│   │   └── indicators.go              # Exchange rates handler
│   ├── service/
│   │   └── indicators_service.go      # Business logic
│   ├── parser/
│   │   └── exchange_rate_parser.go    # RBI data parser
│   └── models/
│       └── exchange_rate.go           # Data models
├── .air.toml                          # Hot reload configuration
├── .env.development                   # Development environment vars
├── go.mod
├── go.sum
├── Makefile
└── README.md
```

---

## API endpoints

### Implemented

```
GET    /health                              # Health check
GET    /api/indicators/exchange-rates       # Exchange rates data
```

### Planned (from sidebar structure)

```
# Indicators (16 categories)
GET    /api/indicators/interest-rates
GET    /api/indicators/inflation
GET    /api/indicators/money-supply
... 12 more

# Statistics (50+ series)
GET    /api/statistics/banking/aggregate-deposits
GET    /api/statistics/banking/credit-deployment
... 48 more

# Publications
GET    /api/publications?category=weekly&page=1&limit=20
GET    /api/publications/:id/download

# Unit-level data
GET    /api/unit-level-data/loans?filters={...}
```

---

## Data handling pattern

### Current implementation

**Environment-driven file path:**

```go
// backend/internal/service/indicators_service.go
func NewIndicatorsService() *IndicatorsService {
    dataPath := os.Getenv("DATA_FILES_PATH")
    if dataPath == "" {
        dataPath = "../frontend/src/sample-data"
    }
    return &IndicatorsService{dataFilesPath: dataPath}
}
```

**Parser uses io.Reader (S3-ready):**

```go
// backend/internal/parser/exchange_rate_parser.go
func ParseExchangeRate(reader io.Reader) (*models.ParsedExchangeRates, error) {
    scanner := bufio.NewScanner(reader)
    // ... parsing logic
}
```

**Service layer opens files:**

```go
// backend/internal/service/indicators_service.go
func (s *IndicatorsService) GetExchangeRates() (*models.ParsedExchangeRates, error) {
    filePath := filepath.Join(s.dataFilesPath, "Daily Exchange Rate of the Indian Rupee.txt")
    file, err := os.Open(filePath)
    if err != nil {
        return nil, err
    }
    defer file.Close()

    return parser.ParseExchangeRate(file)
}
```

### Future: S3 migration

When ready to move to S3, only change the service layer:

```go
// Change from os.Open()
file, err := os.Open(filePath)

// To S3 GetObject()
result, err := s3Client.GetObject(ctx, &s3.GetObjectInput{
    Bucket: &bucket,
    Key:    &key,
})
reader := result.Body
defer reader.Close()

// Parser stays exactly the same!
return parser.ParseExchangeRate(reader)
```

---

## Development workflow

### Commands

```bash
# Start backend with hot reload
pnpm start:backend

# Or from backend directory
make dev

# Build for production
make build

# Run tests
make test
```

### Hot reload with Air

Air is installed and configured to:

- Watch all `.go` files in `cmd/` and `internal/`
- Automatically recompile on changes
- Restart server (~2 seconds)
- Show build errors in console

**No manual restarts needed!** Just save your Go file and Air handles the rest.

---

## Environment configuration

### backend/.env.development

```env
# Server configuration
PORT=8080

# Database configuration (not yet used)
DATABASE_URL=postgresql://dbie_user:dbie_pass@localhost:5432/dbie

# Redis configuration (not yet used)
REDIS_URL=redis://localhost:6379

# JWT configuration (for future auth)
JWT_SECRET=your-secret-key-change-in-production

# Environment
ENVIRONMENT=development

# Data files path (current implementation)
DATA_FILES_PATH=../frontend/src/sample-data
```

---

## Database setup (ready, not yet used)

PostgreSQL and Redis are configured in `docker-compose.yml` but **not currently used**.

### When we'll use them:

**PostgreSQL:**

- User authentication & profiles
- API usage tracking
- Cached/processed indicator data (optional optimisation)

**Redis:**

- Session storage
- API response caching
- Rate limiting

### Start databases:

```bash
pnpm db:up
```

---

## Frontend integration

### API client setup

```typescript
// frontend/src/lib/api/client.ts
const apiClient = axios.create({
    baseURL : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
});
```

### Server Component data fetching

```typescript
// frontend/src/app/(auth)/indicators/exchange-rates/page.tsx
export default async function Page() {
    // Fetches on server, with Suspense
    const data = await getExchangeRates();

    return <ExchangeRatesPage data = {data}
    />;
}
```

### Loading states

Next.js automatically shows `loading.tsx` while fetching:

```typescript
// frontend/src/app/(auth)/indicators/exchange-rates/loading.tsx
export default function Loading() {
    return <SkeletonWithSpinners / >;
}
```

---

## Key decisions

### ✅ Why Gin (not Fiber)?

- **Consistency** — Same framework as Pratirupa
- **Team familiarity** — Already in production
- **Proven** — Battle-tested in your infrastructure

### ✅ Why file-based (not database)?

- **Simple** — Works immediately, no migrations needed
- **Fast** — 6,780+ records parsed in ~10ms
- **S3-ready** — Using `io.Reader` makes migration trivial

### ✅ Why Server Components (not React Query)?

- **Better performance** — Data fetched on server, faster first paint
- **Better SEO** — Data available for crawlers
- **Simpler** — No client-side state management needed
- **Suspense** — Built-in loading states with Next.js

### ✅ Why Air for hot reload?

- **Developer experience** — No manual restarts
- **Fast** — 1-2 second rebuild and restart
- **Standard** — Widely used in Go community

---

## Next steps

### Immediate (working now)

- ✅ Exchange rates endpoint
- ✅ Hot reload with Air
- ✅ Loading states with Suspense
- ✅ Server-side rendering

### Near-term (next features)

1. Add remaining 15 indicator endpoints
2. Implement statistics endpoints (50+ series)
3. Add user authentication (use PostgreSQL)
4. Publications with file storage
5. Unit-level data endpoints

### Future (optimisations)

1. Migrate to S3 for data storage
2. Add Redis caching for API responses
3. Implement rate limiting
4. Add monitoring (Prometheus + Grafana)

---

## Performance

### Current

- **API response time**: ~10-50ms (parsing text files)
- **Data points**: 6,780+ exchange rates (1999-2025)
- **File size**: ~500KB text file
- **First load**: ~500ms (with Next.js SSR)

### Expected with optimisations

- **With Redis caching**: <5ms
- **With S3 + cache**: <10ms
- **Concurrent users**: 10,000+ (Go's goroutines)

---

**Document version:** 2.0
**Last updated:** 2025-11-21
**Status:** Implemented and working

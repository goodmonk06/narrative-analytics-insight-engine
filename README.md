# Narrative Analytics Insight Engine

> **投稿・配信・記事などの「語り」を解析し、どのストーリーラインが一番メンバーに刺さっているかを可視化するエンジン**

A comprehensive analytics engine that analyzes content narratives (posts, newsletters, talks, videos, podcasts, articles) to identify themes, emotional tones, and story archetypes—then correlates them with engagement metrics to reveal what truly resonates with your audience.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)](https://www.postgresql.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Domain Model](#domain-model)
4. [Getting Started](#getting-started)
5. [Example Flows](#example-flows)
6. [API Reference](#api-reference)
7. [Extension & Integration](#extension--integration)
8. [Testing](#testing)
9. [Deployment](#deployment)
10. [Future Extensions](#future-extensions)
11. [Contributing](#contributing)

---

## Overview

### What Problem Does This Solve?

Content creators face a fundamental attribution problem: **they know what content performs well, but not why**. Traditional analytics show views and likes, but don't answer strategic questions:

- Which themes resonate most with our audience?
- What emotional tone drives the highest engagement?
- Which story structures lead to shares and comments?
- How are content trends evolving over time?
- What should we create next?

### How It Works

The Narrative Analytics Insight Engine uses AI to analyze your content at a deeper level:

1. **Ingest**: Import content from various sources (posts, newsletters, talks, videos, etc.)
2. **Analyze**: AI identifies themes, emotional tones, and narrative archetypes
3. **Correlate**: Connect narrative elements to engagement metrics (views, likes, comments, shares)
4. **Insight**: Discover patterns and get data-driven recommendations
5. **Act**: Use insights to refine your content strategy

```
Content → AI Analysis → Engagement Tracking → Insights → Recommendations
```

### Key Features

- **AI-Powered Analysis**: Automatically categorizes content without manual tagging
- **Engagement Correlation**: Weighted scoring system that prioritizes valuable interactions
- **Time-Series Tracking**: Monitor theme performance trends over time
- **Content Organization**: Collections and tags for flexible content curation
- **Smart Recommendations**: AI-generated strategy suggestions based on performance data
- **Extensible Architecture**: Adapter pattern for custom LLMs, notifications, and integrations
- **Production Ready**: Docker setup, comprehensive tests, logging, metrics, and error handling

---

## Tech Stack

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Fastify (high-performance HTTP server)
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL 16
- **ORM**: Prisma (type-safe database access)
- **AI**: OpenAI GPT-4 (swappable via adapter pattern)
- **Logging**: Pino (structured logging)
- **Testing**: Vitest (unit & integration tests)

### Frontend
- **Framework**: Next.js 14 (React 18)
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Data Fetching**: SWR (stale-while-revalidate)
- **Language**: TypeScript

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Development**: Hot reload, watch mode
- **Code Quality**: ESLint, Prettier, TypeScript strict
- **Database Migrations**: Prisma Migrate

---

## Domain Model

### Core Entities

```
NarrativeContent (posts, articles, videos, podcasts)
├── status: draft | published | archived | deleted
├── visibility: public | private | unlisted
├── sourceType: post | newsletter | talk | article | video | podcast | other
├── → NarrativeAnalysis (AI-generated insights)
│   ├── themesJson: ["innovation", "remote work", ...]
│   ├── toneLabelsJson: ["analytical", "inspirational", ...]
│   └── archetypeLabelsJson: ["hero's journey", "problem-solution", ...]
├── → NarrativeEngagement (metrics over time)
│   ├── views, likes, comments, shares
│   └── engagementScore = views×1 + likes×5 + comments×10 + shares×15
├── → Collections (curated groupings)
└── → Tags (flexible categorization)

NarrativeTrend (time-series performance tracking)
└── Aggregates performance by theme and time period

NarrativeRecommendation (AI-generated strategy suggestions)
└── Suggests themes to explore, tones to try, formats to experiment with
```

### Entity Relationships

- Content **has many** Analyses (historical tracking)
- Content **has many** Engagement records (time-series)
- Content **belongs to many** Collections
- Content **has many** Tags
- Trends **aggregate** Content performance by theme
- Recommendations **reference** Content for evidence

**For detailed domain documentation, see [docs/DOMAIN_NOTES.md](docs/DOMAIN_NOTES.md)**

---

## Getting Started

### Prerequisites

- **Node.js** 20+ ([Download](https://nodejs.org/))
- **Docker** & **Docker Compose** ([Download](https://www.docker.com/))
- **OpenAI API Key** ([Get one](https://platform.openai.com/api-keys)) or compatible LLM endpoint

### Quick Start (Docker)

1. **Clone and configure**

```bash
git clone <repository-url>
cd narrative-analytics-insight-engine

# Copy environment file
cp backend/.env.example backend/.env

# Edit backend/.env and add your OpenAI API key
# OPENAI_API_KEY=sk-...
```

2. **Start services**

```bash
# Start PostgreSQL, backend, and frontend
docker-compose up -d

# Check logs
docker-compose logs -f

# Wait for services to be ready...
```

3. **Initialize database**

```bash
# Run migrations
docker-compose exec backend npx prisma migrate dev

# Seed with demo data
docker-compose exec backend npm run db:seed
```

4. **Access the application**

- **Dashboard**: http://localhost:3000
- **API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health
- **Metrics**: http://localhost:3001/metrics

### Local Development (Without Docker)

1. **Install dependencies**

```bash
npm install
```

2. **Start PostgreSQL**

```bash
# Option 1: Docker
docker run --name narrative-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=narrative_analytics \
  -p 5432:5432 \
  -d postgres:16-alpine

# Option 2: Local PostgreSQL
# Make sure it's running and update DATABASE_URL in backend/.env
```

3. **Setup backend**

```bash
cd backend

# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed database
npm run db:seed

# Start dev server
npm run dev
```

4. **Setup frontend** (in another terminal)

```bash
cd frontend
npm run dev
```

### Available Scripts

**Root level:**
```bash
npm run dev              # Start both backend and frontend
npm run dev:backend      # Start backend only
npm run dev:frontend     # Start frontend only
npm run build            # Build both for production
npm test                 # Run backend tests
npm run test:coverage    # Run tests with coverage
npm run lint             # Lint backend code
npm run format           # Format code with Prettier
npm run typecheck        # TypeScript type checking
npm run db:migrate       # Run database migrations
npm run db:seed          # Seed database
npm run db:studio        # Open Prisma Studio (database GUI)
npm run cli              # Run CLI tool
```

**Docker:**
```bash
npm run docker:up        # Start all services
npm run docker:down      # Stop all services
npm run docker:logs      # View logs
npm run docker:rebuild   # Rebuild and restart
```

---

## Example Flows

### Flow 1: Content Lifecycle (End-to-End)

This is the primary workflow for analyzing content and tracking performance.

```bash
# 1. Create content
curl -X POST http://localhost:3001/api/content \
  -H "Content-Type: application/json" \
  -d '{
    "communityId": "my-community",
    "sourceType": "post",
    "title": "Building Resilient Teams",
    "bodyMarkdown": "# Building Resilient Teams\n\nResilience is key...",
    "status": "published",
    "visibility": "public"
  }'

# Response: { "content": { "id": "clx123...", ... } }

# 2. Analyze with AI
curl -X POST http://localhost:3001/api/analysis \
  -H "Content-Type: application/json" \
  -d '{
    "contentId": "clx123..."
  }'

# Response:
# {
#   "analysis": {
#     "themesJson": ["team building", "resilience", "leadership"],
#     "toneLabelsJson": ["inspirational", "practical"],
#     "archetypeLabelsJson": ["teaching", "transformation"],
#     "summaryMarkdown": "An exploration of building resilient teams..."
#   }
# }

# 3. Track engagement over time
curl -X POST http://localhost:3001/api/engagement \
  -H "Content-Type: application/json" \
  -d '{
    "contentId": "clx123...",
    "views": 1500,
    "likes": 87,
    "comments": 23,
    "shares": 12
  }'

# 4. Query insights
curl http://localhost:3001/api/insights/themes?limit=10

# Response:
# {
#   "themes": [
#     {
#       "theme": "resilience",
#       "count": 5,
#       "avgViews": 2340,
#       "avgEngagementScore": 4250
#     },
#     ...
#   ]
# }

# 5. Get recommendations
curl http://localhost:3001/api/recommendations?communityId=my-community

# Response:
# {
#   "recommendations": [
#     {
#       "type": "theme_exploration",
#       "title": "Explore 'remote work' theme more",
#       "description": "...",
#       "score": 0.82
#     }
#   ]
# }
```

### Flow 2: Collection Curation

Organize content into curated collections for different purposes.

```bash
# 1. Create collection
curl -X POST http://localhost:3001/api/collections \
  -H "Content-Type: application/json" \
  -d '{
    "communityId": "my-community",
    "name": "Best of 2024",
    "slug": "best-of-2024",
    "description": "Our top-performing content from 2024"
  }'

# 2. Add content to collection
curl -X POST http://localhost:3001/api/collections/{collectionId}/contents \
  -H "Content-Type: application/json" \
  -d '{
    "contentId": "clx123...",
    "order": 0
  }'

# 3. Reorder content
curl -X PATCH http://localhost:3001/api/collections/{collectionId}/reorder \
  -H "Content-Type: application/json" \
  -d '{
    "contentIds": ["clx123...", "clx456...", "clx789..."]
  }'

# 4. Get collection with contents
curl http://localhost:3001/api/collections/{collectionId}
```

### Flow 3: Tag Management

Flexible tagging for content organization and discovery.

```bash
# 1. Create tags with categories
curl -X POST http://localhost:3001/api/tags \
  -H "Content-Type: application/json" \
  -d '{
    "communityId": "my-community",
    "name": "Engineering",
    "slug": "engineering",
    "category": "topic"
  }'

# 2. Tag content
curl -X POST http://localhost:3001/api/tags/{tagId}/contents \
  -H "Content-Type: application/json" \
  -d '{
    "contentId": "clx123..."
  }'

# 3. Find content by tag
curl http://localhost:3001/api/tags/{tagId}

# 4. Get popular tags
curl http://localhost:3001/api/tags/popular?communityId=my-community&limit=20
```

### Flow 4: Trend Analysis

Track how theme performance evolves over time.

```bash
# 1. Generate trends for a time period
curl -X POST http://localhost:3001/api/trends/generate \
  -H "Content-Type: application/json" \
  -d '{
    "communityId": "my-community",
    "granularity": "daily",
    "startDate": "2024-01-01T00:00:00Z",
    "endDate": "2024-01-31T23:59:59Z"
  }'

# 2. Get theme trend history
curl "http://localhost:3001/api/trends/theme/resilience?granularity=daily&limit=30"

# 3. Get currently trending themes
curl "http://localhost:3001/api/trends/trending?granularity=daily&limit=10"
```

### Flow 5: CLI Operations

Use the CLI for admin tasks.

```bash
# View database statistics
npm run cli stats -- --community-id=my-community

# Analyze all unanalyzed content
npm run cli analyze -- --all

# Analyze specific content
npm run cli analyze -- --content-id=clx123...

# Generate trends
npm run cli generate-trends -- --community-id=my-community --days=30

# Cleanup old archived content
npm run cli cleanup -- --days=90 --dry-run
```

---

## API Reference

**For complete API documentation, see [DOCS.md](DOCS.md)**

### Quick Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/content` | GET, POST | List/create content |
| `/api/content/:id` | GET, PATCH, DELETE | Get/update/delete content |
| `/api/analysis` | POST | Analyze content |
| `/api/analysis/batch` | POST | Batch analyze |
| `/api/engagement` | POST | Record engagement |
| `/api/insights/themes` | GET | Top performing themes |
| `/api/insights/tones` | GET | Top performing tones |
| `/api/insights/archetypes` | GET | Top performing archetypes |
| `/api/insights/dashboard` | GET | Dashboard statistics |
| `/api/collections` | GET, POST | List/create collections |
| `/api/tags` | GET, POST | List/create tags |
| `/api/trends` | GET | Query trends |
| `/api/trends/trending` | GET | Currently trending themes |
| `/api/recommendations` | GET | Get recommendations |
| `/api/recommendations/generate` | POST | Generate new recommendations |

### Engagement Score Formula

```
score = (views × 1) + (likes × 5) + (comments × 10) + (shares × 15)
```

**Rationale:**
- Views: Passive consumption (1x)
- Likes: Active approval (5x)
- Comments: Deep engagement (10x)
- Shares: Strongest endorsement (15x)

---

## Extension & Integration

### Custom LLM Provider

Swap OpenAI for Anthropic Claude, local Ollama, or any other LLM:

```typescript
// backend/src/adapters/claudeAnalyzer.ts
import { IAnalyzerAdapter } from '../lib/adapters';

export class ClaudeAnalyzer implements IAnalyzerAdapter {
  async analyzeNarrative(title: string, body: string) {
    // Your Claude implementation
    return { themes: [...], toneLabels: [...], ... };
  }
}

// Register
import { adapters } from './lib/adapters';
adapters.register('analyzer', new ClaudeAnalyzer());
```

### Event-Driven Integration

React to domain events:

```typescript
import { eventBus } from './lib/events';

eventBus.on('analysis.completed', async (event) => {
  const { contentId, themes } = event.data;

  // Custom logic
  await notifyAuthor(contentId);
  await updateRecommendationEngine(themes);
});
```

### Webhook Integration

Send events to external systems:

```typescript
eventBus.on('content.created', async (event) => {
  await fetch(process.env.WEBHOOK_URL, {
    method: 'POST',
    body: JSON.stringify(event),
  });
});
```

**For integration patterns and examples, see [docs/INTEGRATION_RECIPES.md](docs/INTEGRATION_RECIPES.md)**

---

## Testing

### Run Tests

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# With coverage
npm run test:coverage
```

### Test Structure

```
backend/src/__tests__/
├── fixtures/           # Reusable test data
│   └── content.ts
├── helpers/           # Test utilities
│   └── testFactory.ts
├── integration/       # Integration tests
│   └── contentFlow.test.ts
├── aiAnalyzer.test.ts # Unit tests
└── insights.test.ts
```

### Writing Tests

```typescript
import { describe, it, expect } from 'vitest';
import { TestFactory } from '../helpers/testFactory';
import { contentFixtures } from '../fixtures/content';

describe('My Feature', () => {
  const factory = new TestFactory(prisma);

  it('should work correctly', async () => {
    const { content } = await factory.createContentWithEngagement(
      contentFixtures[0],
      'test-community'
    );

    expect(content).toBeDefined();
  });
});
```

---

## Deployment

### Docker Production

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Start services
docker-compose -f docker-compose.prod.yml up -d
```

### Environment Variables

**Backend:**
```env
DATABASE_URL=postgresql://user:pass@host:5432/dbname
PORT=3001
HOST=0.0.0.0
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
NODE_ENV=production
LOG_LEVEL=info
CORS_ORIGIN=https://your-frontend.com
```

**Frontend:**
```env
NEXT_PUBLIC_API_URL=https://api.your-domain.com
```

### Recommended Infrastructure

- **Database**: AWS RDS, Supabase, or DigitalOcean Managed PostgreSQL
- **Backend**: Railway, Render, AWS ECS, or traditional VPS
- **Frontend**: Vercel, Netlify, or Cloudflare Pages
- **Monitoring**: Sentry, LogRocket, Datadog
- **Secrets**: AWS Secrets Manager, Vault, or environment variables

---

## Future Extensions

### Planned Features (Phase 4)

1. **Multi-LLM Support**: A/B test different AI models
2. **Advanced Analytics**: Statistical significance, predictive modeling
3. **Real-Time Features**: WebSocket live dashboards
4. **Webhook System**: Configurable webhooks for events
5. **Export & Reporting**: CSV/PDF exports, scheduled reports
6. **Enhanced Dashboard**: Interactive filters, drill-downs, custom reports

### Wishlist

- Authentication & authorization
- Multi-tenancy with tenant isolation
- Content scheduler with optimal timing suggestions
- Audience segmentation analysis
- Fine-tuned models for specific domains
- Collaboration features (comments, annotations)
- Integration marketplace (Medium, Substack, YouTube connectors)

**For detailed roadmap, see [docs/PHASE3_OVERVIEW.md](docs/PHASE3_OVERVIEW.md)**

---

## Project Structure

```
narrative-analytics-insight-engine/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma          # Database schema
│   ├── src/
│   │   ├── routes/                # API endpoints
│   │   │   ├── content.ts
│   │   │   ├── analysis.ts
│   │   │   ├── engagement.ts
│   │   │   ├── insights.ts
│   │   │   ├── collections.ts
│   │   │   ├── tags.ts
│   │   │   ├── trends.ts
│   │   │   └── recommendations.ts
│   │   ├── services/
│   │   │   └── aiAnalyzer.ts      # LLM integration
│   │   ├── lib/
│   │   │   ├── errors.ts          # Error handling
│   │   │   ├── logger.ts          # Logging
│   │   │   ├── metrics.ts         # Metrics collection
│   │   │   ├── events.ts          # Domain events
│   │   │   └── adapters.ts        # Extension points
│   │   ├── cli/
│   │   │   └── index.ts           # CLI tool
│   │   ├── __tests__/             # Tests
│   │   ├── seed.ts                # Seed data
│   │   └── index.ts               # Entry point
│   ├── .env.example
│   ├── .eslintrc.json
│   ├── .prettierrc.json
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── app/
│   │   ├── page.tsx               # Dashboard
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── package.json
│   └── next.config.js
├── docs/
│   ├── PHASE3_OVERVIEW.md         # Architecture & roadmap
│   ├── DOMAIN_NOTES.md            # Domain model details
│   └── INTEGRATION_RECIPES.md     # Integration examples
├── docker-compose.yml
├── DOCS.md                        # API reference
├── CHANGELOG.md
├── package.json                   # Workspace root
└── README.md                      # This file
```

---

## Contributing

### Development Workflow

1. **Fork & clone** the repository
2. **Create a branch** for your feature
3. **Make changes** with tests
4. **Run tests** (`npm test`) and linting (`npm run lint`)
5. **Commit** with clear messages
6. **Push** and create a pull request

### Code Quality

- **TypeScript strict mode** enforced
- **ESLint** for code quality
- **Prettier** for formatting
- **Vitest** for testing
- **80%+ test coverage** target

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add webhook support
fix: resolve cascade delete issue
docs: update API reference
test: add integration tests for collections
```

---

## License

MIT License - see [LICENSE](LICENSE) file for details

---

## Acknowledgments

Built with:
- [Fastify](https://fastify.dev/) - Fast web framework
- [Prisma](https://www.prisma.io/) - Type-safe ORM
- [Next.js](https://nextjs.org/) - React framework
- [OpenAI](https://openai.com/) - LLM provider
- [Recharts](https://recharts.org/) - Charting library
- [Pino](https://getpino.io/) - Fast logger

---

**Questions or feedback?** Open an issue or submit a pull request!

**Happy analyzing! 📊✨**

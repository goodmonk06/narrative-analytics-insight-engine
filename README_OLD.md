# Narrative Analytics Insight Engine

> **投稿・配信・記事などの「語り」を解析し、どのストーリーラインが一番メンバーに刺さっているかを可視化するエンジン**

A powerful analytics engine that analyzes content narratives (posts, newsletters, talks) to identify themes, emotional tones, and story archetypes—then correlates them with engagement metrics to reveal what truly resonates with your audience.

## Features

- **AI-Powered Analysis**: Leverages LLMs to automatically identify themes, tones, and archetypes in your content
- **Engagement Correlation**: Discover which narrative elements drive the highest engagement
- **Beautiful Dashboard**: Visualize top-performing themes, tones, and archetypes in real-time
- **REST API**: Full-featured API for content management, analysis, and insights
- **Type-Safe**: Built with TypeScript for reliability and great DX
- **Production Ready**: Docker setup, tests, and seed data included

## Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- OpenAI API Key (or compatible LLM endpoint)

### 1. Clone and Setup

```bash
# Copy environment file
cp backend/.env.example backend/.env

# Add your OpenAI API key to backend/.env
# OPENAI_API_KEY=sk-...
```

### 2. Start with Docker

```bash
# Start all services (PostgreSQL, Backend, Frontend)
docker-compose up -d

# Run migrations
docker-compose exec backend npx prisma migrate dev

# Seed with sample data
docker-compose exec backend npm run db:seed
```

### 3. Access the Application

- **Dashboard**: http://localhost:3000
- **API**: http://localhost:3001
- **API Health**: http://localhost:3001/health

For full documentation, see the complete README in the repository.

# Changelog

All notable changes to the Narrative Analytics Insight Engine will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-01-18

### Added

#### Domain Model Expansion
- **NarrativeContent**: Added `status`, `visibility`, `authorId`, `publishedAt`, `archivedAt` fields
- **SourceType**: Added `article`, `video`, `podcast` types
- **ContentStatus**: New enum (draft, published, archived, deleted)
- **ContentVisibility**: New enum (public, private, unlisted)
- **NarrativeCollection**: New entity for curating content groupings
- **Tag System**: Flexible tagging with categories (topic, audience, format)
- **NarrativeTrend**: Time-series tracking of theme performance
- **NarrativeRecommendation**: AI-generated content strategy suggestions

#### API Endpoints
- `/api/collections/*` - Collection CRUD and content management
- `/api/tags/*` - Tag CRUD and content tagging
- `/api/trends/*` - Trend generation and time-series queries
- `/api/recommendations/*` - AI recommendation generation and management
- `/health` - Enhanced health check with database connectivity
- `/metrics` - Metrics endpoint for monitoring

#### Infrastructure
- Centralized error handling with typed error classes
- Structured logging with Pino
- Metrics collection abstraction
- Domain event bus for decoupled integrations
- Adapter pattern for swappable implementations (LLM, notifications, storage, cache)
- CLI tool for admin operations

#### Developer Experience
- ESLint and Prettier configuration
- Comprehensive npm scripts (lint, format, typecheck)
- Test fixtures and factory pattern
- Integration tests
- Enhanced seed data with collections, tags, and recommendations

#### Documentation
- `docs/PHASE3_OVERVIEW.md` - Architecture and roadmap
- `docs/DOMAIN_NOTES.md` - Detailed domain model documentation
- `docs/INTEGRATION_RECIPES.md` - Integration patterns and examples
- `DOCS.md` - Complete API reference
- `CHANGELOG.md` - This file

### Changed
- Upgraded error responses to consistent JSON structure
- Improved logging throughout application
- Enhanced seed script with more comprehensive demo data
- Expanded test coverage

### Fixed
- Content lifecycle management with proper status transitions
- Cascade delete for related records

## [0.1.0] - 2024-01-17

### Added
- Initial project scaffold
- Basic domain models (NarrativeContent, NarrativeAnalysis, NarrativeEngagement)
- OpenAI integration for AI analysis
- Insight endpoints for theme/tone/archetype correlation
- Next.js dashboard
- Docker Compose setup
- Basic tests
- Initial seed data

---

For upgrade instructions and migration guides, see `docs/MIGRATION.md`.

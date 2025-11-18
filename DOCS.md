# Complete Documentation

## API Reference

### Content Endpoints

#### Create Content
```
POST /api/content
```

**Request Body:**
```json
{
  "communityId": "string",
  "sourceType": "post" | "newsletter" | "talk" | "other",
  "sourceRef": "string (optional)",
  "title": "string",
  "bodyMarkdown": "string",
  "ts": "ISO 8601 datetime (optional)",
  "metaJson": "object (optional)"
}
```

**Response:**
```json
{
  "content": {
    "id": "string",
    "communityId": "string",
    "sourceType": "string",
    "title": "string",
    ...
  }
}
```

#### Get All Content
```
GET /api/content?communityId=<id>&sourceType=<type>&limit=<n>&offset=<n>
```

#### Get Single Content
```
GET /api/content/:id
```

### Analysis Endpoints

#### Analyze Content
```
POST /api/analysis
```

**Request Body:**
```json
{
  "contentId": "string",
  "autoAnalyze": true
}
```

**Response:**
```json
{
  "analysis": {
    "id": "string",
    "contentId": "string",
    "themesJson": ["theme1", "theme2", ...],
    "toneLabelsJson": ["tone1", "tone2", ...],
    "archetypeLabelsJson": ["archetype1", ...],
    "summaryMarkdown": "string",
    "aiModelInfoJson": {...},
    "createdAt": "datetime"
  }
}
```

#### Batch Analyze
```
POST /api/analysis/batch
```

**Request Body:**
```json
{
  "contentIds": ["id1", "id2", "id3"]
}
```

### Engagement Endpoints

#### Record Engagement
```
POST /api/engagement
```

**Request Body:**
```json
{
  "contentId": "string",
  "views": 0,
  "likes": 0,
  "comments": 0,
  "shares": 0,
  "otherMetricsJson": {},
  "recordedAt": "ISO 8601 datetime (optional)"
}
```

### Insight Endpoints

#### Get Top Themes
```
GET /api/insights/themes?limit=10&communityId=<id>
```

**Response:**
```json
{
  "themes": [
    {
      "theme": "innovation",
      "count": 15,
      "avgViews": 2340,
      "avgLikes": 178,
      "avgComments": 34,
      "avgShares": 45,
      "avgEngagementScore": 4250,
      "contentIds": ["id1", "id2"]
    }
  ]
}
```

#### Get Top Tones
```
GET /api/insights/tones?limit=10
```

#### Get Top Archetypes
```
GET /api/insights/archetypes?limit=10
```

#### Get Dashboard Stats
```
GET /api/insights/dashboard?communityId=<id>
```

## Engagement Score Formula

The engagement score is calculated as a weighted sum:

```
score = (views × 1) + (likes × 5) + (comments × 10) + (shares × 15)
```

**Rationale:**
- **Views (1x)**: Base engagement metric
- **Likes (5x)**: Shows approval
- **Comments (10x)**: Deeper engagement
- **Shares (15x)**: Highest value - indicates strong resonance

## Integration Examples

### Node.js/TypeScript

```typescript
import fetch from 'node-fetch';

const API_URL = 'http://localhost:3001';

// Create and analyze content
async function analyzeContent(communityId: string, title: string, body: string) {
  // Create content
  const contentRes = await fetch(`${API_URL}/api/content`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      communityId,
      sourceType: 'post',
      title,
      bodyMarkdown: body,
    }),
  });
  const { content } = await contentRes.json();

  // Analyze
  const analysisRes = await fetch(`${API_URL}/api/analysis`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contentId: content.id }),
  });
  const { analysis } = await analysisRes.json();

  return { content, analysis };
}

// Get insights
async function getTopThemes() {
  const res = await fetch(`${API_URL}/api/insights/themes?limit=5`);
  const { themes } = await res.json();
  return themes;
}
```

### Python

```python
import requests

API_URL = 'http://localhost:3001'

def analyze_content(community_id, title, body):
    # Create content
    content_res = requests.post(
        f'{API_URL}/api/content',
        json={
            'communityId': community_id,
            'sourceType': 'post',
            'title': title,
            'bodyMarkdown': body
        }
    )
    content = content_res.json()['content']

    # Analyze
    analysis_res = requests.post(
        f'{API_URL}/api/analysis',
        json={'contentId': content['id']}
    )
    analysis = analysis_res.json()['analysis']

    return content, analysis

def get_top_themes():
    res = requests.get(f'{API_URL}/api/insights/themes?limit=5')
    return res.json()['themes']
```

## Database Schema

### NarrativeContent
- `id`: CUID (Primary Key)
- `communityId`: String (Indexed)
- `sourceType`: Enum (post, newsletter, talk, other)
- `sourceRef`: String (Optional)
- `title`: String
- `bodyMarkdown`: Text
- `ts`: DateTime (Indexed)
- `metaJson`: JSON (Optional)
- `createdAt`: DateTime
- `updatedAt`: DateTime

### NarrativeAnalysis
- `id`: CUID (Primary Key)
- `contentId`: String (Foreign Key, Indexed)
- `themesJson`: JSON Array
- `toneLabelsJson`: JSON Array
- `archetypeLabelsJson`: JSON Array
- `summaryMarkdown`: Text
- `aiModelInfoJson`: JSON
- `createdAt`: DateTime

### NarrativeEngagement
- `id`: CUID (Primary Key)
- `contentId`: String (Foreign Key, Indexed)
- `views`: Integer
- `likes`: Integer
- `comments`: Integer
- `shares`: Integer
- `otherMetricsJson`: JSON (Optional)
- `recordedAt`: DateTime (Indexed)

## Environment Configuration

### Backend Environment Variables

```bash
# Database
DATABASE_URL="postgresql://user:pass@host:5432/dbname?schema=public"

# Server
PORT=3001
HOST=0.0.0.0

# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini

# CORS
CORS_ORIGIN=http://localhost:3000
```

### Frontend Environment Variables

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Deployment Guide

### Railway

1. Create a new Railway project
2. Add PostgreSQL plugin
3. Deploy backend:
   - Add environment variables
   - Connect to PostgreSQL
   - Run migrations: `npx prisma migrate deploy`
4. Deploy frontend:
   - Set `NEXT_PUBLIC_API_URL` to backend URL

### Vercel (Frontend)

```bash
vercel --prod
```

Set environment variable:
- `NEXT_PUBLIC_API_URL`: Your backend API URL

### Docker Production

```bash
# Build
docker-compose -f docker-compose.prod.yml build

# Start
docker-compose -f docker-compose.prod.yml up -d
```

## Customization Guide

### Custom LLM Provider

Edit `backend/src/services/aiAnalyzer.ts`:

```typescript
export class AIAnalyzer {
  async analyzeNarrative(title: string, body: string): Promise<AnalysisResult> {
    // Replace with your LLM API call
    const response = await yourLLMClient.analyze({
      prompt: `Analyze: ${title}\n\n${body}`,
    });

    return {
      themes: response.themes,
      toneLabels: response.tones,
      archetypeLabels: response.archetypes,
      summary: response.summary,
    };
  }
}
```

### Custom Engagement Weights

Edit `backend/src/routes/insights.ts`:

```typescript
const avgEngagementScore =
  avgViews * YOUR_VIEW_WEIGHT +
  avgLikes * YOUR_LIKE_WEIGHT +
  avgComments * YOUR_COMMENT_WEIGHT +
  avgShares * YOUR_SHARE_WEIGHT;
```

### Adding New Analysis Dimensions

1. Update Prisma schema:
```prisma
model NarrativeAnalysis {
  // ... existing fields
  sentimentJson Json?  // Add new field
}
```

2. Run migration:
```bash
npx prisma migrate dev --name add_sentiment
```

3. Update analyzer service
4. Update insights endpoints

## Testing

### Run Tests

```bash
cd backend
npm test
```

### Test Coverage

```bash
npm test -- --coverage
```

### Manual Testing

```bash
# Health check
curl http://localhost:3001/health

# Create test content
curl -X POST http://localhost:3001/api/content \
  -H "Content-Type: application/json" \
  -d '{"communityId":"test","sourceType":"post","title":"Test","bodyMarkdown":"Test content"}'
```

## Troubleshooting

### Common Issues

**Issue**: Database connection failed
**Solution**: Verify PostgreSQL is running and DATABASE_URL is correct

**Issue**: OpenAI API errors
**Solution**: Check API key, rate limits, and billing

**Issue**: Frontend can't connect to backend
**Solution**: Verify NEXT_PUBLIC_API_URL and CORS settings

**Issue**: Prisma client errors
**Solution**: Run `npx prisma generate`

### Debug Mode

Enable verbose logging:

```bash
# Backend
DEBUG=* npm run dev

# Check logs
docker-compose logs -f backend
```

## Performance Optimization

### Database Indexing

Already indexed:
- `NarrativeContent.communityId`
- `NarrativeContent.sourceType`
- `NarrativeContent.ts`
- `NarrativeAnalysis.contentId`
- `NarrativeEngagement.contentId`
- `NarrativeEngagement.recordedAt`

### Caching Strategy

Consider adding Redis for:
- Insight query results (TTL: 5-10 minutes)
- Analysis results
- Engagement aggregations

### Batch Processing

Use the batch analysis endpoint for multiple content pieces:

```bash
POST /api/analysis/batch
{
  "contentIds": ["id1", "id2", "id3", ...]
}
```

## License

MIT License

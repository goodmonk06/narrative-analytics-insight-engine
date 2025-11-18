# Domain Model: Narrative Analytics

## Overview

This document provides detailed information about the domain model, entities, relationships, and business rules governing the Narrative Analytics Insight Engine.

## Core Entities

### NarrativeContent

The central entity representing a piece of content to be analyzed.

**Attributes:**
- `id`: Unique identifier (CUID)
- `communityId`: Reference to the community/organization
- `sourceType`: Type of content (post, newsletter, talk, article, video, podcast, other)
- `sourceRef`: Optional external reference ID (e.g., Medium article ID)
- `title`: Content title
- `bodyMarkdown`: Full content in Markdown format
- `ts`: Timestamp when content was originally published
- `status`: Lifecycle status (draft, published, archived, deleted)
- `visibility`: Access level (public, private, unlisted)
- `authorId`: Optional reference to content author
- `metaJson`: Flexible metadata storage
- `publishedAt`, `archivedAt`: Lifecycle timestamps

**Business Rules:**
1. Content must have a title and body
2. Content can only transition through status lifecycle: draft → published → archived → deleted
3. Deleted content is soft-deleted (status changes, not physically removed)
4. SourceRef should be unique per sourceType when provided

**Relationships:**
- One-to-many: NarrativeAnalysis
- One-to-many: NarrativeEngagement
- Many-to-many: NarrativeCollection (via CollectionContent)
- Many-to-many: Tag (via ContentTag)

### NarrativeAnalysis

AI-generated analysis of content narrative elements.

**Attributes:**
- `id`: Unique identifier
- `contentId`: Reference to analyzed content
- `themesJson`: Array of identified themes (e.g., ["innovation", "remote work"])
- `toneLabelsJson`: Array of emotional tones (e.g., ["inspirational", "analytical"])
- `archetypeLabelsJson`: Array of story archetypes (e.g., ["hero's journey", "problem-solution"])
- `summaryMarkdown`: Concise summary of the content
- `aiModelInfoJson`: Metadata about the AI model used (provider, version, timestamp)

**Business Rules:**
1. Each content piece can have multiple analyses (historical tracking)
2. Most recent analysis is considered current
3. Themes, tones, and archetypes should be lowercase for consistency
4. AI model info must include provider and model name for auditing

**Analysis Dimensions:**

**Themes** (What it's about):
- Topic areas discussed
- Examples: "artificial intelligence", "climate change", "product management"

**Tones** (How it's communicated):
- Emotional character of the writing
- Examples: "analytical", "conversational", "urgent", "optimistic", "critical"

**Archetypes** (Narrative structure):
- Story patterns used
- Examples: "hero's journey", "problem-solution", "transformation", "discovery", "teaching"

### NarrativeEngagement

Quantitative engagement metrics for content.

**Attributes:**
- `id`: Unique identifier
- `contentId`: Reference to content
- `views`: View count
- `likes`: Like/reaction count
- `comments`: Comment count
- `shares`: Share count
- `otherMetricsJson`: Platform-specific metrics
- `recordedAt`: When metrics were recorded

**Business Rules:**
1. All numeric metrics must be non-negative
2. Multiple engagement records per content track changes over time
3. Most recent record represents current engagement

**Engagement Score Formula:**
```
score = (views × 1) + (likes × 5) + (comments × 10) + (shares × 15)
```

**Rationale:**
- Views: Passive consumption (1x weight)
- Likes: Active approval (5x weight)
- Comments: Deep engagement (10x weight)
- Shares: Strongest endorsement (15x weight)

This weighting reflects the relative effort and commitment each action requires.

### NarrativeCollection

Curated groupings of related content.

**Attributes:**
- `id`: Unique identifier
- `communityId`: Owning community
- `name`: Collection name
- `description`: Optional description
- `slug`: URL-friendly identifier (unique per community)
- `metaJson`: Additional metadata

**Business Rules:**
1. Slug must be unique within a community
2. Slug format: lowercase, alphanumeric with hyphens only
3. Content can belong to multiple collections
4. Content order within collection is maintained via `CollectionContent.order`

**Use Cases:**
- "Best of 2023" - curated top-performing content
- "Onboarding Series" - sequential content for new members
- "Product Updates" - all product-related announcements
- "Guest Posts" - content from external contributors

### Tag

Flexible labeling system for content categorization.

**Attributes:**
- `id`: Unique identifier
- `communityId`: Owning community
- `name`: Tag display name
- `slug`: URL-friendly identifier
- `category`: Optional grouping (e.g., "topic", "audience", "format")

**Business Rules:**
1. Slug must be unique within a community
2. Content can have multiple tags
3. Tags can be categorized for organization

**Tag Categories:**
- **topic**: Subject matter (e.g., "ai", "climate", "health")
- **audience**: Target audience (e.g., "beginner", "advanced", "executive")
- **format**: Content style (e.g., "tutorial", "opinion", "news")
- **industry**: Industry focus (e.g., "fintech", "healthcare", "education")

### NarrativeTrend

Time-series performance tracking for themes.

**Attributes:**
- `id`: Unique identifier
- `communityId`: Community scope
- `theme`: Theme being tracked
- `periodStart`, `periodEnd`: Time window
- `granularity`: Time bucket size (hourly, daily, weekly, monthly)
- `contentCount`: Number of content pieces in period
- `totalViews`, `totalLikes`, `totalComments`, `totalShares`: Aggregated metrics
- `avgEngagementScore`: Average engagement score for theme in period

**Business Rules:**
1. Unique combination of (communityId, theme, periodStart, granularity)
2. Trends are generated, not manually created
3. Used for time-series analysis and identifying trending themes

**Use Cases:**
- "Is 'AI safety' growing or declining in popularity?"
- "Which themes saw engagement spikes this month?"
- "Show weekly trends for our top 5 themes"

### NarrativeRecommendation

AI-generated strategic recommendations for content creators.

**Attributes:**
- `id`: Unique identifier
- `communityId`: Target community
- `type`: Recommendation category
- `title`: Short recommendation title
- `description`: Detailed explanation
- `score`: Confidence score (0-1)
- `basedOnContentIds`: Content pieces that informed the recommendation
- `suggestedThemes`, `suggestedTones`: Specific suggestions
- `status`: Lifecycle (active, dismissed, applied, expired)

**Recommendation Types:**
1. **theme_exploration**: Suggest exploring a new or underused theme
2. **tone_adjustment**: Recommend trying a different emotional tone
3. **content_format**: Suggest experimenting with a different format
4. **timing_optimization**: Recommend better publication timing
5. **engagement_boost**: Suggest ways to increase engagement

**Business Rules:**
1. Recommendations are generated by analyzing historical performance
2. Score threshold determines which recommendations surface
3. Status transitions: active → (dismissed | applied | expired)
4. Applied recommendations should track impact

**Example Recommendation:**
```json
{
  "type": "theme_exploration",
  "title": "Explore 'Web3' theme more",
  "description": "The theme 'Web3' has shown strong engagement (avg score: 4200) but is underutilized. You've only published 3 pieces on this theme. Consider creating more content around Web3 to capitalize on audience interest.",
  "score": 0.85,
  "suggestedThemes": ["web3", "blockchain", "decentralization"],
  "suggestedTones": ["analytical", "forward-looking"]
}
```

## Entity Relationships

```
NarrativeContent
├── has many → NarrativeAnalysis
├── has many → NarrativeEngagement
├── belongs to many → NarrativeCollection (via CollectionContent)
└── belongs to many → Tag (via ContentTag)

NarrativeTrend
└── aggregates → NarrativeContent (by theme)

NarrativeRecommendation
└── references → NarrativeContent (basedOnContentIds)
```

## Lifecycle Flows

### Content Lifecycle

```
┌────────────────────────────────────────────┐
│ 1. Create Draft                            │
│    POST /api/content                       │
│    status: draft, visibility: private      │
└────────────┬───────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────┐
│ 2. Analyze Content                         │
│    POST /api/analysis                      │
│    → Generates themes, tones, archetypes   │
└────────────┬───────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────┐
│ 3. Review & Edit                           │
│    PATCH /api/content/:id                  │
│    Refine based on analysis                │
└────────────┬───────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────┐
│ 4. Publish                                 │
│    PATCH /api/content/:id                  │
│    status: published, publishedAt: now()   │
└────────────┬───────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────┐
│ 5. Track Engagement                        │
│    POST /api/engagement                    │
│    Record views, likes, comments, shares   │
└────────────┬───────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────┐
│ 6. Analyze Performance                     │
│    GET /api/insights/themes                │
│    See how this content's themes perform   │
└────────────┬───────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────┐
│ 7. Archive (optional)                      │
│    PATCH /api/content/:id                  │
│    status: archived, archivedAt: now()     │
└────────────────────────────────────────────┘
```

### Insight Generation Flow

```
┌────────────────────────────────────────────┐
│ Content Created & Published                │
└────────────┬───────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────┐
│ AI Analysis Performed                      │
│ → Themes, Tones, Archetypes Identified     │
└────────────┬───────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────┐
│ Engagement Tracked Over Time               │
│ → Views, Likes, Comments, Shares           │
└────────────┬───────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────┐
│ Correlation Analysis                       │
│ → Which themes = high engagement?          │
│ → Which tones = most shares?               │
│ → Which archetypes = most comments?        │
└────────────┬───────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────┐
│ Insights API Queries                       │
│ → GET /api/insights/themes                 │
│ → GET /api/insights/tones                  │
│ → GET /api/insights/archetypes             │
└────────────────────────────────────────────┘
```

## Business Intelligence Queries

### Key Questions This System Answers

1. **What themes resonate most with our audience?**
   - Query top themes by engagement score
   - Compare theme performance month-over-month

2. **What emotional tone drives the most engagement?**
   - Analyze tone labels across high-performing content
   - A/B compare analytical vs inspirational tones

3. **What story structures work best?**
   - Identify which archetypes correlate with shares
   - Find archetype combinations that drive comments

4. **How are trends evolving?**
   - Track theme popularity over time
   - Identify emerging vs declining themes

5. **What should we create next?**
   - Review AI-generated recommendations
   - Identify underexplored high-potential themes

## Data Quality Considerations

### AI Analysis Variance
- Different LLM models may categorize the same content differently
- Store `aiModelInfoJson` for auditing and comparison
- Consider re-analyzing old content with newer models

### Engagement Metric Freshness
- Engagement changes over time (especially views)
- Record `recordedAt` timestamp
- Query most recent engagement for current state

### Theme Consistency
- Themes should be normalized (lowercase, singular form)
- Consider implementing a theme taxonomy or ontology
- Periodic cleanup to merge similar themes ("AI" vs "artificial intelligence")

## Extension Points

### Custom Analysis Dimensions
Add new JSON fields to `NarrativeAnalysis`:
- `sentimentJson`: Sentiment analysis (positive/negative/neutral)
- `readabilityJson`: Reading level, word count, complexity
- `entityJson`: Named entities mentioned (people, companies, products)

### Custom Engagement Metrics
Add platform-specific metrics to `otherMetricsJson`:
- YouTube: watch time, retention rate
- Newsletter: open rate, click-through rate
- Podcast: listen duration, completion rate

### Advanced Recommendations
Expand recommendation types:
- `audience_targeting`: Suggest which segments to target
- `collaboration_opportunity`: Suggest co-creating with other authors
- `content_refresh`: Suggest updating evergreen content

---

**Last Updated**: 2024-01-18

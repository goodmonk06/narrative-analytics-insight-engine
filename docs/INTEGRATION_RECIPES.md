# Integration Recipes

This document provides practical examples of integrating the Narrative Analytics Insight Engine with other systems in a larger ecosystem.

## Table of Contents

1. [Authentication Integration](#authentication-integration)
2. [Notification System Integration](#notification-system-integration)
3. [Content Platform Connectors](#content-platform-connectors)
4. [Analytics Pipeline Integration](#analytics-pipeline-integration)
5. [Recommendation Engine Integration](#recommendation-engine-integration)
6. [Webhook Consumers](#webhook-consumers)
7. [Custom LLM Providers](#custom-llm-providers)

---

## Authentication Integration

### Scenario: JWT-Based Auth Middleware

Integrate with an upstream authentication service to secure API endpoints.

```typescript
// backend/src/middleware/auth.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';

export interface AuthenticatedUser {
  id: string;
  communityId: string;
  role: 'admin' | 'editor' | 'viewer';
}

export async function authenticateRequest(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const token = request.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return reply.status(401).send({ error: 'Missing authorization token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as AuthenticatedUser;
    request.user = decoded;
  } catch (error) {
    return reply.status(401).send({ error: 'Invalid token' });
  }
}

// Usage in route
fastify.get('/api/content', {
  preHandler: [authenticateRequest],
}, async (request, reply) => {
  const { communityId } = request.user as AuthenticatedUser;
  // Filter content by user's community
  const content = await fastify.prisma.narrativeContent.findMany({
    where: { communityId },
  });
  return { content };
});
```

### Scenario: API Key Authentication

```typescript
// backend/src/middleware/apiKey.ts
export async function validateApiKey(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const apiKey = request.headers['x-api-key'] as string;

  if (!apiKey) {
    return reply.status(401).send({ error: 'Missing API key' });
  }

  // Validate against database or environment
  const validKey = await validateKeyInDatabase(apiKey);

  if (!validKey) {
    return reply.status(401).send({ error: 'Invalid API key' });
  }

  request.apiClient = validKey;
}
```

---

## Notification System Integration

### Scenario: Slack Notifications for High-Performing Content

```typescript
// backend/src/adapters/slackNotification.ts
import { INotificationAdapter, NotificationParams } from '../lib/adapters';

export class SlackNotificationAdapter implements INotificationAdapter {
  async send(params: NotificationParams): Promise<void> {
    if (params.channel !== 'slack') return;

    const webhook = process.env.SLACK_WEBHOOK_URL;
    if (!webhook) return;

    await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: params.subject,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: params.message,
            },
          },
        ],
      }),
    });
  }
}

// Register adapter
import { adapters } from './lib/adapters';
import { SlackNotificationAdapter } from './adapters/slackNotification';

adapters.register('notification', new SlackNotificationAdapter());

// Use in event handler
import { eventBus } from './lib/events';
import { adapters } from './lib/adapters';

eventBus.on('engagement.recorded', async (event) => {
  const { contentId, views, likes, shares } = event.data;

  const engagementScore = views + likes * 5 + shares * 15;

  if (engagementScore > 5000) {
    const content = await prisma.narrativeContent.findUnique({
      where: { id: contentId },
    });

    const notifier = adapters.get<INotificationAdapter>('notification');
    await notifier.send({
      to: '#content-alerts',
      subject: '🔥 High-performing content detected!',
      message: `"${content?.title}" has reached ${engagementScore} engagement score!`,
      channel: 'slack',
    });
  }
});
```

---

## Content Platform Connectors

### Scenario: Medium Article Importer

```typescript
// backend/src/integrations/medium.ts
import { PrismaClient } from '@prisma/client';

export class MediumConnector {
  constructor(private prisma: PrismaClient, private apiKey: string) {}

  async importArticle(mediumUrl: string, communityId: string) {
    // Fetch article from Medium API
    const response = await fetch(`https://api.medium.com/v1/articles/${mediumUrl}`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });

    const article = await response.json();

    // Create content record
    const content = await this.prisma.narrativeContent.create({
      data: {
        communityId,
        sourceType: 'article',
        sourceRef: article.id,
        title: article.title,
        bodyMarkdown: article.content,
        ts: new Date(article.publishedAt),
        metaJson: {
          mediumUrl,
          claps: article.claps,
          readingTime: article.readingTime,
        },
      },
    });

    // Record initial engagement
    await this.prisma.narrativeEngagement.create({
      data: {
        contentId: content.id,
        views: article.views || 0,
        likes: article.claps || 0,
        comments: article.responses || 0,
        shares: 0,
      },
    });

    return content;
  }

  async syncEngagement(contentId: string) {
    const content = await this.prisma.narrativeContent.findUnique({
      where: { id: contentId },
    });

    if (!content?.sourceRef) return;

    const response = await fetch(
      `https://api.medium.com/v1/articles/${content.sourceRef}/stats`,
      {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      }
    );

    const stats = await response.json();

    await this.prisma.narrativeEngagement.create({
      data: {
        contentId,
        views: stats.views,
        likes: stats.claps,
        comments: stats.responses,
        shares: 0,
      },
    });
  }
}
```

### Scenario: Newsletter Platform (Substack) Connector

```typescript
// backend/src/integrations/substack.ts
export class SubstackConnector {
  async importNewsletter(substackUrl: string, communityId: string) {
    // Fetch newsletter via RSS
    const response = await fetch(`${substackUrl}/feed`);
    const xml = await response.text();

    // Parse RSS (use xml parser library)
    const articles = parseRSS(xml);

    for (const article of articles) {
      await this.prisma.narrativeContent.create({
        data: {
          communityId,
          sourceType: 'newsletter',
          sourceRef: article.guid,
          title: article.title,
          bodyMarkdown: htmlToMarkdown(article.content),
          ts: new Date(article.pubDate),
          metaJson: {
            substackUrl: article.link,
          },
        },
      });
    }
  }
}
```

---

## Analytics Pipeline Integration

### Scenario: Export to Data Warehouse

```typescript
// backend/src/integrations/dataWarehouse.ts
export class DataWarehouseExporter {
  async exportInsights(communityId: string, startDate: Date, endDate: Date) {
    // Gather all insights
    const content = await prisma.narrativeContent.findMany({
      where: {
        communityId,
        ts: { gte: startDate, lte: endDate },
      },
      include: {
        analysis: true,
        engagement: {
          orderBy: { recordedAt: 'desc' },
          take: 1,
        },
      },
    });

    // Transform to analytics schema
    const records = content.map((c) => ({
      content_id: c.id,
      title: c.title,
      published_at: c.ts,
      source_type: c.sourceType,
      themes: c.analysis[0]?.themesJson,
      tones: c.analysis[0]?.toneLabelsJson,
      archetypes: c.analysis[0]?.archetypeLabelsJson,
      views: c.engagement[0]?.views || 0,
      likes: c.engagement[0]?.likes || 0,
      comments: c.engagement[0]?.comments || 0,
      shares: c.engagement[0]?.shares || 0,
    }));

    // Send to data warehouse (BigQuery, Snowflake, etc.)
    await sendToBigQuery('narrative_analytics.content_performance', records);
  }
}
```

---

## Recommendation Engine Integration

### Scenario: Personalized Content Recommendations

```typescript
// backend/src/integrations/recommendationEngine.ts
export class PersonalizedRecommendations {
  async getRecommendationsForMember(
    memberId: string,
    communityId: string
  ) {
    // Get member's engagement history
    const memberHistory = await getMemberEngagementHistory(memberId);

    // Get theme preferences (themes they've engaged with most)
    const preferredThemes = extractPreferredThemes(memberHistory);

    // Find content matching those themes
    const content = await prisma.narrativeContent.findMany({
      where: {
        communityId,
        analysis: {
          some: {
            themesJson: {
              hasSome: preferredThemes,
            },
          },
        },
      },
      include: {
        analysis: true,
        engagement: {
          orderBy: { recordedAt: 'desc' },
          take: 1,
        },
      },
      orderBy: {
        engagement: {
          _count: 'desc',
        },
      },
      take: 10,
    });

    return content;
  }
}
```

---

## Webhook Consumers

### Scenario: React to Content Creation

```typescript
// External service consuming webhooks
app.post('/webhooks/narrative-analytics', async (req, res) => {
  const event = req.body;

  if (event.type === 'content.created') {
    const { contentId, communityId, title } = event.data;

    // Trigger moderation workflow
    await moderationQueue.add({
      contentId,
      communityId,
      title,
    });

    // Update search index
    await searchIndex.index({
      id: contentId,
      title,
      community: communityId,
    });
  }

  res.json({ received: true });
});
```

---

## Custom LLM Providers

### Scenario: Use Anthropic Claude Instead of OpenAI

```typescript
// backend/src/adapters/claudeAnalyzer.ts
import Anthropic from '@anthropic-ai/sdk';
import { IAnalyzerAdapter, AnalysisResult } from '../lib/adapters';

export class ClaudeAnalyzer implements IAnalyzerAdapter {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    });
  }

  async analyzeNarrative(title: string, bodyMarkdown: string): Promise<AnalysisResult> {
    const prompt = `Analyze the following content and extract themes, tones, and archetypes.

Title: ${title}

Content:
${bodyMarkdown}

Respond with JSON:
{
  "themes": ["theme1", "theme2", ...],
  "toneLabels": ["tone1", "tone2", ...],
  "archetypeLabels": ["archetype1", ...],
  "summary": "Brief summary"
}`;

    const message = await this.client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText = message.content[0].type === 'text'
      ? message.content[0].text
      : '';

    const parsed = JSON.parse(responseText);

    return {
      themes: parsed.themes || [],
      toneLabels: parsed.toneLabels || [],
      archetypeLabels: parsed.archetypeLabels || [],
      summary: parsed.summary || '',
    };
  }

  getModelInfo() {
    return {
      provider: 'anthropic',
      model: 'claude-3-5-sonnet-20241022',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };
  }
}

// Register as analyzer
import { adapters } from '../lib/adapters';
import { ClaudeAnalyzer } from '../adapters/claudeAnalyzer';

adapters.register('analyzer', new ClaudeAnalyzer());

// Update routes to use adapter
const analyzer = adapters.get<IAnalyzerAdapter>('analyzer');
const result = await analyzer.analyzeNarrative(title, body);
```

### Scenario: Use Local LLM (Ollama)

```typescript
// backend/src/adapters/ollamaAnalyzer.ts
export class OllamaAnalyzer implements IAnalyzerAdapter {
  private baseUrl: string;
  private model: string;

  constructor() {
    this.baseUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    this.model = process.env.OLLAMA_MODEL || 'llama3';
  }

  async analyzeNarrative(title: string, bodyMarkdown: string): Promise<AnalysisResult> {
    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        prompt: `Analyze this content and return JSON...\n\nTitle: ${title}\n\nContent: ${bodyMarkdown}`,
        format: 'json',
        stream: false,
      }),
    });

    const data = await response.json();
    const parsed = JSON.parse(data.response);

    return {
      themes: parsed.themes || [],
      toneLabels: parsed.toneLabels || [],
      archetypeLabels: parsed.archetypeLabels || [],
      summary: parsed.summary || '',
    };
  }

  getModelInfo() {
    return {
      provider: 'ollama',
      model: this.model,
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };
  }
}
```

---

## Common Integration Patterns

### Pattern 1: Event-Driven Integration

Use the built-in event bus to react to domain events:

```typescript
import { eventBus } from './lib/events';

eventBus.on('analysis.completed', async (event) => {
  const { contentId, themes } = event.data;

  // Update recommendation engine
  await recommendationEngine.updateThemeIndex(contentId, themes);

  // Notify content author
  await emailService.notifyAuthor(contentId, 'Your content has been analyzed!');

  // Log to analytics
  await analytics.track('content_analyzed', { contentId, themes });
});
```

### Pattern 2: Adapter Pattern for External Services

Implement adapters for consistent interfaces:

```typescript
interface IEmailService {
  send(to: string, subject: string, body: string): Promise<void>;
}

class SendGridAdapter implements IEmailService {
  async send(to: string, subject: string, body: string) {
    // SendGrid implementation
  }
}

class PostmarkAdapter implements IEmailService {
  async send(to: string, subject: string, body: string) {
    // Postmark implementation
  }
}

// Swap implementations easily
const emailService: IEmailService =
  process.env.EMAIL_PROVIDER === 'sendgrid'
    ? new SendGridAdapter()
    : new PostmarkAdapter();
```

### Pattern 3: Background Job Queue

For long-running tasks like batch analysis:

```typescript
import Bull from 'bull';

const analysisQueue = new Bull('narrative-analysis', process.env.REDIS_URL);

analysisQueue.process(async (job) => {
  const { contentId } = job.data;

  const content = await prisma.narrativeContent.findUnique({
    where: { id: contentId },
  });

  const result = await analyzer.analyzeNarrative(content!.title, content!.bodyMarkdown);

  await prisma.narrativeAnalysis.create({
    data: {
      contentId,
      themesJson: result.themes,
      toneLabelsJson: result.toneLabels,
      archetypeLabelsJson: result.archetypeLabels,
      summaryMarkdown: result.summary,
      aiModelInfoJson: analyzer.getModelInfo(),
    },
  });
});

// Add jobs to queue instead of processing synchronously
fastify.post('/api/content', async (request, reply) => {
  const content = await prisma.narrativeContent.create({ data: request.body });

  // Queue analysis instead of running synchronously
  await analysisQueue.add({ contentId: content.id });

  return { content, analysisQueued: true };
});
```

---

**Last Updated**: 2024-01-18

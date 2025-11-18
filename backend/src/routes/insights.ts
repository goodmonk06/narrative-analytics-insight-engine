import { FastifyInstance } from 'fastify';
import { Prisma } from '@prisma/client';

interface ThemePerformance {
  theme: string;
  count: number;
  avgViews: number;
  avgLikes: number;
  avgComments: number;
  avgShares: number;
  avgEngagementScore: number;
  contentIds: string[];
}

interface TonePerformance {
  tone: string;
  count: number;
  avgViews: number;
  avgLikes: number;
  avgComments: number;
  avgShares: number;
  avgEngagementScore: number;
}

interface ArchetypePerformance {
  archetype: string;
  count: number;
  avgViews: number;
  avgLikes: number;
  avgComments: number;
  avgShares: number;
  avgEngagementScore: number;
}

export default async function insightRoutes(fastify: FastifyInstance) {
  // Get top performing themes
  fastify.get('/themes', async (request, reply) => {
    const { communityId, limit = '10' } = request.query as any;

    // Get all content with analysis and engagement
    const whereClause: Prisma.NarrativeContentWhereInput = {};
    if (communityId) {
      whereClause.communityId = communityId;
    }

    const content = await fastify.prisma.narrativeContent.findMany({
      where: whereClause,
      include: {
        analysis: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        engagement: {
          orderBy: { recordedAt: 'desc' },
          take: 1,
        },
      },
    });

    // Aggregate by theme
    const themeMap = new Map<string, {
      views: number[];
      likes: number[];
      comments: number[];
      shares: number[];
      contentIds: string[];
    }>();

    for (const item of content) {
      const analysis = item.analysis[0];
      const engagement = item.engagement[0];

      if (!analysis || !engagement) continue;

      const themes = analysis.themesJson as string[];
      for (const theme of themes) {
        if (!themeMap.has(theme)) {
          themeMap.set(theme, {
            views: [],
            likes: [],
            comments: [],
            shares: [],
            contentIds: [],
          });
        }

        const data = themeMap.get(theme)!;
        data.views.push(engagement.views);
        data.likes.push(engagement.likes);
        data.comments.push(engagement.comments);
        data.shares.push(engagement.shares);
        data.contentIds.push(item.id);
      }
    }

    // Calculate averages and engagement score
    const themePerformance: ThemePerformance[] = Array.from(themeMap.entries())
      .map(([theme, data]) => {
        const count = data.views.length;
        const avgViews = data.views.reduce((a, b) => a + b, 0) / count;
        const avgLikes = data.likes.reduce((a, b) => a + b, 0) / count;
        const avgComments = data.comments.reduce((a, b) => a + b, 0) / count;
        const avgShares = data.shares.reduce((a, b) => a + b, 0) / count;

        // Engagement score: weighted combination of metrics
        const avgEngagementScore =
          avgViews * 1 +
          avgLikes * 5 +
          avgComments * 10 +
          avgShares * 15;

        return {
          theme,
          count,
          avgViews: Math.round(avgViews),
          avgLikes: Math.round(avgLikes),
          avgComments: Math.round(avgComments),
          avgShares: Math.round(avgShares),
          avgEngagementScore: Math.round(avgEngagementScore),
          contentIds: data.contentIds,
        };
      })
      .sort((a, b) => b.avgEngagementScore - a.avgEngagementScore)
      .slice(0, parseInt(limit, 10));

    return { themes: themePerformance };
  });

  // Get top performing tones
  fastify.get('/tones', async (request, reply) => {
    const { communityId, limit = '10' } = request.query as any;

    const whereClause: Prisma.NarrativeContentWhereInput = {};
    if (communityId) {
      whereClause.communityId = communityId;
    }

    const content = await fastify.prisma.narrativeContent.findMany({
      where: whereClause,
      include: {
        analysis: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        engagement: {
          orderBy: { recordedAt: 'desc' },
          take: 1,
        },
      },
    });

    const toneMap = new Map<string, {
      views: number[];
      likes: number[];
      comments: number[];
      shares: number[];
    }>();

    for (const item of content) {
      const analysis = item.analysis[0];
      const engagement = item.engagement[0];

      if (!analysis || !engagement) continue;

      const tones = analysis.toneLabelsJson as string[];
      for (const tone of tones) {
        if (!toneMap.has(tone)) {
          toneMap.set(tone, {
            views: [],
            likes: [],
            comments: [],
            shares: [],
          });
        }

        const data = toneMap.get(tone)!;
        data.views.push(engagement.views);
        data.likes.push(engagement.likes);
        data.comments.push(engagement.comments);
        data.shares.push(engagement.shares);
      }
    }

    const tonePerformance: TonePerformance[] = Array.from(toneMap.entries())
      .map(([tone, data]) => {
        const count = data.views.length;
        const avgViews = data.views.reduce((a, b) => a + b, 0) / count;
        const avgLikes = data.likes.reduce((a, b) => a + b, 0) / count;
        const avgComments = data.comments.reduce((a, b) => a + b, 0) / count;
        const avgShares = data.shares.reduce((a, b) => a + b, 0) / count;

        const avgEngagementScore =
          avgViews * 1 +
          avgLikes * 5 +
          avgComments * 10 +
          avgShares * 15;

        return {
          tone,
          count,
          avgViews: Math.round(avgViews),
          avgLikes: Math.round(avgLikes),
          avgComments: Math.round(avgComments),
          avgShares: Math.round(avgShares),
          avgEngagementScore: Math.round(avgEngagementScore),
        };
      })
      .sort((a, b) => b.avgEngagementScore - a.avgEngagementScore)
      .slice(0, parseInt(limit, 10));

    return { tones: tonePerformance };
  });

  // Get top performing archetypes
  fastify.get('/archetypes', async (request, reply) => {
    const { communityId, limit = '10' } = request.query as any;

    const whereClause: Prisma.NarrativeContentWhereInput = {};
    if (communityId) {
      whereClause.communityId = communityId;
    }

    const content = await fastify.prisma.narrativeContent.findMany({
      where: whereClause,
      include: {
        analysis: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        engagement: {
          orderBy: { recordedAt: 'desc' },
          take: 1,
        },
      },
    });

    const archetypeMap = new Map<string, {
      views: number[];
      likes: number[];
      comments: number[];
      shares: number[];
    }>();

    for (const item of content) {
      const analysis = item.analysis[0];
      const engagement = item.engagement[0];

      if (!analysis || !engagement) continue;

      const archetypes = analysis.archetypeLabelsJson as string[];
      for (const archetype of archetypes) {
        if (!archetypeMap.has(archetype)) {
          archetypeMap.set(archetype, {
            views: [],
            likes: [],
            comments: [],
            shares: [],
          });
        }

        const data = archetypeMap.get(archetype)!;
        data.views.push(engagement.views);
        data.likes.push(engagement.likes);
        data.comments.push(engagement.comments);
        data.shares.push(engagement.shares);
      }
    }

    const archetypePerformance: ArchetypePerformance[] = Array.from(archetypeMap.entries())
      .map(([archetype, data]) => {
        const count = data.views.length;
        const avgViews = data.views.reduce((a, b) => a + b, 0) / count;
        const avgLikes = data.likes.reduce((a, b) => a + b, 0) / count;
        const avgComments = data.comments.reduce((a, b) => a + b, 0) / count;
        const avgShares = data.shares.reduce((a, b) => a + b, 0) / count;

        const avgEngagementScore =
          avgViews * 1 +
          avgLikes * 5 +
          avgComments * 10 +
          avgShares * 15;

        return {
          archetype,
          count,
          avgViews: Math.round(avgViews),
          avgLikes: Math.round(avgLikes),
          avgComments: Math.round(avgComments),
          avgShares: Math.round(avgShares),
          avgEngagementScore: Math.round(avgEngagementScore),
        };
      })
      .sort((a, b) => b.avgEngagementScore - a.avgEngagementScore)
      .slice(0, parseInt(limit, 10));

    return { archetypes: archetypePerformance };
  });

  // Get overall dashboard stats
  fastify.get('/dashboard', async (request, reply) => {
    const { communityId } = request.query as any;

    const whereClause: Prisma.NarrativeContentWhereInput = {};
    if (communityId) {
      whereClause.communityId = communityId;
    }

    const totalContent = await fastify.prisma.narrativeContent.count({ where: whereClause });
    const totalAnalyses = await fastify.prisma.narrativeAnalysis.count({
      where: communityId ? { content: { communityId } } : {},
    });

    // Get content with latest engagement
    const contentWithEngagement = await fastify.prisma.narrativeContent.findMany({
      where: whereClause,
      include: {
        engagement: {
          orderBy: { recordedAt: 'desc' },
          take: 1,
        },
      },
    });

    const totalEngagement = contentWithEngagement.reduce(
      (acc, item) => {
        const engagement = item.engagement[0];
        if (!engagement) return acc;

        return {
          views: acc.views + engagement.views,
          likes: acc.likes + engagement.likes,
          comments: acc.comments + engagement.comments,
          shares: acc.shares + engagement.shares,
        };
      },
      { views: 0, likes: 0, comments: 0, shares: 0 }
    );

    return {
      stats: {
        totalContent,
        totalAnalyses,
        totalEngagement,
        avgEngagementPerContent: totalContent > 0 ? {
          views: Math.round(totalEngagement.views / totalContent),
          likes: Math.round(totalEngagement.likes / totalContent),
          comments: Math.round(totalEngagement.comments / totalContent),
          shares: Math.round(totalEngagement.shares / totalContent),
        } : null,
      },
    };
  });
}

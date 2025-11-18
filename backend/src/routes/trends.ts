import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { TrendGranularity } from '@prisma/client';

const GenerateTrendsSchema = z.object({
  communityId: z.string(),
  granularity: z.enum(['hourly', 'daily', 'weekly', 'monthly']),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
});

export default async function trendRoutes(fastify: FastifyInstance) {
  // Generate trends for a time period
  fastify.post('/generate', async (request, reply) => {
    const { communityId, granularity, startDate, endDate } = GenerateTrendsSchema.parse(
      request.body
    );

    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();

    // Get all content in the time range with analysis and engagement
    const content = await fastify.prisma.narrativeContent.findMany({
      where: {
        communityId,
        ts: {
          gte: start,
          lte: end,
        },
      },
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

    // Group by theme and time period
    const themeStats: Map<
      string,
      {
        contentCount: number;
        totalViews: number;
        totalLikes: number;
        totalComments: number;
        totalShares: number;
      }
    > = new Map();

    for (const item of content) {
      const analysis = item.analysis[0];
      const engagement = item.engagement[0];

      if (!analysis || !engagement) continue;

      const themes = analysis.themesJson as string[];
      for (const theme of themes) {
        const stats = themeStats.get(theme) || {
          contentCount: 0,
          totalViews: 0,
          totalLikes: 0,
          totalComments: 0,
          totalShares: 0,
        };

        stats.contentCount++;
        stats.totalViews += engagement.views;
        stats.totalLikes += engagement.likes;
        stats.totalComments += engagement.comments;
        stats.totalShares += engagement.shares;

        themeStats.set(theme, stats);
      }
    }

    // Create trend records
    const trends = [];
    for (const [theme, stats] of themeStats.entries()) {
      const avgEngagementScore =
        stats.totalViews * 1 +
        stats.totalLikes * 5 +
        stats.totalComments * 10 +
        stats.totalShares * 15;

      const trend = await fastify.prisma.narrativeTrend.upsert({
        where: {
          communityId_theme_periodStart_granularity: {
            communityId,
            theme,
            periodStart: start,
            granularity: granularity as TrendGranularity,
          },
        },
        create: {
          communityId,
          theme,
          periodStart: start,
          periodEnd: end,
          granularity: granularity as TrendGranularity,
          ...stats,
          avgEngagementScore,
        },
        update: {
          ...stats,
          avgEngagementScore,
          periodEnd: end,
        },
      });

      trends.push(trend);
    }

    return { trends, count: trends.length };
  });

  // Get trends
  fastify.get('/', async (request, reply) => {
    const {
      communityId,
      theme,
      granularity,
      startDate,
      endDate,
      limit = '50',
      offset = '0',
    } = request.query as any;

    const where: any = {};
    if (communityId) where.communityId = communityId;
    if (theme) where.theme = theme;
    if (granularity) where.granularity = granularity;
    if (startDate || endDate) {
      where.periodStart = {};
      if (startDate) where.periodStart.gte = new Date(startDate);
      if (endDate) where.periodStart.lte = new Date(endDate);
    }

    const [trends, total] = await Promise.all([
      fastify.prisma.narrativeTrend.findMany({
        where,
        orderBy: [{ periodStart: 'desc' }, { avgEngagementScore: 'desc' }],
        take: parseInt(limit, 10),
        skip: parseInt(offset, 10),
      }),
      fastify.prisma.narrativeTrend.count({ where }),
    ]);

    return { trends, total, limit: parseInt(limit, 10), offset: parseInt(offset, 10) };
  });

  // Get theme trend history (time series)
  fastify.get('/theme/:theme', async (request, reply) => {
    const { theme } = request.params as { theme: string };
    const { communityId, granularity = 'daily', limit = '30' } = request.query as any;

    const where: any = { theme };
    if (communityId) where.communityId = communityId;
    if (granularity) where.granularity = granularity;

    const trends = await fastify.prisma.narrativeTrend.findMany({
      where,
      orderBy: { periodStart: 'desc' },
      take: parseInt(limit, 10),
    });

    // Calculate growth rate
    const growth =
      trends.length >= 2
        ? ((trends[0].avgEngagementScore - trends[1].avgEngagementScore) /
            trends[1].avgEngagementScore) *
          100
        : 0;

    return {
      theme,
      trends: trends.reverse(), // Return in chronological order
      growth: Math.round(growth * 100) / 100,
    };
  });

  // Get trending themes (currently rising)
  fastify.get('/trending', async (request, reply) => {
    const { communityId, granularity = 'daily', limit = '10' } = request.query as any;

    // Get recent trends
    const recentPeriod = new Date();
    if (granularity === 'daily') {
      recentPeriod.setDate(recentPeriod.getDate() - 7);
    } else if (granularity === 'weekly') {
      recentPeriod.setDate(recentPeriod.getDate() - 30);
    } else if (granularity === 'monthly') {
      recentPeriod.setDate(recentPeriod.getDate() - 90);
    }

    const where: any = {
      granularity,
      periodStart: { gte: recentPeriod },
    };
    if (communityId) where.communityId = communityId;

    const trends = await fastify.prisma.narrativeTrend.findMany({
      where,
      orderBy: { periodStart: 'desc' },
    });

    // Calculate growth for each theme
    const themeGrowth: Map<
      string,
      {
        current: number;
        previous: number;
        growth: number;
        contentCount: number;
      }
    > = new Map();

    const themes = [...new Set(trends.map((t) => t.theme))];

    for (const theme of themes) {
      const themeTrends = trends.filter((t) => t.theme === theme).sort((a, b) => b.periodStart.getTime() - a.periodStart.getTime());

      if (themeTrends.length >= 2) {
        const current = themeTrends[0];
        const previous = themeTrends[1];
        const growth = ((current.avgEngagementScore - previous.avgEngagementScore) / previous.avgEngagementScore) * 100;

        themeGrowth.set(theme, {
          current: current.avgEngagementScore,
          previous: previous.avgEngagementScore,
          growth,
          contentCount: current.contentCount,
        });
      }
    }

    // Sort by growth rate
    const trending = Array.from(themeGrowth.entries())
      .map(([theme, stats]) => ({ theme, ...stats }))
      .filter((t) => t.growth > 0)
      .sort((a, b) => b.growth - a.growth)
      .slice(0, parseInt(limit, 10));

    return { trending };
  });
}

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { RecommendationType, RecommendationStatus } from '@prisma/client';
import { NotFoundError } from '../lib/errors';

const GenerateRecommendationsSchema = z.object({
  communityId: z.string(),
  minScore: z.number().min(0).max(1).optional().default(0.5),
});

const UpdateRecommendationStatusSchema = z.object({
  status: z.enum(['active', 'dismissed', 'applied', 'expired']),
});

export default async function recommendationRoutes(fastify: FastifyInstance) {
  // Generate AI recommendations
  fastify.post('/generate', async (request, reply) => {
    const { communityId, minScore } = GenerateRecommendationsSchema.parse(request.body);

    // Get recent content and performance data
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 30);

    const content = await fastify.prisma.narrativeContent.findMany({
      where: {
        communityId,
        ts: { gte: recentDate },
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

    const recommendations = [];

    // Analyze theme performance
    const themePerformance: Map<string, number[]> = new Map();
    const toneUsage: Map<string, number> = new Map();

    for (const item of content) {
      const analysis = item.analysis[0];
      const engagement = item.engagement[0];

      if (!analysis || !engagement) continue;

      const score =
        engagement.views * 1 +
        engagement.likes * 5 +
        engagement.comments * 10 +
        engagement.shares * 15;

      // Track theme performance
      const themes = analysis.themesJson as string[];
      for (const theme of themes) {
        const scores = themePerformance.get(theme) || [];
        scores.push(score);
        themePerformance.set(theme, scores);
      }

      // Track tone usage
      const tones = analysis.toneLabelsJson as string[];
      for (const tone of tones) {
        toneUsage.set(tone, (toneUsage.get(tone) || 0) + 1);
      }
    }

    // Recommendation 1: Explore underused high-performing themes
    const avgPerformance: [string, number][] = Array.from(themePerformance.entries())
      .map(([theme, scores]) => {
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        return [theme, avg] as [string, number];
      })
      .sort((a, b) => b[1] - a[1]);

    if (avgPerformance.length > 0) {
      const topThemes = avgPerformance.slice(0, 3);
      const usageCount = themePerformance.get(topThemes[0][0])?.length || 0;

      if (usageCount < 5) {
        recommendations.push(
          await fastify.prisma.narrativeRecommendation.create({
            data: {
              communityId,
              type: 'theme_exploration' as RecommendationType,
              title: `Explore "${topThemes[0][0]}" theme more`,
              description: `The theme "${topThemes[0][0]}" has shown strong engagement (avg score: ${Math.round(topThemes[0][1])}) but is underutilized. Consider creating more content around this theme.`,
              score: Math.min(0.9, topThemes[0][1] / 5000),
              basedOnContentIds: content.slice(0, 5).map((c) => c.id),
              suggestedThemes: topThemes.map(([theme]) => theme),
              suggestedTones: [],
            },
          })
        );
      }
    }

    // Recommendation 2: Try different tones
    const leastUsedTones = ['conversational', 'analytical', 'inspirational', 'urgent'].filter(
      (tone) => !toneUsage.has(tone) || (toneUsage.get(tone) || 0) < 2
    );

    if (leastUsedTones.length > 0) {
      recommendations.push(
        await fastify.prisma.narrativeRecommendation.create({
          data: {
            communityId,
            type: 'tone_adjustment' as RecommendationType,
            title: `Experiment with ${leastUsedTones[0]} tone`,
            description: `You haven't tried the "${leastUsedTones[0]}" tone much. Experimenting with different tones can help you discover what resonates best with your audience.`,
            score: 0.7,
            basedOnContentIds: [],
            suggestedThemes: [],
            suggestedTones: leastUsedTones,
          },
        })
      );
    }

    // Recommendation 3: Content format diversity
    const sourceTypes = new Set(content.map((c) => c.sourceType));
    const allTypes = ['post', 'newsletter', 'talk', 'article', 'video', 'podcast'];
    const unusedTypes = allTypes.filter((t) => !sourceTypes.has(t as any));

    if (unusedTypes.length > 0 && sourceTypes.size < 3) {
      recommendations.push(
        await fastify.prisma.narrativeRecommendation.create({
          data: {
            communityId,
            type: 'content_format' as RecommendationType,
            title: `Try ${unusedTypes[0]} format`,
            description: `Diversifying content formats can help reach different audience segments. Consider creating content in ${unusedTypes[0]} format.`,
            score: 0.6,
            basedOnContentIds: [],
            suggestedThemes: [],
            suggestedTones: [],
            metaJson: { suggestedFormats: unusedTypes },
          },
        })
      );
    }

    return { recommendations: recommendations.filter((r) => r.score >= minScore) };
  });

  // List recommendations
  fastify.get('/', async (request, reply) => {
    const { communityId, type, status, limit = '20', offset = '0' } = request.query as any;

    const where: any = {};
    if (communityId) where.communityId = communityId;
    if (type) where.type = type;
    if (status) where.status = status;
    else where.status = { not: 'expired' }; // Default: don't show expired

    const [recommendations, total] = await Promise.all([
      fastify.prisma.narrativeRecommendation.findMany({
        where,
        orderBy: [{ score: 'desc' }, { createdAt: 'desc' }],
        take: parseInt(limit, 10),
        skip: parseInt(offset, 10),
      }),
      fastify.prisma.narrativeRecommendation.count({ where }),
    ]);

    return { recommendations, total, limit: parseInt(limit, 10), offset: parseInt(offset, 10) };
  });

  // Get single recommendation
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const recommendation = await fastify.prisma.narrativeRecommendation.findUnique({
      where: { id },
    });

    if (!recommendation) {
      throw new NotFoundError('Recommendation', id);
    }

    return { recommendation };
  });

  // Update recommendation status
  fastify.patch('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { status } = UpdateRecommendationStatusSchema.parse(request.body);

    const updateData: any = { status };

    if (status === 'dismissed') {
      updateData.dismissedAt = new Date();
    } else if (status === 'applied') {
      updateData.appliedAt = new Date();
    }

    const recommendation = await fastify.prisma.narrativeRecommendation.update({
      where: { id },
      data: updateData,
    });

    return { recommendation };
  });

  // Delete recommendation
  fastify.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    await fastify.prisma.narrativeRecommendation.delete({
      where: { id },
    });

    return { success: true };
  });
}

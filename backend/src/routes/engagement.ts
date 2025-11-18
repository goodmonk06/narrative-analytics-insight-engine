import { FastifyInstance } from 'fastify';
import { z } from 'zod';

const CreateEngagementSchema = z.object({
  contentId: z.string(),
  views: z.number().int().min(0).default(0),
  likes: z.number().int().min(0).default(0),
  comments: z.number().int().min(0).default(0),
  shares: z.number().int().min(0).default(0),
  otherMetricsJson: z.record(z.any()).optional(),
  recordedAt: z.string().datetime().optional(),
});

export default async function engagementRoutes(fastify: FastifyInstance) {
  // Record engagement metrics
  fastify.post('/', async (request, reply) => {
    const data = CreateEngagementSchema.parse(request.body);

    // Verify content exists
    const content = await fastify.prisma.narrativeContent.findUnique({
      where: { id: data.contentId },
    });

    if (!content) {
      return reply.status(404).send({ error: 'Content not found' });
    }

    const engagement = await fastify.prisma.narrativeEngagement.create({
      data: {
        ...data,
        recordedAt: data.recordedAt ? new Date(data.recordedAt) : new Date(),
      },
    });

    return { engagement };
  });

  // Get engagement metrics for content
  fastify.get('/content/:contentId', async (request, reply) => {
    const { contentId } = request.params as { contentId: string };

    const metrics = await fastify.prisma.narrativeEngagement.findMany({
      where: { contentId },
      orderBy: { recordedAt: 'desc' },
    });

    // Calculate aggregate stats
    const aggregate = metrics.reduce(
      (acc, m) => ({
        totalViews: acc.totalViews + m.views,
        totalLikes: acc.totalLikes + m.likes,
        totalComments: acc.totalComments + m.comments,
        totalShares: acc.totalShares + m.shares,
        count: acc.count + 1,
      }),
      { totalViews: 0, totalLikes: 0, totalComments: 0, totalShares: 0, count: 0 }
    );

    return {
      metrics,
      aggregate: {
        ...aggregate,
        avgViews: aggregate.count > 0 ? aggregate.totalViews / aggregate.count : 0,
        avgLikes: aggregate.count > 0 ? aggregate.totalLikes / aggregate.count : 0,
        avgComments: aggregate.count > 0 ? aggregate.totalComments / aggregate.count : 0,
        avgShares: aggregate.count > 0 ? aggregate.totalShares / aggregate.count : 0,
      },
    };
  });

  // Update engagement metrics
  fastify.patch('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = CreateEngagementSchema.partial().parse(request.body);

    const engagement = await fastify.prisma.narrativeEngagement.update({
      where: { id },
      data: {
        ...data,
        recordedAt: data.recordedAt ? new Date(data.recordedAt) : undefined,
      },
    });

    return { engagement };
  });
}

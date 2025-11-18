import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { SourceType } from '@prisma/client';

const CreateContentSchema = z.object({
  communityId: z.string(),
  sourceType: z.enum(['post', 'newsletter', 'talk', 'other']),
  sourceRef: z.string().optional(),
  title: z.string(),
  bodyMarkdown: z.string(),
  ts: z.string().datetime().optional(),
  metaJson: z.record(z.any()).optional(),
});

const UpdateContentSchema = CreateContentSchema.partial();

export default async function contentRoutes(fastify: FastifyInstance) {
  // Create content
  fastify.post('/', async (request, reply) => {
    const data = CreateContentSchema.parse(request.body);

    const content = await fastify.prisma.narrativeContent.create({
      data: {
        ...data,
        ts: data.ts ? new Date(data.ts) : new Date(),
        sourceType: data.sourceType as SourceType,
      },
    });

    return { content };
  });

  // Get all content with filters
  fastify.get('/', async (request, reply) => {
    const { communityId, sourceType, limit = '50', offset = '0' } = request.query as any;

    const where: any = {};
    if (communityId) where.communityId = communityId;
    if (sourceType) where.sourceType = sourceType;

    const content = await fastify.prisma.narrativeContent.findMany({
      where,
      include: {
        analysis: true,
        engagement: {
          orderBy: { recordedAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { ts: 'desc' },
      take: parseInt(limit, 10),
      skip: parseInt(offset, 10),
    });

    const total = await fastify.prisma.narrativeContent.count({ where });

    return { content, total, limit: parseInt(limit, 10), offset: parseInt(offset, 10) };
  });

  // Get single content by ID
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const content = await fastify.prisma.narrativeContent.findUnique({
      where: { id },
      include: {
        analysis: true,
        engagement: {
          orderBy: { recordedAt: 'desc' },
        },
      },
    });

    if (!content) {
      return reply.status(404).send({ error: 'Content not found' });
    }

    return { content };
  });

  // Update content
  fastify.patch('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = UpdateContentSchema.parse(request.body);

    const content = await fastify.prisma.narrativeContent.update({
      where: { id },
      data: {
        ...data,
        ts: data.ts ? new Date(data.ts) : undefined,
        sourceType: data.sourceType as SourceType | undefined,
      },
    });

    return { content };
  });

  // Delete content
  fastify.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    await fastify.prisma.narrativeContent.delete({
      where: { id },
    });

    return { success: true };
  });
}

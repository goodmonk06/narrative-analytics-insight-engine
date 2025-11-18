import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { NotFoundError, ValidationError } from '../lib/errors';
import { metrics } from '../lib/metrics';

const CreateCollectionSchema = z.object({
  communityId: z.string(),
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  metaJson: z.record(z.any()).optional(),
});

const UpdateCollectionSchema = CreateCollectionSchema.partial().omit({ communityId: true });

const AddContentSchema = z.object({
  contentId: z.string(),
  order: z.number().int().min(0).optional(),
});

export default async function collectionRoutes(fastify: FastifyInstance) {
  // Create collection
  fastify.post('/', async (request, reply) => {
    const data = CreateCollectionSchema.parse(request.body);

    // Check if slug already exists for this community
    const existing = await fastify.prisma.narrativeCollection.findUnique({
      where: {
        communityId_slug: {
          communityId: data.communityId,
          slug: data.slug,
        },
      },
    });

    if (existing) {
      throw new ValidationError(`Collection with slug '${data.slug}' already exists`);
    }

    const collection = await fastify.prisma.narrativeCollection.create({
      data,
    });

    metrics.counter('collections_created', 1);

    return { collection };
  });

  // List collections
  fastify.get('/', async (request, reply) => {
    const { communityId, limit = '50', offset = '0' } = request.query as any;

    const where: any = {};
    if (communityId) where.communityId = communityId;

    const [collections, total] = await Promise.all([
      fastify.prisma.narrativeCollection.findMany({
        where,
        include: {
          _count: {
            select: { contents: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit, 10),
        skip: parseInt(offset, 10),
      }),
      fastify.prisma.narrativeCollection.count({ where }),
    ]);

    return { collections, total, limit: parseInt(limit, 10), offset: parseInt(offset, 10) };
  });

  // Get single collection with contents
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const collection = await fastify.prisma.narrativeCollection.findUnique({
      where: { id },
      include: {
        contents: {
          include: {
            content: {
              include: {
                analysis: {
                  orderBy: { createdAt: 'desc' },
                  take: 1,
                },
              },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!collection) {
      throw new NotFoundError('Collection', id);
    }

    return { collection };
  });

  // Update collection
  fastify.patch('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = UpdateCollectionSchema.parse(request.body);

    const collection = await fastify.prisma.narrativeCollection.update({
      where: { id },
      data,
    });

    return { collection };
  });

  // Delete collection
  fastify.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    await fastify.prisma.narrativeCollection.delete({
      where: { id },
    });

    metrics.counter('collections_deleted', 1);

    return { success: true };
  });

  // Add content to collection
  fastify.post('/:id/contents', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { contentId, order } = AddContentSchema.parse(request.body);

    // Verify collection exists
    const collection = await fastify.prisma.narrativeCollection.findUnique({
      where: { id },
    });

    if (!collection) {
      throw new NotFoundError('Collection', id);
    }

    // Verify content exists
    const content = await fastify.prisma.narrativeContent.findUnique({
      where: { id: contentId },
    });

    if (!content) {
      throw new NotFoundError('Content', contentId);
    }

    const collectionContent = await fastify.prisma.collectionContent.create({
      data: {
        collectionId: id,
        contentId,
        order: order ?? 0,
      },
      include: {
        content: true,
      },
    });

    return { collectionContent };
  });

  // Remove content from collection
  fastify.delete('/:id/contents/:contentId', async (request, reply) => {
    const { id, contentId } = request.params as { id: string; contentId: string };

    await fastify.prisma.collectionContent.deleteMany({
      where: {
        collectionId: id,
        contentId,
      },
    });

    return { success: true };
  });

  // Reorder contents in collection
  fastify.patch('/:id/reorder', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { contentIds } = request.body as { contentIds: string[] };

    // Update order for each content
    const updates = contentIds.map((contentId, index) =>
      fastify.prisma.collectionContent.updateMany({
        where: {
          collectionId: id,
          contentId,
        },
        data: {
          order: index,
        },
      })
    );

    await Promise.all(updates);

    return { success: true };
  });
}

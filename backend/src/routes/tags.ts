import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { NotFoundError, ValidationError } from '../lib/errors';
import { metrics } from '../lib/metrics';

const CreateTagSchema = z.object({
  communityId: z.string(),
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  category: z.string().optional(),
});

const UpdateTagSchema = CreateTagSchema.partial().omit({ communityId: true });

const TagContentSchema = z.object({
  contentId: z.string(),
});

export default async function tagRoutes(fastify: FastifyInstance) {
  // Create tag
  fastify.post('/', async (request, reply) => {
    const data = CreateTagSchema.parse(request.body);

    // Check if slug already exists for this community
    const existing = await fastify.prisma.tag.findUnique({
      where: {
        communityId_slug: {
          communityId: data.communityId,
          slug: data.slug,
        },
      },
    });

    if (existing) {
      throw new ValidationError(`Tag with slug '${data.slug}' already exists`);
    }

    const tag = await fastify.prisma.tag.create({
      data,
    });

    metrics.counter('tags_created', 1);

    return { tag };
  });

  // List tags
  fastify.get('/', async (request, reply) => {
    const { communityId, category, limit = '100', offset = '0' } = request.query as any;

    const where: any = {};
    if (communityId) where.communityId = communityId;
    if (category) where.category = category;

    const [tags, total] = await Promise.all([
      fastify.prisma.tag.findMany({
        where,
        include: {
          _count: {
            select: { contents: true },
          },
        },
        orderBy: { name: 'asc' },
        take: parseInt(limit, 10),
        skip: parseInt(offset, 10),
      }),
      fastify.prisma.tag.count({ where }),
    ]);

    return { tags, total, limit: parseInt(limit, 10), offset: parseInt(offset, 10) };
  });

  // Get single tag with contents
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const tag = await fastify.prisma.tag.findUnique({
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
        },
      },
    });

    if (!tag) {
      throw new NotFoundError('Tag', id);
    }

    return { tag };
  });

  // Update tag
  fastify.patch('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = UpdateTagSchema.parse(request.body);

    const tag = await fastify.prisma.tag.update({
      where: { id },
      data,
    });

    return { tag };
  });

  // Delete tag
  fastify.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    await fastify.prisma.tag.delete({
      where: { id },
    });

    metrics.counter('tags_deleted', 1);

    return { success: true };
  });

  // Tag content
  fastify.post('/:id/contents', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { contentId } = TagContentSchema.parse(request.body);

    // Verify tag exists
    const tag = await fastify.prisma.tag.findUnique({
      where: { id },
    });

    if (!tag) {
      throw new NotFoundError('Tag', id);
    }

    // Verify content exists
    const content = await fastify.prisma.narrativeContent.findUnique({
      where: { id: contentId },
    });

    if (!content) {
      throw new NotFoundError('Content', contentId);
    }

    // Create tag-content relationship (will fail if already exists due to unique constraint)
    try {
      const contentTag = await fastify.prisma.contentTag.create({
        data: {
          tagId: id,
          contentId,
        },
        include: {
          tag: true,
          content: true,
        },
      });

      return { contentTag };
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ValidationError('Content is already tagged with this tag');
      }
      throw error;
    }
  });

  // Untag content
  fastify.delete('/:id/contents/:contentId', async (request, reply) => {
    const { id, contentId } = request.params as { id: string; contentId: string };

    await fastify.prisma.contentTag.deleteMany({
      where: {
        tagId: id,
        contentId,
      },
    });

    return { success: true };
  });

  // Get popular tags (by content count)
  fastify.get('/popular', async (request, reply) => {
    const { communityId, limit = '20' } = request.query as any;

    const where: any = {};
    if (communityId) where.communityId = communityId;

    const tags = await fastify.prisma.tag.findMany({
      where,
      include: {
        _count: {
          select: { contents: true },
        },
      },
      orderBy: {
        contents: {
          _count: 'desc',
        },
      },
      take: parseInt(limit, 10),
    });

    return { tags };
  });
}

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { aiAnalyzer } from '../services/aiAnalyzer';

const CreateAnalysisSchema = z.object({
  contentId: z.string(),
  autoAnalyze: z.boolean().optional().default(true),
});

export default async function analysisRoutes(fastify: FastifyInstance) {
  // Create analysis for content
  fastify.post('/', async (request, reply) => {
    const { contentId, autoAnalyze } = CreateAnalysisSchema.parse(request.body);

    // Get the content
    const content = await fastify.prisma.narrativeContent.findUnique({
      where: { id: contentId },
    });

    if (!content) {
      return reply.status(404).send({ error: 'Content not found' });
    }

    // Run AI analysis
    const analysisResult = await aiAnalyzer.analyzeNarrative(
      content.title,
      content.bodyMarkdown
    );

    // Store analysis
    const analysis = await fastify.prisma.narrativeAnalysis.create({
      data: {
        contentId,
        themesJson: analysisResult.themes,
        toneLabelsJson: analysisResult.toneLabels,
        archetypeLabelsJson: analysisResult.archetypeLabels,
        summaryMarkdown: analysisResult.summary,
        aiModelInfoJson: aiAnalyzer.getModelInfo(),
      },
    });

    return { analysis };
  });

  // Batch analyze multiple content pieces
  fastify.post('/batch', async (request, reply) => {
    const { contentIds } = request.body as { contentIds: string[] };

    const results = [];
    for (const contentId of contentIds) {
      try {
        const content = await fastify.prisma.narrativeContent.findUnique({
          where: { id: contentId },
        });

        if (!content) {
          results.push({ contentId, error: 'Content not found' });
          continue;
        }

        const analysisResult = await aiAnalyzer.analyzeNarrative(
          content.title,
          content.bodyMarkdown
        );

        const analysis = await fastify.prisma.narrativeAnalysis.create({
          data: {
            contentId,
            themesJson: analysisResult.themes,
            toneLabelsJson: analysisResult.toneLabels,
            archetypeLabelsJson: analysisResult.archetypeLabels,
            summaryMarkdown: analysisResult.summary,
            aiModelInfoJson: aiAnalyzer.getModelInfo(),
          },
        });

        results.push({ contentId, analysis });
      } catch (error: any) {
        results.push({ contentId, error: error.message });
      }
    }

    return { results };
  });

  // Get analysis by content ID
  fastify.get('/content/:contentId', async (request, reply) => {
    const { contentId } = request.params as { contentId: string };

    const analyses = await fastify.prisma.narrativeAnalysis.findMany({
      where: { contentId },
      orderBy: { createdAt: 'desc' },
    });

    return { analyses };
  });

  // Get analysis by ID
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const analysis = await fastify.prisma.narrativeAnalysis.findUnique({
      where: { id },
      include: {
        content: true,
      },
    });

    if (!analysis) {
      return reply.status(404).send({ error: 'Analysis not found' });
    }

    return { analysis };
  });
}

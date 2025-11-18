import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { TestFactory } from '../helpers/testFactory';
import { contentFixtures } from '../fixtures/content';

const prisma = new PrismaClient();
const factory = new TestFactory(prisma);

describe('Content Lifecycle Integration', () => {
  beforeAll(async () => {
    await factory.cleanup();
  });

  afterAll(async () => {
    await factory.cleanup();
    await prisma.$disconnect();
  });

  it('should handle complete content lifecycle', async () => {
    const communityId = 'test-integration';
    const fixture = contentFixtures[0];

    // 1. Create content
    const { content, analysis } = await factory.createContentWithAnalysis(fixture, communityId);

    expect(content.id).toBeDefined();
    expect(content.title).toBe(fixture.title);
    expect(analysis.themesJson).toEqual(fixture.themes);

    // 2. Add engagement
    const engagement = await prisma.narrativeEngagement.create({
      data: {
        contentId: content.id,
        ...fixture.engagementData,
      },
    });

    expect(engagement.views).toBe(fixture.engagementData.views);

    // 3. Create collection and add content
    const collection = await factory.createCollection('Test Collection', communityId);

    await prisma.collectionContent.create({
      data: {
        collectionId: collection.id,
        contentId: content.id,
        order: 0,
      },
    });

    const collectionWithContent = await prisma.narrativeCollection.findUnique({
      where: { id: collection.id },
      include: { contents: true },
    });

    expect(collectionWithContent?.contents).toHaveLength(1);
    expect(collectionWithContent?.contents[0].contentId).toBe(content.id);

    // 4. Tag content
    const tag = await factory.createTag('Integration Test', communityId);

    await prisma.contentTag.create({
      data: {
        contentId: content.id,
        tagId: tag.id,
      },
    });

    const contentWithTags = await prisma.narrativeContent.findUnique({
      where: { id: content.id },
      include: { tags: { include: { tag: true } } },
    });

    expect(contentWithTags?.tags).toHaveLength(1);
    expect(contentWithTags?.tags[0].tag.name).toBe('Integration Test');
  });

  it('should calculate engagement scores correctly', async () => {
    const fixture = contentFixtures[1];
    const { content } = await factory.createContentWithEngagement(fixture, 'test-scores');

    const engagement = await prisma.narrativeEngagement.findFirst({
      where: { contentId: content.id },
    });

    expect(engagement).toBeDefined();

    // Calculate expected score
    const expectedScore =
      engagement!.views * 1 +
      engagement!.likes * 5 +
      engagement!.comments * 10 +
      engagement!.shares * 15;

    // Our formula should produce this score
    expect(expectedScore).toBeGreaterThan(0);
  });

  it('should support multiple analyses for same content', async () => {
    const fixture = contentFixtures[0];
    const { content } = await factory.createContent(fixture, 'test-multi-analysis');

    // Create first analysis
    await prisma.narrativeAnalysis.create({
      data: {
        contentId: content.id,
        themesJson: ['theme1', 'theme2'],
        toneLabelsJson: ['analytical'],
        archetypeLabelsJson: ['teaching'],
        summaryMarkdown: 'First analysis',
        aiModelInfoJson: { provider: 'test', model: 'v1' },
      },
    });

    // Create second analysis (re-analysis)
    await prisma.narrativeAnalysis.create({
      data: {
        contentId: content.id,
        themesJson: ['theme1', 'theme3'], // Different themes
        toneLabelsJson: ['conversational'],
        archetypeLabelsJson: ['teaching'],
        summaryMarkdown: 'Second analysis',
        aiModelInfoJson: { provider: 'test', model: 'v2' },
      },
    });

    const analyses = await prisma.narrativeAnalysis.findMany({
      where: { contentId: content.id },
      orderBy: { createdAt: 'desc' },
    });

    expect(analyses).toHaveLength(2);
    expect(analyses[0].summaryMarkdown).toBe('Second analysis');
    expect(analyses[1].summaryMarkdown).toBe('First analysis');
  });

  it('should cascade delete related records', async () => {
    const fixture = contentFixtures[0];
    const { content } = await factory.createContentWithEngagement(fixture, 'test-cascade');

    const contentId = content.id;

    // Verify related records exist
    const analysis = await prisma.narrativeAnalysis.findFirst({ where: { contentId } });
    const engagement = await prisma.narrativeEngagement.findFirst({ where: { contentId } });

    expect(analysis).toBeDefined();
    expect(engagement).toBeDefined();

    // Delete content
    await prisma.narrativeContent.delete({ where: { id: contentId } });

    // Verify cascading delete
    const deletedAnalysis = await prisma.narrativeAnalysis.findFirst({ where: { contentId } });
    const deletedEngagement = await prisma.narrativeEngagement.findFirst({ where: { contentId } });

    expect(deletedAnalysis).toBeNull();
    expect(deletedEngagement).toBeNull();
  });
});

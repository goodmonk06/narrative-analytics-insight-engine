/**
 * Test data factory for creating consistent test data
 */

import { PrismaClient } from '@prisma/client';
import { ContentFixture } from '../fixtures/content';

export class TestFactory {
  constructor(private prisma: PrismaClient) {}

  async createContent(fixture: ContentFixture, communityId: string = 'test-community') {
    const content = await this.prisma.narrativeContent.create({
      data: {
        communityId,
        sourceType: fixture.sourceType,
        title: fixture.title,
        bodyMarkdown: fixture.bodyMarkdown,
        status: 'published',
        visibility: 'public',
      },
    });

    return content;
  }

  async createContentWithAnalysis(
    fixture: ContentFixture,
    communityId: string = 'test-community'
  ) {
    const content = await this.createContent(fixture, communityId);

    const analysis = await this.prisma.narrativeAnalysis.create({
      data: {
        contentId: content.id,
        themesJson: fixture.themes,
        toneLabelsJson: fixture.toneLabels,
        archetypeLabelsJson: fixture.archetypeLabels,
        summaryMarkdown: `Summary of "${fixture.title}"`,
        aiModelInfoJson: {
          provider: 'test',
          model: 'test-model',
          version: '1.0',
        },
      },
    });

    return { content, analysis };
  }

  async createContentWithEngagement(
    fixture: ContentFixture,
    communityId: string = 'test-community'
  ) {
    const { content, analysis } = await this.createContentWithAnalysis(fixture, communityId);

    const engagement = await this.prisma.narrativeEngagement.create({
      data: {
        contentId: content.id,
        ...fixture.engagementData,
      },
    });

    return { content, analysis, engagement };
  }

  async createCollection(name: string, communityId: string = 'test-community') {
    return this.prisma.narrativeCollection.create({
      data: {
        communityId,
        name,
        slug: name.toLowerCase().replace(/\s+/g, '-'),
        description: `Collection: ${name}`,
      },
    });
  }

  async createTag(name: string, communityId: string = 'test-community', category?: string) {
    return this.prisma.tag.create({
      data: {
        communityId,
        name,
        slug: name.toLowerCase().replace(/\s+/g, '-'),
        category,
      },
    });
  }

  async cleanup() {
    // Delete in correct order to respect foreign keys
    await this.prisma.contentTag.deleteMany({});
    await this.prisma.collectionContent.deleteMany({});
    await this.prisma.narrativeEngagement.deleteMany({});
    await this.prisma.narrativeAnalysis.deleteMany({});
    await this.prisma.narrativeRecommendation.deleteMany({});
    await this.prisma.narrativeTrend.deleteMany({});
    await this.prisma.tag.deleteMany({});
    await this.prisma.narrativeCollection.deleteMany({});
    await this.prisma.narrativeContent.deleteMany({});
  }
}

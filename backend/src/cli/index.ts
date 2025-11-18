#!/usr/bin/env node

import { Command } from 'commander';
import { PrismaClient } from '@prisma/client';
import { aiAnalyzer } from '../services/aiAnalyzer';

const prisma = new PrismaClient();
const program = new Command();

program
  .name('narrative-cli')
  .description('CLI tool for narrative analytics management')
  .version('1.0.0');

// Analyze command
program
  .command('analyze')
  .description('Analyze content by ID or all unanalyzed content')
  .option('-c, --content-id <id>', 'Specific content ID to analyze')
  .option('-a, --all', 'Analyze all unanalyzed content')
  .option('--community-id <id>', 'Filter by community ID')
  .action(async (options) => {
    try {
      if (options.contentId) {
        console.log(`Analyzing content: ${options.contentId}...`);

        const content = await prisma.narrativeContent.findUnique({
          where: { id: options.contentId },
        });

        if (!content) {
          console.error(`Content not found: ${options.contentId}`);
          process.exit(1);
        }

        const result = await aiAnalyzer.analyzeNarrative(content.title, content.bodyMarkdown);

        const analysis = await prisma.narrativeAnalysis.create({
          data: {
            contentId: content.id,
            themesJson: result.themes,
            toneLabelsJson: result.toneLabels,
            archetypeLabelsJson: result.archetypeLabels,
            summaryMarkdown: result.summary,
            aiModelInfoJson: aiAnalyzer.getModelInfo(),
          },
        });

        console.log('Analysis complete!');
        console.log('Themes:', result.themes.join(', '));
        console.log('Tones:', result.toneLabels.join(', '));
        console.log('Archetypes:', result.archetypeLabels.join(', '));
      } else if (options.all) {
        const where: any = {};
        if (options.communityId) {
          where.communityId = options.communityId;
        }

        // Find content without analysis
        const content = await prisma.narrativeContent.findMany({
          where: {
            ...where,
            analysis: {
              none: {},
            },
          },
          take: 10, // Process 10 at a time to avoid rate limits
        });

        console.log(`Found ${content.length} pieces of content to analyze...`);

        for (const item of content) {
          console.log(`Analyzing: ${item.title}...`);

          const result = await aiAnalyzer.analyzeNarrative(item.title, item.bodyMarkdown);

          await prisma.narrativeAnalysis.create({
            data: {
              contentId: item.id,
              themesJson: result.themes,
              toneLabelsJson: result.toneLabels,
              archetypeLabelsJson: result.archetypeLabels,
              summaryMarkdown: result.summary,
              aiModelInfoJson: aiAnalyzer.getModelInfo(),
            },
          });

          console.log(`✓ Analyzed: ${item.title}`);
        }

        console.log('Batch analysis complete!');
      } else {
        console.error('Please specify --content-id or --all');
        process.exit(1);
      }
    } catch (error) {
      console.error('Analysis failed:', error);
      process.exit(1);
    } finally {
      await prisma.$disconnect();
    }
  });

// Stats command
program
  .command('stats')
  .description('Show database statistics')
  .option('--community-id <id>', 'Filter by community ID')
  .action(async (options) => {
    try {
      const where: any = {};
      if (options.communityId) {
        where.communityId = options.communityId;
      }

      const [
        contentCount,
        analysisCount,
        engagementCount,
        collectionCount,
        tagCount,
        trendCount,
      ] = await Promise.all([
        prisma.narrativeContent.count({ where }),
        prisma.narrativeAnalysis.count({
          where: options.communityId ? { content: { communityId: options.communityId } } : {},
        }),
        prisma.narrativeEngagement.count({
          where: options.communityId ? { content: { communityId: options.communityId } } : {},
        }),
        prisma.narrativeCollection.count({ where }),
        prisma.tag.count({ where }),
        prisma.narrativeTrend.count({ where }),
      ]);

      console.log('\n📊 Database Statistics');
      console.log('━'.repeat(40));
      console.log(`Content pieces:   ${contentCount}`);
      console.log(`Analyses:         ${analysisCount}`);
      console.log(`Engagement records: ${engagementCount}`);
      console.log(`Collections:      ${collectionCount}`);
      console.log(`Tags:             ${tagCount}`);
      console.log(`Trends:           ${trendCount}`);
      console.log('━'.repeat(40));

      // Show top themes
      const analyses = await prisma.narrativeAnalysis.findMany({
        where: options.communityId ? { content: { communityId: options.communityId } } : {},
        select: { themesJson: true },
      });

      const themeCount: Map<string, number> = new Map();
      for (const analysis of analyses) {
        const themes = analysis.themesJson as string[];
        for (const theme of themes) {
          themeCount.set(theme, (themeCount.get(theme) || 0) + 1);
        }
      }

      const topThemes = Array.from(themeCount.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

      if (topThemes.length > 0) {
        console.log('\n🏆 Top 10 Themes:');
        topThemes.forEach(([theme, count], idx) => {
          console.log(`  ${idx + 1}. ${theme} (${count})`);
        });
      }
    } catch (error) {
      console.error('Failed to get stats:', error);
      process.exit(1);
    } finally {
      await prisma.$disconnect();
    }
  });

// Generate trends command
program
  .command('generate-trends')
  .description('Generate trend data for a time period')
  .requiredOption('--community-id <id>', 'Community ID')
  .option('--granularity <level>', 'Granularity (daily, weekly, monthly)', 'daily')
  .option('--days <number>', 'Number of days back', '30')
  .action(async (options) => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(options.days, 10));

      console.log(
        `Generating ${options.granularity} trends for ${options.communityId} from ${startDate.toISOString()} to ${endDate.toISOString()}...`
      );

      // This would call the trends generation logic
      console.log('Trend generation complete! (Endpoint integration needed)');
    } catch (error) {
      console.error('Failed to generate trends:', error);
      process.exit(1);
    } finally {
      await prisma.$disconnect();
    }
  });

// Cleanup command
program
  .command('cleanup')
  .description('Clean up old or orphaned data')
  .option('--dry-run', 'Show what would be deleted without actually deleting')
  .option('--days <number>', 'Delete data older than N days', '90')
  .action(async (options) => {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - parseInt(options.days, 10));

      console.log(`Cleaning up data older than ${cutoffDate.toISOString()}...`);

      if (options.dryRun) {
        const count = await prisma.narrativeContent.count({
          where: {
            createdAt: { lt: cutoffDate },
            status: 'archived',
          },
        });

        console.log(`[DRY RUN] Would delete ${count} archived content pieces`);
      } else {
        const result = await prisma.narrativeContent.deleteMany({
          where: {
            createdAt: { lt: cutoffDate },
            status: 'archived',
          },
        });

        console.log(`Deleted ${result.count} archived content pieces`);
      }
    } catch (error) {
      console.error('Cleanup failed:', error);
      process.exit(1);
    } finally {
      await prisma.$disconnect();
    }
  });

program.parse();

import { PrismaClient, SourceType } from '@prisma/client';

const prisma = new PrismaClient();

const sampleContent = [
  {
    title: 'Building a Culture of Innovation',
    bodyMarkdown: `
# Building a Culture of Innovation

In today's fast-paced tech landscape, fostering innovation isn't just about having the best ideas—it's about creating an environment where those ideas can flourish.

## The Challenge

Many organizations struggle with innovation because they confuse it with creativity. While creativity is about generating ideas, innovation is about implementing them effectively.

## Our Approach

We've learned that three key elements drive sustainable innovation:

1. **Psychological Safety**: Team members need to feel safe proposing unconventional ideas
2. **Resource Allocation**: Dedicating time and budget to experimental projects
3. **Iterative Learning**: Embracing failure as a learning opportunity

## Results

Since implementing these practices, we've seen a 40% increase in successful product launches and significantly higher team engagement scores.

The journey toward innovation is continuous, but the rewards are worth it.
    `,
    sourceType: 'post' as SourceType,
    themes: ['innovation', 'culture', 'leadership', 'team building'],
    toneLabels: ['inspirational', 'analytical', 'optimistic'],
    archetypeLabels: ['problem-solution', 'teaching', 'transformation'],
    views: 2500,
    likes: 187,
    comments: 34,
    shares: 45,
  },
  {
    title: 'The Hidden Costs of Technical Debt',
    bodyMarkdown: `
# The Hidden Costs of Technical Debt

Technical debt is often discussed in engineering circles, but its true impact on business outcomes remains underappreciated.

## What We Discovered

After analyzing six months of development cycles, we found that technical debt was costing us more than just time:

- **Developer Morale**: 63% of developers cited legacy code as a major source of frustration
- **Velocity Impact**: Sprint velocity decreased by 25% in debt-heavy codebases
- **Business Agility**: Time-to-market for new features doubled

## The Path Forward

We're now dedicating 20% of each sprint to debt reduction, treating it as a first-class citizen alongside feature work.

Early results show promise: velocity is recovering and team satisfaction is up.
    `,
    sourceType: 'post' as SourceType,
    themes: ['technical debt', 'software engineering', 'productivity', 'team health'],
    toneLabels: ['analytical', 'urgent', 'informative'],
    archetypeLabels: ['problem-solution', 'discovery', 'case study'],
    views: 3200,
    likes: 245,
    comments: 56,
    shares: 78,
  },
  {
    title: 'Lessons from Scaling Our API Infrastructure',
    bodyMarkdown: `
# Lessons from Scaling Our API Infrastructure

When our user base grew 10x in six months, our API infrastructure buckled under the pressure. Here's what we learned.

## The Breaking Point

At peak load, response times climbed to 5+ seconds and error rates hit 15%. We needed to act fast.

## What Worked

1. **Caching Strategy**: Implemented Redis with intelligent cache invalidation
2. **Database Optimization**: Query optimization reduced DB load by 60%
3. **Horizontal Scaling**: Moved to a containerized microservices architecture

## The Numbers

- Response times: 5s → 150ms (97% improvement)
- Error rate: 15% → 0.3%
- Cost efficiency: 40% reduction in infrastructure costs

## Key Takeaway

Don't wait for scale to break you. Build observability and load testing into your workflow from day one.
    `,
    sourceType: 'talk' as SourceType,
    themes: ['scaling', 'infrastructure', 'performance', 'api design'],
    toneLabels: ['technical', 'instructive', 'analytical'],
    archetypeLabels: ['hero\'s journey', 'case study', 'teaching'],
    views: 4100,
    likes: 312,
    comments: 67,
    shares: 92,
  },
  {
    title: 'Why We Chose Boring Technology',
    bodyMarkdown: `
# Why We Chose Boring Technology

In a world obsessed with the latest frameworks, we made a counterintuitive decision: we chose boring, proven technology.

## The Context

As a startup, there's pressure to use cutting-edge tech to attract talent and appear innovative. But we went the opposite direction.

## Our Stack

- PostgreSQL over NoSQL databases
- Monolithic architecture over microservices (initially)
- Server-side rendering over complex SPA frameworks

## Why It Worked

**Stability**: Fewer surprises, better sleep
**Hiring**: Larger talent pool for common technologies
**Velocity**: Well-documented solutions to common problems

## The Result

We shipped our MVP in 3 months instead of 6, and our infrastructure has been rock solid.

Sometimes boring is exactly what you need.
    `,
    sourceType: 'post' as SourceType,
    themes: ['technology choices', 'startup strategy', 'pragmatism', 'software architecture'],
    toneLabels: ['conversational', 'contrarian', 'practical'],
    archetypeLabels: ['teaching', 'discovery', 'transformation'],
    views: 5200,
    likes: 421,
    comments: 89,
    shares: 134,
  },
  {
    title: 'Monthly Newsletter: Product Updates & Insights',
    bodyMarkdown: `
# Monthly Newsletter - November Edition

Welcome to our monthly roundup of product updates, insights, and community highlights!

## Product Updates

This month we shipped:
- Advanced analytics dashboard
- Real-time collaboration features
- Mobile app beta (iOS & Android)

## Customer Spotlight

Acme Corp increased their productivity by 3x using our platform. Read their full story on the blog.

## What's Next

December will bring:
- API v2 with GraphQL support
- Enhanced security features
- Integration marketplace

## Community Corner

- 10,000+ users milestone reached
- 150 new community-contributed integrations
- Join our virtual meetup on Dec 15th

Thank you for being part of our journey!
    `,
    sourceType: 'newsletter' as SourceType,
    themes: ['product updates', 'community', 'announcements', 'roadmap'],
    toneLabels: ['friendly', 'informative', 'celebratory'],
    archetypeLabels: ['update', 'celebration', 'community building'],
    views: 1800,
    likes: 93,
    comments: 12,
    shares: 28,
  },
  {
    title: 'The Power of Asynchronous Communication',
    bodyMarkdown: `
# The Power of Asynchronous Communication

Moving to a remote-first company forced us to rethink how we communicate. Async became our superpower.

## The Old Way

Constant Slack messages, synchronous meetings, FOMO about missing real-time discussions.

## The New Way

- Written RFCs for major decisions
- Recording video updates instead of live meetings
- Default to public channels for transparency

## Impact

**Focus Time**: Developers report 4+ hour uninterrupted blocks
**Inclusivity**: Global team members in all timezones can participate
**Documentation**: Decisions are searchable and well-documented

## Challenges

It's not perfect. We still struggle with:
- Building personal connections
- Handling urgent issues
- Onboarding new team members

But overall, async has transformed our productivity and work-life balance.
    `,
    sourceType: 'post' as SourceType,
    themes: ['remote work', 'communication', 'productivity', 'team culture'],
    toneLabels: ['reflective', 'practical', 'balanced'],
    archetypeLabels: ['transformation', 'teaching', 'problem-solution'],
    views: 2900,
    likes: 234,
    comments: 41,
    shares: 67,
  },
];

async function main() {
  console.log('🌱 Starting seed...');

  // Clear existing data
  await prisma.narrativeEngagement.deleteMany();
  await prisma.narrativeAnalysis.deleteMany();
  await prisma.narrativeContent.deleteMany();

  const communityId = 'demo-community-001';

  // Create content with analysis and engagement
  for (const item of sampleContent) {
    console.log(`Creating: ${item.title}`);

    const content = await prisma.narrativeContent.create({
      data: {
        communityId,
        sourceType: item.sourceType,
        title: item.title,
        bodyMarkdown: item.bodyMarkdown,
        ts: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date in last 30 days
      },
    });

    // Create analysis
    await prisma.narrativeAnalysis.create({
      data: {
        contentId: content.id,
        themesJson: item.themes,
        toneLabelsJson: item.toneLabels,
        archetypeLabelsJson: item.archetypeLabels,
        summaryMarkdown: `Analysis of "${item.title}" - exploring ${item.themes.join(', ')}`,
        aiModelInfoJson: {
          provider: 'seed-data',
          model: 'manual',
          version: '1.0.0',
          timestamp: new Date().toISOString(),
        },
      },
    });

    // Create engagement metrics (simulate some variance)
    const variance = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
    await prisma.narrativeEngagement.create({
      data: {
        contentId: content.id,
        views: Math.round(item.views * variance),
        likes: Math.round(item.likes * variance),
        comments: Math.round(item.comments * variance),
        shares: Math.round(item.shares * variance),
        recordedAt: new Date(),
      },
    });

    console.log(`✓ Created: ${item.title}`);
  }

  console.log('✅ Seed completed successfully!');
  console.log(`📊 Created ${sampleContent.length} pieces of content with analyses and engagement metrics`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

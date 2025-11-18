import { SourceType, ContentStatus, ContentVisibility } from '@prisma/client';

export interface ContentFixture {
  title: string;
  bodyMarkdown: string;
  sourceType: SourceType;
  themes: string[];
  toneLabels: string[];
  archetypeLabels: string[];
  engagementData: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
  };
}

export const contentFixtures: ContentFixture[] = [
  {
    title: 'The Future of Remote Work',
    bodyMarkdown: `# The Future of Remote Work

The pandemic fundamentally changed how we think about work. As we move forward, remote work isn't just a temporary solution—it's becoming the new normal.

## Key Trends

1. **Hybrid Models**: Companies are adopting flexible hybrid approaches
2. **Async Communication**: Teams are learning to work across time zones
3. **Digital Collaboration**: Tools are evolving to support remote creativity

## Challenges

- Maintaining company culture
- Preventing burnout
- Ensuring equitable opportunities

The future of work is distributed, flexible, and powered by technology that brings us together despite distance.`,
    sourceType: 'post',
    themes: ['remote work', 'future of work', 'technology', 'work culture'],
    toneLabels: ['analytical', 'forward-looking', 'balanced'],
    archetypeLabels: ['discovery', 'transformation'],
    engagementData: { views: 3200, likes: 245, comments: 56, shares: 78 },
  },
  {
    title: 'Building Resilient Teams',
    bodyMarkdown: `# Building Resilient Teams

In today's fast-paced environment, resilience isn't just nice to have—it's essential for team success.

## The Foundation

Resilient teams share common characteristics:
- **Psychological Safety**: Members feel safe to take risks
- **Clear Purpose**: Everyone understands the why
- **Adaptive Capacity**: Ability to pivot when needed

## Practical Steps

1. Regular check-ins and retrospectives
2. Celebrating small wins
3. Learning from failures

Building resilience is an ongoing journey, not a destination.`,
    sourceType: 'article',
    themes: ['team building', 'resilience', 'leadership', 'organizational culture'],
    toneLabels: ['inspirational', 'practical', 'supportive'],
    archetypeLabels: ['teaching', 'transformation', 'hero\'s journey'],
    engagementData: { views: 2800, likes: 201, comments: 42, shares: 65 },
  },
];

export function createContentFixture(overrides?: Partial<ContentFixture>): ContentFixture {
  const base: ContentFixture = {
    title: 'Test Content',
    bodyMarkdown: '# Test\n\nThis is test content.',
    sourceType: 'post',
    themes: ['test'],
    toneLabels: ['neutral'],
    archetypeLabels: ['other'],
    engagementData: { views: 100, likes: 10, comments: 2, shares: 1 },
  };

  return { ...base, ...overrides };
}

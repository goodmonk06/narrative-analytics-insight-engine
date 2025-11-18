import { describe, it, expect } from 'vitest';

// Mock data for testing insight calculations
const mockContent = [
  {
    id: '1',
    themes: ['innovation', 'culture'],
    views: 1000,
    likes: 50,
    comments: 10,
    shares: 5,
  },
  {
    id: '2',
    themes: ['innovation', 'technology'],
    views: 2000,
    likes: 100,
    comments: 20,
    shares: 10,
  },
  {
    id: '3',
    themes: ['culture', 'leadership'],
    views: 1500,
    likes: 75,
    comments: 15,
    shares: 8,
  },
];

function calculateThemePerformance(content: typeof mockContent) {
  const themeMap = new Map<string, {
    views: number[];
    likes: number[];
    comments: number[];
    shares: number[];
  }>();

  for (const item of content) {
    for (const theme of item.themes) {
      if (!themeMap.has(theme)) {
        themeMap.set(theme, { views: [], likes: [], comments: [], shares: [] });
      }

      const data = themeMap.get(theme)!;
      data.views.push(item.views);
      data.likes.push(item.likes);
      data.comments.push(item.comments);
      data.shares.push(item.shares);
    }
  }

  return Array.from(themeMap.entries()).map(([theme, data]) => {
    const count = data.views.length;
    const avgViews = data.views.reduce((a, b) => a + b, 0) / count;
    const avgLikes = data.likes.reduce((a, b) => a + b, 0) / count;
    const avgComments = data.comments.reduce((a, b) => a + b, 0) / count;
    const avgShares = data.shares.reduce((a, b) => a + b, 0) / count;

    const avgEngagementScore =
      avgViews * 1 + avgLikes * 5 + avgComments * 10 + avgShares * 15;

    return {
      theme,
      count,
      avgViews,
      avgLikes,
      avgComments,
      avgShares,
      avgEngagementScore,
    };
  });
}

describe('Insight Calculations', () => {
  it('should calculate theme performance correctly', () => {
    const performance = calculateThemePerformance(mockContent);

    // Should have 3 unique themes
    expect(performance).toHaveLength(3);

    // Find innovation theme
    const innovation = performance.find((p) => p.theme === 'innovation');
    expect(innovation).toBeDefined();
    expect(innovation?.count).toBe(2); // Appears in 2 pieces

    // Check average views for innovation (1000 + 2000) / 2 = 1500
    expect(innovation?.avgViews).toBe(1500);

    // Check engagement score calculation
    const expectedScore = 1500 * 1 + 75 * 5 + 15 * 10 + 7.5 * 15;
    expect(innovation?.avgEngagementScore).toBeCloseTo(expectedScore, 0);
  });

  it('should handle single occurrence themes', () => {
    const performance = calculateThemePerformance(mockContent);

    const technology = performance.find((p) => p.theme === 'technology');
    expect(technology?.count).toBe(1);
    expect(technology?.avgViews).toBe(2000);
  });

  it('should calculate engagement score with correct weights', () => {
    const testData = [{
      id: '1',
      themes: ['test'],
      views: 100,
      likes: 10,
      comments: 5,
      shares: 2,
    }];

    const performance = calculateThemePerformance(testData);
    const expectedScore = 100 * 1 + 10 * 5 + 5 * 10 + 2 * 15;

    expect(performance[0].avgEngagementScore).toBe(expectedScore);
    expect(performance[0].avgEngagementScore).toBe(230); // 100 + 50 + 50 + 30
  });
});

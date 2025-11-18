import { describe, it, expect, vi } from 'vitest';
import { AIAnalyzer } from '../services/aiAnalyzer';

// Mock OpenAI
vi.mock('openai', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: vi.fn().mockResolvedValue({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    themes: ['innovation', 'technology', 'culture'],
                    toneLabels: ['inspirational', 'analytical'],
                    archetypeLabels: ['transformation', 'teaching'],
                    summary: 'A narrative about innovation and cultural transformation in tech.',
                  }),
                },
              },
            ],
          }),
        },
      },
    })),
  };
});

describe('AIAnalyzer', () => {
  it('should analyze narrative and return structured results', async () => {
    // Set mock API key
    process.env.OPENAI_API_KEY = 'test-key';

    const analyzer = new AIAnalyzer();
    const result = await analyzer.analyzeNarrative(
      'Building Innovation Culture',
      'This is a test narrative about building an innovation culture in startups.'
    );

    expect(result).toHaveProperty('themes');
    expect(result).toHaveProperty('toneLabels');
    expect(result).toHaveProperty('archetypeLabels');
    expect(result).toHaveProperty('summary');

    expect(Array.isArray(result.themes)).toBe(true);
    expect(Array.isArray(result.toneLabels)).toBe(true);
    expect(Array.isArray(result.archetypeLabels)).toBe(true);
    expect(typeof result.summary).toBe('string');
  });

  it('should return model info', () => {
    process.env.OPENAI_API_KEY = 'test-key';
    const analyzer = new AIAnalyzer();
    const info = analyzer.getModelInfo();

    expect(info).toHaveProperty('provider');
    expect(info).toHaveProperty('model');
    expect(info).toHaveProperty('version');
    expect(info).toHaveProperty('timestamp');
  });
});

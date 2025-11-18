import OpenAI from 'openai';

export interface AnalysisResult {
  themes: string[];
  toneLabels: string[];
  archetypeLabels: string[];
  summary: string;
}

export class AIAnalyzer {
  private client: OpenAI;
  private model: string;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }

    this.client = new OpenAI({ apiKey });
    this.model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  }

  async analyzeNarrative(title: string, bodyMarkdown: string): Promise<AnalysisResult> {
    const prompt = `Analyze the following narrative content and provide a structured analysis:

Title: ${title}

Content:
${bodyMarkdown}

Please provide:
1. **Themes**: Key themes or topics discussed (3-5 main themes)
2. **Tone Labels**: Emotional tone of the content (e.g., inspirational, analytical, conversational, urgent, optimistic, critical)
3. **Archetype Labels**: Story archetypes present (e.g., hero's journey, problem-solution, transformation, discovery, teaching, case study)
4. **Summary**: A concise 2-3 sentence summary of the narrative

Respond in JSON format:
{
  "themes": ["theme1", "theme2", ...],
  "toneLabels": ["tone1", "tone2", ...],
  "archetypeLabels": ["archetype1", "archetype2", ...],
  "summary": "Summary text here"
}`;

    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert narrative analyst. Analyze content to identify themes, emotional tones, and story archetypes. Always respond with valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      const responseText = completion.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(responseText);

      return {
        themes: parsed.themes || [],
        toneLabels: parsed.toneLabels || [],
        archetypeLabels: parsed.archetypeLabels || [],
        summary: parsed.summary || '',
      };
    } catch (error) {
      console.error('AI Analysis Error:', error);
      throw new Error('Failed to analyze narrative with AI');
    }
  }

  getModelInfo(): Record<string, any> {
    return {
      provider: 'openai',
      model: this.model,
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };
  }
}

// Singleton instance
export const aiAnalyzer = new AIAnalyzer();

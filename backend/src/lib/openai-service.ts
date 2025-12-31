import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

/**
 * OpenAI Service - Centralized AI operations
 */
export class OpenAIService {
  private static instance: OpenAIService;
  private client: OpenAI;

  private constructor() {
    if (!process.env.OPENAI_API_KEY) {
      console.warn('⚠️  OPENAI_API_KEY not found in environment variables');
    }
    this.client = openai;
  }

  public static getInstance(): OpenAIService {
    if (!OpenAIService.instance) {
      OpenAIService.instance = new OpenAIService();
    }
    return OpenAIService.instance;
  }

  /**
   * Generate structured JSON response from OpenAI
   */
  async generateStructuredResponse<T>(
    prompt: string,
    systemPrompt: string = 'You are a helpful assistant that returns valid JSON.',
    model: string = 'gpt-4o-mini',
    maxTokens: number = 300 // Token limit to control costs
  ): Promise<T> {
    try {
      const response = await this.client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: maxTokens, // Limit response length
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      return JSON.parse(content) as T;
    } catch (error) {
      console.error('OpenAI API Error:', error);
      throw error;
    }
  }

  /**
   * Generate text response from OpenAI
   */
  async generateTextResponse(
    prompt: string,
    systemPrompt: string = 'You are a helpful assistant.',
    model: string = 'gpt-4o-mini'
  ): Promise<string> {
    try {
      const response = await this.client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      });

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('OpenAI API Error:', error);
      throw error;
    }
  }

  /**
   * Check if API key is configured
   */
  isConfigured(): boolean {
    return !!process.env.OPENAI_API_KEY;
  }
}

export default OpenAIService.getInstance();

/**
 * OpenAI Service - Centralized AI operations
 */
export declare class OpenAIService {
    private static instance;
    private client;
    private constructor();
    static getInstance(): OpenAIService;
    /**
     * Generate structured JSON response from OpenAI
     */
    generateStructuredResponse<T>(prompt: string, systemPrompt?: string, model?: string, maxTokens?: number): Promise<T>;
    /**
     * Generate text response from OpenAI
     */
    generateTextResponse(prompt: string, systemPrompt?: string, model?: string): Promise<string>;
    /**
     * Check if API key is configured
     */
    isConfigured(): boolean;
}
declare const _default: OpenAIService;
export default _default;
//# sourceMappingURL=openai-service.d.ts.map
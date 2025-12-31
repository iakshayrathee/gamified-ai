"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAIService = void 0;
const openai_1 = __importDefault(require("openai"));
// Initialize OpenAI client
const openai = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY || '',
});
/**
 * OpenAI Service - Centralized AI operations
 */
class OpenAIService {
    constructor() {
        if (!process.env.OPENAI_API_KEY) {
            console.warn('⚠️  OPENAI_API_KEY not found in environment variables');
        }
        this.client = openai;
    }
    static getInstance() {
        if (!OpenAIService.instance) {
            OpenAIService.instance = new OpenAIService();
        }
        return OpenAIService.instance;
    }
    /**
     * Generate structured JSON response from OpenAI
     */
    async generateStructuredResponse(prompt, systemPrompt = 'You are a helpful assistant that returns valid JSON.', model = 'gpt-4o-mini', maxTokens = 300 // Token limit to control costs
    ) {
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
            return JSON.parse(content);
        }
        catch (error) {
            console.error('OpenAI API Error:', error);
            throw error;
        }
    }
    /**
     * Generate text response from OpenAI
     */
    async generateTextResponse(prompt, systemPrompt = 'You are a helpful assistant.', model = 'gpt-4o-mini') {
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
        }
        catch (error) {
            console.error('OpenAI API Error:', error);
            throw error;
        }
    }
    /**
     * Check if API key is configured
     */
    isConfigured() {
        return !!process.env.OPENAI_API_KEY;
    }
}
exports.OpenAIService = OpenAIService;
exports.default = OpenAIService.getInstance();

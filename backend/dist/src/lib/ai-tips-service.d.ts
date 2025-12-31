/**
 * Token-Efficient AI Tips Service
 *
 * Provides behavioral insights and learning tips with minimal token usage
 * Uses a hybrid approach:
 * 1. Rule-based tips for common patterns (90% of cases)
 * 2. AI-generated tips only for complex patterns (10% of cases)
 * 3. Caching and batching to reduce API calls
 */
import { Attempt } from '@prisma/client';
export interface BehavioralTip {
    message: string;
    category: 'encouragement' | 'focus' | 'strategy' | 'practice' | 'assessment';
    priority: 'high' | 'medium' | 'low';
    source: 'rule' | 'ai';
}
export interface BehavioralPattern {
    responseSpeed: 'fast' | 'normal' | 'slow';
    accuracyTrend: 'improving' | 'stable' | 'declining';
    errorPattern: string | null;
    hintDependency: 'high' | 'medium' | 'low';
    sessionLength: number;
    focusLevel: 'high' | 'medium' | 'low';
}
export declare class AITipsService {
    /**
     * Generate behavioral tip with minimal token usage
     * Uses rule-based logic first, AI only when necessary
     */
    static generateBehavioralTip(childId: string, recentAttempts: Attempt[], forceAI?: boolean): Promise<BehavioralTip>;
    /**
     * Analyze behavioral pattern from attempts
     * Pure computation, no API calls
     */
    private static analyzeBehavioralPattern;
    /**
     * Get rule-based tip (no API calls, instant)
     * Covers 90% of common scenarios
     */
    private static getRuleBasedTip;
    /**
     * Get AI-generated tip (only for complex patterns)
     * Uses caching and minimal prompts to save tokens
     */
    private static getAITip;
    /**
     * Generate assessment summary (batched, called periodically)
     * Only called once per session, not per attempt
     */
    static generateSessionAssessment(childId: string, sessionAttempts: Attempt[]): Promise<string>;
    private static getCacheKey;
    private static getMostCommon;
    private static calculateStdDev;
}
export default AITipsService;
//# sourceMappingURL=ai-tips-service.d.ts.map
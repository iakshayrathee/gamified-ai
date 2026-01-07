import { Attempt, ErrorType } from '@prisma/client';
/**
 * Error Pattern Analyzer
 * Analyzes user responses to detect specific error patterns for LD screening
 */
export declare class ErrorPatternAnalyzer {
    /**
     * Analyze an attempt and determine the error type
     */
    static analyzeAttempt(correctAnswer: string, userResponse: string, context?: {
        sentence?: string;
        stage?: string;
    }): ErrorType;
    /**
     * Check if there's visual confusion between letters
     */
    private static hasVisualConfusion;
    /**
     * Detect specific confusion type
     */
    private static detectConfusionType;
    /**
     * Check if error is contextual (grammatically correct but semantically wrong)
     */
    private static isContextualError;
    /**
     * Check if spelling has letter reversal
     */
    private static isSpellingReversal;
    /**
     * Check if spelling has letter omission
     */
    private static isSpellingOmission;
    /**
     * Check for letter sequencing errors
     */
    private static hasLetterSequencingError;
    /**
     * Detect learning patterns from attempts
     */
    static detectLearningPattern(attempts: Attempt[]): 'improving' | 'stable' | 'declining' | 'random_guessing' | 'avoidance' | 'inconsistent';
    /**
     * Check if processing is slow
     */
    static hasSlowProcessing(attempts: Attempt[]): boolean;
}
/**
 * AI Analytics Service
 * Provides AI-driven insights and recommendations
 */
export declare class AIAnalyticsService {
    /**
     * Identify weak word clusters
     */
    static identifyWeakClusters(childId: string, skillId: string): Promise<any[]>;
    /**
     * Get recommendation based on pattern
     */
    private static getRecommendation;
    /**
     * Calculate readiness score (weighted average of all 5 stages)
     */
    static calculateReadinessScore(childId: string): Promise<number>;
    /**
     * Generate strength and struggling words
     */
    static generateWordLists(childId: string, skillId: string): Promise<{
        strengthWords: string[];
        strugglingWords: string[];
    }>;
    /**
     * Generate personalized insights
     */
    static generateInsights(childId: string, skillId: string): Promise<string[]>;
}
declare const _default: {
    ErrorPatternAnalyzer: typeof ErrorPatternAnalyzer;
    AIAnalyticsService: typeof AIAnalyticsService;
};
export default _default;
//# sourceMappingURL=error-pattern-analyzer.d.ts.map
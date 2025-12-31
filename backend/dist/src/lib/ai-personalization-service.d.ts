/**
 * AI Personalization Service
 *
 * Provides AI-powered analysis and personalized recommendations using OpenAI
 * - Analyzes answer patterns and learning trends
 * - Generates personalized insights and recommendations
 * - Identifies weak areas (phonics, CVC, sight words)
 * - Suggests teacher interventions
 * - Recommends next skills based on mastery and learning patterns
 */
import { Attempt } from '@prisma/client';
export interface AnswerPatternAnalysis {
    patterns: string[];
    recommendations: string[];
    teacherInterventions: string[];
    confusionAreas: string[];
}
export interface WeakAreaAnalysis {
    phonics: {
        score: number;
        issues: string[];
    };
    cvc: {
        score: number;
        issues: string[];
    };
    sightWords: {
        score: number;
        issues: string[];
    };
    recommendations: string[];
}
export interface NextSkillRecommendation {
    nextSkillId: string | null;
    nextSkillName: string | null;
    reason: string;
    confidence: number;
}
export interface PersonalizedInsights {
    masteryLevel: 'beginner' | 'developing' | 'proficient' | 'mastered';
    weakAreas: string[];
    strengths: string[];
    confusionPatterns: string[];
    recommendedFocus: string[];
    learningTrend: 'improving' | 'stable' | 'declining';
}
export declare class AIPersonalizationService {
    /**
     * Analyzes answer patterns using AI
     * Identifies trends, confusion patterns, and provides recommendations
     */
    static analyzeAnswerPatterns(childId: string, skillId: string, attempts: Attempt[]): Promise<AnswerPatternAnalysis>;
    /**
     * Generates personalized insights for a child's skill performance
     */
    static generatePersonalizedInsights(childId: string, skillId: string, attempts: Attempt[]): Promise<PersonalizedInsights>;
    /**
     * Recommends the next skill based on current performance and AI analysis
     */
    static recommendNextSkill(childId: string, currentSkillId: string, masteryData: {
        mastered: boolean;
        accuracy: number;
        avgTime: number;
    }): Promise<NextSkillRecommendation>;
    /**
     * Identifies weak areas across phonics, CVC, and sight words
     */
    static identifyWeakAreas(childId: string, attempts: Attempt[]): Promise<WeakAreaAnalysis>;
    /**
     * Detects learning trend from attempt history
     */
    private static detectLearningTrend;
    /**
     * Identifies specific confusion patterns
     */
    private static identifyConfusionPatterns;
    /**
     * Generates focus areas based on mastery level and weaknesses
     */
    private static generateFocusAreas;
    /**
     * Rule-based fallback for pattern analysis
     */
    private static ruleBasedPatternAnalysis;
}
export default AIPersonalizationService;
//# sourceMappingURL=ai-personalization-service.d.ts.map
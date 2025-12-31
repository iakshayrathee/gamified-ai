/**
 * Adaptive AI Engine for Literacy Learning Platform
 *
 * This engine provides rule-based adaptive learning capabilities:
 * - Dynamic difficulty adjustment based on performance
 * - Mastery detection using accuracy, time, and confusion metrics
 * - Skill recommendation using prerequisite graphs
 * - Weak area analysis and intervention suggestions
 * - Confusion pattern detection (b/d, p/q, m/n, u/n)
 */
import { MicroSkill, SkillDomain, ErrorType } from '@prisma/client';
export interface AttemptData {
    isCorrect: boolean;
    responseTimeSeconds: number;
    errorType: ErrorType;
    difficultyLevelAtAttempt: number;
    createdAt: Date;
}
export interface DifficultyAdjustmentResult {
    newLevel: 1 | 2 | 3;
    reason: string;
    shouldAdjust: boolean;
}
export interface MasteryCheckResult {
    mastered: boolean;
    metrics: {
        accuracy: number;
        avgResponseTime: number;
        confusionErrorRate: number;
    };
    conditions: {
        meetsAccuracyThreshold: boolean;
        meetsTimeThreshold: boolean;
        meetsConfusionThreshold: boolean;
    };
    reason: string;
}
export interface SkillRecommendation {
    nextSkill: MicroSkill | null;
    reason: string;
    action: 'continue' | 'review' | 'advance' | 'complete';
}
export interface WeakArea {
    domain: SkillDomain;
    accuracy: number;
    totalAttempts: number;
    recommendations: string[];
}
export interface MasteryCriteria {
    accuracyThreshold: number;
    timeThreshold: number;
    confusionErrorThreshold: number;
}
export interface RealTimeAnalysis {
    shouldAdjustDifficulty: boolean;
    newDifficulty: 1 | 2 | 3;
    reason: string;
    insights: string[];
    learningTrend: 'improving' | 'stable' | 'declining';
}
export declare class AdaptiveDifficultyEngine {
    /**
     * Adjusts difficulty level based on recent performance
     *
     * Level UP criteria:
     * - Accuracy ≥ 80% in last 5 attempts
     * - Average response time < 10 seconds
     * - No 2+ consecutive errors
     *
     * Level DOWN criteria:
     * - 3 consecutive errors OR
     * - Accuracy < 40% in last 5 attempts OR
     * - Confusion detected + slow response (>20s)
     */
    static adjustDifficulty(recentAttempts: AttemptData[], currentLevel: 1 | 2 | 3): DifficultyAdjustmentResult;
    /**
     * Checks if a skill has been mastered
     *
     * Mastery criteria:
     * - Accuracy ≥ 80% over last 10 attempts
     * - Average response time ≤ 4 seconds
     * - Confusion error rate < 20%
     */
    static checkMastery(last10Attempts: AttemptData[], criteria?: MasteryCriteria): MasteryCheckResult;
    /**
     * Recommends the next skill based on current progress
     * Uses prerequisite relationships to suggest appropriate next skill
     */
    static recommendNextSkill(currentSkill: MicroSkill & {
        nextSkills: string[];
    }, masteryStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'MASTERED', allSkills: MicroSkill[]): SkillRecommendation;
    /**
     * Analyzes weak areas across all domains
     * Groups attempts by domain and identifies areas needing improvement
     */
    static analyzeWeakAreas(attemptsByDomain: Map<string, AttemptData[]>, domains: SkillDomain[]): WeakArea[];
    /**
     * Detects confusion patterns in attempts
     * Looks for b/d, p/q, m/n, u/n confusion errors
     */
    static detectConfusionPattern(attempts: AttemptData[]): boolean;
    /**
     * Suggests intervention strategies for teachers
     * Based on domain and performance metrics
     */
    static suggestIntervention(domain: SkillDomain, accuracy: number): string;
    /**
     * Checks if there are N consecutive errors in attempts
     */
    private static hasConsecutiveErrors;
    /**
     * Analyzes attempt in real-time and provides immediate feedback
     * Called after each attempt to determine if difficulty should adjust
     */
    static analyzeAttemptInRealTime(recentAttempts: AttemptData[], currentDifficulty: 1 | 2 | 3): RealTimeAnalysis;
    /**
     * Gets adaptive difficulty for the next question
     * Based on last 5 attempts performance
     */
    static getAdaptiveDifficultyForNextQuestion(last5Attempts: AttemptData[], currentDifficulty: 1 | 2 | 3): 1 | 2 | 3;
    /**
     * Detects learning trend from attempt history
     */
    private static detectLearningTrend;
    /**
     * Generates domain-specific recommendations
     */
    private static generateDomainRecommendations;
}
/**
 * Calculates stars earned for an attempt
 * - 1 star for correct answer
 * - +0.5 bonus for fast response (< 3s)
 * - -0.2 penalty for hint usage
 */
export declare function calculateStars(isCorrect: boolean, responseTime: number, hintUsed: boolean): number;
/**
 * Converts stars to coins (1 star = 1 coin)
 */
export declare function starsToCoins(stars: number): number;
/**
 * Determines error type based on correct answer and user response
 */
export declare function classifyError(correctAnswer: string, userResponse: string): ErrorType;
//# sourceMappingURL=adaptive-engine.d.ts.map
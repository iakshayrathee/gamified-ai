/**
 * Token-Efficient AI Tips Service
 * 
 * Provides behavioral insights and learning tips with minimal token usage
 * Uses a hybrid approach:
 * 1. Rule-based tips for common patterns (90% of cases)
 * 2. AI-generated tips only for complex patterns (10% of cases)
 * 3. Caching and batching to reduce API calls
 */

import { PrismaClient, Attempt, ErrorType } from '@prisma/client';
import OpenAIService from './openai-service';

const prisma = new PrismaClient();
const openaiService = OpenAIService;

// Cache for AI-generated tips (in-memory, could be Redis in production)
const tipCache = new Map<string, { tip: string; timestamp: number }>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// ============================================
// TYPES
// ============================================

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

// ============================================
// TOKEN-EFFICIENT AI TIPS SERVICE
// ============================================

export class AITipsService {
    /**
     * Generate behavioral tip with minimal token usage
     * Uses rule-based logic first, AI only when necessary
     */
    static async generateBehavioralTip(
        childId: string,
        recentAttempts: Attempt[],
        forceAI: boolean = false
    ): Promise<BehavioralTip> {
        if (recentAttempts.length === 0) {
            return {
                message: "Great start! Let's learn something new today! 🌟",
                category: 'encouragement',
                priority: 'low',
                source: 'rule'
            };
        }

        // Analyze behavioral pattern
        const pattern = this.analyzeBehavioralPattern(recentAttempts);

        // Try rule-based tip first (90% of cases)
        if (!forceAI) {
            const ruleTip = this.getRuleBasedTip(pattern, recentAttempts);
            if (ruleTip) {
                return ruleTip;
            }
        }

        // Use AI only for complex patterns (10% of cases)
        return await this.getAITip(childId, pattern, recentAttempts);
    }

    /**
     * Analyze behavioral pattern from attempts
     * Pure computation, no API calls
     */
    private static analyzeBehavioralPattern(attempts: Attempt[]): BehavioralPattern {
        const avgResponseTime = attempts.reduce((sum, a) => sum + a.responseTimeSeconds, 0) / attempts.length;
        const accuracy = (attempts.filter(a => a.isCorrect).length / attempts.length) * 100;

        // Determine response speed
        let responseSpeed: 'fast' | 'normal' | 'slow' = 'normal';
        if (avgResponseTime < 2) responseSpeed = 'fast';
        else if (avgResponseTime > 6) responseSpeed = 'slow';

        // Determine accuracy trend
        let accuracyTrend: 'improving' | 'stable' | 'declining' = 'stable';
        if (attempts.length >= 6) {
            const firstHalf = attempts.slice(0, Math.floor(attempts.length / 2));
            const secondHalf = attempts.slice(Math.floor(attempts.length / 2));
            const firstAcc = (firstHalf.filter(a => a.isCorrect).length / firstHalf.length) * 100;
            const secondAcc = (secondHalf.filter(a => a.isCorrect).length / secondHalf.length) * 100;

            if (secondAcc - firstAcc > 15) accuracyTrend = 'improving';
            else if (secondAcc - firstAcc < -15) accuracyTrend = 'declining';
        }

        // Detect error patterns
        const errorTypes = attempts.filter(a => !a.isCorrect).map(a => a.errorType);
        const mostCommonError = this.getMostCommon(errorTypes);
        const errorPattern = mostCommonError !== ErrorType.NONE && mostCommonError !== ErrorType.OTHER
            ? mostCommonError
            : null;

        // Hint dependency
        const hintUsageRate = (attempts.filter(a => a.hintUsed).length / attempts.length) * 100;
        let hintDependency: 'high' | 'medium' | 'low' = 'low';
        if (hintUsageRate > 50) hintDependency = 'high';
        else if (hintUsageRate > 25) hintDependency = 'medium';

        // Focus level (based on response time consistency)
        const responseTimes = attempts.map(a => a.responseTimeSeconds);
        const stdDev = this.calculateStdDev(responseTimes);
        let focusLevel: 'high' | 'medium' | 'low' = 'medium';
        if (stdDev < 2) focusLevel = 'high';
        else if (stdDev > 4) focusLevel = 'low';

        return {
            responseSpeed,
            accuracyTrend,
            errorPattern,
            hintDependency,
            sessionLength: attempts.length,
            focusLevel
        };
    }

    /**
     * Get rule-based tip (no API calls, instant)
     * Covers 90% of common scenarios
     */
    private static getRuleBasedTip(pattern: BehavioralPattern, attempts: Attempt[]): BehavioralTip | null {
        const accuracy = (attempts.filter(a => a.isCorrect).length / attempts.length) * 100;

        // High accuracy + improving trend
        if (accuracy >= 80 && pattern.accuracyTrend === 'improving') {
            return {
                message: "Wow! You're getting better and better! Keep up the amazing work! 🌟",
                category: 'encouragement',
                priority: 'high',
                source: 'rule'
            };
        }

        // Fast but inaccurate (rushing)
        if (pattern.responseSpeed === 'fast' && accuracy < 60) {
            return {
                message: "Take your time! It's okay to think before answering. Accuracy is more important than speed! 🐢",
                category: 'strategy',
                priority: 'high',
                source: 'rule'
            };
        }

        // Slow but accurate (good strategy)
        if (pattern.responseSpeed === 'slow' && accuracy >= 75) {
            return {
                message: "Great thinking! You're taking your time and getting it right. That's smart! 🧠",
                category: 'encouragement',
                priority: 'medium',
                source: 'rule'
            };
        }

        // High hint dependency
        if (pattern.hintDependency === 'high') {
            return {
                message: "Try answering without hints first! You're smarter than you think! 💪",
                category: 'strategy',
                priority: 'high',
                source: 'rule'
            };
        }

        // Specific error pattern detected
        if (pattern.errorPattern) {
            const errorMessages: Record<string, string> = {
                'B_D_CONFUSION': "Watch out for 'b' and 'd' - they look similar but are different! Try tracing them with your finger. ✏️",
                'P_Q_CONFUSION': "Remember: 'p' points down, 'q' points up! Practice makes perfect! 📝",
                'M_N_CONFUSION': "'m' has 2 humps, 'n' has 1 hump! Count the humps! 🐫",
                'U_N_CONFUSION': "'u' is like a cup, 'n' is upside down! Visualize it! 🥤"
            };

            if (errorMessages[pattern.errorPattern]) {
                return {
                    message: errorMessages[pattern.errorPattern],
                    category: 'strategy',
                    priority: 'high',
                    source: 'rule'
                };
            }
        }

        // Declining trend
        if (pattern.accuracyTrend === 'declining') {
            return {
                message: "Let's take a short break and come back fresh! Sometimes our brain needs rest. 🌈",
                category: 'focus',
                priority: 'high',
                source: 'rule'
            };
        }

        // Low focus (inconsistent timing)
        if (pattern.focusLevel === 'low') {
            return {
                message: "Try to stay focused! Find a quiet spot and take deep breaths before each question. 🧘",
                category: 'focus',
                priority: 'medium',
                source: 'rule'
            };
        }

        // Long session
        if (pattern.sessionLength > 20) {
            return {
                message: "You've been working hard! Great job! Remember to take breaks. 🎉",
                category: 'assessment',
                priority: 'medium',
                source: 'rule'
            };
        }

        // Stable performance
        if (pattern.accuracyTrend === 'stable' && accuracy >= 70) {
            return {
                message: "You're doing consistently well! Ready to try harder questions? 🚀",
                category: 'encouragement',
                priority: 'low',
                source: 'rule'
            };
        }

        // Default: return null to trigger AI if needed
        return null;
    }

    /**
     * Get AI-generated tip (only for complex patterns)
     * Uses caching and minimal prompts to save tokens
     */
    private static async getAITip(
        childId: string,
        pattern: BehavioralPattern,
        attempts: Attempt[]
    ): Promise<BehavioralTip> {
        // Check cache first
        const cacheKey = this.getCacheKey(pattern);
        const cached = tipCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            return {
                message: cached.tip,
                category: 'assessment',
                priority: 'medium',
                source: 'ai'
            };
        }

        // Prepare minimal prompt (< 100 tokens)
        const accuracy = (attempts.filter(a => a.isCorrect).length / attempts.length) * 100;
        const prompt = `Child learning pattern:
- Accuracy: ${accuracy.toFixed(0)}%
- Speed: ${pattern.responseSpeed}
- Trend: ${pattern.accuracyTrend}
- Focus: ${pattern.focusLevel}
- Hints: ${pattern.hintDependency}

Give ONE short, encouraging tip (max 15 words) for a child. Be positive and actionable.`;

        try {
            // Use OpenAI with minimal tokens
            const response = await openaiService.generateTextResponse(
                prompt,
                'You are a supportive teacher. Be brief and encouraging.',
                'gpt-4o-mini' // Use cheaper model
            );

            const tip = response.trim().slice(0, 150); // Limit length

            // Cache the result
            tipCache.set(cacheKey, { tip, timestamp: Date.now() });

            return {
                message: tip,
                category: 'assessment',
                priority: 'medium',
                source: 'ai'
            };
        } catch (error) {
            console.error('AI tip generation error:', error);
            // Fallback to generic encouragement
            return {
                message: "You're doing great! Keep practicing and you'll get even better! 🌟",
                category: 'encouragement',
                priority: 'low',
                source: 'rule'
            };
        }
    }

    /**
     * Generate assessment summary (batched, called periodically)
     * Only called once per session, not per attempt
     */
    static async generateSessionAssessment(
        childId: string,
        sessionAttempts: Attempt[]
    ): Promise<string> {
        if (sessionAttempts.length < 5) {
            return "Great practice session! Keep it up!";
        }

        const pattern = this.analyzeBehavioralPattern(sessionAttempts);
        const accuracy = (sessionAttempts.filter(a => a.isCorrect).length / sessionAttempts.length) * 100;

        // Use concise prompt (< 150 tokens)
        const prompt = `Session summary:
- Questions: ${sessionAttempts.length}
- Accuracy: ${accuracy.toFixed(0)}%
- Trend: ${pattern.accuracyTrend}
- Focus: ${pattern.focusLevel}

Write 1 sentence assessment for teacher (max 20 words).`;

        try {
            const assessment = await openaiService.generateTextResponse(
                prompt,
                'You are an educator writing brief assessments.',
                'gpt-4o-mini'
            );

            return assessment.trim().slice(0, 200);
        } catch (error) {
            console.error('Assessment generation error:', error);
            return `Completed ${sessionAttempts.length} questions with ${accuracy.toFixed(0)}% accuracy. ${pattern.accuracyTrend} trend observed.`;
        }
    }

    // ============================================
    // HELPER METHODS
    // ============================================

    private static getCacheKey(pattern: BehavioralPattern): string {
        return `${pattern.responseSpeed}_${pattern.accuracyTrend}_${pattern.focusLevel}_${pattern.hintDependency}`;
    }

    private static getMostCommon<T>(arr: T[]): T | null {
        if (arr.length === 0) return null;
        const counts = new Map<T, number>();
        arr.forEach(item => counts.set(item, (counts.get(item) || 0) + 1));
        let max = 0;
        let mostCommon: T | null = null;
        counts.forEach((count, item) => {
            if (count > max) {
                max = count;
                mostCommon = item;
            }
        });
        return mostCommon;
    }

    private static calculateStdDev(numbers: number[]): number {
        const mean = numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
        const variance = numbers.reduce((sum, n) => sum + Math.pow(n - mean, 2), 0) / numbers.length;
        return Math.sqrt(variance);
    }
}

export default AITipsService;

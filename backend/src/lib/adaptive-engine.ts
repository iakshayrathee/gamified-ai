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

import { Attempt, MicroSkill, SkillDomain, ErrorType } from '@prisma/client';

// ============================================
// TYPES & INTERFACES
// ============================================

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

// ============================================
// ADAPTIVE DIFFICULTY ENGINE
// ============================================

export class AdaptiveDifficultyEngine {
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
    static adjustDifficulty(
        recentAttempts: AttemptData[],
        currentLevel: 1 | 2 | 3
    ): DifficultyAdjustmentResult {
        if (recentAttempts.length < 3) {
            return {
                newLevel: currentLevel,
                reason: 'Not enough attempts to adjust difficulty',
                shouldAdjust: false,
            };
        }

        // Analyze last 5 attempts (or all if less than 5)
        const analysisWindow = recentAttempts.slice(-5);
        const correctCount = analysisWindow.filter(a => a.isCorrect).length;
        const accuracy = (correctCount / analysisWindow.length) * 100;
        const avgTime = analysisWindow.reduce((sum, a) => sum + a.responseTimeSeconds, 0) / analysisWindow.length;

        // Check for consecutive errors
        const lastThree = recentAttempts.slice(-3);
        const threeConsecutiveErrors = lastThree.every(a => !a.isCorrect);

        // Check for confusion patterns
        const hasConfusion = this.detectConfusionPattern(analysisWindow);

        // LEVEL DOWN conditions
        if (threeConsecutiveErrors) {
            const newLevel = Math.max(1, currentLevel - 1) as 1 | 2 | 3;
            return {
                newLevel,
                reason: 'Three consecutive errors detected - reducing difficulty',
                shouldAdjust: currentLevel !== newLevel,
            };
        }

        if (accuracy < 40) {
            const newLevel = Math.max(1, currentLevel - 1) as 1 | 2 | 3;
            return {
                newLevel,
                reason: `Low accuracy (${accuracy.toFixed(0)}%) - reducing difficulty`,
                shouldAdjust: currentLevel !== newLevel,
            };
        }

        if (hasConfusion && avgTime > 20) {
            const newLevel = Math.max(1, currentLevel - 1) as 1 | 2 | 3;
            return {
                newLevel,
                reason: 'Confusion pattern detected with slow response - reducing difficulty',
                shouldAdjust: currentLevel !== newLevel,
            };
        }

        // LEVEL UP conditions
        if (accuracy >= 80 && avgTime < 10 && !this.hasConsecutiveErrors(recentAttempts.slice(-5), 2)) {
            const newLevel = Math.min(3, currentLevel + 1) as 1 | 2 | 3;
            return {
                newLevel,
                reason: `Strong performance (${accuracy.toFixed(0)}% accuracy, ${avgTime.toFixed(1)}s avg time) - increasing difficulty`,
                shouldAdjust: currentLevel !== newLevel,
            };
        }

        // No adjustment needed
        return {
            newLevel: currentLevel,
            reason: 'Performance is appropriate for current level',
            shouldAdjust: false,
        };
    }

    /**
     * Checks if a skill has been mastered
     * 
     * Mastery criteria:
     * - Accuracy ≥ 80% over last 10 attempts
     * - Average response time ≤ 4 seconds
     * - Confusion error rate < 20%
     */
    static checkMastery(
        last10Attempts: AttemptData[],
        criteria: MasteryCriteria = {
            accuracyThreshold: 80,
            timeThreshold: 4,
            confusionErrorThreshold: 20,
        }
    ): MasteryCheckResult {
        if (last10Attempts.length < 10) {
            return {
                mastered: false,
                metrics: {
                    accuracy: 0,
                    avgResponseTime: 0,
                    confusionErrorRate: 0,
                },
                conditions: {
                    meetsAccuracyThreshold: false,
                    meetsTimeThreshold: false,
                    meetsConfusionThreshold: false,
                },
                reason: `Need ${10 - last10Attempts.length} more attempts to check mastery`,
            };
        }

        // Calculate metrics
        const correctCount = last10Attempts.filter(a => a.isCorrect).length;
        const accuracy = (correctCount / last10Attempts.length) * 100;

        const avgResponseTime = last10Attempts.reduce((sum, a) => sum + a.responseTimeSeconds, 0) / last10Attempts.length;

        const confusionErrors = last10Attempts.filter(a =>
            a.errorType === ErrorType.B_D_CONFUSION ||
            a.errorType === ErrorType.P_Q_CONFUSION ||
            a.errorType === ErrorType.M_N_CONFUSION ||
            a.errorType === ErrorType.U_N_CONFUSION
        ).length;
        const confusionErrorRate = (confusionErrors / last10Attempts.length) * 100;

        // Check conditions
        const meetsAccuracyThreshold = accuracy >= criteria.accuracyThreshold;
        const meetsTimeThreshold = avgResponseTime <= criteria.timeThreshold;
        const meetsConfusionThreshold = confusionErrorRate < criteria.confusionErrorThreshold;

        const mastered = meetsAccuracyThreshold && meetsTimeThreshold && meetsConfusionThreshold;

        let reason = '';
        if (mastered) {
            reason = `Skill mastered! Accuracy: ${accuracy.toFixed(0)}%, Avg time: ${avgResponseTime.toFixed(1)}s, Confusion rate: ${confusionErrorRate.toFixed(0)}%`;
        } else {
            const issues = [];
            if (!meetsAccuracyThreshold) issues.push(`accuracy ${accuracy.toFixed(0)}% < ${criteria.accuracyThreshold}%`);
            if (!meetsTimeThreshold) issues.push(`avg time ${avgResponseTime.toFixed(1)}s > ${criteria.timeThreshold}s`);
            if (!meetsConfusionThreshold) issues.push(`confusion rate ${confusionErrorRate.toFixed(0)}% ≥ ${criteria.confusionErrorThreshold}%`);
            reason = `Not yet mastered: ${issues.join(', ')}`;
        }

        return {
            mastered,
            metrics: {
                accuracy,
                avgResponseTime,
                confusionErrorRate,
            },
            conditions: {
                meetsAccuracyThreshold,
                meetsTimeThreshold,
                meetsConfusionThreshold,
            },
            reason,
        };
    }

    /**
     * Recommends the next skill based on current progress
     * Uses prerequisite relationships to suggest appropriate next skill
     */
    static recommendNextSkill(
        currentSkill: MicroSkill & { nextSkills: string[] },
        masteryStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'MASTERED',
        allSkills: MicroSkill[]
    ): SkillRecommendation {
        // If current skill not mastered, recommend continuing
        if (masteryStatus !== 'MASTERED') {
            return {
                nextSkill: currentSkill,
                reason: 'Continue practicing current skill to achieve mastery',
                action: 'continue',
            };
        }

        // If mastered, find next skill from nextSkills array
        if (currentSkill.nextSkills && Array.isArray(currentSkill.nextSkills) && currentSkill.nextSkills.length > 0) {
            const nextSkillCode = currentSkill.nextSkills[0];
            const nextSkill = allSkills.find(s => s.code === nextSkillCode);

            if (nextSkill) {
                return {
                    nextSkill,
                    reason: `Current skill mastered! Ready to advance to ${nextSkill.name}`,
                    action: 'advance',
                };
            }
        }

        // No next skill defined - skill tree complete
        return {
            nextSkill: null,
            reason: 'Congratulations! You have completed this learning path',
            action: 'complete',
        };
    }

    /**
     * Analyzes weak areas across all domains
     * Groups attempts by domain and identifies areas needing improvement
     */
    static analyzeWeakAreas(
        attemptsByDomain: Map<string, AttemptData[]>,
        domains: SkillDomain[]
    ): WeakArea[] {
        const weakAreas: WeakArea[] = [];

        for (const domain of domains) {
            const attempts = attemptsByDomain.get(domain.id) || [];

            if (attempts.length === 0) continue;

            const correctCount = attempts.filter(a => a.isCorrect).length;
            const accuracy = (correctCount / attempts.length) * 100;

            // Flag domains with < 60% accuracy as weak areas
            if (accuracy < 60) {
                const recommendations = this.generateDomainRecommendations(domain, accuracy);
                weakAreas.push({
                    domain,
                    accuracy,
                    totalAttempts: attempts.length,
                    recommendations,
                });
            }
        }

        // Sort by accuracy (lowest first)
        return weakAreas.sort((a, b) => a.accuracy - b.accuracy);
    }

    /**
     * Detects confusion patterns in attempts
     * Looks for b/d, p/q, m/n, u/n confusion errors
     */
    static detectConfusionPattern(attempts: AttemptData[]): boolean {
        const confusionErrors = attempts.filter(a =>
            a.errorType === ErrorType.B_D_CONFUSION ||
            a.errorType === ErrorType.P_Q_CONFUSION ||
            a.errorType === ErrorType.M_N_CONFUSION ||
            a.errorType === ErrorType.U_N_CONFUSION
        );

        // Consider it a pattern if 30%+ of errors are confusion-based
        const confusionRate = attempts.length > 0 ? (confusionErrors.length / attempts.length) * 100 : 0;
        return confusionRate >= 30;
    }

    /**
     * Suggests intervention strategies for teachers
     * Based on domain and performance metrics
     */
    static suggestIntervention(domain: SkillDomain, accuracy: number): string {
        const domainCode = domain.code;

        if (accuracy < 30) {
            return `URGENT: ${domain.name} needs immediate attention. Consider one-on-one instruction with multisensory activities.`;
        } else if (accuracy < 50) {
            return `${domain.name} requires focused practice. Recommend additional practice sessions with concrete manipulatives.`;
        } else if (accuracy < 60) {
            return `${domain.name} shows some difficulty. Provide extra practice with visual aids and positive reinforcement.`;
        }

        return `${domain.name} performance is acceptable but could improve with continued practice.`;
    }

    // ============================================
    // HELPER METHODS
    // ============================================

    /**
     * Checks if there are N consecutive errors in attempts
     */
    private static hasConsecutiveErrors(attempts: AttemptData[], count: number): boolean {
        if (attempts.length < count) return false;

        for (let i = 0; i <= attempts.length - count; i++) {
            const slice = attempts.slice(i, i + count);
            if (slice.every(a => !a.isCorrect)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Analyzes attempt in real-time and provides immediate feedback
     * Called after each attempt to determine if difficulty should adjust
     */
    static analyzeAttemptInRealTime(
        recentAttempts: AttemptData[],
        currentDifficulty: 1 | 2 | 3
    ): RealTimeAnalysis {
        const insights: string[] = [];

        // Check if we should adjust difficulty
        const difficultyResult = this.adjustDifficulty(recentAttempts, currentDifficulty);

        // Detect learning trend
        const learningTrend = this.detectLearningTrend(recentAttempts);

        // Generate insights based on performance
        if (recentAttempts.length >= 3) {
            const last3 = recentAttempts.slice(-3);
            const accuracy = (last3.filter(a => a.isCorrect).length / last3.length) * 100;

            if (accuracy === 100) {
                insights.push('Perfect! You\'re doing amazing! 🌟');
            } else if (accuracy >= 66) {
                insights.push('Great work! Keep it up! 💪');
            } else if (accuracy >= 33) {
                insights.push('You\'re learning! Stay focused! 🎯');
            } else {
                insights.push('Take your time and try your best! 💙');
            }

            // Check for confusion patterns
            if (this.detectConfusionPattern(last3)) {
                insights.push('Watch out for similar-looking letters!');
            }
        }

        return {
            shouldAdjustDifficulty: difficultyResult.shouldAdjust,
            newDifficulty: difficultyResult.newLevel,
            reason: difficultyResult.reason,
            insights,
            learningTrend
        };
    }

    /**
     * Gets adaptive difficulty for the next question
     * Based on last 5 attempts performance
     */
    static getAdaptiveDifficultyForNextQuestion(
        last5Attempts: AttemptData[],
        currentDifficulty: 1 | 2 | 3
    ): 1 | 2 | 3 {
        if (last5Attempts.length < 3) {
            return currentDifficulty;
        }

        const result = this.adjustDifficulty(last5Attempts, currentDifficulty);
        return result.newLevel;
    }

    /**
     * Detects learning trend from attempt history
     */
    private static detectLearningTrend(attempts: AttemptData[]): 'improving' | 'stable' | 'declining' {
        if (attempts.length < 6) return 'stable';

        const firstHalf = attempts.slice(0, Math.floor(attempts.length / 2));
        const secondHalf = attempts.slice(Math.floor(attempts.length / 2));

        const firstAccuracy = (firstHalf.filter(a => a.isCorrect).length / firstHalf.length) * 100;
        const secondAccuracy = (secondHalf.filter(a => a.isCorrect).length / secondHalf.length) * 100;

        const diff = secondAccuracy - firstAccuracy;

        if (diff > 15) return 'improving';
        if (diff < -15) return 'declining';
        return 'stable';
    }

    /**
     * Generates domain-specific recommendations
     */
    private static generateDomainRecommendations(domain: SkillDomain, accuracy: number): string[] {
        const recommendations: string[] = [];

        if (accuracy < 40) {
            recommendations.push('Schedule daily 10-minute practice sessions');
            recommendations.push('Use multisensory learning approaches (visual, auditory, kinesthetic)');
            recommendations.push('Break down skills into smaller sub-skills');
        } else if (accuracy < 60) {
            recommendations.push('Increase practice frequency to 3-4 times per week');
            recommendations.push('Incorporate games and interactive activities');
            recommendations.push('Provide immediate feedback and positive reinforcement');
        }

        // Domain-specific recommendations
        if (domain.code === 'A') {
            recommendations.push('Use letter tracing activities and tactile materials');
            recommendations.push('Practice letter-sound associations with songs and rhymes');
        }

        return recommendations;
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Calculates stars earned for an attempt
 * - 1 star for correct answer
 * - +0.5 bonus for fast response (< 3s)
 * - -0.2 penalty for hint usage
 */
export function calculateStars(
    isCorrect: boolean,
    responseTime: number,
    hintUsed: boolean
): number {
    if (!isCorrect) return 0;

    let stars = 1.0;

    // Bonus for fast response
    if (responseTime < 3) {
        stars += 0.5;
    }

    // Penalty for hint usage
    if (hintUsed) {
        stars -= 0.2;
    }

    return Math.max(0, Math.round(stars * 10) / 10); // Round to 1 decimal
}

/**
 * Converts stars to coins (1 star = 1 coin)
 */
export function starsToCoins(stars: number): number {
    return Math.floor(stars);
}

/**
 * Determines error type based on correct answer and user response
 */
export function classifyError(
    correctAnswer: string,
    userResponse: string
): ErrorType {
    const correct = correctAnswer.toLowerCase();
    const response = userResponse.toLowerCase();

    // Check for specific confusion patterns
    if ((correct === 'b' && response === 'd') || (correct === 'd' && response === 'b')) {
        return ErrorType.B_D_CONFUSION;
    }
    if ((correct === 'p' && response === 'q') || (correct === 'q' && response === 'p')) {
        return ErrorType.P_Q_CONFUSION;
    }
    if ((correct === 'm' && response === 'n') || (correct === 'n' && response === 'm')) {
        return ErrorType.M_N_CONFUSION;
    }
    if ((correct === 'u' && response === 'n') || (correct === 'n' && response === 'u')) {
        return ErrorType.U_N_CONFUSION;
    }

    // Check for vowel errors
    const vowels = ['a', 'e', 'i', 'o', 'u'];
    if (vowels.includes(correct) && vowels.includes(response) && correct !== response) {
        return ErrorType.VOWEL_ERROR;
    }

    return ErrorType.OTHER;
}

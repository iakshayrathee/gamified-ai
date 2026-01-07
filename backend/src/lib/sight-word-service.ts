import { PrismaClient, Attempt, ErrorType } from '@prisma/client';

const prisma = new PrismaClient();

export interface TierClassification {
    tier: 1 | 2 | 3;
    label: string;
    emoji: string;
    description: string;
    color: string;
}

export interface ErrorPatterns {
    visualConfusion: boolean;
    randomGuessing: boolean;
    slowProcessing: boolean;
    inconsistentPerformance: boolean;
    avoidanceBehavior: boolean;
}

export class SightWordService {
    /**
     * Calculate tier classification based on accuracy percentage
     * Tier 1 (≥80%): Independent / Grade-ready
     * Tier 2 (60-79%): Needs guided reinforcement
     * Tier 3 (<40%): High risk - intervention required
     */
    static calculateTier(accuracy: number): TierClassification {
        if (accuracy >= 80) {
            return {
                tier: 1,
                label: 'Independent / Grade-ready',
                emoji: '⭐',
                description: 'Mastered! Ready for grade-level reading',
                color: 'green'
            };
        } else if (accuracy >= 60) {
            return {
                tier: 2,
                label: 'Needs guided reinforcement',
                emoji: '📚',
                description: 'Progressing well, needs more practice',
                color: 'yellow'
            };
        } else if (accuracy >= 40) {
            return {
                tier: 2,
                label: 'Needs guided reinforcement',
                emoji: '📚',
                description: 'Needs additional support and practice',
                color: 'yellow'
            };
        } else {
            return {
                tier: 3,
                label: 'High risk – intervention required',
                emoji: '🚨',
                description: 'Requires immediate intervention and support',
                color: 'red'
            };
        }
    }

    /**
     * Get adaptive difficulty based on tier and stage
     * Tier 1: Normal progression
     * Tier 2: More scaffolding
     * Tier 3: Maximum support
     */
    static getAdaptiveDifficulty(tier: 1 | 2 | 3, stage: string): number {
        const difficultyMap: Record<1 | 2 | 3, Record<string, number>> = {
            1: { Recognition: 2, Meaning: 2, Recall: 2, Reading: 2, Spelling: 2 },
            2: { Recognition: 1, Meaning: 1, Recall: 1, Reading: 1, Spelling: 2 },
            3: { Recognition: 1, Meaning: 1, Recall: 1, Reading: 1, Spelling: 1 }
        };

        return difficultyMap[tier][stage] || 1;
    }

    /**
     * Analyze error patterns for LD detection
     * Tracks visual confusion, guessing, processing speed, consistency, and avoidance
     */
    static analyzeErrorPatterns(attempts: Attempt[]): ErrorPatterns {
        if (attempts.length < 5) {
            return {
                visualConfusion: false,
                randomGuessing: false,
                slowProcessing: false,
                inconsistentPerformance: false,
                avoidanceBehavior: false
            };
        }

        const totalAttempts = attempts.length;
        const incorrectAttempts = attempts.filter(a => !a.isCorrect);

        // Visual confusion: Check for b/d, p/q confusion patterns
        const confusionErrors = attempts.filter(a =>
            a.errorType === ErrorType.B_D_CONFUSION ||
            a.errorType === ErrorType.P_Q_CONFUSION ||
            a.errorType === ErrorType.M_N_CONFUSION ||
            a.errorType === ErrorType.U_N_CONFUSION
        ).length;
        const visualConfusion = (confusionErrors / totalAttempts) > 0.3; // >30% confusion errors

        // Random guessing: High error rate with fast responses
        const fastIncorrect = incorrectAttempts.filter(a => a.responseTimeSeconds < 2).length;
        const randomGuessing = (fastIncorrect / totalAttempts) > 0.4; // >40% fast incorrect

        // Slow processing: Average response time > 10 seconds
        const avgResponseTime = attempts.reduce((sum, a) => sum + a.responseTimeSeconds, 0) / totalAttempts;
        const slowProcessing = avgResponseTime > 10;

        // Inconsistent performance: High variance in accuracy
        const recentAccuracy = attempts.slice(-10).filter(a => a.isCorrect).length / Math.min(10, attempts.length);
        const overallAccuracy = attempts.filter(a => a.isCorrect).length / totalAttempts;
        const inconsistentPerformance = Math.abs(recentAccuracy - overallAccuracy) > 0.3; // >30% variance

        // Avoidance behavior: Skipping or very fast responses (< 1 second)
        const veryFastResponses = attempts.filter(a => a.responseTimeSeconds < 1).length;
        const avoidanceBehavior = (veryFastResponses / totalAttempts) > 0.3; // >30% very fast

        return {
            visualConfusion,
            randomGuessing,
            slowProcessing,
            inconsistentPerformance,
            avoidanceBehavior
        };
    }

    /**
     * Calculate risk indicator for LD assessment
     * Returns: 'Low', 'Medium', or 'High'
     */
    static calculateRiskIndicator(errorPatterns: ErrorPatterns, tier: 1 | 2 | 3): 'Low' | 'Medium' | 'High' {
        const riskFactors = Object.values(errorPatterns).filter(v => v === true).length;

        if (tier === 1 && riskFactors === 0) return 'Low';
        if (tier === 1 && riskFactors <= 1) return 'Low';
        if (tier === 2 && riskFactors <= 1) return 'Medium';
        if (tier === 2 && riskFactors >= 2) return 'Medium';
        if (tier === 3 || riskFactors >= 3) return 'High';

        return 'Medium';
    }

    /**
     * Get tier-based hint configuration
     */
    static getTierHintConfig(tier: 1 | 2 | 3): {
        showHintAfterAttempts: number;
        showAnswerAfterAttempts: number;
        audioHintEnabled: boolean;
        visualHintEnabled: boolean;
    } {
        const configs = {
            1: {
                showHintAfterAttempts: 1,
                showAnswerAfterAttempts: 2,
                audioHintEnabled: false,
                visualHintEnabled: true
            },
            2: {
                showHintAfterAttempts: 1,
                showAnswerAfterAttempts: 2,
                audioHintEnabled: true,
                visualHintEnabled: true
            },
            3: {
                showHintAfterAttempts: 0, // Immediate hints
                showAnswerAfterAttempts: 1,
                audioHintEnabled: true,
                visualHintEnabled: true
            }
        };

        return configs[tier];
    }

    /**
     * Calculate tier based on overall accuracy across all 80 words
     */
    static calculateOverallTier(wordMasteryData: any[]): TierClassification {
        if (wordMasteryData.length === 0) {
            return this.calculateTier(0);
        }

        const totalAccuracy = wordMasteryData.reduce((sum: number, wm: any) => sum + wm.accuracyPercentage, 0);
        const avgAccuracy = totalAccuracy / wordMasteryData.length;

        return this.calculateTier(avgAccuracy);
    }

    /**
     * Get progress summary for all 80 words
     */
    static async getProgressSummary(childId: string, skillId: string): Promise<{
        totalWords: number;
        wordsAttempted: number;
        wordsMastered: number;
        overallTier: TierClassification;
        wordBreakdown: {
            tier1: number;
            tier2: number;
            tier3: number;
        };
    }> {
        const wordMastery = await prisma.wordMastery.findMany({
            where: { childId, microSkillId: skillId }
        });

        const tier1Words = wordMastery.filter(wm => wm.tier === 1).length;
        const tier2Words = wordMastery.filter(wm => wm.tier === 2).length;
        const tier3Words = wordMastery.filter(wm => wm.tier === 3).length;
        const wordsMastered = wordMastery.filter(wm => wm.tier === 1).length;

        return {
            totalWords: 80,
            wordsAttempted: wordMastery.length,
            wordsMastered,
            overallTier: this.calculateOverallTier(wordMastery),
            wordBreakdown: {
                tier1: tier1Words,
                tier2: tier2Words,
                tier3: tier3Words
            }
        };
    }

    /**
     * Check if a child should progress to the next stage
     * Must complete Recognition stage with ≥60% accuracy to unlock other stages
     */
    static async canProgressToNextStage(
        childId: string,
        currentSkillCode: string
    ): Promise<{ canProgress: boolean; reason: string }> {
        // Extract list and stage from skill code (e.g., "RF.1.1" -> list 1, stage 1)
        const parts = currentSkillCode.split('.');
        if (parts.length !== 3 || parts[0] !== 'RF') {
            return { canProgress: false, reason: 'Invalid skill code' };
        }

        const listNum = parseInt(parts[1]);
        const stageNum = parseInt(parts[2]);

        // If this is the Recognition stage (stage 1), check if completed with ≥60%
        if (stageNum === 1) {
            const skillProgress = await prisma.skillProgress.findFirst({
                where: {
                    childId,
                    microSkill: {
                        code: currentSkillCode
                    }
                }
            });

            if (!skillProgress) {
                return { canProgress: false, reason: 'No progress recorded' };
            }

            if (skillProgress.accuracyPercentage >= 60) {
                return { canProgress: true, reason: 'Recognition stage completed with sufficient accuracy' };
            } else {
                return { canProgress: false, reason: 'Need ≥60% accuracy in Recognition to unlock other stages' };
            }
        }

        // For other stages, just check if previous stage is completed
        const previousStageCode = `RF.${listNum}.${stageNum - 1}`;
        const previousProgress = await prisma.skillProgress.findFirst({
            where: {
                childId,
                microSkill: {
                    code: previousStageCode
                }
            }
        });

        if (!previousProgress) {
            return { canProgress: false, reason: 'Previous stage not started' };
        }

        if (previousProgress.masteryStatus === 'MASTERED' || previousProgress.totalAttempts >= 5) {
            return { canProgress: true, reason: 'Previous stage completed' };
        }

        return { canProgress: false, reason: 'Complete previous stage first' };
    }
}

export default SightWordService;

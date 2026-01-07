import { Attempt } from '@prisma/client';
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
export declare class SightWordService {
    /**
     * Calculate tier based on accuracy percentage
     * Tier 1 (≥80%): Independent / Grade-ready
     * Tier 2 (60-79%): Needs guided reinforcement
     * Tier 3 (<40%): High risk - intervention required
     */
    static calculateTier(accuracy: number): TierClassification;
    /**
     * Get adaptive difficulty based on tier and stage
     * Tier 1: Normal progression
     * Tier 2: More scaffolding
     * Tier 3: Maximum support
     */
    static getAdaptiveDifficulty(tier: 1 | 2 | 3, stage: string): number;
    /**
     * Analyze error patterns for LD detection
     * Tracks visual confusion, guessing, processing speed, consistency, and avoidance
     */
    static analyzeErrorPatterns(attempts: Attempt[]): ErrorPatterns;
    /**
     * Calculate risk indicator for LD assessment
     * Returns: 'Low', 'Medium', or 'High'
     */
    static calculateRiskIndicator(errorPatterns: ErrorPatterns, tier: 1 | 2 | 3): 'Low' | 'Medium' | 'High';
    /**
     * Get tier-based hint configuration
     */
    static getTierHintConfig(tier: 1 | 2 | 3): {
        showHintAfterAttempts: number;
        showAnswerAfterAttempts: number;
        audioHintEnabled: boolean;
        visualHintEnabled: boolean;
    };
    /**
     * Calculate tier based on overall accuracy across all 80 words
     */
    static calculateOverallTier(wordMasteryData: any[]): TierClassification;
    /**
     * Get progress summary for all 80 words
     */
    static getProgressSummary(childId: string, skillId: string): Promise<{
        totalWords: number;
        wordsAttempted: number;
        wordsMastered: number;
        overallTier: TierClassification;
        wordBreakdown: {
            tier1: number;
            tier2: number;
            tier3: number;
        };
    }>;
    /**
     * Check if a child should progress to the next stage
     * Must complete Recognition stage with ≥60% accuracy to unlock other stages
     */
    static canProgressToNextStage(childId: string, currentSkillCode: string): Promise<{
        canProgress: boolean;
        reason: string;
    }>;
}
export default SightWordService;
//# sourceMappingURL=sight-word-service.d.ts.map
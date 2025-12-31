/**
 * Recommendation Engine
 * Generates personalized skill recommendations using AI
 */
export declare class RecommendationEngine {
    /**
     * Generate recommendations for a child
     */
    generateRecommendations(childId: string, limit?: number): Promise<any[]>;
    /**
     * Get skills that are eligible for recommendation
     */
    private getEligibleSkills;
    /**
     * Use AI to rank skills and generate recommendations
     */
    private rankSkillsWithAI;
    /**
     * Analyze performance to extract patterns
     */
    private analyzePerformance;
    /**
     * Fallback recommendations when AI is unavailable
     */
    private getFallbackRecommendations;
    /**
     * Get active recommendations for a child
     */
    getActiveRecommendations(childId: string): Promise<any[]>;
    /**
     * Mark recommendation as completed
     */
    completeRecommendation(recommendationId: string): Promise<any>;
}
declare const _default: RecommendationEngine;
export default _default;
//# sourceMappingURL=recommendation-engine.d.ts.map
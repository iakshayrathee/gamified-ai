interface QuizReview {
    overallPerformance: string;
    strengths: string[];
    areasToImprove: string[];
    specificFeedback: string;
    encouragement: string;
    confusionPatterns: string[];
}
interface NextSkillRecommendation {
    skillId: string;
    skillName: string;
    skillCode: string;
    reason: string;
    confidence: number;
}
/**
 * AI Quiz Review Service
 * Generates personalized reviews and recommendations after quiz completion
 */
export declare class QuizReviewService {
    /**
     * Generate AI-powered review AND recommendation in a SINGLE call (optimized for kids!)
     */
    generateQuizReviewWithRecommendation(sessionId: string, childId: string, autoSave?: boolean): Promise<{
        review: QuizReview;
        recommendation: NextSkillRecommendation | null;
    }>;
    /**
     * Save quiz review to database for teacher access
     */
    saveQuizReview(sessionId: string, childId: string, skillId: string, review: QuizReview, accuracy: number, totalAttempts: number, correctAttempts: number, avgResponseTime: number, recommendation: NextSkillRecommendation | null): Promise<void>;
    /**
     * DEPRECATED: Use generateQuizReviewWithRecommendation instead
     */
    generateQuizReview(sessionId: string, childId: string): Promise<QuizReview>;
    /**
     * DEPRECATED: Use generateQuizReviewWithRecommendation instead
     * Recommend next skill based on quiz performance
     */
    recommendNextSkill(sessionId: string, childId: string): Promise<NextSkillRecommendation | null>;
    /**
     * Fallback review when AI is unavailable
     */
    private getFallbackReview;
}
declare const _default: QuizReviewService;
export default _default;
//# sourceMappingURL=quiz-review-service.d.ts.map
interface StudentQuizReview {
    id: string;
    sessionId: string;
    skillName: string;
    skillCode: string;
    createdAt: Date;
    overallPerformance: string;
    strengths: string[];
    areasToImprove: string[];
    specificFeedback: string;
    encouragement: string;
    confusionPatterns: string[];
    accuracy: number;
    totalAttempts: number;
    correctAttempts: number;
    avgResponseTime: number;
    recommendedSkillName?: string;
    recommendedSkillCode?: string;
    recommendedReason?: string;
}
interface StudentDetailedProgress {
    student: {
        id: string;
        name: string;
    };
    overallStats: {
        totalQuizzes: number;
        averageAccuracy: number;
        skillsMastered: number;
        skillsInProgress: number;
        totalAttempts: number;
        avgResponseTime: number;
    };
    quizReviews: StudentQuizReview[];
    skillProgress: any[];
    confusionPatterns: Array<{
        pattern: string;
        frequency: number;
    }>;
}
interface TeacherReport {
    id: string;
    childId: string;
    generatedAt: Date;
    reportPeriodStart: Date;
    reportPeriodEnd: Date;
    overallAccuracy: number;
    totalAttempts: number;
    totalTimeSpent: number;
    skillsMastered: number;
    skillsInProgress: number;
    strengths: string[];
    weaknesses: string[];
    confusionPatterns: Array<{
        type: string;
        frequency: number;
        description: string;
    }>;
    recommendations: Array<{
        title: string;
        description: string;
        priority: number;
    }>;
    domainPerformance: Array<{
        domain: {
            name: string;
            code: string;
        };
        accuracy: number;
        avgResponseTime: number;
        attemptsCount: number;
        masteryLevel: string;
    }>;
}
/**
 * Teacher Service
 * Provides teacher-specific operations for student progress tracking and reporting
 */
export declare class TeacherService {
    /**
     * Get recent quiz reviews for a student
     */
    getStudentQuizReviews(childId: string, limit?: number): Promise<StudentQuizReview[]>;
    /**
     * Get comprehensive student progress data
     */
    getStudentDetailedProgress(childId: string): Promise<StudentDetailedProgress>;
    /**
     * Generate AI-powered teacher report for a student
     */
    generateTeacherReport(childId: string, startDate: Date, endDate: Date): Promise<TeacherReport>;
    /**
     * Get student's performance report history
     */
    getStudentReports(childId: string): Promise<TeacherReport[]>;
    private getConfusionDescription;
    private getFallbackStrengths;
    private getFallbackWeaknesses;
    private getFallbackRecommendations;
}
declare const _default: TeacherService;
export default _default;
//# sourceMappingURL=teacher-service.d.ts.map
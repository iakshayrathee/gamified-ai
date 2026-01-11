/**
 * Analytics Types for Quiz Results System
 * Comprehensive type definitions for mastery tracking, error patterns, and recommendations
 */
export interface WordMastery {
    word: string;
    totalAttempts: number;
    correctAttempts: number;
    masteryPercentage: number;
    avgResponseTime: number;
    lastAttemptDate: Date;
    repetitionFrequency: 'high' | 'medium' | 'low';
    cluster?: string;
    issues?: string[];
}
export interface ListReadiness {
    listId: string;
    listName: string;
    overallMastery: number;
    readinessScore: number;
    tier: 1 | 2 | 3;
    tierLabel: string;
    tierEmoji: string;
    riskIndicator: 'Low' | 'Medium' | 'High';
    recommendedAction: string;
}
export interface VisualConfusionPattern {
    detected: boolean;
    severity: 'low' | 'medium' | 'high';
    confusedPairs: Array<{
        correct: string;
        chosen: string;
        count: number;
    }>;
    recommendation: string;
}
export interface RandomGuessingPattern {
    detected: boolean;
    instanceCount: number;
    affectedWords: string[];
    recommendation: string;
}
export interface SlowProcessingPattern {
    detected: boolean;
    avgTime: number;
    expectedTime: number;
    slowWords: string[];
    recommendation: string;
}
export interface InconsistencyPattern {
    detected: boolean;
    variance: number;
    standardDeviation: number;
    pattern: string;
    recommendation: string;
}
export interface AvoidancePattern {
    detected: boolean;
    timeouts: number;
    skips: number;
    affectedWords: string[];
    recommendation: string;
}
export interface ErrorPattern {
    visualConfusion: VisualConfusionPattern;
    randomGuessing: RandomGuessingPattern;
    slowProcessing: SlowProcessingPattern;
    inconsistentPerformance: InconsistencyPattern;
    avoidanceBehavior: AvoidancePattern;
}
export interface WordAttemptData {
    childId: string;
    word: string;
    sessionId: string;
    timestamp: Date;
    isCorrect: boolean;
    responseTime: number;
    attemptNumber: number;
    difficultyLevel: 1 | 2 | 3;
    questionType: string;
    errorType?: string;
    userResponse?: string;
    hintUsed: boolean;
    wasTimeout: boolean;
    wasSkipped: boolean;
    responsePattern: 'immediate' | 'thoughtful' | 'hesitant' | 'timeout';
}
export interface SessionAnalytics {
    sessionId: string;
    childId: string;
    skillId: string;
    startTime: Date;
    endTime: Date;
    totalWords: number;
    uniqueWords: number;
    totalAttempts: number;
    correctAttempts: number;
    wordsByMastery: {
        mastered: string[];
        proficient: string[];
        developing: string[];
        struggling: string[];
    };
    errorPatterns: ErrorPattern;
    levelTransitions: Array<{
        fromLevel: number;
        toLevel: number;
        reason: string;
        timestamp: Date;
    }>;
}
export interface GameRecommendation {
    gameName: string;
    gameType: 'flashcard' | 'matching' | 'spelling' | 'context';
    targetWords: string[];
    reason: string;
    priority: 'high' | 'medium' | 'low';
    estimatedDuration: number;
}
export interface RepetitionSchedule {
    word: string;
    nextReviewDate: Date;
    frequency: 'daily' | 'every-2-days' | 'weekly';
    priority: number;
}
export interface WordCluster {
    clusterName: string;
    words: string[];
    avgAccuracy: number;
    avgResponseTime: number;
    recommendation: string;
}
export interface ClusterAnalysis {
    clusters: WordCluster[];
    weakClusters: WordCluster[];
}
export interface PerformanceTrend {
    accuracyOverTime: Array<{
        date: string;
        accuracy: number;
    }>;
    responseTimeOverTime: Array<{
        date: string;
        avgTime: number;
    }>;
    masteryProgression: Array<{
        date: string;
        masteredWords: number;
    }>;
}
export interface DetailedReport {
    summary: {
        childId: string;
        childName: string;
        skillName: string;
        skillCode: string;
        completedDate: Date;
        masteryLevel: string;
        readinessScore: number;
        riskIndicator: 'Low' | 'Medium' | 'High';
        tier: 1 | 2 | 3;
        tierLabel: string;
        keyAchievements: string[];
    };
    wordAnalysis: {
        mastered: WordMastery[];
        proficient: WordMastery[];
        developing: WordMastery[];
        struggling: WordMastery[];
        clusterAnalysis: ClusterAnalysis;
    };
    errorPatterns: ErrorPattern;
    trends: PerformanceTrend;
    recommendations: {
        nextSkill: {
            skillId: string;
            skillName: string;
            skillCode: string;
            reason: string;
            confidence: number;
        } | null;
        recommendedGames: GameRecommendation[];
        focusAreas: string[];
        repetitionSchedule: RepetitionSchedule[];
        interventions: string[];
    };
    dataSummary: {
        totalAttempts: number;
        correctAttempts: number;
        accuracy: number;
        avgResponseTime: number;
        responseTimeDistribution: {
            fast: number;
            normal: number;
            slow: number;
        };
        errorTypeBreakdown: Record<string, number>;
        levelTransitions: Array<{
            fromLevel: number;
            toLevel: number;
            reason: string;
            timestamp: Date;
        }>;
    };
}
//# sourceMappingURL=analytics.types.d.ts.map
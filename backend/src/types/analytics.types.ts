/**
 * Analytics Types for Quiz Results System
 * Comprehensive type definitions for mastery tracking, error patterns, and recommendations
 */

// ============================================
// MASTERY TRACKING TYPES
// ============================================

export interface WordMastery {
    word: string;
    totalAttempts: number;
    correctAttempts: number;
    masteryPercentage: number; // 0-100
    avgResponseTime: number;
    lastAttemptDate: Date;
    repetitionFrequency: 'high' | 'medium' | 'low';
    cluster?: string; // e.g., "CVC-short-a", "sight-words-tier-1"
    issues?: string[];
}

export interface ListReadiness {
    listId: string;
    listName: string;
    overallMastery: number; // 0-100
    readinessScore: number; // 0-100 (weighted: 50% accuracy, 30% speed, 20% consistency)
    tier: 1 | 2 | 3;
    tierLabel: string;
    tierEmoji: string;
    riskIndicator: 'Low' | 'Medium' | 'High';
    recommendedAction: string;
}

// ============================================
// ERROR PATTERN TYPES
// ============================================

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
    pattern: string; // e.g., "strong start, weak finish"
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

// ============================================
// DATA CAPTURE TYPES
// ============================================

export interface WordAttemptData {
    childId: string;
    word: string;
    sessionId: string;
    timestamp: Date;

    // Performance metrics
    isCorrect: boolean;
    responseTime: number;
    attemptNumber: number;

    // Context
    difficultyLevel: 1 | 2 | 3;
    questionType: string;

    // Error analysis
    errorType?: string;
    userResponse?: string;
    hintUsed: boolean;

    // Behavioral indicators
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

    // Aggregate metrics
    totalWords: number;
    uniqueWords: number;
    totalAttempts: number;
    correctAttempts: number;

    // Performance distribution
    wordsByMastery: {
        mastered: string[];
        proficient: string[];
        developing: string[];
        struggling: string[];
    };

    // Behavioral patterns
    errorPatterns: ErrorPattern;

    // Level transitions
    levelTransitions: Array<{
        fromLevel: number;
        toLevel: number;
        reason: string;
        timestamp: Date;
    }>;
}

// ============================================
// RECOMMENDATION TYPES
// ============================================

export interface GameRecommendation {
    gameName: string;
    gameType: 'flashcard' | 'matching' | 'spelling' | 'context';
    targetWords: string[];
    reason: string;
    priority: 'high' | 'medium' | 'low';
    estimatedDuration: number; // minutes
}

export interface RepetitionSchedule {
    word: string;
    nextReviewDate: Date;
    frequency: 'daily' | 'every-2-days' | 'weekly';
    priority: number; // 1-10, higher = more urgent
}

// ============================================
// CLUSTER ANALYSIS TYPES
// ============================================

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

// ============================================
// PERFORMANCE TRENDS TYPES
// ============================================

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

// ============================================
// DETAILED REPORT TYPES
// ============================================

export interface DetailedReport {
    // Executive summary
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

    // Word-level analysis
    wordAnalysis: {
        mastered: WordMastery[];
        proficient: WordMastery[];
        developing: WordMastery[];
        struggling: WordMastery[];
        clusterAnalysis: ClusterAnalysis;
    };

    // Error patterns
    errorPatterns: ErrorPattern;

    // Performance trends
    trends: PerformanceTrend;

    // Recommendations
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

    // Data capture summary
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

/**
 * API Client for Quiz Results
 * Handles all API calls for the new quiz results system
 */

import { ErrorPattern } from './types';

// Response types matching backend API
export interface QuizResultsSummary {
    masteryAchieved: boolean;
    accuracy: number;
    totalStars: number;
    totalCoins: number;
    tier?: 1 | 2 | 3;
    tierLabel?: string;
    tierEmoji?: string;
    riskIndicator?: 'Low' | 'Medium' | 'High';
}

export interface QuizResultsMetrics {
    totalAttempts: number;
    correctAttempts: number;
    avgResponseTime: number;
    responseTimeDistribution: {
        fast: number;
        normal: number;
        slow: number;
    };
    consistency: {
        variance: number;
        standardDeviation: number;
        pattern: string;
    };
    questionBreakdown: Array<{
        questionId: string;
        word: string;
        correct: boolean;
        timeSpent: number;
        attemptNumber: number;
        errorType?: string;
        userResponse?: string;
    }>;
}

export interface WordMasteryData {
    word: string;
    masteryPercentage: number;
    avgResponseTime: number;
    totalAttempts: number;
    issues?: string[];
}

export interface WeakCluster {
    clusterName: string;
    words: string[];
    avgAccuracy: number;
    recommendation: string;
}

export interface QuizResultsWordMastery {
    mastered: WordMasteryData[];
    proficient: WordMasteryData[];
    developing: WordMasteryData[];
    struggling: WordMasteryData[];
    weakClusters: WeakCluster[];
    readinessScore: number;
    readinessLevel: string;
}

export interface QuizResultsInsights {
    strengths: string[];
    areasToImprove: string[];
    specificFeedback: string;
    encouragement: string;
    learningTrend: 'improving' | 'stable' | 'declining';
    learningVelocity: number;
}

export interface GameRecommendation {
    gameName: string;
    gameType: 'flashcard' | 'matching' | 'spelling' | 'context';
    targetWords: string[];
    reason: string;
    priority: 'high' | 'medium' | 'low';
    estimatedDuration: number;
}

export interface RepetitionScheduleItem {
    word: string;
    nextReviewDate: string;
    frequency: 'daily' | 'every-2-days' | 'weekly';
    priority: number;
}

export interface NextSkillRecommendation {
    skillId: string;
    skillName: string;
    skillCode: string;
    reason: string;
    confidence: number;
}

export interface QuizResultsRecommendations {
    nextSkill: NextSkillRecommendation | null;
    recommendedGames: GameRecommendation[];
    focusAreas: string[];
    repetitionSchedule: RepetitionScheduleItem[];
    interventions: string[];
}

export interface ComprehensiveQuizResults {
    summary: QuizResultsSummary;
    metrics: QuizResultsMetrics;
    wordMastery?: QuizResultsWordMastery;
    errorPatterns: ErrorPattern;
    insights: QuizResultsInsights;
    recommendations: QuizResultsRecommendations;
}

/**
 * Fetch comprehensive quiz results
 */
export async function getComprehensiveQuizResults(
    childId: string,
    sessionId: string
): Promise<ComprehensiveQuizResults> {
    const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/child/${childId}/quiz-results/${sessionId}`,
        {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        }
    );

    if (!response.ok) {
        throw new Error('Failed to fetch quiz results');
    }

    return response.json();
}

/**
 * Cache for quiz results to avoid repeated API calls
 */
const resultsCache = new Map<string, ComprehensiveQuizResults>();

/**
 * Get quiz results with caching
 */
export async function getCachedQuizResults(
    childId: string,
    sessionId: string
): Promise<ComprehensiveQuizResults> {
    const cacheKey = `${childId}-${sessionId}`;

    if (resultsCache.has(cacheKey)) {
        return resultsCache.get(cacheKey)!;
    }

    const results = await getComprehensiveQuizResults(childId, sessionId);
    resultsCache.set(cacheKey, results);

    return results;
}

/**
 * Clear cache for a specific session
 */
export function clearResultsCache(childId: string, sessionId: string): void {
    const cacheKey = `${childId}-${sessionId}`;
    resultsCache.delete(cacheKey);
}

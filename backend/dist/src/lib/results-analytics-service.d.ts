/**
 * Results Analytics Service
 * Comprehensive analytics engine for quiz results with advanced error pattern detection
 */
import { Attempt } from '@prisma/client';
import { WordMastery, ListReadiness, ErrorPattern, VisualConfusionPattern, RandomGuessingPattern, SlowProcessingPattern, InconsistencyPattern, AvoidancePattern, ClusterAnalysis, GameRecommendation, RepetitionSchedule, DetailedReport } from '../types/analytics.types';
export declare class ResultsAnalyticsService {
    /**
     * Calculate per-word mastery for a child and skill
     */
    calculateWordMastery(childId: string, skillId: string): Promise<WordMastery[]>;
    /**
     * Calculate list-level readiness score
     * Tier Classification:
     * - Tier 1 (≥80%): Independent/Grade-ready
     * - Tier 2 (60-79%): Needs guided reinforcement
     * - Tier 3 (<60%): High risk – intervention required
     */
    calculateListReadiness(childId: string, skillId: string): Promise<ListReadiness>;
    /**
     * Detect visual confusion patterns
     * Threshold: ≥3 instances of similar-looking word confusion
     */
    detectVisualConfusion(attempts: (Attempt & {
        question: {
            correctAnswer: string;
        } | null;
    })[]): VisualConfusionPattern;
    /**
     * Detect random guessing pattern
     * Threshold: ≥5 rapid incorrect responses (<2s, <50% accuracy)
     */
    detectRandomGuessing(attempts: (Attempt & {
        question: {
            correctAnswer: string;
        } | null;
    })[]): RandomGuessingPattern;
    /**
     * Detect slow processing pattern
     * Threshold: ≥60% of responses exceed 6 seconds
     */
    detectSlowProcessing(attempts: (Attempt & {
        question: {
            correctAnswer: string;
        } | null;
    })[]): SlowProcessingPattern;
    /**
     * Detect inconsistent performance
     * Threshold: Standard deviation >30%
     */
    detectInconsistentPerformance(attempts: (Attempt & {
        question: {
            correctAnswer: string;
        } | null;
    })[]): InconsistencyPattern;
    /**
     * Detect avoidance behavior
     * Threshold: ≥3 timeouts or rapid incorrect answers on challenging words
     */
    detectAvoidanceBehavior(attempts: (Attempt & {
        question: {
            correctAnswer: string;
        } | null;
    })[]): AvoidancePattern;
    /**
     * Detect all error patterns (orchestrator)
     */
    detectErrorPatterns(attempts: (Attempt & {
        question: {
            correctAnswer: string;
        } | null;
    })[]): Promise<ErrorPattern>;
    /**
     * Identify word clusters by phonetic patterns
     */
    identifyWordClusters(words: string[]): Map<string, string[]>;
    /**
     * Analyze cluster performance
     */
    analyzeClusterPerformance(childId: string, skillId: string): Promise<ClusterAnalysis>;
    /**
     * Generate game recommendations based on error patterns
     */
    generateGameRecommendations(errorPatterns: ErrorPattern): GameRecommendation[];
    /**
     * Calculate spaced repetition schedule
     */
    calculateRepetitionSchedule(wordMasteryList: WordMastery[]): RepetitionSchedule[];
    /**
     * Generate comprehensive detailed report
     */
    generateDetailedReport(childId: string, sessionId: string): Promise<DetailedReport>;
}
declare const _default: ResultsAnalyticsService;
export default _default;
//# sourceMappingURL=results-analytics-service.d.ts.map
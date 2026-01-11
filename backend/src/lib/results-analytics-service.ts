/**
 * Results Analytics Service
 * Comprehensive analytics engine for quiz results with advanced error pattern detection
 */

import { PrismaClient, Attempt } from '@prisma/client';
import {
    WordMastery,
    ListReadiness,
    ErrorPattern,
    VisualConfusionPattern,
    RandomGuessingPattern,
    SlowProcessingPattern,
    InconsistencyPattern,
    AvoidancePattern,
    WordCluster,
    ClusterAnalysis,
    GameRecommendation,
    RepetitionSchedule,
    DetailedReport,
    PerformanceTrend
} from '../types/analytics.types';

const prisma = new PrismaClient();

/**
 * Calculate Levenshtein distance between two strings
 * Used for detecting visual confusion between similar words
 */
function levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }

    return matrix[str2.length][str1.length];
}

/**
 * Check if two words are visually similar
 */
function areVisuallySimilar(word1: string, word2: string): boolean {
    if (word1.length !== word2.length) return false;
    const distance = levenshteinDistance(word1.toLowerCase(), word2.toLowerCase());
    // Consider similar if only 1-2 character differences
    return distance <= 2;
}

export class ResultsAnalyticsService {

    // ============================================
    // MASTERY TRACKING
    // ============================================

    /**
     * Calculate per-word mastery for a child and skill
     */
    async calculateWordMastery(childId: string, skillId: string): Promise<WordMastery[]> {
        const attempts = await prisma.attempt.findMany({
            where: {
                childId,
                microSkillId: skillId
            },
            include: {
                question: true
            },
            orderBy: {
                createdAt: 'asc'
            }
        });

        // Group attempts by word
        const wordMap = new Map<string, Attempt[]>();
        attempts.forEach(attempt => {
            const word = attempt.question?.correctAnswer || '';
            if (!wordMap.has(word)) {
                wordMap.set(word, []);
            }
            wordMap.get(word)!.push(attempt);
        });

        const wordMasteryList: WordMastery[] = [];

        for (const [word, wordAttempts] of wordMap.entries()) {
            const totalAttempts = wordAttempts.length;
            const correctAttempts = wordAttempts.filter(a => a.isCorrect).length;
            const masteryPercentage = (correctAttempts / totalAttempts) * 100;
            const avgResponseTime = wordAttempts.reduce((sum, a) => sum + a.responseTimeSeconds, 0) / totalAttempts;
            const lastAttemptDate = wordAttempts[wordAttempts.length - 1].createdAt;

            // Determine repetition frequency based on mastery
            let repetitionFrequency: 'high' | 'medium' | 'low';
            if (masteryPercentage < 50) {
                repetitionFrequency = 'high'; // Daily
            } else if (masteryPercentage < 80) {
                repetitionFrequency = 'medium'; // Every 2-3 days
            } else {
                repetitionFrequency = 'low'; // Weekly
            }

            // Identify issues
            const issues: string[] = [];
            if (avgResponseTime > 6) issues.push('Slow processing');
            if (masteryPercentage < 50) issues.push('Low accuracy');

            const incorrectAttempts = wordAttempts.filter(a => !a.isCorrect);
            if (incorrectAttempts.length > 0) {
                const hasTimeouts = incorrectAttempts.some(a => a.responseTimeSeconds >= 30);
                if (hasTimeouts) issues.push('Timeouts');
            }

            wordMasteryList.push({
                word,
                totalAttempts,
                correctAttempts,
                masteryPercentage,
                avgResponseTime,
                lastAttemptDate,
                repetitionFrequency,
                issues: issues.length > 0 ? issues : undefined
            });
        }

        return wordMasteryList;
    }

    /**
     * Calculate list-level readiness score
     * Tier Classification:
     * - Tier 1 (≥80%): Independent/Grade-ready
     * - Tier 2 (60-79%): Needs guided reinforcement
     * - Tier 3 (<60%): High risk – intervention required
     */
    async calculateListReadiness(childId: string, skillId: string): Promise<ListReadiness> {
        const wordMasteryList = await this.calculateWordMastery(childId, skillId);

        if (wordMasteryList.length === 0) {
            return {
                listId: skillId,
                listName: '',
                overallMastery: 0,
                readinessScore: 0,
                tier: 3,
                tierLabel: 'High risk – intervention required',
                tierEmoji: '🚨',
                riskIndicator: 'High',
                recommendedAction: 'Begin foundational practice'
            };
        }

        // Calculate overall mastery (average of all words)
        const overallMastery = wordMasteryList.reduce((sum, w) => sum + w.masteryPercentage, 0) / wordMasteryList.length;

        // Calculate average response time
        const avgResponseTime = wordMasteryList.reduce((sum, w) => sum + w.avgResponseTime, 0) / wordMasteryList.length;

        // Calculate consistency (standard deviation of mastery percentages)
        const mean = overallMastery;
        const squaredDiffs = wordMasteryList.map(w => Math.pow(w.masteryPercentage - mean, 2));
        const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / wordMasteryList.length;
        const stdDev = Math.sqrt(variance);
        const consistencyScore = Math.max(0, 100 - stdDev); // Higher is more consistent

        // Calculate readiness score (weighted formula)
        // 50% accuracy, 30% response time, 20% consistency
        const accuracyScore = overallMastery;
        const speedScore = Math.max(0, 100 - (avgResponseTime / 10) * 100); // Normalize speed
        const readinessScore = Math.round(
            (accuracyScore * 0.5) + (speedScore * 0.3) + (consistencyScore * 0.2)
        );

        // Determine tier based on EXACT specification
        let tier: 1 | 2 | 3;
        let tierLabel: string;
        let tierEmoji: string;
        let riskIndicator: 'Low' | 'Medium' | 'High';
        let recommendedAction: string;

        if (overallMastery >= 80) {
            tier = 1;
            tierLabel = 'Independent / Grade-ready';
            tierEmoji = '🌟';
            riskIndicator = 'Low';
            recommendedAction = 'Ready to advance to next skill';
        } else if (overallMastery >= 60) {
            tier = 2;
            tierLabel = 'Needs guided reinforcement';
            tierEmoji = '📚';
            riskIndicator = 'Medium';
            recommendedAction = 'Continue practice with support';
        } else {
            tier = 3;
            tierLabel = 'High risk – intervention required';
            tierEmoji = '🚨';
            riskIndicator = 'High';
            recommendedAction = 'Immediate intervention needed';
        }

        const skill = await prisma.microSkill.findUnique({
            where: { id: skillId }
        });

        return {
            listId: skillId,
            listName: skill?.name || '',
            overallMastery,
            readinessScore,
            tier,
            tierLabel,
            tierEmoji,
            riskIndicator,
            recommendedAction
        };
    }

    // ============================================
    // ERROR PATTERN DETECTION
    // ============================================

    /**
     * Detect visual confusion patterns
     * Threshold: ≥3 instances of similar-looking word confusion
     */
    detectVisualConfusion(attempts: (Attempt & { question: { correctAnswer: string } | null })[]): VisualConfusionPattern {
        const confusionPairs = new Map<string, { correct: string; chosen: string; count: number }>();

        const incorrectAttempts = attempts.filter(a => !a.isCorrect && a.userResponse);

        for (const attempt of incorrectAttempts) {
            const correct = attempt.question?.correctAnswer || '';
            const chosen = attempt.userResponse || '';

            if (correct && chosen && areVisuallySimilar(correct, chosen)) {
                const key = `${correct}-${chosen}`;
                if (confusionPairs.has(key)) {
                    confusionPairs.get(key)!.count++;
                } else {
                    confusionPairs.set(key, { correct, chosen, count: 1 });
                }
            }
        }

        const confusedPairsArray = Array.from(confusionPairs.values());
        const detected = confusedPairsArray.some(pair => pair.count >= 3);

        // Determine severity
        let severity: 'low' | 'medium' | 'high' = 'low';
        const totalConfusions = confusedPairsArray.reduce((sum, pair) => sum + pair.count, 0);
        if (totalConfusions >= 10) severity = 'high';
        else if (totalConfusions >= 5) severity = 'medium';

        const recommendation = detected
            ? 'Practice visual discrimination exercises focusing on similar-looking words. Use games that highlight letter differences.'
            : 'No visual confusion detected. Continue current practice.';

        return {
            detected,
            severity,
            confusedPairs: confusedPairsArray,
            recommendation
        };
    }

    /**
     * Detect random guessing pattern
     * Threshold: ≥5 rapid incorrect responses (<2s, <50% accuracy)
     */
    detectRandomGuessing(attempts: (Attempt & { question: { correctAnswer: string } | null })[]): RandomGuessingPattern {
        const rapidIncorrect = attempts.filter(a =>
            !a.isCorrect && a.responseTimeSeconds < 2
        );

        const detected = rapidIncorrect.length >= 5;
        const affectedWords = [...new Set(rapidIncorrect.map(a => a.question?.correctAnswer || ''))];


        const recommendation = detected
            ? 'Encourage child to slow down and think before answering. Use timed exercises with minimum response time requirements.'
            : 'No random guessing detected. Response patterns are thoughtful.';

        return {
            detected,
            instanceCount: rapidIncorrect.length,
            affectedWords,
            recommendation
        };
    }

    /**
     * Detect slow processing pattern
     * Threshold: ≥60% of responses exceed 6 seconds
     */
    detectSlowProcessing(attempts: (Attempt & { question: { correctAnswer: string } | null })[]): SlowProcessingPattern {
        const slowResponses = attempts.filter(a => a.responseTimeSeconds > 6);
        const percentage = (slowResponses.length / attempts.length) * 100;
        const detected = percentage >= 60;

        const avgTime = attempts.reduce((sum, a) => sum + a.responseTimeSeconds, 0) / attempts.length;
        const expectedTime = 4; // Expected average time

        const slowWords = [...new Set(slowResponses.map(a => a.question?.correctAnswer || ''))];

        const recommendation = detected
            ? 'Child may need more time to process. Consider breaking practice into shorter sessions. Use flashcard drills to improve automaticity.'
            : 'Processing speed is appropriate. Continue current pace.';

        return {
            detected,
            avgTime,
            expectedTime,
            slowWords,
            recommendation
        };
    }

    /**
     * Detect inconsistent performance
     * Threshold: Standard deviation >30%
     */
    detectInconsistentPerformance(attempts: (Attempt & { question: { correctAnswer: string } | null })[]): InconsistencyPattern {
        if (attempts.length < 10) {
            return {
                detected: false,
                variance: 0,
                standardDeviation: 0,
                pattern: 'Insufficient data',
                recommendation: 'Complete more attempts for pattern analysis.'
            };
        }

        // Split into batches of 5
        const batchSize = 5;
        const batches: (Attempt & { question: { correctAnswer: string } | null })[][] = [];
        for (let i = 0; i < attempts.length; i += batchSize) {
            batches.push(attempts.slice(i, i + batchSize));
        }

        // Calculate accuracy for each batch
        const batchAccuracies = batches.map(batch => {
            const correct = batch.filter(a => a.isCorrect).length;
            return (correct / batch.length) * 100;
        });

        // Calculate variance and standard deviation
        const mean = batchAccuracies.reduce((sum, val) => sum + val, 0) / batchAccuracies.length;
        const squaredDiffs = batchAccuracies.map(val => Math.pow(val - mean, 2));
        const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / batchAccuracies.length;
        const standardDeviation = Math.sqrt(variance);

        const detected = standardDeviation > 30;

        // Determine pattern
        let pattern = 'Consistent performance';
        if (detected) {
            const firstHalfAvg = batchAccuracies.slice(0, Math.floor(batchAccuracies.length / 2))
                .reduce((sum, val) => sum + val, 0) / Math.floor(batchAccuracies.length / 2);
            const secondHalfAvg = batchAccuracies.slice(Math.floor(batchAccuracies.length / 2))
                .reduce((sum, val) => sum + val, 0) / (batchAccuracies.length - Math.floor(batchAccuracies.length / 2));

            if (firstHalfAvg > secondHalfAvg + 20) {
                pattern = 'Strong start, weak finish (possible fatigue)';
            } else if (secondHalfAvg > firstHalfAvg + 20) {
                pattern = 'Weak start, strong finish (warming up)';
            } else {
                pattern = 'Highly variable performance';
            }
        }

        const recommendation = detected
            ? 'Performance is inconsistent. Consider shorter practice sessions. Monitor for fatigue or attention issues.'
            : 'Performance is consistent. Continue current practice routine.';

        return {
            detected,
            variance,
            standardDeviation,
            pattern,
            recommendation
        };
    }

    /**
     * Detect avoidance behavior
     * Threshold: ≥3 timeouts or rapid incorrect answers on challenging words
     */
    detectAvoidanceBehavior(attempts: (Attempt & { question: { correctAnswer: string } | null })[]): AvoidancePattern {
        const timeouts = attempts.filter(a => a.responseTimeSeconds >= 30);
        const rapidIncorrectOnHard = attempts.filter(a =>
            !a.isCorrect &&
            a.responseTimeSeconds < 2 &&
            a.difficultyLevelAtAttempt >= 2
        );

        const detected = timeouts.length >= 3 || rapidIncorrectOnHard.length >= 3;
        const affectedWords = [...new Set([
            ...timeouts.map(a => a.question?.correctAnswer || ''),
            ...rapidIncorrectOnHard.map(a => a.question?.correctAnswer || '')
        ])];

        const recommendation = detected
            ? 'Child may be avoiding difficult words. Provide encouragement and break down challenging words into smaller parts. Use positive reinforcement.'
            : 'No avoidance behavior detected. Child is engaging with all difficulty levels.';

        return {
            detected,
            timeouts: timeouts.length,
            skips: rapidIncorrectOnHard.length,
            affectedWords,
            recommendation
        };
    }

    /**
     * Detect all error patterns (orchestrator)
     */
    async detectErrorPatterns(attempts: (Attempt & { question: { correctAnswer: string } | null })[]): Promise<ErrorPattern> {
        return {
            visualConfusion: this.detectVisualConfusion(attempts),
            randomGuessing: this.detectRandomGuessing(attempts),
            slowProcessing: this.detectSlowProcessing(attempts),
            inconsistentPerformance: this.detectInconsistentPerformance(attempts),
            avoidanceBehavior: this.detectAvoidanceBehavior(attempts)
        };
    }

    // ============================================
    // WORD CLUSTERING
    // ============================================

    /**
     * Identify word clusters by phonetic patterns
     */
    identifyWordClusters(words: string[]): Map<string, string[]> {
        const clusters = new Map<string, string[]>();

        for (const word of words) {
            const lowerWord = word.toLowerCase();

            // CVC patterns
            if (/^[bcdfghjklmnpqrstvwxyz][aeiou][bcdfghjklmnpqrstvwxyz]$/.test(lowerWord)) {
                const vowel = lowerWord[1];
                const clusterName = `CVC-${vowel}`;
                if (!clusters.has(clusterName)) clusters.set(clusterName, []);
                clusters.get(clusterName)!.push(word);
            }

            // Digraphs (ch, sh, th, wh, ph)
            else if (/ch|sh|th|wh|ph/.test(lowerWord)) {
                const clusterName = 'Digraphs';
                if (!clusters.has(clusterName)) clusters.set(clusterName, []);
                clusters.get(clusterName)!.push(word);
            }

            // Blends (bl, cl, fl, gl, pl, sl, br, cr, dr, fr, gr, pr, tr)
            else if (/^(bl|cl|fl|gl|pl|sl|br|cr|dr|fr|gr|pr|tr)/.test(lowerWord)) {
                const clusterName = 'Blends';
                if (!clusters.has(clusterName)) clusters.set(clusterName, []);
                clusters.get(clusterName)!.push(word);
            }

            // Sight words (common high-frequency words)
            else {
                const clusterName = 'Sight Words';
                if (!clusters.has(clusterName)) clusters.set(clusterName, []);
                clusters.get(clusterName)!.push(word);
            }
        }

        return clusters;
    }

    /**
     * Analyze cluster performance
     */
    async analyzeClusterPerformance(childId: string, skillId: string): Promise<ClusterAnalysis> {
        const wordMasteryList = await this.calculateWordMastery(childId, skillId);
        const words = wordMasteryList.map(w => w.word);
        const clusterMap = this.identifyWordClusters(words);

        const clusters: WordCluster[] = [];
        const weakClusters: WordCluster[] = [];

        for (const [clusterName, clusterWords] of clusterMap.entries()) {
            const clusterMastery = wordMasteryList.filter(w => clusterWords.includes(w.word));
            const avgAccuracy = clusterMastery.reduce((sum, w) => sum + w.masteryPercentage, 0) / clusterMastery.length;
            const avgResponseTime = clusterMastery.reduce((sum, w) => sum + w.avgResponseTime, 0) / clusterMastery.length;

            const recommendation = avgAccuracy < 70
                ? `Focus on ${clusterName} patterns with targeted practice.`
                : `${clusterName} mastery is strong. Continue maintenance practice.`;

            const cluster: WordCluster = {
                clusterName,
                words: clusterWords,
                avgAccuracy,
                avgResponseTime,
                recommendation
            };

            clusters.push(cluster);

            if (avgAccuracy < 70) {
                weakClusters.push(cluster);
            }
        }

        return { clusters, weakClusters };
    }

    // ============================================
    // RECOMMENDATIONS
    // ============================================

    /**
     * Generate game recommendations based on error patterns
     */
    generateGameRecommendations(errorPatterns: ErrorPattern): GameRecommendation[] {
        const recommendations: GameRecommendation[] = [];

        // Visual confusion → Visual discrimination games
        if (errorPatterns.visualConfusion.detected) {
            recommendations.push({
                gameName: 'Word Detective',
                gameType: 'matching',
                targetWords: errorPatterns.visualConfusion.confusedPairs.map(p => p.correct),
                reason: 'Helps distinguish between visually similar words',
                priority: errorPatterns.visualConfusion.severity === 'high' ? 'high' : 'medium',
                estimatedDuration: 10
            });
        }

        // Random guessing → Meaning-focused games
        if (errorPatterns.randomGuessing.detected) {
            recommendations.push({
                gameName: 'Picture Match',
                gameType: 'context',
                targetWords: errorPatterns.randomGuessing.affectedWords,
                reason: 'Encourages thoughtful responses by connecting words to meanings',
                priority: 'high',
                estimatedDuration: 15
            });
        }

        // Slow processing → Timed flashcard drills
        if (errorPatterns.slowProcessing.detected) {
            recommendations.push({
                gameName: 'Speed Reader',
                gameType: 'flashcard',
                targetWords: errorPatterns.slowProcessing.slowWords,
                reason: 'Builds automaticity and faster word recognition',
                priority: 'medium',
                estimatedDuration: 8
            });
        }

        // Inconsistent performance → Mixed review
        if (errorPatterns.inconsistentPerformance.detected) {
            recommendations.push({
                gameName: 'Mixed Review Challenge',
                gameType: 'matching',
                targetWords: [],
                reason: 'Varied practice to maintain consistent performance',
                priority: 'medium',
                estimatedDuration: 12
            });
        }

        // Avoidance behavior → Confidence-building games
        if (errorPatterns.avoidanceBehavior.detected) {
            recommendations.push({
                gameName: 'Word Builder',
                gameType: 'spelling',
                targetWords: errorPatterns.avoidanceBehavior.affectedWords,
                reason: 'Breaks down challenging words to build confidence',
                priority: 'high',
                estimatedDuration: 10
            });
        }

        return recommendations;
    }

    /**
     * Calculate spaced repetition schedule
     */
    calculateRepetitionSchedule(wordMasteryList: WordMastery[]): RepetitionSchedule[] {
        const schedule: RepetitionSchedule[] = [];
        const now = new Date();

        for (const word of wordMasteryList) {
            let nextReviewDate: Date;
            let frequency: 'daily' | 'every-2-days' | 'weekly';
            let priority: number;

            // Struggling words (0-50% accuracy): Daily repetition
            if (word.masteryPercentage < 50) {
                nextReviewDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Tomorrow
                frequency = 'daily';
                priority = 10;
            }
            // Developing words (51-80% accuracy): Every 2-3 days
            else if (word.masteryPercentage < 80) {
                nextReviewDate = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000); // 2 days
                frequency = 'every-2-days';
                priority = 6;
            }
            // Proficient words (81-95% accuracy): Weekly
            else if (word.masteryPercentage < 96) {
                nextReviewDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 1 week
                frequency = 'weekly';
                priority = 3;
            }
            // Mastered words (96-100% accuracy): Bi-weekly maintenance
            else {
                nextReviewDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 2 weeks
                frequency = 'weekly';
                priority = 1;
            }

            schedule.push({
                word: word.word,
                nextReviewDate,
                frequency,
                priority
            });
        }

        // Sort by priority (highest first)
        return schedule.sort((a, b) => b.priority - a.priority);
    }

    // ============================================
    // REPORTING
    // ============================================

    /**
     * Generate comprehensive detailed report
     */
    async generateDetailedReport(childId: string, sessionId: string): Promise<DetailedReport> {
        // Get session data
        const session = await prisma.session.findUnique({
            where: { id: sessionId },
            include: {
                attempts: {
                    include: {
                        question: true,
                        microSkill: true
                    }
                },
                child: true
            }
        });

        if (!session) {
            throw new Error('Session not found');
        }

        const skillId = session.attempts[0]?.microSkillId;
        if (!skillId) {
            throw new Error('No skill found for session');
        }

        // Calculate all analytics
        const wordMasteryList = await this.calculateWordMastery(childId, skillId);
        const listReadiness = await this.calculateListReadiness(childId, skillId);
        const errorPatterns = await this.detectErrorPatterns(session.attempts);
        const clusterAnalysis = await this.analyzeClusterPerformance(childId, skillId);
        const gameRecommendations = this.generateGameRecommendations(errorPatterns);
        const repetitionSchedule = this.calculateRepetitionSchedule(wordMasteryList);

        // Categorize words by mastery level
        const mastered = wordMasteryList.filter(w => w.masteryPercentage >= 96);
        const proficient = wordMasteryList.filter(w => w.masteryPercentage >= 80 && w.masteryPercentage < 96);
        const developing = wordMasteryList.filter(w => w.masteryPercentage >= 50 && w.masteryPercentage < 80);
        const struggling = wordMasteryList.filter(w => w.masteryPercentage < 50);

        // Calculate metrics
        const totalAttempts = session.attempts.length;
        const correctAttempts = session.attempts.filter(a => a.isCorrect).length;
        const accuracy = (correctAttempts / totalAttempts) * 100;
        const avgResponseTime = session.attempts.reduce((sum, a) => sum + a.responseTimeSeconds, 0) / totalAttempts;

        // Response time distribution
        const fast = session.attempts.filter(a => a.responseTimeSeconds < 3).length;
        const normal = session.attempts.filter(a => a.responseTimeSeconds >= 3 && a.responseTimeSeconds <= 6).length;
        const slow = session.attempts.filter(a => a.responseTimeSeconds > 6).length;

        // Error type breakdown
        const errorTypeBreakdown: Record<string, number> = {};
        session.attempts.forEach(a => {
            if (a.errorType) {
                errorTypeBreakdown[a.errorType] = (errorTypeBreakdown[a.errorType] || 0) + 1;
            }
        });

        // Get trends (placeholder - would need historical data)
        const trends: PerformanceTrend = {
            accuracyOverTime: [],
            responseTimeOverTime: [],
            masteryProgression: []
        };

        // Generate focus areas
        const focusAreas: string[] = [];
        if (errorPatterns.visualConfusion.detected) {
            focusAreas.push('Practice distinguishing visually similar words');
        }
        if (errorPatterns.randomGuessing.detected) {
            focusAreas.push('Slow down and think before answering');
        }
        if (errorPatterns.slowProcessing.detected) {
            focusAreas.push('Build automaticity with flashcard drills');
        }
        if (clusterAnalysis.weakClusters.length > 0) {
            focusAreas.push(`Focus on ${clusterAnalysis.weakClusters.map(c => c.clusterName).join(', ')}`);
        }

        // Generate interventions
        const interventions: string[] = [];
        if (listReadiness.riskIndicator === 'High') {
            interventions.push('Schedule one-on-one tutoring sessions');
            interventions.push('Use multisensory learning approaches');
            interventions.push('Break practice into shorter, more frequent sessions');
        } else if (listReadiness.riskIndicator === 'Medium') {
            interventions.push('Provide guided practice with immediate feedback');
            interventions.push('Use visual aids and manipulatives');
        }

        return {
            summary: {
                childId,
                childName: session.child?.name || '',
                skillName: session.attempts[0]?.microSkill?.name || '',
                skillCode: session.attempts[0]?.microSkill?.code || '',
                completedDate: new Date(),
                masteryLevel: listReadiness.tierLabel,
                readinessScore: listReadiness.readinessScore,
                riskIndicator: listReadiness.riskIndicator,
                tier: listReadiness.tier,
                tierLabel: listReadiness.tierLabel,
                keyAchievements: mastered.map(w => `Mastered "${w.word}"`)
            },
            wordAnalysis: {
                mastered,
                proficient,
                developing,
                struggling,
                clusterAnalysis
            },
            errorPatterns,
            trends,
            recommendations: {
                nextSkill: null, // Would be populated by quiz-review-service
                recommendedGames: gameRecommendations,
                focusAreas,
                repetitionSchedule,
                interventions
            },
            dataSummary: {
                totalAttempts,
                correctAttempts,
                accuracy,
                avgResponseTime,
                responseTimeDistribution: { fast, normal, slow },
                errorTypeBreakdown,
                levelTransitions: [] // Would be populated from session data
            }
        };
    }
}

export default new ResultsAnalyticsService();

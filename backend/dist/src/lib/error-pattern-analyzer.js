"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIAnalyticsService = exports.ErrorPatternAnalyzer = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
/**
 * Error Pattern Analyzer
 * Analyzes user responses to detect specific error patterns for LD screening
 */
class ErrorPatternAnalyzer {
    /**
     * Analyze an attempt and determine the error type
     */
    static analyzeAttempt(correctAnswer, userResponse, context) {
        if (!userResponse || userResponse === correctAnswer) {
            return client_1.ErrorType.NONE;
        }
        // Visual confusion detection (b/d, p/q, m/n, u/n)
        if (this.hasVisualConfusion(correctAnswer, userResponse)) {
            return this.detectConfusionType(correctAnswer, userResponse);
        }
        // Contextual error detection (Reading stage)
        if (context?.stage === 'Reading' && context?.sentence) {
            if (this.isContextualError(correctAnswer, userResponse, context.sentence)) {
                return client_1.ErrorType.CONTEXTUAL_ERROR;
            }
        }
        // Spelling error detection (Spelling stage)
        if (context?.stage === 'Spelling') {
            if (this.isSpellingReversal(correctAnswer, userResponse)) {
                return client_1.ErrorType.SPELLING_REVERSAL;
            }
            if (this.isSpellingOmission(correctAnswer, userResponse)) {
                return client_1.ErrorType.SPELLING_OMISSION;
            }
            if (this.hasLetterSequencingError(correctAnswer, userResponse)) {
                return client_1.ErrorType.SEQUENCING_ERROR;
            }
        }
        return client_1.ErrorType.OTHER;
    }
    /**
     * Check if there's visual confusion between letters
     */
    static hasVisualConfusion(correct, response) {
        const confusionPairs = [
            ['b', 'd'], ['d', 'b'],
            ['p', 'q'], ['q', 'p'],
            ['m', 'n'], ['n', 'm'],
            ['u', 'n'], ['n', 'u']
        ];
        for (const [letter1, letter2] of confusionPairs) {
            if (correct.includes(letter1) && response.includes(letter2)) {
                return true;
            }
        }
        return false;
    }
    /**
     * Detect specific confusion type
     */
    static detectConfusionType(correct, response) {
        if ((correct.includes('b') && response.includes('d')) || (correct.includes('d') && response.includes('b'))) {
            return client_1.ErrorType.B_D_CONFUSION;
        }
        if ((correct.includes('p') && response.includes('q')) || (correct.includes('q') && response.includes('p'))) {
            return client_1.ErrorType.P_Q_CONFUSION;
        }
        if ((correct.includes('m') && response.includes('n')) || (correct.includes('n') && response.includes('m'))) {
            return client_1.ErrorType.M_N_CONFUSION;
        }
        if ((correct.includes('u') && response.includes('n')) || (correct.includes('n') && response.includes('u'))) {
            return client_1.ErrorType.U_N_CONFUSION;
        }
        return client_1.ErrorType.OTHER;
    }
    /**
     * Check if error is contextual (grammatically correct but semantically wrong)
     */
    static isContextualError(correct, response, sentence) {
        // Simple check: if the response makes grammatical sense in the sentence
        // but is not the correct answer
        const testSentence = sentence.replace('___', response);
        // Basic heuristic: if response is a valid word from our word list and makes sense
        // This is a simplified version - could be enhanced with NLP
        return response.length > 1 && response !== correct;
    }
    /**
     * Check if spelling has letter reversal
     */
    static isSpellingReversal(correct, response) {
        if (correct.length !== response.length)
            return false;
        // Check if all letters are present but in wrong order
        const correctSorted = correct.split('').sort().join('');
        const responseSorted = response.split('').sort().join('');
        return correctSorted === responseSorted && correct !== response;
    }
    /**
     * Check if spelling has letter omission
     */
    static isSpellingOmission(correct, response) {
        if (response.length >= correct.length)
            return false;
        // Check if response is a subset of correct letters
        let correctIndex = 0;
        for (const char of response) {
            const found = correct.indexOf(char, correctIndex);
            if (found === -1)
                return false;
            correctIndex = found + 1;
        }
        return true;
    }
    /**
     * Check for letter sequencing errors
     */
    static hasLetterSequencingError(correct, response) {
        // Check if letters are in wrong sequence but all present
        return this.isSpellingReversal(correct, response);
    }
    /**
     * Detect learning patterns from attempts
     */
    static detectLearningPattern(attempts) {
        if (attempts.length < 5)
            return 'stable';
        const recentAttempts = attempts.slice(-10);
        const olderAttempts = attempts.slice(0, -10);
        // Random guessing: fast incorrect responses
        const fastIncorrect = recentAttempts.filter(a => !a.isCorrect && a.responseTimeSeconds < 2).length;
        if (fastIncorrect / recentAttempts.length > 0.4) {
            return 'random_guessing';
        }
        // Avoidance: very fast responses
        const veryFast = recentAttempts.filter(a => a.responseTimeSeconds < 1).length;
        if (veryFast / recentAttempts.length > 0.3) {
            return 'avoidance';
        }
        // Inconsistent: high variance
        const recentAccuracy = recentAttempts.filter(a => a.isCorrect).length / recentAttempts.length;
        const olderAccuracy = olderAttempts.length > 0
            ? olderAttempts.filter(a => a.isCorrect).length / olderAttempts.length
            : recentAccuracy;
        if (Math.abs(recentAccuracy - olderAccuracy) > 0.3) {
            return 'inconsistent';
        }
        // Improving/declining
        if (recentAccuracy > olderAccuracy + 0.1)
            return 'improving';
        if (recentAccuracy < olderAccuracy - 0.1)
            return 'declining';
        return 'stable';
    }
    /**
     * Check if processing is slow
     */
    static hasSlowProcessing(attempts) {
        if (attempts.length < 5)
            return false;
        const avgResponseTime = attempts.reduce((sum, a) => sum + a.responseTimeSeconds, 0) / attempts.length;
        return avgResponseTime > 10;
    }
}
exports.ErrorPatternAnalyzer = ErrorPatternAnalyzer;
/**
 * AI Analytics Service
 * Provides AI-driven insights and recommendations
 */
class AIAnalyticsService {
    /**
     * Identify weak word clusters
     */
    static async identifyWeakClusters(childId, skillId) {
        const wordMastery = await prisma.wordMastery.findMany({
            where: {
                childId,
                microSkillId: skillId,
                accuracyPercentage: { lt: 60 }
            }
        });
        // Group by patterns
        const clusters = new Map();
        for (const wm of wordMastery) {
            const word = wm.word;
            // Pattern: word length
            const lengthKey = `${word.length}-letter words`;
            if (!clusters.has(lengthKey))
                clusters.set(lengthKey, []);
            clusters.get(lengthKey).push(word);
            // Pattern: starting letter
            const startKey = `words starting with '${word[0]}'`;
            if (!clusters.has(startKey))
                clusters.set(startKey, []);
            clusters.get(startKey).push(word);
            // Pattern: vowel patterns
            const vowels = word.match(/[aeiou]/gi);
            if (vowels && vowels.length > 0) {
                const vowelKey = `words with ${vowels.length} vowels`;
                if (!clusters.has(vowelKey))
                    clusters.set(vowelKey, []);
                clusters.get(vowelKey).push(word);
            }
        }
        // Convert to array and calculate metrics
        const result = Array.from(clusters.entries())
            .filter(([_, words]) => words.length >= 3) // Only clusters with 3+ words
            .map(([pattern, words]) => ({
            commonPattern: pattern,
            words: words,
            avgAccuracy: Math.round(wordMastery
                .filter(wm => words.includes(wm.word))
                .reduce((sum, wm) => sum + wm.accuracyPercentage, 0) / words.length),
            recommendedFocus: this.getRecommendation(pattern)
        }));
        return result;
    }
    /**
     * Get recommendation based on pattern
     */
    static getRecommendation(pattern) {
        if (pattern.includes('letter words'))
            return 'Practice word length recognition';
        if (pattern.includes('starting with'))
            return 'Focus on initial letter sounds';
        if (pattern.includes('vowels'))
            return 'Strengthen vowel recognition';
        return 'General reinforcement needed';
    }
    /**
     * Calculate readiness score (weighted average of all 5 stages)
     */
    static async calculateReadinessScore(childId) {
        const stages = [
            { code: 'RF.ALL.1', weight: 0.15 }, // Recognition
            { code: 'RF.ALL.2', weight: 0.20 }, // Meaning
            { code: 'RF.ALL.3', weight: 0.20 }, // Recall
            { code: 'RF.ALL.4', weight: 0.25 }, // Reading
            { code: 'RF.ALL.5', weight: 0.20 } // Spelling
        ];
        let totalScore = 0;
        let totalWeight = 0;
        for (const stage of stages) {
            const skill = await prisma.microSkill.findFirst({
                where: { code: stage.code }
            });
            if (!skill)
                continue;
            const progress = await prisma.skillProgress.findFirst({
                where: {
                    childId,
                    microSkillId: skill.id
                }
            });
            if (progress) {
                totalScore += progress.accuracyPercentage * stage.weight;
                totalWeight += stage.weight;
            }
        }
        return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
    }
    /**
     * Generate strength and struggling words
     */
    static async generateWordLists(childId, skillId) {
        const wordMastery = await prisma.wordMastery.findMany({
            where: { childId, microSkillId: skillId }
        });
        const strengthWords = wordMastery
            .filter(wm => wm.accuracyPercentage >= 85)
            .map(wm => wm.word)
            .slice(0, 10);
        const strugglingWords = wordMastery
            .filter(wm => wm.accuracyPercentage < 60)
            .sort((a, b) => a.accuracyPercentage - b.accuracyPercentage)
            .map(wm => wm.word)
            .slice(0, 10);
        return { strengthWords, strugglingWords };
    }
    /**
     * Generate personalized insights
     */
    static async generateInsights(childId, skillId) {
        const insights = [];
        // Get progress across all stages
        const allStages = await prisma.skillProgress.findMany({
            where: { childId },
            include: { microSkill: true }
        });
        const rfStages = allStages.filter(s => s.microSkill.code.startsWith('RF.ALL'));
        if (rfStages.length > 0) {
            const avgAccuracy = rfStages.reduce((sum, s) => sum + s.accuracyPercentage, 0) / rfStages.length;
            if (avgAccuracy >= 85) {
                insights.push('Excellent overall performance! Child is mastering sight words.');
            }
            else if (avgAccuracy >= 70) {
                insights.push('Good progress! Continue regular practice for mastery.');
            }
            else if (avgAccuracy >= 50) {
                insights.push('Child is developing skills but needs more reinforcement.');
            }
            else {
                insights.push('Child is struggling and may benefit from intervention.');
            }
            // Stage-specific insights
            const recognition = rfStages.find(s => s.microSkill.code === 'RF.ALL.1');
            const spelling = rfStages.find(s => s.microSkill.code === 'RF.ALL.5');
            if (recognition && spelling) {
                if (recognition.accuracyPercentage > spelling.accuracyPercentage + 20) {
                    insights.push('Strong recognition but struggles with spelling - focus on letter sequencing.');
                }
                else if (spelling.accuracyPercentage > recognition.accuracyPercentage + 20) {
                    insights.push('Good spelling skills but needs more word recognition practice.');
                }
            }
        }
        // Check for error patterns
        const recentAttempts = await prisma.attempt.findMany({
            where: { childId, microSkillId: skillId },
            orderBy: { createdAt: 'desc' },
            take: 20
        });
        const visualErrorTypes = [
            client_1.ErrorType.B_D_CONFUSION,
            client_1.ErrorType.P_Q_CONFUSION,
            client_1.ErrorType.M_N_CONFUSION,
            client_1.ErrorType.U_N_CONFUSION
        ];
        const visualErrors = recentAttempts.filter(a => visualErrorTypes.includes(a.errorType)).length;
        if (visualErrors / recentAttempts.length > 0.3) {
            insights.push('High rate of visual confusion errors - recommend dyslexia screening.');
        }
        return insights;
    }
}
exports.AIAnalyticsService = AIAnalyticsService;
exports.default = { ErrorPatternAnalyzer, AIAnalyticsService };

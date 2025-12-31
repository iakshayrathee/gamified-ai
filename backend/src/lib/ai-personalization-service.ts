/**
 * AI Personalization Service
 * 
 * Provides AI-powered analysis and personalized recommendations using OpenAI
 * - Analyzes answer patterns and learning trends
 * - Generates personalized insights and recommendations
 * - Identifies weak areas (phonics, CVC, sight words)
 * - Suggests teacher interventions
 * - Recommends next skills based on mastery and learning patterns
 */

import { PrismaClient, Attempt, MicroSkill, ErrorType } from '@prisma/client';
import OpenAIService from './openai-service';

const prisma = new PrismaClient();
const openaiService = OpenAIService;

// ============================================
// TYPES & INTERFACES
// ============================================

export interface AnswerPatternAnalysis {
    patterns: string[];
    recommendations: string[];
    teacherInterventions: string[];
    confusionAreas: string[];
}

export interface WeakAreaAnalysis {
    phonics: { score: number; issues: string[] };
    cvc: { score: number; issues: string[] };
    sightWords: { score: number; issues: string[] };
    recommendations: string[];
}

export interface NextSkillRecommendation {
    nextSkillId: string | null;
    nextSkillName: string | null;
    reason: string;
    confidence: number;
}

export interface PersonalizedInsights {
    masteryLevel: 'beginner' | 'developing' | 'proficient' | 'mastered';
    weakAreas: string[];
    strengths: string[];
    confusionPatterns: string[];
    recommendedFocus: string[];
    learningTrend: 'improving' | 'stable' | 'declining';
}

// ============================================
// AI PERSONALIZATION SERVICE
// ============================================

export class AIPersonalizationService {
    /**
     * Analyzes answer patterns using AI
     * Identifies trends, confusion patterns, and provides recommendations
     */
    static async analyzeAnswerPatterns(
        childId: string,
        skillId: string,
        attempts: Attempt[]
    ): Promise<AnswerPatternAnalysis> {
        if (attempts.length === 0) {
            return {
                patterns: [],
                recommendations: ['Complete more attempts to generate insights'],
                teacherInterventions: [],
                confusionAreas: []
            };
        }

        // Prepare data for AI analysis
        const attemptSummary = attempts.map((a, idx) => ({
            attempt: idx + 1,
            correct: a.isCorrect,
            time: a.responseTimeSeconds,
            errorType: a.errorType,
            userResponse: a.userResponse,
            hintUsed: a.hintUsed
        }));

        const accuracy = (attempts.filter(a => a.isCorrect).length / attempts.length) * 100;
        const avgTime = attempts.reduce((sum, a) => sum + a.responseTimeSeconds, 0) / attempts.length;
        const confusionErrors = attempts.filter(a =>
            a.errorType !== ErrorType.NONE && a.errorType !== ErrorType.OTHER
        );

        const prompt = `You are an expert literacy educator analyzing a child's learning patterns.

Attempt Data:
${JSON.stringify(attemptSummary, null, 2)}

Performance Metrics:
- Accuracy: ${accuracy.toFixed(1)}%
- Average Response Time: ${avgTime.toFixed(1)}s
- Confusion Errors: ${confusionErrors.length}/${attempts.length}

Analyze this data and provide:
1. Key patterns observed (e.g., "struggles with similar-looking letters", "improves with practice")
2. Specific recommendations for the child (actionable, encouraging)
3. Teacher intervention suggestions (if needed)
4. Confusion areas identified (e.g., "b/d confusion", "vowel sounds")

Format your response as JSON:
{
  "patterns": ["pattern1", "pattern2"],
  "recommendations": ["rec1", "rec2"],
  "teacherInterventions": ["intervention1"],
  "confusionAreas": ["area1"]
}`;

        try {
            const aiResponse = await openaiService.generateTextResponse(prompt, 'You are an expert literacy educator analyzing a child\'s learning patterns. Return valid JSON.');

            // Extract JSON from response
            const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        } catch (error) {
            console.error('AI analysis error:', error);
        }

        // Fallback to rule-based analysis
        return this.ruleBasedPatternAnalysis(attempts, accuracy, avgTime);
    }

    /**
     * Generates personalized insights for a child's skill performance
     */
    static async generatePersonalizedInsights(
        childId: string,
        skillId: string,
        attempts: Attempt[]
    ): Promise<PersonalizedInsights> {
        if (attempts.length === 0) {
            return {
                masteryLevel: 'beginner',
                weakAreas: [],
                strengths: [],
                confusionPatterns: [],
                recommendedFocus: ['Start practicing to build skills'],
                learningTrend: 'stable'
            };
        }

        const accuracy = (attempts.filter(a => a.isCorrect).length / attempts.length) * 100;
        const avgTime = attempts.reduce((sum, a) => sum + a.responseTimeSeconds, 0) / attempts.length;

        // Determine mastery level
        let masteryLevel: 'beginner' | 'developing' | 'proficient' | 'mastered' = 'beginner';
        if (accuracy >= 90 && avgTime <= 3) masteryLevel = 'mastered';
        else if (accuracy >= 80 && avgTime <= 4) masteryLevel = 'proficient';
        else if (accuracy >= 60) masteryLevel = 'developing';

        // Detect learning trend
        const learningTrend = this.detectLearningTrend(attempts);

        // Identify confusion patterns
        const confusionPatterns = this.identifyConfusionPatterns(attempts);

        // Identify strengths and weaknesses
        const strengths: string[] = [];
        const weakAreas: string[] = [];

        if (accuracy >= 80) strengths.push('High accuracy');
        if (avgTime <= 3) strengths.push('Fast response time');
        if (attempts.filter(a => !a.hintUsed && a.isCorrect).length > attempts.length * 0.7) {
            strengths.push('Independent problem solving');
        }

        if (accuracy < 60) weakAreas.push('Accuracy needs improvement');
        if (avgTime > 6) weakAreas.push('Response time is slow');
        if (confusionPatterns.length > 0) weakAreas.push('Letter confusion detected');

        // Generate recommended focus areas
        const recommendedFocus = this.generateFocusAreas(masteryLevel, weakAreas, confusionPatterns);

        return {
            masteryLevel,
            weakAreas,
            strengths,
            confusionPatterns,
            recommendedFocus,
            learningTrend
        };
    }

    /**
     * Recommends the next skill based on current performance and AI analysis
     */
    static async recommendNextSkill(
        childId: string,
        currentSkillId: string,
        masteryData: { mastered: boolean; accuracy: number; avgTime: number }
    ): Promise<NextSkillRecommendation> {
        // Get current skill
        const currentSkill = await prisma.microSkill.findUnique({
            where: { id: currentSkillId },
            include: { domain: true }
        });

        if (!currentSkill) {
            return {
                nextSkillId: null,
                nextSkillName: null,
                reason: 'Current skill not found',
                confidence: 0
            };
        }

        // If not mastered, recommend continuing current skill
        if (!masteryData.mastered) {
            return {
                nextSkillId: currentSkillId,
                nextSkillName: currentSkill.name,
                reason: 'Continue practicing to achieve mastery',
                confidence: 1.0
            };
        }

        // Get next skills from prerequisite chain
        const nextSkills = currentSkill.nextSkills as string[];
        if (nextSkills && nextSkills.length > 0) {
            const nextSkillCode = nextSkills[0];
            const nextSkill = await prisma.microSkill.findFirst({
                where: { code: nextSkillCode }
            });

            if (nextSkill) {
                return {
                    nextSkillId: nextSkill.id,
                    nextSkillName: nextSkill.name,
                    reason: `Excellent work! Ready to advance to ${nextSkill.name}`,
                    confidence: 0.95
                };
            }
        }

        // Find next skill in same domain
        const domainSkills = await prisma.microSkill.findMany({
            where: { domainId: currentSkill.domainId },
            orderBy: { code: 'asc' }
        });

        const currentIndex = domainSkills.findIndex(s => s.id === currentSkillId);
        if (currentIndex >= 0 && currentIndex < domainSkills.length - 1) {
            const nextSkill = domainSkills[currentIndex + 1];
            return {
                nextSkillId: nextSkill.id,
                nextSkillName: nextSkill.name,
                reason: `Great progress! Try ${nextSkill.name} next`,
                confidence: 0.85
            };
        }

        return {
            nextSkillId: null,
            nextSkillName: null,
            reason: 'Congratulations! You have completed this learning path',
            confidence: 1.0
        };
    }

    /**
     * Identifies weak areas across phonics, CVC, and sight words
     */
    static async identifyWeakAreas(
        childId: string,
        attempts: Attempt[]
    ): Promise<WeakAreaAnalysis> {
        // Group attempts by skill type (based on domain/skill codes)
        const skillIds = [...new Set(attempts.map(a => a.microSkillId))];
        const skills = await prisma.microSkill.findMany({
            where: { id: { in: skillIds } },
            include: { domain: true }
        });

        const phonicsAttempts = attempts.filter(a => {
            const skill = skills.find(s => s.id === a.microSkillId);
            return skill?.domain.code === 'A' || skill?.code.startsWith('A.');
        });

        const cvcAttempts = attempts.filter(a => {
            const skill = skills.find(s => s.id === a.microSkillId);
            return skill?.code.includes('CVC') || skill?.domain.code === 'C';
        });

        const sightWordAttempts = attempts.filter(a => {
            const skill = skills.find(s => s.id === a.microSkillId);
            return skill?.code.includes('SIGHT') || skill?.domain.code === 'S';
        });

        const calculateScore = (atts: Attempt[]) => {
            if (atts.length === 0) return 100;
            return (atts.filter(a => a.isCorrect).length / atts.length) * 100;
        };

        const identifyIssues = (atts: Attempt[], type: string) => {
            const issues: string[] = [];
            const accuracy = calculateScore(atts);

            if (accuracy < 60) issues.push(`Low ${type} accuracy`);

            const confusionErrors = atts.filter(a =>
                a.errorType !== ErrorType.NONE && a.errorType !== ErrorType.OTHER
            );
            if (confusionErrors.length > atts.length * 0.3) {
                issues.push(`Frequent ${type} confusion errors`);
            }

            const slowResponses = atts.filter(a => a.responseTimeSeconds > 6);
            if (slowResponses.length > atts.length * 0.5) {
                issues.push(`Slow ${type} response time`);
            }

            return issues;
        };

        const recommendations: string[] = [];
        const phonicsScore = calculateScore(phonicsAttempts);
        const cvcScore = calculateScore(cvcAttempts);
        const sightWordScore = calculateScore(sightWordAttempts);

        if (phonicsScore < 70) recommendations.push('Focus on phonics practice with letter-sound associations');
        if (cvcScore < 70) recommendations.push('Practice CVC word blending and segmentation');
        if (sightWordScore < 70) recommendations.push('Increase sight word recognition practice');

        return {
            phonics: { score: phonicsScore, issues: identifyIssues(phonicsAttempts, 'phonics') },
            cvc: { score: cvcScore, issues: identifyIssues(cvcAttempts, 'CVC') },
            sightWords: { score: sightWordScore, issues: identifyIssues(sightWordAttempts, 'sight word') },
            recommendations
        };
    }

    // ============================================
    // HELPER METHODS
    // ============================================

    /**
     * Detects learning trend from attempt history
     */
    private static detectLearningTrend(attempts: Attempt[]): 'improving' | 'stable' | 'declining' {
        if (attempts.length < 6) return 'stable';

        const firstHalf = attempts.slice(0, Math.floor(attempts.length / 2));
        const secondHalf = attempts.slice(Math.floor(attempts.length / 2));

        const firstAccuracy = (firstHalf.filter(a => a.isCorrect).length / firstHalf.length) * 100;
        const secondAccuracy = (secondHalf.filter(a => a.isCorrect).length / secondHalf.length) * 100;

        const diff = secondAccuracy - firstAccuracy;

        if (diff > 10) return 'improving';
        if (diff < -10) return 'declining';
        return 'stable';
    }

    /**
     * Identifies specific confusion patterns
     */
    private static identifyConfusionPatterns(attempts: Attempt[]): string[] {
        const patterns: string[] = [];
        const confusionCounts: Record<string, number> = {};

        attempts.forEach(a => {
            if (a.errorType !== ErrorType.NONE && a.errorType !== ErrorType.OTHER) {
                confusionCounts[a.errorType] = (confusionCounts[a.errorType] || 0) + 1;
            }
        });

        Object.entries(confusionCounts).forEach(([type, count]) => {
            if (count >= 2) {
                const readable = type.replace(/_/g, '/').toLowerCase();
                patterns.push(`${readable} confusion`);
            }
        });

        return patterns;
    }

    /**
     * Generates focus areas based on mastery level and weaknesses
     */
    private static generateFocusAreas(
        masteryLevel: string,
        weakAreas: string[],
        confusionPatterns: string[]
    ): string[] {
        const focus: string[] = [];

        if (masteryLevel === 'beginner') {
            focus.push('Build foundational skills with easier questions');
            focus.push('Practice regularly to improve accuracy');
        } else if (masteryLevel === 'developing') {
            focus.push('Continue practicing to reach proficiency');
            if (confusionPatterns.length > 0) {
                focus.push(`Work on ${confusionPatterns[0]}`);
            }
        } else if (masteryLevel === 'proficient') {
            focus.push('Challenge yourself with harder questions');
            focus.push('Aim for faster response times');
        } else {
            focus.push('Excellent work! Ready for advanced skills');
        }

        return focus;
    }

    /**
     * Rule-based fallback for pattern analysis
     */
    private static ruleBasedPatternAnalysis(
        attempts: Attempt[],
        accuracy: number,
        avgTime: number
    ): AnswerPatternAnalysis {
        const patterns: string[] = [];
        const recommendations: string[] = [];
        const teacherInterventions: string[] = [];
        const confusionAreas: string[] = [];

        // Analyze patterns
        if (accuracy >= 80) patterns.push('Demonstrates strong understanding');
        else if (accuracy >= 60) patterns.push('Shows developing skills');
        else patterns.push('Needs additional support');

        if (avgTime < 3) patterns.push('Quick response time');
        else if (avgTime > 6) patterns.push('Takes time to process questions');

        // Generate recommendations
        if (accuracy < 70) {
            recommendations.push('Practice more frequently');
            recommendations.push('Review foundational concepts');
        }
        if (avgTime > 6) {
            recommendations.push('Take your time - accuracy is more important than speed');
        }

        // Teacher interventions
        if (accuracy < 50) {
            teacherInterventions.push('Schedule one-on-one instruction');
            teacherInterventions.push('Use multisensory learning approaches');
        }

        // Confusion areas
        const confusionErrors = attempts.filter(a =>
            a.errorType !== ErrorType.NONE && a.errorType !== ErrorType.OTHER
        );
        if (confusionErrors.length > 0) {
            const errorTypes = [...new Set(confusionErrors.map(a => a.errorType))];
            errorTypes.forEach(type => {
                confusionAreas.push(type.replace(/_/g, '/').toLowerCase());
            });
        }

        return { patterns, recommendations, teacherInterventions, confusionAreas };
    }
}

export default AIPersonalizationService;

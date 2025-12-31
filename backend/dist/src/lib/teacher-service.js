"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeacherService = void 0;
const client_1 = require("@prisma/client");
const openai_service_1 = __importDefault(require("./openai-service"));
const prisma = new client_1.PrismaClient();
const ai = openai_service_1.default;
/**
 * Teacher Service
 * Provides teacher-specific operations for student progress tracking and reporting
 */
class TeacherService {
    /**
     * Get recent quiz reviews for a student
     */
    async getStudentQuizReviews(childId, limit = 10) {
        try {
            const reviews = await prisma.quizReview.findMany({
                where: { childId },
                include: {
                    skill: {
                        select: {
                            name: true,
                            code: true
                        }
                    },
                    recommendedSkill: {
                        select: {
                            name: true,
                            code: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                take: limit
            });
            return reviews.map(review => ({
                id: review.id,
                sessionId: review.sessionId,
                skillName: review.skill.name,
                skillCode: review.skill.code,
                createdAt: review.createdAt,
                overallPerformance: review.overallPerformance,
                strengths: review.strengths,
                areasToImprove: review.areasToImprove,
                specificFeedback: review.specificFeedback,
                encouragement: review.encouragement,
                confusionPatterns: review.confusionPatterns,
                accuracy: review.accuracy,
                totalAttempts: review.totalAttempts,
                correctAttempts: review.correctAttempts,
                avgResponseTime: review.avgResponseTime,
                recommendedSkillName: review.recommendedSkill?.name,
                recommendedSkillCode: review.recommendedSkill?.code,
                recommendedReason: review.recommendedReason || undefined
            }));
        }
        catch (error) {
            console.error('Error fetching student quiz reviews:', error);
            throw error;
        }
    }
    /**
     * Get comprehensive student progress data
     */
    async getStudentDetailedProgress(childId) {
        try {
            // Get student info
            const student = await prisma.user.findUnique({
                where: { id: childId },
                select: { id: true, name: true }
            });
            if (!student) {
                throw new Error('Student not found');
            }
            // Get quiz reviews
            const quizReviews = await this.getStudentQuizReviews(childId, 20);
            // Get skill progress
            const skillProgress = await prisma.skillProgress.findMany({
                where: { childId },
                include: {
                    microSkill: {
                        include: {
                            domain: true
                        }
                    }
                },
                orderBy: { lastAttemptedAt: 'desc' }
            });
            // Calculate overall stats
            const totalQuizzes = quizReviews.length;
            const averageAccuracy = quizReviews.length > 0
                ? quizReviews.reduce((sum, r) => sum + r.accuracy, 0) / quizReviews.length
                : 0;
            const skillsMastered = skillProgress.filter(sp => sp.masteryStatus === 'MASTERED').length;
            const skillsInProgress = skillProgress.filter(sp => sp.masteryStatus === 'IN_PROGRESS').length;
            const totalAttempts = skillProgress.reduce((sum, sp) => sum + sp.totalAttempts, 0);
            const avgResponseTime = skillProgress.length > 0
                ? skillProgress.reduce((sum, sp) => sum + sp.avgResponseTime, 0) / skillProgress.length
                : 0;
            // Aggregate confusion patterns
            const confusionMap = new Map();
            quizReviews.forEach(review => {
                review.confusionPatterns.forEach(pattern => {
                    confusionMap.set(pattern, (confusionMap.get(pattern) || 0) + 1);
                });
            });
            const confusionPatterns = Array.from(confusionMap.entries())
                .map(([pattern, frequency]) => ({ pattern, frequency }))
                .sort((a, b) => b.frequency - a.frequency);
            return {
                student,
                overallStats: {
                    totalQuizzes,
                    averageAccuracy,
                    skillsMastered,
                    skillsInProgress,
                    totalAttempts,
                    avgResponseTime
                },
                quizReviews,
                skillProgress,
                confusionPatterns
            };
        }
        catch (error) {
            console.error('Error fetching student detailed progress:', error);
            throw error;
        }
    }
    /**
     * Generate AI-powered teacher report for a student
     */
    async generateTeacherReport(childId, startDate, endDate) {
        try {
            // Get student info
            const student = await prisma.user.findUnique({
                where: { id: childId },
                select: { id: true, name: true }
            });
            if (!student) {
                throw new Error('Student not found');
            }
            // Get attempts in date range
            const attempts = await prisma.attempt.findMany({
                where: {
                    childId,
                    createdAt: {
                        gte: startDate,
                        lte: endDate
                    }
                },
                include: {
                    microSkill: {
                        include: {
                            domain: true
                        }
                    }
                },
                orderBy: { createdAt: 'asc' }
            });
            if (attempts.length === 0) {
                throw new Error('No activity found in the specified date range');
            }
            // Calculate metrics
            const totalAttempts = attempts.length;
            const correctAttempts = attempts.filter(a => a.isCorrect).length;
            const overallAccuracy = (correctAttempts / totalAttempts) * 100;
            const totalTimeSpent = attempts.reduce((sum, a) => sum + a.responseTimeSeconds, 0);
            // Get skill progress
            const skillProgress = await prisma.skillProgress.findMany({
                where: { childId },
                include: {
                    microSkill: {
                        include: {
                            domain: true
                        }
                    }
                }
            });
            const skillsMastered = skillProgress.filter(sp => sp.masteryStatus === 'MASTERED').length;
            const skillsInProgress = skillProgress.filter(sp => sp.masteryStatus === 'IN_PROGRESS').length;
            // Calculate domain performance
            const domainMap = new Map();
            attempts.forEach(attempt => {
                const domainId = attempt.microSkill.domainId;
                if (!domainMap.has(domainId)) {
                    domainMap.set(domainId, {
                        domain: attempt.microSkill.domain,
                        attempts: []
                    });
                }
                domainMap.get(domainId).attempts.push(attempt);
            });
            const domainPerformance = Array.from(domainMap.values()).map(({ domain, attempts: domainAttempts }) => {
                const correct = domainAttempts.filter(a => a.isCorrect).length;
                const accuracy = (correct / domainAttempts.length) * 100;
                const avgResponseTime = domainAttempts.reduce((sum, a) => sum + a.responseTimeSeconds, 0) / domainAttempts.length;
                let masteryLevel = 'BEGINNER';
                if (accuracy >= 90)
                    masteryLevel = 'MASTERED';
                else if (accuracy >= 70)
                    masteryLevel = 'INTERMEDIATE';
                return {
                    domain: {
                        name: domain.name,
                        code: domain.code
                    },
                    accuracy,
                    avgResponseTime,
                    attemptsCount: domainAttempts.length,
                    masteryLevel
                };
            });
            // Analyze confusion patterns
            const confusionMap = new Map();
            attempts.forEach(attempt => {
                if (attempt.errorType && attempt.errorType !== 'NONE') {
                    confusionMap.set(attempt.errorType, (confusionMap.get(attempt.errorType) || 0) + 1);
                }
            });
            const confusionPatterns = Array.from(confusionMap.entries())
                .map(([type, frequency]) => ({
                type,
                frequency,
                description: this.getConfusionDescription(type)
            }))
                .sort((a, b) => b.frequency - a.frequency);
            // Generate AI insights with optimized prompt
            const systemPrompt = `Expert education analyst. Generate concise, actionable insights.`;
            const userPrompt = `Student: ${student.name}
Period: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}
Accuracy: ${overallAccuracy.toFixed(1)}% | Attempts: ${totalAttempts} | Mastered: ${skillsMastered} | In Progress: ${skillsInProgress}

Domains:
${domainPerformance.map(d => `${d.domain.name}: ${d.accuracy.toFixed(0)}% (${d.attemptsCount} tries)`).join('\n')}

Errors: ${confusionPatterns.map(c => `${c.description} (${c.frequency}x)`).join(', ') || 'None'}

JSON only:
{
  "strengths": ["3-5 specific achievements"],
  "weaknesses": ["3-5 areas needing work"],
  "recommendations": [
    {"title": "Action item", "description": "How to implement", "priority": 1-10}
  ]
}

Be specific, actionable, parent-friendly.`;
            try {
                const aiResponse = await ai.generateStructuredResponse(userPrompt, systemPrompt);
                // Save report to database
                const report = await prisma.performanceReport.create({
                    data: {
                        childId,
                        reportPeriodStart: startDate,
                        reportPeriodEnd: endDate,
                        overallAccuracy,
                        totalAttempts,
                        totalTimeSpent: Math.round(totalTimeSpent),
                        skillsMastered,
                        skillsInProgress,
                        strengths: aiResponse.strengths,
                        weaknesses: aiResponse.weaknesses,
                        confusionPatterns: confusionPatterns,
                        recommendations: aiResponse.recommendations,
                        domainPerformance: {
                            create: domainPerformance.map(dp => ({
                                domainId: domainMap.get(dp.domain.code)?.domain.id || '',
                                accuracy: dp.accuracy,
                                avgResponseTime: dp.avgResponseTime,
                                attemptsCount: dp.attemptsCount,
                                masteryLevel: dp.masteryLevel
                            }))
                        }
                    },
                    include: {
                        domainPerformance: {
                            include: {
                                domain: true
                            }
                        }
                    }
                });
                return {
                    id: report.id,
                    childId: report.childId,
                    generatedAt: report.generatedAt,
                    reportPeriodStart: report.reportPeriodStart,
                    reportPeriodEnd: report.reportPeriodEnd,
                    overallAccuracy: report.overallAccuracy,
                    totalAttempts: report.totalAttempts,
                    totalTimeSpent: report.totalTimeSpent,
                    skillsMastered: report.skillsMastered,
                    skillsInProgress: report.skillsInProgress,
                    strengths: report.strengths,
                    weaknesses: report.weaknesses,
                    confusionPatterns: report.confusionPatterns,
                    recommendations: report.recommendations,
                    domainPerformance: report.domainPerformance.map(dp => ({
                        domain: {
                            name: dp.domain.name,
                            code: dp.domain.code
                        },
                        accuracy: dp.accuracy,
                        avgResponseTime: dp.avgResponseTime,
                        attemptsCount: dp.attemptsCount,
                        masteryLevel: dp.masteryLevel
                    }))
                };
            }
            catch (aiError) {
                console.error('AI generation failed, using fallback:', aiError);
                // Fallback report without AI insights
                const report = await prisma.performanceReport.create({
                    data: {
                        childId,
                        reportPeriodStart: startDate,
                        reportPeriodEnd: endDate,
                        overallAccuracy,
                        totalAttempts,
                        totalTimeSpent: Math.round(totalTimeSpent),
                        skillsMastered,
                        skillsInProgress,
                        strengths: this.getFallbackStrengths(overallAccuracy, skillsMastered),
                        weaknesses: this.getFallbackWeaknesses(overallAccuracy, confusionPatterns),
                        confusionPatterns: confusionPatterns,
                        recommendations: this.getFallbackRecommendations(overallAccuracy, confusionPatterns),
                        domainPerformance: {
                            create: domainPerformance.map(dp => {
                                // Find domain ID from domainMap
                                let domainId = '';
                                for (const [id, data] of domainMap.entries()) {
                                    if (data.domain.code === dp.domain.code) {
                                        domainId = id;
                                        break;
                                    }
                                }
                                return {
                                    domainId,
                                    accuracy: dp.accuracy,
                                    avgResponseTime: dp.avgResponseTime,
                                    attemptsCount: dp.attemptsCount,
                                    masteryLevel: dp.masteryLevel
                                };
                            })
                        }
                    },
                    include: {
                        domainPerformance: {
                            include: {
                                domain: true
                            }
                        }
                    }
                });
                return {
                    id: report.id,
                    childId: report.childId,
                    generatedAt: report.generatedAt,
                    reportPeriodStart: report.reportPeriodStart,
                    reportPeriodEnd: report.reportPeriodEnd,
                    overallAccuracy: report.overallAccuracy,
                    totalAttempts: report.totalAttempts,
                    totalTimeSpent: report.totalTimeSpent,
                    skillsMastered: report.skillsMastered,
                    skillsInProgress: report.skillsInProgress,
                    strengths: report.strengths,
                    weaknesses: report.weaknesses,
                    confusionPatterns: report.confusionPatterns,
                    recommendations: report.recommendations,
                    domainPerformance: report.domainPerformance.map(dp => ({
                        domain: {
                            name: dp.domain.name,
                            code: dp.domain.code
                        },
                        accuracy: dp.accuracy,
                        avgResponseTime: dp.avgResponseTime,
                        attemptsCount: dp.attemptsCount,
                        masteryLevel: dp.masteryLevel
                    }))
                };
            }
        }
        catch (error) {
            console.error('Error generating teacher report:', error);
            throw error;
        }
    }
    /**
     * Get student's performance report history
     */
    async getStudentReports(childId) {
        try {
            const reports = await prisma.performanceReport.findMany({
                where: { childId },
                include: {
                    domainPerformance: {
                        include: {
                            domain: true
                        }
                    }
                },
                orderBy: { generatedAt: 'desc' }
            });
            return reports.map(report => ({
                id: report.id,
                childId: report.childId,
                generatedAt: report.generatedAt,
                reportPeriodStart: report.reportPeriodStart,
                reportPeriodEnd: report.reportPeriodEnd,
                overallAccuracy: report.overallAccuracy,
                totalAttempts: report.totalAttempts,
                totalTimeSpent: report.totalTimeSpent,
                skillsMastered: report.skillsMastered,
                skillsInProgress: report.skillsInProgress,
                strengths: report.strengths,
                weaknesses: report.weaknesses,
                confusionPatterns: report.confusionPatterns,
                recommendations: report.recommendations,
                domainPerformance: report.domainPerformance.map(dp => ({
                    domain: {
                        name: dp.domain.name,
                        code: dp.domain.code
                    },
                    accuracy: dp.accuracy,
                    avgResponseTime: dp.avgResponseTime,
                    attemptsCount: dp.attemptsCount,
                    masteryLevel: dp.masteryLevel
                }))
            }));
        }
        catch (error) {
            console.error('Error fetching student reports:', error);
            throw error;
        }
    }
    getConfusionDescription(errorType) {
        const descriptions = {
            'B_D_CONFUSION': 'Confusion between letters b and d',
            'P_Q_CONFUSION': 'Confusion between letters p and q',
            'M_N_CONFUSION': 'Confusion between letters m and n',
            'U_N_CONFUSION': 'Confusion between letters u and n',
            'VOWEL_ERROR': 'Vowel identification errors',
            'WRONG_SOUND': 'Incorrect sound association',
            'SEQUENCING_ERROR': 'Difficulty with sequencing',
            'OTHER': 'Other errors'
        };
        return descriptions[errorType] || errorType;
    }
    getFallbackStrengths(accuracy, skillsMastered) {
        const strengths = [];
        if (accuracy >= 80)
            strengths.push('Strong overall performance');
        if (accuracy >= 70)
            strengths.push('Good accuracy on attempted skills');
        if (skillsMastered > 0)
            strengths.push(`Successfully mastered ${skillsMastered} skills`);
        if (strengths.length === 0)
            strengths.push('Actively engaged in learning');
        return strengths;
    }
    getFallbackWeaknesses(accuracy, confusionPatterns) {
        const weaknesses = [];
        if (accuracy < 60)
            weaknesses.push('Needs additional support to improve accuracy');
        if (confusionPatterns.length > 0) {
            weaknesses.push(`Showing ${confusionPatterns[0].description.toLowerCase()}`);
        }
        if (weaknesses.length === 0)
            weaknesses.push('Continue building foundational skills');
        return weaknesses;
    }
    getFallbackRecommendations(accuracy, confusionPatterns) {
        const recommendations = [];
        if (accuracy < 70) {
            recommendations.push({
                title: 'Provide Additional Practice',
                description: 'Focus on foundational skills with more practice sessions',
                priority: 9
            });
        }
        if (confusionPatterns.length > 0) {
            recommendations.push({
                title: `Address ${confusionPatterns[0].description}`,
                description: 'Use targeted exercises to address this specific confusion pattern',
                priority: 8
            });
        }
        recommendations.push({
            title: 'Regular Progress Monitoring',
            description: 'Continue tracking progress and adjust interventions as needed',
            priority: 7
        });
        return recommendations;
    }
}
exports.TeacherService = TeacherService;
exports.default = new TeacherService();

import { PrismaClient } from '@prisma/client';
import OpenAIService from './openai-service';

const prisma = new PrismaClient();
const ai = OpenAIService;

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
        domain: { name: string; code: string };
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
export class TeacherService {
    /**
     * Get recent quiz reviews for a student
     */
    async getStudentQuizReviews(childId: string, limit: number = 10): Promise<StudentQuizReview[]> {
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
                strengths: review.strengths as string[],
                areasToImprove: review.areasToImprove as string[],
                specificFeedback: review.specificFeedback,
                encouragement: review.encouragement,
                confusionPatterns: review.confusionPatterns as string[],
                accuracy: review.accuracy,
                totalAttempts: review.totalAttempts,
                correctAttempts: review.correctAttempts,
                avgResponseTime: review.avgResponseTime,
                recommendedSkillName: review.recommendedSkill?.name,
                recommendedSkillCode: review.recommendedSkill?.code,
                recommendedReason: review.recommendedReason || undefined
            }));
        } catch (error) {
            console.error('Error fetching student quiz reviews:', error);
            throw error;
        }
    }

    /**
     * Get comprehensive student progress data
     */
    async getStudentDetailedProgress(childId: string): Promise<StudentDetailedProgress> {
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
            const confusionMap = new Map<string, number>();
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
        } catch (error) {
            console.error('Error fetching student detailed progress:', error);
            throw error;
        }
    }

    /**
     * Generate AI-powered teacher report for a student
     */
    async generateTeacherReport(
        childId: string,
        startDate: Date,
        endDate: Date
    ): Promise<TeacherReport> {
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
            const domainMap = new Map<string, {
                domain: any;
                attempts: any[];
            }>();

            attempts.forEach(attempt => {
                const domainId = attempt.microSkill.domainId;
                if (!domainMap.has(domainId)) {
                    domainMap.set(domainId, {
                        domain: attempt.microSkill.domain,
                        attempts: []
                    });
                }
                domainMap.get(domainId)!.attempts.push(attempt);
            });

            const domainPerformance = Array.from(domainMap.values()).map(({ domain, attempts: domainAttempts }) => {
                const correct = domainAttempts.filter(a => a.isCorrect).length;
                const accuracy = (correct / domainAttempts.length) * 100;
                const avgResponseTime = domainAttempts.reduce((sum, a) => sum + a.responseTimeSeconds, 0) / domainAttempts.length;

                let masteryLevel = 'BEGINNER';
                if (accuracy >= 90) masteryLevel = 'MASTERED';
                else if (accuracy >= 70) masteryLevel = 'INTERMEDIATE';

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
            const confusionMap = new Map<string, number>();
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
                const aiResponse = await ai.generateStructuredResponse<{
                    strengths: string[];
                    weaknesses: string[];
                    recommendations: Array<{
                        title: string;
                        description: string;
                        priority: number;
                    }>;
                }>(userPrompt, systemPrompt);

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
                    strengths: report.strengths as string[],
                    weaknesses: report.weaknesses as string[],
                    confusionPatterns: report.confusionPatterns as any[],
                    recommendations: report.recommendations as any[],
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
            } catch (aiError) {
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
                    strengths: report.strengths as string[],
                    weaknesses: report.weaknesses as string[],
                    confusionPatterns: report.confusionPatterns as any[],
                    recommendations: report.recommendations as any[],
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
        } catch (error) {
            console.error('Error generating teacher report:', error);
            throw error;
        }
    }

    /**
     * Get student's performance report history
     */
    async getStudentReports(childId: string): Promise<TeacherReport[]> {
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
                strengths: report.strengths as string[],
                weaknesses: report.weaknesses as string[],
                confusionPatterns: report.confusionPatterns as any[],
                recommendations: report.recommendations as any[],
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
        } catch (error) {
            console.error('Error fetching student reports:', error);
            throw error;
        }
    }

    private getConfusionDescription(errorType: string): string {
        const descriptions: Record<string, string> = {
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

    private getFallbackStrengths(accuracy: number, skillsMastered: number): string[] {
        const strengths = [];
        if (accuracy >= 80) strengths.push('Strong overall performance');
        if (accuracy >= 70) strengths.push('Good accuracy on attempted skills');
        if (skillsMastered > 0) strengths.push(`Successfully mastered ${skillsMastered} skills`);
        if (strengths.length === 0) strengths.push('Actively engaged in learning');
        return strengths;
    }

    private getFallbackWeaknesses(accuracy: number, confusionPatterns: any[]): string[] {
        const weaknesses = [];
        if (accuracy < 60) weaknesses.push('Needs additional support to improve accuracy');
        if (confusionPatterns.length > 0) {
            weaknesses.push(`Showing ${confusionPatterns[0].description.toLowerCase()}`);
        }
        if (weaknesses.length === 0) weaknesses.push('Continue building foundational skills');
        return weaknesses;
    }

    private getFallbackRecommendations(accuracy: number, confusionPatterns: any[]): any[] {
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

export default new TeacherService();

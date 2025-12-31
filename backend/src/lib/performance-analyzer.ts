import prisma from './db';
import OpenAIService from './openai-service';

const ai = OpenAIService;

interface PerformanceMetrics {
    overallAccuracy: number;
    totalAttempts: number;
    totalTimeSpent: number;
    skillsMastered: number;
    skillsInProgress: number;
}

interface AIInsights {
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
}

/**
 * Performance Analyzer Service
 * Generates comprehensive performance reports with AI insights
 */
export class PerformanceAnalyzer {
    /**
     * Generate a performance report for a child
     */
    async generateReport(
        childId: string,
        startDate: Date,
        endDate: Date
    ): Promise<any> {
        try {
            // 1. Fetch all attempts in date range
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
                    },
                    question: true
                },
                orderBy: {
                    createdAt: 'asc'
                }
            });

            if (attempts.length === 0) {
                throw new Error('No attempts found in the specified date range');
            }

            // 2. Calculate aggregate metrics
            const metrics = this.calculateMetrics(attempts);

            // 3. Calculate domain-level performance
            const domainStats = this.calculateDomainPerformance(attempts);

            // 4. Use AI to analyze patterns and generate insights
            const aiInsights = await this.analyzeWithAI(attempts, metrics, domainStats);

            // 5. Save report to database
            const report = await prisma.performanceReport.create({
                data: {
                    childId,
                    reportPeriodStart: startDate,
                    reportPeriodEnd: endDate,
                    overallAccuracy: metrics.overallAccuracy,
                    totalAttempts: metrics.totalAttempts,
                    totalTimeSpent: metrics.totalTimeSpent,
                    skillsMastered: metrics.skillsMastered,
                    skillsInProgress: metrics.skillsInProgress,
                    strengths: aiInsights.strengths,
                    weaknesses: aiInsights.weaknesses,
                    confusionPatterns: aiInsights.confusionPatterns,
                    recommendations: aiInsights.recommendations,
                    domainPerformance: {
                        create: domainStats.map(stat => ({
                            domainId: stat.domainId,
                            accuracy: stat.accuracy,
                            avgResponseTime: stat.avgResponseTime,
                            attemptsCount: stat.attemptsCount,
                            masteryLevel: stat.masteryLevel
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

            return report;
        } catch (error) {
            console.error('Error generating performance report:', error);
            throw error;
        }
    }

    /**
     * Calculate aggregate metrics from attempts
     */
    private calculateMetrics(attempts: any[]): PerformanceMetrics {
        const correctAttempts = attempts.filter(a => a.isCorrect).length;
        const totalTime = attempts.reduce((sum, a) => sum + a.responseTimeSeconds, 0);

        // Get unique skills and their mastery status
        const skillProgress = new Map();
        attempts.forEach(attempt => {
            const skillId = attempt.microSkillId;
            if (!skillProgress.has(skillId)) {
                skillProgress.set(skillId, {
                    correct: 0,
                    total: 0,
                    totalTime: 0
                });
            }
            const progress = skillProgress.get(skillId);
            progress.total++;
            if (attempt.isCorrect) progress.correct++;
            progress.totalTime += attempt.responseTimeSeconds;
        });

        let skillsMastered = 0;
        let skillsInProgress = 0;

        skillProgress.forEach(progress => {
            const accuracy = (progress.correct / progress.total) * 100;
            const avgTime = progress.totalTime / progress.total;

            if (accuracy >= 80 && avgTime < 4) {
                skillsMastered++;
            } else if (progress.total > 0) {
                skillsInProgress++;
            }
        });

        return {
            overallAccuracy: (correctAttempts / attempts.length) * 100,
            totalAttempts: attempts.length,
            totalTimeSpent: Math.round(totalTime),
            skillsMastered,
            skillsInProgress
        };
    }

    /**
     * Calculate domain-level performance
     */
    private calculateDomainPerformance(attempts: any[]): any[] {
        const domainMap = new Map();

        attempts.forEach(attempt => {
            const domainId = attempt.microSkill.domainId;
            if (!domainMap.has(domainId)) {
                domainMap.set(domainId, {
                    domainId,
                    correct: 0,
                    total: 0,
                    totalTime: 0
                });
            }
            const domain = domainMap.get(domainId);
            domain.total++;
            if (attempt.isCorrect) domain.correct++;
            domain.totalTime += attempt.responseTimeSeconds;
        });

        return Array.from(domainMap.values()).map(domain => {
            const accuracy = (domain.correct / domain.total) * 100;
            const avgResponseTime = domain.totalTime / domain.total;

            let masteryLevel = 'NOT_STARTED';
            if (accuracy >= 90 && avgResponseTime < 3) {
                masteryLevel = 'MASTERED';
            } else if (accuracy >= 70 && avgResponseTime < 5) {
                masteryLevel = 'INTERMEDIATE';
            } else if (domain.total > 0) {
                masteryLevel = 'BEGINNER';
            }

            return {
                domainId: domain.domainId,
                accuracy,
                avgResponseTime,
                attemptsCount: domain.total,
                masteryLevel
            };
        });
    }

    /**
     * Use AI to analyze performance and generate insights
     */
    private async analyzeWithAI(
        attempts: any[],
        metrics: PerformanceMetrics,
        domainStats: any[]
    ): Promise<AIInsights> {
        // Detect confusion patterns
        const confusionPatterns = this.detectConfusionPatterns(attempts);

        // Prepare data for AI analysis
        const analysisData = {
            metrics,
            domainStats: domainStats.map(d => ({
                domain: d.domainId,
                accuracy: d.accuracy.toFixed(1),
                avgTime: d.avgResponseTime.toFixed(1),
                attempts: d.attemptsCount,
                mastery: d.masteryLevel
            })),
            confusionPatterns: confusionPatterns.map(p => ({
                type: p.type,
                count: p.frequency
            })),
            recentErrors: attempts
                .filter(a => !a.isCorrect)
                .slice(-10)
                .map(a => ({
                    skill: a.microSkill.name,
                    errorType: a.errorType
                }))
        };

        const systemPrompt = `You are an expert educational psychologist analyzing a child's learning performance in literacy skills. 
Provide constructive, encouraging insights that help teachers understand the child's progress and areas for improvement.
Return your analysis as valid JSON.`;

        const userPrompt = `Analyze this child's performance data and provide insights:

Performance Metrics:
- Overall Accuracy: ${metrics.overallAccuracy.toFixed(1)}%
- Total Attempts: ${metrics.totalAttempts}
- Skills Mastered: ${metrics.skillsMastered}
- Skills In Progress: ${metrics.skillsInProgress}

Domain Performance:
${JSON.stringify(analysisData.domainStats, null, 2)}

Confusion Patterns Detected:
${JSON.stringify(analysisData.confusionPatterns, null, 2)}

Recent Errors:
${JSON.stringify(analysisData.recentErrors, null, 2)}

Provide a JSON response with this structure:
{
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weaknesses": ["area 1", "area 2"],
  "recommendations": [
    {
      "title": "Recommendation title",
      "description": "Detailed recommendation",
      "priority": 8
    }
  ]
}

Focus on:
1. Identifying 2-3 key strengths
2. Highlighting 1-2 areas needing improvement
3. Providing 3-4 actionable recommendations for teachers
4. Being encouraging and constructive`;

        try {
            const response = await ai.generateStructuredResponse<{
                strengths: string[];
                weaknesses: string[];
                recommendations: Array<{
                    title: string;
                    description: string;
                    priority: number;
                }>;
            }>(userPrompt, systemPrompt);

            return {
                strengths: response.strengths || [],
                weaknesses: response.weaknesses || [],
                confusionPatterns,
                recommendations: response.recommendations || []
            };
        } catch (error) {
            console.error('AI analysis failed, using fallback:', error);
            return this.getFallbackInsights(metrics, confusionPatterns);
        }
    }

    /**
     * Detect confusion patterns in attempts
     */
    private detectConfusionPatterns(attempts: any[]): Array<{
        type: string;
        frequency: number;
        description: string;
    }> {
        const patterns = {
            B_D_CONFUSION: 0,
            P_Q_CONFUSION: 0,
            M_N_CONFUSION: 0,
            U_N_CONFUSION: 0,
            VOWEL_ERROR: 0
        };

        attempts.forEach(attempt => {
            if (attempt.errorType && patterns.hasOwnProperty(attempt.errorType)) {
                patterns[attempt.errorType as keyof typeof patterns]++;
            }
        });

        const descriptions: Record<string, string> = {
            B_D_CONFUSION: 'Confusing letters b and d (mirror reversal)',
            P_Q_CONFUSION: 'Confusing letters p and q (mirror reversal)',
            M_N_CONFUSION: 'Confusing letters m and n',
            U_N_CONFUSION: 'Confusing letters u and n',
            VOWEL_ERROR: 'Difficulty with vowel sounds'
        };

        return Object.entries(patterns)
            .filter(([_, count]) => count > 0)
            .map(([type, frequency]) => ({
                type,
                frequency,
                description: descriptions[type] || type
            }))
            .sort((a, b) => b.frequency - a.frequency);
    }

    /**
     * Fallback insights when AI is unavailable
     */
    private getFallbackInsights(
        metrics: PerformanceMetrics,
        confusionPatterns: any[]
    ): AIInsights {
        const strengths: string[] = [];
        const weaknesses: string[] = [];
        const recommendations: any[] = [];

        if (metrics.overallAccuracy >= 80) {
            strengths.push('Strong overall performance with high accuracy');
        }
        if (metrics.skillsMastered >= 5) {
            strengths.push(`Mastered ${metrics.skillsMastered} skills successfully`);
        }

        if (metrics.overallAccuracy < 60) {
            weaknesses.push('Overall accuracy needs improvement');
            recommendations.push({
                title: 'Focus on Fundamentals',
                description: 'Review basic concepts and provide additional practice',
                priority: 9
            });
        }

        if (confusionPatterns.length > 0) {
            const topPattern = confusionPatterns[0];
            weaknesses.push(topPattern.description);
            recommendations.push({
                title: 'Address Confusion Patterns',
                description: `Provide targeted practice for ${topPattern.description.toLowerCase()}`,
                priority: 8
            });
        }

        return {
            strengths,
            weaknesses,
            confusionPatterns,
            recommendations
        };
    }

    /**
     * Get all reports for a child
     */
    async getChildReports(childId: string, limit: number = 10): Promise<any[]> {
        return await prisma.performanceReport.findMany({
            where: { childId },
            include: {
                domainPerformance: {
                    include: {
                        domain: true
                    }
                }
            },
            orderBy: {
                generatedAt: 'desc'
            },
            take: limit
        });
    }
}

export default new PerformanceAnalyzer();

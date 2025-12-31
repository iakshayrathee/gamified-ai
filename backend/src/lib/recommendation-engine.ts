import { PrismaClient } from '@prisma/client';
import OpenAIService from './openai-service';

const prisma = new PrismaClient();
const ai = OpenAIService;

interface SkillRecommendation {
    skillId: string;
    skillName: string;
    reason: string;
    priority: number;
    confidence: number;
}

/**
 * Recommendation Engine
 * Generates personalized skill recommendations using AI
 */
export class RecommendationEngine {
    /**
     * Generate recommendations for a child
     */
    async generateRecommendations(
        childId: string,
        limit: number = 5
    ): Promise<any[]> {
        try {
            // 1. Get child's progress
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

            // 2. Get eligible skills (not mastered, prerequisites met)
            const eligibleSkills = await this.getEligibleSkills(childId, skillProgress);

            if (eligibleSkills.length === 0) {
                return [];
            }

            // 3. Use AI to rank and recommend skills
            const recommendations = await this.rankSkillsWithAI(
                childId,
                eligibleSkills,
                skillProgress
            );

            // 4. Save recommendations to database
            const savedRecommendations = await Promise.all(
                recommendations.slice(0, limit).map(rec =>
                    prisma.recommendation.create({
                        data: {
                            childId,
                            skillId: rec.skillId,
                            reason: rec.reason,
                            priority: rec.priority,
                            confidence: rec.confidence
                        },
                        include: {
                            skill: {
                                include: {
                                    domain: true
                                }
                            }
                        }
                    })
                )
            );

            return savedRecommendations;
        } catch (error) {
            console.error('Error generating recommendations:', error);
            throw error;
        }
    }

    /**
     * Get skills that are eligible for recommendation
     */
    private async getEligibleSkills(
        childId: string,
        skillProgress: any[]
    ): Promise<any[]> {
        // Get all skills
        const allSkills = await prisma.microSkill.findMany({
            include: {
                domain: true
            }
        });

        // Filter out mastered skills
        const masteredSkillIds = new Set(
            skillProgress
                .filter(p => p.masteryStatus === 'MASTERED')
                .map(p => p.microSkillId)
        );

        // Filter eligible skills
        const eligible = allSkills.filter(skill => {
            // Skip if already mastered
            if (masteredSkillIds.has(skill.id)) {
                return false;
            }

            // Check prerequisites
            const prerequisites = skill.prerequisiteSkills as string[];
            if (prerequisites && prerequisites.length > 0) {
                // All prerequisites must be mastered
                return prerequisites.every(prereqCode => {
                    const prereqSkill = allSkills.find(s => s.code === prereqCode);
                    return prereqSkill && masteredSkillIds.has(prereqSkill.id);
                });
            }

            return true;
        });

        return eligible;
    }

    /**
     * Use AI to rank skills and generate recommendations
     */
    private async rankSkillsWithAI(
        childId: string,
        eligibleSkills: any[],
        skillProgress: any[]
    ): Promise<SkillRecommendation[]> {
        // Get recent performance data
        const recentAttempts = await prisma.attempt.findMany({
            where: { childId },
            include: {
                microSkill: {
                    include: {
                        domain: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 50
        });

        // Analyze performance patterns
        const performanceData = this.analyzePerformance(recentAttempts, skillProgress);

        const systemPrompt = `You are an expert educational AI that recommends personalized learning paths for children.
Analyze the child's performance and recommend the best next skills to learn.
Consider: current mastery levels, recent performance, confusion patterns, and learning progression.
Return your recommendations as valid JSON.`;

        const userPrompt = `Recommend the best skills for this child to learn next:

Available Skills:
${eligibleSkills.map((s, i) => `${i + 1}. ${s.name} (${s.code}) - Domain: ${s.domain.name}`).join('\n')}

Child's Performance Summary:
- Overall Accuracy: ${performanceData.overallAccuracy.toFixed(1)}%
- Skills Mastered: ${performanceData.skillsMastered}
- Skills In Progress: ${performanceData.skillsInProgress}
- Strongest Domain: ${performanceData.strongestDomain}
- Weakest Domain: ${performanceData.weakestDomain}

Recent Confusion Patterns:
${performanceData.confusionPatterns.join(', ') || 'None detected'}

Provide a JSON response with this structure:
{
  "recommendations": [
    {
      "skillCode": "A.1",
      "reason": "Why this skill is recommended",
      "priority": 8,
      "confidence": 0.85
    }
  ]
}

Recommend 5-8 skills, ordered by priority (1-10, higher is better).
Consider:
1. Building on strengths while addressing weaknesses
2. Natural skill progression
3. Variety across domains
4. Appropriate difficulty level`;

        try {
            const response = await ai.generateStructuredResponse<{
                recommendations: Array<{
                    skillCode: string;
                    reason: string;
                    priority: number;
                    confidence: number;
                }>;
            }>(userPrompt, systemPrompt);

            // Map skill codes to skill IDs
            return response.recommendations
                .map(rec => {
                    const skill = eligibleSkills.find(s => s.code === rec.skillCode);
                    if (!skill) return null;

                    return {
                        skillId: skill.id,
                        skillName: skill.name,
                        reason: rec.reason,
                        priority: Math.min(10, Math.max(1, rec.priority)),
                        confidence: Math.min(1, Math.max(0, rec.confidence))
                    };
                })
                .filter((rec): rec is SkillRecommendation => rec !== null)
                .sort((a, b) => b.priority - a.priority);
        } catch (error) {
            console.error('AI ranking failed, using fallback:', error);
            return this.getFallbackRecommendations(eligibleSkills, performanceData);
        }
    }

    /**
     * Analyze performance to extract patterns
     */
    private analyzePerformance(attempts: any[], skillProgress: any[]): any {
        const domainStats = new Map();

        attempts.forEach(attempt => {
            const domainId = attempt.microSkill.domainId;
            if (!domainStats.has(domainId)) {
                domainStats.set(domainId, {
                    name: attempt.microSkill.domain.name,
                    correct: 0,
                    total: 0
                });
            }
            const stats = domainStats.get(domainId);
            stats.total++;
            if (attempt.isCorrect) stats.correct++;
        });

        const domainPerformance = Array.from(domainStats.entries()).map(([id, stats]) => ({
            id,
            name: stats.name,
            accuracy: (stats.correct / stats.total) * 100
        }));

        const strongestDomain = domainPerformance.sort((a, b) => b.accuracy - a.accuracy)[0];
        const weakestDomain = domainPerformance.sort((a, b) => a.accuracy - b.accuracy)[0];

        const confusionPatterns = new Set<string>();
        attempts.forEach(attempt => {
            if (attempt.errorType && attempt.errorType !== 'NONE') {
                confusionPatterns.add(attempt.errorType);
            }
        });

        const correctAttempts = attempts.filter(a => a.isCorrect).length;

        return {
            overallAccuracy: attempts.length > 0 ? (correctAttempts / attempts.length) * 100 : 0,
            skillsMastered: skillProgress.filter(p => p.masteryStatus === 'MASTERED').length,
            skillsInProgress: skillProgress.filter(p => p.masteryStatus === 'IN_PROGRESS').length,
            strongestDomain: strongestDomain?.name || 'Unknown',
            weakestDomain: weakestDomain?.name || 'Unknown',
            confusionPatterns: Array.from(confusionPatterns)
        };
    }

    /**
     * Fallback recommendations when AI is unavailable
     */
    private getFallbackRecommendations(
        eligibleSkills: any[],
        performanceData: any
    ): SkillRecommendation[] {
        // Simple rule-based recommendations
        return eligibleSkills
            .slice(0, 5)
            .map((skill, index) => ({
                skillId: skill.id,
                skillName: skill.name,
                reason: `Recommended based on your current progress in ${skill.domain.name}`,
                priority: 10 - index,
                confidence: 0.7
            }));
    }

    /**
     * Get active recommendations for a child
     */
    async getActiveRecommendations(childId: string): Promise<any[]> {
        return await prisma.recommendation.findMany({
            where: {
                childId,
                completedAt: null
            },
            include: {
                skill: {
                    include: {
                        domain: true
                    }
                }
            },
            orderBy: {
                priority: 'desc'
            }
        });
    }

    /**
     * Mark recommendation as completed
     */
    async completeRecommendation(recommendationId: string): Promise<any> {
        return await prisma.recommendation.update({
            where: { id: recommendationId },
            data: {
                completedAt: new Date()
            }
        });
    }
}

export default new RecommendationEngine();

import { PrismaClient } from '@prisma/client';
import OpenAIService from './openai-service';

const prisma = new PrismaClient();
const ai = OpenAIService;

interface QuizReview {
    overallPerformance: string;
    strengths: string[];
    areasToImprove: string[];
    specificFeedback: string;
    encouragement: string;
    confusionPatterns: string[];
}

interface NextSkillRecommendation {
    skillId: string;
    skillName: string;
    skillCode: string;
    reason: string;
    confidence: number;
}

/**
 * AI Quiz Review Service
 * Generates personalized reviews and recommendations after quiz completion
 */
export class QuizReviewService {
    /**
     * Generate AI-powered review AND recommendation in a SINGLE call (optimized for kids!)
     */
    async generateQuizReviewWithRecommendation(
        sessionId: string,
        childId: string,
        autoSave: boolean = true
    ): Promise<{ review: QuizReview; recommendation: NextSkillRecommendation | null }> {
        try {
            // Get session with all attempts
            const session = await prisma.session.findUnique({
                where: { id: sessionId },
                include: {
                    attempts: {
                        include: {
                            microSkill: {
                                include: {
                                    domain: true
                                }
                            }
                        },
                        orderBy: { createdAt: 'asc' }
                    }
                }
            });

            if (!session || session.attempts.length === 0) {
                throw new Error('Session not found or has no attempts');
            }

            // Calculate metrics
            const totalAttempts = session.attempts.length;
            const correctAttempts = session.attempts.filter(a => a.isCorrect).length;
            const accuracy = (correctAttempts / totalAttempts) * 100;
            const avgResponseTime = session.attempts.reduce((sum, a) => sum + a.responseTimeSeconds, 0) / totalAttempts;

            // Get current skill
            const currentSkillId = session.attempts[0]?.microSkillId;
            const currentSkill = await prisma.microSkill.findUnique({
                where: { id: currentSkillId },
                include: { domain: true }
            });

            if (!currentSkill) {
                throw new Error('Current skill not found');
            }

            // Get eligible next skills
            const skillProgress = await prisma.skillProgress.findMany({
                where: { childId },
                include: { microSkill: { include: { domain: true } } }
            });

            const masteredSkillIds = new Set(
                skillProgress.filter(p => p.masteryStatus === 'MASTERED').map(p => p.microSkillId)
            );

            const allSkills = await prisma.microSkill.findMany({
                include: { domain: true }
            });

            const eligibleSkills = allSkills
                .filter(skill => skill.id !== currentSkillId && !masteredSkillIds.has(skill.id))
                .slice(0, 5);

            // Analyze attempt patterns for better context
            const incorrectAttempts = session.attempts.filter(a => !a.isCorrect);
            const avgCorrectTime = session.attempts
                .filter(a => a.isCorrect)
                .reduce((sum, a) => sum + a.responseTimeSeconds, 0) / (correctAttempts || 1);
            const avgIncorrectTime = incorrectAttempts.length > 0
                ? incorrectAttempts.reduce((sum, a) => sum + a.responseTimeSeconds, 0) / incorrectAttempts.length
                : 0;

            // TOKEN-OPTIMIZED AI PROMPT - Concise but meaningful!
            const systemPrompt = `You're an AI learning coach for kids. Be encouraging, specific, and concise. Use emojis sparingly.`;

            const userPrompt = `Skill: ${currentSkill.name}
Score: ${correctAttempts}/${totalAttempts} (${accuracy.toFixed(0)}%)
Avg time: ${avgResponseTime.toFixed(1)}s

Provide brief, actionable feedback in JSON:
{
  "overallPerformance": "One encouraging sentence about their performance",
  "strengths": ["Specific strength 1", "Specific strength 2"],
  "areasToImprove": ["Actionable tip 1", "Actionable tip 2"],
  "specificFeedback": "One sentence with specific advice",
  "encouragement": "One motivating sentence with emoji",
  "confusionPatterns": [],
  "nextSkillCode": "Pick from: ${eligibleSkills.slice(0, 5).map(s => s.code).join(', ')}",
  "nextSkillReason": "Brief reason why (one sentence)"
}

Keep all text concise but meaningful. Focus on what they did well and one key improvement area.`;


            try {
                const response = await ai.generateStructuredResponse<{
                    overallPerformance: string;
                    strengths: string[];
                    areasToImprove: string[];
                    specificFeedback: string;
                    encouragement: string;
                    confusionPatterns: string[];
                    nextSkillCode?: string;
                    nextSkillReason?: string;
                }>(userPrompt, systemPrompt);

                // Build review
                const review: QuizReview = {
                    overallPerformance: response.overallPerformance,
                    strengths: response.strengths,
                    areasToImprove: response.areasToImprove,
                    specificFeedback: response.specificFeedback,
                    encouragement: response.encouragement,
                    confusionPatterns: response.confusionPatterns || []
                };

                // Build recommendation
                let recommendation: NextSkillRecommendation | null = null;
                if (response.nextSkillCode) {
                    const recommendedSkill = eligibleSkills.find(s => s.code === response.nextSkillCode);
                    if (recommendedSkill) {
                        recommendation = {
                            skillId: recommendedSkill.id,
                            skillName: recommendedSkill.name,
                            skillCode: recommendedSkill.code,
                            reason: response.nextSkillReason || `Try ${recommendedSkill.name} next! 🎯`,
                            confidence: 0.9
                        };
                    }
                }

                // Fallback recommendation if AI didn't provide one
                if (!recommendation && eligibleSkills.length > 0) {
                    const fallbackSkill = eligibleSkills[0];
                    recommendation = {
                        skillId: fallbackSkill.id,
                        skillName: fallbackSkill.name,
                        skillCode: fallbackSkill.code,
                        reason: `Ready for ${fallbackSkill.name}? Let's go! 🚀`,
                        confidence: 0.7
                    };
                }

                // Save to database if autoSave is enabled
                if (autoSave) {
                    await this.saveQuizReview(
                        sessionId,
                        childId,
                        currentSkillId,
                        review,
                        accuracy,
                        totalAttempts,
                        correctAttempts,
                        avgResponseTime,
                        recommendation
                    );
                }

                return { review, recommendation };
            } catch (error) {
                console.error('AI generation failed, using fallback:', error);
                const fallbackReview = this.getFallbackReview(accuracy, correctAttempts, totalAttempts, []);
                const fallbackRecommendation = eligibleSkills.length > 0 ? {
                    skillId: eligibleSkills[0].id,
                    skillName: eligibleSkills[0].name,
                    skillCode: eligibleSkills[0].code,
                    reason: `Try ${eligibleSkills[0].name} next! 🎯`,
                    confidence: 0.7
                } : null;

                // Save fallback to database if autoSave is enabled
                if (autoSave) {
                    await this.saveQuizReview(
                        sessionId,
                        childId,
                        currentSkillId,
                        fallbackReview,
                        accuracy,
                        totalAttempts,
                        correctAttempts,
                        avgResponseTime,
                        fallbackRecommendation
                    );
                }

                return {
                    review: fallbackReview,
                    recommendation: fallbackRecommendation
                };
            }
        } catch (error) {
            console.error('Error generating quiz review:', error);
            throw error;
        }
    }

    /**
     * Save quiz review to database for teacher access
     */
    async saveQuizReview(
        sessionId: string,
        childId: string,
        skillId: string,
        review: QuizReview,
        accuracy: number,
        totalAttempts: number,
        correctAttempts: number,
        avgResponseTime: number,
        recommendation: NextSkillRecommendation | null
    ): Promise<void> {
        try {
            // Check if review already exists for this session
            const existingReview = await prisma.quizReview.findUnique({
                where: { sessionId }
            });

            if (existingReview) {
                // console.log('Quiz review already exists for session:', sessionId);
                return;
            }

            await prisma.quizReview.create({
                data: {
                    sessionId,
                    childId,
                    skillId,
                    overallPerformance: review.overallPerformance,
                    strengths: review.strengths,
                    areasToImprove: review.areasToImprove,
                    specificFeedback: review.specificFeedback,
                    encouragement: review.encouragement,
                    confusionPatterns: review.confusionPatterns,
                    accuracy,
                    totalAttempts,
                    correctAttempts,
                    avgResponseTime,
                    recommendedSkillId: recommendation?.skillId || null,
                    recommendedReason: recommendation?.reason || null
                }
            });

            // console.log('Quiz review saved successfully for session:', sessionId);
        } catch (error) {
            console.error('Error saving quiz review:', error);
            // Don't throw error - we don't want to break the quiz flow if saving fails
        }
    }

    /**
     * DEPRECATED: Use generateQuizReviewWithRecommendation instead
     */
    async generateQuizReview(
        sessionId: string,
        childId: string
    ): Promise<QuizReview> {
        const result = await this.generateQuizReviewWithRecommendation(sessionId, childId);
        return result.review;
    }

    /**
     * DEPRECATED: Use generateQuizReviewWithRecommendation instead
     * Recommend next skill based on quiz performance
     */
    async recommendNextSkill(
        sessionId: string,
        childId: string
    ): Promise<NextSkillRecommendation | null> {
        try {
            // Get session info
            const session = await prisma.session.findUnique({
                where: { id: sessionId },
                include: {
                    attempts: {
                        include: {
                            microSkill: {
                                include: {
                                    domain: true
                                }
                            }
                        }
                    }
                }
            });

            if (!session || session.attempts.length === 0) {
                return null;
            }

            const currentSkillId = session.attempts[0]?.microSkillId;
            const currentSkill = await prisma.microSkill.findUnique({
                where: { id: currentSkillId },
                include: { domain: true }
            });

            if (!currentSkill) {
                return null;
            }

            // Calculate performance
            const totalAttempts = session.attempts.length;
            const correctAttempts = session.attempts.filter(a => a.isCorrect).length;
            const accuracy = (correctAttempts / totalAttempts) * 100;

            // Get child's overall progress
            const skillProgress = await prisma.skillProgress.findMany({
                where: { childId },
                include: {
                    microSkill: {
                        include: { domain: true }
                    }
                }
            });

            // Get eligible next skills (not mastered)
            const masteredSkillIds = new Set(
                skillProgress
                    .filter(p => p.masteryStatus === 'MASTERED')
                    .map(p => p.microSkillId)
            );

            const allSkills = await prisma.microSkill.findMany({
                include: { domain: true }
            });

            const eligibleSkills = allSkills.filter(skill => {
                // Skip current skill and mastered skills
                if (skill.id === currentSkillId || masteredSkillIds.has(skill.id)) {
                    return false;
                }

                // Check prerequisites
                const prerequisites = skill.prerequisiteSkills as string[];
                if (prerequisites && prerequisites.length > 0) {
                    return prerequisites.every(prereqCode => {
                        const prereqSkill = allSkills.find(s => s.code === prereqCode);
                        return prereqSkill && masteredSkillIds.has(prereqSkill.id);
                    });
                }

                return true;
            });

            if (eligibleSkills.length === 0) {
                return null;
            }

            // Use AI to recommend best next skill
            const systemPrompt = `You are an expert educational AI that recommends the best next learning step for children.
Consider the child's recent performance and choose a skill that will build on their strengths while addressing gaps.`;

            const userPrompt = `Recommend the best next skill for this child:

Just Completed: ${currentSkill.name} (${currentSkill.code})
Domain: ${currentSkill.domain.name}
Performance: ${accuracy.toFixed(1)}% accuracy on ${totalAttempts} questions

Available Next Skills:
${eligibleSkills.slice(0, 10).map((s, i) => `${i + 1}. ${s.name} (${s.code}) - ${s.domain.name}`).join('\n')}

Child's Progress:
- Skills Mastered: ${masteredSkillIds.size}
- Skills In Progress: ${skillProgress.filter(p => p.masteryStatus === 'IN_PROGRESS').length}

Provide a JSON response:
{
  "skillCode": "A.1",
  "reason": "Why this skill is the best next step (2-3 sentences)",
  "confidence": 0.85
}

Choose a skill that:
1. Builds naturally on what they just learned
2. Matches their current ability level
3. Keeps them engaged and motivated
4. If they did well (>80%), challenge them slightly
5. If they struggled (<60%), reinforce fundamentals`;

            try {
                const response = await ai.generateStructuredResponse<{
                    skillCode: string;
                    reason: string;
                    confidence: number;
                }>(userPrompt, systemPrompt);

                const recommendedSkill = eligibleSkills.find(s => s.code === response.skillCode);
                if (!recommendedSkill) {
                    // Fallback to first eligible skill
                    const fallbackSkill = eligibleSkills[0];
                    return {
                        skillId: fallbackSkill.id,
                        skillName: fallbackSkill.name,
                        skillCode: fallbackSkill.code,
                        reason: `Continue building your skills in ${fallbackSkill.domain.name}!`,
                        confidence: 0.7
                    };
                }

                return {
                    skillId: recommendedSkill.id,
                    skillName: recommendedSkill.name,
                    skillCode: recommendedSkill.code,
                    reason: response.reason,
                    confidence: response.confidence
                };
            } catch (error) {
                console.error('AI recommendation failed, using fallback:', error);
                // Return first eligible skill as fallback
                const fallbackSkill = eligibleSkills[0];
                return {
                    skillId: fallbackSkill.id,
                    skillName: fallbackSkill.name,
                    skillCode: fallbackSkill.code,
                    reason: `Great job! Ready to try ${fallbackSkill.name}? It's a perfect next step!`,
                    confidence: 0.7
                };
            }
        } catch (error) {
            console.error('Error recommending next skill:', error);
            return null;
        }
    }

    /**
     * Fallback review when AI is unavailable
     */
    private getFallbackReview(
        accuracy: number,
        correct: number,
        total: number,
        confusionPatterns: string[]
    ): QuizReview {
        let overallPerformance = '';
        let encouragement = '';
        const strengths: string[] = [];
        const areasToImprove: string[] = [];

        if (accuracy >= 90) {
            overallPerformance = `Amazing! ${correct}/${total} correct! 🌟`;
            encouragement = 'You rock! Keep it up! 🎉';
            strengths.push('Super accurate! 🎯');
            strengths.push('You got this! 💪');
        } else if (accuracy >= 70) {
            overallPerformance = `Great job! ${correct}/${total} correct! ⭐`;
            encouragement = 'You\'re getting better! 🚀';
            strengths.push('Good work! 👍');
            areasToImprove.push('Keep practicing! 📚');
        } else {
            overallPerformance = `Nice try! ${correct}/${total} correct! 💪`;
            encouragement = 'Keep going! You\'ll get it! 🌈';
            areasToImprove.push('Try again! 🎯');
            areasToImprove.push('Take your time! ⏰');
        }

        return {
            overallPerformance,
            strengths,
            areasToImprove,
            specificFeedback: `${total} questions done! ${confusionPatterns.length > 0
                ? `Let's work on ${confusionPatterns[0]}! 💡`
                : 'Keep going! 🎮'
                }`,
            encouragement,
            confusionPatterns: confusionPatterns.map(p => `Watch out for ${p.replace(/_/g, ' ').toLowerCase()}`)
        };
    }
}

export default new QuizReviewService();

import express, { Request, Response } from 'express';
import cors from 'cors';
import getPrismaClient from './lib/db';
import dotenv from 'dotenv';
import { uploadAsset, getAssetUrl, deleteAsset, listAssets, validateAssetType } from './lib/s3-service';
import { uploadSingle, uploadMultiple, uploadDocument } from './lib/upload-middleware';
import { generateToken, generateRefreshToken, verifyToken, comparePassword } from './lib/auth';
import { authenticate, authorize } from './middleware/auth-middleware';
import performanceAnalyzer from './lib/performance-analyzer';
import recommendationEngine from './lib/recommendation-engine';
import documentProcessor from './lib/document-processor';
import quizReviewService from './lib/quiz-review-service';
import teacherService from './lib/teacher-service';
import { getAdminStats, createDomain } from './lib/admin-service';
dotenv.config();

// Initialize Prisma Client after environment variables are loaded
const prisma = getPrismaClient();

const app = express();
const port = Number(process.env.PORT) || 5000;

// CORS configuration - allow both localhost and production frontend
const allowedOrigins = [
    'http://localhost:3000',
    'https://gamified-ai.vercel.app',
    process.env.FRONTEND_URL
].filter(Boolean); // Remove undefined values

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        // Remove trailing slash from origin for comparison
        const normalizedOrigin = origin.replace(/\/$/, '');

        // Check if origin is allowed
        const isAllowed = allowedOrigins.some(allowed => {
            const normalizedAllowed = allowed?.replace(/\/$/, '');
            return normalizedAllowed === normalizedOrigin;
        });

        if (isAllowed) {
            callback(null, true);
        } else {
            console.warn(`CORS: Blocked origin ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Pragma'],
    exposedHeaders: ['Content-Range', 'X-Total-Count'],
    maxAge: 600,
    preflightContinue: false,
    optionsSuccessStatus: 204
}));

app.use(express.json());
app.use(require('cookie-parser')());

// Helper functions for skill progress calculations
function calculateAverageResponseTime(
    recentAttempts: any[],
    currentResponseTime: number,
    existingAvgTime?: number
): number {
    if (recentAttempts.length === 0) {
        return currentResponseTime;
    }

    if (existingAvgTime !== undefined) {
        // Exponential moving average to give more weight to recent attempts
        return (existingAvgTime * 0.7) + (currentResponseTime * 0.3);
    }

    // Calculate simple average for recent attempts
    const totalResponseTime = recentAttempts.reduce((sum, attempt) => sum + attempt.responseTimeSeconds, 0) + currentResponseTime;
    return totalResponseTime / (recentAttempts.length + 1);
}

function updateConfusionPatterns(
    existingPatterns: any,
    newConfusionType?: string | null
): any[] {
    // Handle case where existingPatterns might be a JSON string or already parsed array
    let patterns: string[] = [];

    if (typeof existingPatterns === 'string') {
        try {
            patterns = JSON.parse(existingPatterns);
        } catch {
            patterns = [];
        }
    } else if (Array.isArray(existingPatterns)) {
        patterns = existingPatterns;
    }

    if (!newConfusionType) {
        return patterns;
    }

    // Add new confusion type if it doesn't exist
    if (!patterns.includes(newConfusionType)) {
        return [...patterns, newConfusionType];
    }

    return patterns;
}

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', message: 'Backend server is running' });
});

// ============================================
// AUTHENTICATION ENDPOINTS
// ============================================

// Login endpoint (for all roles)
app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
        const { email, password, rememberMe } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user || !user.passwordHash) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Verify password
        const isValidPassword = await comparePassword(password, user.passwordHash);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Generate tokens
        const tokenPayload = {
            userId: user.id,
            role: user.role,
            email: user.email!
        };

        const token = rememberMe ? generateRefreshToken(tokenPayload) : generateToken(tokenPayload);

        // Set cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: rememberMe ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000 // 7 days or 24 hours
        });

        res.json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            },
            token
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Logout endpoint
app.post('/api/auth/logout', (req: Request, res: Response) => {
    res.clearCookie('token');
    res.json({ message: 'Logged out successfully' });
});

// Get current user
app.get('/api/auth/me', authenticate, async (req: Request, res: Response) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user!.userId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true
            }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to get user' });
    }
});

// Refresh token endpoint
app.post('/api/auth/refresh', authenticate, async (req: Request, res: Response) => {
    try {
        const tokenPayload = {
            userId: req.user!.userId,
            role: req.user!.role,
            email: req.user!.email
        };

        const newToken = generateToken(tokenPayload);

        res.cookie('token', newToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000
        });

        res.json({ token: newToken });
    } catch (error) {
        console.error('Refresh token error:', error);
        res.status(500).json({ error: 'Failed to refresh token' });
    }
});

// Get all skills
app.get('/api/skills', async (req: Request, res: Response) => {
    try {
        const skills = await prisma.microSkill.findMany({
            include: {
                domain: true
            },
            orderBy: {
                code: 'asc'
            }
        });
        res.json(skills);
    } catch (error) {
        console.error('Error fetching skills:', error);
        res.status(500).json({ error: 'Failed to fetch skills' });
    }
});

// Get questions for a skill
app.get('/api/skills/:skillId/questions', async (req: Request, res: Response) => {
    try {
        const { skillId } = req.params;
        const difficulty = req.query.difficulty ? parseInt(req.query.difficulty as string) : undefined;

        // Get skill info to check if it's a Recognition skill
        const skill = await prisma.microSkill.findUnique({
            where: { id: skillId },
            select: { code: true }
        });

        // For Recognition skills (RF.1.1, RF.2.1, RF.3.1, RF.4.1), ignore difficulty
        // All words in a list have the same difficulty level
        const isRecognitionSkill = skill?.code.match(/^RF\.[1-4]\.1$/);

        const questions = await prisma.question.findMany({
            where: {
                microSkillId: skillId,
                // Only filter by difficulty if NOT a Recognition skill
                ...(!isRecognitionSkill && difficulty && { difficultyLevel: difficulty })
            },
            include: {
                microSkill: {
                    select: {
                        gameTemplate: true
                    }
                }
            },
            orderBy: {
                createdAt: 'asc'
            }
        });

        // Parse JSON fields and transform to include gameTemplate at root level
        const parsedQuestions = questions.map(q => ({
            ...q,
            gameTemplate: q.microSkill.gameTemplate,
            distractors: Array.isArray(q.distractors)
                ? q.distractors
                : typeof q.distractors === 'string'
                    ? JSON.parse(q.distractors)
                    : [],
            assetUrls: typeof q.assetUrls === 'string'
                ? JSON.parse(q.assetUrls)
                : q.assetUrls,
            microSkill: undefined // Remove nested object
        }));

        res.json(parsedQuestions);
    } catch (error) {
        console.error('Error fetching questions:', error);
        res.status(500).json({ error: 'Failed to fetch questions' });
    }
});

// Get child progress
app.get('/api/child/:childId/progress', async (req: Request, res: Response) => {
    try {
        const { childId } = req.params;

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

        const allSkills = await prisma.microSkill.findMany({
            include: {
                domain: true
            }
        });

        const totalSkills = allSkills.length;
        const masteredSkills = skillProgress.filter(sp => sp.masteryStatus === 'MASTERED').length;
        const overallProgress = totalSkills > 0 ? Math.round((masteredSkills / totalSkills) * 100) : 0;

        const achievements = await prisma.achievement.findMany({
            where: { childId }
        });

        const totalStars = achievements.reduce((sum, a) => sum + a.starsEarned, 0);
        const totalCoins = achievements.reduce((sum, a) => sum + a.coinsEarned, 0);

        const sessions = await prisma.session.findMany({
            where: { childId },
            orderBy: { startedAt: 'desc' },
            take: 30
        });

        const streakDays = Math.min(sessions.length, 7);

        res.json({
            overallProgress,
            totalStars: Math.round(totalStars),
            totalCoins,
            streakDays,
            skillProgress,
            allSkills
        });
    } catch (error) {
        console.error('Error fetching child progress:', error);
        res.status(500).json({ error: 'Failed to fetch progress' });
    }
});

// Get teacher's students
app.get('/api/teacher/:teacherId/students', async (req: Request, res: Response) => {
    try {
        const { teacherId } = req.params;

        const children = await prisma.user.findMany({
            where: {
                teacherId,
                role: 'CHILD'
            },
            select: {
                id: true,
                name: true
            }
        });

        const studentsWithProgress = await Promise.all(
            children.map(async (child) => {
                const skillProgress = await prisma.skillProgress.findMany({
                    where: { childId: child.id }
                });

                const totalSkills = await prisma.microSkill.count();
                const masteredSkills = skillProgress.filter(sp => sp.masteryStatus === 'MASTERED').length;
                const masteryPercentage = totalSkills > 0 ? Math.round((masteredSkills / totalSkills) * 100) : 0;

                const avgAccuracy = skillProgress.length > 0
                    ? skillProgress.reduce((sum, sp) => sum + sp.accuracyPercentage, 0) / skillProgress.length
                    : 0;
                const atRisk = masteryPercentage < 50 || avgAccuracy < 50;

                return {
                    id: child.id,
                    name: child.name,
                    masteryPercentage,
                    skillsCompleted: masteredSkills,
                    atRisk
                };
            })
        );

        res.json(studentsWithProgress);
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({ error: 'Failed to fetch students' });
    }
});

// Get word mastery progress for a child
app.get('/api/child/:childId/word-mastery/:skillId', async (req: Request, res: Response) => {
    try {
        const { childId, skillId } = req.params;

        const wordMastery = await prisma.wordMastery.findMany({
            where: { childId, microSkillId: skillId },
            orderBy: { accuracyPercentage: 'desc' }
        });

        const { default: SightWordService } = await import('./lib/sight-word-service');
        const summary = await SightWordService.getProgressSummary(childId, skillId);

        res.json({
            wordMastery,
            summary
        });
    } catch (error) {
        console.error('Error fetching word mastery:', error);
        res.status(500).json({ error: 'Failed to fetch word mastery' });
    }
});

// Get comprehensive stage report for a child
app.get('/api/child/:childId/stage-report/:skillId', async (req: Request, res: Response) => {
    try {
        const { childId, skillId } = req.params;

        // Get skill info
        const skill = await prisma.microSkill.findUnique({
            where: { id: skillId },
            select: { code: true, name: true }
        });

        if (!skill) {
            return res.status(404).json({ error: 'Skill not found' });
        }

        // Get all attempts for this skill
        const attempts = await prisma.attempt.findMany({
            where: { childId, microSkillId: skillId },
            orderBy: { createdAt: 'desc' },
            take: 100
        });

        // Get skill progress
        const skillProgress = await prisma.skillProgress.findUnique({
            where: {
                childId_microSkillId: {
                    childId,
                    microSkillId: skillId
                }
            }
        });

        // Import services
        const { default: SightWordService } = await import('./lib/sight-word-service');

        // Calculate error patterns
        const errorPatterns = SightWordService.analyzeErrorPatterns(attempts as any);

        // Get word mastery data (for Recognition stages)
        let wordMastery: any[] = [];
        let strengthWords: string[] = [];
        let strugglingWords: string[] = [];
        let needsPracticeWords: string[] = [];

        if (skill.code.match(/^RF\.[1-4]\.[13]$/)) {
            // Recognition or Recall stages have word-level tracking
            wordMastery = await prisma.wordMastery.findMany({
                where: { childId, microSkillId: skillId },
                orderBy: { accuracyPercentage: 'desc' }
            });

            strengthWords = wordMastery
                .filter(wm => wm.tier === 1)
                .map(wm => wm.word);

            strugglingWords = wordMastery
                .filter(wm => wm.tier === 3)
                .map(wm => wm.word);

            needsPracticeWords = wordMastery
                .filter(wm => wm.tier === 2)
                .map(wm => wm.word);
        }

        // Calculate overall metrics
        const totalAttempts = attempts.length;
        const correctAttempts = attempts.filter(a => a.isCorrect).length;
        const overallAccuracy = totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : 0;

        // Calculate tier
        const tier = SightWordService.calculateTier(overallAccuracy);
        const riskIndicator = SightWordService.calculateRiskIndicator(errorPatterns, tier.tier);

        // Generate recommendations
        const recommendations: string[] = [];
        if (tier.tier === 3) {
            recommendations.push('Daily practice with visual aids recommended');
            recommendations.push('Consider one-on-one tutoring sessions');
            recommendations.push('Use multi-sensory learning approaches');
        } else if (tier.tier === 2) {
            recommendations.push('Regular practice 3-4 times per week');
            recommendations.push('Focus on struggling words');
            recommendations.push('Use memory games and flashcards');
        } else {
            recommendations.push('Maintain current practice routine');
            recommendations.push('Ready to progress to next stage');
            recommendations.push('Consider enrichment activities');
        }

        // Recommended games based on error patterns
        const recommendedGames: string[] = [];
        if (errorPatterns.visualConfusion) {
            recommendedGames.push('Visual Discrimination Games');
            recommendedGames.push('Letter Matching Activities');
        }
        if (errorPatterns.slowProcessing) {
            recommendedGames.push('Timed Flashcard Practice');
            recommendedGames.push('Speed Reading Exercises');
        }
        if (errorPatterns.randomGuessing) {
            recommendedGames.push('Meaning-Based Matching');
            recommendedGames.push('Context Clue Games');
        }

        // Calculate readiness score (0-100)
        let readinessScore = overallAccuracy;
        if (errorPatterns.visualConfusion) readinessScore -= 10;
        if (errorPatterns.slowProcessing) readinessScore -= 5;
        if (errorPatterns.inconsistentPerformance) readinessScore -= 10;
        readinessScore = Math.max(0, Math.min(100, readinessScore));

        res.json({
            skillInfo: {
                code: skill.code,
                name: skill.name
            },
            overallMetrics: {
                totalAttempts,
                correctAttempts,
                accuracy: Math.round(overallAccuracy),
                avgResponseTime: skillProgress?.avgResponseTime || 0,
                tier: tier.tier,
                tierLabel: tier.label,
                tierEmoji: tier.emoji,
                riskIndicator
            },
            wordBreakdown: {
                strengthWords,
                strugglingWords,
                needsPracticeWords,
                totalWords: wordMastery.length
            },
            errorPatterns,
            recommendations,
            recommendedGames,
            readinessScore: Math.round(readinessScore),
            lastAttemptedAt: skillProgress?.lastAttemptedAt || null
        });
    } catch (error) {
        console.error('Error fetching stage report:', error);
        res.status(500).json({ error: 'Failed to fetch stage report' });
    }
});


// Log attempt
app.post('/api/attempts', async (req: Request, res: Response) => {
    try {
        const {
            childId,
            questionId,
            microSkillId,
            sessionId,
            isCorrect,
            responseTimeSeconds,
            hintUsed,
            hintCount,
            userResponse,
            correctAnswer,
            difficultyLevelAtAttempt,
        } = req.body;

        // Error classification based on ErrorType enum
        let errorType = 'NONE';
        let confusionType: string | null = null;

        if (!isCorrect) {
            if (userResponse && correctAnswer) {
                // Check for specific confusion patterns
                if ((correctAnswer === 'b' && userResponse === 'd') || (correctAnswer === 'd' && userResponse === 'b') ||
                    (correctAnswer === 'B' && userResponse === 'D') || (correctAnswer === 'D' && userResponse === 'B')) {
                    errorType = 'B_D_CONFUSION';
                    confusionType = 'b_d_visual';
                } else if ((correctAnswer === 'p' && userResponse === 'q') || (correctAnswer === 'q' && userResponse === 'p') ||
                    (correctAnswer === 'P' && userResponse === 'Q') || (correctAnswer === 'Q' && userResponse === 'P')) {
                    errorType = 'P_Q_CONFUSION';
                    confusionType = 'p_q_visual';
                } else if ((correctAnswer === 'm' && userResponse === 'n') || (correctAnswer === 'n' && userResponse === 'm') ||
                    (correctAnswer === 'M' && userResponse === 'N') || (correctAnswer === 'N' && userResponse === 'M')) {
                    errorType = 'M_N_CONFUSION';
                    confusionType = 'm_n_visual';
                } else if ((correctAnswer === 'u' && userResponse === 'n') || (correctAnswer === 'n' && userResponse === 'u') ||
                    (correctAnswer === 'U' && userResponse === 'N') || (correctAnswer === 'N' && userResponse === 'U')) {
                    errorType = 'U_N_CONFUSION';
                    confusionType = 'u_n_visual';
                } else {
                    errorType = 'OTHER';
                }
            } else {
                errorType = 'OTHER';
            }
        }

        // Create attempt with new fields
        const attempt = await prisma.attempt.create({
            data: {
                childId,
                questionId,
                microSkillId,
                sessionId,
                isCorrect,
                responseTimeSeconds,
                hintUsed: hintUsed || false,
                hintCount: hintCount || 0,
                errorType: errorType as any,
                difficultyLevelAtAttempt,
                userResponse: userResponse || null,
                confusionType,
            },
        });

        // Calculate stars (simple formula)
        let stars = 0;
        if (isCorrect) {
            stars = 1;
            if (responseTimeSeconds < 3) stars += 0.5;
            if (!hintUsed) stars += 0.5;
            stars = Math.min(3, stars);
        }
        const coins = Math.round(stars);

        // Get recent attempts for adaptive analysis
        const recentAttempts = await prisma.attempt.findMany({
            where: {
                childId,
                microSkillId,
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
        });

        // Prepare data for adaptive engine
        const attemptData = recentAttempts.map(a => ({
            isCorrect: a.isCorrect,
            responseTimeSeconds: a.responseTimeSeconds,
            errorType: a.errorType as any,
            difficultyLevelAtAttempt: a.difficultyLevelAtAttempt,
            createdAt: a.createdAt,
        }));

        // Get real-time analysis from adaptive engine
        const { AdaptiveDifficultyEngine } = await import('./lib/adaptive-engine');
        const analysis = AdaptiveDifficultyEngine.analyzeAttemptInRealTime(
            attemptData,
            difficultyLevelAtAttempt as 1 | 2 | 3
        );

        // Get next question difficulty based on LAST 5 attempts
        // Note: attemptData is ordered DESC (newest first), so slice(0, 5) gets the 5 most recent
        const last5Attempts = attemptData.slice(0, 5);
        // console.log(`[ADAPTIVE] Analyzing last ${last5Attempts.length} attempts for difficulty recommendation`);
        // console.log(`[ADAPTIVE] Current difficulty: ${difficultyLevelAtAttempt}`);
        // console.log(`[ADAPTIVE] Last 5 attempts accuracy: ${last5Attempts.filter(a => a.isCorrect).length}/${last5Attempts.length}`);
        // console.log(`[ADAPTIVE] Last 5 attempts times: ${last5Attempts.map(a => a.responseTimeSeconds.toFixed(1)).join(', ')}s`);

        const nextQuestionDifficulty = AdaptiveDifficultyEngine.getAdaptiveDifficultyForNextQuestion(
            last5Attempts, // Get last 5 attempts (first 5 from desc-ordered array)
            difficultyLevelAtAttempt as 1 | 2 | 3
        );

        // console.log(`[ADAPTIVE] Recommended next difficulty: ${nextQuestionDifficulty}`);

        // Update skill progress with recalculated accuracy and AI insights
        const existingProgress = await prisma.skillProgress.findUnique({
            where: {
                childId_microSkillId: {
                    childId,
                    microSkillId,
                },
            },
        });

        const newCorrectAttempts = (existingProgress?.correctAttempts || 0) + (isCorrect ? 1 : 0);
        const newTotalAttempts = (existingProgress?.totalAttempts || 0) + 1;
        const newAccuracy = (newCorrectAttempts / newTotalAttempts) * 100;

        // Calculate average response time
        const newAvgTime = calculateAverageResponseTime(recentAttempts, responseTimeSeconds, existingProgress?.avgResponseTime);

        // Update confusion patterns
        const updatedPatterns = updateConfusionPatterns(existingProgress?.confusionPatterns || [], confusionType);

        // Generate behavioral tip (every 5 attempts to minimize API calls)
        let behavioralTip: string | null = null;
        if (newTotalAttempts % 5 === 0) {
            const { default: AITipsService } = await import('./lib/ai-tips-service');
            const tip = await AITipsService.generateBehavioralTip(childId, recentAttempts);
            behavioralTip = tip.message;
        }

        // Update skill progress with recalculated accuracy and AI insights
        const updatedProgress = await prisma.skillProgress.upsert({
            where: {
                childId_microSkillId: {
                    childId,
                    microSkillId,
                },
            },
            update: {
                totalAttempts: newTotalAttempts,
                correctAttempts: newCorrectAttempts,
                accuracyPercentage: newAccuracy,
                avgResponseTime: newAvgTime,
                recommendedDifficulty: nextQuestionDifficulty,
                confusionPatterns: updatedPatterns,
                learningTrend: analysis.learningTrend,
                lastAttemptedAt: new Date(),
            },
            create: {
                childId,
                microSkillId,
                masteryStatus: 'IN_PROGRESS',
                currentDifficultyLevel: difficultyLevelAtAttempt,
                recommendedDifficulty: nextQuestionDifficulty,
                totalAttempts: 1,
                correctAttempts: isCorrect ? 1 : 0,
                accuracyPercentage: isCorrect ? 100 : 0,
                avgResponseTime: responseTimeSeconds,
                confusionPatterns: confusionType ? [confusionType] : [],
                learningTrend: 'stable',
                lastAttemptedAt: new Date(),
            },
            include: {
                microSkill: true
            }
        });

        // Calculate tier for Reading Foundation Recognition stages (RF.1.1, RF.2.1, RF.3.1, RF.4.1)
        // This is the baseline diagnostic signal
        let tierInfo = null;
        if (updatedProgress.microSkill.code.match(/^RF\.[1-4]\.1$/)) {
            // Get the question to extract the word
            const question = await prisma.question.findUnique({
                where: { id: questionId }
            });

            if (question) {
                const word = question.correctAnswer;

                // Update word mastery for this specific word
                const existingWordMastery = await prisma.wordMastery.findUnique({
                    where: {
                        childId_word_microSkillId: {
                            childId,
                            word,
                            microSkillId
                        }
                    }
                });

                const newCorrect = (existingWordMastery?.correctAttempts || 0) + (isCorrect ? 1 : 0);
                const newTotal = (existingWordMastery?.totalAttempts || 0) + 1;
                const newWordAccuracy = (newCorrect / newTotal) * 100;
                const newAvgTime = existingWordMastery
                    ? (existingWordMastery.avgResponseTime * existingWordMastery.totalAttempts + responseTimeSeconds) / newTotal
                    : responseTimeSeconds;

                const { default: SightWordService } = await import('./lib/sight-word-service');
                const wordTier = SightWordService.calculateTier(newWordAccuracy);

                await prisma.wordMastery.upsert({
                    where: {
                        childId_word_microSkillId: {
                            childId,
                            word,
                            microSkillId
                        }
                    },
                    update: {
                        totalAttempts: newTotal,
                        correctAttempts: newCorrect,
                        accuracyPercentage: newWordAccuracy,
                        avgResponseTime: newAvgTime,
                        tier: wordTier.tier,
                        tierLabel: wordTier.label,
                        lastAttemptedAt: new Date(),
                        masteredAt: wordTier.tier === 1 ? new Date() : null
                    },
                    create: {
                        childId,
                        word,
                        microSkillId,
                        totalAttempts: 1,
                        correctAttempts: isCorrect ? 1 : 0,
                        accuracyPercentage: isCorrect ? 100 : 0,
                        avgResponseTime: responseTimeSeconds,
                        tier: wordTier.tier,
                        tierLabel: wordTier.label
                    }
                });

                // Calculate overall tier from FIRST attempt (removed 10-attempt restriction)
                // This provides immediate diagnostic feedback
                const allWordMastery = await prisma.wordMastery.findMany({
                    where: { childId, microSkillId }
                });

                const overallTier = SightWordService.calculateOverallTier(allWordMastery);
                const errorPatterns = SightWordService.analyzeErrorPatterns(recentAttempts as any);
                const riskIndicator = SightWordService.calculateRiskIndicator(errorPatterns, overallTier.tier);

                // Store tier information in aiInsights (baseline diagnostic)
                const aiInsights = {
                    tier: overallTier.tier,
                    tierLabel: overallTier.label,
                    tierEmoji: overallTier.emoji,
                    tierDescription: overallTier.description,
                    errorPatterns,
                    riskIndicator,
                    wordsAttempted: allWordMastery.length,
                    wordsMastered: allWordMastery.filter(wm => wm.tier === 1).length,
                    calculatedAt: new Date().toISOString(),
                    isBaselineDiagnostic: true // Mark as baseline from Recognition stage
                };

                await prisma.skillProgress.update({
                    where: {
                        childId_microSkillId: {
                            childId,
                            microSkillId,
                        }
                    },
                    data: {
                        aiInsights: JSON.stringify(aiInsights)
                    }
                });

                tierInfo = overallTier;
            }
        }

        res.json({
            attempt,
            stars,
            coins,
            adaptiveRecommendation: {
                shouldAdjustDifficulty: analysis.shouldAdjustDifficulty,
                newDifficulty: analysis.newDifficulty,
                reason: analysis.reason,
                insights: analysis.insights,
            },
            nextQuestionDifficulty,
            behavioralTip, // New: behavioral tip for child assessment
            tierInfo, // New: tier classification for Reading Foundation
        });
    } catch (error) {
        console.error('Error logging attempt:', error);
        res.status(500).json({ error: 'Failed to log attempt' });
    }
});


// ============================================
// ASSET MANAGEMENT ENDPOINTS
// ============================================

// Upload single asset
app.post('/api/assets/upload', uploadSingle, async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { folder, subFolder } = req.body;
        if (!folder || !['images', 'audio', 'animations'].includes(folder)) {
            return res.status(400).json({ error: 'Invalid folder type' });
        }

        // Validate file type
        if (!validateAssetType(req.file.mimetype, folder as any)) {
            return res.status(400).json({ error: `Invalid file type for ${folder}` });
        }

        const asset = await uploadAsset({
            file: req.file.buffer,
            fileName: req.file.originalname,
            folder: folder as any,
            subFolder,
            contentType: req.file.mimetype,
        });

        res.json(asset);
    } catch (error) {
        console.error('Error uploading asset:', error);
        res.status(500).json({ error: 'Failed to upload asset' });
    }
});

// Upload multiple assets
app.post('/api/assets/upload-multiple', uploadMultiple, async (req: Request, res: Response) => {
    try {
        if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        const { folder, subFolder } = req.body;
        if (!folder || !['images', 'audio', 'animations'].includes(folder)) {
            return res.status(400).json({ error: 'Invalid folder type' });
        }

        const uploadedAssets = [];
        for (const file of req.files) {
            if (!validateAssetType(file.mimetype, folder as any)) {
                continue; // Skip invalid files
            }

            const asset = await uploadAsset({
                file: file.buffer,
                fileName: file.originalname,
                folder: folder as any,
                subFolder,
                contentType: file.mimetype,
            });
            uploadedAssets.push(asset);
        }

        res.json({ uploaded: uploadedAssets.length, assets: uploadedAssets });
    } catch (error) {
        console.error('Error uploading assets:', error);
        res.status(500).json({ error: 'Failed to upload assets' });
    }
});

// List assets in a folder
app.get('/api/assets/list', async (req: Request, res: Response) => {
    try {
        const { folder, subFolder } = req.query;
        if (!folder || !['images', 'audio', 'animations'].includes(folder as string)) {
            return res.status(400).json({ error: 'Invalid folder type' });
        }

        const assets = await listAssets(folder as string, subFolder as string);
        res.json({ assets });
    } catch (error) {
        console.error('Error listing assets:', error);
        res.status(500).json({ error: 'Failed to list assets' });
    }
});

// Delete asset
app.delete('/api/assets/:key', async (req: Request, res: Response) => {
    try {
        const { key } = req.params;
        await deleteAsset(decodeURIComponent(key));
        res.json({ message: 'Asset deleted successfully' });
    } catch (error) {
        console.error('Error deleting asset:', error);
        res.status(500).json({ error: 'Failed to delete asset' });
    }
});

// ============================================
// DOMAIN & SKILL ENDPOINTS
// ============================================

// Get all domains
app.get('/api/domains', async (req: Request, res: Response) => {
    try {
        const domains = await prisma.skillDomain.findMany({
            include: {
                microSkills: {
                    select: {
                        id: true,
                        name: true,
                        code: true
                    }
                }
            },
            orderBy: {
                name: 'asc'
            }
        });
        res.json(domains);
    } catch (error) {
        console.error('Error fetching domains:', error);
        res.status(500).json({ error: 'Failed to fetch domains' });
    }
});

// Create new domain
app.post('/api/domains', async (req: Request, res: Response) => {
    try {
        const { name, code, description } = req.body;

        if (!name || !code) {
            return res.status(400).json({ error: 'Name and code are required' });
        }

        const domain = await createDomain({ name, code, description: description || '' });
        res.json(domain);
    } catch (error: any) {
        console.error('Error creating domain:', error);
        res.status(500).json({ error: error.message || 'Failed to create domain' });
    }
});

// Get admin stats
app.get('/api/admin/stats', async (req: Request, res: Response) => {
    try {
        const stats = await getAdminStats();
        res.json(stats);
    } catch (error) {
        console.error('Error fetching admin stats:', error);
        res.status(500).json({ error: 'Failed to fetch admin stats' });
    }
});

// Create new skill
app.post('/api/skills', async (req: Request, res: Response) => {
    try {
        const { name, code, domainId, gameTemplate, masteryCriteria } = req.body;

        if (!name || !code || !domainId) {
            return res.status(400).json({ error: 'Name, code, and domainId are required' });
        }

        // Check if skill with same code already exists
        let finalCode = code;
        let counter = 1;
        let existingSkill = await prisma.microSkill.findUnique({
            where: { code: finalCode }
        });

        // If code exists, append a number until we find a unique one
        while (existingSkill) {
            finalCode = `${code}_${counter}`;
            counter++;
            existingSkill = await prisma.microSkill.findUnique({
                where: { code: finalCode }
            });
        }

        const skill = await prisma.microSkill.create({
            data: {
                name,
                code: finalCode,
                domainId,
                gameTemplate: (gameTemplate as any) || 'TAP_SELECT',
                masteryCriteria: masteryCriteria || {
                    minAttempts: 5,
                    accuracyThreshold: 0.8
                }
            }
        });

        res.json(skill);
    } catch (error) {
        console.error('Error creating skill:', error);
        res.status(500).json({ error: 'Failed to create skill' });
    }
});

// Get all skills
app.get('/api/skills', async (req: Request, res: Response) => {
    try {
        const skills = await prisma.microSkill.findMany({
            include: {
                domain: true
            },
            orderBy: {
                code: 'asc'
            }
        });
        res.json(skills);
    } catch (error) {
        console.error('Error fetching skills:', error);
        res.status(500).json({ error: 'Failed to fetch skills' });
    }
});

// ============================================
// SESSION MANAGEMENT ENDPOINTS
// ============================================

// Start a new session
app.post('/api/sessions/start', async (req: Request, res: Response) => {
    try {
        const { childId } = req.body;

        const session = await prisma.session.create({
            data: {
                childId,
                startedAt: new Date(),
                skillsAttempted: [],
            },
        });

        res.json(session);
    } catch (error) {
        console.error('Error starting session:', error);
        res.status(500).json({ error: 'Failed to start session' });
    }
});

// End a session
app.post('/api/sessions/:sessionId/end', async (req: Request, res: Response) => {
    try {
        const { sessionId } = req.params;

        const session = await prisma.session.findUnique({
            where: { id: sessionId },
            include: { attempts: true },
        });

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        const totalTime = Math.floor((new Date().getTime() - session.startedAt.getTime()) / 1000);
        const skillsAttempted = [...new Set(session.attempts.map(a => a.microSkillId))];

        // Calculate stars and coins from attempts
        let totalStars = 0;
        let totalCoins = 0;

        session.attempts.forEach(attempt => {
            if (attempt.isCorrect) {
                let stars = 1;
                if (attempt.responseTimeSeconds < 3) stars += 0.5;
                if (!attempt.hintUsed) stars += 0.5;
                stars = Math.min(3, stars);

                totalStars += stars;
                totalCoins += Math.round(stars);
            }
        });

        // Determine badge type
        let badgeType: 'FIRST_SKILL' | 'PERFECT_SCORE' | 'SPEED_DEMON' | 'STREAK_WARRIOR' = 'FIRST_SKILL';
        const accuracy = session.attempts.length > 0
            ? (session.attempts.filter(a => a.isCorrect).length / session.attempts.length) * 100
            : 0;

        if (accuracy === 100) {
            badgeType = 'PERFECT_SCORE';
        } else if (session.attempts.every(a => a.responseTimeSeconds < 3)) {
            badgeType = 'SPEED_DEMON';
        }

        // Create achievement record
        if (session.attempts.length > 0) {
            await prisma.achievement.create({
                data: {
                    childId: session.childId,
                    badgeType,
                    starsEarned: totalStars,
                    coinsEarned: totalCoins,
                },
            });
        }

        const updatedSession = await prisma.session.update({
            where: { id: sessionId },
            data: {
                endedAt: new Date(),
                totalTimeSeconds: totalTime,
                skillsAttempted,
            },
        });

        res.json(updatedSession);
    } catch (error) {
        console.error('Error ending session:', error);
        res.status(500).json({ error: 'Failed to end session' });
    }
});

// ============================================
// BULK UPLOAD ENDPOINT
// ============================================

// Bulk upload questions (CSV/JSON)
app.post('/api/admin/questions/bulk', express.json({ limit: '10mb' }), async (req: Request, res: Response) => {
    try {
        const { questions } = req.body;

        if (!Array.isArray(questions)) {
            return res.status(400).json({ error: 'Questions must be an array' });
        }

        const created = [];
        const errors = [];

        for (let i = 0; i < questions.length; i++) {
            try {
                const q = questions[i];
                const question = await prisma.question.create({
                    data: {
                        microSkillId: q.microSkillId,
                        difficultyLevel: q.difficultyLevel,
                        promptText: q.promptText,
                        promptAudioUrl: q.promptAudioUrl || null,
                        correctAnswer: q.correctAnswer,
                        distractors: q.distractors || [],
                        hasConfusingDistractors: q.hasConfusingDistractors || false,
                        assetUrls: q.assetUrls || {},
                    },
                });
                created.push(question);
            } catch (error: any) {
                errors.push({ index: i, error: error.message });
            }
        }

        res.json({
            success: created.length,
            failed: errors.length,
            created,
            errors,
        });
    } catch (error) {
        console.error('Error bulk uploading questions:', error);
        res.status(500).json({ error: 'Failed to bulk upload questions' });
    }
});

// ============================================
// MASTERY CALCULATION ENDPOINT
// ============================================

// Calculate and update mastery for a child's skill
app.post('/api/child/:childId/calculate-mastery', async (req: Request, res: Response) => {
    try {
        const { childId } = req.params;
        const { microSkillId } = req.body;

        // Get last 10 attempts for this skill
        const recentAttempts = await prisma.attempt.findMany({
            where: {
                childId,
                microSkillId,
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
        });

        if (recentAttempts.length < 5) {  // Lowered from 10 to 5 for faster testing
            return res.json({
                message: 'Not enough attempts for mastery calculation',
                mastered: false,
                attemptsNeeded: 5 - recentAttempts.length
            });
        }

        const correctCount = recentAttempts.filter(a => a.isCorrect).length;
        const accuracy = (correctCount / recentAttempts.length) * 100;
        const avgTime = recentAttempts.reduce((sum, a) => sum + a.responseTimeSeconds, 0) / recentAttempts.length;
        const confusionErrors = recentAttempts.filter(a =>
            a.errorType !== 'NONE' && a.errorType !== 'OTHER'
        ).length;
        const confusionRate = (confusionErrors / recentAttempts.length) * 100;

        // Check mastery criteria
        // Relaxed time threshold from 4s to 15s for realistic gameplay
        const isMastered = accuracy >= 80 && avgTime <= 15 && confusionRate < 20;

        const skillProgress = await prisma.skillProgress.update({
            where: {
                childId_microSkillId: {
                    childId,
                    microSkillId,
                },
            },
            data: {
                masteryStatus: isMastered ? 'MASTERED' : 'IN_PROGRESS',
                accuracyPercentage: accuracy,
                avgResponseTime: avgTime,
                masteredAt: isMastered ? new Date() : null,
            },
        });

        // Create achievement for mastering a skill
        if (isMastered) {
            // Calculate bonus stars and coins for mastery
            const masteryStars = 5; // Bonus stars for mastering a skill
            const masteryCoins = 10; // Bonus coins for mastering a skill

            await prisma.achievement.create({
                data: {
                    childId,
                    badgeType: 'DOMAIN_MASTER',
                    starsEarned: masteryStars,
                    coinsEarned: masteryCoins,
                },
            });
        }

        res.json({
            mastered: isMastered,
            accuracy,
            avgTime,
            confusionRate,
            skillProgress,
        });
    } catch (error) {
        console.error('Error calculating mastery:', error);
        res.status(500).json({ error: 'Failed to calculate mastery' });
    }
});

// ============================================
// QUIZ REVIEW & RECOMMENDATION ENDPOINTS
// ============================================

// Generate AI review after quiz completion
app.post('/api/quiz/review', async (req: Request, res: Response) => {
    try {
        const { sessionId, childId } = req.body;

        if (!sessionId || !childId) {
            return res.status(400).json({ error: 'sessionId and childId are required' });
        }

        const review = await quizReviewService.generateQuizReview(sessionId, childId);
        res.json(review);
    } catch (error) {
        console.error('Error generating quiz review:', error);
        res.status(500).json({ error: 'Failed to generate quiz review' });
    }
});

// Get AI recommendation for next skill
app.post('/api/quiz/recommend-next', async (req: Request, res: Response) => {
    try {
        const { sessionId, childId } = req.body;

        if (!sessionId || !childId) {
            return res.status(400).json({ error: 'sessionId and childId are required' });
        }

        const recommendation = await quizReviewService.recommendNextSkill(sessionId, childId);
        res.json(recommendation);
    } catch (error) {
        console.error('Error recommending next skill:', error);
        res.status(500).json({ error: 'Failed to recommend next skill' });
    }
});

// ============================================
// PERFORMANCE REPORTS ENDPOINTS
// ============================================

// Generate performance report
app.post('/api/performance/generate', async (req: Request, res: Response) => {
    try {
        const { childId, startDate, endDate } = req.body;

        if (!childId || !startDate || !endDate) {
            return res.status(400).json({ error: 'childId, startDate, and endDate are required' });
        }

        const report = await performanceAnalyzer.generateReport(
            childId,
            new Date(startDate),
            new Date(endDate)
        );

        res.json(report);
    } catch (error: any) {
        console.error('Error generating performance report:', error);
        res.status(500).json({ error: error.message || 'Failed to generate performance report' });
    }
});

// Get performance reports for a child
app.get('/api/performance/child/:childId', async (req: Request, res: Response) => {
    try {
        const { childId } = req.params;
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

        const reports = await performanceAnalyzer.getChildReports(childId, limit);
        res.json(reports);
    } catch (error) {
        console.error('Error fetching performance reports:', error);
        res.status(500).json({ error: 'Failed to fetch performance reports' });
    }
});

// ============================================
// RECOMMENDATIONS ENDPOINTS
// ============================================

// Generate recommendations for a child
app.post('/api/recommendations/generate', async (req: Request, res: Response) => {
    try {
        const { childId, limit } = req.body;

        if (!childId) {
            return res.status(400).json({ error: 'childId is required' });
        }

        const recommendations = await recommendationEngine.generateRecommendations(
            childId,
            limit || 5
        );

        res.json(recommendations);
    } catch (error: any) {
        console.error('Error generating recommendations:', error);
        res.status(500).json({ error: error.message || 'Failed to generate recommendations' });
    }
});

// Get active recommendations for a child
app.get('/api/recommendations/:childId', async (req: Request, res: Response) => {
    try {
        const { childId } = req.params;

        const recommendations = await recommendationEngine.getActiveRecommendations(childId);
        res.json(recommendations);
    } catch (error) {
        console.error('Error fetching recommendations:', error);
        res.status(500).json({ error: 'Failed to fetch recommendations' });
    }
});

// Mark recommendation as completed
app.post('/api/recommendations/:id/complete', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const recommendation = await recommendationEngine.completeRecommendation(id);
        res.json(recommendation);
    } catch (error) {
        console.error('Error completing recommendation:', error);
        res.status(500).json({ error: 'Failed to complete recommendation' });
    }
});

// ============================================
// DOCUMENT PROCESSING ENDPOINTS
// ============================================

// Upload and process document
app.post('/api/admin/documents/upload', uploadDocument, async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const fileType = req.file.originalname.endsWith('.pdf') ? 'PDF' : 'DOCX';
        const uploadedBy = req.user?.userId || 'admin'; // Get from auth middleware

        // S3 upload commented out - AWS credentials not configured
        // const s3Upload = await uploadAsset({
        //     file: req.file.buffer,
        //     fileName: req.file.originalname,
        //     folder: 'documents' as any,
        //     contentType: req.file.mimetype
        // });

        // Use placeholder URL instead of S3
        const fileUrl = `/uploads/documents/${req.file.originalname}`;

        // Process document
        const result = await documentProcessor.processDocument(
            req.file.buffer,
            req.file.originalname,
            fileType,
            uploadedBy,
            fileUrl
        );

        res.json(result);
    } catch (error: any) {
        console.error('Error processing document:', error);
        res.status(500).json({ error: error.message || 'Failed to process document' });
    }
});

// Get document processing status
app.get('/api/admin/documents/:documentId/status', async (req: Request, res: Response) => {
    try {
        const { documentId } = req.params;

        const status = await documentProcessor.getDocumentStatus(documentId);
        res.json(status);
    } catch (error) {
        console.error('Error fetching document status:', error);
        res.status(500).json({ error: 'Failed to fetch document status' });
    }
});

// Get all documents
app.get('/api/admin/documents', async (req: Request, res: Response) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

        const documents = await documentProcessor.getAllDocuments(limit);
        res.json(documents);
    } catch (error) {
        console.error('Error fetching documents:', error);
        res.status(500).json({ error: 'Failed to fetch documents' });
    }
});

// Approve extracted question
app.post('/api/admin/questions/:questionId/approve', async (req: Request, res: Response) => {
    try {
        const { questionId } = req.params;
        const { skillId } = req.body;

        if (!skillId) {
            return res.status(400).json({ error: 'skillId is required' });
        }

        const question = await documentProcessor.approveQuestion(questionId, skillId);
        res.json(question);
    } catch (error) {
        console.error('Error approving question:', error);
        res.status(500).json({ error: 'Failed to approve question' });
    }
});

// Update question metadata (difficulty, game template)
app.patch('/api/admin/questions/:questionId/metadata', async (req: Request, res: Response) => {
    try {
        const { questionId } = req.params;
        const { difficultyLevel, gameTemplate } = req.body;

        const updateData: any = {};
        if (difficultyLevel !== undefined) updateData.difficultyLevel = difficultyLevel;
        if (gameTemplate !== undefined) updateData.gameTemplate = gameTemplate;

        const question = await prisma.extractedQuestion.update({
            where: { id: questionId },
            data: updateData
        });

        res.json(question);
    } catch (error) {
        console.error('Error updating question metadata:', error);
        res.status(500).json({ error: 'Failed to update question metadata' });
    }
});

// Update extracted question content (text, options, explanation)
app.patch('/api/admin/extracted-questions/:questionId', async (req: Request, res: Response) => {
    try {
        const { questionId } = req.params;
        const { questionText, options, correctAnswer, explanation, difficultyLevel } = req.body;

        const updateData: any = {};
        if (questionText !== undefined) updateData.questionText = questionText;
        if (options !== undefined) updateData.options = options;
        if (correctAnswer !== undefined) updateData.correctAnswer = correctAnswer;
        if (explanation !== undefined) updateData.explanation = explanation;
        if (difficultyLevel !== undefined) updateData.difficultyLevel = difficultyLevel;

        const question = await prisma.extractedQuestion.update({
            where: { id: questionId },
            data: updateData
        });

        res.json(question);
    } catch (error) {
        console.error('Error updating extracted question:', error);
        res.status(500).json({ error: 'Failed to update extracted question' });
    }
});

// Bulk update question metadata
app.patch('/api/admin/questions/bulk-metadata', async (req: Request, res: Response) => {
    try {
        const { questionIds, difficultyLevel, gameTemplate } = req.body;

        if (!questionIds || !Array.isArray(questionIds) || questionIds.length === 0) {
            return res.status(400).json({ error: 'questionIds array is required' });
        }

        const updateData: any = {};
        if (difficultyLevel !== undefined) updateData.difficultyLevel = difficultyLevel;
        if (gameTemplate !== undefined) updateData.gameTemplate = gameTemplate;

        const result = await prisma.extractedQuestion.updateMany({
            where: { id: { in: questionIds } },
            data: updateData
        });

        res.json({ success: true, count: result.count });
    } catch (error) {
        console.error('Error bulk updating metadata:', error);
        res.status(500).json({ error: 'Failed to bulk update metadata' });
    }
});

// Bulk approve extracted questions
app.post('/api/admin/questions/bulk-approve', async (req: Request, res: Response) => {
    try {
        const { questionIds, skillId } = req.body;

        if (!skillId || !questionIds || !Array.isArray(questionIds) || questionIds.length === 0) {
            return res.status(400).json({ error: 'skillId and questionIds array are required' });
        }

        console.log(`Bulk approving ${questionIds.length} questions for skill ${skillId}`);

        // Process all questions in parallel for better performance
        const results = await Promise.all(
            questionIds.map(questionId =>
                documentProcessor.approveQuestion(questionId, skillId)
            )
        );

        console.log(`Successfully approved ${results.length} questions`);
        res.json({
            success: true,
            count: results.length,
            questions: results
        });
    } catch (error) {
        console.error('Error bulk approving questions:', error);
        res.status(500).json({ error: 'Failed to bulk approve questions' });
    }
});

// Reject extracted question
app.post('/api/admin/questions/:questionId/reject', async (req: Request, res: Response) => {
    try {
        const { questionId } = req.params;

        const question = await documentProcessor.rejectQuestion(questionId);
        res.json(question);
    } catch (error) {
        console.error('Error rejecting question:', error);
        res.status(500).json({ error: 'Failed to reject question' });
    }
});

// ============================================
// ADMIN CRUD ENDPOINTS
// ============================================

// Users CRUD
app.get('/api/admin/users', async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const pageSize = parseInt(req.query.pageSize as string) || 20;
        const search = req.query.search as string || '';
        const role = req.query.role as string || '';

        const where: any = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } }
            ];
        }
        if (role) {
            where.role = role;
        }

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                skip: (page - 1) * pageSize,
                take: pageSize,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    createdAt: true
                },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.user.count({ where })
        ]);

        res.json({ users, total });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

app.post('/api/admin/users', async (req: Request, res: Response) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Hash password
        const bcrypt = require('bcrypt');
        const passwordHash = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                passwordHash,
                role
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true
            }
        });

        res.json(user);
    } catch (error: any) {
        console.error('Error creating user:', error);
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Email already exists' });
        }
        res.status(500).json({ error: 'Failed to create user' });
    }
});

app.patch('/api/admin/users/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, role } = req.body;

        const user = await prisma.user.update({
            where: { id },
            data: { name, role },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true
            }
        });

        res.json(user);
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

app.delete('/api/admin/users/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        await prisma.user.delete({
            where: { id }
        });

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

// Domains CRUD (Update and Delete)
app.patch('/api/domains/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;

        const domain = await prisma.skillDomain.update({
            where: { id },
            data: { name, description },
            include: {
                microSkills: {
                    select: {
                        id: true,
                        name: true,
                        code: true
                    }
                }
            }
        });

        res.json(domain);
    } catch (error) {
        console.error('Error updating domain:', error);
        res.status(500).json({ error: 'Failed to update domain' });
    }
});

app.delete('/api/domains/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Check for dependent skills
        const skillCount = await prisma.microSkill.count({
            where: { domainId: id }
        });

        if (skillCount > 0) {
            return res.status(400).json({
                error: `Cannot delete domain. ${skillCount} skills are associated with it.`
            });
        }

        await prisma.skillDomain.delete({
            where: { id }
        });

        res.json({ message: 'Domain deleted successfully' });
    } catch (error) {
        console.error('Error deleting domain:', error);
        res.status(500).json({ error: 'Failed to delete domain' });
    }
});

// Skills CRUD (Update and Delete)
app.patch('/api/skills/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, domainId, gameTemplate } = req.body;

        const skill = await prisma.microSkill.update({
            where: { id },
            data: { name, domainId, gameTemplate },
            include: {
                domain: true
            }
        });

        res.json(skill);
    } catch (error) {
        console.error('Error updating skill:', error);
        res.status(500).json({ error: 'Failed to update skill' });
    }
});

app.delete('/api/skills/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Check for dependent questions
        const questionCount = await prisma.question.count({
            where: { microSkillId: id }
        });

        if (questionCount > 0) {
            return res.status(400).json({
                error: `Cannot delete skill. ${questionCount} questions are associated with it.`
            });
        }

        await prisma.microSkill.delete({
            where: { id }
        });

        res.json({ message: 'Skill deleted successfully' });
    } catch (error) {
        console.error('Error deleting skill:', error);
        res.status(500).json({ error: 'Failed to delete skill' });
    }
});

// Questions CRUD
app.get('/api/admin/questions', async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const pageSize = parseInt(req.query.pageSize as string) || 20;
        const search = req.query.search as string || '';
        const skillId = req.query.skillId as string || '';
        const difficulty = req.query.difficulty ? parseInt(req.query.difficulty as string) : undefined;

        const where: any = {};
        if (search) {
            where.promptText = { contains: search, mode: 'insensitive' };
        }
        if (skillId) {
            where.microSkillId = skillId;
        }
        if (difficulty) {
            where.difficultyLevel = difficulty;
        }

        const [questions, total] = await Promise.all([
            prisma.question.findMany({
                where,
                skip: (page - 1) * pageSize,
                take: pageSize,
                include: {
                    microSkill: {
                        include: {
                            domain: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.question.count({ where })
        ]);

        res.json({ questions, total });
    } catch (error) {
        console.error('Error fetching questions:', error);
        res.status(500).json({ error: 'Failed to fetch questions' });
    }
});

// Create new question
app.post('/api/admin/questions', async (req: Request, res: Response) => {
    try {
        const {
            microSkillId,
            difficultyLevel,
            promptText,
            correctAnswer,
            distractors,
            hasConfusingDistractors,
            promptAudioUrl,
            assetUrls
        } = req.body;

        // Validate required fields
        if (!microSkillId || !difficultyLevel || !promptText || !correctAnswer) {
            return res.status(400).json({
                error: 'microSkillId, difficultyLevel, promptText, and correctAnswer are required'
            });
        }

        // Validate difficulty level
        if (![1, 2, 3].includes(difficultyLevel)) {
            return res.status(400).json({
                error: 'difficultyLevel must be 1, 2, or 3'
            });
        }

        // Verify skill exists
        const skill = await prisma.microSkill.findUnique({
            where: { id: microSkillId }
        });

        if (!skill) {
            return res.status(400).json({ error: 'Invalid microSkillId' });
        }

        // Create question
        const question = await prisma.question.create({
            data: {
                microSkillId,
                difficultyLevel,
                promptText,
                correctAnswer,
                distractors: distractors || [],
                hasConfusingDistractors: hasConfusingDistractors || false,
                promptAudioUrl: promptAudioUrl || null,
                assetUrls: assetUrls || {}
            },
            include: {
                microSkill: {
                    include: {
                        domain: true
                    }
                }
            }
        });

        res.json(question);
    } catch (error) {
        console.error('Error creating question:', error);
        res.status(500).json({ error: 'Failed to create question' });
    }
});

app.patch('/api/admin/questions/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { promptText, difficultyLevel, gameTemplate, correctAnswer, distractors } = req.body;

        const updateData: any = {};
        if (promptText !== undefined) updateData.promptText = promptText;
        if (difficultyLevel !== undefined) updateData.difficultyLevel = difficultyLevel;
        if (gameTemplate !== undefined) updateData.gameTemplate = gameTemplate;
        if (correctAnswer !== undefined) updateData.correctAnswer = correctAnswer;
        if (distractors !== undefined) updateData.distractors = distractors;

        const question = await prisma.question.update({
            where: { id },
            data: updateData,
            include: {
                microSkill: {
                    include: {
                        domain: true
                    }
                }
            }
        });

        res.json(question);
    } catch (error) {
        console.error('Error updating question:', error);
        res.status(500).json({ error: 'Failed to update question' });
    }
});

// ============================================
// QUIZ REVIEW & RECOMMENDATION ENDPOINTS
// ============================================

// Get quiz review and recommendation (MERGED - optimized!)
app.get('/api/quiz-review/:sessionId/:childId', async (req: Request, res: Response) => {
    try {
        const { sessionId, childId } = req.params;

        console.log('Generating quiz review and recommendation for:', { sessionId, childId });

        const result = await quizReviewService.generateQuizReviewWithRecommendation(sessionId, childId);

        res.json({
            review: result.review,
            recommendation: result.recommendation
        });
    } catch (error) {
        console.error('Error generating quiz review:', error);
        res.status(500).json({ error: 'Failed to generate quiz review' });
    }
});

// ============================================
// COMPREHENSIVE QUIZ RESULTS ENDPOINT (NEW)
// ============================================

/**
 * Get comprehensive quiz results with analytics, error patterns, and recommendations
 * This is the unified endpoint for the new results system
 */
app.get('/api/child/:childId/quiz-results/:sessionId', async (req: Request, res: Response) => {
    try {
        const { childId, sessionId } = req.params;

        console.log('Generating comprehensive quiz results for:', { childId, sessionId });

        // Import analytics service
        const { default: ResultsAnalyticsService } = await import('./lib/results-analytics-service');

        // Get session data
        const session = await prisma.session.findUnique({
            where: { id: sessionId },
            include: {
                attempts: {
                    include: {
                        question: true,
                        microSkill: true
                    }
                }
            }
        });

        if (!session || session.attempts.length === 0) {
            return res.status(404).json({ error: 'Session not found or has no attempts' });
        }

        const skillId = session.attempts[0]?.microSkillId;
        if (!skillId) {
            return res.status(404).json({ error: 'No skill found for session' });
        }

        // Calculate all analytics
        const wordMasteryList = await ResultsAnalyticsService.calculateWordMastery(childId, skillId);
        const listReadiness = await ResultsAnalyticsService.calculateListReadiness(childId, skillId);
        const errorPatterns = await ResultsAnalyticsService.detectErrorPatterns(session.attempts);
        const clusterAnalysis = await ResultsAnalyticsService.analyzeClusterPerformance(childId, skillId);
        const gameRecommendations = ResultsAnalyticsService.generateGameRecommendations(errorPatterns);
        const repetitionSchedule = ResultsAnalyticsService.calculateRepetitionSchedule(wordMasteryList);

        // Get AI review and next skill recommendation
        const aiResult = await quizReviewService.generateQuizReviewWithRecommendation(sessionId, childId);

        // Get achievements for this child (calculate from all achievements)
        const achievements = await prisma.achievement.findMany({
            where: {
                childId
            }
        });
        const totalStars = Math.round(achievements.reduce((sum, a) => sum + a.starsEarned, 0));
        const totalCoins = achievements.reduce((sum, a) => sum + a.coinsEarned, 0);

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

        // Consistency metrics
        const batchSize = 5;
        const batches: any[][] = [];
        for (let i = 0; i < session.attempts.length; i += batchSize) {
            batches.push(session.attempts.slice(i, i + batchSize));
        }
        const batchAccuracies = batches.map(batch => {
            const correct = batch.filter(a => a.isCorrect).length;
            return (correct / batch.length) * 100;
        });
        const mean = batchAccuracies.reduce((sum, val) => sum + val, 0) / batchAccuracies.length;
        const squaredDiffs = batchAccuracies.map(val => Math.pow(val - mean, 2));
        const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / batchAccuracies.length;
        const standardDeviation = Math.sqrt(variance);

        // Determine pattern
        let pattern = 'Consistent performance';
        if (batchAccuracies.length >= 2) {
            const firstHalfAvg = batchAccuracies.slice(0, Math.floor(batchAccuracies.length / 2))
                .reduce((sum, val) => sum + val, 0) / Math.floor(batchAccuracies.length / 2);
            const secondHalfAvg = batchAccuracies.slice(Math.floor(batchAccuracies.length / 2))
                .reduce((sum, val) => sum + val, 0) / (batchAccuracies.length - Math.floor(batchAccuracies.length / 2));

            if (firstHalfAvg > secondHalfAvg + 20) {
                pattern = 'Strong start, weak finish';
            } else if (secondHalfAvg > firstHalfAvg + 20) {
                pattern = 'Weak start, strong finish';
            }
        }

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

        // Build comprehensive response
        const response = {
            summary: {
                masteryAchieved: listReadiness.tier === 1,
                accuracy: Math.round(accuracy),
                totalStars,
                totalCoins,
                tier: listReadiness.tier,
                tierLabel: listReadiness.tierLabel,
                tierEmoji: listReadiness.tierEmoji,
                riskIndicator: listReadiness.riskIndicator
            },
            metrics: {
                totalAttempts,
                correctAttempts,
                avgResponseTime: Math.round(avgResponseTime * 10) / 10,
                responseTimeDistribution: {
                    fast,
                    normal,
                    slow
                },
                consistency: {
                    variance: Math.round(variance),
                    standardDeviation: Math.round(standardDeviation),
                    pattern
                },
                questionBreakdown: session.attempts.map((a, index) => ({
                    questionId: a.questionId,
                    word: a.question?.correctAnswer || '',
                    correct: a.isCorrect,
                    timeSpent: Math.round(a.responseTimeSeconds * 10) / 10,
                    attemptNumber: index + 1,
                    errorType: a.errorType,
                    userResponse: a.userResponse
                }))
            },
            wordMastery: wordMasteryList.length > 0 ? {
                mastered: mastered.map(w => ({
                    word: w.word,
                    masteryPercentage: Math.round(w.masteryPercentage),
                    avgResponseTime: Math.round(w.avgResponseTime * 10) / 10,
                    totalAttempts: w.totalAttempts
                })),
                proficient: proficient.map(w => ({
                    word: w.word,
                    masteryPercentage: Math.round(w.masteryPercentage),
                    avgResponseTime: Math.round(w.avgResponseTime * 10) / 10,
                    totalAttempts: w.totalAttempts
                })),
                developing: developing.map(w => ({
                    word: w.word,
                    masteryPercentage: Math.round(w.masteryPercentage),
                    avgResponseTime: Math.round(w.avgResponseTime * 10) / 10,
                    totalAttempts: w.totalAttempts
                })),
                struggling: struggling.map(w => ({
                    word: w.word,
                    masteryPercentage: Math.round(w.masteryPercentage),
                    avgResponseTime: Math.round(w.avgResponseTime * 10) / 10,
                    totalAttempts: w.totalAttempts,
                    issues: w.issues
                })),
                weakClusters: clusterAnalysis.weakClusters.map(c => ({
                    clusterName: c.clusterName,
                    words: c.words,
                    avgAccuracy: Math.round(c.avgAccuracy),
                    recommendation: c.recommendation
                })),
                readinessScore: listReadiness.readinessScore,
                readinessLevel: listReadiness.recommendedAction
            } : undefined,
            errorPatterns,
            insights: {
                strengths: aiResult.review.strengths,
                areasToImprove: aiResult.review.areasToImprove,
                specificFeedback: aiResult.review.specificFeedback,
                encouragement: aiResult.review.encouragement,
                learningTrend: 'stable' as const, // Would be calculated from historical data
                learningVelocity: 0 // Would be calculated from historical data
            },
            recommendations: {
                nextSkill: aiResult.recommendation,
                recommendedGames: gameRecommendations,
                focusAreas,
                repetitionSchedule: repetitionSchedule.slice(0, 10).map(r => ({
                    word: r.word,
                    nextReviewDate: r.nextReviewDate.toISOString(),
                    frequency: r.frequency,
                    priority: r.priority
                })),
                interventions
            }
        };

        res.json(response);
    } catch (error) {
        console.error('Error generating comprehensive quiz results:', error);
        res.status(500).json({ error: 'Failed to generate quiz results' });
    }
});

app.delete('/api/admin/questions/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        await prisma.question.delete({
            where: { id }
        });

        res.json({ message: 'Question deleted successfully' });
    } catch (error) {
        console.error('Error deleting question:', error);
        res.status(500).json({ error: 'Failed to delete question' });
    }
});

// ============================================
// TEACHER PORTAL ENDPOINTS
// ============================================

// Get student's quiz review history
app.get('/api/teacher/student/:childId/quiz-reviews', async (req: Request, res: Response) => {
    try {
        const { childId } = req.params;
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

        const reviews = await teacherService.getStudentQuizReviews(childId, limit);
        res.json(reviews);
    } catch (error) {
        console.error('Error fetching student quiz reviews:', error);
        res.status(500).json({ error: 'Failed to fetch quiz reviews' });
    }
});

// Get detailed student progress (includes quiz reviews, skill progress, attempts)
app.get('/api/teacher/student/:childId/detailed-progress', async (req: Request, res: Response) => {
    try {
        const { childId } = req.params;

        const progress = await teacherService.getStudentDetailedProgress(childId);
        res.json(progress);
    } catch (error) {
        console.error('Error fetching student detailed progress:', error);
        res.status(500).json({ error: 'Failed to fetch student progress' });
    }
});

// Generate AI-powered teacher report
app.post('/api/teacher/student/:childId/generate-report', async (req: Request, res: Response) => {
    try {
        const { childId } = req.params;
        const { startDate, endDate } = req.body;

        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'Start date and end date are required' });
        }

        const report = await teacherService.generateTeacherReport(
            childId,
            new Date(startDate),
            new Date(endDate)
        );

        res.json(report);
    } catch (error: any) {
        console.error('Error generating teacher report:', error);
        res.status(500).json({ error: error.message || 'Failed to generate report' });
    }
});

// Get student's performance reports history
app.get('/api/teacher/student/:childId/reports', async (req: Request, res: Response) => {
    try {
        const { childId } = req.params;

        const reports = await teacherService.getStudentReports(childId);
        res.json(reports);
    } catch (error) {
        console.error('Error fetching student reports:', error);
        res.status(500).json({ error: 'Failed to fetch reports' });
    }
});

// Test database connection before starting server
async function startServer() {
    try {
        // Test Prisma connection
        await prisma.$connect();
        console.log('✅ Database connected successfully');

        // Start server
        const server = app.listen(port, '0.0.0.0', () => {
            console.log(`🚀 Backend server running on http://0.0.0.0:${port}`);
            console.log(`📊 Health check: http://0.0.0.0:${port}/health`);
            console.log(`🤖 OpenAI integration enabled`);
        });

        server.on('error', (error: any) => {
            console.error('❌ Server error:', error);
            process.exit(1);
        });

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Start the server
startServer();

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down gracefully...');
    await prisma.$disconnect();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('Shutting down gracefully...');
    await prisma.$disconnect();
    process.exit(0);
});

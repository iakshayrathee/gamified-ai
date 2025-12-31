"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const db_1 = __importDefault(require("./lib/db"));
const prisma = (0, db_1.default)();
const dotenv_1 = __importDefault(require("dotenv"));
const s3_service_1 = require("./lib/s3-service");
const upload_middleware_1 = require("./lib/upload-middleware");
const auth_1 = require("./lib/auth");
const auth_middleware_1 = require("./middleware/auth-middleware");
const performance_analyzer_1 = __importDefault(require("./lib/performance-analyzer"));
const recommendation_engine_1 = __importDefault(require("./lib/recommendation-engine"));
const document_processor_1 = __importDefault(require("./lib/document-processor"));
const quiz_review_service_1 = __importDefault(require("./lib/quiz-review-service"));
const teacher_service_1 = __importDefault(require("./lib/teacher-service"));
const admin_service_1 = require("./lib/admin-service");
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 5000;
// Middleware
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
// Helper functions for skill progress calculations
function calculateAverageResponseTime(recentAttempts, currentResponseTime, existingAvgTime) {
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
function updateConfusionPatterns(existingPatterns, newConfusionType) {
    // Handle case where existingPatterns might be a JSON string or already parsed array
    let patterns = [];
    if (typeof existingPatterns === 'string') {
        try {
            patterns = JSON.parse(existingPatterns);
        }
        catch {
            patterns = [];
        }
    }
    else if (Array.isArray(existingPatterns)) {
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
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Backend server is running' });
});
// ============================================
// AUTHENTICATION ENDPOINTS
// ============================================
// Login endpoint (for all roles)
app.post('/api/auth/login', async (req, res) => {
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
        const isValidPassword = await (0, auth_1.comparePassword)(password, user.passwordHash);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        // Generate tokens
        const tokenPayload = {
            userId: user.id,
            role: user.role,
            email: user.email
        };
        const token = rememberMe ? (0, auth_1.generateRefreshToken)(tokenPayload) : (0, auth_1.generateToken)(tokenPayload);
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
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});
// Logout endpoint
app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Logged out successfully' });
});
// Get current user
app.get('/api/auth/me', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.userId },
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
    }
    catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to get user' });
    }
});
// Refresh token endpoint
app.post('/api/auth/refresh', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const tokenPayload = {
            userId: req.user.userId,
            role: req.user.role,
            email: req.user.email
        };
        const newToken = (0, auth_1.generateToken)(tokenPayload);
        res.cookie('token', newToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000
        });
        res.json({ token: newToken });
    }
    catch (error) {
        console.error('Refresh token error:', error);
        res.status(500).json({ error: 'Failed to refresh token' });
    }
});
// Get all skills
app.get('/api/skills', async (req, res) => {
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
    }
    catch (error) {
        console.error('Error fetching skills:', error);
        res.status(500).json({ error: 'Failed to fetch skills' });
    }
});
// Get questions for a skill
app.get('/api/skills/:skillId/questions', async (req, res) => {
    try {
        const { skillId } = req.params;
        const difficulty = req.query.difficulty ? parseInt(req.query.difficulty) : undefined;
        const questions = await prisma.question.findMany({
            where: {
                microSkillId: skillId,
                ...(difficulty && { difficultyLevel: difficulty })
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
        // Transform to include gameTemplate at root level for frontend compatibility
        const questionsWithTemplate = questions.map(q => ({
            ...q,
            gameTemplate: q.microSkill.gameTemplate,
            microSkill: undefined // Remove nested object
        }));
        res.json(questionsWithTemplate);
    }
    catch (error) {
        console.error('Error fetching questions:', error);
        res.status(500).json({ error: 'Failed to fetch questions' });
    }
});
// Get child progress
app.get('/api/child/:childId/progress', async (req, res) => {
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
    }
    catch (error) {
        console.error('Error fetching child progress:', error);
        res.status(500).json({ error: 'Failed to fetch progress' });
    }
});
// Get teacher's students
app.get('/api/teacher/:teacherId/students', async (req, res) => {
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
        const studentsWithProgress = await Promise.all(children.map(async (child) => {
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
        }));
        res.json(studentsWithProgress);
    }
    catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({ error: 'Failed to fetch students' });
    }
});
// Log attempt
app.post('/api/attempts', async (req, res) => {
    try {
        const { childId, questionId, microSkillId, sessionId, isCorrect, responseTimeSeconds, hintUsed, hintCount, userResponse, correctAnswer, difficultyLevelAtAttempt, } = req.body;
        // Error classification based on ErrorType enum
        let errorType = 'NONE';
        let confusionType = null;
        if (!isCorrect) {
            if (userResponse && correctAnswer) {
                // Check for specific confusion patterns
                if ((correctAnswer === 'b' && userResponse === 'd') || (correctAnswer === 'd' && userResponse === 'b') ||
                    (correctAnswer === 'B' && userResponse === 'D') || (correctAnswer === 'D' && userResponse === 'B')) {
                    errorType = 'B_D_CONFUSION';
                    confusionType = 'b_d_visual';
                }
                else if ((correctAnswer === 'p' && userResponse === 'q') || (correctAnswer === 'q' && userResponse === 'p') ||
                    (correctAnswer === 'P' && userResponse === 'Q') || (correctAnswer === 'Q' && userResponse === 'P')) {
                    errorType = 'P_Q_CONFUSION';
                    confusionType = 'p_q_visual';
                }
                else if ((correctAnswer === 'm' && userResponse === 'n') || (correctAnswer === 'n' && userResponse === 'm') ||
                    (correctAnswer === 'M' && userResponse === 'N') || (correctAnswer === 'N' && userResponse === 'M')) {
                    errorType = 'M_N_CONFUSION';
                    confusionType = 'm_n_visual';
                }
                else if ((correctAnswer === 'u' && userResponse === 'n') || (correctAnswer === 'n' && userResponse === 'u') ||
                    (correctAnswer === 'U' && userResponse === 'N') || (correctAnswer === 'N' && userResponse === 'U')) {
                    errorType = 'U_N_CONFUSION';
                    confusionType = 'u_n_visual';
                }
                else {
                    errorType = 'OTHER';
                }
            }
            else {
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
                errorType: errorType,
                difficultyLevelAtAttempt,
                userResponse: userResponse || null,
                confusionType,
            },
        });
        // Calculate stars (simple formula)
        let stars = 0;
        if (isCorrect) {
            stars = 1;
            if (responseTimeSeconds < 3)
                stars += 0.5;
            if (!hintUsed)
                stars += 0.5;
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
            errorType: a.errorType,
            difficultyLevelAtAttempt: a.difficultyLevelAtAttempt,
            createdAt: a.createdAt,
        }));
        // Get real-time analysis from adaptive engine
        const { AdaptiveDifficultyEngine } = await Promise.resolve().then(() => __importStar(require('./lib/adaptive-engine')));
        const analysis = AdaptiveDifficultyEngine.analyzeAttemptInRealTime(attemptData, difficultyLevelAtAttempt);
        // Get next question difficulty based on LAST 5 attempts
        // Note: attemptData is ordered DESC (newest first), so slice(0, 5) gets the 5 most recent
        const last5Attempts = attemptData.slice(0, 5);
        console.log(`[ADAPTIVE] Analyzing last ${last5Attempts.length} attempts for difficulty recommendation`);
        console.log(`[ADAPTIVE] Current difficulty: ${difficultyLevelAtAttempt}`);
        console.log(`[ADAPTIVE] Last 5 attempts accuracy: ${last5Attempts.filter(a => a.isCorrect).length}/${last5Attempts.length}`);
        console.log(`[ADAPTIVE] Last 5 attempts times: ${last5Attempts.map(a => a.responseTimeSeconds.toFixed(1)).join(', ')}s`);
        const nextQuestionDifficulty = AdaptiveDifficultyEngine.getAdaptiveDifficultyForNextQuestion(last5Attempts, // Get last 5 attempts (first 5 from desc-ordered array)
        difficultyLevelAtAttempt);
        console.log(`[ADAPTIVE] Recommended next difficulty: ${nextQuestionDifficulty}`);
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
        let behavioralTip = null;
        if (newTotalAttempts % 5 === 0) {
            const { default: AITipsService } = await Promise.resolve().then(() => __importStar(require('./lib/ai-tips-service')));
            const tip = await AITipsService.generateBehavioralTip(childId, recentAttempts);
            behavioralTip = tip.message;
        }
        // Update skill progress with recalculated accuracy and AI insights
        await prisma.skillProgress.upsert({
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
        });
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
        });
    }
    catch (error) {
        console.error('Error logging attempt:', error);
        res.status(500).json({ error: 'Failed to log attempt' });
    }
});
// ============================================
// ASSET MANAGEMENT ENDPOINTS
// ============================================
// Upload single asset
app.post('/api/assets/upload', upload_middleware_1.uploadSingle, async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        const { folder, subFolder } = req.body;
        if (!folder || !['images', 'audio', 'animations'].includes(folder)) {
            return res.status(400).json({ error: 'Invalid folder type' });
        }
        // Validate file type
        if (!(0, s3_service_1.validateAssetType)(req.file.mimetype, folder)) {
            return res.status(400).json({ error: `Invalid file type for ${folder}` });
        }
        const asset = await (0, s3_service_1.uploadAsset)({
            file: req.file.buffer,
            fileName: req.file.originalname,
            folder: folder,
            subFolder,
            contentType: req.file.mimetype,
        });
        res.json(asset);
    }
    catch (error) {
        console.error('Error uploading asset:', error);
        res.status(500).json({ error: 'Failed to upload asset' });
    }
});
// Upload multiple assets
app.post('/api/assets/upload-multiple', upload_middleware_1.uploadMultiple, async (req, res) => {
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
            if (!(0, s3_service_1.validateAssetType)(file.mimetype, folder)) {
                continue; // Skip invalid files
            }
            const asset = await (0, s3_service_1.uploadAsset)({
                file: file.buffer,
                fileName: file.originalname,
                folder: folder,
                subFolder,
                contentType: file.mimetype,
            });
            uploadedAssets.push(asset);
        }
        res.json({ uploaded: uploadedAssets.length, assets: uploadedAssets });
    }
    catch (error) {
        console.error('Error uploading assets:', error);
        res.status(500).json({ error: 'Failed to upload assets' });
    }
});
// List assets in a folder
app.get('/api/assets/list', async (req, res) => {
    try {
        const { folder, subFolder } = req.query;
        if (!folder || !['images', 'audio', 'animations'].includes(folder)) {
            return res.status(400).json({ error: 'Invalid folder type' });
        }
        const assets = await (0, s3_service_1.listAssets)(folder, subFolder);
        res.json({ assets });
    }
    catch (error) {
        console.error('Error listing assets:', error);
        res.status(500).json({ error: 'Failed to list assets' });
    }
});
// Delete asset
app.delete('/api/assets/:key', async (req, res) => {
    try {
        const { key } = req.params;
        await (0, s3_service_1.deleteAsset)(decodeURIComponent(key));
        res.json({ message: 'Asset deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting asset:', error);
        res.status(500).json({ error: 'Failed to delete asset' });
    }
});
// ============================================
// DOMAIN & SKILL ENDPOINTS
// ============================================
// Get all domains
app.get('/api/domains', async (req, res) => {
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
    }
    catch (error) {
        console.error('Error fetching domains:', error);
        res.status(500).json({ error: 'Failed to fetch domains' });
    }
});
// Create new domain
app.post('/api/domains', async (req, res) => {
    try {
        const { name, code, description } = req.body;
        if (!name || !code) {
            return res.status(400).json({ error: 'Name and code are required' });
        }
        const domain = await (0, admin_service_1.createDomain)({ name, code, description: description || '' });
        res.json(domain);
    }
    catch (error) {
        console.error('Error creating domain:', error);
        res.status(500).json({ error: error.message || 'Failed to create domain' });
    }
});
// Get admin stats
app.get('/api/admin/stats', async (req, res) => {
    try {
        const stats = await (0, admin_service_1.getAdminStats)();
        res.json(stats);
    }
    catch (error) {
        console.error('Error fetching admin stats:', error);
        res.status(500).json({ error: 'Failed to fetch admin stats' });
    }
});
// Create new skill
app.post('/api/skills', async (req, res) => {
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
                gameTemplate: gameTemplate || 'TAP_SELECT',
                masteryCriteria: masteryCriteria || {
                    minAttempts: 5,
                    accuracyThreshold: 0.8
                }
            }
        });
        res.json(skill);
    }
    catch (error) {
        console.error('Error creating skill:', error);
        res.status(500).json({ error: 'Failed to create skill' });
    }
});
// Get all skills
app.get('/api/skills', async (req, res) => {
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
    }
    catch (error) {
        console.error('Error fetching skills:', error);
        res.status(500).json({ error: 'Failed to fetch skills' });
    }
});
// ============================================
// SESSION MANAGEMENT ENDPOINTS
// ============================================
// Start a new session
app.post('/api/sessions/start', async (req, res) => {
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
    }
    catch (error) {
        console.error('Error starting session:', error);
        res.status(500).json({ error: 'Failed to start session' });
    }
});
// End a session
app.post('/api/sessions/:sessionId/end', async (req, res) => {
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
                if (attempt.responseTimeSeconds < 3)
                    stars += 0.5;
                if (!attempt.hintUsed)
                    stars += 0.5;
                stars = Math.min(3, stars);
                totalStars += stars;
                totalCoins += Math.round(stars);
            }
        });
        // Determine badge type
        let badgeType = 'FIRST_SKILL';
        const accuracy = session.attempts.length > 0
            ? (session.attempts.filter(a => a.isCorrect).length / session.attempts.length) * 100
            : 0;
        if (accuracy === 100) {
            badgeType = 'PERFECT_SCORE';
        }
        else if (session.attempts.every(a => a.responseTimeSeconds < 3)) {
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
    }
    catch (error) {
        console.error('Error ending session:', error);
        res.status(500).json({ error: 'Failed to end session' });
    }
});
// ============================================
// BULK UPLOAD ENDPOINT
// ============================================
// Bulk upload questions (CSV/JSON)
app.post('/api/admin/questions/bulk', express_1.default.json({ limit: '10mb' }), async (req, res) => {
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
            }
            catch (error) {
                errors.push({ index: i, error: error.message });
            }
        }
        res.json({
            success: created.length,
            failed: errors.length,
            created,
            errors,
        });
    }
    catch (error) {
        console.error('Error bulk uploading questions:', error);
        res.status(500).json({ error: 'Failed to bulk upload questions' });
    }
});
// ============================================
// MASTERY CALCULATION ENDPOINT
// ============================================
// Calculate and update mastery for a child's skill
app.post('/api/child/:childId/calculate-mastery', async (req, res) => {
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
        if (recentAttempts.length < 5) { // Lowered from 10 to 5 for faster testing
            return res.json({
                message: 'Not enough attempts for mastery calculation',
                mastered: false,
                attemptsNeeded: 5 - recentAttempts.length
            });
        }
        const correctCount = recentAttempts.filter(a => a.isCorrect).length;
        const accuracy = (correctCount / recentAttempts.length) * 100;
        const avgTime = recentAttempts.reduce((sum, a) => sum + a.responseTimeSeconds, 0) / recentAttempts.length;
        const confusionErrors = recentAttempts.filter(a => a.errorType !== 'NONE' && a.errorType !== 'OTHER').length;
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
    }
    catch (error) {
        console.error('Error calculating mastery:', error);
        res.status(500).json({ error: 'Failed to calculate mastery' });
    }
});
// ============================================
// QUIZ REVIEW & RECOMMENDATION ENDPOINTS
// ============================================
// Generate AI review after quiz completion
app.post('/api/quiz/review', async (req, res) => {
    try {
        const { sessionId, childId } = req.body;
        if (!sessionId || !childId) {
            return res.status(400).json({ error: 'sessionId and childId are required' });
        }
        const review = await quiz_review_service_1.default.generateQuizReview(sessionId, childId);
        res.json(review);
    }
    catch (error) {
        console.error('Error generating quiz review:', error);
        res.status(500).json({ error: 'Failed to generate quiz review' });
    }
});
// Get AI recommendation for next skill
app.post('/api/quiz/recommend-next', async (req, res) => {
    try {
        const { sessionId, childId } = req.body;
        if (!sessionId || !childId) {
            return res.status(400).json({ error: 'sessionId and childId are required' });
        }
        const recommendation = await quiz_review_service_1.default.recommendNextSkill(sessionId, childId);
        res.json(recommendation);
    }
    catch (error) {
        console.error('Error recommending next skill:', error);
        res.status(500).json({ error: 'Failed to recommend next skill' });
    }
});
// ============================================
// PERFORMANCE REPORTS ENDPOINTS
// ============================================
// Generate performance report
app.post('/api/performance/generate', async (req, res) => {
    try {
        const { childId, startDate, endDate } = req.body;
        if (!childId || !startDate || !endDate) {
            return res.status(400).json({ error: 'childId, startDate, and endDate are required' });
        }
        const report = await performance_analyzer_1.default.generateReport(childId, new Date(startDate), new Date(endDate));
        res.json(report);
    }
    catch (error) {
        console.error('Error generating performance report:', error);
        res.status(500).json({ error: error.message || 'Failed to generate performance report' });
    }
});
// Get performance reports for a child
app.get('/api/performance/child/:childId', async (req, res) => {
    try {
        const { childId } = req.params;
        const limit = req.query.limit ? parseInt(req.query.limit) : 10;
        const reports = await performance_analyzer_1.default.getChildReports(childId, limit);
        res.json(reports);
    }
    catch (error) {
        console.error('Error fetching performance reports:', error);
        res.status(500).json({ error: 'Failed to fetch performance reports' });
    }
});
// ============================================
// RECOMMENDATIONS ENDPOINTS
// ============================================
// Generate recommendations for a child
app.post('/api/recommendations/generate', async (req, res) => {
    try {
        const { childId, limit } = req.body;
        if (!childId) {
            return res.status(400).json({ error: 'childId is required' });
        }
        const recommendations = await recommendation_engine_1.default.generateRecommendations(childId, limit || 5);
        res.json(recommendations);
    }
    catch (error) {
        console.error('Error generating recommendations:', error);
        res.status(500).json({ error: error.message || 'Failed to generate recommendations' });
    }
});
// Get active recommendations for a child
app.get('/api/recommendations/:childId', async (req, res) => {
    try {
        const { childId } = req.params;
        const recommendations = await recommendation_engine_1.default.getActiveRecommendations(childId);
        res.json(recommendations);
    }
    catch (error) {
        console.error('Error fetching recommendations:', error);
        res.status(500).json({ error: 'Failed to fetch recommendations' });
    }
});
// Mark recommendation as completed
app.post('/api/recommendations/:id/complete', async (req, res) => {
    try {
        const { id } = req.params;
        const recommendation = await recommendation_engine_1.default.completeRecommendation(id);
        res.json(recommendation);
    }
    catch (error) {
        console.error('Error completing recommendation:', error);
        res.status(500).json({ error: 'Failed to complete recommendation' });
    }
});
// ============================================
// DOCUMENT PROCESSING ENDPOINTS
// ============================================
// Upload and process document
app.post('/api/admin/documents/upload', upload_middleware_1.uploadDocument, async (req, res) => {
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
        const result = await document_processor_1.default.processDocument(req.file.buffer, req.file.originalname, fileType, uploadedBy, fileUrl);
        res.json(result);
    }
    catch (error) {
        console.error('Error processing document:', error);
        res.status(500).json({ error: error.message || 'Failed to process document' });
    }
});
// Get document processing status
app.get('/api/admin/documents/:documentId/status', async (req, res) => {
    try {
        const { documentId } = req.params;
        const status = await document_processor_1.default.getDocumentStatus(documentId);
        res.json(status);
    }
    catch (error) {
        console.error('Error fetching document status:', error);
        res.status(500).json({ error: 'Failed to fetch document status' });
    }
});
// Get all documents
app.get('/api/admin/documents', async (req, res) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit) : 50;
        const documents = await document_processor_1.default.getAllDocuments(limit);
        res.json(documents);
    }
    catch (error) {
        console.error('Error fetching documents:', error);
        res.status(500).json({ error: 'Failed to fetch documents' });
    }
});
// Approve extracted question
app.post('/api/admin/questions/:questionId/approve', async (req, res) => {
    try {
        const { questionId } = req.params;
        const { skillId } = req.body;
        if (!skillId) {
            return res.status(400).json({ error: 'skillId is required' });
        }
        const question = await document_processor_1.default.approveQuestion(questionId, skillId);
        res.json(question);
    }
    catch (error) {
        console.error('Error approving question:', error);
        res.status(500).json({ error: 'Failed to approve question' });
    }
});
// Update question metadata (difficulty, game template)
app.patch('/api/admin/questions/:questionId/metadata', async (req, res) => {
    try {
        const { questionId } = req.params;
        const { difficultyLevel, gameTemplate } = req.body;
        const updateData = {};
        if (difficultyLevel !== undefined)
            updateData.difficultyLevel = difficultyLevel;
        if (gameTemplate !== undefined)
            updateData.gameTemplate = gameTemplate;
        const question = await prisma.extractedQuestion.update({
            where: { id: questionId },
            data: updateData
        });
        res.json(question);
    }
    catch (error) {
        console.error('Error updating question metadata:', error);
        res.status(500).json({ error: 'Failed to update question metadata' });
    }
});
// Update extracted question content (text, options, explanation)
app.patch('/api/admin/extracted-questions/:questionId', async (req, res) => {
    try {
        const { questionId } = req.params;
        const { questionText, options, correctAnswer, explanation, difficultyLevel } = req.body;
        const updateData = {};
        if (questionText !== undefined)
            updateData.questionText = questionText;
        if (options !== undefined)
            updateData.options = options;
        if (correctAnswer !== undefined)
            updateData.correctAnswer = correctAnswer;
        if (explanation !== undefined)
            updateData.explanation = explanation;
        if (difficultyLevel !== undefined)
            updateData.difficultyLevel = difficultyLevel;
        const question = await prisma.extractedQuestion.update({
            where: { id: questionId },
            data: updateData
        });
        res.json(question);
    }
    catch (error) {
        console.error('Error updating extracted question:', error);
        res.status(500).json({ error: 'Failed to update extracted question' });
    }
});
// Bulk update question metadata
app.patch('/api/admin/questions/bulk-metadata', async (req, res) => {
    try {
        const { questionIds, difficultyLevel, gameTemplate } = req.body;
        if (!questionIds || !Array.isArray(questionIds) || questionIds.length === 0) {
            return res.status(400).json({ error: 'questionIds array is required' });
        }
        const updateData = {};
        if (difficultyLevel !== undefined)
            updateData.difficultyLevel = difficultyLevel;
        if (gameTemplate !== undefined)
            updateData.gameTemplate = gameTemplate;
        const result = await prisma.extractedQuestion.updateMany({
            where: { id: { in: questionIds } },
            data: updateData
        });
        res.json({ success: true, count: result.count });
    }
    catch (error) {
        console.error('Error bulk updating metadata:', error);
        res.status(500).json({ error: 'Failed to bulk update metadata' });
    }
});
// Bulk approve extracted questions
app.post('/api/admin/questions/bulk-approve', async (req, res) => {
    try {
        const { questionIds, skillId } = req.body;
        if (!skillId || !questionIds || !Array.isArray(questionIds) || questionIds.length === 0) {
            return res.status(400).json({ error: 'skillId and questionIds array are required' });
        }
        console.log(`Bulk approving ${questionIds.length} questions for skill ${skillId}`);
        // Process all questions in parallel for better performance
        const results = await Promise.all(questionIds.map(questionId => document_processor_1.default.approveQuestion(questionId, skillId)));
        console.log(`Successfully approved ${results.length} questions`);
        res.json({
            success: true,
            count: results.length,
            questions: results
        });
    }
    catch (error) {
        console.error('Error bulk approving questions:', error);
        res.status(500).json({ error: 'Failed to bulk approve questions' });
    }
});
// Reject extracted question
app.post('/api/admin/questions/:questionId/reject', async (req, res) => {
    try {
        const { questionId } = req.params;
        const question = await document_processor_1.default.rejectQuestion(questionId);
        res.json(question);
    }
    catch (error) {
        console.error('Error rejecting question:', error);
        res.status(500).json({ error: 'Failed to reject question' });
    }
});
// ============================================
// ADMIN CRUD ENDPOINTS
// ============================================
// Users CRUD
app.get('/api/admin/users', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 20;
        const search = req.query.search || '';
        const role = req.query.role || '';
        const where = {};
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
    }
    catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});
app.post('/api/admin/users', async (req, res) => {
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
    }
    catch (error) {
        console.error('Error creating user:', error);
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Email already exists' });
        }
        res.status(500).json({ error: 'Failed to create user' });
    }
});
app.patch('/api/admin/users/:id', async (req, res) => {
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
    }
    catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
});
app.delete('/api/admin/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.user.delete({
            where: { id }
        });
        res.json({ message: 'User deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});
// Domains CRUD (Update and Delete)
app.patch('/api/domains/:id', async (req, res) => {
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
    }
    catch (error) {
        console.error('Error updating domain:', error);
        res.status(500).json({ error: 'Failed to update domain' });
    }
});
app.delete('/api/domains/:id', async (req, res) => {
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
    }
    catch (error) {
        console.error('Error deleting domain:', error);
        res.status(500).json({ error: 'Failed to delete domain' });
    }
});
// Skills CRUD (Update and Delete)
app.patch('/api/skills/:id', async (req, res) => {
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
    }
    catch (error) {
        console.error('Error updating skill:', error);
        res.status(500).json({ error: 'Failed to update skill' });
    }
});
app.delete('/api/skills/:id', async (req, res) => {
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
    }
    catch (error) {
        console.error('Error deleting skill:', error);
        res.status(500).json({ error: 'Failed to delete skill' });
    }
});
// Questions CRUD
app.get('/api/admin/questions', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 20;
        const search = req.query.search || '';
        const skillId = req.query.skillId || '';
        const difficulty = req.query.difficulty ? parseInt(req.query.difficulty) : undefined;
        const where = {};
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
    }
    catch (error) {
        console.error('Error fetching questions:', error);
        res.status(500).json({ error: 'Failed to fetch questions' });
    }
});
// Create new question
app.post('/api/admin/questions', async (req, res) => {
    try {
        const { microSkillId, difficultyLevel, promptText, correctAnswer, distractors, hasConfusingDistractors, promptAudioUrl, assetUrls } = req.body;
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
    }
    catch (error) {
        console.error('Error creating question:', error);
        res.status(500).json({ error: 'Failed to create question' });
    }
});
app.patch('/api/admin/questions/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { promptText, difficultyLevel, gameTemplate, correctAnswer, distractors } = req.body;
        const updateData = {};
        if (promptText !== undefined)
            updateData.promptText = promptText;
        if (difficultyLevel !== undefined)
            updateData.difficultyLevel = difficultyLevel;
        if (gameTemplate !== undefined)
            updateData.gameTemplate = gameTemplate;
        if (correctAnswer !== undefined)
            updateData.correctAnswer = correctAnswer;
        if (distractors !== undefined)
            updateData.distractors = distractors;
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
    }
    catch (error) {
        console.error('Error updating question:', error);
        res.status(500).json({ error: 'Failed to update question' });
    }
});
// ============================================
// QUIZ REVIEW & RECOMMENDATION ENDPOINTS
// ============================================
// Get quiz review and recommendation (MERGED - optimized!)
app.get('/api/quiz-review/:sessionId/:childId', async (req, res) => {
    try {
        const { sessionId, childId } = req.params;
        console.log('Generating quiz review and recommendation for:', { sessionId, childId });
        const result = await quiz_review_service_1.default.generateQuizReviewWithRecommendation(sessionId, childId);
        res.json({
            review: result.review,
            recommendation: result.recommendation
        });
    }
    catch (error) {
        console.error('Error generating quiz review:', error);
        res.status(500).json({ error: 'Failed to generate quiz review' });
    }
});
app.delete('/api/admin/questions/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.question.delete({
            where: { id }
        });
        res.json({ message: 'Question deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting question:', error);
        res.status(500).json({ error: 'Failed to delete question' });
    }
});
// ============================================
// TEACHER PORTAL ENDPOINTS
// ============================================
// Get student's quiz review history
app.get('/api/teacher/student/:childId/quiz-reviews', async (req, res) => {
    try {
        const { childId } = req.params;
        const limit = req.query.limit ? parseInt(req.query.limit) : 10;
        const reviews = await teacher_service_1.default.getStudentQuizReviews(childId, limit);
        res.json(reviews);
    }
    catch (error) {
        console.error('Error fetching student quiz reviews:', error);
        res.status(500).json({ error: 'Failed to fetch quiz reviews' });
    }
});
// Get detailed student progress (includes quiz reviews, skill progress, attempts)
app.get('/api/teacher/student/:childId/detailed-progress', async (req, res) => {
    try {
        const { childId } = req.params;
        const progress = await teacher_service_1.default.getStudentDetailedProgress(childId);
        res.json(progress);
    }
    catch (error) {
        console.error('Error fetching student detailed progress:', error);
        res.status(500).json({ error: 'Failed to fetch student progress' });
    }
});
// Generate AI-powered teacher report
app.post('/api/teacher/student/:childId/generate-report', async (req, res) => {
    try {
        const { childId } = req.params;
        const { startDate, endDate } = req.body;
        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'Start date and end date are required' });
        }
        const report = await teacher_service_1.default.generateTeacherReport(childId, new Date(startDate), new Date(endDate));
        res.json(report);
    }
    catch (error) {
        console.error('Error generating teacher report:', error);
        res.status(500).json({ error: error.message || 'Failed to generate report' });
    }
});
// Get student's performance reports history
app.get('/api/teacher/student/:childId/reports', async (req, res) => {
    try {
        const { childId } = req.params;
        const reports = await teacher_service_1.default.getStudentReports(childId);
        res.json(reports);
    }
    catch (error) {
        console.error('Error fetching student reports:', error);
        res.status(500).json({ error: 'Failed to fetch reports' });
    }
});
// Start server
app.listen(port, () => {
    console.log(`🚀 Backend server running on http://localhost:${port}`);
    console.log(`📊 Health check: http://localhost:${port}/health`);
    console.log(`🤖 OpenAI integration enabled`);
});
// Graceful shutdown
process.on('SIGINT', async () => {
    await prisma.$disconnect();
    process.exit(0);
});

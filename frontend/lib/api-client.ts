// API Client for backend communication
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// ============================================
// TYPES
// ============================================

export interface Domain {
    id: string;
    code: string;
    name: string;
    description: string;
    microSkills: Array<{
        id: string;
        name: string;
        code: string;
    }>;
}

export interface MicroSkill {
    id: string;
    code: string;
    name: string;
    domainId: string;
    gameTemplate: string;
    prerequisiteSkills: string[];
    nextSkills: string[];
    masteryCriteria: {
        accuracyThreshold: number;
        timeThreshold: number;
        confusionErrorThreshold: number;
    };
    domain: {
        id: string;
        code: string;
        name: string;
        description: string;
    };
}

export interface Question {
    id: string;
    microSkillId: string;
    difficultyLevel: 1 | 2 | 3;
    promptText: string;
    promptAudioUrl?: string; // Changed from string | null to match game types
    correctAnswer: string;
    distractors: string[];
    hasConfusingDistractors: boolean;
    assetUrls: Record<string, string>;
    gameTemplate?: string;
}

export interface SkillProgress {
    id: string;
    childId: string;
    microSkillId: string;
    masteryStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'MASTERED';
    currentDifficultyLevel: number;
    accuracyPercentage: number;
    avgResponseTime: number;
    totalAttempts: number;
    correctAttempts: number;
    lastAttemptedAt: string | null;
    masteredAt: string | null;
    microSkill: MicroSkill;
}

export interface ChildProgress {
    overallProgress: number;
    totalStars: number;
    totalCoins: number;
    streakDays: number;
    skillProgress: SkillProgress[];
    allSkills: MicroSkill[];
}

export interface Session {
    id: string;
    childId: string;
    startedAt: string;
    endedAt: string | null;
    totalTimeSeconds: number;
    skillsAttempted: string[];
}

export interface AttemptResult {
    attempt: {
        id: string;
        isCorrect: boolean;
        responseTimeSeconds: number;
        hintUsed: boolean;
    };
    stars: number;
    coins: number;
    adaptiveRecommendation: {
        shouldAdjustDifficulty: boolean;
        newDifficulty: 1 | 2 | 3;
        reason: string;
        insights: string[];
    };
    nextQuestionDifficulty: 1 | 2 | 3;
    behavioralTip?: string | null; // Optional behavioral tip for assessment
}

export interface MasteryResult {
    mastered: boolean;
    accuracy: number;
    avgTime: number;
    confusionRate: number;
    skillProgress: SkillProgress;
}

export interface AdminStats {
    totalUsers: number;
    usersByRole: {
        children: number;
        educators: number;
        parents: number;
        schoolViewers: number;
        centerHeads: number;
        admins: number;
    };
    totalDomains: number;
    totalSkills: number;
    totalQuestions: number;
    questionsByStatus: {
        approved: number;
        pending: number;
        rejected: number;
    };
    recentUploads: Array<{
        id: string;
        fileName: string;
        uploadedAt: string;
        status: string;
        extractedQuestions: number;
    }>;
}

// ============================================
// API FUNCTIONS
// ============================================

export class ApiClient {
    // Get all domains
    static async getAllDomains(): Promise<Domain[]> {
        const response = await fetch(`${API_BASE_URL}/api/domains`, {
            credentials: 'include',
        });
        if (!response.ok) throw new Error('Failed to fetch domains');
        return response.json();
    }

    // Create new domain
    static async createDomain(data: {
        name: string;
        code: string;
        description: string;
    }): Promise<Domain> {
        const response = await fetch(`${API_BASE_URL}/api/domains`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Failed to create domain');
        return response.json();
    }

    // Get admin stats
    static async getAdminStats(): Promise<AdminStats> {
        const response = await fetch(`${API_BASE_URL}/api/admin/stats`, {
            credentials: 'include',
        });
        if (!response.ok) throw new Error('Failed to fetch admin stats');
        return response.json();
    }

    // Create new skill
    static async createSkill(data: {
        name: string;
        code: string;
        domainId: string;
        gameTemplate?: string;
    }): Promise<any> {
        const response = await fetch(`${API_BASE_URL}/api/skills`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Failed to create skill');
        return response.json();
    }

    // Get all skills
    static async getAllSkills(): Promise<MicroSkill[]> {
        const response = await fetch(`${API_BASE_URL}/api/skills`, {
            cache: 'force-cache', // Cache skills data as it doesn't change often
            next: { revalidate: 300 } // Revalidate every 5 minutes
        });
        if (!response.ok) throw new Error('Failed to fetch skills');
        return response.json();
    }

    // Get child progress
    static async getChildProgress(childId: string): Promise<ChildProgress> {
        // Add timestamp to prevent caching
        const timestamp = new Date().getTime();
        const response = await fetch(`${API_BASE_URL}/api/child/${childId}/progress?_t=${timestamp}`, {
            cache: 'no-store', // Never cache progress data
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache'
            }
        });
        if (!response.ok) throw new Error('Failed to fetch child progress');
        return response.json();
    }

    // Get questions for a skill at a specific difficulty
    static async getSkillQuestions(skillId: string, difficulty?: number): Promise<Question[]> {
        const url = new URL(`${API_BASE_URL}/api/skills/${skillId}/questions`);
        if (difficulty) {
            url.searchParams.append('difficulty', difficulty.toString());
        }
        const response = await fetch(url.toString(), {
            cache: 'no-cache' // Always get fresh questions
        });
        if (!response.ok) throw new Error('Failed to fetch questions');
        return response.json();
    }

    // Get all questions for a skill (all difficulties)
    static async getQuestionsBySkill(skillId: string): Promise<Question[]> {
        const response = await fetch(
            `${API_BASE_URL}/api/skills/${skillId}/questions`,
            { cache: 'no-store' }
        );
        if (!response.ok) throw new Error('Failed to fetch questions');
        return response.json();
    }

    // Start a new session
    static async startSession(childId: string, skillId: string): Promise<Session> {
        const response = await fetch(`${API_BASE_URL}/api/sessions/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ childId, skillId }),
        });
        if (!response.ok) throw new Error('Failed to start session');
        return response.json();
    }

    // End a session
    static async endSession(sessionId: string): Promise<Session> {
        const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}/end`, {
            method: 'POST',
        });
        if (!response.ok) throw new Error('Failed to end session');
        return response.json();
    }

    // Log an attempt
    static async logAttempt(attemptData: {
        childId: string;
        questionId: string;
        microSkillId: string;
        sessionId: string;
        isCorrect: boolean;
        responseTimeSeconds: number;
        hintUsed: boolean;
        hintCount: number;
        userResponse: string;
        correctAnswer: string;
        difficultyLevelAtAttempt: number;
    }): Promise<AttemptResult> {
        const response = await fetch(`${API_BASE_URL}/api/attempts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(attemptData),
        });
        if (!response.ok) throw new Error('Failed to log attempt');
        return response.json();
    }

    // Calculate mastery for a skill
    static async calculateMastery(
        childId: string,
        microSkillId: string
    ): Promise<MasteryResult> {
        const response = await fetch(`${API_BASE_URL}/api/child/${childId}/calculate-mastery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ microSkillId }),
        });
        if (!response.ok) throw new Error('Failed to calculate mastery');
        return response.json();
    }

    // Get teacher's students
    static async getTeacherStudents(teacherId: string) {
        const response = await fetch(`${API_BASE_URL}/api/teacher/${teacherId}/students`);
        if (!response.ok) throw new Error('Failed to fetch students');
        return response.json();
    }

    // ============================================
    // PERFORMANCE REPORTS
    // ============================================

    static async generatePerformanceReport(
        childId: string,
        startDate: Date,
        endDate: Date
    ) {
        const response = await fetch(`${API_BASE_URL}/api/performance/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                childId,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString()
            })
        });
        if (!response.ok) throw new Error('Failed to generate performance report');
        return response.json();
    }

    static async getChildPerformanceReports(childId: string, limit: number = 10) {
        const response = await fetch(
            `${API_BASE_URL}/api/performance/child/${childId}?limit=${limit}`
        );
        if (!response.ok) throw new Error('Failed to fetch performance reports');
        return response.json();
    }

    // ============================================
    // RECOMMENDATIONS
    // ============================================

    static async generateRecommendations(childId: string, limit: number = 5) {
        const response = await fetch(`${API_BASE_URL}/api/recommendations/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ childId, limit })
        });
        if (!response.ok) throw new Error('Failed to generate recommendations');
        return response.json();
    }

    static async getActiveRecommendations(childId: string) {
        const response = await fetch(`${API_BASE_URL}/api/recommendations/${childId}`);
        if (!response.ok) throw new Error('Failed to fetch recommendations');
        return response.json();
    }

    static async completeRecommendation(recommendationId: string) {
        const response = await fetch(
            `${API_BASE_URL}/api/recommendations/${recommendationId}/complete`,
            { method: 'POST' }
        );
        if (!response.ok) throw new Error('Failed to complete recommendation');
        return response.json();
    }

    // ============================================
    // QUIZ REVIEW & AI RECOMMENDATIONS (OPTIMIZED!)
    // ============================================

    // Get quiz review AND recommendation in ONE call (saves tokens!)
    static async getQuizReviewWithRecommendation(sessionId: string, childId: string) {
        const response = await fetch(`${API_BASE_URL}/api/quiz-review/${sessionId}/${childId}`, {
            cache: 'no-store'
        });
        if (!response.ok) throw new Error('Failed to get quiz review');
        return response.json();
    }

    // DEPRECATED: Use getQuizReviewWithRecommendation instead
    static async getQuizReview(sessionId: string, childId: string) {
        const result = await this.getQuizReviewWithRecommendation(sessionId, childId);
        return result.review;
    }

    // DEPRECATED: Use getQuizReviewWithRecommendation instead
    static async getNextSkillRecommendation(sessionId: string, childId: string) {
        const result = await this.getQuizReviewWithRecommendation(sessionId, childId);
        return result.recommendation;
    }

    // ============================================
    // DOCUMENT PROCESSING
    // ============================================

    static async uploadDocument(file: File) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_BASE_URL}/api/admin/documents/upload`, {
            method: 'POST',
            body: formData
        });
        if (!response.ok) throw new Error('Failed to upload document');
        return response.json();
    }

    static async getDocumentStatus(documentId: string) {
        const response = await fetch(
            `${API_BASE_URL}/api/admin/documents/${documentId}/status`
        );
        if (!response.ok) throw new Error('Failed to fetch document status');
        return response.json();
    }

    static async getAllDocuments(limit: number = 50) {
        const response = await fetch(
            `${API_BASE_URL}/api/admin/documents?limit=${limit}`
        );
        if (!response.ok) throw new Error('Failed to fetch documents');
        return response.json();
    }

    static async approveQuestion(questionId: string, skillId: string) {
        const response = await fetch(
            `${API_BASE_URL}/api/admin/questions/${questionId}/approve`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ skillId })
            }
        );
        if (!response.ok) throw new Error('Failed to approve question');
        return response.json();
    }

    // Bulk approve questions
    static async bulkApproveQuestions(questionIds: string[], skillId: string) {
        const response = await fetch(
            `${API_BASE_URL}/api/admin/questions/bulk-approve`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ questionIds, skillId })
            }
        );
        if (!response.ok) throw new Error('Failed to bulk approve questions');
        return response.json();
    }

    // Update question metadata
    static async updateQuestionMetadata(
        questionId: string,
        metadata: { difficultyLevel?: number; gameTemplate?: string }
    ) {
        const response = await fetch(
            `${API_BASE_URL}/api/admin/questions/${questionId}/metadata`,
            {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(metadata)
            }
        );
        if (!response.ok) throw new Error('Failed to update question metadata');
        return response.json();
    }

    // Update extracted question content
    static async updateExtractedQuestion(
        questionId: string,
        data: {
            questionText?: string;
            options?: string[];
            correctAnswer?: string;
            explanation?: string;
            difficultyLevel?: number;
        }
    ) {
        const response = await fetch(
            `${API_BASE_URL}/api/admin/extracted-questions/${questionId}`,
            {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            }
        );
        if (!response.ok) throw new Error('Failed to update extracted question');
        return response.json();
    }

    // Bulk update question metadata
    static async bulkUpdateMetadata(
        questionIds: string[],
        metadata: { difficultyLevel?: number; gameTemplate?: string }
    ) {
        const response = await fetch(
            `${API_BASE_URL}/api/admin/questions/bulk-metadata`,
            {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ questionIds, ...metadata })
            }
        );
        if (!response.ok) throw new Error('Failed to bulk update metadata');
        return response.json();
    }

    static async rejectQuestion(questionId: string) {
        const response = await fetch(
            `${API_BASE_URL}/api/admin/questions/${questionId}/reject`,
            { method: 'POST' }
        );
        if (!response.ok) throw new Error('Failed to reject question');
        return response.json();
    }

    // ============================================
    // CRUD OPERATIONS
    // ============================================

    // Users CRUD
    static async getAllUsers(params?: { page?: number; pageSize?: number; search?: string; role?: string }) {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());
        if (params?.search) queryParams.append('search', params.search);
        if (params?.role) queryParams.append('role', params.role);

        const response = await fetch(`${API_BASE_URL}/api/admin/users?${queryParams}`);
        if (!response.ok) throw new Error('Failed to fetch users');
        return response.json();
    }

    static async createUser(data: any) {
        const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Failed to create user');
        return response.json();
    }

    static async updateUser(userId: string, data: any) {
        const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Failed to update user');
        return response.json();
    }

    static async deleteUser(userId: string) {
        const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete user');
        return response.json();
    }

    // Domains CRUD
    static async updateDomain(domainId: string, data: any) {
        const response = await fetch(`${API_BASE_URL}/api/domains/${domainId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Failed to update domain');
        return response.json();
    }

    static async deleteDomain(domainId: string) {
        const response = await fetch(`${API_BASE_URL}/api/domains/${domainId}`, {
            method: 'DELETE'
        });
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to delete domain');
        }

        return data;
    }

    // Skills CRUD
    static async updateSkill(skillId: string, data: any) {
        const response = await fetch(`${API_BASE_URL}/api/skills/${skillId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Failed to update skill');
        return response.json();
    }

    static async deleteSkill(skillId: string) {
        const response = await fetch(`${API_BASE_URL}/api/skills/${skillId}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete skill');
        return response.json();
    }

    // Questions CRUD
    static async getAllQuestions(params?: { page?: number; pageSize?: number; search?: string; skillId?: string; difficulty?: number; status?: string }) {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());
        if (params?.search) queryParams.append('search', params.search);
        if (params?.skillId) queryParams.append('skillId', params.skillId);
        if (params?.difficulty) queryParams.append('difficulty', params.difficulty.toString());
        if (params?.status) queryParams.append('status', params.status);

        const response = await fetch(`${API_BASE_URL}/api/admin/questions?${queryParams}`);
        if (!response.ok) throw new Error('Failed to fetch questions');
        return response.json();
    }

    static async updateQuestion(questionId: string, data: any) {
        const response = await fetch(`${API_BASE_URL}/api/admin/questions/${questionId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Failed to update question');
        return response.json();
    }

    static async deleteQuestion(questionId: string) {
        const response = await fetch(`${API_BASE_URL}/api/admin/questions/${questionId}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete question');
        return response.json();
    }

    static async createQuestion(data: {
        microSkillId: string;
        difficultyLevel: number;
        promptText: string;
        correctAnswer: string;
        distractors?: string[];
        hasConfusingDistractors?: boolean;
        promptAudioUrl?: string;
        assetUrls?: Record<string, string>;
    }) {
        const response = await fetch(`${API_BASE_URL}/api/admin/questions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create question');
        }
        return response.json();
    }

    // Upload asset to S3
    static async uploadAsset(file: File, folder: 'images' | 'audio' | 'animations', subFolder?: string) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', folder);
        if (subFolder) {
            formData.append('subFolder', subFolder);
        }

        const response = await fetch(`${API_BASE_URL}/api/assets/upload`, {
            method: 'POST',
            body: formData
        });
        if (!response.ok) throw new Error('Failed to upload asset');
        return response.json();
    }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getSkillStatus(
    skill: MicroSkill,
    skillProgress: SkillProgress[],
    allSkills: MicroSkill[]
): 'locked' | 'available' | 'in_progress' | 'mastered' {
    // Find progress for this skill
    const progress = skillProgress.find(sp => sp.microSkillId === skill.id);

    // If mastered, return mastered
    if (progress?.masteryStatus === 'MASTERED') {
        return 'mastered';
    }

    // If in progress, return in_progress
    if (progress?.masteryStatus === 'IN_PROGRESS') {
        return 'in_progress';
    }

    // Check if prerequisites are met
    const prereqCodes = skill.prerequisiteSkills as string[];
    if (prereqCodes && prereqCodes.length > 0) {
        const prereqsMet = prereqCodes.every(prereqCode => {
            const prereqSkill = allSkills.find(s => s.code === prereqCode);
            if (!prereqSkill) return true; // If prereq not found, assume met

            const prereqProgress = skillProgress.find(sp => sp.microSkillId === prereqSkill.id);
            return prereqProgress?.masteryStatus === 'MASTERED';
        });

        if (!prereqsMet) {
            return 'locked';
        }
    }

    // Prerequisites met but not started
    return 'available';
}

export function getNextRecommendedSkill(
    skillProgress: SkillProgress[],
    allSkills: MicroSkill[]
): MicroSkill | null {
    // Find first available or in-progress skill
    for (const skill of allSkills) {
        const status = getSkillStatus(skill, skillProgress, allSkills);
        if (status === 'in_progress') {
            return skill;
        }
    }

    for (const skill of allSkills) {
        const status = getSkillStatus(skill, skillProgress, allSkills);
        if (status === 'available') {
            return skill;
        }
    }

    return null;
}

// Local type definitions to replace Prisma client imports
// These types mirror the Prisma schema but are frontend-safe

export enum ErrorType {
    B_D_CONFUSION = 'B_D_CONFUSION',
    P_Q_CONFUSION = 'P_Q_CONFUSION',
    M_N_CONFUSION = 'M_N_CONFUSION',
    U_N_CONFUSION = 'U_N_CONFUSION',
    VOWEL_ERROR = 'VOWEL_ERROR',
    OTHER = 'OTHER'
}

export interface Attempt {
    id: string;
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
    errorType: ErrorType;
    difficultyLevelAtAttempt: number;
    createdAt: Date;
}

export interface MicroSkill {
    id: string;
    code: string;
    name: string;
    description: string | null;
    domainId: string;
    nextSkills: string[];
    createdAt: Date;
    updatedAt: Date;
}

export interface SkillDomain {
    id: string;
    code: string;
    name: string;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface Question {
    id: string;
    microSkillId: string;
    difficultyLevel: 1 | 2 | 3;
    promptText: string;
    promptAudioUrl?: string;
    correctAnswer: string;
    distractors: string[];
    hasConfusingDistractors: boolean;
    assetUrls: any;
    gameTemplate?: string;
}

export interface BaseGameProps {
    question: Question;
    onAnswer: (isCorrect: boolean, responseTime: number, hintUsed: boolean, userResponse?: string) => void;
    difficultyLevel: 1 | 2 | 3;
    showHint: boolean;
    isRulesModalOpen?: boolean;
    questionIndex?: number; // Current question index (0-based)
    totalQuestions?: number; // Total number of questions in the quiz
}

export interface GameResult {
    isCorrect: boolean;
    responseTime: number;
    hintUsed: boolean;
}

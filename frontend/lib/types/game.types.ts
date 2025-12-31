export interface Question {
    id: string;
    microSkillId: string;
    difficultyLevel: 1 | 2 | 3;
    promptText: string;
    promptAudioUrl?: string;
    correctAnswer: string;
    distractors: string[];
    hasConfusingDistractors: boolean;
    assetUrls: {
        options?: string[];
        [key: string]: any;
    };
    gameTemplate?: string;
}

export interface BaseGameProps {
    question: Question;
    onAnswer: (isCorrect: boolean, responseTime: number, hintUsed: boolean) => void;
    difficultyLevel: 1 | 2 | 3;
    showHint: boolean;
}

export interface GameResult {
    isCorrect: boolean;
    responseTime: number;
    hintUsed: boolean;
}

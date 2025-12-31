'use client';

import { useState } from 'react';
import TapToSelectGame from '@/components/game-templates/TapToSelectGame';
import { Question } from '@/lib/types/game.types';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useSkillQuestions, useLogAttempt } from '@/lib/hooks/useApi';

export default function PlayGamePage() {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [totalAttempts, setTotalAttempts] = useState(0);
    const [gameComplete, setGameComplete] = useState(false);

    const childId = 'child_001'; // TODO: Get from session
    const skillId = 'skill_a1'; // Start with first skill
    const [currentDifficulty] = useState<1 | 2 | 3>(1);

    const { data: questionsData = [], isLoading } = useSkillQuestions(skillId, currentDifficulty);
    const logAttemptMutation = useLogAttempt();

    // Convert database format to game format
    const questions: Question[] = questionsData.map((q: any) => ({
        id: q.id,
        microSkillId: q.microSkillId,
        difficultyLevel: q.difficultyLevel,
        promptText: q.promptText,
        promptAudioUrl: q.promptAudioUrl,
        correctAnswer: q.correctAnswer,
        distractors: Array.isArray(q.distractors) ? q.distractors : JSON.parse(q.distractors || '[]'),
        hasConfusingDistractors: q.hasConfusingDistractors,
        assetUrls: typeof q.assetUrls === 'string' ? JSON.parse(q.assetUrls) : q.assetUrls
    }));

    const handleAnswer = async (isCorrect: boolean, responseTime: number, hintUsed: boolean) => {
        setTotalAttempts(prev => prev + 1);
        if (isCorrect) {
            setScore(prev => prev + 1);
        }

        // Log attempt to database using React Query mutation
        try {
            await logAttemptMutation.mutateAsync({
                childId,
                questionId: questions[currentQuestionIndex].id,
                microSkillId: skillId,
                isCorrect,
                responseTimeSeconds: responseTime,
                hintUsed,
                hintCount: hintUsed ? 1 : 0,
                userResponse: isCorrect ? questions[currentQuestionIndex].correctAnswer : 'wrong',
                correctAnswer: questions[currentQuestionIndex].correctAnswer,
                difficultyLevelAtAttempt: currentDifficulty
            });
        } catch (error) {
            console.error('Error logging attempt:', error);
        }

        // Move to next question
        setTimeout(() => {
            if (currentQuestionIndex < questions.length - 1) {
                setCurrentQuestionIndex(prev => prev + 1);
            } else {
                setGameComplete(true);
            }
        }, 2500);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400 flex items-center justify-center">
                <div className="text-white text-5xl font-bold">Loading Game...</div>
            </div>
        );
    }

    if (questions.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400 flex items-center justify-center p-6">
                <div className="bg-white rounded-3xl p-12 shadow-2xl text-center max-w-2xl">
                    <div className="text-8xl mb-6">📚</div>
                    <h1 className="text-4xl font-bold text-purple-800 mb-4">No Questions Available</h1>
                    <p className="text-2xl text-gray-700 mb-8">
                        Please add questions to this skill first.
                    </p>
                    <Link href="/child/home">
                        <button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-12 py-6 rounded-full font-bold text-2xl hover:from-purple-600 hover:to-pink-600">
                            Back to Home
                        </button>
                    </Link>
                </div>
            </div>
        );
    }

    if (gameComplete) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-400 via-blue-400 to-purple-400 flex items-center justify-center p-6">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="bg-white rounded-3xl p-12 shadow-2xl text-center max-w-2xl"
                >
                    <div className="text-8xl mb-6">🎉</div>
                    <h1 className="text-6xl font-bold text-purple-800 mb-4">Great Job!</h1>
                    <p className="text-3xl text-gray-700 mb-8">
                        You got {score} out of {totalAttempts} correct!
                    </p>
                    <div className="text-7xl mb-8">
                        {'⭐'.repeat(Math.min(3, Math.ceil((score / totalAttempts) * 3)))}
                    </div>
                    <div className="flex gap-4 justify-center">
                        <Link href="/child/home">
                            <button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-12 py-6 rounded-full font-bold text-2xl hover:from-purple-600 hover:to-pink-600">
                                Home
                            </button>
                        </Link>
                        <button
                            onClick={() => {
                                setCurrentQuestionIndex(0);
                                setScore(0);
                                setTotalAttempts(0);
                                setGameComplete(false);
                            }}
                            className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-12 py-6 rounded-full font-bold text-2xl hover:from-green-600 hover:to-blue-600"
                        >
                            Play Again
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="relative">
            {/* Score Display */}
            <div className="fixed top-4 right-4 bg-white rounded-full px-6 py-3 shadow-lg z-50">
                <p className="text-lg font-bold text-purple-800">
                    Score: {score}/{totalAttempts}
                </p>
            </div>

            {/* Progress Indicator */}
            <div className="fixed top-4 left-4 bg-white rounded-full px-6 py-3 shadow-lg z-50">
                <p className="text-lg font-bold text-purple-800">
                    Question {currentQuestionIndex + 1}/{questions.length}
                </p>
            </div>

            {/* Game Component */}
            {questions.length > 0 && (
                <TapToSelectGame
                    question={questions[currentQuestionIndex]}
                    onAnswer={handleAnswer}
                    difficultyLevel={questions[currentQuestionIndex].difficultyLevel}
                    showHint={questions[currentQuestionIndex].difficultyLevel === 1}
                />
            )}
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Sparkles, Lightbulb, Volume2 } from 'lucide-react';
import { BaseGameProps } from '@/lib/types/game.types';
import { useSpeech } from '@/hooks/useSpeech';

export default function NumberLineBuilderGame({
    question,
    onAnswer,
    difficultyLevel,
    showHint: shouldShowHint,
    isRulesModalOpen,
}: BaseGameProps) {
    const { speak } = useSpeech();

    // Parse question data
    const sequence: number[] = question.assetUrls?.sequence || [];
    const hiddenPositions: number[] = question.assetUrls?.hiddenPositions || [];
    const correctAnswers = question.correctAnswer.split(',').map(Number);

    const [userAnswers, setUserAnswers] = useState<{ [key: number]: string }>({});
    const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
    const [showHint, setShowHint] = useState(false);
    const [startTime] = useState(Date.now());
    const [highlightedPosition, setHighlightedPosition] = useState<number | null>(null);

    // Speak instructions on mount
    useEffect(() => {
        if (!isRulesModalOpen) {
            speak(question.promptText);
        }
    }, [isRulesModalOpen]);

    const handleInputChange = (position: number, value: string) => {
        // Only allow numbers
        if (value === '' || /^\d+$/.test(value)) {
            setUserAnswers(prev => ({ ...prev, [position]: value }));
        }
    };

    const handleCheck = () => {
        // Check if all answers are correct
        const allCorrect = hiddenPositions.every((pos, idx) => {
            const userAnswer = parseInt(userAnswers[pos] || '');
            return userAnswer === correctAnswers[idx];
        });

        const timeSeconds = (Date.now() - startTime) / 1000;
        onAnswer(allCorrect, timeSeconds, false);
    };

    const handleHint = () => {
        setShowHint(true);
        // Highlight the first empty or incorrect answer
        const firstIncorrectPos = hiddenPositions.find((pos, idx) => {
            const userAnswer = parseInt(userAnswers[pos] || '');
            return !userAnswer || userAnswer !== correctAnswers[idx];
        });

        if (firstIncorrectPos !== undefined) {
            setHighlightedPosition(firstIncorrectPos);
            setTimeout(() => setHighlightedPosition(null), 3000);
        }

        setTimeout(() => setShowHint(false), 3000);
    };

    const playNumberAudio = (num: number) => {
        speak(num.toString());
    };

    const allFilled = hiddenPositions.every(pos => userAnswers[pos]?.length > 0);

    return (
        <div className="w-full h-full flex items-center justify-center p-4">
            <div className="w-full max-w-5xl">
                {/* Header */}
                <motion.div
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-center mb-6"
                >
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 bg-clip-text text-transparent">
                        🔢 Number Line Builder
                    </h2>
                </motion.div>

                {/* Number Sequence */}
                <div className="mb-4">
                    <div className="flex items-center justify-center gap-3 flex-wrap">
                        {sequence.map((num, index) => {
                            const isHidden = hiddenPositions.includes(index);
                            const isHighlighted = highlightedPosition === index;
                            const userValue = userAnswers[index] || '';
                            const isCorrectAnswer = isHidden && parseInt(userValue) === num;
                            const isWrongAnswer = isHidden && userValue && parseInt(userValue) !== num;

                            return (
                                <motion.div
                                    key={index}
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ delay: index * 0.05, type: 'spring' }}
                                    className="relative"
                                >
                                    {isHidden ? (
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={userValue}
                                                onChange={(e) => handleInputChange(index, e.target.value)}
                                                disabled={!!feedback}
                                                className={`
                                                w-20 h-24 text-4xl font-bold text-center rounded-2xl
                                                border-4 shadow-xl transition-all duration-300
                                                ${isHighlighted ? 'border-yellow-400 ring-4 ring-yellow-400 ring-offset-4 animate-pulse' : 'border-purple-400'}
                                                ${feedback === 'correct' && isCorrectAnswer ? 'border-green-500 bg-green-100' : ''}
                                                ${feedback === 'incorrect' && isWrongAnswer ? 'border-red-500 bg-red-100 animate-shake' : ''}
                                                ${!feedback ? 'bg-white hover:border-purple-600 focus:border-purple-600 focus:ring-4 focus:ring-purple-300' : ''}
                                                disabled:opacity-70
                                            `}
                                                placeholder="?"
                                                maxLength={3}
                                            />

                                        </div>
                                    ) : (
                                        <motion.div
                                            whileHover={{ scale: 1.1, y: -5 }}
                                            className="relative group"
                                        >
                                            <div className="w-20 h-24 flex items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600 text-white text-4xl font-bold rounded-2xl shadow-xl border-4 border-blue-300">
                                                {num}
                                            </div>
                                            <button
                                                onClick={() => playNumberAudio(num)}
                                                className="absolute -top-2 -right-2 bg-pink-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-pink-600"
                                            >
                                                <Volume2 className="w-4 h-4" />
                                            </button>
                                        </motion.div>
                                    )}

                                    {/* Arrow between numbers */}
                                    {index < sequence.length - 1 && (
                                        <div className="absolute top-1/2 -right-4 transform -translate-y-1/2 text-3xl text-purple-400">
                                            →
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-center gap-6 mb-6">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleHint}
                        disabled={!!feedback}
                        className="px-8 py-4 bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-full text-xl font-bold shadow-xl hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <Lightbulb className="w-6 h-6" />
                        Need a Hint?
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleCheck}
                        disabled={!allFilled || !!feedback}
                        className="px-12 py-4 bg-gradient-to-r from-green-400 to-emerald-500 text-white rounded-full text-xl font-bold shadow-xl hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <CheckCircle2 className="w-6 h-6" />
                        Check My Answers!
                    </motion.button>
                </div>
            </div>
        </div>
    );
}

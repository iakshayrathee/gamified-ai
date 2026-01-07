'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, CheckCircle, XCircle, Clock } from 'lucide-react';
import ShakeAnimation from '@/components/ui/ShakeAnimation';
import { useSpeech } from '@/hooks/useSpeech';
import { playCorrectSound, playIncorrectSound } from '@/lib/audioFeedback';
import { BaseGameProps } from '@/lib/types/game.types';

interface PictureOption {
    id: string;
    imageUrl: string;
    word: string;
}

interface WordAttempt {
    word: string;
    attempts: number;
    correctAttempts: number;
    totalTime: number;
    status: 'correct' | 'incorrect' | 'pending';
    tier?: number;
}

export default function PictureToWordGame({
    question,
    onAnswer,
    difficultyLevel,
    showHint: shouldShowHint,
    isRulesModalOpen,
}: BaseGameProps) {
    const rawOptions = question.assetUrls?.options || [];
    const options: PictureOption[] = rawOptions.map((opt: any, idx: number) =>
        typeof opt === 'string' ? { id: String(idx), word: opt, imageUrl: '' } : opt
    );

    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [showFeedback, setShowFeedback] = useState<'correct' | 'incorrect' | null>(null);
    const [startTime] = useState(Date.now());
    const [questionStartTime, setQuestionStartTime] = useState(Date.now());
    const [wordHistory, setWordHistory] = useState<WordAttempt[]>([]);
    const [currentWord, setCurrentWord] = useState<string>('');
    const [currentTier, setCurrentTier] = useState<number | undefined>(undefined);

    // Initialize TTS
    const { speak, stop } = useSpeech();

    // Calculate tier based on performance
    const calculateTier = (accuracy: number, attempts: number): number | undefined => {
        if (attempts === 0) return undefined;
        
        if (accuracy >= 80) return 1; // Independent / Grade-ready
        if (accuracy >= 60) return 2; // Needs guided reinforcement  
        if (accuracy >= 40) return 3; // High risk – intervention required
        return 3; // Default to tier 3 for very low performance
    };

    // Reset state when question changes
    useEffect(() => {
        setSelectedOption(null);
        setShowFeedback(null);
        setQuestionStartTime(Date.now());
        setCurrentWord(question?.correctAnswer || '');
        stop();
    }, [question?.id, stop, question?.correctAnswer]);

    // Auto-play word audio
    useEffect(() => {
        if (!isRulesModalOpen && question?.correctAnswer) {
            speak(question.correctAnswer);
        }
    }, [question?.id, isRulesModalOpen, question?.correctAnswer, speak]);

    const playAudio = (text?: string) => {
        if (text) {
            speak(text);
        }
    };

    const handleOptionClick = (optionId: string, word: string) => {
        if (showFeedback) return;

        setSelectedOption(optionId);
        const isCorrect = word === question?.correctAnswer;
        const timeSeconds = (Date.now() - questionStartTime) / 1000;

        if (isCorrect) {
            playCorrectSound();
            setShowFeedback('correct');

            // Update word history
            const existingWord = wordHistory.find(w => w.word === currentWord);
            const wordAccuracy = Math.round((existingWord ? (existingWord.correctAttempts + 1) / (existingWord.attempts + 1) : 1) * 100);
            const totalAttempts = existingWord ? existingWord.attempts + 1 : 1;
            const calculatedTier = calculateTier(wordAccuracy, totalAttempts);
            
            if (existingWord) {
                existingWord.correctAttempts++;
                existingWord.attempts++;
                existingWord.totalTime += timeSeconds;
                existingWord.status = 'correct';
                existingWord.tier = calculatedTier;
                setWordHistory([...wordHistory]);
            } else {
                setWordHistory([...wordHistory, {
                    word: currentWord,
                    attempts: 1,
                    correctAttempts: 1,
                    totalTime: timeSeconds,
                    status: 'correct',
                    tier: calculatedTier
                }]);
            }

            // Move to next question after brief delay
            setTimeout(() => {
                setShowFeedback(null);
                onAnswer(isCorrect, timeSeconds, false, word);
            }, 800);
        } else {
            playIncorrectSound();
            setShowFeedback('incorrect');

            // Update word history
            const existingWord = wordHistory.find(w => w.word === currentWord);
            const wordAccuracy = Math.round((existingWord ? existingWord.correctAttempts : 0) / (existingWord ? existingWord.attempts + 1 : 1) * 100);
            const totalAttempts = existingWord ? existingWord.attempts + 1 : 1;
            const calculatedTier = calculateTier(wordAccuracy, totalAttempts);
            
            if (existingWord) {
                existingWord.attempts++;
                existingWord.totalTime += timeSeconds;
                existingWord.status = 'incorrect';
                existingWord.tier = calculatedTier;
                setWordHistory([...wordHistory]);
            } else {
                setWordHistory([...wordHistory, {
                    word: currentWord,
                    attempts: 1,
                    correctAttempts: 0,
                    totalTime: timeSeconds,
                    status: 'incorrect',
                    tier: calculatedTier
                }]);
            }

            // Clear feedback and allow retry
            setTimeout(() => {
                setShowFeedback(null);
                setSelectedOption(null);
            }, 500);
        }
    };

    // Calculate statistics
    const totalWords = wordHistory.length;
    const correctWords = wordHistory.filter(w => w.status === 'correct').length;
    const accuracy = totalWords > 0 ? Math.round((correctWords / totalWords) * 100) : 0;
    const avgResponseTime = totalWords > 0
        ? (wordHistory.reduce((sum, w) => sum + w.totalTime, 0) / totalWords).toFixed(1)
        : '0.0';

    // Safety check
    if (!question || !options || options.length === 0) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100 p-6">
                <div className="text-center">
                    <p className="text-2xl text-red-600">Error: Invalid question data</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full h-full flex bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 rounded-3xl overflow-hidden">
            {/* Exit Button */}
            <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute top-6 right-6 z-50 bg-white/50 backdrop-blur-sm p-3 rounded-full text-purple-800 hover:bg-red-100 hover:text-red-600 transition-colors shadow-sm"
                onClick={() => window.history.back()}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
            >
                <XCircle className="w-8 h-8" />
            </motion.button>

            {/* LEFT SIDEBAR - Statistics */}
            <motion.div
                initial={{ x: -300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="w-72 flex-shrink-0 bg-white/40 backdrop-blur-lg border-r-2 border-white/50 p-4 flex flex-col gap-3 overflow-y-auto"
            >
                {/* Session Stats */}
                <div className="bg-white/80 rounded-xl p-4 shadow-lg">
                    <h3 className="text-lg font-bold text-purple-800 mb-3 flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        Session Stats
                    </h3>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Words Attempted:</span>
                            <span className="font-bold text-purple-700">{totalWords}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Correct:</span>
                            <span className="font-bold text-green-600">{correctWords}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Accuracy:</span>
                            <span className="font-bold text-blue-600">{accuracy}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Avg Time:</span>
                            <span className="font-bold text-orange-600">{avgResponseTime}s</span>
                        </div>
                    </div>
                </div>

                {/* Word History */}
                <div className="bg-white/80 rounded-xl p-4 shadow-lg flex-1">
                    <h3 className="text-lg font-bold text-purple-800 mb-3">Word History</h3>

                    <div className="space-y-2">
                        <AnimatePresence>
                            {wordHistory.slice().reverse().map((wordAttempt, index) => {
                                const wordAccuracy = Math.round((wordAttempt.correctAttempts / wordAttempt.attempts) * 100);
                                const avgTime = (wordAttempt.totalTime / wordAttempt.attempts).toFixed(1);

                                return (
                                    <motion.div
                                        key={`${wordAttempt.word}-${index}`}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className={`
                                            p-3 rounded-lg border-2 transition-all
                                            ${wordAttempt.status === 'correct'
                                                ? 'bg-green-50 border-green-300'
                                                : 'bg-red-50 border-red-300'
                                            }
                                        `}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-bold text-lg">{wordAttempt.word}</span>
                                            <div className="flex items-center gap-2">
                                                {wordAttempt.status === 'correct' ? (
                                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                                ) : (
                                                    <XCircle className="w-5 h-5 text-red-600" />
                                                )}
                                                {wordAttempt.tier && (
                                                    <div className={`px-2 py-1 rounded-full text-xs font-bold ${
                                                        wordAttempt.tier === 1 ? 'bg-green-100 text-green-700' :
                                                        wordAttempt.tier === 2 ? 'bg-yellow-100 text-yellow-700' :
                                                            'bg-red-100 text-red-700'
                                                    }`}>
                                                        Tier {wordAttempt.tier}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-xs text-gray-600 space-y-1">
                                            <div className="flex justify-between">
                                                <span>Accuracy:</span>
                                                <span className="font-semibold">{wordAccuracy}%</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Attempts:</span>
                                                <span className="font-semibold">{wordAttempt.attempts}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Avg Time:</span>
                                                <span className="font-semibold">{avgTime}s</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                </div>
            </motion.div>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col p-4 overflow-hidden relative">
                {/* Word prompt at top */}
                <motion.div
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="flex-shrink-0 mb-2"
                >
                    <div className="bg-white/90 backdrop-blur-sm rounded-xl px-2 py-1 shadow-lg flex items-center justify-between max-w-xl mx-auto">
                        <div className="flex-1 text-center">
                            <h2 className="text-3xl font-bold text-purple-800 mb-1">
                                {question?.correctAnswer}
                            </h2>
                            <p className="text-lg text-gray-600">Select matching picture</p>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Timer */}
                            <div className="flex items-center gap-2 bg-blue-100 px-4 py-2 rounded-xl">
                                <Clock className="w-5 h-5 text-blue-600" />
                                <span className="font-bold text-blue-800">
                                    {Math.floor((Date.now() - startTime) / 60000)}:{String(Math.floor(((Date.now() - startTime) % 60000) / 1000)).padStart(2, '0')}
                                </span>
                            </div>
                            <motion.button
                                onClick={() => playAudio(question?.correctAnswer)}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                className="bg-purple-500 text-white rounded-full p-2 shadow-md hover:bg-purple-600 transition-colors"
                            >
                                <Volume2 className="w-5 h-5" />
                            </motion.button>
                        </div>
                    </div>
                </motion.div>

                {/* Feedback indicator */}
                <AnimatePresence>
                    {showFeedback && (
                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            className={`
                                absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50
                                px-8 py-4 rounded-2xl shadow-2xl font-bold text-2xl pointer-events-none
                                ${showFeedback === 'correct'
                                    ? 'bg-green-500 text-white'
                                    : 'bg-red-500 text-white'
                                }
                            `}
                        >
                            {showFeedback === 'correct' ? '✓ Correct!' : '✗ Try Again'}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Picture options grid with responsive sizing */}
                <div className="flex-1 flex items-center justify-center p-1">
                    <div className="grid grid-cols-2 gap-3 w-full max-w-4xl h-full max-h-[75vh] min-h-[400px] p-2">
                        {options?.map((option, index) => {
                            const isSelected = selectedOption === option.id;
                            const isCorrect = option.word === question?.correctAnswer;
                            const showAsCorrect = isSelected && showFeedback === 'correct';
                            const showAsWrong = isSelected && showFeedback === 'incorrect';

                            // Determine base styles
                            let cardStyle = "bg-gradient-to-br from-white to-purple-50 shadow-xl border-4 border-purple-300 hover:from-purple-50 hover:to-purple-100";

                            if (showAsCorrect) {
                                cardStyle = "bg-gradient-to-br from-green-400 to-green-600 scale-105 border-green-500";
                            } else if (showAsWrong) {
                                cardStyle = "bg-gradient-to-br from-red-400 to-red-600 border-red-500";
                            } else if (showFeedback && !isSelected) {
                                cardStyle = "bg-gradient-to-br from-white to-purple-50 shadow opacity-50 border-purple-100 grayscale";
                            }

                            return (
                                <ShakeAnimation
                                    key={`shake-${option.id}`}
                                    trigger={showAsWrong}
                                    intensity="medium"
                                    className="w-full h-full"
                                >
                                    <motion.button
                                        key={option.id}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: index * 0.1 }}
                                        whileHover={{ scale: !showFeedback ? 1.02 : 1 }}
                                        whileTap={{ scale: !showFeedback ? 0.98 : 1 }}
                                        onClick={() => handleOptionClick(option.id, option.word)}
                                        disabled={!!showFeedback}
                                        className={`
                                            relative w-full h-full rounded-xl
                                            transition-all duration-300 transform flex items-center justify-center
                                            min-h-0 min-w-0 overflow-hidden
                                            ${cardStyle}
                                        `}
                                    >
                                        {/* Picture with better overflow handling */}
                                        <div className="w-full h-full flex items-center justify-center overflow-hidden rounded-lg bg-white/20 min-h-0">
                                            <img
                                                src={option.imageUrl}
                                                alt={option.word}
                                                className="w-full h-full object-contain"
                                                style={{ maxHeight: '75%', maxWidth: '75%' }}
                                            />
                                        </div>

                                        {/* Feedback Icons */}
                                        {showAsCorrect && (
                                            <motion.div
                                                initial={{ scale: 0, rotate: -180 }}
                                                animate={{ scale: 1, rotate: 0 }}
                                                transition={{ type: "spring" }}
                                            >
                                                <CheckCircle className="absolute top-2 left-2 w-8 h-8 text-white drop-shadow-lg" />
                                            </motion.div>
                                        )}
                                        {showAsWrong && (
                                            <motion.div
                                                initial={{ scale: 0, rotate: 180 }}
                                                animate={{ scale: 1, rotate: 0 }}
                                                transition={{ type: "spring" }}
                                            >
                                                <XCircle className="absolute top-2 left-2 w-8 h-8 text-white drop-shadow-lg" />
                                            </motion.div>
                                        )}
                                    </motion.button>
                                </ShakeAnimation>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

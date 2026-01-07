'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, CheckCircle, XCircle, Clock } from 'lucide-react';
import ShakeAnimation from '@/components/ui/ShakeAnimation';
import { useSpeech } from '@/hooks/useSpeech';
import { playCorrectSound, playIncorrectSound } from '@/lib/audioFeedback';
import { BaseGameProps } from '@/lib/types/game.types';

interface WordAttempt {
    word: string;
    attempts: number;
    correctAttempts: number;
    totalTime: number;
    status: 'correct' | 'incorrect' | 'pending';
    tier?: number;
}

export default function ReadingComprehensionGame({
    question,
    onAnswer,
    difficultyLevel,
    showHint: shouldShowHint,
    isRulesModalOpen,
}: BaseGameProps) {
    // Extract data from question
    const assetData = (question.assetUrls as any) || {};
    const sentence = assetData.sentence || question.promptText;
    const pictureUrl = assetData.pictureUrl;
    const useTTS = assetData.useTTS || false;

    // Parse distractors - use useMemo to prevent re-shuffling on every render
    const options = useMemo(() => {
        const rawDistractors = typeof question.distractors === 'string'
            ? JSON.parse(question.distractors)
            : question.distractors || [];
        return [question.correctAnswer, ...rawDistractors].sort(() => Math.random() - 0.5);
    }, [question.id, question.correctAnswer, question.distractors]);

    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [showFeedback, setShowFeedback] = useState<'correct' | 'incorrect' | null>(null);
    const [startTime] = useState(Date.now());
    const [questionStartTime, setQuestionStartTime] = useState(Date.now());
    const [wordHistory, setWordHistory] = useState<WordAttempt[]>([]);
    const [currentWord, setCurrentWord] = useState<string>('');
    const [currentTier, setCurrentTier] = useState<number>(1);
    const [wrongAttempts, setWrongAttempts] = useState(0);

    // Initialize TTS
    const { speak, stop } = useSpeech();

    // Calculate tier based on performance (matches backend logic)
    const calculateTier = (accuracy: number, attempts: number): number => {
        if (attempts === 0) return 1;

        if (accuracy >= 80) return 1; // Independent / Grade-ready
        if (accuracy >= 60) return 2; // Needs guided reinforcement (60-79%)
        if (accuracy >= 40) return 2; // Still Tier 2 (40-59%)
        return 3; // High risk – intervention required (<40%)
    };

    // Reset state when question changes
    useEffect(() => {
        setSelectedOption(null);
        setShowFeedback(null);
        setQuestionStartTime(Date.now());
        setCurrentWord(question?.correctAnswer || '');
        setWrongAttempts(0);
        stop();
    }, [question?.id, stop, question?.correctAnswer]);

    const playAudio = () => {
        // Spell the question sentence with 'blank' for the missing word
        if (useTTS && sentence) {
            const questionToSpeak = sentence.replace('___', 'blank');
            speak(questionToSpeak);
        }
    };

    const handleOptionClick = (word: string) => {
        if (showFeedback) return;

        setSelectedOption(word);
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

            setCurrentTier(calculatedTier);

            // Move to next question after brief delay
            setTimeout(() => {
                setShowFeedback(null);
                onAnswer(isCorrect, timeSeconds, false, word);
            }, 800);
        } else {
            playIncorrectSound();
            setShowFeedback('incorrect');
            setWrongAttempts(prev => prev + 1);

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

            setCurrentTier(calculatedTier);

            // After 3 wrong attempts, move to next question
            if (wrongAttempts + 1 >= 3) {
                setTimeout(() => {
                    setShowFeedback(null);
                    onAnswer(false, timeSeconds, false, word);
                }, 800);
            } else {
                // Clear feedback and allow retry
                setTimeout(() => {
                    setShowFeedback(null);
                    setSelectedOption(null);
                }, 500);
            }
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
            {/* Exit Button - Top Right with spacing */}
            <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute top-4 right-4 z-50 bg-red-500/90 backdrop-blur-sm p-2 rounded-full text-white hover:bg-red-600 transition-colors shadow-lg"
                onClick={() => window.history.back()}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
            >
                <XCircle className="w-6 h-6" />
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
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Current Tier:</span>
                            <span className={`font-bold ${currentTier === 1 ? 'text-green-600' :
                                currentTier === 2 ? 'text-yellow-600' :
                                    'text-red-600'
                                }`}>Tier {currentTier}</span>
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
                                                    <div className={`px-2 py-1 rounded-full text-xs font-bold ${wordAttempt.tier === 1 ? 'bg-green-100 text-green-700' :
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
            <div className="flex-1 flex flex-col p-6 overflow-hidden relative">
                {/* Sentence prompt at top */}
                {/* Sentence prompt - More compact */}
                <motion.div
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="flex-shrink-0 mb-6 mt-4"
                >
                    <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-6 py-4 shadow-xl">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-xl font-bold text-purple-800">
                                Complete the sentence:
                            </h2>
                            <div className="flex items-center gap-2">
                                {/* Timer */}
                                <div className="flex items-center gap-1 bg-blue-100 px-3 py-1.5 rounded-xl">
                                    <Clock className="w-4 h-4 text-blue-600" />
                                    <span className="font-bold text-blue-800 text-sm">
                                        {Math.floor((Date.now() - startTime) / 60000)}:{String(Math.floor(((Date.now() - startTime) % 60000) / 1000)).padStart(2, '0')}
                                    </span>
                                </div>

                                {/* Audio button */}
                                {useTTS && (
                                    <motion.button
                                        onClick={playAudio}
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="bg-purple-500 text-white rounded-full p-2 shadow-lg hover:bg-purple-600 transition-colors"
                                    >
                                        <Volume2 className="w-5 h-5" />
                                    </motion.button>
                                )}
                            </div>
                        </div>

                        {/* Sentence with blank */}
                        <p className="text-3xl font-bold text-gray-800 text-center mb-4">
                            {sentence}
                        </p>

                        {/* Picture hint for Tier 2 and 3 */}
                        {(currentTier === 2 || currentTier === 3) && pictureUrl && (
                            <div className="flex justify-center mt-4">
                                <img
                                    src={pictureUrl}
                                    alt="hint"
                                    className="w-48 h-36 object-contain rounded-lg shadow-md"
                                />
                            </div>
                        )}

                        {wrongAttempts > 0 && (
                            <div className="text-center mt-2">
                                <span className="text-sm font-semibold text-red-600">
                                    Attempts: {wrongAttempts}/3
                                </span>
                            </div>
                        )}
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

                {/* Word options */}
                <div className="flex-1 flex items-center justify-center">
                    <div className="grid grid-cols-2 gap-4 w-full max-w-3xl">
                        {options.map((option, index) => {
                            const isSelected = selectedOption === option;
                            const isCorrect = option === question?.correctAnswer;
                            const showAsCorrect = isSelected && showFeedback === 'correct';
                            const showAsWrong = isSelected && showFeedback === 'incorrect';

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
                                    key={`shake-${option}`}
                                    trigger={showAsWrong}
                                    intensity="medium"
                                    className="w-full h-full"
                                >
                                    <motion.button
                                        key={option}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: index * 0.1 }}
                                        whileHover={{ scale: !showFeedback ? 1.05 : 1 }}
                                        whileTap={{ scale: !showFeedback ? 0.95 : 1 }}
                                        onClick={() => handleOptionClick(option)}
                                        disabled={!!showFeedback}
                                        className={`
                                            relative w-full h-32 p-6 rounded-xl
                                            transition-all duration-300 transform flex items-center justify-center
                                            ${cardStyle}
                                        `}
                                    >
                                        <span className="text-3xl font-bold text-purple-800">
                                            {option}
                                        </span>

                                        {/* Feedback Icons */}
                                        {showAsCorrect && (
                                            <motion.div
                                                initial={{ scale: 0, rotate: -180 }}
                                                animate={{ scale: 1, rotate: 0 }}
                                                transition={{ type: "spring" }}
                                            >
                                                <CheckCircle className="absolute top-2 right-2 w-8 h-8 text-white drop-shadow-lg" />
                                            </motion.div>
                                        )}
                                        {showAsWrong && (
                                            <motion.div
                                                initial={{ scale: 0, rotate: 180 }}
                                                animate={{ scale: 1, rotate: 0 }}
                                                transition={{ type: "spring" }}
                                            >
                                                <XCircle className="absolute top-2 right-2 w-8 h-8 text-white drop-shadow-lg" />
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

'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { Volume2, CheckCircle, XCircle, Clock, RotateCcw } from 'lucide-react';
import ShakeAnimation from '@/components/ui/ShakeAnimation';
import { useSpeech } from '@/hooks/useSpeech';
import { playCorrectSound, playIncorrectSound } from '@/lib/audioFeedback';
import { BaseGameProps } from '@/lib/types/game.types';

interface WordOption {
    id: string;
    word: string;
    imageUrl?: string;
    originalIndex?: number;
}

interface WordAttempt {
    word: string;
    attempts: number;
    correctAttempts: number;
    totalTime: number;
    status: 'correct' | 'incorrect' | 'pending';
    tier?: number;
}

interface RecallGameProps extends BaseGameProps {
    gameMode?: 'tap' | 'drag';
}

export default function RecallGame({
    question,
    onAnswer,
    difficultyLevel,
    showHint: shouldShowHint,
    isRulesModalOpen,
    gameMode = 'tap'
}: RecallGameProps) {
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [showFeedback, setShowFeedback] = useState<'correct' | 'incorrect' | null>(null);
    const [startTime] = useState(Date.now());
    const [questionStartTime, setQuestionStartTime] = useState(Date.now());
    const [wordHistory, setWordHistory] = useState<WordAttempt[]>([]);
    const [currentWord, setCurrentWord] = useState<string>('');
    const [hasPlayedAudio, setHasPlayedAudio] = useState(false);
    const [draggedOptions, setDraggedOptions] = useState<WordOption[]>([]);
    const [wrongAttempts, setWrongAttempts] = useState(0);
    const [showTextPrompt, setShowTextPrompt] = useState(false);
    const [currentTier, setCurrentTier] = useState<number | undefined>(undefined);

    // Initialize TTS
    const { speak, stop } = useSpeech();

    // Calculate tier based on performance (matches backend logic)
    const calculateTier = (accuracy: number, attempts: number): number | undefined => {
        if (attempts === 0) return undefined;

        if (accuracy >= 80) return 1; // Independent / Grade-ready
        if (accuracy >= 60) return 2; // Needs guided reinforcement (60-79%)
        if (accuracy >= 40) return 2; // Still Tier 2 (40-59%)
        return 3; // High risk – intervention required (<40%)
    };

    // Extract and shuffle options
    useEffect(() => {
        if (question?.distractors) {
            const options: WordOption[] = [
                { id: 'correct', word: question.correctAnswer, imageUrl: question.assetUrls?.imageUrl || '', originalIndex: 0 },
                ...question.distractors.map((word: string, index: number) => ({
                    id: `distractor-${index}`,
                    word,
                    imageUrl: question.assetUrls?.options?.[index + 1]?.imageUrl || '',
                    originalIndex: index + 1
                }))
            ];

            // Shuffle options for random display
            const shuffled = [...options].sort(() => Math.random() - 0.5);
            setDraggedOptions(shuffled);
            setCurrentWord(question.correctAnswer);
        }

        // Reset state when question changes
        setSelectedOption(null);
        setShowFeedback(null);
        setQuestionStartTime(Date.now());
        setHasPlayedAudio(false);
        setWrongAttempts(0);
        setShowTextPrompt(false);
        stop();
    }, [question?.id, stop, question?.correctAnswer, question?.distractors, question?.assetUrls]);

    // Auto-play word audio when question loads (no text shown initially)
    useEffect(() => {
        if (!isRulesModalOpen && question?.correctAnswer && !hasPlayedAudio) {
            // Delay audio playback slightly for better UX
            const timer = setTimeout(() => {
                speak(question.correctAnswer);
                setHasPlayedAudio(true);

                // Show text prompt after audio plays
                setTimeout(() => {
                    setShowTextPrompt(true);
                }, 2000);
            }, 1000);

            return () => clearTimeout(timer);
        }
    }, [question?.id, isRulesModalOpen, question?.correctAnswer, speak, hasPlayedAudio]);

    const playAudio = (text?: string) => {
        if (text) {
            speak(text);
        }
    };

    const handleTapOption = (optionId: string, word: string) => {
        if (showFeedback || gameMode !== 'tap') return;

        setSelectedOption(optionId);
        const isCorrect = word === question?.correctAnswer;
        const timeSeconds = (Date.now() - questionStartTime) / 1000;

        processAnswer(isCorrect, word, timeSeconds);
    };

    const handleDragEnd = () => {
        if (showFeedback || gameMode !== 'drag') return;

        // Check if the first item is the correct answer
        const isCorrect = draggedOptions.length > 0 && draggedOptions[0].word === question?.correctAnswer;
        const timeSeconds = (Date.now() - questionStartTime) / 1000;

        processAnswer(isCorrect, draggedOptions[0]?.word || '', timeSeconds);
    };

    const processAnswer = (isCorrect: boolean, word: string, timeSeconds: number) => {
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

    const resetOptions = () => {
        if (gameMode === 'drag' && question?.distractors) {
            const options: WordOption[] = [
                { id: 'correct', word: question.correctAnswer, imageUrl: question.assetUrls?.imageUrl || '', originalIndex: 0 },
                ...question.distractors.map((word: string, index: number) => ({
                    id: `distractor-${index}`,
                    word,
                    imageUrl: question.assetUrls?.options?.[index + 1]?.imageUrl || '',
                    originalIndex: index + 1
                }))
            ];
            const shuffled = [...options].sort(() => Math.random() - 0.5);
            setDraggedOptions(shuffled);
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
    if (!question || !question.distractors || question.distractors.length === 0) {
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
            <div className="flex-1 flex flex-col p-4 overflow-hidden relative">
                {/* Audio prompt area with timer and exit */}
                <motion.div
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="flex-shrink-0 mb-2"
                >
                    <div className="bg-white/90 backdrop-blur-sm rounded-xl px-2 py-1 shadow-lg flex items-center justify-between max-w-xl mx-auto">
                        <div className="flex-1 text-center">
                            {!hasPlayedAudio ? (
                                <h2 className="text-2xl font-bold text-purple-800 mb-1">
                                    Listen carefully...
                                </h2>
                            ) : showTextPrompt ? (
                                <>
                                    <h2 className="text-3xl font-bold text-purple-800 mb-1">
                                        {gameMode === 'tap' ? 'Tap word you heard' : 'Drag word you heard to top'}
                                    </h2>
                                    <p className="text-lg text-gray-600">
                                        {gameMode === 'tap' ? 'Select correct word' : 'Arrange words with correct one first'}
                                    </p>
                                </>
                            ) : (
                                <h2 className="text-2xl font-bold text-purple-800 mb-1">
                                    Playing audio...
                                </h2>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Timer */}
                            <div className="flex items-center gap-2 bg-blue-100 px-4 py-2 rounded-xl">
                                <Clock className="w-5 h-5 text-blue-600" />
                                <span className="font-bold text-blue-800">
                                    {Math.floor((Date.now() - startTime) / 60000)}:{String(Math.floor(((Date.now() - startTime) % 60000) / 1000)).padStart(2, '0')}
                                </span>
                            </div>

                            {gameMode === 'drag' && (
                                <motion.button
                                    onClick={resetOptions}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="bg-blue-500 text-white rounded-full p-2 shadow-md hover:bg-blue-600 transition-colors"
                                    title="Shuffle options"
                                >
                                    <RotateCcw className="w-5 h-5" />
                                </motion.button>
                            )}
                            <motion.button
                                onClick={() => playAudio(question?.correctAnswer)}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                className="bg-purple-500 text-white rounded-full p-2 shadow-md hover:bg-purple-600 transition-colors"
                                disabled={!hasPlayedAudio}
                            >
                                <Volume2 className="w-5 h-5" />
                            </motion.button>

                            {wrongAttempts > 0 && (
                                <div className="text-sm font-semibold text-red-600">
                                    Attempts: {wrongAttempts}/3
                                </div>
                            )}
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

                {/* Game options area */}
                <div className="flex-1 flex items-center justify-center p-1">
                    {gameMode === 'tap' ? (
                        // Tap mode - grid layout
                        <div className="grid grid-cols-2 gap-3 w-full max-w-4xl h-full max-h-[80vh] min-h-[400px] p-2">
                            {draggedOptions.map((option, index) => {
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
                                            onClick={() => handleTapOption(option.id, option.word)}
                                            disabled={!!showFeedback || !hasPlayedAudio}
                                            className={`
                                                relative w-full h-full p-3 rounded-xl
                                                transition-all duration-300 transform flex items-center justify-center
                                                min-h-0 min-w-0 overflow-hidden
                                                ${cardStyle}
                                            `}
                                        >
                                            {/* Picture with better overflow handling */}
                                            <div className="w-full h-full flex items-center justify-center overflow-hidden rounded-lg bg-white/20 p-1 min-h-0">
                                                {option.imageUrl ? (
                                                    <img
                                                        src={option.imageUrl}
                                                        alt={option.word}
                                                        className="w-full h-full object-contain"
                                                        style={{ maxHeight: '85%', maxWidth: '85%' }}
                                                    />
                                                ) : (
                                                    <span className="text-4xl font-bold text-purple-800">
                                                        {option.word}
                                                    </span>
                                                )}
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
                    ) : (
                        // Drag mode - reorderable list
                        <div className="w-full max-w-4xl h-full max-h-[80vh] min-h-[400px] p-2">
                            <Reorder.Group
                                axis="y"
                                values={draggedOptions}
                                onReorder={setDraggedOptions}
                                className="space-y-3 h-full"
                            >
                                <AnimatePresence>
                                    {draggedOptions.map((option, index) => {
                                        const isCorrect = option.word === question?.correctAnswer;
                                        const isFirst = index === 0;
                                        const showAsCorrect = isFirst && showFeedback === 'correct';
                                        const showAsWrong = isFirst && showFeedback === 'incorrect';

                                        // Determine base styles
                                        let cardStyle = isFirst
                                            ? "bg-gradient-to-br from-yellow-100 to-yellow-200 shadow-xl border-4 border-yellow-400"
                                            : "bg-gradient-to-br from-white to-purple-50 shadow-xl border-4 border-purple-300";

                                        if (showAsCorrect) {
                                            cardStyle = "bg-gradient-to-br from-green-400 to-green-600 scale-105 border-green-500";
                                        } else if (showAsWrong) {
                                            cardStyle = "bg-gradient-to-br from-red-400 to-red-600 border-red-500";
                                        } else if (showFeedback && !isFirst) {
                                            cardStyle = "bg-gradient-to-br from-white to-purple-50 shadow opacity-50 border-purple-100 grayscale";
                                        }

                                        return (
                                            <ShakeAnimation
                                                key={`shake-${option.id}`}
                                                trigger={showAsWrong}
                                                intensity="medium"
                                                className="w-full"
                                            >
                                                <Reorder.Item
                                                    key={option.id}
                                                    value={option}
                                                    initial={{ opacity: 0, y: 50 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -50 }}
                                                    transition={{ delay: index * 0.1 }}
                                                    whileDrag={{ scale: 1.05, rotate: 2 }}
                                                    className={`
                                                        relative w-full p-6 rounded-xl
                                                        transition-all duration-300 transform flex items-center justify-center
                                                        min-h-20 cursor-move
                                                        ${cardStyle}
                                                    `}
                                                    onDragEnd={handleDragEnd}
                                                >
                                                    <div className="flex items-center justify-between w-full">
                                                        {isFirst && (
                                                            <div className="bg-yellow-500 text-white rounded-full p-2">
                                                                <span className="text-sm font-bold">TOP</span>
                                                            </div>
                                                        )}
                                                        <div className="flex-1 flex items-center justify-center overflow-hidden rounded-lg bg-white/20 p-1 min-h-0">
                                                            {option.imageUrl ? (
                                                                <img
                                                                    src={option.imageUrl}
                                                                    alt={option.word}
                                                                    className="w-full h-full object-contain"
                                                                    style={{ maxHeight: '85%', maxWidth: '85%' }}
                                                                />
                                                            ) : (
                                                                <span className="text-3xl font-bold text-purple-800">
                                                                    {option.word}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-gray-400">
                                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                                            </svg>
                                                        </div>
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
                                                </Reorder.Item>
                                            </ShakeAnimation>
                                        );
                                    })}
                                </AnimatePresence>
                            </Reorder.Group>

                            <div className="mt-4 text-center">
                                <p className="text-sm text-gray-600">
                                    Drag the word you heard to the top position
                                </p>
                                {wrongAttempts > 0 && (
                                    <p className="text-sm font-semibold text-red-600 mt-2">
                                        Attempts: {wrongAttempts}/3
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Volume2, CheckCircle, XCircle, Clock, RotateCcw } from 'lucide-react';
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

// Enhanced draggable letter component with physics
interface DraggableLetterProps {
    letter: string;
    index: number;
    isFirstLetter: boolean;
    onDragEnd: (fromIndex: number, toIndex: number) => void;
    totalLetters: number;
}

const DraggableLetter = ({ letter, index, isFirstLetter, onDragEnd, totalLetters }: DraggableLetterProps) => {
    const [isDragging, setIsDragging] = useState(false);

    return (
        <motion.div
            layout
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragStart={() => {
                setIsDragging(true);
                document.body.style.cursor = 'grabbing';
            }}
            onDragEnd={(event, info) => {
                setIsDragging(false);
                document.body.style.cursor = 'default';

                // Calculate which position this should snap to based on drag distance
                const dragDistance = info.offset.x;
                const cardWidth = 108; // w-24 (96px) + gap (12px)
                const positionChange = Math.round(dragDistance / cardWidth);
                const newIndex = Math.max(0, Math.min(totalLetters - 1, index + positionChange));

                if (newIndex !== index && Math.abs(positionChange) > 0) {
                    onDragEnd(index, newIndex);
                }
            }}
            animate={{
                scale: isDragging ? 1.1 : 1,
                zIndex: isDragging ? 50 : 1,
            }}
            transition={{
                layout: {
                    type: "spring",
                    stiffness: 300,
                    damping: 30
                }
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 1.02 }}
            className={`
                w-24 h-28 rounded-xl shadow-xl flex items-center justify-center
                cursor-grab active:cursor-grabbing
                transition-shadow duration-200
                ${isFirstLetter
                    ? 'bg-gradient-to-br from-green-400 to-green-600 border-4 border-green-700'
                    : 'bg-gradient-to-br from-white to-purple-50 border-4 border-purple-300 hover:from-purple-50 hover:to-purple-100'
                }
                ${isDragging ? 'shadow-2xl' : ''}
            `}
        >
            <span className={`text-5xl font-bold select-none ${isFirstLetter ? 'text-white' : 'text-purple-800'}`}>
                {letter}
            </span>
        </motion.div>
    );
};

export default function SpellingGame({
    question,
    onAnswer,
    difficultyLevel,
    showHint: shouldShowHint,
    isRulesModalOpen,
}: BaseGameProps) {
    // Extract data from question
    const assetData = (question.assetUrls as any) || {};
    const correctWord = assetData.correctWord || question.correctAnswer;
    const jumbledLettersData = assetData.jumbledLetters || [];
    const firstLetterHint = assetData.firstLetterHint || correctWord[0];
    const useTTS = assetData.useTTS || false;
    const mode = assetData.mode || 'drag';

    const [letters, setLetters] = useState<string[]>([]);
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

    // Initialize letters when question changes ONLY
    useEffect(() => {
        setShowFeedback(null);
        setQuestionStartTime(Date.now());
        setCurrentWord(correctWord);
        setWrongAttempts(0);
        stop();

        // Initialize letters based on tier - but DON'T re-run when tier changes during gameplay
        if (currentTier === 1) {
            // Tier 1: All letters jumbled, no hints
            setLetters([...jumbledLettersData]);
        } else {
            // Tier 2 & 3: First letter in correct position, rest jumbled
            const restLetters = [...jumbledLettersData].filter(l => l !== firstLetterHint);
            setLetters([firstLetterHint, ...restLetters]);
        }
    }, [question?.id, correctWord, jumbledLettersData, firstLetterHint, stop]); // Removed currentTier from dependencies

    // Auto-play word audio for Tier 3
    useEffect(() => {
        if (!isRulesModalOpen && useTTS && currentTier === 3 && correctWord) {
            speak(correctWord);
        }
    }, [question?.id, isRulesModalOpen, currentTier, correctWord, speak, useTTS]);

    const playAudio = () => {
        if (useTTS && correctWord) {
            speak(correctWord);
        }
    };

    const handleCheckSpelling = () => {
        if (showFeedback) return;

        const userSpelling = letters.join('');
        const isCorrect = userSpelling.toLowerCase() === correctWord.toLowerCase();
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
                onAnswer(isCorrect, timeSeconds, false, userSpelling);
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
                    onAnswer(false, timeSeconds, false, userSpelling);
                }, 800);
            } else {
                // Clear feedback and allow retry
                setTimeout(() => {
                    setShowFeedback(null);
                }, 500);
            }
        }
    };

    const handleShuffle = () => {
        if (currentTier === 1) {
            // Tier 1: Shuffle all letters
            setLetters([...letters].sort(() => Math.random() - 0.5));
        } else {
            // Tier 2 & 3: Keep first letter, shuffle rest
            const first = letters[0];
            const rest = letters.slice(1).sort(() => Math.random() - 0.5);
            setLetters([first, ...rest]);
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
    if (!question || !letters || letters.length === 0) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100 p-6">
                <div className="text-center">
                    <p className="text-2xl text-red-600">Error: Invalid question data</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full h-full flex bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 rounded-3xl overflow-hidden">
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
                {/* Prompt at top */}
                <motion.div
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="flex-shrink-0 mb-6"
                >
                    <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-8 py-6 shadow-xl">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-2xl font-bold text-purple-800">
                                {question.promptText}
                            </h2>
                            <div className="flex items-center gap-3">
                                {/* Timer */}
                                <div className="flex items-center gap-2 bg-blue-100 px-4 py-2 rounded-xl">
                                    <Clock className="w-5 h-5 text-blue-600" />
                                    <span className="font-bold text-blue-800">
                                        {Math.floor((Date.now() - startTime) / 60000)}:{String(Math.floor(((Date.now() - startTime) % 60000) / 1000)).padStart(2, '0')}
                                    </span>
                                </div>

                                {/* Audio button - always visible */}
                                {useTTS && (
                                    <motion.button
                                        onClick={playAudio}
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="bg-purple-500 text-white rounded-full p-3 shadow-lg hover:bg-purple-600 transition-colors"
                                    >
                                        <Volume2 className="w-6 h-6" />
                                    </motion.button>
                                )}

                                {/* Shuffle button */}
                                <motion.button
                                    onClick={handleShuffle}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="bg-orange-500 text-white rounded-full p-3 shadow-lg hover:bg-orange-600 transition-colors"
                                >
                                    <RotateCcw className="w-6 h-6" />
                                </motion.button>
                            </div>
                        </div>

                        {wrongAttempts > 0 && (
                            <div className="text-center mt-2">
                                <span className="text-sm font-semibold text-red-600">
                                    Attempts: {wrongAttempts}/3
                                </span>
                            </div>
                        )}

                        {/* Tier hint indicator */}
                        {currentTier >= 2 && (
                            <div className="text-center mt-2">
                                <span className="text-sm font-semibold text-blue-600">
                                    💡 Hint: First letter is shown in green
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

                {/* Letter tiles with enhanced drag */}
                <div className="flex-1 flex flex-col items-center justify-center gap-8">
                    <ShakeAnimation
                        trigger={showFeedback === 'incorrect'}
                        intensity="medium"
                        className="w-full max-w-2xl"
                    >
                        <div className="flex justify-center gap-3 flex-wrap">
                            {letters.map((letter, index) => {
                                // Highlight the letter that matches the first letter of the word (for Tier 2/3)
                                const isFirstLetter = currentTier >= 2 && letter.toLowerCase() === firstLetterHint.toLowerCase();

                                return (
                                    <DraggableLetter
                                        key={`${letter}-${index}`}
                                        letter={letter}
                                        index={index}
                                        isFirstLetter={isFirstLetter}
                                        onDragEnd={(fromIndex, toIndex) => {
                                            if (fromIndex !== toIndex) {
                                                const newLetters = [...letters];
                                                const [removed] = newLetters.splice(fromIndex, 1);
                                                newLetters.splice(toIndex, 0, removed);
                                                setLetters(newLetters);
                                            }
                                        }}
                                        totalLetters={letters.length}
                                    />
                                );
                            })}
                        </div>
                    </ShakeAnimation>

                    {/* Current spelling preview */}
                    <div className="bg-white/80 rounded-xl px-8 py-4 shadow-lg">
                        <p className="text-sm text-gray-600 mb-1">Your spelling:</p>
                        <p className="text-4xl font-bold text-purple-800 tracking-wider">
                            {letters.join('')}
                        </p>
                    </div>

                    {/* Check button */}
                    <motion.button
                        onClick={handleCheckSpelling}
                        disabled={!!showFeedback}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`
                            px-12 py-4 rounded-2xl font-bold text-2xl shadow-xl transition-all
                            ${showFeedback
                                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600'
                            }
                        `}
                    >
                        Check Spelling
                    </motion.button>
                </div>
            </div>
        </div>
    );
}

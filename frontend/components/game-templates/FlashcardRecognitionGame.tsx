'use client';

import { useState, useEffect } from 'react';
import { BaseGameProps } from '@/lib/types/game.types';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useSpeech } from '@/hooks/useSpeech';
import { playCorrectSound, playIncorrectSound } from '@/lib/audioFeedback';
import { CardContainer, CardBody, CardItem } from '@/components/ui/3d-card';

interface WordAttempt {
    word: string;
    attempts: number;
    correctAttempts: number;
    totalTime: number;
    status: 'correct' | 'incorrect' | 'pending';
}

export default function FlashcardRecognitionGame({
    question,
    onAnswer,
    difficultyLevel,
    showHint,
    isRulesModalOpen,
}: BaseGameProps) {
    const [wrongAttempts, setWrongAttempts] = useState(0);
    const [startTime] = useState(Date.now());
    const [questionStartTime, setQuestionStartTime] = useState(Date.now());
    const [availableOptions, setAvailableOptions] = useState<string[]>([]);
    const [wordHistory, setWordHistory] = useState<WordAttempt[]>([]);
    const [showFeedback, setShowFeedback] = useState<'correct' | 'incorrect' | null>(null);
    const [currentWord, setCurrentWord] = useState<string>('');

    const { speak, stop } = useSpeech();

    // Shuffle array function
    const shuffleArray = (array: any[]) => {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    };

    // Extract and shuffle options from question - ensures all options are shuffled
    useEffect(() => {
        if (question?.assetUrls && typeof question.assetUrls === 'object') {
            const assetData = question.assetUrls as any;
            const wordIndex = assetData.wordIndex || 0;
            const allWords = assetData.cumulativeWords || [];

            const numOptions = Math.min((wordIndex + 1) * 2, 80);
            const options = allWords.slice(0, numOptions);
            // Always shuffle all options to ensure random order every time
            const shuffledOptions = shuffleArray(options);

            setAvailableOptions(shuffledOptions);
            setCurrentWord(question.correctAnswer);
        } else if (question?.distractors) {
            // Handle case where options come from distractors
            const options = [question.correctAnswer, ...question.distractors];
            const shuffledOptions = shuffleArray(options);
            setAvailableOptions(shuffledOptions);
            setCurrentWord(question.correctAnswer);
        }

        stop();
        setWrongAttempts(0);
        setQuestionStartTime(Date.now());
    }, [question?.id, stop, question?.correctAnswer, question?.distractors]);

    // Auto-play question audio
    useEffect(() => {
        if (!isRulesModalOpen && question?.promptText) {
            speak(question.promptText);
        }
    }, [question?.id, isRulesModalOpen, question?.promptText, speak]);

    const handleCardClick = (word: string) => {
        const responseTime = (Date.now() - questionStartTime) / 1000;
        const correct = word === question.correctAnswer;

        if (correct) {
            playCorrectSound();
            setShowFeedback('correct');

            // Update word history
            const existingWord = wordHistory.find(w => w.word === currentWord);
            if (existingWord) {
                existingWord.correctAttempts++;
                existingWord.attempts++;
                existingWord.totalTime += responseTime;
                existingWord.status = 'correct';
                setWordHistory([...wordHistory]);
            } else {
                setWordHistory([...wordHistory, {
                    word: currentWord,
                    attempts: 1,
                    correctAttempts: 1,
                    totalTime: responseTime,
                    status: 'correct'
                }]);
            }

            // Move to next question after brief delay
            setTimeout(() => {
                setShowFeedback(null);
                onAnswer(true, responseTime, false, word);
            }, 800);
        } else {
            playIncorrectSound();
            setShowFeedback('incorrect');
            setWrongAttempts(prev => prev + 1);

            // Update word history
            const existingWord = wordHistory.find(w => w.word === currentWord);
            if (existingWord) {
                existingWord.attempts++;
                existingWord.totalTime += responseTime;
                existingWord.status = 'incorrect';
                setWordHistory([...wordHistory]);
            } else {
                setWordHistory([...wordHistory, {
                    word: currentWord,
                    attempts: 1,
                    correctAttempts: 0,
                    totalTime: responseTime,
                    status: 'incorrect'
                }]);
            }

            // After 3 wrong attempts, move to next question
            if (wrongAttempts + 1 >= 3) {
                setTimeout(() => {
                    setShowFeedback(null);
                    onAnswer(false, responseTime, false, word);
                }, 800);
            } else {
                // Clear feedback after short delay
                setTimeout(() => {
                    setShowFeedback(null);
                }, 500);
            }
        }
    };

    // Calculate grid layout - tighter spacing
    const getGridCols = (count: number) => {
        if (count <= 2) return 'grid-cols-2';
        if (count <= 6) return 'grid-cols-3';
        if (count <= 12) return 'grid-cols-4';
        if (count <= 20) return 'grid-cols-5';
        if (count <= 30) return 'grid-cols-6';
        if (count <= 50) return 'grid-cols-7';
        return 'grid-cols-8';
    };

    const getCardSize = (count: number) => {
        if (count <= 2) return 'w-48 h-64';
        if (count <= 6) return 'w-44 h-56';
        if (count <= 12) return 'w-40 h-52';
        if (count <= 20) return 'w-36 h-48';
        if (count <= 30) return 'w-32 h-44';
        if (count <= 40) return 'w-28 h-40';
        if (count <= 50) return 'w-24 h-36';
        // For more than 50 options, use minimum child-friendly size (similar to 8-option layout)
        return 'w-32 h-44 min-w-32 min-h-44';
    };

    const cardSize = getCardSize(availableOptions.length);
    const gridCols = getGridCols(availableOptions.length);

    // Calculate statistics
    const totalWords = wordHistory.length;
    const correctWords = wordHistory.filter(w => w.status === 'correct').length;
    const accuracy = totalWords > 0 ? Math.round((correctWords / totalWords) * 100) : 0;
    const avgResponseTime = totalWords > 0
        ? (wordHistory.reduce((sum, w) => sum + w.totalTime, 0) / totalWords).toFixed(1)
        : '0.0';

    return (
        <div className="relative w-full h-full flex bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 rounded-3xl overflow-hidden">
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
                                            {wordAttempt.status === 'correct' ? (
                                                <CheckCircle className="w-5 h-5 text-green-600" />
                                            ) : (
                                                <XCircle className="w-5 h-5 text-red-600" />
                                            )}
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
            <div className="flex-1 flex flex-col p-6 overflow-hidden">
                {/* Question prompt */}
                <motion.div
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="flex-shrink-0 mb-6"
                >
                    <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-8 py-4 shadow-xl flex items-center justify-between">
                        <h2 className="text-3xl font-bold text-purple-800">
                            {question?.promptText}
                        </h2>
                        <div className="flex items-center gap-4">
                            {/* Timer */}
                            <div className="flex items-center gap-2 bg-blue-100 px-4 py-2 rounded-xl">
                                <Clock className="w-5 h-5 text-blue-600" />
                                <span className="font-bold text-blue-800">
                                    {Math.floor((Date.now() - startTime) / 60000)}:{String(Math.floor(((Date.now() - startTime) % 60000) / 1000)).padStart(2, '0')}
                                </span>
                            </div>

                            {/* Exit Button */}
                            <motion.button
                                onClick={() => window.location.href = '/child/domains'}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="bg-red-500 text-white px-4 py-2 rounded-xl font-semibold shadow-lg hover:bg-red-600 transition-colors flex items-center gap-2"
                            >
                                <XCircle className="w-5 h-5" />
                                Exit
                            </motion.button>

                            {wrongAttempts > 0 && (
                                <div className="text-sm font-semibold text-red-600">
                                    Attempts: {wrongAttempts}/3
                                </div>
                            )}
                            <motion.button
                                onClick={() => speak(question?.promptText || '')}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                className="bg-purple-500 text-white rounded-full p-3 shadow-lg hover:bg-purple-600 transition-colors"
                            >
                                <Volume2 className="w-6 h-6" />
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
                                px-8 py-4 rounded-2xl shadow-2xl font-bold text-2xl
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

                {/* Flashcard grid with better scrolling for many options */}
                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-purple-300 scrollbar-track-transparent">
                    <div className={`grid ${gridCols} gap-2 p-2 ${availableOptions.length > 50 ? 'grid-flow-dense' : ''}`}>
                        <AnimatePresence mode="sync">
                            {availableOptions.map((word, index) => (
                                <motion.div
                                    key={`${word}-${index}`}
                                    initial={{ scale: 0, opacity: 0, rotateY: -180 }}
                                    animate={{ scale: 1, opacity: 1, rotateY: 0 }}
                                    transition={{
                                        delay: index * 0.02,
                                        type: 'spring',
                                        stiffness: 200
                                    }}
                                    className="flex justify-center"
                                >
                                    <CardContainer
                                        containerClassName="p-0"
                                        className={cardSize}
                                    >
                                        <CardBody
                                            className={`
                                                ${cardSize}
                                                relative group/card
                                                bg-gradient-to-br from-white to-purple-50
                                                border-2 border-purple-200
                                                rounded-xl
                                                shadow-xl
                                                cursor-pointer
                                                transition-all duration-300
                                                hover:shadow-2xl hover:border-purple-400
                                            `}
                                        >
                                            <button
                                                onClick={() => handleCardClick(word)}
                                                className="w-full h-full flex items-center justify-center p-4"
                                            >
                                                <CardItem
                                                    translateZ="50"
                                                    className="text-center"
                                                >
                                                    <div className={`
                                                        font-bold text-purple-800 break-words px-1
                                                        ${availableOptions.length <= 4 ? 'text-4xl' :
                                                            availableOptions.length <= 12 ? 'text-3xl' :
                                                                availableOptions.length <= 30 ? 'text-2xl' :
                                                                    availableOptions.length <= 50 ? 'text-xl' :
                                                                        availableOptions.length <= 80 ? 'text-lg' :
                                                                            'text-base'
                                                        }
                                                    `}>
                                                        {word}
                                                    </div>
                                                </CardItem>
                                            </button>
                                        </CardBody>
                                    </CardContainer>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { BaseGameProps } from '@/lib/types/game.types';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, Lightbulb, CheckCircle, XCircle, Star, Clock, ArrowRight } from 'lucide-react';
import CelebrationEffect from '@/components/ui/CelebrationEffect';
import FloatingShapes from '@/components/ui/FloatingShapes';
import SuccessAnimation from '@/components/ui/SuccessAnimation';
import ShakeAnimation from '@/components/ui/ShakeAnimation';
import { useSpeech } from '@/hooks/useSpeech';
import { playCorrectSound, playIncorrectSound } from '@/lib/audioFeedback';

export default function TapToSelectGame({
    question,
    onAnswer,
    difficultyLevel,
    showHint,
    isRulesModalOpen,
}: BaseGameProps) {
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [startTime] = useState(Date.now());
    const [hintUsed, setHintUsed] = useState(false);
    const [showFeedback, setShowFeedback] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [attemptCount, setAttemptCount] = useState(0);
    const [showAutoHint, setShowAutoHint] = useState(false);
    const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);
    const [highlightCorrect, setHighlightCorrect] = useState(false);

    // Initialize TTS
    const { speak, stop } = useSpeech();

    // Reset state when question changes
    useEffect(() => {
        setSelectedAnswer(null);
        setShowFeedback(false);
        setIsCorrect(false);
        setHintUsed(false);
        setAttemptCount(0);
        setShowAutoHint(false);
        setShowCorrectAnswer(false);
        setHighlightCorrect(false);

        // Stop any ongoing speech when question changes
        stop();
    }, [question?.id, stop]);

    // Combine correct answer with distractors and shuffle
    const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);

    useEffect(() => {
        if (question?.correctAnswer && question?.distractors) {
            const options = [question.correctAnswer, ...question.distractors];
            setShuffledOptions(options.sort(() => Math.random() - 0.5));
        }
    }, [question?.id, question?.correctAnswer, question?.distractors]);

    // Safety check
    if (!question || !question.correctAnswer || !question.distractors) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 p-6">
                <div className="text-center">
                    <p className="text-2xl text-red-600">Error: Invalid question data</p>
                </div>
            </div>
        );
    }

    const playAudio = () => {
        // Use TTS to read the question text
        speak(question.promptText);
    };

    const handleHint = () => {
        setHintUsed(true);
        setShowAutoHint(true);
        setHighlightCorrect(true);

        // Remove highlight after 3 seconds
        setTimeout(() => {
            setHighlightCorrect(false);
        }, 3000);
    };

    const handleSelect = (answer: string) => {
        if (showCorrectAnswer) return; // Don't allow selection after showing correct answer

        setSelectedAnswer(answer);
        const responseTime = (Date.now() - startTime) / 1000;
        const correct = answer === question.correctAnswer;

        setIsCorrect(correct);
        setShowFeedback(true);
        setAttemptCount(prev => prev + 1);
        setHighlightCorrect(false); // Remove highlight when answer is selected

        // Play feedback sound using Web Audio API
        if (correct) {
            playCorrectSound();
        } else {
            playIncorrectSound();
        }

        if (correct) {
            // Correct answer - proceed to next question immediately to sync animations
            onAnswer(correct, responseTime, hintUsed);
            // Keep feedback visible for 2 seconds to sync with parent's AnswerFeedback card
            setTimeout(() => {
                setShowFeedback(false);
            }, 2000);
        } else {
            // Wrong answer
            if (attemptCount === 0) {
                // First wrong attempt - show hint
                setTimeout(() => {
                    setShowFeedback(false);
                    setSelectedAnswer(null);
                    setShowAutoHint(true);
                    setHintUsed(true);
                    setHighlightCorrect(true);

                    // Keep highlight for 3 seconds
                    setTimeout(() => {
                        setHighlightCorrect(false);
                    }, 3000);
                }, 1500);
            } else if (attemptCount === 1) {
                // Second wrong attempt - show correct answer
                setTimeout(() => {
                    setShowCorrectAnswer(true);
                    setShowFeedback(false);
                }, 1500);
            }
        }
    };

    const handleContinue = () => {
        // Log as incorrect and move to next question
        const responseTime = (Date.now() - startTime) / 1000;
        onAnswer(false, responseTime, true);
        setShowCorrectAnswer(false);
    };

    // Auto-play audio on mount and when question changes, but only if modal is closed
    useEffect(() => {
        if (!isRulesModalOpen) {
            playAudio();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [question?.id, isRulesModalOpen]);

    return (
        <div className="relative flex flex-col items-center justify-start bg-white p-6 rounded-3xl shadow-2xl max-w-[1200px] max-h-[calc(100vh-120px)] w-full mx-auto overflow-auto min-h-[600px]">
            <FloatingShapes density="low" theme="default" />
            <SuccessAnimation show={showFeedback && isCorrect} intensity="high" />

            {/* Question Section - Centered at Top */}
            <div className="w-full mb-4">
                <motion.div
                    key={`prompt-${question?.id}`}
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-center relative z-10"
                >
                    <h2 className="text-4xl md:text-5xl font-bold text-purple-800 mb-4 leading-tight">
                        {question?.promptText}
                    </h2>

                    {/* Audio Button */}
                    <motion.button
                        onClick={playAudio}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        whileTap={{ scale: 0.95 }}
                        className="bg-white hover:bg-purple-50 text-purple-600 rounded-full p-4 shadow-xl transition-all"
                    >
                        <Volume2 className="w-8 h-8" />
                    </motion.button>
                </motion.div>
            </div>


            {/* Feedback Overlay - Fixed positioning to not overlap options */}
            <div className="w-full max-w-5xl mx-auto mb-4">
                {/* Auto Hint Message */}
                <AnimatePresence>
                    {showAutoHint && !showCorrectAnswer && (
                        <motion.div
                            initial={{ scale: 0, opacity: 0, y: -20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0, opacity: 0, y: -20 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            className="mb-4 bg-yellow-100 border-4 border-yellow-400 rounded-2xl p-4 shadow-xl"
                        >
                            <div className="flex items-center gap-3 text-yellow-800 justify-center">
                                <Lightbulb className="w-6 h-6 fill-current animate-pulse" />
                                <p className="text-lg font-bold">
                                    Try again! Look for the highlighted answer! 💡
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Correct Answer Reveal - Professional and Compact */}
                <AnimatePresence>
                    {showCorrectAnswer && (
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            transition={{ type: "spring", stiffness: 200, damping: 20 }}
                            className="mb-6 bg-white border-2 border-indigo-200 rounded-3xl p-6 shadow-2xl overflow-hidden relative"
                        >
                            {/* Decorative background element */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 opacity-50" />

                            {/* Header */}
                            <div className="text-center mb-4 relative z-10">
                                <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full mb-2">
                                    <Lightbulb className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">
                                    Learning Moment!
                                </h3>
                                <p className="text-gray-500 text-sm">
                                    Here is the correct answer to learn from:
                                </p>
                            </div>

                            {/* Correct Answer Display */}
                            <motion.div
                                initial={{ scale: 0.95 }}
                                animate={{ scale: 1 }}
                                className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white text-3xl font-bold py-4 px-8 rounded-2xl mb-6 text-center shadow-lg"
                            >
                                {question.correctAnswer}
                            </motion.div>

                            {/* Stats Row - Compact */}
                            <div className="flex items-center justify-center gap-6 mb-6">
                                <div className="flex items-center gap-2">
                                    <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                                        <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                                    </div>
                                    <div className="text-left">
                                        <div className="text-lg font-bold text-gray-800">0</div>
                                        <div className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Stars</div>
                                    </div>
                                </div>
                                <div className="w-px h-8 bg-gray-200" />
                                <div className="flex items-center gap-2">
                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                        <Clock className="w-5 h-5 text-blue-500" />
                                    </div>
                                    <div className="text-left">
                                        <div className="text-lg font-bold text-gray-800">
                                            {((Date.now() - startTime) / 1000).toFixed(1)}s
                                        </div>
                                        <div className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Time</div>
                                    </div>
                                </div>
                            </div>

                            {/* Continue Button */}
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleContinue}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3.5 rounded-xl font-bold text-lg transition-all shadow-md flex items-center justify-center gap-3"
                            >
                                Continue to Next Question
                                <ArrowRight className="w-5 h-5" />
                            </motion.button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Options - Full Width Grid - Larger card sizing for better visibility */}
            {!showCorrectAnswer && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl w-full relative z-10 mx-auto">
                    {shuffledOptions.map((option, index) => {
                        const isSelected = selectedAnswer === option;
                        const isCorrectOption = option === question.correctAnswer;
                        const showAsCorrect = isSelected && isCorrect && showFeedback;
                        const showAsWrong = isSelected && !isCorrect && showFeedback;
                        const shouldHighlight = highlightCorrect && isCorrectOption;

                        return (
                            <ShakeAnimation
                                key={`shake-${question.id}-${option}-${index}`}
                                trigger={showAsWrong}
                                intensity="medium"
                            >
                                <motion.button
                                    key={`${question.id}-${option}-${index}`}
                                    data-answer={option}
                                    onClick={() => handleSelect(option)}
                                    disabled={showFeedback}
                                    initial={{ scale: 0, rotate: -10 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ delay: index * 0.1, type: 'spring' }}
                                    whileHover={!showFeedback ? { scale: 1.03, y: -3 } : {}}
                                    whileTap={!showFeedback ? { scale: 0.97 } : {}}
                                    className={`
                                        relative p-8 rounded-2xl text-4xl font-bold
                                        transition-all duration-300 shadow-xl
                                        min-h-[180px] w-full
                                        ${shouldHighlight
                                            ? 'bg-gradient-to-br from-yellow-300 to-yellow-400 text-yellow-900 ring-8 ring-yellow-500 ring-opacity-50 animate-pulse'
                                            : showAsCorrect
                                                ? 'bg-gradient-to-br from-green-400 to-emerald-500 text-white'
                                                : showAsWrong
                                                    ? 'bg-gradient-to-br from-red-400 to-pink-500 text-white'
                                                    : 'bg-white hover:bg-purple-50 text-purple-800'
                                        }
                                        ${showFeedback ? 'cursor-not-allowed' : 'cursor-pointer'}
                                        border-4 ${shouldHighlight
                                            ? 'border-yellow-500'
                                            : showAsCorrect
                                                ? 'border-green-600'
                                                : showAsWrong
                                                    ? 'border-red-600'
                                                    : 'border-purple-200'
                                        }
                                    `}
                                >
                                    {/* Feedback Icons */}
                                    <AnimatePresence>
                                        {showAsCorrect && (
                                            <motion.div
                                                initial={{ scale: 0, rotate: -180 }}
                                                animate={{ scale: 1, rotate: 0 }}
                                                exit={{ scale: 0 }}
                                                className="absolute -top-3 -right-3 bg-green-500 rounded-full p-2 shadow-xl"
                                            >
                                                <CheckCircle className="w-8 h-8 text-white fill-current" />
                                            </motion.div>
                                        )}
                                        {showAsWrong && (
                                            <motion.div
                                                initial={{ scale: 0, rotate: 180 }}
                                                animate={{ scale: 1, rotate: 0 }}
                                                exit={{ scale: 0 }}
                                                className="absolute -top-3 -right-3 bg-red-500 rounded-full p-2 shadow-xl"
                                            >
                                                <XCircle className="w-8 h-8 text-white fill-current" />
                                            </motion.div>
                                        )}
                                        {shouldHighlight && (
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                                                transition={{ duration: 0.5, repeat: Infinity }}
                                                className="absolute -top-3 -right-3"
                                            >
                                                <Lightbulb className="w-12 h-12 text-yellow-500 fill-current bg-white rounded-full p-2 shadow-lg" />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Option Text - Larger, centered */}
                                    <div className="flex items-center justify-center h-full">
                                        {option}
                                    </div>
                                </motion.button>
                            </ShakeAnimation>
                        );
                    })}
                </div>
            )}

            {/* Manual Hint Button (only if not auto-shown) */}
            {showHint && !hintUsed && !showFeedback && !showAutoHint && (
                <motion.button
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    onClick={handleHint}
                    className="mt-8 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 px-8 py-4 rounded-full font-bold text-xl shadow-lg transition-all hover:scale-105 flex items-center gap-2"
                >
                    <Lightbulb className="w-6 h-6" />
                    Need a Hint?
                </motion.button>
            )}

            {/* Feedback Messages */}
            <AnimatePresence>
                {showFeedback && (
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className={`mt-8 text-center text-3xl font-bold ${isCorrect ? 'text-green-600' : 'text-red-600'
                            }`}
                    >
                        {isCorrect ? (
                            <div className="flex items-center gap-3">
                                <span className="text-6xl">🎉</span>
                                <span>Excellent! That's correct!</span>
                            </div>
                        ) : attemptCount === 1 ? (
                            <div className="flex items-center gap-3">
                                <span className="text-6xl">💡</span>
                                <span>Try again! Look for the hint!</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <span className="text-6xl">🤔</span>
                                <span>Not quite! Let me show you...</span>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

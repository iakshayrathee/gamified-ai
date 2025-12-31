'use client';

import { useState, useEffect } from 'react';
import { BaseGameProps } from '@/lib/types/game.types';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, Lightbulb, CheckCircle, XCircle } from 'lucide-react';
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
        const options = [question.correctAnswer, ...question.distractors];
        setShuffledOptions(options.sort(() => Math.random() - 0.5));
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
            // Correct answer - proceed to next question
            setTimeout(() => {
                onAnswer(correct, responseTime, hintUsed);
                setShowFeedback(false);
            }, 1500);
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

    // Auto-play audio on mount and when question changes
    useEffect(() => {
        playAudio();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [question?.id]);

    return (
        <div className="relative flex flex-col items-center justify-start bg-white p-6 rounded-3xl shadow-2xl min-h-[600px] overflow-hidden">
            <FloatingShapes density="low" theme="default" />
            <SuccessAnimation show={showFeedback && isCorrect} intensity="high" />

            {/* Question Section - Centered at Top */}
            <div className="w-full mb-6">
                <motion.div
                    key={`prompt-${question?.id}`}
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-center relative z-10"
                >
                    <h2 className="text-5xl md:text-6xl font-bold text-purple-800 mb-6">
                        {question?.promptText}
                    </h2>

                    {/* Audio Button */}
                    <motion.button
                        onClick={playAudio}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        whileTap={{ scale: 0.95 }}
                        className="bg-white hover:bg-purple-50 text-purple-600 rounded-full p-5 shadow-xl transition-all"
                    >
                        <Volume2 className="w-10 h-10" />
                    </motion.button>
                </motion.div>
            </div>


            {/* Feedback Overlay - Absolute positioned to prevent layout shift */}
            <div className="absolute top-40 left-1/2 -translate-x-1/2 z-20 w-full max-w-5xl px-6">
                {/* Auto Hint Message */}
                <AnimatePresence>
                    {showAutoHint && !showCorrectAnswer && (
                        <motion.div
                            initial={{ scale: 0, opacity: 0, y: -20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0, opacity: 0, y: -20 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            className="mb-6 bg-yellow-100 border-4 border-yellow-400 rounded-2xl p-6 shadow-xl"
                        >
                            <div className="flex items-center gap-3 text-yellow-800 justify-center">
                                <Lightbulb className="w-8 h-8 fill-current animate-pulse" />
                                <p className="text-2xl font-bold">
                                    Try again! Look for the highlighted answer! 💡
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Correct Answer Reveal */}
                <AnimatePresence>
                    {showCorrectAnswer && (
                        <motion.div
                            initial={{ scale: 0, opacity: 0, y: -20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            className="mb-6 bg-blue-100 border-4 border-blue-400 rounded-2xl p-8 shadow-xl text-center"
                        >
                            <CheckCircle className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                            <p className="text-2xl font-bold text-blue-800 mb-4">
                                The correct answer is:
                            </p>
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                                className="bg-green-500 text-white text-4xl font-bold py-6 px-12 rounded-2xl mb-6 inline-block shadow-lg"
                            >
                                {question.correctAnswer}
                            </motion.div>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleContinue}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-full font-bold text-xl transition-all shadow-lg"
                            >
                                Continue to Next Question →
                            </motion.button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Options - Full Width Grid */}
            {!showCorrectAnswer && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl w-full relative z-10 mx-auto">
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
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{
                                        scale: shouldHighlight ? [1, 1.1, 1, 1.1, 1] : 1,
                                        opacity: 1
                                    }}
                                    transition={{
                                        scale: { duration: 0.5, repeat: shouldHighlight ? Infinity : 0 },
                                        delay: index * 0.1
                                    }}
                                    whileHover={{ scale: selectedAnswer ? 1 : 1.05 }}
                                    whileTap={{ scale: selectedAnswer ? 1 : 0.95 }}
                                    onClick={() => handleSelect(option)}
                                    disabled={!!selectedAnswer && !showAutoHint}
                                    className={`
                                        relative p-10 rounded-3xl text-4xl md:text-5xl font-bold shadow-2xl
                                        transition-all duration-300 transform w-full min-h-[180px]
                                        flex items-center justify-center border-4
                                        ${showAsCorrect
                                            ? 'bg-gradient-to-br from-green-400 to-green-600 text-white ring-8 ring-green-300 border-green-500'
                                            : showAsWrong
                                                ? 'bg-gradient-to-br from-red-400 to-red-600 text-white ring-8 ring-red-300 border-red-500'
                                                : shouldHighlight
                                                    ? 'bg-gradient-to-br from-yellow-200 to-yellow-300 text-purple-800 ring-8 ring-yellow-400 border-yellow-500'
                                                    : 'bg-gradient-to-br from-white to-purple-50 text-purple-800 hover:from-purple-50 hover:to-purple-100 border-purple-200 hover:border-purple-400'
                                        }
                                        ${selectedAnswer && !showAutoHint ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                                    `}
                                >
                                    {option}

                                    {/* Feedback Icons */}
                                    <AnimatePresence>
                                        {showAsCorrect && (
                                            <motion.div
                                                initial={{ scale: 0, rotate: -180 }}
                                                animate={{ scale: 1, rotate: 0 }}
                                                transition={{ type: "spring", stiffness: 200 }}
                                                className="absolute -top-4 -right-4"
                                            >
                                                <CheckCircle className="w-16 h-16 text-green-600 bg-white rounded-full shadow-lg" />
                                            </motion.div>
                                        )}
                                        {showAsWrong && (
                                            <motion.div
                                                initial={{ scale: 0, rotate: 180 }}
                                                animate={{ scale: 1, rotate: 0 }}
                                                transition={{ type: "spring", stiffness: 200 }}
                                                className="absolute -top-4 -right-4"
                                            >
                                                <XCircle className="w-16 h-16 text-red-600 bg-white rounded-full shadow-lg" />
                                            </motion.div>
                                        )}
                                        {shouldHighlight && (
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                                                transition={{ duration: 0.5, repeat: Infinity }}
                                                className="absolute -top-4 -right-4"
                                            >
                                                <Lightbulb className="w-16 h-16 text-yellow-500 fill-current bg-white rounded-full p-2 shadow-lg" />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
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

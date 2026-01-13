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
    questionIndex,
    totalQuestions,
}: BaseGameProps) {
    const [wrongAttempts, setWrongAttempts] = useState(0);
    const [startTime] = useState(Date.now());
    const [questionStartTime, setQuestionStartTime] = useState(Date.now());
    const [availableOptions, setAvailableOptions] = useState<string[]>([]);
    const [wordHistory, setWordHistory] = useState<WordAttempt[]>([]);
    const [showFeedback, setShowFeedback] = useState<'correct' | 'incorrect' | null>(null);
    const [currentWord, setCurrentWord] = useState<string>('');
    const [allListWords, setAllListWords] = useState<string[]>([]);
    const [askedWords, setAskedWords] = useState<Set<string>>(new Set()); // Track words that have been asked
    const [totalQuestionsInList, setTotalQuestionsInList] = useState<number>(0); // Total questions in the list
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0); // Current question index
    const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);

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

    // Generate dynamic options from remaining unasked words
    const generateDynamicOptions = (
        correctWord: string,
        allWords: string[],
        askedWordsSet: Set<string>,
        questionIndex: number,
        totalQuestions: number
    ): string[] => {
        // Get remaining unasked words (excluding current correct word)
        const remainingWords = allWords.filter(w =>
            w !== correctWord && !askedWordsSet.has(w)
        );

        // Calculate position from end
        const questionsRemaining = totalQuestions - questionIndex;

        // For last 3 questions, reduce option count
        let maxDistractors;
        if (questionsRemaining === 3) {
            maxDistractors = 2; // 3 options total (1 correct + 2 distractors)
        } else if (questionsRemaining === 2) {
            maxDistractors = 1; // 2 options total (1 correct + 1 distractor)
        } else if (questionsRemaining === 1) {
            maxDistractors = 0; // 1 option total (only correct answer)
        } else {
            maxDistractors = Math.min(3, remainingWords.length);
        }

        // Randomly select distractors from remaining words
        const shuffledRemaining = shuffleArray(remainingWords);
        const selectedDistractors = shuffledRemaining.slice(0, maxDistractors);

        // Combine correct answer with distractors and shuffle
        const options = shuffleArray([correctWord, ...selectedDistractors]);

        console.log('[FlashcardGame] Dynamic options generated:', {
            correctWord,
            questionIndex,
            questionsRemaining,
            maxDistractors,
            remainingWordsCount: remainingWords.length,
            optionsCount: options.length,
            options
        });

        return options;
    };

    // Initialize word pool and display dynamically generated options
    useEffect(() => {
        console.log('[FlashcardGame] Question changed:', {
            questionId: question?.id,
            hasAssetUrls: !!question?.assetUrls,
            assetUrlsType: typeof question?.assetUrls,
            correctAnswer: question?.correctAnswer,
            questionIndex,
            totalQuestions
        });

        if (question?.assetUrls && typeof question.assetUrls === 'object') {
            const assetData = question.assetUrls as any;
            console.log('[FlashcardGame] Asset data:', {
                displayMode: assetData.displayMode,
                hasListWords: !!assetData.listWords,
                listWordsLength: assetData.listWords?.length
            });

            // For new 4-card flashcard mode with dynamic option generation
            if (assetData.displayMode === 'flashcard-4' && assetData.listWords) {
                const listWords = assetData.listWords as string[];
                console.log('[FlashcardGame] Initializing 4-card mode with', listWords.length, 'words');

                // Store all list words and total count
                setAllListWords(listWords);
                setTotalQuestionsInList(listWords.length);

                // Update current question index if provided
                if (questionIndex !== undefined) {
                    setCurrentQuestionIndex(questionIndex);
                }

                // Generate dynamic options from remaining unasked words
                const dynamicOptions = generateDynamicOptions(
                    question.correctAnswer,
                    listWords,
                    askedWords,
                    questionIndex || 0,
                    totalQuestions || listWords.length
                );

                setAvailableOptions(dynamicOptions);
                setCurrentWord(question.correctAnswer);

                console.log('[FlashcardGame] Initialized with dynamic options:', {
                    options: dynamicOptions,
                    correctAnswer: question.correctAnswer,
                    askedWordsCount: askedWords.size,
                    questionIndex,
                    totalQuestions
                });
            } else {
                // Fallback for old progressive mode (backward compatibility)
                console.log('[FlashcardGame] Using fallback mode');
                const wordIndex = assetData.wordIndex || 0;
                const allWords = assetData.cumulativeWords || [];
                const numOptions = Math.min((wordIndex + 1) * 2, 80);
                const options = allWords.slice(0, numOptions);
                const shuffledOptions = shuffleArray(options);
                setAvailableOptions(shuffledOptions);
                setCurrentWord(question.correctAnswer);
            }
        } else {
            // CRITICAL: Prevent blank screen - set minimal fallback
            console.error('[FlashcardGame] No valid question data found! Using emergency fallback', question);
            setAvailableOptions([question?.correctAnswer || 'ERROR']);
            setCurrentWord(question?.correctAnswer || 'ERROR');
        }

        stop();
        setWrongAttempts(0);
        setQuestionStartTime(Date.now());

        // NOTE: We intentionally exclude 'askedWords', 'stop', and 'question.correctAnswer' from dependencies
        // to prevent unnecessary re-renders. The effect should only run when the question changes (question.id),
        // not when askedWords updates. This prevents the delay when moving between questions.
        // The current askedWords value is properly captured in the closure when the effect runs.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [question?.id, questionIndex, totalQuestions]);

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

            // Mark word as asked (correct answer)
            const newAskedWords = new Set(askedWords);
            newAskedWords.add(word);
            setAskedWords(newAskedWords);

            // Move to next question after brief delay
            setTimeout(() => {
                setShowFeedback(null);
                // Call onAnswer to load next question from backend
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

            // After 3 wrong attempts, show correct answer then move to next question
            if (wrongAttempts + 1 >= 3) {
                // Show correct answer
                setShowCorrectAnswer(true);
                setTimeout(() => {
                    setShowFeedback(null);
                    setShowCorrectAnswer(false);
                    onAnswer(false, responseTime, false, word);
                }, 2000); // Show for 2 seconds
            } else {
                // Clear feedback after short delay
                setTimeout(() => {
                    setShowFeedback(null);
                }, 500);
            }
        }
    };

    // Fixed 4-card layout for new flashcard mode
    const isNewFlashcardMode = question?.assetUrls &&
        typeof question.assetUrls === 'object' &&
        (question.assetUrls as any).displayMode === 'flashcard-4';

    // For 4-card mode: fixed 2x2 grid, landscape cards (4:3 ratio)
    // For legacy mode: keep dynamic sizing
    const gridCols = isNewFlashcardMode ? 'grid-cols-2' : getGridCols(availableOptions.length);
    const cardSize = isNewFlashcardMode ? 'w-[384px] h-[288px]' : getCardSize(availableOptions.length); // 4:3 ratio (landscape)

    // Calculate grid layout for legacy mode
    function getGridCols(count: number) {
        if (count <= 2) return 'grid-cols-2';
        if (count <= 6) return 'grid-cols-3';
        if (count <= 12) return 'grid-cols-4';
        if (count <= 20) return 'grid-cols-5';
        if (count <= 30) return 'grid-cols-6';
        if (count <= 50) return 'grid-cols-7';
        return 'grid-cols-8';
    }

    function getCardSize(count: number) {
        if (count <= 2) return 'w-48 h-64';
        if (count <= 6) return 'w-44 h-56';
        if (count <= 12) return 'w-40 h-52';
        if (count <= 20) return 'w-36 h-48';
        if (count <= 30) return 'w-32 h-44';
        if (count <= 40) return 'w-28 h-40';
        if (count <= 50) return 'w-24 h-36';
        return 'w-32 h-44 min-w-32 min-h-44';
    }

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
                            Listen and find the word
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
                                onClick={() => {
                                    // Navigate back to Reading Foundation domain
                                    // Extract domain ID from question data or use default
                                    window.location.href = '/child/domains';
                                }}
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

                {/* Show Correct Answer After Wrong Attempts */}
                {showCorrectAnswer && (
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-600 px-16 py-8 rounded-3xl shadow-2xl z-50"
                    >
                        <div className="text-center">
                            <p className="text-2xl text-white mb-4">The correct answer is:</p>
                            <p className="text-6xl font-bold text-white">{question.correctAnswer}</p>
                        </div>
                    </motion.div>
                )}

                {/* Flashcard grid - centered 2x2 layout for 4-card mode */}
                <div className="flex-1 flex items-center justify-center overflow-y-auto scrollbar-thin scrollbar-thumb-purple-300 scrollbar-track-transparent">
                    <div className={`grid ${gridCols} ${isNewFlashcardMode ? 'gap-6' : 'gap-2'} ${isNewFlashcardMode ? 'p-6' : 'p-2'} ${availableOptions.length > 50 && !isNewFlashcardMode ? 'grid-flow-dense' : ''}`}>
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
                                                        font-bold text-purple-800 break-words
                                                        ${isNewFlashcardMode ? 'text-7xl' :
                                                            availableOptions.length <= 4 ? 'text-4xl' :
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

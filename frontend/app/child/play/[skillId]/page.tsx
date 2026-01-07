'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Star, Trophy, Sparkles, Clock, Target, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { ApiClient, Question, MicroSkill, Session } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

// Game components
import TapSelectGame from '@/components/game-templates/TapToSelectGame';
import DragDropGame from '@/components/game-templates/DragAndDropGame';
import AudioToLetterGame from '@/components/game-templates/AudioToLetterGame';
import MemoryCardGame from '@/components/game-templates/MemoryCardGame';
import SortingGame from '@/components/game-templates/SortingGame';
import PictureToWordGame from '@/components/game-templates/PictureToWordGame';
import PuzzleJoinGame from '@/components/game-templates/PuzzleJoinGame';
import FindTheWordGame from '@/components/game-templates/FindTheWordGame';
import SequencingGame from '@/components/game-templates/SequencingGame';
import OddOneOutGame from '@/components/game-templates/OddOneOutGame';
import FlashcardRecognitionGame from '@/components/game-templates/FlashcardRecognitionGame';
import RecallGame from '@/components/game-templates/RecallGame';
import ReadingComprehensionGame from '@/components/game-templates/ReadingComprehensionGame';
import SpellingGame from '@/components/game-templates/SpellingGame';
import QuizResults from '@/components/quiz/QuizResults';
import QuizTimer from '@/components/quiz/QuizTimer';
import QuizRulesModal from '@/components/quiz/QuizRulesModal';
import AnswerFeedback from '@/components/quiz/AnswerFeedback';

export default function SkillPlayPage({ params }: { params: Promise<{ skillId: string }> }) {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const childId = user?.id;
    const unwrappedParams = React.use(params);
    const skillId = unwrappedParams.skillId;

    // Core state
    const [skill, setSkill] = useState<MicroSkill | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [session, setSession] = useState<Session | null>(null);
    const [difficulty, setDifficulty] = useState<1 | 2 | 3>(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Game state
    const [totalStars, setTotalStars] = useState(0);
    const [totalCoins, setTotalCoins] = useState(0);
    const [correctCount, setCorrectCount] = useState(0);
    const [totalAttempts, setTotalAttempts] = useState(0);
    const [showResults, setShowResults] = useState(false);
    const [masteryAchieved, setMasteryAchieved] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [difficultyChangeMessage, setDifficultyChangeMessage] = useState<string | null>(null);
    const [aiInsights, setAiInsights] = useState<string[]>([]);

    // Timer and quiz rules state
    const [showRulesModal, setShowRulesModal] = useState(true);
    const [questionTimer, setQuestionTimer] = useState(30);
    const [quizStartTime, setQuizStartTime] = useState<number | null>(null);
    const [questionStartTime, setQuestionStartTime] = useState<number | null>(null);
    const [questionTimings, setQuestionTimings] = useState<number[]>([]);
    const [lastQuestionTime, setLastQuestionTime] = useState<number | null>(null);
    const [avgResponseTime, setAvgResponseTime] = useState<number>(0); // Track average response time
    const [showAnswerFeedback, setShowAnswerFeedback] = useState(false);
    const [feedbackData, setFeedbackData] = useState({ isCorrect: false, starsEarned: 0, timeTaken: 0 });
    const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Track if initial load is complete to prevent duplicate calls
    const isInitialLoadRef = useRef(true);
    const isLoadingRef = useRef(false);
    const hasLoadedRef = useRef(false);

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login/child');
        }
    }, [authLoading, user, router]);

    // Initial load - only run once when authenticated
    useEffect(() => {
        if (isInitialLoadRef.current && childId && !hasLoadedRef.current && !authLoading) {
            isInitialLoadRef.current = false;
            hasLoadedRef.current = true;
            loadInitialData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [childId, authLoading]);

    // Note: Removed difficulty change useEffect - adaptive loading now handled in handleAnswer

    // Start quiz timer when rules modal is closed
    useEffect(() => {
        if (!showRulesModal && !quizStartTime) {
            setQuizStartTime(Date.now());
        }
    }, [showRulesModal, quizStartTime]);

    // Reset question timer when question changes
    useEffect(() => {
        if (!showRulesModal && questions.length > 0) {
            setQuestionTimer(30);
            setQuestionStartTime(Date.now());
        }
    }, [currentQuestionIndex, showRulesModal, questions.length]);

    // Timer countdown
    useEffect(() => {
        if (showRulesModal || showResults || showAnswerFeedback) {
            return;
        }

        timerIntervalRef.current = setInterval(() => {
            setQuestionTimer((prev) => {
                if (prev <= 1) {
                    // Time's up! Auto-submit as incorrect
                    handleTimeUp();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentQuestionIndex, showRulesModal, showResults, showAnswerFeedback]);

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
            }
        };
    }, []);

    async function loadInitialData() {
        if (isLoadingRef.current || !childId) return;

        try {
            isLoadingRef.current = true;
            setLoading(true);
            setError(null);

            console.log('Loading skill:', skillId);

            // Get all skills to find the current one
            const allSkills = await ApiClient.getAllSkills();
            const currentSkill = allSkills.find(s => s.id === skillId);

            if (!currentSkill) {
                console.error('Skill not found:', skillId);
                setError('Skill not found');
                return;
            }

            console.log('Found skill:', currentSkill.name);
            setSkill(currentSkill);

            // ADAPTIVE QUIZ FLOW: Start with first 5 questions at difficulty level 1
            console.log('Fetching initial 5 questions at difficulty level 1');
            const level1Questions = await ApiClient.getSkillQuestions(skillId, 1);
            console.log('Received level 1 questions:', level1Questions.length);

            if (level1Questions.length === 0) {
                console.warn('No questions available for this skill');
                setError('No questions available for this skill');
                return;
            }

            // Take only first 5 questions for initial batch
            const initialBatch = level1Questions.slice(0, 5);
            setQuestions(initialBatch);
            setDifficulty(1); // Ensure we start at level 1
            console.log('Initial batch loaded: 5 questions at difficulty 1');

            // Start session
            // console.log('🎮 Starting quiz session:', {
            //     skillId,
            //     skill: skill?.name,
            //     totalQuestions: questions.length,
            //     hasQuestions: questions.length > 0
            // });
            const newSession = await ApiClient.startSession(childId, skillId);
            setSession(newSession);
            console.log('Session started:', newSession.id);
        } catch (err) {
            console.error('Error loading initial data:', err);
            setError('Failed to load quiz');
        } finally {
            setLoading(false);
            isLoadingRef.current = false;
        }
    }

    // Load next batch of 5 questions at specified difficulty
    async function loadNextBatch(recommendedDifficulty: 1 | 2 | 3) {
        if (isLoadingRef.current) return;

        try {
            isLoadingRef.current = true;
            console.log('Loading next batch at difficulty:', recommendedDifficulty);

            const newQuestions = await ApiClient.getSkillQuestions(skillId, recommendedDifficulty);
            console.log('Fetched questions for next batch:', newQuestions.length);

            if (newQuestions.length > 0) {
                // Take 5 questions from the new difficulty level
                const batch = newQuestions.slice(0, 5);

                // Append to existing questions
                setQuestions(prev => {
                    console.log(`Appending ${batch.length} questions. Total will be: ${prev.length + batch.length}`);
                    return [...prev, ...batch];
                });

                setDifficulty(recommendedDifficulty);
                console.log(`Next batch loaded: ${batch.length} questions at difficulty ${recommendedDifficulty}`);
            }
        } catch (err) {
            console.error('Error loading next batch:', err);
        } finally {
            isLoadingRef.current = false;
        }
    }

    async function handleAnswer(isCorrect: boolean, responseTime: number, hintUsed: boolean, userResponse?: string) {
        if (!session || !skill || !questions[currentQuestionIndex] || !childId) return;

        const question = questions[currentQuestionIndex];

        // Stop the timer
        if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
        }

        // Calculate actual time taken
        const timeTaken = questionStartTime ? (Date.now() - questionStartTime) / 1000 : responseTime;
        setLastQuestionTime(timeTaken);
        setQuestionTimings([...questionTimings, timeTaken]);

        // Skip feedback modal for Recognition and Meaning skills (RF.ALL.1, RF.ALL.2) - continuous flow
        const isContinuousFlowSkill = skill.code === 'RF.ALL.1' || skill.code === 'RF.ALL.2';

        if (!isContinuousFlowSkill) {
            // Show answer feedback IMMEDIATELY for snappy feel (only for non-Recognition skills)
            setFeedbackData({
                isCorrect,
                starsEarned: isCorrect ? 1.5 : 0, // Optimistic guess, updated later
                timeTaken
            });
            setShowAnswerFeedback(true);
        }

        try {
            // Log attempt to backend
            const result = await ApiClient.logAttempt({
                childId,
                questionId: question.id,
                microSkillId: skill.id,
                sessionId: session.id,
                isCorrect,
                responseTimeSeconds: timeTaken,
                hintUsed,
                hintCount: hintUsed ? 1 : 0,
                userResponse: userResponse || '',
                correctAnswer: question.correctAnswer,
                difficultyLevelAtAttempt: difficulty,
            });

            // Update stats with real data from backend (skip for continuous flow skills)
            if (!isContinuousFlowSkill) {
                setTotalStars(prev => prev + result.stars);
                setTotalCoins(prev => prev + result.coins);
            }
            setTotalAttempts(prev => prev + 1);
            if (isCorrect) {
                setCorrectCount(prev => prev + 1);
                // Update feedback with actual stars earned if different
                if (!isContinuousFlowSkill) {
                    setFeedbackData(prev => ({ ...prev, starsEarned: result.stars }));
                }
            }

            // Update average response time
            setQuestionTimings(prev => {
                const newTimings = [...prev, timeTaken];
                const avgTime = newTimings.reduce((sum, t) => sum + t, 0) / newTimings.length;
                setAvgResponseTime(avgTime);
                return newTimings;
            });

            // result is already used to update state, so we just proceed to the timeout

            // Hide feedback after 2 seconds and move to next question
            setTimeout(async () => {
                setShowAnswerFeedback(false);

                // Show AI insights if available
                if (result.adaptiveRecommendation.insights.length > 0) {
                    setAiInsights(result.adaptiveRecommendation.insights);
                    // Auto-dismiss after 4 seconds
                    setTimeout(() => {
                        setAiInsights([]);
                    }, 4000);
                }

                // Show behavioral tip if available
                if (result.behavioralTip) {
                    setAiInsights(prev => [...prev, result.behavioralTip!]);
                    setTimeout(() => {
                        setAiInsights([]);
                    }, 5000);
                }

                // ADAPTIVE BATCHING: Load next batch every 5 questions BEFORE checking if quiz should end
                const nextIndex = currentQuestionIndex + 1;
                const shouldLoadNext = nextIndex % 5 === 0 && nextIndex >= 5;

                if (shouldLoadNext) {
                    console.log(`Completed ${nextIndex} questions. Loading next batch...`);
                    const recommendedDifficulty = result.nextQuestionDifficulty;

                    // Show difficulty change message if applicable
                    if (recommendedDifficulty !== difficulty) {
                        showDifficultyMessage(result.adaptiveRecommendation.reason);
                    }

                    // Load next batch of 5 questions at recommended difficulty
                    await loadNextBatch(recommendedDifficulty);

                    // After loading, move to next question (which is now available)
                    console.log(`Batch loaded. Total questions now: ${questions.length + 5}`);
                    setCurrentQuestionIndex(prev => prev + 1);
                } else {
                    // Move to next question or show results
                    if (currentQuestionIndex < questions.length - 1) {
                        setCurrentQuestionIndex(prev => prev + 1);
                    } else if (currentQuestionIndex >= 9) {
                        // Minimum 10 questions completed - end quiz
                        console.log('Minimum 10 questions completed. Ending quiz.');
                        handleSessionComplete();
                    } else {
                        // Less than 10 questions - should not happen with adaptive loading
                        console.warn(`Quiz ending with only ${currentQuestionIndex + 1} questions`);
                        handleSessionComplete();
                    }
                }
            }, 2000);

        } catch (err) {
            console.error('Error logging attempt:', err);
            setShowAnswerFeedback(false);
        }
    }

    // Handle time up (auto-submit as incorrect)
    async function handleTimeUp() {
        if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
        }
        await handleAnswer(false, 30, false, 'Time expired');
    }

    // Show difficulty adjustment message
    function showDifficultyMessage(message: string) {
        setDifficultyChangeMessage(message);
        // Auto-dismiss after 3 seconds
        setTimeout(() => {
            setDifficultyChangeMessage(null);
        }, 3000);
    }

    async function handleSessionComplete() {
        if (!childId || !skill) return;

        try {
            // Calculate mastery
            const masteryResult = await ApiClient.calculateMastery(childId, skill.id);
            setMasteryAchieved(masteryResult.mastered);
            setShowResults(true);
        } catch (err) {
            console.error('Error calculating mastery:', err);
            setShowResults(true);
        }
    }

    // Loading state
    if (loading || authLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400 flex items-center justify-center p-6 overflow-hidden relative">
                {/* Floating background shapes */}
                <div className="absolute inset-0 overflow-hidden">
                    {[...Array(10)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute text-6xl opacity-20"
                            initial={{
                                x: Math.random() * window.innerWidth,
                                y: Math.random() * window.innerHeight,
                            }}
                            animate={{
                                x: [
                                    Math.random() * window.innerWidth,
                                    Math.random() * window.innerWidth,
                                    Math.random() * window.innerWidth,
                                ],
                                y: [
                                    Math.random() * window.innerHeight,
                                    Math.random() * window.innerHeight,
                                    Math.random() * window.innerHeight,
                                ],
                                rotate: [0, 360],
                            }}
                            transition={{
                                duration: 10 + i * 2,
                                repeat: Infinity,
                                ease: 'linear',
                            }}
                        >
                            {['🎮', '⭐', '🎯', '🏆', '✨', '🌟', '💫', '🎨', '📚', '🚀'][i]}
                        </motion.div>
                    ))}
                </div>

                {/* Loading content */}
                <div className="relative z-10 text-center">
                    <motion.div
                        animate={{
                            y: [0, -20, 0],
                        }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        }}
                        className="mb-8"
                    >
                        <div className="text-9xl mb-4">🎮</div>
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-white text-5xl font-bold mb-4"
                    >
                        Getting Your Quiz Ready!
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-white/90 text-2xl mb-8"
                    >
                        Preparing something awesome for you...
                    </motion.p>

                    {/* Loading dots */}
                    <div className="flex items-center justify-center gap-3">
                        {[0, 1, 2].map((i) => (
                            <motion.div
                                key={i}
                                className="w-6 h-6 bg-white rounded-full"
                                animate={{
                                    scale: [1, 1.5, 1],
                                    opacity: [0.5, 1, 0.5],
                                }}
                                transition={{
                                    duration: 1,
                                    repeat: Infinity,
                                    delay: i * 0.2,
                                }}
                            />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // Not authenticated - will redirect via useEffect
    if (!user || !childId) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400 flex items-center justify-center">
                <div className="text-white text-4xl font-bold">Redirecting to login...</div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400 flex items-center justify-center p-6">
                <div className="bg-white rounded-3xl p-12 shadow-2xl text-center max-w-2xl">
                    <div className="text-6xl mb-6">😕</div>
                    <h2 className="text-3xl font-bold text-purple-800 mb-4">Oops!</h2>
                    <p className="text-xl text-gray-600 mb-8">{error}</p>
                    <Link href="/child/domains">
                        <button className="bg-purple-500 text-white px-8 py-4 rounded-full font-bold text-xl hover:bg-purple-600 transition-all">
                            Back to Domains
                        </button>
                    </Link>
                </div>
            </div>
        );
    }

    // Results screen
    if (showResults) {
        const accuracy = totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : 0;

        return (
            <QuizResults
                masteryAchieved={masteryAchieved}
                skillName={skill?.name || ''}
                totalStars={totalStars}
                totalCoins={totalCoins}
                accuracy={accuracy}
                domainId={skill?.domainId || ''}
                sessionId={session?.id || ''}
                childId={childId || ''}
                onPlayAgain={() => router.push(`/child/play/${skillId}`)}
            />
        );
    }

    // No questions available
    if (!questions || questions.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400 flex items-center justify-center p-6">
                <div className="bg-white rounded-3xl p-12 shadow-2xl text-center max-w-2xl">
                    <div className="text-6xl mb-6">📚</div>
                    <h2 className="text-3xl font-bold text-purple-800 mb-4">No Questions Available</h2>
                    <p className="text-xl text-gray-600 mb-8">This skill doesn't have any questions yet.</p>
                    <Link href="/child/domains">
                        <button className="bg-purple-500 text-white px-8 py-4 rounded-full font-bold text-xl hover:bg-purple-600 transition-all">
                            Back to Domains
                        </button>
                    </Link>
                </div>
            </div>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];

    // Special rendering for Recognition and Meaning skills - Time-based, no quiz mechanics
    if (skill?.code === 'RF.ALL.1') {
        return (
            <div className="h-screen w-screen overflow-hidden">
                {/* Full screen flashcard game - no rules modal */}
                {currentQuestion && (
                    <FlashcardRecognitionGame
                        question={currentQuestion}
                        onAnswer={handleAnswer}
                        difficultyLevel={difficulty}
                        showHint={false}
                        isRulesModalOpen={false}
                    />
                )}
            </div>
        );
    }

    // Meaning quiz - continuous flow with picture matching
    if (skill?.code === 'RF.ALL.2') {
        return (
            <div className="h-screen w-screen overflow-hidden">
                {/* Full screen meaning game - no rules modal */}
                {currentQuestion && (
                    <PictureToWordGame
                        question={currentQuestion}
                        onAnswer={handleAnswer}
                        difficultyLevel={difficulty}
                        showHint={false}
                        isRulesModalOpen={false}
                    />
                )}
            </div>
        );
    }

    // Recall quiz - continuous flow with auditory-to-visual mapping
    if (skill?.code === 'RF.ALL.3') {
        return (
            <div className="h-screen w-screen overflow-hidden">
                {/* Full screen recall game - no rules modal */}
                {currentQuestion && (
                    <RecallGame
                        question={currentQuestion}
                        onAnswer={handleAnswer}
                        difficultyLevel={difficulty}
                        showHint={false}
                        isRulesModalOpen={false}
                        gameMode="tap"
                    />
                )}
            </div>
        );
    }

    // Reading Comprehension quiz - contextual understanding
    if (skill?.code === 'RF.ALL.4') {
        return (
            <div className="h-screen w-screen overflow-hidden">
                {/* Full screen reading comprehension game - no rules modal */}
                {currentQuestion && (
                    <ReadingComprehensionGame
                        question={currentQuestion}
                        onAnswer={handleAnswer}
                        difficultyLevel={difficulty}
                        showHint={false}
                        isRulesModalOpen={false}
                    />
                )}
            </div>
        );
    }

    // Spelling quiz - orthographic memory
    if (skill?.code === 'RF.ALL.5') {
        return (
            <div className="h-screen w-screen overflow-hidden">
                {/* Full screen spelling game - no rules modal */}
                {currentQuestion && (
                    <SpellingGame
                        question={currentQuestion}
                        onAnswer={handleAnswer}
                        difficultyLevel={difficulty}
                        showHint={false}
                        isRulesModalOpen={false}
                    />
                )}
            </div>
        );
    }

    return (
        <div className="h-screen bg-gradient-to-br from-purple-200 via-pink-200 to-blue-200 overflow-hidden relative flex">
            {/* Floating Background Icons - Reduced for cleaner look */}
            {['📚', '⭐', '🎯', '✨'].map((icon, i) => (
                <motion.div
                    key={`float-${i}`}
                    initial={{
                        y: typeof window !== 'undefined' ? Math.random() * window.innerHeight : 0,
                        x: typeof window !== 'undefined' ? Math.random() * window.innerWidth : 0,
                        opacity: 0.1
                    }}
                    animate={{
                        y: [null, Math.random() * 100 - 50],
                        x: [null, Math.random() * 100 - 50],
                        rotate: [0, 360]
                    }}
                    transition={{
                        duration: 25 + Math.random() * 10,
                        repeat: Infinity,
                        repeatType: "reverse",
                        ease: "easeInOut"
                    }}
                    className="absolute text-5xl pointer-events-none"
                    style={{
                        top: `${Math.random() * 80}%`,
                        left: `${Math.random() * 80}%`
                    }}
                >
                    {icon}
                </motion.div>
            ))}

            {/* Quiz Rules Modal */}
            <QuizRulesModal
                isOpen={showRulesModal}
                onStart={() => setShowRulesModal(false)}
                skillName={skill?.name || ''}
            />

            {/* Answer Feedback */}
            <AnswerFeedback
                isVisible={showAnswerFeedback}
                isCorrect={feedbackData.isCorrect}
                starsEarned={feedbackData.starsEarned}
                timeTaken={feedbackData.timeTaken}
            />

            {/* LEFT SIDEBAR - Stats Panel - Compact and Professional */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="w-64 flex-shrink-0 bg-white/40 backdrop-blur-lg border-r-2 border-white/50 p-3 flex flex-col gap-2.5 relative z-10 h-screen overflow-hidden"
            >
                {/* Back Button - Simplified */}
                <Link href={`/child/domain/${skill?.domainId}`}>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2.5 rounded-xl font-semibold shadow-md transition-all flex items-center justify-center gap-2 text-sm"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to Skills</span>
                    </motion.button>
                </Link>

                {/* Skill Info - Compact */}
                <div className="bg-white/50 backdrop-blur-sm rounded-xl p-3 border border-white/60">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">🎮</span>
                        <div className="flex-1">
                            <h2 className="text-base font-bold text-purple-800 leading-tight">{skill?.name}</h2>
                            <p className="text-xs text-gray-600 font-medium">Level {difficulty}</p>
                        </div>
                    </div>
                </div>

                {/* Question Progress - Compact */}
                <div className="bg-white/50 backdrop-blur-sm rounded-xl p-3 border border-white/60">
                    <div className="flex items-center gap-1.5 mb-2">
                        <Target className="w-4 h-4 text-purple-600" />
                        <span className="font-semibold text-purple-700 text-sm">Progress</span>
                    </div>
                    <div className="text-center mb-2">
                        <div className="text-2xl font-bold text-purple-800">{currentQuestionIndex + 1}</div>
                        <div className="text-xs text-gray-600 font-medium">of {questions.length}</div>
                    </div>
                    {/* Progress Bar */}
                    <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{
                                width: `${(totalAttempts / questions.length) * 100}%`
                            }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                        />
                    </div>
                    <div className="text-xs text-center text-purple-600 font-medium mt-1.5">
                        {Math.round((totalAttempts / questions.length) * 100)}%
                    </div>
                </div>

                {/* Stars - Simplified */}
                <div className="bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-xl p-3 border border-yellow-300">
                    <div className="flex items-center gap-2">
                        <Star className="w-7 h-7 text-yellow-600 fill-current" />
                        <div className="flex-1">
                            <div className="text-xs text-yellow-700 font-medium">Stars</div>
                            <div className="text-2xl font-bold text-yellow-800">{totalStars.toFixed(1)}</div>
                        </div>
                    </div>
                </div>

                {/* Coins - Simplified */}
                <div className="bg-gradient-to-br from-amber-100 to-amber-200 rounded-xl p-3 border border-amber-300">
                    <div className="flex items-center gap-2">
                        <Trophy className="w-7 h-7 text-amber-600 fill-current" />
                        <div className="flex-1">
                            <div className="text-xs text-amber-700 font-medium">Coins</div>
                            <div className="text-2xl font-bold text-amber-800">{totalCoins}</div>
                        </div>
                    </div>
                </div>

                {/* Timer - Compact */}
                <div className="bg-white/50 backdrop-blur-sm rounded-xl p-3 border border-white/60">
                    <div className="flex items-center gap-1.5 mb-2">
                        <Clock className="w-4 h-4 text-blue-600" />
                        <span className="font-semibold text-blue-700 text-sm">Timer</span>
                    </div>
                    <QuizTimer
                        timeRemaining={questionTimer}
                        totalTime={30}
                        isActive={!showRulesModal && !showResults}
                    />
                    {quizStartTime && (
                        <div className="mt-2 text-center">
                            <div className="text-xs text-gray-600 font-medium">Total Time</div>
                            <div className="text-base font-bold text-blue-700">
                                {Math.floor((Date.now() - quizStartTime) / 60000)}:{String(Math.floor(((Date.now() - quizStartTime) % 60000) / 1000)).padStart(2, '0')}
                            </div>
                        </div>
                    )}
                    {lastQuestionTime !== null && (
                        <div className="mt-2 text-center">
                            <div className="text-xs text-gray-600 font-medium">Last Question</div>
                            <div className="text-base font-bold text-green-600">{lastQuestionTime.toFixed(1)}s</div>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col p-6 relative z-10 overflow-hidden">
                {/* Top Bar with End Quiz Button */}
                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="flex items-center justify-between mb-4"
                >
                    <h1 className="text-3xl font-bold text-purple-800 drop-shadow-lg">
                        {skill?.name}
                    </h1>
                    {/* End Quiz Button - Top Right with Enhanced Animation */}
                    {currentQuestionIndex >= 9 && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{
                                opacity: 1,
                                scale: 1,
                                boxShadow: [
                                    "0 10px 20px rgba(168, 85, 247, 0.4)",
                                    "0 15px 30px rgba(236, 72, 153, 0.6)",
                                    "0 10px 20px rgba(168, 85, 247, 0.4)"
                                ]
                            }}
                            transition={{
                                boxShadow: {
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }
                            }}
                            whileHover={{
                                scale: 1.1,
                                rotate: [0, -2, 2, 0],
                                transition: { duration: 0.3 }
                            }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleSessionComplete}
                            className="bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 text-white px-6 py-3 rounded-2xl shadow-lg transition-all flex items-center gap-2 font-bold relative overflow-hidden group"
                        >
                            <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-pink-300 to-purple-400 opacity-0 group-hover:opacity-30"
                                animate={{
                                    x: ["-100%", "100%"]
                                }}
                                transition={{
                                    duration: 1.5,
                                    repeat: Infinity,
                                    ease: "linear"
                                }}
                            />
                            <motion.div
                                animate={{ rotate: [0, 360] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            >
                                <Trophy className="w-5 h-5 relative z-10" />
                            </motion.div>
                            <span className="relative z-10">End Quiz</span>
                        </motion.button>
                    )}
                </motion.div>

                {/* Game Component - Optimized with Increased Size to prevent scrollbars */}
                <div className="flex-1 flex items-center justify-center p-4">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentQuestionIndex}
                            initial={{ opacity: 0, x: 100 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -100 }}
                            transition={{ duration: 0.3 }}
                            className="w-full h-full flex items-center justify-center"
                        >
                            {(() => {
                                console.log('Current question:', currentQuestion);
                                console.log('Game template:', currentQuestion?.gameTemplate);

                                // Fallback to TAP_SELECT if no gameTemplate
                                const template = currentQuestion?.gameTemplate || 'TAP_SELECT';

                                switch (template) {
                                    case 'TAP_SELECT':
                                        // Check if this is the unified Recognition skill
                                        if (skill?.code === 'RF.ALL.1') {
                                            return <FlashcardRecognitionGame
                                                question={currentQuestion}
                                                onAnswer={handleAnswer}
                                                difficultyLevel={difficulty}
                                                showHint={false}
                                                isRulesModalOpen={showRulesModal}
                                            />;
                                        }
                                        return <TapSelectGame question={currentQuestion} onAnswer={handleAnswer} difficultyLevel={difficulty} showHint={false} isRulesModalOpen={showRulesModal} />;
                                    case 'DRAG_DROP':
                                        return <DragDropGame question={currentQuestion} onAnswer={handleAnswer} difficultyLevel={difficulty} showHint={false} isRulesModalOpen={showRulesModal} />;
                                    case 'AUDIO_TO_LETTER':
                                        // Check if this is the Recall skill (RF.ALL.3)
                                        if (skill?.code === 'RF.ALL.3') {
                                            return <RecallGame
                                                question={currentQuestion}
                                                onAnswer={handleAnswer}
                                                difficultyLevel={difficulty}
                                                showHint={false}
                                                isRulesModalOpen={showRulesModal}
                                                gameMode="tap"
                                            />;
                                        }
                                        return <AudioToLetterGame question={currentQuestion} onAnswer={handleAnswer} difficultyLevel={difficulty} showHint={false} isRulesModalOpen={showRulesModal} />;
                                    case 'MEMORY_CARD':
                                        return <MemoryCardGame question={currentQuestion} onAnswer={handleAnswer} difficultyLevel={difficulty} showHint={false} isRulesModalOpen={showRulesModal} />;
                                    case 'SORTING':
                                        return <SortingGame question={currentQuestion} onAnswer={handleAnswer} difficultyLevel={difficulty} showHint={false} isRulesModalOpen={showRulesModal} />;
                                    case 'PICTURE_TO_WORD':
                                        return <PictureToWordGame question={currentQuestion} onAnswer={handleAnswer} difficultyLevel={difficulty} showHint={false} isRulesModalOpen={showRulesModal} />;
                                    case 'PUZZLE_JOIN':
                                        return <PuzzleJoinGame question={currentQuestion} onAnswer={handleAnswer} difficultyLevel={difficulty} showHint={false} isRulesModalOpen={showRulesModal} />;
                                    case 'FIND_THE_WORD':
                                        // Check if this is the Reading Comprehension skill (RF.ALL.4)
                                        if (skill?.code === 'RF.ALL.4') {
                                            return <ReadingComprehensionGame
                                                question={currentQuestion}
                                                onAnswer={handleAnswer}
                                                difficultyLevel={difficulty}
                                                showHint={false}
                                                isRulesModalOpen={showRulesModal}
                                            />;
                                        }
                                        return <FindTheWordGame question={currentQuestion} onAnswer={handleAnswer} difficultyLevel={difficulty} showHint={false} isRulesModalOpen={showRulesModal} />;
                                    case 'SEQUENCING':
                                        // Check if this is the Spelling skill (RF.ALL.5)
                                        if (skill?.code === 'RF.ALL.5') {
                                            return <SpellingGame
                                                question={currentQuestion}
                                                onAnswer={handleAnswer}
                                                difficultyLevel={difficulty}
                                                showHint={false}
                                                isRulesModalOpen={showRulesModal}
                                            />;
                                        }
                                        return <SequencingGame question={currentQuestion} onAnswer={handleAnswer} difficultyLevel={difficulty} showHint={false} isRulesModalOpen={showRulesModal} />;
                                    case 'ODD_ONE_OUT':
                                        return <OddOneOutGame question={currentQuestion} onAnswer={handleAnswer} difficultyLevel={difficulty} showHint={false} isRulesModalOpen={showRulesModal} />;
                                    default:
                                        console.error('Unknown game template:', template);
                                        return <TapSelectGame question={currentQuestion} onAnswer={handleAnswer} difficultyLevel={difficulty} showHint={false} isRulesModalOpen={showRulesModal} />;
                                }
                            })()}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>



            {/* Difficulty Change Message - Bottom Center */}
            <AnimatePresence>
                {difficultyChangeMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-white/30 backdrop-blur-lg text-purple-900 px-8 py-4 rounded-full shadow-2xl z-50 border-2 border-purple-300/50"
                    >
                        <div className="flex items-center gap-3">
                            <Sparkles className="w-6 h-6 text-purple-600" />
                            <span className="font-bold text-lg">{difficultyChangeMessage}</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* AI Coach Messages - Positioned at TOP RIGHT to avoid overlap */}
            <AnimatePresence>
                {aiInsights.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, x: 20 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.9, x: 20 }}
                        className="fixed top-24 right-8 bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-2xl max-w-md z-50 border-2 border-purple-300"
                    >
                        <div className="flex items-start gap-4">
                            {/* AI Coach Avatar */}
                            <motion.div
                                animate={{ rotate: [0, 5, -5, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="flex-shrink-0"
                            >
                                <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-3xl shadow-lg">
                                    🤖
                                </div>
                            </motion.div>

                            {/* Message Content */}
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <Sparkles className="w-5 h-5 text-purple-500" />
                                    <h3 className="font-bold text-purple-800 text-lg">AI Coach</h3>
                                </div>
                                <div className="space-y-2">
                                    {aiInsights.map((insight, idx) => (
                                        <motion.p
                                            key={idx}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            className="text-gray-700 text-sm leading-relaxed"
                                        >
                                            {insight}
                                        </motion.p>
                                    ))}
                                </div>

                                {/* Encouraging footer */}
                                <div className="mt-3 pt-3 border-t border-purple-100">
                                    <p className="text-xs text-purple-600 font-semibold flex items-center gap-1">
                                        <span>💪</span>
                                        <span>You're doing great! Keep it up!</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

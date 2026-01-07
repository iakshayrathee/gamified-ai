'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Trophy, Home, ArrowRight, Sparkles, Target, TrendingUp, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ApiClient } from '@/lib/api-client';

interface QuizReview {
    overallPerformance: string;
    strengths: string[];
    areasToImprove: string[];
    specificFeedback: string;
    encouragement: string;
    confusionPatterns: string[];
}

interface NextSkillRecommendation {
    skillId: string;
    skillName: string;
    skillCode: string;
    reason: string;
    confidence: number;
}

interface QuizResultsProps {
    masteryAchieved: boolean;
    skillName: string;
    totalStars: number;
    totalCoins: number;
    accuracy: number;
    domainId: string;
    sessionId: string;
    childId: string;
    onPlayAgain: () => void;
}

export default function QuizResults({
    masteryAchieved,
    skillName,
    totalStars,
    totalCoins,
    accuracy,
    domainId,
    sessionId,
    childId,
    onPlayAgain
}: QuizResultsProps) {
    const router = useRouter();
    const [review, setReview] = useState<QuizReview | null>(null);
    const [recommendation, setRecommendation] = useState<NextSkillRecommendation | null>(null);
    const [loadingReview, setLoadingReview] = useState(true);
    const [showReview, setShowReview] = useState(false);

    // Prevent duplicate API calls
    const hasLoadedRef = useRef(false);

    useEffect(() => {
        // Only load once
        if (!hasLoadedRef.current) {
            hasLoadedRef.current = true;
            loadAIReviewAndRecommendation();
        }
    }, []);

    async function loadAIReviewAndRecommendation() {
        try {
            setLoadingReview(true);

            // Validate required props
            if (!sessionId || !childId) {
                console.warn('Missing sessionId or childId:', { sessionId, childId });
                throw new Error('Session ID and Child ID are required for AI review');
            }

            throw new Error('Session ID and Child ID are required for AI review');

            // OPTIMIZED: Single API call instead of two!
            const result = await ApiClient.getQuizReviewWithRecommendation(sessionId, childId);

            setReview(result.review);
            setRecommendation(result.recommendation);
        } catch (error) {
            console.error('Error loading AI review:', error);
            // Set fallback review
            setReview({
                overallPerformance: `Great effort! You completed the quiz with ${accuracy}% accuracy! 🎯`,
                strengths: ['You showed determination 💪', 'You completed all questions ⭐'],
                areasToImprove: ['Keep practicing! 📚'],
                specificFeedback: 'Every attempt helps you learn and grow! Keep up the great work! 🚀',
                encouragement: 'You\'re doing amazing! Keep learning! 🌟',
                confusionPatterns: []
            });
        } finally {
            setLoadingReview(false);
        }
    }

    function handleStartRecommendedSkill() {
        if (recommendation) {
            router.push(`/child/play/${recommendation.skillId}`);
        }
    }

    return (
        <div className="h-screen bg-gradient-to-br from-purple-200 via-pink-200 to-blue-200 overflow-hidden relative flex">
            {/* Background celebration effects */}
            {masteryAchieved && (
                <>
                    {/* Confetti */}
                    {Array.from({ length: 30 }).map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{ y: -100, x: typeof window !== 'undefined' ? Math.random() * window.innerWidth : 0, opacity: 1 }}
                            animate={{
                                y: typeof window !== 'undefined' ? window.innerHeight + 100 : 1000,
                                rotate: Math.random() * 720,
                                opacity: [1, 1, 0]
                            }}
                            transition={{
                                duration: 3 + Math.random() * 2,
                                delay: Math.random() * 0.5,
                                repeat: Infinity
                            }}
                            className="absolute w-2 h-2 rounded-sm"
                            style={{
                                backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A'][Math.floor(Math.random() * 5)]
                            }}
                        />
                    ))}

                    {/* Floating emojis */}
                    {['🎉', '⭐', '🏆', '✨', '🌟'].map((emoji, i) => (
                        <motion.div
                            key={`emoji-${i}`}
                            initial={{ y: typeof window !== 'undefined' ? window.innerHeight + 100 : 1000, x: `${i * 20}%` }}
                            animate={{
                                y: -100,
                                x: [`${i * 20}%`, `${i * 20 + 10}%`, `${i * 20}%`]
                            }}
                            transition={{
                                duration: 4,
                                delay: i * 0.3,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                            className="absolute text-5xl opacity-20"
                        >
                            {emoji}
                        </motion.div>
                    ))}
                </>
            )}

            {/* LEFT SIDEBAR - Rewards & Actions */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="w-80 flex-shrink-0 bg-white/30 backdrop-blur-lg border-r-2 border-white/40 p-4 flex flex-col gap-3 relative z-10 h-screen overflow-hidden"
            >
                {/* Celebration Icon */}
                <motion.div
                    animate={{
                        scale: masteryAchieved ? [1, 1.2, 1] : [1, 1.1, 1],
                        rotate: masteryAchieved ? [0, 10, -10, 0] : [0, 20, -20, 0]
                    }}
                    transition={{
                        duration: masteryAchieved ? 0.5 : 2,
                        repeat: Infinity,
                        repeatDelay: masteryAchieved ? 1 : 0
                    }}
                    className="text-8xl text-center"
                >
                    {masteryAchieved ? '🎉' : '⭐'}
                </motion.div>

                {/* Title */}
                <h2 className="text-3xl font-bold text-white drop-shadow-lg text-center">
                    {masteryAchieved ? 'Skill Mastered!' : 'Great Work!'}
                </h2>
                <p className="text-lg text-white/90 drop-shadow-md text-center mb-2">
                    {masteryAchieved ? `Amazing! You've mastered ${skillName}! 🌟` : 'Keep practicing to master this skill! 💪'}
                </p>

                {/* Stats - Vertical Layout */}
                <div className="space-y-3">
                    <motion.div
                        whileHover={{ scale: 1.02, x: 5 }}
                        className="relative bg-gradient-to-br from-yellow-50 to-amber-50 backdrop-blur-sm rounded-2xl p-4 shadow-2xl border-2 border-yellow-200 overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 to-amber-400/20 rounded-2xl" />
                        <div className="relative z-10 flex items-center gap-3">
                            <motion.div
                                animate={{ rotate: [0, 360] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            >
                                <Star className="w-10 h-10 text-yellow-500 fill-current drop-shadow-lg" />
                            </motion.div>
                            <div className="flex-1">
                                <div className="text-sm text-gray-700 font-semibold">Stars Earned</div>
                                <div className="text-3xl font-bold bg-gradient-to-br from-yellow-600 to-amber-600 bg-clip-text text-transparent">{totalStars.toFixed(1)} ⭐</div>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        whileHover={{ scale: 1.02, x: 5 }}
                        className="relative bg-gradient-to-br from-amber-50 to-orange-50 backdrop-blur-sm rounded-2xl p-4 shadow-2xl border-2 border-amber-200 overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-400/20 to-orange-400/20 rounded-2xl" />
                        <div className="relative z-10 flex items-center gap-3">
                            <motion.div
                                animate={{ y: [0, -10, 0] }}
                                transition={{ duration: 1, repeat: Infinity }}
                            >
                                <Trophy className="w-10 h-10 text-amber-500 fill-current drop-shadow-lg" />
                            </motion.div>
                            <div className="flex-1">
                                <div className="text-sm text-gray-700 font-semibold">Coins Collected</div>
                                <div className="text-3xl font-bold bg-gradient-to-br from-amber-600 to-orange-600 bg-clip-text text-transparent">{totalCoins} 🏆</div>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        whileHover={{ scale: 1.02, x: 5 }}
                        className="relative bg-gradient-to-br from-green-50 to-emerald-50 backdrop-blur-sm rounded-2xl p-4 shadow-2xl border-2 border-green-200 overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-green-400/20 to-emerald-400/20 rounded-2xl" />
                        <div className="relative z-10 flex items-center gap-3">
                            <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 1, repeat: Infinity }}
                                className="text-4xl drop-shadow-lg"
                            >
                                ✓
                            </motion.div>
                            <div className="flex-1">
                                <div className="text-sm text-gray-700 font-semibold">Accuracy Score</div>
                                <div className="text-3xl font-bold bg-gradient-to-br from-green-600 to-emerald-600 bg-clip-text text-transparent">{accuracy}% 🎯</div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Action Buttons with Enhanced Animations */}
                <div className="space-y-3 mt-4">
                    <motion.button
                        whileHover={{
                            scale: 1.05,
                            boxShadow: "0 20px 25px -5px rgba(59, 130, 246, 0.5)"
                        }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onPlayAgain}
                        className="w-full bg-gradient-to-r from-blue-500 via-blue-600 to-cyan-500 text-white px-6 py-3 rounded-full font-bold text-lg shadow-lg transition-all relative overflow-hidden"
                    >
                        <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-blue-500 to-blue-600 opacity-50"
                            animate={{ x: ["-100%", "100%"] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        />
                        <span className="relative z-10">🔄 Play Again</span>
                    </motion.button>

                    <Link href="/child/domains" className="block">
                        <motion.button
                            whileHover={{
                                scale: 1.05,
                                boxShadow: "0 20px 25px -5px rgba(168, 85, 247, 0.5)"
                            }}
                            whileTap={{ scale: 0.95 }}
                            className="w-full bg-gradient-to-r from-purple-500 via-purple-600 to-pink-500 text-white px-6 py-3 rounded-full font-bold text-lg shadow-lg transition-all relative overflow-hidden"
                        >
                            <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-pink-400 via-purple-500 to-purple-600 opacity-50"
                                animate={{ x: ["-100%", "100%"] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            />
                            <span className="relative z-10">🏠 Back to Domains</span>
                        </motion.button>
                    </Link>

                    <Link href={`/child/domain/${domainId}`} className="block">
                        <motion.button
                            whileHover={{
                                scale: 1.05,
                                boxShadow: "0 20px 25px -5px rgba(249, 115, 22, 0.5)"
                            }}
                            whileTap={{ scale: 0.95 }}
                            className="w-full bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 text-white px-6 py-3 rounded-full font-bold text-lg shadow-lg transition-all relative overflow-hidden"
                        >
                            <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-red-400 via-orange-500 to-orange-600 opacity-50"
                                animate={{ x: ["-100%", "100%"] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            />
                            <span className="relative z-10">🚀 More Skills</span>
                        </motion.button>
                    </Link>

                    <Link href="/child/home" className="block">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full text-white drop-shadow-md font-bold text-base hover:text-white/80 py-2 transition-colors flex items-center justify-center gap-2"
                        >
                            <Home className="w-5 h-5" /> Back to Home
                        </motion.button>
                    </Link>
                </div>
            </motion.div>

            {/* MAIN CONTENT AREA - AI Review & Recommendations */}
            <div className="flex-1 flex flex-col p-6 relative z-10 overflow-y-auto">
                {/* AI Review */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-4 max-w-4xl mx-auto w-full"
                >
                    {loadingReview ? (
                        <div className="relative bg-white/30 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border-2 border-purple-300/50 overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-3xl" />
                            <div className="relative z-10 flex items-center justify-center gap-3">
                                <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                                <p className="text-purple-700 font-semibold text-2xl">AI is reviewing your work... 🤖</p>
                            </div>
                        </div>
                    ) : review && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="relative bg-white/30 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border-2 border-purple-300/50 overflow-hidden"
                        >
                            {/* Animated gradient background */}
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-3xl" />
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-4">
                                    <Sparkles className="w-8 h-8 text-purple-600" />
                                    <h3 className="text-3xl font-bold text-purple-800">AI Coach Says:</h3>
                                </div>

                                <p className="text-2xl text-gray-800 mb-4 font-medium">{review.overallPerformance}</p>

                                {review.strengths.length > 0 && (
                                    <div className="mb-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <TrendingUp className="w-6 h-6 text-green-600" />
                                            <h4 className="font-bold text-green-700 text-xl">You're Great At:</h4>
                                        </div>
                                        <ul className="list-none text-gray-700 space-y-2 text-lg">
                                            {review.strengths.map((strength, i) => (
                                                <li key={i} className="flex items-center gap-2">
                                                    <span className="text-2xl">✨</span>
                                                    <span>{strength}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {review.areasToImprove.length > 0 && (
                                    <div className="mb-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Target className="w-6 h-6 text-blue-600" />
                                            <h4 className="font-bold text-blue-700 text-xl">Let's Practice:</h4>
                                        </div>
                                        <ul className="list-none text-gray-700 space-y-2 text-lg">
                                            {review.areasToImprove.map((area, i) => (
                                                <li key={i} className="flex items-center gap-2">
                                                    <span className="text-2xl">🎯</span>
                                                    <span>{area}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <p className="text-purple-700 font-bold text-2xl mt-4">{review.encouragement}</p>
                            </div>
                        </motion.div>
                    )}

                    {/* Next Skill Recommendation */}
                    {recommendation && !loadingReview && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="relative bg-gradient-to-br from-green-100 to-emerald-100 rounded-3xl p-8 shadow-2xl border-2 border-green-300 overflow-hidden"
                        >
                            {/* Pulsing glow effect */}
                            <motion.div
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="absolute inset-0 bg-gradient-to-br from-green-400/20 to-emerald-400/20 rounded-3xl"
                            />
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-4">
                                    <Sparkles className="w-8 h-8 text-green-600" />
                                    <h3 className="text-3xl font-bold text-green-800">Next Adventure! 🚀</h3>
                                </div>
                                <div className="mb-4">
                                    <p className="text-2xl font-bold text-gray-800 mb-2">
                                        {recommendation.skillCode}: {recommendation.skillName}
                                    </p>
                                    <p className="text-gray-700 text-xl">{recommendation.reason}</p>
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleStartRecommendedSkill}
                                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-5 rounded-full font-bold text-2xl shadow-lg transition-all flex items-center justify-center gap-3"
                                >
                                    <Sparkles className="w-7 h-7" />
                                    Let's Go!
                                    <ArrowRight className="w-7 h-7" />
                                </motion.button>
                            </div>
                        </motion.div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}

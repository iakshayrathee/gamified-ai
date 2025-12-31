'use client';

import { motion } from 'framer-motion';
import { Star, Trophy, Flame, Play, BookOpen, Award, Target, Zap } from 'lucide-react';
import Link from 'next/link';
import { getNextRecommendedSkill } from '@/lib/api-client';
import FloatingShapes from '@/components/ui/FloatingShapes';
import AnimatedButton from '@/components/ui/AnimatedButton';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/lib/auth-context';
import ChildNavbar from '@/components/navigation/ChildNavbar';
import { useChildProgress } from '@/lib/hooks/useApi';

export default function ChildHomePage() {
    const { user } = useAuth();
    const childName = user?.name || 'Student';
    const childId = user?.id || '';

    const { data: progress, isLoading: loading, error } = useChildProgress(childId);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400 flex items-center justify-center">
                <div className="text-white text-4xl font-bold">Loading...</div>
            </div>
        );
    }

    if (error || !progress) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400 flex items-center justify-center">
                <div className="text-white text-2xl">Error loading progress. Please try again.</div>
            </div>
        );
    }

    const { overallProgress = 0, totalStars = 0, totalCoins = 0, streakDays = 0, skillProgress, allSkills } = progress;

    // Get next recommended skill
    const nextSkill = getNextRecommendedSkill(skillProgress, allSkills);

    // Calculate achievements
    const skillsCompleted = skillProgress.filter(sp => sp.masteryStatus === 'MASTERED').length;
    const skillsInProgress = skillProgress.filter(sp => sp.masteryStatus === 'IN_PROGRESS').length;

    return (
        <ProtectedRoute allowedRoles={['CHILD']}>
            <ChildNavbar />
            <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400 pt-20 pb-4 px-4 sm:px-6 relative overflow-hidden">
                <FloatingShapes density="medium" theme="candy" />
                <div className="max-w-7xl mx-auto relative z-10">
                    {/* Welcome Header */}
                    <motion.div
                        initial={{ y: -50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="text-center mb-3"
                    >
                        <div className="flex items-center justify-center gap-4 mb-3">
                            <motion.div
                                className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-2xl"
                                animate={{ rotate: [0, 10, -10, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                {childName[0]}
                            </motion.div>
                            <div className="text-left">
                                <h1 className="text-4xl sm:text-5xl font-bold text-white drop-shadow-lg">
                                    Hi, {childName}! 👋
                                </h1>
                                <p className="text-xl text-white/90 font-semibold">Let's learn something awesome!</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                        <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ delay: 0.1, type: 'spring' }}
                            className="bg-white rounded-2xl p-3 sm:p-4 shadow-xl text-center"
                        >
                            <Star className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-500 mx-auto mb-1 fill-current" />
                            <div className="text-2xl sm:text-3xl font-bold text-yellow-600">{totalStars}</div>
                            <p className="text-xs text-gray-600 font-semibold">Stars</p>
                        </motion.div>

                        <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ delay: 0.2, type: 'spring' }}
                            className="bg-white rounded-2xl p-3 sm:p-4 shadow-xl text-center"
                        >
                            <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-amber-500 mx-auto mb-1 fill-current" />
                            <div className="text-2xl sm:text-3xl font-bold text-amber-600">{totalCoins}</div>
                            <p className="text-xs text-gray-600 font-semibold">Coins</p>
                        </motion.div>

                        <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ delay: 0.3, type: 'spring' }}
                            className="bg-white rounded-2xl p-3 sm:p-4 shadow-xl text-center"
                        >
                            <Flame className="w-8 h-8 sm:w-10 sm:h-10 text-orange-500 mx-auto mb-1 fill-current" />
                            <div className="text-2xl sm:text-3xl font-bold text-orange-600">{streakDays}</div>
                            <p className="text-xs text-gray-600 font-semibold">Day Streak</p>
                        </motion.div>

                        <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ delay: 0.4, type: 'spring' }}
                            className="bg-white rounded-2xl p-3 sm:p-4 shadow-xl text-center"
                        >
                            <Award className="w-8 h-8 sm:w-10 sm:h-10 text-green-500 mx-auto mb-1" />
                            <div className="text-2xl sm:text-3xl font-bold text-green-600">{skillsCompleted}</div>
                            <p className="text-xs text-gray-600 font-semibold">Completed</p>
                        </motion.div>
                    </div>

                    {/* Progress Overview */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="bg-white rounded-3xl p-4 sm:p-5 shadow-2xl mb-4"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-2xl sm:text-3xl font-bold text-purple-800">Your Learning Journey</h2>
                            <Target className="w-8 h-8 text-purple-600" />
                        </div>
                        <div className="bg-gray-200 rounded-full h-8 overflow-hidden mb-3">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${overallProgress}%` }}
                                transition={{ duration: 1.5, delay: 0.7 }}
                                className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 flex items-center justify-end pr-3"
                            >
                                <span className="text-white text-lg font-bold">{overallProgress}%</span>
                            </motion.div>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600">
                            <span className="font-semibold">🎯 {skillsInProgress} in progress</span>
                            <span className="font-semibold">✅ {skillsCompleted} mastered</span>
                        </div>
                    </motion.div>

                    {/* Main Action Card */}
                    <Link href="/child/domains">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.6, type: 'spring' }}
                            whileHover={{ scale: 1.02, y: -8 }}
                            whileTap={{ scale: 0.98 }}
                            className="bg-gradient-to-br from-green-400 via-emerald-500 to-teal-500 rounded-3xl p-6 sm:p-8 shadow-2xl cursor-pointer relative overflow-hidden group mb-4"
                        >
                            {/* Animated background effect */}
                            <div className="absolute inset-0 bg-gradient-to-br from-green-300/50 to-emerald-400/50 opacity-0 group-hover:opacity-100 transition-opacity" />

                            {/* Floating decorative elements */}
                            <div className="absolute top-4 right-4 text-6xl opacity-20 group-hover:opacity-30 transition-opacity">
                                🎮
                            </div>
                            <div className="absolute bottom-4 left-4 text-5xl opacity-20 group-hover:opacity-30 transition-opacity">
                                📚
                            </div>

                            <div className="relative z-10">
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <div className="flex-1 text-center sm:text-left">
                                        <div className="flex items-center justify-center sm:justify-start gap-4 mb-2">
                                            <div className="text-7xl sm:text-8xl">🎮</div>
                                            <motion.div
                                                animate={{ rotate: [0, 360] }}
                                                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                            >
                                                <Play className="w-16 h-16 text-white fill-current" />
                                            </motion.div>
                                        </div>
                                        <h2 className="text-4xl sm:text-5xl font-bold text-white mb-2">
                                            Start Learning!
                                        </h2>
                                        <p className="text-xl sm:text-2xl text-white/90 mb-3">
                                            Choose a topic, play fun games, and track your progress
                                        </p>
                                        <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
                                            <div className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full">
                                                <span className="text-white font-bold text-lg">🎯 Learn Skills</span>
                                            </div>
                                            <div className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full">
                                                <span className="text-white font-bold text-lg">📊 View Analytics</span>
                                            </div>
                                        </div>
                                    </div>

                                    <motion.div
                                        className="bg-white/30 backdrop-blur-md rounded-2xl p-6 sm:p-8"
                                        whileHover={{ scale: 1.05 }}
                                    >
                                        <div className="text-center">
                                            <div className="text-5xl mb-3">🚀</div>
                                            <div className="text-white font-bold text-2xl">Let's Go!</div>
                                            <div className="text-white/90 text-lg mt-2">Click to explore →</div>
                                        </div>
                                    </motion.div>
                                </div>
                            </div>
                        </motion.div>
                    </Link>

                    {/* Achievement Badges */}
                    {(totalStars > 50 || skillsCompleted > 5 || streakDays > 3) && (
                        <motion.div
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.8 }}
                            className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl"
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <Zap className="w-8 h-8 text-yellow-500 fill-current" />
                                <h2 className="text-2xl sm:text-3xl font-bold text-purple-800">Your Achievements!</h2>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {totalStars > 50 && (
                                    <motion.div
                                        whileHover={{ scale: 1.1, rotate: 5 }}
                                        className="bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-2xl p-4 text-center"
                                    >
                                        <div className="text-4xl mb-2">⭐</div>
                                        <p className="font-bold text-yellow-800">Star Collector</p>
                                        <p className="text-xs text-yellow-700">50+ stars!</p>
                                    </motion.div>
                                )}
                                {skillsCompleted > 5 && (
                                    <motion.div
                                        whileHover={{ scale: 1.1, rotate: -5 }}
                                        className="bg-gradient-to-br from-green-100 to-green-200 rounded-2xl p-4 text-center"
                                    >
                                        <div className="text-4xl mb-2">🏆</div>
                                        <p className="font-bold text-green-800">Skill Master</p>
                                        <p className="text-xs text-green-700">5+ skills!</p>
                                    </motion.div>
                                )}
                                {streakDays > 3 && (
                                    <motion.div
                                        whileHover={{ scale: 1.1, rotate: 5 }}
                                        className="bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl p-4 text-center"
                                    >
                                        <div className="text-4xl mb-2">🔥</div>
                                        <p className="font-bold text-orange-800">On Fire!</p>
                                        <p className="text-xs text-orange-700">{streakDays} day streak!</p>
                                    </motion.div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
        </ProtectedRoute>
    );
}

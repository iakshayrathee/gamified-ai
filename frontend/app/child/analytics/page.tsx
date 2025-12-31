'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    ArrowLeft, TrendingUp, TrendingDown, Minus, Brain, Target, Clock,
    Zap, Star, Trophy, Award, BookOpen, Sparkles, ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useChildProgress } from '@/lib/hooks/useApi';

export default function ChildAnalyticsPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();

    const { data: progress, isLoading: progressLoading } = useChildProgress(user?.id || '');
    const [selectedView, setSelectedView] = useState<'overview' | 'skills' | 'achievements'>('overview');

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login/child');
        }
    }, [authLoading, user, router]);

    // Process analytics data using useMemo to avoid recalculation
    const analytics = useMemo(() => {
        if (!progress) return null;
        return processAnalyticsData(progress);
    }, [progress]);

    const loading = authLoading || progressLoading;

    function processAnalyticsData(data: any) {
        const skills = data.skillProgress || [];

        // Calculate overall stats
        const totalAttempts = skills.reduce((sum: number, s: any) => sum + s.totalAttempts, 0);
        const totalCorrect = skills.reduce((sum: number, s: any) => sum + s.correctAttempts, 0);
        const overallAccuracy = totalAttempts > 0 ? (totalCorrect / totalAttempts) * 100 : 0;

        // Calculate average response time
        const avgResponseTime = skills.length > 0
            ? skills.reduce((sum: number, s: any) => sum + s.avgResponseTime, 0) / skills.length
            : 0;

        // Count mastery levels
        const masteredSkills = skills.filter((s: any) => s.masteryStatus === 'MASTERED').length;
        const inProgressSkills = skills.filter((s: any) => s.masteryStatus === 'IN_PROGRESS').length;

        // Get learning trends
        const improvingSkills = skills.filter((s: any) => (s as any).learningTrend === 'improving').length;
        const decliningSkills = skills.filter((s: any) => (s as any).learningTrend === 'declining').length;

        // Get top performing skills
        const topSkills = [...skills]
            .sort((a: any, b: any) => b.accuracyPercentage - a.accuracyPercentage)
            .slice(0, 5)
            .map((s: any) => ({
                name: s.microSkill.name,
                accuracy: s.accuracyPercentage,
                domain: s.microSkill.domain.name,
            }));

        // Get skills needing practice
        const needsPractice = [...skills]
            .filter((s: any) => s.accuracyPercentage < 70 && s.totalAttempts > 0)
            .sort((a: any, b: any) => a.accuracyPercentage - b.accuracyPercentage)
            .slice(0, 5)
            .map((s: any) => ({
                name: s.microSkill.name,
                accuracy: s.accuracyPercentage,
                domain: s.microSkill.domain.name,
            }));

        // Collect all AI insights
        const allInsights = skills
            .filter((s: any) => (s as any).aiInsights && (s as any).aiInsights.length > 0)
            .flatMap((s: any) => (s as any).aiInsights)
            .slice(0, 10);

        // Collect confusion patterns
        const confusionPatterns: string[] = skills
            .filter((s: any) => (s as any).confusionPatterns && (s as any).confusionPatterns.length > 0)
            .flatMap((s: any) => (s as any).confusionPatterns as string[]);
        const uniqueConfusions: string[] = [...new Set(confusionPatterns)];

        return {
            overview: {
                totalAttempts,
                overallAccuracy,
                avgResponseTime,
                masteredSkills,
                inProgressSkills,
                improvingSkills,
                decliningSkills,
                totalSkills: skills.length,
            },
            topSkills,
            needsPractice,
            aiInsights: allInsights,
            confusionPatterns: uniqueConfusions,
            skillsData: skills,
        };
    }

    const getTrendIcon = (count: number) => {
        if (count > 0) return <TrendingUp className="w-6 h-6 text-green-500" />;
        return <Minus className="w-6 h-6 text-gray-400" />;
    };

    if (loading || authLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl mb-4 animate-bounce">📊</div>
                    <div className="text-2xl font-bold text-purple-800">Loading your progress...</div>
                </div>
            </div>
        );
    }

    if (!analytics) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-6">
                <div className="bg-white rounded-3xl p-12 shadow-2xl text-center max-w-2xl">
                    <div className="text-6xl mb-6">🎯</div>
                    <h2 className="text-3xl font-bold text-purple-800 mb-4">Start Learning!</h2>
                    <p className="text-xl text-gray-600 mb-8">Complete some quizzes to see your progress here!</p>
                    <Link href="/child/domains">
                        <button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-full font-bold text-xl hover:scale-105 transition-all shadow-lg">
                            Start Learning
                        </button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-6">
            {/* Header */}
            <div className="max-w-7xl mx-auto mb-8">
                <Link href="/child/domains">
                    <button className="flex items-center gap-2 text-purple-700 hover:text-purple-900 font-bold text-lg mb-4 transition-all hover:scale-105">
                        <ArrowLeft className="w-6 h-6" />
                        Back to Domains
                    </button>
                </Link>

                <div className="bg-white rounded-3xl p-8 shadow-xl">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-4 rounded-2xl">
                            <Sparkles className="w-12 h-12 text-white" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                                My Learning Journey
                            </h1>
                            <p className="text-lg text-gray-600">See how amazing you're doing! 🌟</p>
                        </div>
                    </div>

                    {/* View Tabs */}
                    <div className="flex gap-3">
                        <button
                            onClick={() => setSelectedView('overview')}
                            className={`px-6 py-3 rounded-full font-bold transition-all ${selectedView === 'overview'
                                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg scale-105'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                        >
                            📊 Overview
                        </button>
                        <button
                            onClick={() => setSelectedView('skills')}
                            className={`px-6 py-3 rounded-full font-bold transition-all ${selectedView === 'skills'
                                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg scale-105'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                        >
                            🎯 Skills
                        </button>
                        <button
                            onClick={() => setSelectedView('achievements')}
                            className={`px-6 py-3 rounded-full font-bold transition-all ${selectedView === 'achievements'
                                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg scale-105'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                        >
                            🏆 Achievements
                        </button>
                    </div>
                </div>
            </div>

            {/* Overview Tab */}
            {selectedView === 'overview' && (
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl p-6 text-white shadow-xl"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <Target className="w-10 h-10" />
                                <span className="text-4xl font-bold">{analytics.overview.totalAttempts}</span>
                            </div>
                            <p className="text-lg font-bold">Questions Answered</p>
                            <p className="text-sm opacity-90">Keep practicing!</p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-gradient-to-br from-green-500 to-green-600 rounded-3xl p-6 text-white shadow-xl"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <Star className="w-10 h-10" />
                                <span className="text-4xl font-bold">{analytics.overview.overallAccuracy.toFixed(0)}%</span>
                            </div>
                            <p className="text-lg font-bold">Overall Accuracy</p>
                            <p className="text-sm opacity-90">You're doing great!</p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl p-6 text-white shadow-xl"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <Trophy className="w-10 h-10" />
                                <span className="text-4xl font-bold">{analytics.overview.masteredSkills}</span>
                            </div>
                            <p className="text-lg font-bold">Skills Mastered</p>
                            <p className="text-sm opacity-90">Amazing progress!</p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl p-6 text-white shadow-xl"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <Clock className="w-10 h-10" />
                                <span className="text-4xl font-bold">{analytics.overview.avgResponseTime.toFixed(1)}s</span>
                            </div>
                            <p className="text-lg font-bold">Avg Response Time</p>
                            <p className="text-sm opacity-90">Getting faster!</p>
                        </motion.div>
                    </div>

                    {/* Learning Trends */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-white rounded-3xl p-6 shadow-xl"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <TrendingUp className="w-8 h-8 text-green-500" />
                                <h3 className="text-2xl font-bold text-gray-900">Learning Trends</h3>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-green-50 rounded-2xl">
                                    <div className="flex items-center gap-3">
                                        <TrendingUp className="w-6 h-6 text-green-600" />
                                        <span className="font-bold text-gray-800">Improving</span>
                                    </div>
                                    <span className="text-2xl font-bold text-green-600">{analytics.overview.improvingSkills}</span>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                                    <div className="flex items-center gap-3">
                                        <Minus className="w-6 h-6 text-gray-600" />
                                        <span className="font-bold text-gray-800">Stable</span>
                                    </div>
                                    <span className="text-2xl font-bold text-gray-600">
                                        {analytics.overview.totalSkills - analytics.overview.improvingSkills - analytics.overview.decliningSkills}
                                    </span>
                                </div>
                                {analytics.overview.decliningSkills > 0 && (
                                    <div className="flex items-center justify-between p-4 bg-orange-50 rounded-2xl">
                                        <div className="flex items-center gap-3">
                                            <TrendingDown className="w-6 h-6 text-orange-600" />
                                            <span className="font-bold text-gray-800">Needs Practice</span>
                                        </div>
                                        <span className="text-2xl font-bold text-orange-600">{analytics.overview.decliningSkills}</span>
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        {/* AI Coach Insights */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl p-6 shadow-xl text-white"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <Brain className="w-8 h-8" />
                                <h3 className="text-2xl font-bold">AI Coach Says</h3>
                            </div>
                            {analytics.aiInsights.length > 0 ? (
                                <div className="space-y-3 max-h-64 overflow-y-auto">
                                    {analytics.aiInsights.slice(0, 5).map((insight: string, idx: number) => (
                                        <div key={idx} className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
                                            <p className="text-sm font-medium flex items-start gap-2">
                                                <span className="text-xl">💡</span>
                                                <span>{insight}</span>
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-lg opacity-90">Complete more quizzes to get personalized tips!</p>
                                </div>
                            )}
                        </motion.div>
                    </div>

                    {/* Top Skills & Needs Practice */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Top Skills */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-3xl p-6 shadow-xl"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <Award className="w-8 h-8 text-yellow-500" />
                                <h3 className="text-2xl font-bold text-gray-900">Your Best Skills</h3>
                            </div>
                            {analytics.topSkills.length > 0 ? (
                                <div className="space-y-3">
                                    {analytics.topSkills.map((skill: any, idx: number) => (
                                        <div key={idx} className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl">
                                            <div>
                                                <p className="font-bold text-gray-900">{skill.name}</p>
                                                <p className="text-sm text-gray-600">{skill.domain}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-2xl font-bold text-yellow-600">{skill.accuracy.toFixed(0)}%</p>
                                                <p className="text-xs text-gray-600">accuracy</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-600 text-center py-8">Start practicing to see your top skills!</p>
                            )}
                        </motion.div>

                        {/* Needs Practice */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white rounded-3xl p-6 shadow-xl"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <BookOpen className="w-8 h-8 text-blue-500" />
                                <h3 className="text-2xl font-bold text-gray-900">Practice These</h3>
                            </div>
                            {analytics.needsPractice.length > 0 ? (
                                <div className="space-y-3">
                                    {analytics.needsPractice.map((skill: any, idx: number) => (
                                        <div key={idx} className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl">
                                            <div>
                                                <p className="font-bold text-gray-900">{skill.name}</p>
                                                <p className="text-sm text-gray-600">{skill.domain}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-2xl font-bold text-blue-600">{skill.accuracy.toFixed(0)}%</p>
                                                <p className="text-xs text-gray-600">keep trying!</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-600 text-center py-8">Great job! All skills are doing well! 🎉</p>
                            )}
                        </motion.div>
                    </div>

                    {/* Confusion Patterns */}
                    {analytics.confusionPatterns.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-3xl p-6 shadow-xl"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <Zap className="w-8 h-8 text-orange-500" />
                                <h3 className="text-2xl font-bold text-gray-900">Watch Out For These!</h3>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                {analytics.confusionPatterns.map((pattern, idx) => (
                                    <div key={idx} className="px-6 py-3 bg-orange-100 text-orange-800 rounded-full font-bold text-lg">
                                        {pattern.replace('_', '/')} confusion
                                    </div>
                                ))}
                            </div>
                            <p className="mt-4 text-gray-600">Practice these letter pairs to improve!</p>
                        </motion.div>
                    )}
                </div>
            )}

            {/* Skills Tab */}
            {selectedView === 'skills' && (
                <div className="max-w-7xl mx-auto">
                    <Link href={`/child/analysis/${user?.id}`}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl p-8 shadow-xl text-white cursor-pointer hover:scale-105 transition-all"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-3xl font-bold mb-2">View Detailed Skill Analysis</h3>
                                    <p className="text-lg opacity-90">See AI insights for every skill you've practiced</p>
                                </div>
                                <ChevronRight className="w-12 h-12" />
                            </div>
                        </motion.div>
                    </Link>
                </div>
            )}

            {/* Achievements Tab */}
            {selectedView === 'achievements' && (
                <div className="max-w-7xl mx-auto">
                    <div className="bg-white rounded-3xl p-12 shadow-xl text-center">
                        <div className="text-8xl mb-6">🏆</div>
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">Achievements Coming Soon!</h2>
                        <p className="text-xl text-gray-600 mb-8">
                            Keep learning to unlock amazing badges and rewards!
                        </p>
                        <div className="flex justify-center gap-4">
                            <div className="text-6xl opacity-50">🥇</div>
                            <div className="text-6xl opacity-50">🥈</div>
                            <div className="text-6xl opacity-50">🥉</div>
                            <div className="text-6xl opacity-50">⭐</div>
                            <div className="text-6xl opacity-50">🎖️</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

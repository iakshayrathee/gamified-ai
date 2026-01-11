'use client';

import { motion } from 'framer-motion';
import { QuizResultsSummary } from '@/lib/quiz-results-api';
import { Trophy, Star, Coins, TrendingUp } from 'lucide-react';

interface SummaryCardProps {
    summary: QuizResultsSummary;
    skillName: string;
}

export default function SummaryCard({ summary, skillName }: SummaryCardProps) {
    const getTierColor = (tier?: 1 | 2 | 3) => {
        if (!tier) return 'bg-gray-100 text-gray-800';
        switch (tier) {
            case 1: return 'bg-green-100 text-green-800 border-green-300';
            case 2: return 'bg-yellow-100 text-yellow-800 border-yellow-300';
            case 3: return 'bg-red-100 text-red-800 border-red-300';
        }
    };

    const getRiskColor = (risk?: string) => {
        switch (risk) {
            case 'Low': return 'text-green-600';
            case 'Medium': return 'text-yellow-600';
            case 'High': return 'text-red-600';
            default: return 'text-gray-600';
        }
    };

    return (
        <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl shadow-lg p-8 border-2 border-purple-100"
        >
            {/* Header */}
            <div className="text-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                    {summary.masteryAchieved ? '🎉 Amazing Work!' : '📚 Keep Practicing!'}
                </h1>
                <p className="text-lg text-gray-600">{skillName}</p>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {/* Accuracy */}
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 text-center">
                    <div className="flex justify-center mb-3">
                        <TrendingUp className="w-8 h-8 text-purple-600" />
                    </div>
                    <div className="text-4xl font-bold text-purple-700 mb-1">
                        {summary.accuracy}%
                    </div>
                    <div className="text-sm text-purple-600 font-medium">Accuracy</div>
                </div>

                {/* Stars */}
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6 text-center">
                    <div className="flex justify-center mb-3">
                        <Star className="w-8 h-8 text-yellow-600 fill-yellow-600" />
                    </div>
                    <div className="text-4xl font-bold text-yellow-700 mb-1">
                        {summary.totalStars}
                    </div>
                    <div className="text-sm text-yellow-600 font-medium">Stars Earned</div>
                </div>

                {/* Coins */}
                <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-6 text-center">
                    <div className="flex justify-center mb-3">
                        <Coins className="w-8 h-8 text-amber-600" />
                    </div>
                    <div className="text-4xl font-bold text-amber-700 mb-1">
                        {summary.totalCoins}
                    </div>
                    <div className="text-sm text-amber-600 font-medium">Coins Earned</div>
                </div>
            </div>

            {/* Tier Classification (if available) */}
            {summary.tier && (
                <div className="mt-6">
                    <div className={`rounded-xl p-6 border-2 ${getTierColor(summary.tier)}`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <span className="text-4xl">{summary.tierEmoji}</span>
                                <div>
                                    <div className="text-sm font-medium opacity-75">Performance Level</div>
                                    <div className="text-xl font-bold">{summary.tierLabel}</div>
                                </div>
                            </div>
                            {summary.riskIndicator && (
                                <div className="text-right">
                                    <div className="text-sm font-medium opacity-75">Risk Level</div>
                                    <div className={`text-lg font-bold ${getRiskColor(summary.riskIndicator)}`}>
                                        {summary.riskIndicator}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Mastery Badge */}
            {summary.masteryAchieved && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                    className="mt-6 bg-gradient-to-r from-green-400 to-emerald-500 rounded-xl p-4 text-center"
                >
                    <div className="flex items-center justify-center space-x-2 text-white">
                        <Trophy className="w-6 h-6" />
                        <span className="text-lg font-bold">Skill Mastered!</span>
                        <Trophy className="w-6 h-6" />
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
}

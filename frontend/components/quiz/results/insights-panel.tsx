'use client';

import { motion } from 'framer-motion';
import { QuizResultsInsights } from '@/lib/quiz-results-api';
import { ErrorPattern } from '@/lib/types';
import { Sparkles, ThumbsUp, Target, Heart, TrendingUp } from 'lucide-react';

interface InsightsPanelProps {
    insights: QuizResultsInsights;
    errorPatterns: ErrorPattern;
}

export default function InsightsPanel({ insights, errorPatterns }: InsightsPanelProps) {
    const getTrendIcon = (trend: string) => {
        switch (trend) {
            case 'improving': return '📈';
            case 'stable': return '➡️';
            case 'declining': return '📉';
            default: return '📊';
        }
    };

    const getTrendColor = (trend: string) => {
        switch (trend) {
            case 'improving': return 'text-green-600';
            case 'stable': return 'text-blue-600';
            case 'declining': return 'text-orange-600';
            default: return 'text-gray-600';
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl shadow-lg p-8 border-2 border-purple-100"
        >
            <div className="flex items-center space-x-3 mb-6">
                <Sparkles className="w-8 h-8 text-purple-600" />
                <h2 className="text-2xl font-bold text-gray-800">AI Coach Insights</h2>
            </div>

            {/* Learning Trend */}
            <div className="mb-6 p-4 bg-white rounded-xl">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-sm text-gray-600 mb-1">Learning Trend</div>
                        <div className={`text-xl font-bold ${getTrendColor(insights.learningTrend)}`}>
                            {getTrendIcon(insights.learningTrend)} {insights.learningTrend.charAt(0).toUpperCase() + insights.learningTrend.slice(1)}
                        </div>
                    </div>
                    <TrendingUp className="w-8 h-8 text-purple-400" />
                </div>
            </div>

            {/* Strengths */}
            {insights.strengths.length > 0 && (
                <div className="mb-6">
                    <div className="flex items-center space-x-2 mb-3">
                        <ThumbsUp className="w-5 h-5 text-green-600" />
                        <h3 className="text-lg font-semibold text-gray-800">Strengths</h3>
                    </div>
                    <div className="space-y-2">
                        {insights.strengths.map((strength, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="flex items-start space-x-2 bg-white p-3 rounded-lg"
                            >
                                <span className="text-green-500 mt-0.5">✓</span>
                                <span className="text-gray-700">{strength}</span>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* Areas to Improve */}
            {insights.areasToImprove.length > 0 && (
                <div className="mb-6">
                    <div className="flex items-center space-x-2 mb-3">
                        <Target className="w-5 h-5 text-orange-600" />
                        <h3 className="text-lg font-semibold text-gray-800">Areas to Improve</h3>
                    </div>
                    <div className="space-y-2">
                        {insights.areasToImprove.map((area, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="flex items-start space-x-2 bg-white p-3 rounded-lg"
                            >
                                <span className="text-orange-500 mt-0.5">→</span>
                                <span className="text-gray-700">{area}</span>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* Specific Feedback */}
            {insights.specificFeedback && (
                <div className="mb-6 p-4 bg-white rounded-xl border-l-4 border-blue-500">
                    <h3 className="text-sm font-semibold text-blue-700 mb-2">Detailed Feedback</h3>
                    <p className="text-gray-700 leading-relaxed">{insights.specificFeedback}</p>
                </div>
            )}

            {/* Encouragement */}
            {insights.encouragement && (
                <motion.div
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: 'spring' }}
                    className="p-4 bg-gradient-to-r from-pink-100 to-purple-100 rounded-xl border-2 border-pink-200"
                >
                    <div className="flex items-start space-x-3">
                        <Heart className="w-6 h-6 text-pink-600 mt-1 flex-shrink-0" />
                        <div>
                            <h3 className="text-sm font-semibold text-pink-800 mb-1">Keep Going!</h3>
                            <p className="text-gray-700 leading-relaxed">{insights.encouragement}</p>
                        </div>
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
}

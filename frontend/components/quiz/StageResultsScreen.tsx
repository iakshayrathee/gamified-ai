'use client';

import { motion } from 'framer-motion';
import { Star, Trophy, TrendingUp, Target, AlertTriangle, CheckCircle, XCircle, Home, RotateCcw, ArrowRight, Eye, Brain, Zap, BarChart3 } from 'lucide-react';
import Link from 'next/link';

interface StageResultsScreenProps {
    // Overall metrics
    totalAttempts: number;
    correctAttempts: number;
    accuracy: number;
    avgResponseTime: number;
    starsEarned: number;
    coinsEarned: number;

    // Tier classification
    tier: 1 | 2 | 3;
    tierLabel: string;
    tierEmoji: string;
    riskIndicator: 'Low' | 'Medium' | 'High';

    // Word breakdown
    strengthWords: string[];
    strugglingWords: string[];
    needsPracticeWords: string[];

    // Error patterns
    errorPatterns: {
        visualConfusion: boolean;
        randomGuessing: boolean;
        slowProcessing: boolean;
        inconsistentPerformance: boolean;
        avoidanceBehavior: boolean;
    };

    // Recommendations
    recommendations: string[];
    recommendedGames: string[];
    readinessScore: number;

    // Navigation
    skillName: string;
    domainId: string;
    onPlayAgain: () => void;
    onViewFullReport?: () => void;
}

export default function StageResultsScreen({
    totalAttempts,
    correctAttempts,
    accuracy,
    avgResponseTime,
    starsEarned,
    coinsEarned,
    tier,
    tierLabel,
    tierEmoji,
    riskIndicator,
    strengthWords,
    strugglingWords,
    needsPracticeWords,
    errorPatterns,
    recommendations,
    recommendedGames,
    readinessScore,
    skillName,
    domainId,
    onPlayAgain,
    onViewFullReport
}: StageResultsScreenProps) {
    const masteryAchieved = tier === 1;

    // Get tier color
    const tierColor = tier === 1 ? 'green' : tier === 2 ? 'yellow' : 'red';
    const tierBgColor = tier === 1 ? 'bg-green-50' : tier === 2 ? 'bg-yellow-50' : 'bg-red-50';
    const tierBorderColor = tier === 1 ? 'border-green-300' : tier === 2 ? 'border-yellow-300' : 'border-red-300';
    const tierTextColor = tier === 1 ? 'text-green-800' : tier === 2 ? 'text-yellow-800' : 'text-red-800';

    // Get risk color
    const riskColor = riskIndicator === 'Low' ? 'green' : riskIndicator === 'Medium' ? 'yellow' : 'red';
    const riskBgColor = riskIndicator === 'Low' ? 'bg-green-100' : riskIndicator === 'Medium' ? 'bg-yellow-100' : 'bg-red-100';

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
                    {masteryAchieved ? '🎉' : tierEmoji}
                </motion.div>

                {/* Title */}
                <h2 className="text-3xl font-bold text-white drop-shadow-lg text-center">
                    {masteryAchieved ? 'Skill Mastered!' : 'Quiz Complete!'}
                </h2>
                <p className="text-lg text-white/90 drop-shadow-md text-center mb-2">
                    {skillName}
                </p>

                {/* Stats - Vertical Layout */}
                <div className="space-y-3">
                    <motion.div
                        whileHover={{ scale: 1.02, x: 5 }}
                        className="relative bg-gradient-to-br from-yellow-50 to-amber-50 backdrop-blur-sm rounded-2xl p-4 shadow-2xl border-2 border-yellow-200 overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 to-amber-400/20 rounded-2xl" />
                        <div className="relative z-10 flex items-center gap-3">
                            <Star className="w-10 h-10 text-yellow-500 fill-current drop-shadow-lg" />
                            <div className="flex-1">
                                <div className="text-sm text-gray-700 font-semibold">Stars Earned</div>
                                <div className="text-3xl font-bold bg-gradient-to-br from-yellow-600 to-amber-600 bg-clip-text text-transparent">{starsEarned.toFixed(1)} ⭐</div>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        whileHover={{ scale: 1.02, x: 5 }}
                        className="relative bg-gradient-to-br from-amber-50 to-orange-50 backdrop-blur-sm rounded-2xl p-4 shadow-2xl border-2 border-amber-200 overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-400/20 to-orange-400/20 rounded-2xl" />
                        <div className="relative z-10 flex items-center gap-3">
                            <Trophy className="w-10 h-10 text-amber-500 fill-current drop-shadow-lg" />
                            <div className="flex-1">
                                <div className="text-sm text-gray-700 font-semibold">Coins Collected</div>
                                <div className="text-3xl font-bold bg-gradient-to-br from-amber-600 to-orange-600 bg-clip-text text-transparent">{coinsEarned} 🏆</div>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        whileHover={{ scale: 1.02, x: 5 }}
                        className="relative bg-gradient-to-br from-green-50 to-emerald-50 backdrop-blur-sm rounded-2xl p-4 shadow-2xl border-2 border-green-200 overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-green-400/20 to-emerald-400/20 rounded-2xl" />
                        <div className="relative z-10 flex items-center gap-3">
                            <CheckCircle className="w-10 h-10 text-green-600 drop-shadow-lg" />
                            <div className="flex-1">
                                <div className="text-sm text-gray-700 font-semibold">Accuracy Score</div>
                                <div className="text-3xl font-bold bg-gradient-to-br from-green-600 to-emerald-600 bg-clip-text text-transparent">{accuracy}% 🎯</div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3 mt-4">
                    <motion.button
                        whileHover={{ scale: 1.05, boxShadow: "0 20px 25px -5px rgba(59, 130, 246, 0.5)" }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onPlayAgain}
                        className="w-full bg-gradient-to-r from-blue-500 via-blue-600 to-cyan-500 text-white px-6 py-3 rounded-full font-bold text-lg shadow-lg transition-all"
                    >
                        🔄 Play Again
                    </motion.button>

                    {onViewFullReport && (
                        <motion.button
                            whileHover={{ scale: 1.05, boxShadow: "0 20px 25px -5px rgba(168, 85, 247, 0.5)" }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onViewFullReport}
                            className="w-full bg-gradient-to-r from-purple-500 via-purple-600 to-pink-500 text-white px-6 py-3 rounded-full font-bold text-lg shadow-lg transition-all"
                        >
                            📊 View Full Report
                        </motion.button>
                    )}

                    <Link href={`/child/domain/${domainId}`} className="block">
                        <motion.button
                            whileHover={{ scale: 1.05, boxShadow: "0 20px 25px -5px rgba(249, 115, 22, 0.5)" }}
                            whileTap={{ scale: 0.95 }}
                            className="w-full bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 text-white px-6 py-3 rounded-full font-bold text-lg shadow-lg transition-all"
                        >
                            🚀 More Skills
                        </motion.button>
                    </Link>

                    <Link href="/child/domains" className="block">
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

            {/* MAIN CONTENT AREA - Detailed Results */}
            <div className="flex-1 flex flex-col p-6 relative z-10 overflow-y-auto">
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-4 max-w-4xl mx-auto w-full"
                >
                    {/* Tier Classification */}
                    <div className={`${tierBgColor} rounded-3xl p-6 shadow-2xl border-2 ${tierBorderColor}`}>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="text-6xl">{tierEmoji}</div>
                            <div>
                                <h3 className={`text-3xl font-bold ${tierTextColor}`}>Tier {tier}</h3>
                                <p className={`text-lg ${tierTextColor}`}>{tierLabel}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-4">
                            <div className="bg-white/50 rounded-xl p-4">
                                <div className="text-sm text-gray-600 mb-1">Readiness Score</div>
                                <div className="text-3xl font-bold text-purple-700">{readinessScore}%</div>
                                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                    <div
                                        className="bg-purple-600 h-2 rounded-full"
                                        style={{ width: `${readinessScore}%` }}
                                    />
                                </div>
                            </div>

                            <div className={`${riskBgColor} rounded-xl p-4`}>
                                <div className="text-sm text-gray-600 mb-1">Risk Level</div>
                                <div className="text-2xl font-bold capitalize">{riskIndicator}</div>
                                <div className="text-xs text-gray-600 mt-1">
                                    {riskIndicator === 'Low' ? '✓ On track' : riskIndicator === 'Medium' ? '⚠ Needs support' : '🚨 Intervention needed'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Word Performance */}
                    {(strengthWords.length > 0 || strugglingWords.length > 0 || needsPracticeWords.length > 0) && (
                        <div className="bg-white/30 backdrop-blur-lg rounded-3xl p-6 shadow-2xl border-2 border-white/50">
                            <h3 className="text-2xl font-bold text-purple-800 mb-4 flex items-center gap-2">
                                <BarChart3 className="w-6 h-6" />
                                Word Performance
                            </h3>

                            {/* Strength Words */}
                            {strengthWords.length > 0 && (
                                <div className="mb-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <TrendingUp className="w-5 h-5 text-green-600" />
                                        <h4 className="font-bold text-green-700 text-lg">Mastered Words ({strengthWords.length})</h4>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {strengthWords.map((word) => (
                                            <span key={word} className="bg-green-100 text-green-800 px-3 py-1 rounded-full font-semibold border-2 border-green-300">
                                                ✓ {word}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Needs Practice */}
                            {needsPracticeWords.length > 0 && (
                                <div className="mb-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Target className="w-5 h-5 text-yellow-600" />
                                        <h4 className="font-bold text-yellow-700 text-lg">Needs Practice ({needsPracticeWords.length})</h4>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {needsPracticeWords.map((word) => (
                                            <span key={word} className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full font-semibold border-2 border-yellow-300">
                                                📝 {word}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Struggling Words */}
                            {strugglingWords.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <AlertTriangle className="w-5 h-5 text-red-600" />
                                        <h4 className="font-bold text-red-700 text-lg">Focus On These ({strugglingWords.length})</h4>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {strugglingWords.map((word) => (
                                            <span key={word} className="bg-red-100 text-red-800 px-3 py-1 rounded-full font-semibold border-2 border-red-300">
                                                🚨 {word}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Error Patterns */}
                    {Object.values(errorPatterns).some(v => v) && (
                        <div className="bg-blue-50 rounded-3xl p-6 shadow-2xl border-2 border-blue-300">
                            <h3 className="text-2xl font-bold text-blue-800 mb-4 flex items-center gap-2">
                                <Brain className="w-6 h-6" />
                                Learning Patterns Detected
                            </h3>

                            <div className="grid grid-cols-2 gap-3">
                                {errorPatterns.visualConfusion && (
                                    <div className="bg-white/70 rounded-xl p-3 flex items-center gap-2">
                                        <Eye className="w-5 h-5 text-blue-600" />
                                        <span className="text-sm font-semibold">Visual Confusion</span>
                                    </div>
                                )}
                                {errorPatterns.randomGuessing && (
                                    <div className="bg-white/70 rounded-xl p-3 flex items-center gap-2">
                                        <Target className="w-5 h-5 text-orange-600" />
                                        <span className="text-sm font-semibold">Random Guessing</span>
                                    </div>
                                )}
                                {errorPatterns.slowProcessing && (
                                    <div className="bg-white/70 rounded-xl p-3 flex items-center gap-2">
                                        <Zap className="w-5 h-5 text-yellow-600" />
                                        <span className="text-sm font-semibold">Slow Processing</span>
                                    </div>
                                )}
                                {errorPatterns.inconsistentPerformance && (
                                    <div className="bg-white/70 rounded-xl p-3 flex items-center gap-2">
                                        <BarChart3 className="w-5 h-5 text-purple-600" />
                                        <span className="text-sm font-semibold">Inconsistent Performance</span>
                                    </div>
                                )}
                                {errorPatterns.avoidanceBehavior && (
                                    <div className="bg-white/70 rounded-xl p-3 flex items-center gap-2">
                                        <XCircle className="w-5 h-5 text-red-600" />
                                        <span className="text-sm font-semibold">Avoidance Behavior</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Recommendations */}
                    {recommendations.length > 0 && (
                        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-6 shadow-2xl border-2 border-purple-300">
                            <h3 className="text-2xl font-bold text-purple-800 mb-4">💡 Recommendations</h3>
                            <ul className="space-y-2">
                                {recommendations.map((rec, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                        <span className="text-purple-600 mt-1">•</span>
                                        <span className="text-gray-800">{rec}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Recommended Games */}
                    {recommendedGames.length > 0 && (
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl p-6 shadow-2xl border-2 border-green-300">
                            <h3 className="text-2xl font-bold text-green-800 mb-4">🎮 Try These Games Next</h3>
                            <div className="flex flex-wrap gap-2">
                                {recommendedGames.map((game, i) => (
                                    <span key={i} className="bg-white px-4 py-2 rounded-full font-semibold text-green-700 border-2 border-green-300">
                                        {game}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}

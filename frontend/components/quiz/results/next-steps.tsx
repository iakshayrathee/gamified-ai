'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { QuizResultsRecommendations } from '@/lib/quiz-results-api';
import { ArrowRight, Calendar, Gamepad2, Target, AlertCircle, Home, RotateCcw } from 'lucide-react';

interface NextStepsProps {
    recommendations: QuizResultsRecommendations;
    domainId: string;
    onPlayAgain: () => void;
    onBackToDomains: () => void;
}

export default function NextSteps({ recommendations, domainId, onPlayAgain, onBackToDomains }: NextStepsProps) {
    const router = useRouter();

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high': return 'bg-red-100 text-red-800 border-red-300';
            case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
            case 'low': return 'bg-green-100 text-green-800 border-green-300';
            default: return 'bg-gray-100 text-gray-800 border-gray-300';
        }
    };

    const getGameTypeIcon = (type: string) => {
        switch (type) {
            case 'flashcard': return '🃏';
            case 'matching': return '🎯';
            case 'spelling': return '✍️';
            case 'context': return '📖';
            default: return '🎮';
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gray-100 space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">🎯 Next Steps</h2>

            {/* Next Skill Recommendation */}
            {recommendations.nextSkill && (
                <div className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border-2 border-purple-200">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-1">Recommended Next Skill</h3>
                            <div className="text-2xl font-bold text-purple-700">{recommendations.nextSkill.skillName}</div>
                            <div className="text-sm text-gray-600 mt-1">{recommendations.nextSkill.skillCode}</div>
                        </div>
                        <div className="text-right">
                            <div className="text-sm text-gray-600">Confidence</div>
                            <div className="text-xl font-bold text-purple-600">{Math.round(recommendations.nextSkill.confidence * 100)}%</div>
                        </div>
                    </div>
                    <p className="text-gray-700 mb-4">{recommendations.nextSkill.reason}</p>
                    <button
                        onClick={() => router.push(`/child/play/${recommendations.nextSkill!.skillId}`)}
                        className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2"
                    >
                        <span>Start This Skill</span>
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </div>
            )}

            {/* Recommended Games */}
            {recommendations.recommendedGames.length > 0 && (
                <div>
                    <div className="flex items-center space-x-2 mb-4">
                        <Gamepad2 className="w-6 h-6 text-blue-600" />
                        <h3 className="text-lg font-semibold text-gray-800">Recommended Practice Games</h3>
                    </div>
                    <div className="space-y-3">
                        {recommendations.recommendedGames.map((game, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className={`p-4 rounded-lg border-2 ${getPriorityColor(game.priority)}`}
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center space-x-2">
                                        <span className="text-2xl">{getGameTypeIcon(game.gameType)}</span>
                                        <div>
                                            <div className="font-semibold">{game.gameName}</div>
                                            <div className="text-xs opacity-75 capitalize">{game.gameType} • {game.estimatedDuration} min</div>
                                        </div>
                                    </div>
                                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-white bg-opacity-50">
                                        {game.priority} priority
                                    </span>
                                </div>
                                <p className="text-sm mb-2">{game.reason}</p>
                                {game.targetWords.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {game.targetWords.slice(0, 5).map((word, widx) => (
                                            <span key={widx} className="text-xs px-2 py-1 bg-white bg-opacity-70 rounded">
                                                {word}
                                            </span>
                                        ))}
                                        {game.targetWords.length > 5 && (
                                            <span className="text-xs px-2 py-1 bg-white bg-opacity-70 rounded">
                                                +{game.targetWords.length - 5} more
                                            </span>
                                        )}
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* Focus Areas */}
            {recommendations.focusAreas.length > 0 && (
                <div>
                    <div className="flex items-center space-x-2 mb-3">
                        <Target className="w-6 h-6 text-orange-600" />
                        <h3 className="text-lg font-semibold text-gray-800">Focus Areas</h3>
                    </div>
                    <div className="space-y-2">
                        {recommendations.focusAreas.map((area, idx) => (
                            <div key={idx} className="flex items-start space-x-2 p-3 bg-orange-50 rounded-lg">
                                <span className="text-orange-500 mt-0.5">•</span>
                                <span className="text-gray-700">{area}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Spaced Repetition Schedule */}
            {recommendations.repetitionSchedule.length > 0 && (
                <div>
                    <div className="flex items-center space-x-2 mb-3">
                        <Calendar className="w-6 h-6 text-purple-600" />
                        <h3 className="text-lg font-semibold text-gray-800">Practice Schedule</h3>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-3">Review these words on the suggested dates for best results:</p>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {recommendations.repetitionSchedule.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2 bg-white rounded">
                                    <div className="flex items-center space-x-3">
                                        <span className="font-medium text-purple-700">{item.word}</span>
                                        <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                                            {item.frequency}
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-600">
                                        {new Date(item.nextReviewDate).toLocaleDateString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Interventions (if needed) */}
            {recommendations.interventions.length > 0 && (
                <div className="p-4 bg-red-50 rounded-lg border-2 border-red-200">
                    <div className="flex items-start space-x-3">
                        <AlertCircle className="w-6 h-6 text-red-600 mt-1 flex-shrink-0" />
                        <div>
                            <h3 className="text-lg font-semibold text-red-800 mb-2">Recommended Interventions</h3>
                            <div className="space-y-1">
                                {recommendations.interventions.map((intervention, idx) => (
                                    <div key={idx} className="text-sm text-red-700">• {intervention}</div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                <button
                    onClick={onPlayAgain}
                    className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2"
                >
                    <RotateCcw className="w-5 h-5" />
                    <span>Practice Again</span>
                </button>
                <button
                    onClick={onBackToDomains}
                    className="flex-1 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2"
                >
                    <Home className="w-5 h-5" />
                    <span>Back to Skills</span>
                </button>
            </div>
        </div>
    );
}

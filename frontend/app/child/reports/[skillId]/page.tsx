'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    ArrowLeft, Download, TrendingUp, TrendingDown, AlertTriangle,
    CheckCircle, XCircle, Clock, Target, Brain, Award, BarChart3
} from 'lucide-react';

interface WordMastery {
    word: string;
    accuracyPercentage: number;
    totalAttempts: number;
    correctAttempts: number;
    avgResponseTime: number;
    tier: 1 | 2 | 3;
    tierLabel: string;
    errorPatterns: string[];
}

interface AIInsights {
    tier: 1 | 2 | 3;
    tierLabel: string;
    tierEmoji: string;
    tierDescription: string;
    errorPatterns: string[];
    riskIndicator: 'low' | 'medium' | 'high';
    wordsAttempted: number;
    wordsMastered: number;
    isBaselineDiagnostic?: boolean;
}

interface SkillProgress {
    accuracyPercentage: number;
    totalAttempts: number;
    correctAttempts: number;
    avgResponseTime: number;
    aiInsights?: string | AIInsights;
    microSkill: {
        name: string;
        code: string;
    };
}

export default function SkillReportPage() {
    const params = useParams();
    const router = useRouter();
    const skillId = params.skillId as string;
    const childId = typeof window !== 'undefined' ? localStorage.getItem('childId') : null;

    const [wordMastery, setWordMastery] = useState<WordMastery[]>([]);
    const [skillProgress, setSkillProgress] = useState<SkillProgress | null>(null);
    const [aiInsights, setAIInsights] = useState<AIInsights | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (childId && skillId) {
            fetchReportData();
        }
    }, [childId, skillId]);

    const fetchReportData = async () => {
        try {
            const response = await fetch(`http://localhost:5000/api/child/${childId}/word-mastery/${skillId}`);
            const data = await response.json();

            setWordMastery(data.wordMastery || []);

            // Get skill progress
            const progressResponse = await fetch(`http://localhost:5000/api/child/${childId}/progress`);
            const progressData = await progressResponse.json();
            const skill = progressData.skillProgress.find((sp: any) => sp.microSkillId === skillId);

            if (skill) {
                setSkillProgress(skill);

                // Parse AI insights
                if (skill.aiInsights) {
                    const insights = typeof skill.aiInsights === 'string'
                        ? JSON.parse(skill.aiInsights)
                        : skill.aiInsights;
                    setAIInsights(insights);
                }
            }

            setLoading(false);
        } catch (error) {
            console.error('Error fetching report data:', error);
            setLoading(false);
        }
    };

    const exportData = () => {
        const exportData = {
            skillName: skillProgress?.microSkill.name,
            skillCode: skillProgress?.microSkill.code,
            exportDate: new Date().toISOString(),
            overallAccuracy: skillProgress?.accuracyPercentage,
            totalAttempts: skillProgress?.totalAttempts,
            aiInsights,
            wordMastery
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `skill-report-${skillId}-${Date.now()}.json`;
        a.click();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
                <div className="text-2xl font-bold text-purple-800">Loading report...</div>
            </div>
        );
    }

    const strengthWords = wordMastery.filter(w => w.tier === 1);
    const strugglingWords = wordMastery.filter(w => w.tier === 3);
    const needsPracticeWords = wordMastery.filter(w => w.tier === 2);

    const errorPatternCounts = wordMastery.reduce((acc, word) => {
        word.errorPatterns?.forEach(pattern => {
            acc[pattern] = (acc[pattern] || 0) + 1;
        });
        return acc;
    }, {} as Record<string, number>);

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="p-2 hover:bg-white/50 rounded-full transition-colors"
                        >
                            <ArrowLeft className="w-6 h-6 text-purple-800" />
                        </button>
                        <div>
                            <h1 className="text-4xl font-bold text-purple-800">
                                📊 {skillProgress?.microSkill.name} Report
                            </h1>
                            <p className="text-gray-600">Comprehensive performance analysis</p>
                        </div>
                    </div>

                    <button
                        onClick={exportData}
                        className="flex items-center gap-2 bg-blue-500 text-white px-6 py-3 rounded-full hover:bg-blue-600 transition-colors font-semibold shadow-lg"
                    >
                        <Download className="w-5 h-5" />
                        Export Data
                    </button>
                </div>

                {/* AI Insights Panel */}
                {aiInsights && (
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="bg-white rounded-3xl p-8 shadow-xl mb-6"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <Brain className="w-8 h-8 text-purple-600" />
                            <h2 className="text-3xl font-bold text-purple-800">AI Insights</h2>
                            {aiInsights.isBaselineDiagnostic && (
                                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                                    Baseline Diagnostic
                                </span>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Tier Classification */}
                            <div className={`p-6 rounded-2xl ${aiInsights.tier === 1 ? 'bg-green-50 border-2 border-green-300' :
                                    aiInsights.tier === 2 ? 'bg-yellow-50 border-2 border-yellow-300' :
                                        'bg-red-50 border-2 border-red-300'
                                }`}>
                                <div className="text-5xl mb-2">{aiInsights.tierEmoji}</div>
                                <div className="text-2xl font-bold mb-1">Tier {aiInsights.tier}</div>
                                <div className="text-sm font-semibold mb-2">{aiInsights.tierLabel}</div>
                                <div className="text-xs text-gray-600">{aiInsights.tierDescription}</div>
                            </div>

                            {/* Risk Indicator */}
                            <div className={`p-6 rounded-2xl ${aiInsights.riskIndicator === 'low' ? 'bg-green-50' :
                                    aiInsights.riskIndicator === 'medium' ? 'bg-yellow-50' :
                                        'bg-red-50'
                                }`}>
                                <AlertTriangle className={`w-8 h-8 mb-2 ${aiInsights.riskIndicator === 'low' ? 'text-green-600' :
                                        aiInsights.riskIndicator === 'medium' ? 'text-yellow-600' :
                                            'text-red-600'
                                    }`} />
                                <div className="text-xl font-bold mb-1">Risk Level</div>
                                <div className="text-2xl font-bold capitalize">{aiInsights.riskIndicator}</div>
                            </div>

                            {/* Progress Stats */}
                            <div className="p-6 rounded-2xl bg-purple-50">
                                <Target className="w-8 h-8 text-purple-600 mb-2" />
                                <div className="text-xl font-bold mb-1">Progress</div>
                                <div className="text-sm text-gray-600 mb-2">
                                    {aiInsights.wordsMastered} / {aiInsights.wordsAttempted} words mastered
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3">
                                    <div
                                        className="bg-purple-600 h-3 rounded-full transition-all"
                                        style={{ width: `${(aiInsights.wordsMastered / aiInsights.wordsAttempted) * 100}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Error Pattern Dashboard */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-3xl p-8 shadow-xl mb-6"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <BarChart3 className="w-8 h-8 text-red-600" />
                        <h2 className="text-3xl font-bold text-purple-800">Error Pattern Analysis</h2>
                    </div>

                    {Object.keys(errorPatternCounts).length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {Object.entries(errorPatternCounts).map(([pattern, count]) => (
                                <div key={pattern} className="bg-red-50 p-4 rounded-xl border-2 border-red-200">
                                    <div className="text-sm text-gray-600 mb-1">{pattern.replace(/_/g, ' ')}</div>
                                    <div className="text-3xl font-bold text-red-600">{count}</div>
                                    <div className="text-xs text-gray-500">occurrences</div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
                            <p className="text-lg font-semibold">No error patterns detected!</p>
                            <p className="text-sm">Excellent performance across all words</p>
                        </div>
                    )}
                </motion.div>

                {/* Word Mastery Grid */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-3xl p-8 shadow-xl mb-6"
                >
                    <h2 className="text-3xl font-bold text-purple-800 mb-6">Word Mastery Overview</h2>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-green-50 p-6 rounded-2xl border-2 border-green-300">
                            <Award className="w-8 h-8 text-green-600 mb-2" />
                            <div className="text-xl font-bold mb-1">Strength Words</div>
                            <div className="text-4xl font-bold text-green-600">{strengthWords.length}</div>
                            <div className="text-sm text-gray-600">Tier 1 - Mastered</div>
                        </div>

                        <div className="bg-yellow-50 p-6 rounded-2xl border-2 border-yellow-300">
                            <Clock className="w-8 h-8 text-yellow-600 mb-2" />
                            <div className="text-xl font-bold mb-1">Needs Practice</div>
                            <div className="text-4xl font-bold text-yellow-600">{needsPracticeWords.length}</div>
                            <div className="text-sm text-gray-600">Tier 2 - Progressing</div>
                        </div>

                        <div className="bg-red-50 p-6 rounded-2xl border-2 border-red-300">
                            <AlertTriangle className="w-8 h-8 text-red-600 mb-2" />
                            <div className="text-xl font-bold mb-1">Struggling Words</div>
                            <div className="text-4xl font-bold text-red-600">{strugglingWords.length}</div>
                            <div className="text-sm text-gray-600">Tier 3 - Needs Help</div>
                        </div>
                    </div>

                    {/* Word Lists */}
                    <div className="space-y-6">
                        {/* Struggling Words - Priority */}
                        {strugglingWords.length > 0 && (
                            <div>
                                <h3 className="text-xl font-bold text-red-600 mb-3 flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5" />
                                    Priority: Struggling Words (Tier 3)
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {strugglingWords.map(word => (
                                        <div key={word.word} className="bg-red-100 px-4 py-2 rounded-full border-2 border-red-300">
                                            <span className="font-bold text-red-800">{word.word}</span>
                                            <span className="text-sm text-red-600 ml-2">
                                                {word.accuracyPercentage.toFixed(0)}%
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Needs Practice */}
                        {needsPracticeWords.length > 0 && (
                            <div>
                                <h3 className="text-xl font-bold text-yellow-600 mb-3">Needs More Practice (Tier 2)</h3>
                                <div className="flex flex-wrap gap-2">
                                    {needsPracticeWords.map(word => (
                                        <div key={word.word} className="bg-yellow-100 px-4 py-2 rounded-full border-2 border-yellow-300">
                                            <span className="font-bold text-yellow-800">{word.word}</span>
                                            <span className="text-sm text-yellow-600 ml-2">
                                                {word.accuracyPercentage.toFixed(0)}%
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Strength Words */}
                        {strengthWords.length > 0 && (
                            <div>
                                <h3 className="text-xl font-bold text-green-600 mb-3 flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5" />
                                    Mastered Words (Tier 1)
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {strengthWords.map(word => (
                                        <div key={word.word} className="bg-green-100 px-4 py-2 rounded-full border-2 border-green-300">
                                            <span className="font-bold text-green-800">{word.word}</span>
                                            <span className="text-sm text-green-600 ml-2">⭐</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Overall Performance */}
                {skillProgress && (
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white rounded-3xl p-8 shadow-xl"
                    >
                        <h2 className="text-3xl font-bold text-purple-800 mb-6">Overall Performance</h2>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-purple-50 p-6 rounded-2xl">
                                <div className="text-sm text-gray-600 mb-2">Overall Accuracy</div>
                                <div className="text-4xl font-bold text-purple-600">
                                    {skillProgress.accuracyPercentage.toFixed(1)}%
                                </div>
                                <div className="text-sm text-gray-500 mt-2">
                                    {skillProgress.correctAttempts} / {skillProgress.totalAttempts} correct
                                </div>
                            </div>

                            <div className="bg-blue-50 p-6 rounded-2xl">
                                <div className="text-sm text-gray-600 mb-2">Avg Response Time</div>
                                <div className="text-4xl font-bold text-blue-600">
                                    {skillProgress.avgResponseTime.toFixed(1)}s
                                </div>
                                <div className="text-sm text-gray-500 mt-2">
                                    Per question
                                </div>
                            </div>

                            <div className="bg-indigo-50 p-6 rounded-2xl">
                                <div className="text-sm text-gray-600 mb-2">Total Attempts</div>
                                <div className="text-4xl font-bold text-indigo-600">
                                    {skillProgress.totalAttempts}
                                </div>
                                <div className="text-sm text-gray-500 mt-2">
                                    Questions answered
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}

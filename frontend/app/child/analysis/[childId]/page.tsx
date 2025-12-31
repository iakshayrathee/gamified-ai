'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, TrendingUp, TrendingDown, Minus, Brain, Target, Clock, Zap, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { ApiClient } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

interface ChildAnalysisPageProps {
    params: Promise<{
        childId: string;
    }>;
}

interface SkillAnalysis {
    skillId: string;
    skillName: string;
    skillCode: string;
    domainName: string;
    masteryStatus: string;
    accuracy: number;
    avgResponseTime: number;
    totalAttempts: number;
    correctAttempts: number;
    currentDifficulty: number;
    recommendedDifficulty: number;
    confusionPatterns: string[];
    learningTrend: string | null;
    aiInsights: string[];
    lastAttempted: string | null;
}

export default function ChildAnalysisPage({ params }: ChildAnalysisPageProps) {
    const { childId } = use(params);
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();

    const [skillsAnalysis, setSkillsAnalysis] = useState<SkillAnalysis[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedDomain, setSelectedDomain] = useState<string>('all');
    const [domains, setDomains] = useState<string[]>([]);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login/child');
        }
    }, [authLoading, user, router]);

    useEffect(() => {
        if (childId && !authLoading) {
            loadAnalysisData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [childId, authLoading]);

    async function loadAnalysisData() {
        try {
            setLoading(true);
            setError(null);

            const progressData = await ApiClient.getChildProgress(childId);

            const analysis: SkillAnalysis[] = progressData.skillProgress.map(sp => ({
                skillId: sp.microSkillId,
                skillName: sp.microSkill.name,
                skillCode: sp.microSkill.code,
                domainName: sp.microSkill.domain.name,
                masteryStatus: sp.masteryStatus,
                accuracy: sp.accuracyPercentage,
                avgResponseTime: sp.avgResponseTime,
                totalAttempts: sp.totalAttempts,
                correctAttempts: sp.correctAttempts,
                currentDifficulty: sp.currentDifficultyLevel,
                recommendedDifficulty: (sp as any).recommendedDifficulty || sp.currentDifficultyLevel,
                confusionPatterns: (sp as any).confusionPatterns || [],
                learningTrend: (sp as any).learningTrend || null,
                aiInsights: (sp as any).aiInsights || [],
                lastAttempted: sp.lastAttemptedAt,
            }));

            setSkillsAnalysis(analysis);

            // Extract unique domains
            const uniqueDomains = [...new Set(analysis.map(a => a.domainName))];
            setDomains(uniqueDomains);

        } catch (err) {
            console.error('Error loading analysis:', err);
            setError('Failed to load analysis data');
        } finally {
            setLoading(false);
        }
    }

    const filteredSkills = selectedDomain === 'all'
        ? skillsAnalysis
        : skillsAnalysis.filter(s => s.domainName === selectedDomain);

    const getTrendIcon = (trend: string | null) => {
        if (trend === 'improving') return <TrendingUp className="w-5 h-5 text-green-500" />;
        if (trend === 'declining') return <TrendingDown className="w-5 h-5 text-red-500" />;
        return <Minus className="w-5 h-5 text-gray-400" />;
    };

    const getMasteryColor = (status: string) => {
        if (status === 'MASTERED') return 'bg-green-100 text-green-800 border-green-300';
        if (status === 'IN_PROGRESS') return 'bg-blue-100 text-blue-800 border-blue-300';
        return 'bg-gray-100 text-gray-800 border-gray-300';
    };

    const getDifficultyBadge = (level: number) => {
        const colors = ['bg-green-500', 'bg-yellow-500', 'bg-red-500'];
        const labels = ['Easy', 'Medium', 'Hard'];
        return (
            <span className={`px-3 py-1 rounded-full text-white text-sm font-bold ${colors[level - 1]}`}>
                {labels[level - 1]}
            </span>
        );
    };

    if (loading || authLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
                <div className="text-2xl font-bold text-purple-800">Loading analysis...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-6">
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-6">
            {/* Header */}
            <div className="max-w-7xl mx-auto mb-8">
                <Link href="/child/domains">
                    <button className="flex items-center gap-2 text-purple-700 hover:text-purple-900 font-bold text-lg mb-4">
                        <ArrowLeft className="w-6 h-6" />
                        Back to Domains
                    </button>
                </Link>

                <div className="bg-white rounded-3xl p-8 shadow-xl">
                    <div className="flex items-center gap-4 mb-4">
                        <Brain className="w-12 h-12 text-purple-600" />
                        <div>
                            <h1 className="text-4xl font-bold text-purple-900">Learning Analysis</h1>
                            <p className="text-lg text-gray-600">Detailed insights for every skill</p>
                        </div>
                    </div>

                    {/* Domain Filter */}
                    <div className="flex flex-wrap gap-3 mt-6">
                        <button
                            onClick={() => setSelectedDomain('all')}
                            className={`px-6 py-3 rounded-full font-bold transition-all ${selectedDomain === 'all'
                                ? 'bg-purple-600 text-white shadow-lg scale-105'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                        >
                            All Domains
                        </button>
                        {domains.map(domain => (
                            <button
                                key={domain}
                                onClick={() => setSelectedDomain(domain)}
                                className={`px-6 py-3 rounded-full font-bold transition-all ${selectedDomain === domain
                                    ? 'bg-purple-600 text-white shadow-lg scale-105'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                            >
                                {domain}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Skills Analysis Grid */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredSkills.map((skill, index) => (
                    <motion.div
                        key={skill.skillId}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-white rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all"
                    >
                        {/* Skill Header */}
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-sm font-bold text-purple-600">{skill.skillCode}</span>
                                    {getTrendIcon(skill.learningTrend)}
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-1">{skill.skillName}</h3>
                                <p className="text-sm text-gray-600">{skill.domainName}</p>
                            </div>
                            <span className={`px-4 py-2 rounded-full text-sm font-bold border-2 ${getMasteryColor(skill.masteryStatus)}`}>
                                {skill.masteryStatus.replace('_', ' ')}
                            </span>
                        </div>

                        {/* Metrics Grid */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="bg-purple-50 rounded-2xl p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Target className="w-5 h-5 text-purple-600" />
                                    <span className="text-sm font-bold text-gray-700">Accuracy</span>
                                </div>
                                <p className="text-3xl font-bold text-purple-900">{skill.accuracy.toFixed(0)}%</p>
                                <p className="text-xs text-gray-600">{skill.correctAttempts}/{skill.totalAttempts} correct</p>
                            </div>

                            <div className="bg-blue-50 rounded-2xl p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Clock className="w-5 h-5 text-blue-600" />
                                    <span className="text-sm font-bold text-gray-700">Avg Time</span>
                                </div>
                                <p className="text-3xl font-bold text-blue-900">{skill.avgResponseTime.toFixed(1)}s</p>
                                <p className="text-xs text-gray-600">per question</p>
                            </div>
                        </div>

                        {/* Difficulty Levels */}
                        <div className="bg-gray-50 rounded-2xl p-4 mb-4">
                            <div className="flex items-center gap-2 mb-3">
                                <Zap className="w-5 h-5 text-yellow-600" />
                                <span className="text-sm font-bold text-gray-700">Difficulty Levels</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-gray-600 mb-1">Current</p>
                                    {getDifficultyBadge(skill.currentDifficulty)}
                                </div>
                                {skill.recommendedDifficulty !== skill.currentDifficulty && (
                                    <>
                                        <div className="text-gray-400">→</div>
                                        <div>
                                            <p className="text-xs text-gray-600 mb-1">AI Recommended</p>
                                            {getDifficultyBadge(skill.recommendedDifficulty)}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Confusion Patterns */}
                        {skill.confusionPatterns.length > 0 && (
                            <div className="bg-orange-50 rounded-2xl p-4 mb-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <AlertCircle className="w-5 h-5 text-orange-600" />
                                    <span className="text-sm font-bold text-gray-700">Confusion Patterns</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {skill.confusionPatterns.map((pattern, idx) => (
                                        <span key={idx} className="px-3 py-1 bg-orange-200 text-orange-800 rounded-full text-xs font-bold">
                                            {pattern.replace('_', '/')}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* AI Insights */}
                        {skill.aiInsights.length > 0 && (
                            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Brain className="w-5 h-5 text-purple-600" />
                                    <span className="text-sm font-bold text-gray-700">AI Insights</span>
                                </div>
                                <ul className="space-y-1">
                                    {skill.aiInsights.map((insight, idx) => (
                                        <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                                            <span className="text-purple-600 mt-1">•</span>
                                            <span>{insight}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Last Attempted */}
                        {skill.lastAttempted && (
                            <p className="text-xs text-gray-500 mt-4">
                                Last practiced: {new Date(skill.lastAttempted).toLocaleDateString()}
                            </p>
                        )}
                    </motion.div>
                ))}
            </div>

            {filteredSkills.length === 0 && (
                <div className="max-w-7xl mx-auto text-center py-12">
                    <p className="text-2xl text-gray-600">No skills found for this domain</p>
                </div>
            )}
        </div>
    );
}

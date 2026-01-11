'use client';

import { use, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, CheckCircle, PlayCircle, ArrowLeft, Info, X } from 'lucide-react';
import Link from 'next/link';
import { MicroSkill, SkillProgress } from '@/lib/api-client';
import { getSkillStatus } from '@/lib/api-client';
import FloatingShapes from '@/components/ui/FloatingShapes';
import ChildNavbar from '@/components/navigation/ChildNavbar';
import { useAuth } from '@/lib/auth-context';
import { useChildProgress } from '@/lib/hooks/useApi';

interface SkillSelectionPageProps {
    params: Promise<{
        domainId: string;
    }>;
}

export default function SkillSelectionPage({ params }: SkillSelectionPageProps) {
    const { domainId } = use(params);
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const childId = user?.id;

    const { data: progress, isLoading: progressLoading, error: progressError } = useChildProgress(childId || '');

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login/child');
        }
    }, [authLoading, user, router]);

    // Process skills from progress data
    const skills = progress?.allSkills.filter(skill => skill.domainId === domainId) || [];
    const skillProgress = progress?.skillProgress || [];
    const allSkills = progress?.allSkills || [];
    const domain = skills.length > 0 ? skills[0].domain : null;
    const domainName = domain?.name || '';
    const domainCode = domain?.code || '';

    const loading = authLoading || progressLoading;
    const error = progressError ? 'Failed to load skills' : null;

    const [showTierInfo, setShowTierInfo] = useState(false);
    const [showReport, setShowReport] = useState(false);
    const [reportData, setReportData] = useState<any>(null);
    const [loadingReport, setLoadingReport] = useState(false);

    // Fetch report data when modal opens
    const hasLoadedReportRef = useRef(false);

    useEffect(() => {
        console.log('📊 Report useEffect triggered:', {
            showReport,
            hasLoadedBefore: hasLoadedReportRef.current,
            childId,
            skillsCount: skills.length
        });

        if (!showReport) {
            // Reset when modal closes
            hasLoadedReportRef.current = false;
            setReportData(null);
            return;
        }

        if (hasLoadedReportRef.current || !childId) {
            console.log('⏭️ Skipping report fetch:', {
                reason: hasLoadedReportRef.current ? 'already loaded' : 'no childId'
            });
            return;
        }

        const fetchReportData = async () => {
            console.log('🔍 Fetching report data...');
            // Find any Recognition skill (list-based: RF.1.1, RF.2.1, RF.3.1, RF.4.1)
            const recognitionSkill = skills.find((s: MicroSkill) => s.code.match(/^RF\.[1-4]\.1$/));
            if (!recognitionSkill) {
                console.log('❌ No recognition skill found in skills:', skills.map(s => s.code));
                return;
            }

            console.log('✅ Recognition skill found:', { id: recognitionSkill.id, code: recognitionSkill.code });
            setLoadingReport(true);
            hasLoadedReportRef.current = true; // Mark as loaded before fetch

            try {
                const url = `http://localhost:5000/api/child/${childId}/word-mastery/${recognitionSkill.id}`;
                console.log('🌐 Fetching from:', url);

                const response = await fetch(url);
                const data = await response.json();
                console.log('📦 Word mastery data received:', data);

                // Get AI insights from skill progress
                const skillProg = skillProgress.find(sp => sp.microSkillId === recognitionSkill.id);
                let aiInsights = null;
                if (skillProg?.aiInsights) {
                    aiInsights = typeof skillProg.aiInsights === 'string'
                        ? JSON.parse(skillProg.aiInsights)
                        : skillProg.aiInsights;
                }

                console.log('🧠 AI Insights:', aiInsights);

                setReportData({
                    wordMastery: data.wordMastery || [],
                    skillProgress: skillProg,
                    aiInsights
                });
                console.log('✅ Report data set successfully');
            } catch (error) {
                console.error('❌ Error fetching report:', error);
                hasLoadedReportRef.current = false; // Reset on error
            } finally {
                setLoadingReport(false);
            }
        };

        fetchReportData();
    }, [showReport, childId, skills, skillProgress]);


    if (loading || authLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400 flex items-center justify-center">
                <div className="text-white text-4xl font-bold">Loading...</div>
            </div>
        );
    }

    if (!user || !childId) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400 flex items-center justify-center">
                <div className="text-white text-4xl font-bold">Redirecting to login...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400 flex items-center justify-center">
                <div className="text-white text-2xl">{error}</div>
            </div>
        );
    }

    // Check if this is the Reading Foundation domain
    if (domainCode === 'RF') {
        // Get all Recognition skills (list-based: RF.1.1, RF.2.1, RF.3.1, RF.4.1)
        // Get all Recall skills (list-based: RF.1.3, RF.2.3, RF.3.3, RF.4.3)
        // Get unified skills (RF.ALL.2, RF.ALL.4, RF.ALL.5)
        const recognitionSkills = skills.filter(s => s.code.match(/^RF\.[1-4]\.1$/));
        const recallSkills = skills.filter(s => s.code.match(/^RF\.[1-4]\.3$/));
        const unifiedSkills = skills.filter(s => s.code.startsWith('RF.ALL.'));
        const allRFSkills = [...recognitionSkills, ...recallSkills, ...unifiedSkills];

        // Map skills to display format
        const skillsToDisplay = allRFSkills.map(skill => {
            const prog = skillProgress.find(sp => sp.microSkillId === skill.id);

            // Get tier from aiInsights if available
            let tier: 1 | 2 | 3 | undefined = undefined;
            let wordsAttempted = 0;
            let wordsMastered = 0;

            if (prog?.aiInsights) {
                try {
                    const insights = typeof prog.aiInsights === 'string'
                        ? JSON.parse(prog.aiInsights)
                        : prog.aiInsights;
                    tier = insights.tier;
                    wordsAttempted = insights.wordsAttempted || 0;
                    wordsMastered = insights.wordsMastered || 0;
                } catch (e) {
                    console.error('Failed to parse aiInsights:', e);
                }
            }

            return {
                id: skill.id,
                code: skill.code,
                name: skill.name,
                isUnlocked: true,
                isCompleted: prog?.masteryStatus === 'MASTERED',
                progress: prog ? Math.round(prog.accuracyPercentage) : 0,
                tier,
                wordsAttempted,
                wordsMastered,
                totalAttempts: prog?.totalAttempts || 0
            };
        });

        // Sort by code to ensure correct order
        skillsToDisplay.sort((a, b) => a.code.localeCompare(b.code));

        return (
            <>
                <ChildNavbar />
                <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 pt-24 p-6 relative">
                    <div className="max-w-6xl mx-auto">
                        {/* Header */}
                        <motion.div
                            initial={{ y: -50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="mb-12"
                        >
                            {/* Title and Buttons Row */}
                            <div className="flex items-center justify-between mb-4">
                                <h1 className="text-6xl font-bold text-purple-800">
                                    📚 Reading Foundation
                                </h1>

                                <div className="flex items-center gap-3">
                                    {/* View Report Button */}
                                    <motion.button
                                        onClick={() => {
                                            console.log('View Report clicked, setting showReport to true');
                                            setShowReport(true);
                                        }}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="inline-flex items-center gap-2 bg-green-500 text-white px-6 py-3 rounded-full shadow-lg hover:bg-green-600 transition-colors font-semibold"
                                    >
                                        📊 View Report
                                    </motion.button>

                                    {/* Tier Info Button */}
                                    <motion.button
                                        onClick={() => setShowTierInfo(true)}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="inline-flex items-center gap-2 bg-blue-500 text-white px-6 py-3 rounded-full shadow-lg hover:bg-blue-600 transition-colors font-semibold"
                                    >
                                        <Info className="w-5 h-5" />
                                        What are Tiers?
                                    </motion.button>
                                </div>
                            </div>

                            {/* Subtitle */}
                            <div className="text-center">
                                <p className="text-2xl text-purple-600 mb-2">
                                    Master all 80 Dolch Sight Words!
                                </p>
                                <p className="text-lg text-gray-600">
                                    Complete 5 stages: Recognition → Meaning → Recall → Reading → Spelling
                                </p>
                            </div>
                        </motion.div>

                        {/* Skills Grid - Grouped Layout */}
                        <div className="space-y-6">
                            {/* Recognition Lists Group */}
                            <div className="bg-white rounded-3xl p-6 shadow-xl">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="text-5xl">👁️</div>
                                    <div>
                                        <h3 className="text-3xl font-bold text-purple-800">Recognition</h3>
                                        <p className="text-gray-600">4 Lists × 20 Words Each</p>
                                    </div>
                                </div>

                                {/* Recognition Lists Sub-Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                                    {skillsToDisplay.filter(s => s.code.match(/^RF\.[1-4]\.1$/)).map((skill, index) => {
                                        const listNumber = skill.code.match(/RF\.(\d)\.1/)?.[1] || '1';
                                        return (
                                            <motion.div
                                                key={skill.id}
                                                initial={{ scale: 0, rotate: -10 }}
                                                animate={{ scale: 1, rotate: 0 }}
                                                transition={{ delay: index * 0.1, type: 'spring' }}
                                                whileHover={{ scale: 1.05, y: -5 }}
                                                onClick={() => router.push(`/child/play/${skill.id}`)}
                                                className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 shadow-lg cursor-pointer border-2 border-purple-200 hover:border-purple-400 transition-all"
                                            >
                                                <div className="text-center">
                                                    <div className="text-4xl mb-2">📋</div>
                                                    <h4 className="text-xl font-bold text-purple-800 mb-1">List {listNumber}</h4>
                                                    <p className="text-sm text-gray-600 mb-3">20 Words</p>

                                                    {skill.totalAttempts > 0 && (
                                                        <div className="mb-3">
                                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                                <div
                                                                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                                                                    style={{ width: `${skill.progress}%` }}
                                                                />
                                                            </div>
                                                            <p className="text-xs text-gray-600 mt-1">{skill.progress}%</p>
                                                        </div>
                                                    )}

                                                    <div className={`text-sm font-bold px-4 py-2 rounded-full ${skill.isCompleted ? 'bg-green-500 text-white' :
                                                        skill.totalAttempts > 0 ? 'bg-yellow-500 text-white' :
                                                            'bg-blue-500 text-white'
                                                        }`}>
                                                        {skill.isCompleted ? '✅ Done' : skill.totalAttempts > 0 ? '📝 Continue' : '🎮 Start'}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Recall Lists Group */}
                            <div className="bg-white rounded-3xl p-6 shadow-xl">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="text-5xl">🎧</div>
                                    <div>
                                        <h3 className="text-3xl font-bold text-purple-800">Recall</h3>
                                        <p className="text-gray-600">4 Lists × 20 Words Each</p>
                                    </div>
                                </div>

                                {/* Recall Lists Sub-Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                                    {skillsToDisplay.filter(s => s.code.match(/^RF\.[1-4]\.3$/)).map((skill, index) => {
                                        const listNumber = skill.code.match(/RF\.(\d)\.3/)?.[1] || '1';
                                        return (
                                            <motion.div
                                                key={skill.id}
                                                initial={{ scale: 0, rotate: -10 }}
                                                animate={{ scale: 1, rotate: 0 }}
                                                transition={{ delay: (index + 4) * 0.1, type: 'spring' }}
                                                whileHover={{ scale: 1.05, y: -5 }}
                                                onClick={() => router.push(`/child/play/${skill.id}`)}
                                                className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 shadow-lg cursor-pointer border-2 border-blue-200 hover:border-blue-400 transition-all"
                                            >
                                                <div className="text-center">
                                                    <div className="text-4xl mb-2">📖</div>
                                                    <h4 className="text-xl font-bold text-blue-800 mb-1">List {listNumber}</h4>
                                                    <p className="text-sm text-gray-600 mb-3">20 Words</p>

                                                    {skill.totalAttempts > 0 && (
                                                        <div className="mb-3">
                                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                                <div
                                                                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
                                                                    style={{ width: `${skill.progress}%` }}
                                                                />
                                                            </div>
                                                            <p className="text-xs text-gray-600 mt-1">{skill.progress}%</p>
                                                        </div>
                                                    )}

                                                    <div className={`text-sm font-bold px-4 py-2 rounded-full ${skill.isCompleted ? 'bg-green-500 text-white' :
                                                        skill.totalAttempts > 0 ? 'bg-yellow-500 text-white' :
                                                            'bg-blue-500 text-white'
                                                        }`}>
                                                        {skill.isCompleted ? '✅ Done' : skill.totalAttempts > 0 ? '📝 Continue' : '🎮 Start'}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Other Stages Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {skillsToDisplay.filter(s => s.code.startsWith('RF.ALL.')).map((skill, index) => {
                                    const stageName = skill.name.split(' - ')[0];
                                    const stageIcons: Record<string, string> = {
                                        'Meaning': '🖼️',
                                        'Reading': '📖',
                                        'Spelling': '✍️'
                                    };
                                    const icon = stageIcons[stageName] || '🎮';

                                    return (
                                        <motion.div
                                            key={skill.id}
                                            initial={{ scale: 0, rotate: -10 }}
                                            animate={{ scale: 1, rotate: 0 }}
                                            transition={{ delay: (index + 8) * 0.1, type: 'spring' }}
                                            whileHover={{ scale: 1.05, y: -5 }}
                                            className="bg-white rounded-3xl p-8 shadow-xl relative overflow-hidden"
                                        >
                                            <div onClick={() => router.push(`/child/play/${skill.id}`)} className="cursor-pointer">
                                                <div className="text-6xl mb-4">{icon}</div>
                                                <h3 className="text-2xl font-bold text-purple-800 mb-2">{stageName}</h3>
                                                <p className="text-gray-600 mb-4 text-sm">All 80 Dolch Words</p>

                                                {skill.tier && (
                                                    <div className="mb-4">
                                                        <div className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${skill.tier === 1 ? 'bg-green-100 text-green-700' :
                                                            skill.tier === 2 ? 'bg-yellow-100 text-yellow-700' :
                                                                'bg-red-100 text-red-700'
                                                            }`}>
                                                            Tier {skill.tier}
                                                        </div>
                                                    </div>
                                                )}

                                                {skill.totalAttempts > 0 && (
                                                    <div className="mb-4">
                                                        <div className="flex justify-between text-sm mb-1">
                                                            <span className="text-gray-600">Progress</span>
                                                            <span className="font-bold text-purple-600">{skill.progress}%</span>
                                                        </div>
                                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                                            <div
                                                                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                                                                style={{ width: `${skill.progress}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                <div className={`flex items-center justify-center gap-2 text-white px-6 py-3 rounded-full font-bold ${skill.isCompleted ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
                                                    skill.totalAttempts > 0 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                                                        'bg-gradient-to-r from-blue-400 to-indigo-500'
                                                    }`}>
                                                    {skill.isCompleted ? '✅ Mastered' : skill.totalAttempts > 0 ? '📝 Continue' : '🎮 Start'}
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>

                            {/* Tier Info Modal */}
                            {showTierInfo && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                                    onClick={() => setShowTierInfo(false)}
                                >
                                    <motion.div
                                        initial={{ scale: 0.9, y: 20 }}
                                        animate={{ scale: 1, y: 0 }}
                                        exit={{ scale: 0.9, y: 20 }}
                                        onClick={(e) => e.stopPropagation()}
                                        className="bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
                                    >
                                        {/* Header */}
                                        <div className="flex items-center justify-between mb-6">
                                            <h2 className="text-3xl font-bold text-purple-800">📊 Tier Classification System</h2>
                                            <button
                                                onClick={() => setShowTierInfo(false)}
                                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                            >
                                                <X className="w-6 h-6 text-gray-600" />
                                            </button>
                                        </div>

                                        {/* Mastery Calculation */}
                                        <div className="mb-6">
                                            <h3 className="text-xl font-bold text-purple-700 mb-3">Mastery Calculation</h3>
                                            <div className="bg-purple-50 rounded-xl p-4 space-y-2">
                                                <p className="font-semibold text-purple-800">For each word:</p>
                                                <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                                                    <li>Accuracy percentage</li>
                                                    <li>Number of attempts</li>
                                                    <li>Response time</li>
                                                </ul>
                                                <p className="font-semibold text-purple-800 mt-3">For each list:</p>
                                                <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                                                    <li>Average mastery score calculated</li>
                                                </ul>
                                            </div>
                                        </div>

                                        {/* Tier Classification Table */}
                                        <div>
                                            <h3 className="text-xl font-bold text-purple-700 mb-3">Tier Classification (Automatic)</h3>
                                            <div className="overflow-hidden rounded-xl border-2 border-purple-200">
                                                <table className="w-full">
                                                    <thead className="bg-purple-600 text-white">
                                                        <tr>
                                                            <th className="px-4 py-3 text-left font-semibold">Mastery %</th>
                                                            <th className="px-4 py-3 text-left font-semibold">Tier</th>
                                                            <th className="px-4 py-3 text-left font-semibold">Interpretation</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        <tr className="bg-green-50 border-b border-green-200">
                                                            <td className="px-4 py-3 font-semibold text-green-800">≥ 80%</td>
                                                            <td className="px-4 py-3">
                                                                <span className="inline-block px-3 py-1 bg-green-500 text-white rounded-full text-sm font-bold">
                                                                    Tier 1
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 text-gray-700">Independent / Grade-ready</td>
                                                        </tr>
                                                        <tr className="bg-yellow-50 border-b border-yellow-200">
                                                            <td className="px-4 py-3 font-semibold text-yellow-800">60% – 79%</td>
                                                            <td className="px-4 py-3">
                                                                <span className="inline-block px-3 py-1 bg-yellow-500 text-white rounded-full text-sm font-bold">
                                                                    Tier 2
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 text-gray-700">Needs guided reinforcement</td>
                                                        </tr>
                                                        <tr className="bg-red-50">
                                                            <td className="px-4 py-3 font-semibold text-red-800">&lt; 40%</td>
                                                            <td className="px-4 py-3">
                                                                <span className="inline-block px-3 py-1 bg-red-500 text-white rounded-full text-sm font-bold">
                                                                    Tier 3
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 text-gray-700">High risk – intervention required</td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                        {/* Note */}
                                        <div className="mt-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                                            <p className="text-sm text-blue-800">
                                                <strong>Note:</strong> Tier is assigned after the Recognition Stage only. This becomes the baseline diagnostic signal for reading readiness.
                                            </p>
                                        </div>
                                    </motion.div>
                                </motion.div>
                            )}
                        </div>
                    </div>
                </div>

                {/* AI Report Modal */}
                <AnimatePresence>
                    {showReport && (
                        <>
                            {console.log('🎭 Rendering modal, showReport:', showReport, 'loadingReport:', loadingReport, 'reportData:', !!reportData)}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                                onClick={() => {
                                    console.log('🚪 Closing modal');
                                    setShowReport(false);
                                }}
                            >
                                <motion.div
                                    initial={{ scale: 0.9, y: 20 }}
                                    animate={{ scale: 1, y: 0 }}
                                    exit={{ scale: 0.9, y: 20 }}
                                    onClick={(e) => e.stopPropagation()}
                                    className="bg-white rounded-3xl p-8 max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
                                >
                                    {loadingReport ? (
                                        <div className="text-center py-12">
                                            <div className="text-4xl mb-4">📊</div>
                                            <div className="text-2xl font-bold text-purple-800">Loading Report...</div>
                                        </div>
                                    ) : reportData ? (
                                        <>
                                            {/* Header */}
                                            <div className="flex items-center justify-between mb-8">
                                                <h2 className="text-4xl font-bold text-purple-800">📊 Recognition Report</h2>
                                                <button
                                                    onClick={() => setShowReport(false)}
                                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                                >
                                                    <X className="w-6 h-6 text-gray-600" />
                                                </button>
                                            </div>

                                            {/* AI Insights */}
                                            {reportData.aiInsights && (
                                                <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-6 mb-6">
                                                    <h3 className="text-2xl font-bold text-purple-800 mb-4 flex items-center gap-2">
                                                        🧠 AI Insights
                                                        {reportData.aiInsights.isBaselineDiagnostic && (
                                                            <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm">
                                                                Baseline Diagnostic
                                                            </span>
                                                        )}
                                                    </h3>

                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                        {/* Tier */}
                                                        <div className={`p-4 rounded-xl ${reportData.aiInsights.tier === 1 ? 'bg-green-100' :
                                                            reportData.aiInsights.tier === 2 ? 'bg-yellow-100' : 'bg-red-100'
                                                            }`}>
                                                            <div className="text-4xl mb-2">{reportData.aiInsights.tierEmoji}</div>
                                                            <div className="text-xl font-bold">Tier {reportData.aiInsights.tier}</div>
                                                            <div className="text-sm">{reportData.aiInsights.tierLabel}</div>
                                                        </div>

                                                        {/* Risk */}
                                                        <div className={`p-4 rounded-xl ${reportData.aiInsights.riskIndicator === 'low' ? 'bg-green-100' :
                                                            reportData.aiInsights.riskIndicator === 'medium' ? 'bg-yellow-100' : 'bg-red-100'
                                                            }`}>
                                                            <div className="text-xl font-bold mb-1">Risk Level</div>
                                                            <div className="text-2xl font-bold capitalize">{reportData.aiInsights.riskIndicator}</div>
                                                        </div>

                                                        {/* Progress */}
                                                        <div className="p-4 rounded-xl bg-purple-100">
                                                            <div className="text-xl font-bold mb-2">Progress</div>
                                                            <div className="text-sm mb-2">
                                                                {reportData.aiInsights.wordsMastered} / {reportData.aiInsights.wordsAttempted} mastered
                                                            </div>
                                                            <div className="w-full bg-gray-300 rounded-full h-2">
                                                                <div
                                                                    className="bg-purple-600 h-2 rounded-full"
                                                                    style={{ width: `${(reportData.aiInsights.wordsMastered / reportData.aiInsights.wordsAttempted) * 100}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Word Mastery Grid */}
                                            <div className="mb-6">
                                                <h3 className="text-2xl font-bold text-purple-800 mb-4">📚 Word Mastery</h3>

                                                {(() => {
                                                    const strengthWords = reportData.wordMastery.filter((w: any) => w.tier === 1);
                                                    const strugglingWords = reportData.wordMastery.filter((w: any) => w.tier === 3);
                                                    const needsPracticeWords = reportData.wordMastery.filter((w: any) => w.tier === 2);

                                                    return (
                                                        <div className="space-y-4">
                                                            {/* Summary */}
                                                            <div className="grid grid-cols-3 gap-4">
                                                                <div className="bg-green-50 p-4 rounded-xl border-2 border-green-300">
                                                                    <div className="text-3xl font-bold text-green-600">{strengthWords.length}</div>
                                                                    <div className="text-sm text-gray-600">Mastered (Tier 1)</div>
                                                                </div>
                                                                <div className="bg-yellow-50 p-4 rounded-xl border-2 border-yellow-300">
                                                                    <div className="text-3xl font-bold text-yellow-600">{needsPracticeWords.length}</div>
                                                                    <div className="text-sm text-gray-600">Needs Practice (Tier 2)</div>
                                                                </div>
                                                                <div className="bg-red-50 p-4 rounded-xl border-2 border-red-300">
                                                                    <div className="text-3xl font-bold text-red-600">{strugglingWords.length}</div>
                                                                    <div className="text-sm text-gray-600">Struggling (Tier 3)</div>
                                                                </div>
                                                            </div>

                                                            {/* Struggling Words - Priority */}
                                                            {strugglingWords.length > 0 && (
                                                                <div>
                                                                    <h4 className="text-lg font-bold text-red-600 mb-2">🚨 Priority: Struggling Words</h4>
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {strugglingWords.map((word: any) => (
                                                                            <div key={word.word} className="bg-red-100 px-3 py-2 rounded-full border-2 border-red-300">
                                                                                <span className="font-bold text-red-800">{word.word}</span>
                                                                                <span className="text-sm text-red-600 ml-2">{word.accuracyPercentage.toFixed(0)}%</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Needs Practice */}
                                                            {needsPracticeWords.length > 0 && (
                                                                <div>
                                                                    <h4 className="text-lg font-bold text-yellow-600 mb-2">📝 Needs Practice</h4>
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {needsPracticeWords.map((word: any) => (
                                                                            <div key={word.word} className="bg-yellow-100 px-3 py-2 rounded-full border-2 border-yellow-300">
                                                                                <span className="font-bold text-yellow-800">{word.word}</span>
                                                                                <span className="text-sm text-yellow-600 ml-2">{word.accuracyPercentage.toFixed(0)}%</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Mastered */}
                                                            {strengthWords.length > 0 && (
                                                                <div>
                                                                    <h4 className="text-lg font-bold text-green-600 mb-2">⭐ Mastered Words</h4>
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {strengthWords.map((word: any) => (
                                                                            <div key={word.word} className="bg-green-100 px-3 py-2 rounded-full border-2 border-green-300">
                                                                                <span className="font-bold text-green-800">{word.word}</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })()}
                                            </div>

                                            {/* Overall Stats */}
                                            {reportData.skillProgress && (
                                                <div className="bg-gray-50 rounded-2xl p-6">
                                                    <h3 className="text-2xl font-bold text-purple-800 mb-4">📈 Overall Performance</h3>
                                                    <div className="grid grid-cols-3 gap-4">
                                                        <div className="text-center">
                                                            <div className="text-3xl font-bold text-purple-600">
                                                                {reportData.skillProgress.accuracyPercentage.toFixed(1)}%
                                                            </div>
                                                            <div className="text-sm text-gray-600">Overall Accuracy</div>
                                                        </div>
                                                        <div className="text-center">
                                                            <div className="text-3xl font-bold text-blue-600">
                                                                {reportData.skillProgress.avgResponseTime.toFixed(1)}s
                                                            </div>
                                                            <div className="text-sm text-gray-600">Avg Response Time</div>
                                                        </div>
                                                        <div className="text-center">
                                                            <div className="text-3xl font-bold text-indigo-600">
                                                                {reportData.skillProgress.totalAttempts}
                                                            </div>
                                                            <div className="text-sm text-gray-600">Total Attempts</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="text-center py-12">
                                            <div className="text-4xl mb-4">📊</div>
                                            <div className="text-2xl font-bold text-gray-600">No report data available</div>
                                            <p className="text-gray-500 mt-2">Complete some Recognition quizzes to see your report!</p>
                                        </div>
                                    )}
                                </motion.div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </>
        );
    }

    // Check if there are no skills for this domain
    if (skills.length === 0) {
        return (
            <>
                <ChildNavbar />
                <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 pt-24 p-6 relative overflow-hidden">
                    <FloatingShapes density="high" theme="space" />
                    <div className="max-w-4xl mx-auto">
                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring' }}
                            className="bg-white rounded-3xl p-12 shadow-2xl text-center"
                        >
                            <div className="text-8xl mb-6">📚</div>
                            <h2 className="text-4xl font-bold text-purple-800 mb-4">
                                No Skills Available Yet
                            </h2>
                            <p className="text-xl text-gray-600 mb-8">
                                This domain doesn't have any skills yet. Check back soon!
                            </p>
                            <Link href="/child/domains">
                                <button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-full font-bold text-lg hover:scale-105 transition-transform">
                                    <ArrowLeft className="w-5 h-5 inline mr-2" />
                                    Back to Domains
                                </button>
                            </Link>
                        </motion.div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <ChildNavbar />
            <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 pt-24 p-6 relative overflow-hidden">
                <FloatingShapes density="high" theme="space" />
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <motion.div
                        initial={{ y: -50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="mb-8"
                    >
                        <Link href="/child/domains">
                            <button className="flex items-center gap-2 text-purple-700 hover:text-purple-900 mb-4 font-semibold">
                                <ArrowLeft className="w-5 h-5" />
                                Back to Domains
                            </button>
                        </Link>
                        <h1 className="text-5xl font-bold text-purple-800 mb-2">{domainName}</h1>
                        <p className="text-2xl text-purple-600">Choose a skill to practice! 🎯</p>
                    </motion.div>

                    {/* Skills Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {skills.map((skill, index) => {
                            const progress = skillProgress.find(sp => sp.microSkillId === skill.id);
                            const isMastered = progress?.masteryStatus === 'MASTERED';
                            const isInProgress = progress?.masteryStatus === 'IN_PROGRESS';
                            // All skills are unlocked - no prerequisite checking
                            const isLocked = false;

                            return (
                                <Link
                                    key={skill.id}
                                    href={isLocked ? '#' : `/child/play/${skill.id}`}
                                    className={isLocked ? 'pointer-events-none' : ''}
                                >
                                    <motion.div
                                        initial={{ scale: 0, rotate: -180 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{ delay: index * 0.1, type: 'spring' }}
                                        whileHover={!isLocked ? { scale: 1.05, y: -5 } : {}}
                                        className={`bg-white rounded-3xl p-8 shadow-xl cursor-pointer relative overflow-visible ${isLocked ? 'opacity-60' : ''
                                            }`}
                                    >
                                        {/* Emoji Icon - Larger like domain cards */}
                                        <div className="text-6xl mb-4">
                                            {isMastered ? '✅' : isInProgress ? '📝' : isLocked ? '🔒' : '🎮'}
                                        </div>

                                        {/* Skill Name - Larger heading */}
                                        <h3 className="text-2xl font-bold text-purple-800 mb-2">
                                            {skill.name}
                                        </h3>

                                        {/* Skill Code */}
                                        <p className="text-gray-600 mb-4">
                                            {skill.code.replace(/_\d+$/, '')}
                                        </p>

                                        {/* Quiz Statistics */}
                                        {progress && (
                                            <div className="mb-4 grid grid-cols-3 gap-2">
                                                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-3 text-center">
                                                    <div className="text-2xl mb-1">🎮</div>
                                                    <div className="text-lg font-bold text-purple-800">{Math.max(1, Math.floor(progress.totalAttempts / 10))}</div>
                                                    <div className="text-xs text-gray-600">Sessions</div>
                                                </div>
                                                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-3 text-center">
                                                    <div className="text-2xl mb-1">⏱️</div>
                                                    <div className="text-lg font-bold text-purple-800">{progress.avgResponseTime.toFixed(1)}s</div>
                                                    <div className="text-xs text-gray-600">Avg Time</div>
                                                </div>
                                                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-3 text-center">
                                                    <div className="text-2xl mb-1">✅</div>
                                                    <div className="text-lg font-bold text-purple-800">{progress.correctAttempts}</div>
                                                    <div className="text-xs text-gray-600">Correct</div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Action Button - Match domain page style */}
                                        <div className={`flex items-center justify-center gap-2 text-white px-6 py-3 rounded-full font-bold text-lg ${isMastered
                                            ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                                            : isInProgress
                                                ? 'bg-gradient-to-r from-yellow-400 to-orange-500'
                                                : isLocked
                                                    ? 'bg-gray-400'
                                                    : 'bg-gradient-to-r from-blue-400 to-indigo-500'
                                            }`}>
                                            {isMastered && (
                                                <>
                                                    <CheckCircle className="w-5 h-5" />
                                                    Mastered
                                                </>
                                            )}
                                            {isInProgress && !isMastered && (
                                                <>
                                                    <PlayCircle className="w-5 h-5" />
                                                    Continue
                                                </>
                                            )}
                                            {!isInProgress && !isMastered && !isLocked && (
                                                <>
                                                    <PlayCircle className="w-5 h-5" />
                                                    Start Learning
                                                </>
                                            )}
                                            {isLocked && (
                                                <>
                                                    <Lock className="w-5 h-5" />
                                                    Locked
                                                </>
                                            )}
                                        </div>
                                    </motion.div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* AI Report Modal */}
            <AnimatePresence>
                {showReport && (
                    <>
                        {console.log('🎭 Rendering modal, showReport:', showReport, 'loadingReport:', loadingReport, 'reportData:', !!reportData)}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                            onClick={() => {
                                console.log('🚪 Closing modal');
                                setShowReport(false);
                            }}
                        >
                            <motion.div
                                initial={{ scale: 0.9, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.9, y: 20 }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-white rounded-3xl p-8 max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
                            >
                                {loadingReport ? (
                                    <div className="text-center py-12">
                                        <div className="text-4xl mb-4">📊</div>
                                        <div className="text-2xl font-bold text-purple-800">Loading Report...</div>
                                    </div>
                                ) : reportData ? (
                                    <>
                                        {/* Header */}
                                        <div className="flex items-center justify-between mb-8">
                                            <h2 className="text-4xl font-bold text-purple-800">📊 Recognition Report</h2>
                                            <button
                                                onClick={() => setShowReport(false)}
                                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                            >
                                                <X className="w-6 h-6 text-gray-600" />
                                            </button>
                                        </div>

                                        {/* AI Insights */}
                                        {reportData.aiInsights && (
                                            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-6 mb-6">
                                                <h3 className="text-2xl font-bold text-purple-800 mb-4 flex items-center gap-2">
                                                    🧠 AI Insights
                                                    {reportData.aiInsights.isBaselineDiagnostic && (
                                                        <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm">
                                                            Baseline Diagnostic
                                                        </span>
                                                    )}
                                                </h3>

                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    {/* Tier */}
                                                    <div className={`p-4 rounded-xl ${reportData.aiInsights.tier === 1 ? 'bg-green-100' :
                                                        reportData.aiInsights.tier === 2 ? 'bg-yellow-100' : 'bg-red-100'
                                                        }`}>
                                                        <div className="text-4xl mb-2">{reportData.aiInsights.tierEmoji}</div>
                                                        <div className="text-xl font-bold">Tier {reportData.aiInsights.tier}</div>
                                                        <div className="text-sm">{reportData.aiInsights.tierLabel}</div>
                                                    </div>

                                                    {/* Risk */}
                                                    <div className={`p-4 rounded-xl ${reportData.aiInsights.riskIndicator === 'low' ? 'bg-green-100' :
                                                        reportData.aiInsights.riskIndicator === 'medium' ? 'bg-yellow-100' : 'bg-red-100'
                                                        }`}>
                                                        <div className="text-xl font-bold mb-1">Risk Level</div>
                                                        <div className="text-2xl font-bold capitalize">{reportData.aiInsights.riskIndicator}</div>
                                                    </div>

                                                    {/* Progress */}
                                                    <div className="p-4 rounded-xl bg-purple-100">
                                                        <div className="text-xl font-bold mb-2">Progress</div>
                                                        <div className="text-sm mb-2">
                                                            {reportData.aiInsights.wordsMastered} / {reportData.aiInsights.wordsAttempted} mastered
                                                        </div>
                                                        <div className="w-full bg-gray-300 rounded-full h-2">
                                                            <div
                                                                className="bg-purple-600 h-2 rounded-full"
                                                                style={{ width: `${(reportData.aiInsights.wordsMastered / reportData.aiInsights.wordsAttempted) * 100}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Word Mastery Grid */}
                                        <div className="mb-6">
                                            <h3 className="text-2xl font-bold text-purple-800 mb-4">📚 Word Mastery</h3>

                                            {(() => {
                                                const strengthWords = reportData.wordMastery.filter((w: any) => w.tier === 1);
                                                const strugglingWords = reportData.wordMastery.filter((w: any) => w.tier === 3);
                                                const needsPracticeWords = reportData.wordMastery.filter((w: any) => w.tier === 2);

                                                return (
                                                    <div className="space-y-4">
                                                        {/* Summary */}
                                                        <div className="grid grid-cols-3 gap-4">
                                                            <div className="bg-green-50 p-4 rounded-xl border-2 border-green-300">
                                                                <div className="text-3xl font-bold text-green-600">{strengthWords.length}</div>
                                                                <div className="text-sm text-gray-600">Mastered (Tier 1)</div>
                                                            </div>
                                                            <div className="bg-yellow-50 p-4 rounded-xl border-2 border-yellow-300">
                                                                <div className="text-3xl font-bold text-yellow-600">{needsPracticeWords.length}</div>
                                                                <div className="text-sm text-gray-600">Needs Practice (Tier 2)</div>
                                                            </div>
                                                            <div className="bg-red-50 p-4 rounded-xl border-2 border-red-300">
                                                                <div className="text-3xl font-bold text-red-600">{strugglingWords.length}</div>
                                                                <div className="text-sm text-gray-600">Struggling (Tier 3)</div>
                                                            </div>
                                                        </div>

                                                        {/* Struggling Words - Priority */}
                                                        {strugglingWords.length > 0 && (
                                                            <div>
                                                                <h4 className="text-lg font-bold text-red-600 mb-2">🚨 Priority: Struggling Words</h4>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {strugglingWords.map((word: any) => (
                                                                        <div key={word.word} className="bg-red-100 px-3 py-2 rounded-full border-2 border-red-300">
                                                                            <span className="font-bold text-red-800">{word.word}</span>
                                                                            <span className="text-sm text-red-600 ml-2">{word.accuracyPercentage.toFixed(0)}%</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Needs Practice */}
                                                        {needsPracticeWords.length > 0 && (
                                                            <div>
                                                                <h4 className="text-lg font-bold text-yellow-600 mb-2">📝 Needs Practice</h4>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {needsPracticeWords.map((word: any) => (
                                                                        <div key={word.word} className="bg-yellow-100 px-3 py-2 rounded-full border-2 border-yellow-300">
                                                                            <span className="font-bold text-yellow-800">{word.word}</span>
                                                                            <span className="text-sm text-yellow-600 ml-2">{word.accuracyPercentage.toFixed(0)}%</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Mastered */}
                                                        {strengthWords.length > 0 && (
                                                            <div>
                                                                <h4 className="text-lg font-bold text-green-600 mb-2">⭐ Mastered Words</h4>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {strengthWords.map((word: any) => (
                                                                        <div key={word.word} className="bg-green-100 px-3 py-2 rounded-full border-2 border-green-300">
                                                                            <span className="font-bold text-green-800">{word.word}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })()}
                                        </div>

                                        {/* Overall Stats */}
                                        {reportData.skillProgress && (
                                            <div className="bg-gray-50 rounded-2xl p-6">
                                                <h3 className="text-2xl font-bold text-purple-800 mb-4">📈 Overall Performance</h3>
                                                <div className="grid grid-cols-3 gap-4">
                                                    <div className="text-center">
                                                        <div className="text-3xl font-bold text-purple-600">
                                                            {reportData.skillProgress.accuracyPercentage.toFixed(1)}%
                                                        </div>
                                                        <div className="text-sm text-gray-600">Overall Accuracy</div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-3xl font-bold text-blue-600">
                                                            {reportData.skillProgress.avgResponseTime.toFixed(1)}s
                                                        </div>
                                                        <div className="text-sm text-gray-600">Avg Response Time</div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-3xl font-bold text-indigo-600">
                                                            {reportData.skillProgress.totalAttempts}
                                                        </div>
                                                        <div className="text-sm text-gray-600">Total Attempts</div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="text-center py-12">
                                        <div className="text-4xl mb-4">📊</div>
                                        <div className="text-2xl font-bold text-gray-600">No report data available</div>
                                        <p className="text-gray-500 mt-2">Complete some Recognition quizzes to see your report!</p>
                                    </div>
                                )}
                            </motion.div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}

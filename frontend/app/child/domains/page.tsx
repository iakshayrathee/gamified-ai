'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { BookOpen, Star, Trophy, Search, X } from 'lucide-react';
import Link from 'next/link';
import { MicroSkill } from '@/lib/api-client';
import FloatingShapes from '@/components/ui/FloatingShapes';
import AnimatedButton from '@/components/ui/AnimatedButton';
import ChildNavbar from '@/components/navigation/ChildNavbar';
import { useAuth } from '@/lib/auth-context';
import { useChildProgress } from '@/lib/hooks/useApi';

interface DomainWithSkills {
    domain: {
        id: string;
        code: string;
        name: string;
        description: string;
    };
    skills: MicroSkill[];
    totalSkills: number;
    masteredSkills: number;
    inProgressSkills: number;
    skillProgressMap: Map<string, any>; // Map of skillId to progress data
}

export default function DomainSelectionPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const childId = user?.id;

    const { data: progress, isLoading: progressLoading, error: progressError } = useChildProgress(childId || '');
    const [searchQuery, setSearchQuery] = useState('');
    const [hoveredDomainId, setHoveredDomainId] = useState<string | null>(null);

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login/child');
        }
    }, [authLoading, user, router]);

    // Process domains from progress data
    const domains = progress ? (() => {
        const domainMap = new Map<string, DomainWithSkills>();

        progress.allSkills.forEach(skill => {
            const domainCode = skill.domain.code;
            if (!domainMap.has(domainCode)) {
                domainMap.set(domainCode, {
                    domain: skill.domain,
                    skills: [],
                    totalSkills: 0,
                    masteredSkills: 0,
                    inProgressSkills: 0,
                    skillProgressMap: new Map(),
                });
            }

            const domainData = domainMap.get(domainCode)!;
            domainData.skills.push(skill);
            domainData.totalSkills++;

            // Check if mastered or in progress
            const skillProg = progress.skillProgress.find(sp => sp.microSkillId === skill.id);

            // Store progress data for this skill
            if (skillProg) {
                domainData.skillProgressMap.set(skill.id, skillProg);
            }

            if (skillProg?.masteryStatus === 'MASTERED') {
                domainData.masteredSkills++;
            } else if (skillProg?.masteryStatus === 'IN_PROGRESS') {
                domainData.inProgressSkills++;
            }
        });

        return Array.from(domainMap.values()).sort((a, b) =>
            a.domain.code.localeCompare(b.domain.code)
        );
    })() : [];

    const loading = authLoading || progressLoading;
    const error = progressError ? 'Failed to load domains' : null;

    // Calculate aggregate analytics for a domain
    function calculateDomainAnalytics(domainData: DomainWithSkills): {
        totalAttempts: number;
        accuracy: number;
        avgResponseTime: string;
        lastAttemptedAt: Date | null;
        hasData: boolean;
    } {
        let totalAttempts = 0;
        let totalCorrect = 0;
        let totalResponseTime = 0;
        let attemptCount = 0;
        let lastAttemptedAt: Date | null = null;

        domainData.skillProgressMap.forEach((progress) => {
            if (progress.totalAttempts > 0) {
                totalAttempts += progress.totalAttempts;
                totalCorrect += progress.correctAttempts;
                totalResponseTime += progress.avgResponseTime * progress.totalAttempts;
                attemptCount += progress.totalAttempts;

                if (progress.lastAttemptedAt) {
                    const attemptDate = new Date(progress.lastAttemptedAt);
                    if (!lastAttemptedAt || attemptDate > lastAttemptedAt) {
                        lastAttemptedAt = attemptDate;
                    }
                }
            }
        });

        const accuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;
        const avgResponseTime = attemptCount > 0 ? (totalResponseTime / attemptCount).toFixed(1) : '0.0';

        return {
            totalAttempts,
            accuracy,
            avgResponseTime,
            lastAttemptedAt,
            hasData: totalAttempts > 0
        };
    }

    // Filter domains based on search query
    const filteredDomains = domains.filter(domain =>
        domain.domain.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        domain.domain.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        domain.domain.code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading || authLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400 flex items-center justify-center">
                <div className="text-white text-4xl font-bold">Loading...</div>
            </div>
        );
    }

    // Not authenticated - will redirect via useEffect
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
                        className="text-center mb-8"
                    >
                        <h1 className="text-5xl font-bold text-purple-800 mb-4">Choose Your Topic! 📚</h1>
                        <p className="text-2xl text-purple-600">Pick a subject to start learning</p>
                    </motion.div>

                    {/* Search Bar */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="max-w-2xl mx-auto mb-8"
                    >
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-purple-400" />
                            <input
                                type="text"
                                placeholder="Search for a topic... 🔍"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-14 pr-12 py-4 text-lg rounded-full border-4 border-purple-300 focus:border-purple-500 focus:outline-none shadow-lg transition-all"
                            />
                            {searchQuery && (
                                <motion.button
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-purple-500 text-white rounded-full p-2 hover:bg-purple-600 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </motion.button>
                            )}
                        </div>
                        {searchQuery && (
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-center mt-3 text-purple-700 font-semibold"
                            >
                                Found {filteredDomains.length} topic{filteredDomains.length !== 1 ? 's' : ''}
                            </motion.p>
                        )}
                    </motion.div>

                    {/* Domains Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredDomains.length > 0 ? (
                            filteredDomains.map((domainData, index) => {
                                const progressPercent = domainData.totalSkills > 0
                                    ? Math.round((domainData.masteredSkills / domainData.totalSkills) * 100)
                                    : 0;

                                const analytics = calculateDomainAnalytics(domainData);
                                const isHovered = hoveredDomainId === domainData.domain.id;

                                return (
                                    <Link key={domainData.domain.id} href={`/child/domain/${domainData.domain.id}`}>
                                        <motion.div
                                            initial={{ scale: 0, rotate: -180 }}
                                            animate={{ scale: 1, rotate: 0 }}
                                            transition={{ delay: index * 0.1, type: 'spring' }}
                                            whileHover={{ scale: 1.05, y: -5 }}
                                            onMouseEnter={() => setHoveredDomainId(domainData.domain.id)}
                                            onMouseLeave={() => setHoveredDomainId(null)}
                                            className="bg-white rounded-3xl p-8 shadow-xl cursor-pointer relative overflow-visible"
                                        >
                                            <div className="text-6xl mb-4">{getEmoji(domainData.domain.code)}</div>

                                            <h3 className="text-2xl font-bold text-purple-800 mb-2">
                                                {domainData.domain.name}
                                            </h3>
                                            <p className="text-gray-600 mb-4 line-clamp-2">
                                                {domainData.domain.description}
                                            </p>

                                            <div className="mb-4">
                                                <div className="flex justify-between text-sm text-gray-600 mb-2">
                                                    <span>
                                                        ✅ {domainData.masteredSkills || 0} Mastered
                                                        {(domainData.inProgressSkills || 0) > 0 && (
                                                            <> • 📝 {domainData.inProgressSkills} In Progress</>
                                                        )}
                                                    </span>
                                                    <span className="font-bold text-purple-600">{progressPercent}%</span>
                                                </div>
                                                <div className="bg-gray-200 rounded-full h-3 overflow-hidden relative">
                                                    {/* Mastered skills - solid color */}
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${progressPercent}%` }}
                                                        transition={{ duration: 1, delay: index * 0.1 + 0.5 }}
                                                        className="h-full bg-gradient-to-r from-green-500 to-emerald-500 absolute left-0"
                                                    />
                                                    {/* In-progress skills - lighter color */}
                                                    {(domainData.inProgressSkills || 0) > 0 && (
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{
                                                                width: `${Math.round((((domainData.masteredSkills || 0) + (domainData.inProgressSkills || 0)) / domainData.totalSkills) * 100)}%`
                                                            }}
                                                            transition={{ duration: 1, delay: index * 0.1 + 0.6 }}
                                                            className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 absolute left-0 opacity-60"
                                                        />
                                                    )}
                                                </div>
                                                <div className="text-xs text-gray-500 mt-1 text-center">
                                                    {domainData.totalSkills - (domainData.masteredSkills || 0) - (domainData.inProgressSkills || 0)} skills not started
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-center gap-2 bg-gradient-to-r from-green-400 to-emerald-500 text-white px-6 py-3 rounded-full font-bold text-lg">
                                                <BookOpen className="w-5 h-5" />
                                                Start Learning
                                            </div>

                                            {/* Analytics Hover Overlay */}
                                            {analytics.hasData && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                    animate={{
                                                        opacity: isHovered ? 1 : 0,
                                                        scale: isHovered ? 1 : 0.9,
                                                        pointerEvents: isHovered ? 'auto' : 'none'
                                                    }}
                                                    transition={{ duration: 0.2 }}
                                                    className="absolute inset-0 bg-gradient-to-br from-purple-500/95 via-pink-500/95 to-blue-500/95 backdrop-blur-lg rounded-3xl p-6 flex flex-col justify-center"
                                                    style={{ zIndex: 10 }}
                                                >
                                                    <div className="text-white">
                                                        <h4 className="text-xl font-bold mb-4 flex items-center gap-2">
                                                            📊 Analytics
                                                        </h4>
                                                        <div className="space-y-2 text-sm">
                                                            <div className="flex items-center justify-between bg-white/20 rounded-lg px-3 py-2">
                                                                <span className="font-semibold">Total Attempts:</span>
                                                                <span className="font-bold">{analytics.totalAttempts}</span>
                                                            </div>
                                                            <div className="flex items-center justify-between bg-white/20 rounded-lg px-3 py-2">
                                                                <span className="font-semibold">Accuracy:</span>
                                                                <span className="font-bold">{analytics.accuracy}%</span>
                                                            </div>
                                                            <div className="flex items-center justify-between bg-white/20 rounded-lg px-3 py-2">
                                                                <span className="font-semibold">Avg Response:</span>
                                                                <span className="font-bold">{analytics.avgResponseTime}s</span>
                                                            </div>
                                                            <div className="flex items-center justify-between bg-white/20 rounded-lg px-3 py-2">
                                                                <span className="font-semibold">Mastered:</span>
                                                                <span className="font-bold">{domainData.masteredSkills} / {domainData.totalSkills}</span>
                                                            </div>
                                                            {domainData.inProgressSkills > 0 && (
                                                                <div className="flex items-center justify-between bg-white/20 rounded-lg px-3 py-2">
                                                                    <span className="font-semibold">In Progress:</span>
                                                                    <span className="font-bold">{domainData.inProgressSkills}</span>
                                                                </div>
                                                            )}
                                                            {analytics.lastAttemptedAt && (
                                                                <div className="flex items-center justify-between bg-white/20 rounded-lg px-3 py-2">
                                                                    <span className="font-semibold">Last Activity:</span>
                                                                    <span className="font-bold">
                                                                        {analytics.lastAttemptedAt.toLocaleDateString('en-US', {
                                                                            month: 'short',
                                                                            day: 'numeric',
                                                                            year: 'numeric'
                                                                        })}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </motion.div>
                                    </Link>
                                );
                            })
                        ) : (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="col-span-full text-center py-16"
                            >
                                <div className="text-8xl mb-4">🔍</div>
                                <h3 className="text-3xl font-bold text-purple-800 mb-2">No topics found</h3>
                                <p className="text-xl text-purple-600 mb-6">
                                    Try searching for something else!
                                </p>
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="bg-purple-500 text-white px-8 py-3 rounded-full font-bold text-lg hover:bg-purple-600 transition-colors"
                                >
                                    Clear Search
                                </button>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

function getEmoji(code: string): string {
    const emojiMap: Record<string, string> = {
        'PA': '🎵',
        'LS': '👂',
        'LK': '📝',
        'WR': '✍️',
        'default': '📚'
    };
    return emojiMap[code] || emojiMap['default'];
}

'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lock, CheckCircle, PlayCircle, ArrowLeft } from 'lucide-react';
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
    const domainName = skills.length > 0 ? skills[0].domain.name : '';

    const loading = authLoading || progressLoading;
    const error = progressError ? 'Failed to load skills' : null;

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
        </>
    );
}

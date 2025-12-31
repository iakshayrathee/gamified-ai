'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    ArrowLeft, Brain, TrendingUp, Clock, Target, AlertCircle,
    FileText, Award, Activity
} from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import TeacherNavbar from '@/components/navigation/TeacherNavbar';

interface QuizReview {
    id: string;
    sessionId: string;
    skillName: string;
    skillCode: string;
    createdAt: string;
    overallPerformance: string;
    strengths: string[];
    areasToImprove: string[];
    specificFeedback: string;
    encouragement: string;
    confusionPatterns: string[];
    accuracy: number;
    totalAttempts: number;
    correctAttempts: number;
    avgResponseTime: number;
    recommendedSkillName?: string;
    recommendedSkillCode?: string;
    recommendedReason?: string;
}

interface DetailedProgress {
    student: {
        id: string;
        name: string;
    };
    overallStats: {
        totalQuizzes: number;
        averageAccuracy: number;
        skillsMastered: number;
        skillsInProgress: number;
        totalAttempts: number;
        avgResponseTime: number;
    };
    quizReviews: QuizReview[];
    skillProgress: any[];
    confusionPatterns: Array<{
        pattern: string;
        frequency: number;
    }>;
}

export default function StudentDetailPage() {
    const params = useParams();
    const router = useRouter();
    const studentId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [progress, setProgress] = useState<DetailedProgress | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [hasFetched, setHasFetched] = useState(false);

    useEffect(() => {
        if (hasFetched) return; // Prevent multiple fetches

        const fetchProgress = async () => {
            const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            try {
                const response = await fetch(`${API_BASE_URL}/api/teacher/student/${studentId}/detailed-progress`, {
                    cache: 'no-store'
                });
                if (!response.ok) throw new Error('Failed to fetch student progress');
                const data = await response.json();
                setProgress(data);
                setHasFetched(true);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (studentId) {
            fetchProgress();
        }
    }, [studentId, hasFetched]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-100 flex items-center justify-center">
                <div className="text-slate-800 text-4xl font-bold">Loading...</div>
            </div>
        );
    }

    if (error || !progress) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-100 flex items-center justify-center">
                <div className="text-slate-800 text-2xl">{error || 'Student not found'}</div>
            </div>
        );
    }

    return (
        <ProtectedRoute allowedRoles={['TEACHER']}>
            <TeacherNavbar />
            <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-100 pt-20 p-6">
                <div className="max-w-7xl mx-auto">
                    {/* Back Button */}
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-slate-700 hover:text-slate-900 mb-6 font-semibold"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Back to Dashboard
                    </button>

                    {/* Student Header */}
                    <motion.div
                        initial={{ y: -50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="bg-white rounded-2xl p-8 shadow-lg mb-6"
                    >
                        <div className="flex items-center gap-6">
                            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-4xl font-bold">
                                {progress.student.name[0]}
                            </div>
                            <div className="flex-1">
                                <h1 className="text-4xl font-bold text-slate-800 mb-2">{progress.student.name}</h1>
                                <div className="flex flex-wrap gap-4">
                                    <div className="flex items-center gap-2">
                                        <Award className="w-5 h-5 text-green-600" />
                                        <span className="text-lg text-slate-600">{progress.overallStats.skillsMastered} Skills Mastered</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Activity className="w-5 h-5 text-blue-600" />
                                        <span className="text-lg text-slate-600">{progress.overallStats.skillsInProgress} In Progress</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Target className="w-5 h-5 text-purple-600" />
                                        <span className="text-lg text-slate-600">{progress.overallStats.averageAccuracy.toFixed(1)}% Avg Accuracy</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Overall Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white rounded-xl p-6 shadow-lg"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <FileText className="w-10 h-10 text-blue-600" />
                                <span className="text-3xl font-bold text-slate-800">{progress.overallStats.totalQuizzes}</span>
                            </div>
                            <p className="text-slate-600">Total Quizzes</p>
                        </motion.div>

                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white rounded-xl p-6 shadow-lg"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <TrendingUp className="w-10 h-10 text-green-600" />
                                <span className="text-3xl font-bold text-slate-800">{progress.overallStats.averageAccuracy.toFixed(0)}%</span>
                            </div>
                            <p className="text-slate-600">Avg Accuracy</p>
                        </motion.div>

                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.3 }}
                            className="bg-white rounded-xl p-6 shadow-lg"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <Clock className="w-10 h-10 text-orange-600" />
                                <span className="text-3xl font-bold text-slate-800">{progress.overallStats.avgResponseTime.toFixed(1)}s</span>
                            </div>
                            <p className="text-slate-600">Avg Response Time</p>
                        </motion.div>

                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.4 }}
                            className="bg-white rounded-xl p-6 shadow-lg"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <Target className="w-10 h-10 text-purple-600" />
                                <span className="text-3xl font-bold text-slate-800">{progress.overallStats.totalAttempts}</span>
                            </div>
                            <p className="text-slate-600">Total Attempts</p>
                        </motion.div>
                    </div>

                    {/* Confusion Patterns */}
                    {progress.confusionPatterns.length > 0 && (
                        <motion.div
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="bg-white rounded-2xl p-6 shadow-lg mb-6"
                        >
                            <div className="flex items-center gap-2 mb-4">
                                <AlertCircle className="w-6 h-6 text-red-600" />
                                <h2 className="text-2xl font-bold text-slate-800">Confusion Patterns</h2>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                {progress.confusionPatterns.map((pattern, index) => (
                                    <div key={index} className="bg-red-50 border border-red-200 rounded-lg px-4 py-2">
                                        <span className="text-red-700 font-semibold">{pattern.pattern}</span>
                                        <span className="text-red-600 ml-2">({pattern.frequency}x)</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Quiz History */}
                    <motion.div
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="bg-white rounded-2xl p-8 shadow-lg"
                    >
                        <div className="flex items-center gap-2 mb-6">
                            <Brain className="w-6 h-6 text-purple-600" />
                            <h2 className="text-3xl font-bold text-slate-800">Quiz History & AI Reviews</h2>
                        </div>

                        {progress.quizReviews.length === 0 ? (
                            <p className="text-center text-gray-500 text-xl py-8">No quizzes completed yet</p>
                        ) : (
                            <div className="space-y-6">
                                {progress.quizReviews.map((review, index) => (
                                    <motion.div
                                        key={review.id}
                                        initial={{ x: -50, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ delay: 0.7 + index * 0.1 }}
                                        className="border border-slate-200 rounded-xl p-6 hover:shadow-md transition-shadow"
                                    >
                                        {/* Quiz Header */}
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <h3 className="text-xl font-bold text-slate-800">{review.skillName}</h3>
                                                <p className="text-slate-600 text-sm">Code: {review.skillCode}</p>
                                            </div>
                                            <div className="text-right">
                                                <div className={`text-2xl font-bold ${review.accuracy >= 80 ? 'text-green-600' :
                                                    review.accuracy >= 60 ? 'text-yellow-600' :
                                                        'text-red-600'
                                                    }`}>
                                                    {review.accuracy.toFixed(0)}%
                                                </div>
                                                <p className="text-slate-600 text-sm">
                                                    {review.correctAttempts}/{review.totalAttempts} correct
                                                </p>
                                            </div>
                                        </div>

                                        {/* AI Review */}
                                        <div className="bg-purple-50 rounded-lg p-4 mb-4">
                                            <p className="text-purple-900 font-semibold mb-2">{review.overallPerformance}</p>
                                            <p className="text-purple-800 text-sm">{review.specificFeedback}</p>
                                        </div>

                                        {/* Strengths & Areas to Improve */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            {review.strengths.length > 0 && (
                                                <div>
                                                    <h4 className="font-semibold text-green-700 mb-2">Strengths</h4>
                                                    <ul className="space-y-1">
                                                        {review.strengths.map((strength, i) => (
                                                            <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                                                                <span className="text-green-600">✓</span>
                                                                {strength}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                            {review.areasToImprove.length > 0 && (
                                                <div>
                                                    <h4 className="font-semibold text-orange-700 mb-2">Areas to Improve</h4>
                                                    <ul className="space-y-1">
                                                        {review.areasToImprove.map((area, i) => (
                                                            <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                                                                <span className="text-orange-600">!</span>
                                                                {area}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>

                                        {/* AI Recommendation */}
                                        {review.recommendedSkillName && (
                                            <div className="bg-blue-50 rounded-lg p-4 mb-4">
                                                <h4 className="font-semibold text-blue-800 mb-1">AI Recommendation</h4>
                                                <p className="text-blue-700 text-sm">
                                                    Next: <span className="font-semibold">{review.recommendedSkillName}</span> ({review.recommendedSkillCode})
                                                </p>
                                                <p className="text-blue-600 text-sm mt-1">{review.recommendedReason}</p>
                                            </div>
                                        )}

                                        {/* Metadata */}
                                        <div className="flex items-center gap-4 text-sm text-slate-500">
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-4 h-4" />
                                                {new Date(review.createdAt).toLocaleString()}
                                            </div>
                                            <div>
                                                Avg Response: {review.avgResponseTime.toFixed(1)}s
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>
        </ProtectedRoute>
    );
}

'use client';

import { motion } from 'framer-motion';
import { Users, TrendingUp, Award, Eye, Brain, Clock, Sparkles, ArrowUp } from 'lucide-react';
import Link from 'next/link';
import { useTeacherStudents } from '@/lib/hooks/useApi';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/lib/auth-context';
import TeacherNavbar from '@/components/navigation/TeacherNavbar';
import { useEffect, useState } from 'react';

interface StudentWithLatestReview {
    id: string;
    name: string;
    masteryPercentage: number;
    skillsCompleted: number;
    atRisk: boolean;
    latestReview?: {
        skillName: string;
        accuracy: number;
        createdAt: string;
        overallPerformance: string;
        strengths: string[];
    };
}

export default function TeacherDashboardPage() {
    const { user } = useAuth();
    const teacherId = user?.id || '';

    const { data: students = [], isLoading, error } = useTeacherStudents(teacherId);
    const [studentsWithReviews, setStudentsWithReviews] = useState<StudentWithLatestReview[]>([]);
    const [hasFetchedReviews, setHasFetchedReviews] = useState(false);

    useEffect(() => {
        if (hasFetchedReviews || students.length === 0) return; // Prevent multiple fetches

        // Fetch latest quiz review for each student
        const fetchReviews = async () => {
            const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            const studentsData = await Promise.all(
                students.map(async (student) => {
                    try {
                        const response = await fetch(`${API_BASE_URL}/api/teacher/student/${student.id}/quiz-reviews?limit=1`, {
                            cache: 'no-store'
                        });
                        if (response.ok) {
                            const reviews = await response.json();
                            return {
                                ...student,
                                latestReview: reviews[0] || null
                            };
                        }
                    } catch (err) {
                        console.error('Error fetching review for student:', student.id, err);
                    }
                    return student;
                })
            );
            setStudentsWithReviews(studentsData);
            setHasFetchedReviews(true);
        };

        fetchReviews();
    }, [students, hasFetchedReviews]);

    if (isLoading) {
        return (
            <ProtectedRoute allowedRoles={['TEACHER']}>
                <TeacherNavbar />
                <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 pt-20 p-6 flex items-center justify-center">
                    <div className="text-center">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            className="inline-block rounded-full h-16 w-16 border-4 border-cyan-500 border-t-transparent"
                        />
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="mt-4 text-slate-600 text-lg"
                        >
                            Loading dashboard...
                        </motion.p>
                    </div>
                </div>
            </ProtectedRoute>
        );
    }

    if (error) {
        return (
            <ProtectedRoute allowedRoles={['TEACHER']}>
                <TeacherNavbar />
                <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 pt-20 p-6 flex items-center justify-center">
                    <div className="text-slate-800 text-2xl">Error loading students. Please try again.</div>
                </div>
            </ProtectedRoute>
        );
    }

    const averageMastery = students.length > 0
        ? Math.round(students.reduce((sum, s) => sum + s.masteryPercentage, 0) / students.length)
        : 0;
    const totalSkillsCompleted = students.reduce((sum, s) => sum + s.skillsCompleted, 0);

    const displayStudents = studentsWithReviews.length > 0 ? studentsWithReviews : students;

    const statCards = [
        {
            title: 'Total Students',
            value: students.length,
            icon: Users,
            gradient: 'from-cyan-500 to-blue-600',
            change: '+12%',
            changeType: 'increase' as const,
        },
        {
            title: 'Avg Mastery',
            value: `${averageMastery}%`,
            icon: TrendingUp,
            gradient: 'from-emerald-500 to-teal-600',
            change: '+8%',
            changeType: 'increase' as const,
        },
        {
            title: 'Skills Completed',
            value: totalSkillsCompleted,
            icon: Award,
            gradient: 'from-violet-500 to-purple-600',
            change: '+15%',
            changeType: 'increase' as const,
        },
    ];

    return (
        <ProtectedRoute allowedRoles={['TEACHER']}>
            <TeacherNavbar />
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 pt-20 p-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="mb-8"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <motion.div
                                animate={{ rotate: [0, 360] }}
                                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                            >
                                <Sparkles className="w-8 h-8 text-cyan-600" />
                            </motion.div>
                            <h1 className="text-4xl font-semibold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">
                                Teacher Dashboard
                            </h1>
                        </div>
                        <p className="text-lg text-slate-600">{user?.name || 'Teacher'}</p>
                    </motion.div>

                    {/* Stats Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        {statCards.map((stat, index) => {
                            const Icon = stat.icon;
                            return (
                                <motion.div
                                    key={stat.title}
                                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ delay: index * 0.1, type: 'spring', stiffness: 200 }}
                                    whileHover={{ y: -8, scale: 1.02 }}
                                    className="bg-white rounded-2xl shadow-lg hover:shadow-2xl p-6 border border-slate-200 transition-all duration-300 overflow-hidden relative"
                                >
                                    {/* Background Gradient */}
                                    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.gradient} opacity-10 rounded-full -mr-16 -mt-16`} />

                                    <div className="relative">
                                        <div className="flex items-center justify-between mb-4">
                                            <motion.div
                                                whileHover={{ scale: 1.1, rotate: 360 }}
                                                transition={{ duration: 0.5 }}
                                                className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg`}
                                            >
                                                <Icon className="w-6 h-6 text-white" />
                                            </motion.div>
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ delay: index * 0.1 + 0.3 }}
                                                className="flex items-center text-sm px-3 py-1 rounded-full bg-green-100 text-green-700"
                                            >
                                                <ArrowUp className="w-4 h-4 mr-1" />
                                                {stat.change}
                                            </motion.div>
                                        </div>
                                        <h3 className="text-sm text-slate-600 mb-1 uppercase tracking-wide">{stat.title}</h3>
                                        <motion.p
                                            initial={{ opacity: 0, scale: 0.5 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: index * 0.1 + 0.2 }}
                                            className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent"
                                        >
                                            {stat.value.toLocaleString()}
                                        </motion.p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Students List */}
                    <motion.div
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200"
                    >
                        <h2 className="text-2xl font-semibold text-slate-900 mb-6">Students</h2>

                        {students.length === 0 ? (
                            <p className="text-center text-gray-500 text-xl py-8">No students assigned yet</p>
                        ) : (
                            <div className="space-y-4">
                                {displayStudents.map((student, index) => (
                                    <motion.div
                                        key={student.id}
                                        initial={{ x: -50, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ delay: 0.6 + index * 0.1 }}
                                        whileHover={{ scale: 1.01, y: -2 }}
                                        className={`
                    rounded-xl p-6 transition-all hover:shadow-md border
                    ${student.atRisk ? 'bg-red-50 border-red-300' : 'bg-slate-50 border-slate-200'}
                  `}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start gap-4 flex-1">
                                                <motion.div
                                                    whileHover={{ scale: 1.1, rotate: 360 }}
                                                    transition={{ duration: 0.5 }}
                                                    className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 shadow-lg"
                                                >
                                                    {student.name[0]}
                                                </motion.div>
                                                <div className="flex-1">
                                                    <h3 className="text-xl font-semibold text-slate-800 mb-1">{student.name}</h3>
                                                    <p className="text-slate-600 mb-3 text-sm">
                                                        {student.skillsCompleted} skills completed • {student.masteryPercentage}% mastery
                                                    </p>

                                                    {/* Latest AI Review */}
                                                    {student.latestReview && (
                                                        <div className="bg-white rounded-lg p-4 border border-slate-200 mb-3">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <Brain className="w-5 h-5 text-purple-600" />
                                                                <span className="font-semibold text-slate-700 text-sm">Latest Quiz: {student.latestReview.skillName}</span>
                                                                <span className={`ml-auto px-2 py-1 rounded text-xs font-medium ${student.latestReview.accuracy >= 80 ? 'bg-green-100 text-green-700' :
                                                                    student.latestReview.accuracy >= 60 ? 'bg-yellow-100 text-yellow-700' :
                                                                        'bg-red-100 text-red-700'
                                                                    }`}>
                                                                    {student.latestReview.accuracy.toFixed(0)}% accuracy
                                                                </span>
                                                            </div>
                                                            <p className="text-slate-600 text-xs mb-2">{student.latestReview.overallPerformance}</p>
                                                            {student.latestReview.strengths.length > 0 && (
                                                                <div className="flex flex-wrap gap-2">
                                                                    {student.latestReview.strengths.slice(0, 3).map((strength, i) => (
                                                                        <span key={i} className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs">
                                                                            ✓ {strength}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            )}
                                                            <div className="flex items-center gap-1 text-xs text-slate-500 mt-2">
                                                                <Clock className="w-3 h-3" />
                                                                {new Date(student.latestReview.createdAt).toLocaleDateString()}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Progress Bar */}
                                                    <div className="bg-slate-200 rounded-full h-3 overflow-hidden mb-3">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${student.masteryPercentage}%` }}
                                                            transition={{ delay: 0.8 + index * 0.1, duration: 0.8 }}
                                                            className={`h-full ${student.atRisk ? 'bg-gradient-to-r from-red-500 to-red-600' : 'bg-gradient-to-r from-emerald-500 to-teal-500'}`}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-end gap-3 ml-4">
                                                {student.atRisk && (
                                                    <span className="bg-red-500 text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg">
                                                        At Risk
                                                    </span>
                                                )}
                                                <Link href={`/teacher/student/${student.id}`}>
                                                    <motion.button
                                                        whileHover={{ scale: 1.05, y: -2 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl"
                                                    >
                                                        <Eye className="w-5 h-5" />
                                                        View Details
                                                    </motion.button>
                                                </Link>
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

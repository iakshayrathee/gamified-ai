'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Database, FileQuestion, Clock, TrendingUp, ArrowUp, ArrowDown, Sparkles } from 'lucide-react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminNavbar from '@/components/navigation/AdminNavbar';
import { ApiClient, AdminStats } from '@/lib/api-client';

export default function AdminPanelPage() {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const data = await ApiClient.getAdminStats();
            setStats(data);
        } catch (error) {
            console.error('Error loading stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const statCards = [
        {
            title: 'Total Users',
            value: stats?.totalUsers || 0,
            icon: Users,
            gradient: 'from-emerald-500 to-teal-600',
            change: '+12%',
            changeType: 'increase' as const,
            details: [
                { label: 'Children', value: stats?.usersByRole.children || 0 },
                { label: 'Educators', value: stats?.usersByRole.educators || 0 },
                { label: 'Admins', value: stats?.usersByRole.admins || 0 },
            ]
        },
        {
            title: 'Domains',
            value: stats?.totalDomains || 0,
            icon: Database,
            gradient: 'from-cyan-500 to-blue-600',
            change: '+5%',
            changeType: 'increase' as const,
            details: [
                { label: 'Skills', value: stats?.totalSkills || 0 },
            ]
        },
        {
            title: 'Questions',
            value: stats?.totalQuestions || 0,
            icon: FileQuestion,
            gradient: 'from-violet-500 to-purple-600',
            change: '+18%',
            changeType: 'increase' as const,
            details: [
                { label: 'Approved', value: stats?.questionsByStatus.approved || 0 },
                { label: 'Pending', value: stats?.questionsByStatus.pending || 0 },
            ]
        },
        {
            title: 'Pending Reviews',
            value: stats?.questionsByStatus.pending || 0,
            icon: Clock,
            gradient: 'from-amber-500 to-orange-600',
            change: '-8%',
            changeType: 'decrease' as const,
            details: [
                { label: 'Requires attention', value: stats?.questionsByStatus.pending || 0 },
            ]
        },
    ];

    if (loading) {
        return (
            <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminNavbar />
                <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 pt-20 p-6 flex items-center justify-center">
                    <div className="text-center">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            className="inline-block rounded-full h-16 w-16 border-4 border-emerald-500 border-t-transparent"
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

    return (
        <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminNavbar />
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
                                <Sparkles className="w-8 h-8 text-emerald-600" />
                            </motion.div>
                            <h1 className="text-4xl font-semibold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">
                                Admin Dashboard
                            </h1>
                        </div>
                        <p className="text-lg text-slate-600">Platform Overview & Management</p>
                    </motion.div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
                                                className={`flex items-center text-sm px-3 py-1 rounded-full ${stat.changeType === 'increase'
                                                        ? 'text-green-700 bg-green-100'
                                                        : 'text-red-700 bg-red-100'
                                                    }`}
                                            >
                                                {stat.changeType === 'increase' ? (
                                                    <ArrowUp className="w-4 h-4 mr-1" />
                                                ) : (
                                                    <ArrowDown className="w-4 h-4 mr-1" />
                                                )}
                                                {stat.change}
                                            </motion.div>
                                        </div>
                                        <h3 className="text-sm text-slate-600 mb-1 uppercase tracking-wide">{stat.title}</h3>
                                        <motion.p
                                            initial={{ opacity: 0, scale: 0.5 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: index * 0.1 + 0.2 }}
                                            className="text-4xl bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-4"
                                        >
                                            {stat.value.toLocaleString()}
                                        </motion.p>
                                        <div className="border-t border-slate-200 pt-3 space-y-2">
                                            {stat.details.map((detail, idx) => (
                                                <motion.div
                                                    key={detail.label}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: index * 0.1 + 0.4 + idx * 0.1 }}
                                                    className="flex justify-between text-sm"
                                                >
                                                    <span className="text-slate-600">{detail.label}:</span>
                                                    <span className="text-slate-900">{detail.value}</span>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Quick Actions */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="mb-8"
                    >
                        <h2 className="text-2xl font-semibold text-slate-900 mb-4">Quick Actions</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[
                                { href: '/admin/documents', icon: FileQuestion, title: 'Manage Documents', desc: 'Upload and review documents', gradient: 'from-emerald-500 to-teal-600' },
                                { href: '/admin/manage', icon: Database, title: 'Data Management', desc: 'Manage users, domains, skills', gradient: 'from-cyan-500 to-blue-600' },
                                { href: '/admin/documents', icon: TrendingUp, title: 'Analytics', desc: 'View platform analytics', gradient: 'from-violet-500 to-purple-600' },
                            ].map((action, index) => {
                                const Icon = action.icon;
                                return (
                                    <Link key={action.href} href={action.href}>
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.6 + index * 0.1 }}
                                            whileHover={{ y: -5, scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            className="bg-white rounded-xl shadow-lg hover:shadow-2xl p-6 border border-slate-200 cursor-pointer transition-all duration-300 group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <motion.div
                                                    whileHover={{ scale: 1.1, rotate: 360 }}
                                                    transition={{ duration: 0.5 }}
                                                    className={`p-4 bg-gradient-to-br ${action.gradient} rounded-xl shadow-lg group-hover:shadow-xl`}
                                                >
                                                    <Icon className="w-7 h-7 text-white" />
                                                </motion.div>
                                                <div>
                                                    <h3 className="text-slate-900 text-lg mb-1">{action.title}</h3>
                                                    <p className="text-sm text-slate-600">{action.desc}</p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    </Link>
                                );
                            })}
                        </div>
                    </motion.div>

                    {/* Recent Activity */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                    >
                        <h2 className="text-2xl font-semibold text-slate-900 mb-4">Recent Uploads</h2>
                        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-200">
                                    <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs text-slate-700 uppercase tracking-wider">
                                                File Name
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs text-slate-700 uppercase tracking-wider">
                                                Upload Date
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs text-slate-700 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs text-slate-700 uppercase tracking-wider">
                                                Questions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-slate-200">
                                        {stats?.recentUploads && stats.recentUploads.length > 0 ? (
                                            stats.recentUploads.slice(0, 5).map((upload, index) => (
                                                <motion.tr
                                                    key={upload.id}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: 0.9 + index * 0.05 }}
                                                    whileHover={{ backgroundColor: 'rgba(16, 185, 129, 0.05)' }}
                                                    className="transition-colors"
                                                >
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                                        {upload.fileName}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                                        {new Date(upload.uploadedAt).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-3 py-1 inline-flex text-xs leading-5 rounded-full ${upload.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                                                upload.status === 'PROCESSING' ? 'bg-yellow-100 text-yellow-800' :
                                                                    'bg-red-100 text-red-800'
                                                            }`}>
                                                            {upload.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                                        {upload.extractedQuestions}
                                                    </td>
                                                </motion.tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                                                    <motion.div
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        transition={{ delay: 1 }}
                                                    >
                                                        No recent uploads
                                                    </motion.div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </ProtectedRoute>
    );
}

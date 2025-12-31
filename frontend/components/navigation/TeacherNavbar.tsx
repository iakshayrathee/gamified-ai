'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, LogOut, User, FileText, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useState } from 'react';

export default function TeacherNavbar() {
    const pathname = usePathname();
    const { logout, user } = useAuth();
    const [showUserMenu, setShowUserMenu] = useState(false);

    const navItems = [
        { href: '/teacher/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { href: '/teacher/performance-reports', icon: FileText, label: 'Reports' },
    ];

    const isActive = (href: string) => pathname === href;

    const handleLogout = () => {
        logout();
    };

    return (
        <motion.nav
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 shadow-2xl"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/teacher/dashboard">
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="flex items-center gap-3 cursor-pointer"
                        >
                            <motion.div
                                whileHover={{ rotate: 360 }}
                                transition={{ duration: 0.6 }}
                                className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg"
                            >
                                <GraduationCap className="w-6 h-6 text-white" />
                            </motion.div>
                            <div>
                                <h1 className="text-white font-semibold text-xl tracking-tight">Teacher Portal</h1>
                                <p className="text-slate-300 text-xs">Literacy Learning Platform</p>
                            </div>
                        </motion.div>
                    </Link>

                    {/* Navigation Items */}
                    <div className="flex items-center gap-2">
                        {navItems.map((item, index) => {
                            const Icon = item.icon;
                            const active = isActive(item.href);

                            return (
                                <Link key={item.href} href={item.href}>
                                    <motion.div
                                        initial={{ opacity: 0, y: -20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        whileHover={{ scale: 1.05, y: -2 }}
                                        whileTap={{ scale: 0.95 }}
                                        className={`relative flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${active
                                                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg'
                                                : 'text-slate-200 hover:bg-slate-600/50'
                                            }`}
                                    >
                                        <Icon className="w-5 h-5" />
                                        <span className="text-sm hidden md:inline">{item.label}</span>
                                        {active && (
                                            <motion.div
                                                layoutId="teacherActiveTab"
                                                className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg -z-10"
                                                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                            />
                                        )}
                                    </motion.div>
                                </Link>
                            );
                        })}
                    </div>

                    {/* User Menu */}
                    <div className="relative">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            className="flex items-center gap-3 px-3 py-2 bg-slate-600/50 hover:bg-slate-600 rounded-lg transition-colors"
                        >
                            <div className="hidden md:block text-right">
                                <p className="text-white text-sm">{user?.name}</p>
                                <p className="text-slate-300 text-xs capitalize">{user?.role?.toLowerCase()}</p>
                            </div>
                            <motion.div
                                whileHover={{ rotate: 360 }}
                                transition={{ duration: 0.5 }}
                                className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg"
                            >
                                <User className="w-5 h-5 text-white" />
                            </motion.div>
                        </motion.button>

                        {/* Dropdown Menu */}
                        <AnimatePresence>
                            {showUserMenu && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                                    className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden"
                                >
                                    <motion.button
                                        whileHover={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-left text-red-600 hover:text-red-700 transition-colors"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        <span className="text-sm">Logout</span>
                                    </motion.button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Bottom border animation */}
            <motion.div
                className="h-1 bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
            />
        </motion.nav>
    );
}

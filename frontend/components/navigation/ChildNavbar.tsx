'use client';

import { motion } from 'framer-motion';
import { Home, Play, LogOut, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function ChildNavbar() {
    const pathname = usePathname();
    const { logout, user } = useAuth();

    const navItems = [
        { href: '/child/home', icon: Home, label: 'Home', emoji: '🏠' },
        { href: '/child/domains', icon: Play, label: 'Play', emoji: '🎮' },
        { href: '/child/analytics', icon: BarChart3, label: 'My Progress', emoji: '📊' },
    ];

    const isActive = (href: string) => pathname === href;

    return (
        <motion.nav
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="fixed top-0 left-0 right-0 z-50 glass backdrop-blur-lg border-b-4 border-white/20"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    {/* Logo/Brand */}
                    <motion.div
                        className="flex items-center gap-3"
                        whileHover={{ scale: 1.05 }}
                    >
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-2xl shadow-lg">
                            📚
                        </div>
                        <div className="hidden sm:block">
                            <h1 className="text-2xl font-bold text-purple-800">Literacy Learning Platform</h1>
                        </div>
                    </motion.div>

                    {/* Navigation Items */}
                    <div className="flex items-center gap-2 sm:gap-4">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const active = isActive(item.href);

                            return (
                                <Link key={item.href} href={item.href}>
                                    <motion.div
                                        whileHover={{ scale: 1.1, y: -2 }}
                                        whileTap={{ scale: 0.95 }}
                                        className={`
                                            relative px-4 py-2 sm:px-6 sm:py-3 rounded-full font-bold transition-all
                                            ${active
                                                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-purple'
                                                : 'bg-white/50 text-purple-700 hover:bg-white/80'
                                            }
                                        `}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl sm:text-2xl">{item.emoji}</span>
                                            <span className="hidden sm:inline text-base sm:text-lg">{item.label}</span>
                                        </div>
                                        {active && (
                                            <motion.div
                                                layoutId="activeIndicator"
                                                className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white rounded-full"
                                            />
                                        )}
                                    </motion.div>
                                </Link>
                            );
                        })}

                        {/* Logout Button */}
                        <motion.button
                            onClick={logout}
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-4 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-orange-400 to-red-400 text-white rounded-full font-bold shadow-lg hover:from-orange-500 hover:to-red-500 transition-all"
                        >
                            <div className="flex items-center gap-2">
                                <LogOut className="w-5 h-5" />
                                <span className="hidden sm:inline">Bye!</span>
                            </div>
                        </motion.button>
                    </div>
                </div>
            </div>
        </motion.nav>
    );
}

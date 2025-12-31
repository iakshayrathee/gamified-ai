'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth-context';
import { GraduationCap, Eye, EyeOff } from 'lucide-react';
import FloatingShapes from '@/components/ui/FloatingShapes';
import AnimatedButton from '@/components/ui/AnimatedButton';

export default function TeacherLoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(email, password, rememberMe);
        } catch (err: any) {
            setError(err.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-400 via-cyan-400 to-teal-400 flex items-center justify-center p-6 relative overflow-hidden">
            <FloatingShapes density="medium" theme="default" />

            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="bg-white rounded-3xl p-10 shadow-2xl max-w-md w-full relative z-10"
            >
                <div className="text-center mb-8">
                    <motion.div
                        className="bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center shadow-lg"
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.6 }}
                    >
                        <GraduationCap className="w-12 h-12 text-white" />
                    </motion.div>
                    <h1 className="text-4xl font-bold text-blue-800 mb-2">Teacher Login</h1>
                    <p className="text-gray-600">Welcome back! Please sign in to continue.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                            Email Address
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-4 py-3 text-base rounded-xl border-2 border-gray-200 focus:border-blue-400 focus:outline-none transition-colors placeholder:text-sm"
                            placeholder="teacher@example.com"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                            Password
                        </label>
                        <div className="relative">
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full px-4 py-3 pr-12 text-base rounded-xl border-2 border-gray-200 focus:border-blue-400 focus:outline-none transition-colors placeholder:text-sm placeholder:tracking-normal"
                                placeholder="Enter your password"
                                style={{ letterSpacing: showPassword ? 'normal' : '0.2em' }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center">
                        <input
                            id="remember"
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="remember" className="ml-2 text-sm text-gray-700">
                            Remember me
                        </label>
                    </div>

                    {error && (
                        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-3 text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    <AnimatedButton
                        type="submit"
                        variant="secondary"
                        size="large"
                        fullWidth
                        disabled={loading}
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </AnimatedButton>
                </form>

                <div className="mt-6 text-center">
                    <a href="/" className="text-sm text-blue-600 hover:text-blue-800 transition-colors">
                        ← Back to Home
                    </a>
                </div>
            </motion.div>
        </div>
    );
}

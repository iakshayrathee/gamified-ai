'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth-context';
import { BookOpen, Sparkles, Eye, EyeOff } from 'lucide-react';
import FloatingShapes from '@/components/ui/FloatingShapes';
import AnimatedButton from '@/components/ui/AnimatedButton';

export default function ChildLoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(email, password);
        } catch (err: any) {
            setError(err.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400 flex items-center justify-center p-6 relative overflow-hidden">
            <FloatingShapes density="high" theme="default" />

            {/* Decorative elements */}
            <motion.div
                className="absolute top-10 left-10 text-6xl"
                animate={{ rotate: 360, y: [0, -20, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
            >
                ⭐
            </motion.div>
            <motion.div
                className="absolute bottom-10 right-10 text-6xl"
                animate={{ rotate: -360, y: [0, 20, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
            >
                🎨
            </motion.div>

            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 50 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                className="bg-white rounded-3xl p-10 shadow-2xl max-w-md w-full relative z-10"
            >
                <div className="text-center mb-8">
                    <motion.div
                        className="bg-gradient-to-br from-purple-400 to-pink-400 rounded-full w-28 h-28 mx-auto mb-6 flex items-center justify-center shadow-lg relative"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ duration: 0.3 }}
                    >
                        <BookOpen className="w-14 h-14 text-white" />
                        <motion.div
                            className="absolute -top-2 -right-2"
                            animate={{ rotate: [0, 15, -15, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            <Sparkles className="w-8 h-8 text-yellow-400" />
                        </motion.div>
                    </motion.div>
                    <h1 className="text-5xl font-bold text-purple-800 mb-3">
                        Welcome Back! 👋
                    </h1>
                    <p className="text-xl text-gray-600">Let's learn and have fun!</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-lg font-bold text-purple-700 mb-2">
                            📧 Your Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-5 py-4 text-xl rounded-2xl border-4 border-purple-200 focus:border-purple-400 focus:outline-none transition-colors placeholder:text-base"
                            placeholder="your@email.com"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-lg font-bold text-purple-700 mb-2">
                            🔒 Password
                        </label>
                        <div className="relative">
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full px-5 py-4 pr-14 text-lg rounded-2xl border-4 border-purple-200 focus:border-purple-400 focus:outline-none transition-colors placeholder:text-base placeholder:tracking-normal"
                                placeholder="Enter your password"
                                style={{ letterSpacing: showPassword ? 'normal' : '0.3em' }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-purple-500 hover:text-purple-700 transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-red-50 border-4 border-red-200 rounded-2xl p-4 text-red-700 text-base font-semibold"
                        >
                            ❌ {error}
                        </motion.div>
                    )}

                    <AnimatedButton
                        type="submit"
                        variant="primary"
                        size="large"
                        fullWidth
                        withGlow
                        disabled={loading}
                    >
                        {loading ? '⏳ Signing in...' : '🚀 Let\'s Go!'}
                    </AnimatedButton>
                </form>

                <div className="mt-6 text-center">
                    <a href="/" className="text-base font-semibold text-purple-600 hover:text-purple-800 transition-colors">
                        ← Back to Home
                    </a>
                </div>
            </motion.div>
        </div>
    );
}

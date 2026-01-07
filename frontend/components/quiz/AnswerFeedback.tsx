'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Star, Clock } from 'lucide-react';

interface AnswerFeedbackProps {
    isVisible: boolean;
    isCorrect: boolean;
    starsEarned: number;
    timeTaken: number;
}

export default function AnswerFeedback({ isVisible, isCorrect, starsEarned, timeTaken }: AnswerFeedbackProps) {
    return (
        <AnimatePresence>
            {isVisible && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
                    />

                    {/* Simplified Celebration Animation */}
                    {isCorrect && (
                        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
                            {/* Reduced confetti particles */}
                            {[...Array(15)].map((_, i) => {
                                const angle = (Math.random() * 140 - 70);
                                const distance = 100 + Math.random() * 80;
                                const duration = 1 + Math.random() * 0.5;

                                return (
                                    <motion.div
                                        key={i}
                                        initial={{
                                            opacity: 1,
                                            x: typeof window !== 'undefined' ? window.innerWidth / 2 : 0,
                                            y: 0,
                                            scale: 0,
                                            rotate: 0
                                        }}
                                        animate={{
                                            opacity: [1, 1, 0],
                                            x: typeof window !== 'undefined'
                                                ? window.innerWidth / 2 + Math.sin(angle * Math.PI / 180) * distance * (window.innerWidth / 100)
                                                : 0,
                                            y: Math.cos(angle * Math.PI / 180) * distance * 8,
                                            scale: [0, 1, 0.7],
                                            rotate: Math.random() * 360
                                        }}
                                        transition={{
                                            duration: duration,
                                            delay: i * 0.02,
                                            ease: "easeOut"
                                        }}
                                        className="absolute text-2xl"
                                        style={{
                                            left: 0,
                                            top: 0
                                        }}
                                    >
                                        {['⭐', '✨', '🌟'][i % 3]}
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}

                    {/* Feedback Card - Smaller and cleaner */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20 }}
                        transition={{ type: 'spring', duration: 0.4 }}
                        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50"
                    >
                        <div className={`bg-white rounded-2xl p-6 shadow-xl min-w-[320px] ${isCorrect ? 'border-4 border-green-400' : 'border-4 border-red-400'
                            }`}>
                            {/* Icon and Message */}
                            <div className="text-center mb-4">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', delay: 0.1, stiffness: 200 }}
                                    className="inline-block mb-3"
                                >
                                    {isCorrect ? (
                                        <CheckCircle className="w-16 h-16 text-green-500" />
                                    ) : (
                                        <XCircle className="w-16 h-16 text-red-500" />
                                    )}
                                </motion.div>

                                <motion.h3
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className={`text-3xl font-bold mb-1 ${isCorrect ? 'text-green-600' : 'text-red-600'
                                        }`}
                                >
                                    {isCorrect ? 'Great Job!' : 'Try Again!'}
                                </motion.h3>

                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                    className="text-gray-600 text-base"
                                >
                                    {isCorrect
                                        ? 'You got it right! 🎉'
                                        : 'Keep trying! 💪'}
                                </motion.p>
                            </div>

                            {/* Stats - Highly Professional & Compact */}
                            {isCorrect && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.3 }}
                                    className="flex items-center justify-center gap-6 py-2 px-4 bg-gray-50 rounded-2xl border border-gray-100 shadow-inner mt-4"
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                        </div>
                                        <div className="text-left">
                                            <div className="text-lg font-bold text-gray-800 leading-none">
                                                +{starsEarned}
                                            </div>
                                            <div className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mt-0.5">
                                                Stars
                                            </div>
                                        </div>
                                    </div>

                                    <div className="w-px h-8 bg-gray-200" />

                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                            <Clock className="w-4 h-4 text-blue-500" />
                                        </div>
                                        <div className="text-left">
                                            <div className="text-lg font-bold text-gray-800 leading-none">
                                                {timeTaken.toFixed(1)}s
                                            </div>
                                            <div className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mt-0.5">
                                                Time
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

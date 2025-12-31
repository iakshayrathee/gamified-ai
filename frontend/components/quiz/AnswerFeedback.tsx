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

                    {/* Party Popper Animation - Full Screen */}
                    {isCorrect && (
                        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
                            {/* Confetti particles from top-middle spreading diagonally */}
                            {[...Array(50)].map((_, i) => {
                                const angle = (Math.random() * 140 - 70); // -70 to 70 degrees from vertical
                                const distance = 150 + Math.random() * 100; // Random distance
                                const duration = 1.2 + Math.random() * 0.8;

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
                                            y: Math.cos(angle * Math.PI / 180) * distance * 10,
                                            scale: [0, 1, 0.8],
                                            rotate: Math.random() * 720
                                        }}
                                        transition={{
                                            duration: duration,
                                            delay: i * 0.01,
                                            ease: [0.36, 0, 0.66, -0.56] // Custom easing for popper effect
                                        }}
                                        className="absolute text-3xl"
                                        style={{
                                            left: 0,
                                            top: 0
                                        }}
                                    >
                                        {['🎉', '🎊', '⭐', '✨', '🌟', '💫', '🎈', '🎁'][i % 8]}
                                    </motion.div>
                                );
                            })}

                            {/* Streamer ribbons */}
                            {[...Array(12)].map((_, i) => {
                                const angle = (i * 30 - 165); // Spread across top
                                const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#FF69B4'];

                                return (
                                    <motion.div
                                        key={`ribbon-${i}`}
                                        initial={{
                                            opacity: 1,
                                            x: typeof window !== 'undefined' ? window.innerWidth / 2 : 0,
                                            y: 0,
                                            scaleY: 0,
                                            rotate: angle
                                        }}
                                        animate={{
                                            opacity: [1, 1, 0],
                                            y: typeof window !== 'undefined' ? window.innerHeight : 1000,
                                            scaleY: [0, 1, 1],
                                            rotate: angle + Math.random() * 60 - 30
                                        }}
                                        transition={{
                                            duration: 1.5,
                                            delay: i * 0.03,
                                            ease: "easeOut"
                                        }}
                                        className="absolute w-2 h-32 rounded-full"
                                        style={{
                                            left: 0,
                                            top: 0,
                                            background: `linear-gradient(to bottom, ${colors[i % colors.length]}, transparent)`,
                                            transformOrigin: 'top center'
                                        }}
                                    />
                                );
                            })}
                        </div>
                    )}

                    {/* Feedback Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5, y: 50 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.5, y: 50 }}
                        transition={{ type: 'spring', duration: 0.5 }}
                        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50"
                    >
                        <div className={`bg-white rounded-3xl p-8 shadow-2xl min-w-[400px] ${isCorrect ? 'border-4 border-green-400' : 'border-4 border-red-400'
                            }`}>
                            {/* Icon and Message */}
                            <div className="text-center mb-6">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', delay: 0.2, stiffness: 200 }}
                                    className="inline-block mb-4"
                                >
                                    {isCorrect ? (
                                        <CheckCircle className="w-24 h-24 text-green-500" />
                                    ) : (
                                        <XCircle className="w-24 h-24 text-red-500" />
                                    )}
                                </motion.div>

                                <motion.h3
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className={`text-4xl font-bold mb-2 ${isCorrect ? 'text-green-600' : 'text-red-600'
                                        }`}
                                >
                                    {isCorrect ? 'Awesome!' : 'Oops!'}
                                </motion.h3>

                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.4 }}
                                    className="text-gray-600 text-lg"
                                >
                                    {isCorrect
                                        ? 'You got it right! 🎉'
                                        : 'Not quite, but keep trying! 💪'}
                                </motion.p>
                            </div>

                            {/* Stats */}
                            {isCorrect && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 }}
                                    className="flex items-center justify-center gap-6 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-4"
                                >
                                    <div className="flex items-center gap-2">
                                        <Star className="w-8 h-8 text-yellow-500 fill-yellow-500" />
                                        <div>
                                            <div className="text-2xl font-bold text-yellow-600">
                                                +{starsEarned}
                                            </div>
                                            <div className="text-xs text-gray-600">Stars</div>
                                        </div>
                                    </div>

                                    <div className="w-px h-12 bg-gray-300" />

                                    <div className="flex items-center gap-2">
                                        <Clock className="w-8 h-8 text-blue-500" />
                                        <div>
                                            <div className="text-2xl font-bold text-blue-600">
                                                {timeTaken.toFixed(1)}s
                                            </div>
                                            <div className="text-xs text-gray-600">Time</div>
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

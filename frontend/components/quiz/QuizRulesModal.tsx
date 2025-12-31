'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Clock, TrendingUp, Star, Trophy, Sparkles, X } from 'lucide-react';

interface QuizRulesModalProps {
    isOpen: boolean;
    onStart: () => void;
    skillName: string;
}

export default function QuizRulesModal({ isOpen, onStart, skillName }: QuizRulesModalProps) {
    const rules = [
        {
            icon: <Target className="w-8 h-8" />,
            emoji: '🎯',
            title: 'Adaptive Quiz Journey',
            description: 'Start with 5 beginner questions, then the quiz adapts to your skill level. Complete at least 10 questions total!',
            color: 'from-blue-400 to-cyan-500'
        },
        {
            icon: <Clock className="w-8 h-8" />,
            emoji: '⏱️',
            title: '30 Seconds Per Question',
            description: 'Think fast! You have 30 seconds for each question.',
            color: 'from-orange-400 to-amber-500'
        },
        {
            icon: <TrendingUp className="w-8 h-8" />,
            emoji: '📈',
            title: 'Smart Difficulty Adjustment',
            description: 'Questions get harder if you\'re doing great, or easier if you need more practice!',
            color: 'from-purple-400 to-pink-500'
        },
        {
            icon: <Star className="w-8 h-8" />,
            emoji: '⭐',
            title: 'Earn Stars & Coins',
            description: 'Get stars for correct answers and bonus stars for speed!',
            color: 'from-yellow-400 to-orange-500'
        }
    ];

    const masteryCriteria = [
        { label: 'Accuracy', value: '≥ 80%', description: 'You need to maintain at least 80% accuracy over your last 10 attempts to master this skill.' },
        { label: 'Speed', value: '≤ 4 seconds', description: 'Your average response time should be 4 seconds or less to demonstrate mastery.' },
        { label: 'Confusion Rate', value: '< 20%', description: 'Keep errors on similar-looking letters (like b/d, p/q) below 20% to show true understanding.' }
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                        onClick={onStart}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: 'spring', duration: 0.5 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-6"
                    >
                        <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto quiz-modal-scroll">
                            <style jsx>{`
                                .quiz-modal-scroll::-webkit-scrollbar {
                                    width: 10px;
                                }
                                .quiz-modal-scroll::-webkit-scrollbar-track {
                                    background: #f3e8ff;
                                    border-radius: 24px;
                                    margin: 24px 0;
                                }
                                .quiz-modal-scroll::-webkit-scrollbar-thumb {
                                    background: linear-gradient(to bottom, #a855f7, #ec4899);
                                    border-radius: 24px;
                                    border: 2px solid #f3e8ff;
                                }
                                .quiz-modal-scroll::-webkit-scrollbar-thumb:hover {
                                    background: linear-gradient(to bottom, #9333ea, #db2777);
                                }
                                .quiz-modal-scroll::-webkit-scrollbar-corner {
                                    background: transparent;
                                    border-radius: 24px;
                                }
                            `}</style>
                            {/* Header */}
                            <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 p-6 rounded-t-3xl relative">
                                <motion.div
                                    animate={{ rotate: [0, 10, -10, 0] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="absolute top-3 right-3 text-5xl"
                                >
                                    🎮
                                </motion.div>

                                <motion.div
                                    initial={{ y: -20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <Sparkles className="w-7 h-7 text-yellow-300" />
                                        <h2 className="text-3xl font-bold text-white">Let's Play!</h2>
                                    </div>
                                    <p className="text-white/90 text-lg font-medium">{skillName}</p>
                                </motion.div>
                            </div>

                            {/* Content - Two Column Layout */}
                            <div className="p-6">
                                <div className="grid grid-cols-2 gap-5">
                                    {/* Left Column - Quiz Rules */}
                                    <div>
                                        <h3 className="text-xl font-bold text-purple-800 mb-4 flex items-center gap-2">
                                            <span className="text-2xl">📋</span>
                                            How to Master This Quiz
                                        </h3>

                                        <div className="space-y-3">
                                            {rules.map((rule, index) => (
                                                <motion.div
                                                    key={index}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: 0.1 * index }}
                                                    className="flex items-start gap-2.5 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-3 hover:shadow-lg transition-shadow"
                                                >
                                                    <div className={`flex-shrink-0 w-10 h-10 bg-gradient-to-br ${rule.color} rounded-lg flex items-center justify-center text-xl shadow-lg`}>
                                                        {rule.emoji}
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="font-bold text-sm text-purple-800 mb-0.5">
                                                            {rule.title}
                                                        </h4>
                                                        <p className="text-gray-600 text-xs leading-relaxed">
                                                            {rule.description}
                                                        </p>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Right Column - Mastery Criteria */}
                                    <div>
                                        <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl p-5 h-full">
                                            <h3 className="text-xl font-bold text-purple-800 mb-2 flex items-center gap-2">
                                                <Trophy className="w-6 h-6 text-purple-600" />
                                                Criteria for Mastery
                                            </h3>
                                            <p className="text-gray-700 mb-4 font-medium text-xs">A micro-skill is mastered when:</p>
                                            <div className="space-y-3">
                                                {masteryCriteria.map((criterion, index) => (
                                                    <motion.div
                                                        key={index}
                                                        initial={{ opacity: 0, x: 10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: 0.5 + index * 0.1 }}
                                                        className="flex items-start gap-2.5 bg-white rounded-lg p-3 shadow-md"
                                                    >
                                                        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                                            ✓
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="font-bold text-purple-800 text-sm mb-0.5">
                                                                {criterion.label} {criterion.value}
                                                            </div>
                                                            <div className="text-xs text-gray-600 leading-relaxed">
                                                                {criterion.description}
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Start Button */}
                                <motion.button
                                    whileHover={{ scale: 1.05, y: -2 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={onStart}
                                    className="w-full bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 text-white font-bold text-xl py-5 rounded-2xl shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-3 mt-5"
                                >
                                    <Sparkles className="w-7 h-7" />
                                    <span>Start Quiz!</span>
                                    <motion.span
                                        animate={{ x: [0, 5, 0] }}
                                        transition={{ duration: 1, repeat: Infinity }}
                                    >
                                        🚀
                                    </motion.span>
                                </motion.button>

                                <p className="text-center text-gray-500 text-xs mt-3">
                                    💪 You've got this! Good luck!
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

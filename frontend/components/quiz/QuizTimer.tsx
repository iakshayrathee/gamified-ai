'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Zap } from 'lucide-react';

interface QuizTimerProps {
    timeRemaining: number;
    totalTime: number;
    isActive: boolean;
}

export default function QuizTimer({ timeRemaining, totalTime, isActive }: QuizTimerProps) {
    const percentage = (timeRemaining / totalTime) * 100;

    // Color coding based on time remaining
    const getColor = () => {
        if (percentage > 66) return 'from-green-400 to-emerald-500';
        if (percentage > 33) return 'from-yellow-400 to-orange-500';
        return 'from-red-400 to-pink-500';
    };

    const getTextColor = () => {
        if (percentage > 66) return 'text-green-600';
        if (percentage > 33) return 'text-orange-600';
        return 'text-red-600';
    };

    const getBgColor = () => {
        if (percentage > 66) return 'bg-green-50';
        if (percentage > 33) return 'bg-orange-50';
        return 'bg-red-50';
    };

    return (
        <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`flex items-center gap-3 ${getBgColor()} rounded-2xl px-5 py-3 shadow-xl transition-colors duration-300`}
        >
            <motion.div
                animate={percentage < 33 ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 0.5, repeat: percentage < 33 ? Infinity : 0 }}
            >
                {percentage < 33 ? (
                    <Zap className={`w-7 h-7 ${getTextColor()} fill-current`} />
                ) : (
                    <Clock className={`w-7 h-7 ${getTextColor()}`} />
                )}
            </motion.div>

            <div className="flex flex-col items-center">
                <motion.span
                    className={`${getTextColor()} font-bold text-2xl tabular-nums`}
                    animate={percentage < 10 ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 0.3, repeat: percentage < 10 ? Infinity : 0 }}
                >
                    {timeRemaining}s
                </motion.span>

                {/* Mini progress bar */}
                <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden mt-1">
                    <motion.div
                        className={`h-full bg-gradient-to-r ${getColor()}`}
                        initial={{ width: '100%' }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.3 }}
                    />
                </div>
            </div>
        </motion.div>
    );
}

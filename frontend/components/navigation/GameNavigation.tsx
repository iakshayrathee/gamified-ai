'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Pause, Play, Home, X } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface GameNavigationProps {
    onPause?: () => void;
    onResume?: () => void;
}

export default function GameNavigation({ onPause, onResume }: GameNavigationProps) {
    const [isPaused, setIsPaused] = useState(false);
    const [showExitConfirm, setShowExitConfirm] = useState(false);
    const router = useRouter();

    const handlePauseToggle = () => {
        if (isPaused) {
            setIsPaused(false);
            onResume?.();
        } else {
            setIsPaused(true);
            onPause?.();
        }
    };

    const handleExitClick = () => {
        setShowExitConfirm(true);
        if (!isPaused) {
            setIsPaused(true);
            onPause?.();
        }
    };

    const handleConfirmExit = () => {
        router.push('/child/home');
    };

    const handleCancelExit = () => {
        setShowExitConfirm(false);
    };

    return (
        <>
            {/* Floating Pause Button */}
            <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="fixed top-4 left-4 z-50"
            >
                <motion.button
                    onClick={handlePauseToggle}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-14 h-14 bg-white rounded-full shadow-2xl flex items-center justify-center hover:shadow-purple transition-all"
                >
                    {isPaused ? (
                        <Play className="w-7 h-7 text-green-600 fill-current" />
                    ) : (
                        <Pause className="w-7 h-7 text-purple-600" />
                    )}
                </motion.button>
            </motion.div>

            {/* Pause Menu Overlay */}
            <AnimatePresence>
                {isPaused && !showExitConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center"
                        onClick={handlePauseToggle}
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0, y: 50 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.8, opacity: 0, y: 50 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-3xl p-8 shadow-2xl max-w-md w-full mx-4"
                        >
                            <div className="text-center mb-8">
                                <div className="text-6xl mb-4">⏸️</div>
                                <h2 className="text-4xl font-bold text-purple-800 mb-2">Game Paused</h2>
                                <p className="text-xl text-gray-600">Take a break!</p>
                            </div>

                            <div className="space-y-4">
                                <motion.button
                                    onClick={handlePauseToggle}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="w-full px-8 py-4 bg-gradient-to-r from-green-400 to-emerald-500 text-white rounded-full font-bold text-xl shadow-lg hover:from-green-500 hover:to-emerald-600 transition-all"
                                >
                                    <div className="flex items-center justify-center gap-3">
                                        <Play className="w-6 h-6 fill-current" />
                                        Resume Game
                                    </div>
                                </motion.button>

                                <motion.button
                                    onClick={handleExitClick}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="w-full px-8 py-4 bg-gradient-to-r from-orange-400 to-red-400 text-white rounded-full font-bold text-xl shadow-lg hover:from-orange-500 hover:to-red-500 transition-all"
                                >
                                    <div className="flex items-center justify-center gap-3">
                                        <Home className="w-6 h-6" />
                                        Exit to Home
                                    </div>
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Exit Confirmation Modal */}
            <AnimatePresence>
                {showExitConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center"
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0, y: 50 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.8, opacity: 0, y: 50 }}
                            className="bg-white rounded-3xl p-8 shadow-2xl max-w-md w-full mx-4"
                        >
                            <div className="text-center mb-8">
                                <div className="text-6xl mb-4">🤔</div>
                                <h2 className="text-3xl font-bold text-purple-800 mb-2">Exit Game?</h2>
                                <p className="text-lg text-gray-600">Your progress will be saved!</p>
                            </div>

                            <div className="space-y-4">
                                <motion.button
                                    onClick={handleConfirmExit}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="w-full px-8 py-4 bg-gradient-to-r from-orange-400 to-red-400 text-white rounded-full font-bold text-xl shadow-lg hover:from-orange-500 hover:to-red-500 transition-all"
                                >
                                    <div className="flex items-center justify-center gap-3">
                                        <Home className="w-6 h-6" />
                                        Yes, Exit
                                    </div>
                                </motion.button>

                                <motion.button
                                    onClick={handleCancelExit}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="w-full px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-bold text-xl shadow-lg hover:from-purple-600 hover:to-pink-600 transition-all"
                                >
                                    <div className="flex items-center justify-center gap-3">
                                        <X className="w-6 h-6" />
                                        Cancel
                                    </div>
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

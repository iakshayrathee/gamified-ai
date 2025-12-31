'use client';

import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface GameContainerProps {
    children: ReactNode;
    showSuccess?: boolean;
}

export default function GameContainer({
    children,
    showSuccess = false
}: GameContainerProps) {
    return (
        <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative w-full max-w-6xl mx-auto"
        >
            {/* Success celebration overlay */}
            <AnimatePresence>
                {showSuccess && (
                    <>
                        {/* Confetti burst */}
                        {Array.from({ length: 20 }).map((_, i) => (
                            <motion.div
                                key={i}
                                initial={{
                                    x: 0,
                                    y: 0,
                                    scale: 0,
                                    opacity: 1
                                }}
                                animate={{
                                    x: (Math.random() - 0.5) * 400,
                                    y: (Math.random() - 0.5) * 400,
                                    scale: 1,
                                    opacity: 0
                                }}
                                transition={{
                                    duration: 1,
                                    ease: "easeOut"
                                }}
                                className="absolute top-1/2 left-1/2 w-3 h-3 rounded-full"
                                style={{
                                    backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A'][i % 5]
                                }}
                            />
                        ))}

                        {/* Success emoji */}
                        <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            exit={{ scale: 0, rotate: 180 }}
                            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-9xl z-50 pointer-events-none"
                        >
                            🎉
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Game content - TRANSPARENT background, wider container */}
            <div className="bg-transparent rounded-3xl p-8">
                {children}
            </div>
        </motion.div>
    );
}


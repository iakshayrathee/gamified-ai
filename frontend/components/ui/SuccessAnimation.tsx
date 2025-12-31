'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface SuccessAnimationProps {
    show: boolean;
    intensity?: 'low' | 'medium' | 'high';
}

export default function SuccessAnimation({ show, intensity = 'high' }: SuccessAnimationProps) {
    const [confetti, setConfetti] = useState<Array<{ id: number; x: number; y: number; rotation: number; color: string; delay: number }>>([]);

    useEffect(() => {
        if (show) {
            const count = intensity === 'high' ? 50 : intensity === 'medium' ? 30 : 15;
            const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE'];

            const newConfetti = Array.from({ length: count }, (_, i) => ({
                id: i,
                x: Math.random() * 100 - 50,
                y: Math.random() * -100 - 50,
                rotation: Math.random() * 360,
                color: colors[Math.floor(Math.random() * colors.length)],
                delay: Math.random() * 0.3
            }));

            setConfetti(newConfetti);
        } else {
            setConfetti([]);
        }
    }, [show, intensity]);

    return (
        <AnimatePresence>
            {show && (
                <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
                    {/* Confetti particles */}
                    {confetti.map((particle) => (
                        <motion.div
                            key={particle.id}
                            initial={{
                                x: '50vw',
                                y: '50vh',
                                scale: 0,
                                rotate: 0,
                                opacity: 1
                            }}
                            animate={{
                                x: `calc(50vw + ${particle.x}vw)`,
                                y: `calc(100vh + ${particle.y}vh)`,
                                scale: [0, 1, 1, 0.8],
                                rotate: particle.rotation,
                                opacity: [1, 1, 0.8, 0]
                            }}
                            transition={{
                                duration: 1.5,
                                delay: particle.delay,
                                ease: 'easeOut'
                            }}
                            className="absolute w-3 h-3 rounded-sm"
                            style={{ backgroundColor: particle.color }}
                        />
                    ))}

                    {/* Star burst */}
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: [0, 1.5, 1], opacity: [0, 1, 0] }}
                        transition={{ duration: 0.8 }}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                    >
                        <div className="text-9xl">⭐</div>
                    </motion.div>

                    {/* Radial glow */}
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 3, opacity: [0, 0.3, 0] }}
                        transition={{ duration: 1 }}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-gradient-to-r from-green-400 to-emerald-400 blur-3xl"
                    />

                    {/* Bouncing emojis */}
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={`emoji-${i}`}
                            initial={{ y: '50vh', x: `${30 + i * 20}vw`, scale: 0 }}
                            animate={{
                                y: ['50vh', '20vh', '30vh', '25vh', '100vh'],
                                scale: [0, 1.5, 1.2, 1, 0.8]
                            }}
                            transition={{
                                duration: 2,
                                delay: i * 0.1,
                                ease: 'easeOut'
                            }}
                            className="absolute text-6xl"
                        >
                            {['🎉', '🌟', '✨'][i]}
                        </motion.div>
                    ))}
                </div>
            )}
        </AnimatePresence>
    );
}

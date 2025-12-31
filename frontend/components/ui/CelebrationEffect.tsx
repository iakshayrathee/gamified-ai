'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface Particle {
    id: number;
    x: number;
    y: number;
    color: string;
    size: number;
    emoji: string;
}

interface CelebrationEffectProps {
    show: boolean;
    intensity?: 'low' | 'medium' | 'high';
    type?: 'confetti' | 'stars' | 'fireworks' | 'all';
    duration?: number;
}

const emojis = {
    confetti: ['🎉', '🎊', '✨', '⭐', '🌟'],
    stars: ['⭐', '🌟', '✨', '💫', '🌠'],
    fireworks: ['🎆', '🎇', '✨', '💥', '🌟'],
};

const colors = ['#FFD93D', '#FF6B9D', '#A78BFA', '#6BCF7F', '#4FD1C5', '#FFA500', '#FF69B4'];

export default function CelebrationEffect({
    show,
    intensity = 'medium',
    type = 'all',
    duration = 3000,
}: CelebrationEffectProps) {
    const [particles, setParticles] = useState<Particle[]>([]);

    useEffect(() => {
        if (!show) {
            setParticles([]);
            return;
        }

        const count = intensity === 'low' ? 20 : intensity === 'medium' ? 40 : 60;
        const emojiSet = type === 'all'
            ? [...emojis.confetti, ...emojis.stars, ...emojis.fireworks]
            : emojis[type as keyof typeof emojis] || emojis.confetti;

        const newParticles: Particle[] = Array.from({ length: count }, (_, i) => ({
            id: i,
            x: 50 + (Math.random() - 0.5) * 20, // Start near center
            y: 50 + (Math.random() - 0.5) * 20,
            color: colors[Math.floor(Math.random() * colors.length)],
            size: 20 + Math.random() * 30,
            emoji: emojiSet[Math.floor(Math.random() * emojiSet.length)],
        }));

        setParticles(newParticles);

        // Clear particles after duration
        const timer = setTimeout(() => {
            setParticles([]);
        }, duration);

        return () => clearTimeout(timer);
    }, [show, intensity, type, duration]);

    return (
        <AnimatePresence>
            {particles.length > 0 && (
                <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
                    {particles.map((particle) => (
                        <motion.div
                            key={particle.id}
                            className="absolute"
                            style={{
                                left: `${particle.x}%`,
                                top: `${particle.y}%`,
                                fontSize: `${particle.size}px`,
                            }}
                            initial={{ scale: 0, opacity: 0, rotate: 0 }}
                            animate={{
                                scale: [0, 1.2, 1],
                                opacity: [0, 1, 1, 0],
                                x: [(Math.random() - 0.5) * 400, (Math.random() - 0.5) * 800],
                                y: [(Math.random() - 0.5) * 400, (Math.random() - 0.5) * 800],
                                rotate: [0, Math.random() * 720 - 360],
                            }}
                            transition={{
                                duration: 2 + Math.random() * 2,
                                ease: 'easeOut',
                            }}
                            exit={{ opacity: 0, scale: 0 }}
                        >
                            {particle.emoji}
                        </motion.div>
                    ))}

                    {/* Screen flash effect */}
                    <motion.div
                        className="absolute inset-0 bg-white"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 0.3, 0] }}
                        transition={{ duration: 0.5 }}
                    />

                    {/* Radial burst effect */}
                    <motion.div
                        className="absolute inset-0 flex items-center justify-center"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: [0, 3, 4], opacity: [0.5, 0.3, 0] }}
                        transition={{ duration: 1.5, ease: 'easeOut' }}
                    >
                        <div className="w-32 h-32 rounded-full bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500" />
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

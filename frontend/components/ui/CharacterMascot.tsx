'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { useState, useEffect } from 'react';

type Expression = 'happy' | 'thinking' | 'celebrating' | 'encouraging' | 'excited' | 'proud';
type Position = 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right' | 'center';

interface CharacterMascotProps {
    expression?: Expression;
    message?: string;
    position?: Position;
    showSpeechBubble?: boolean;
    size?: 'small' | 'medium' | 'large';
    character?: 'owl' | 'book' | 'star';
}

const positionClasses = {
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
};

const sizeClasses = {
    small: 'w-20 h-20',
    medium: 'w-32 h-32',
    large: 'w-48 h-48',
};

const characterImages = {
    owl: '/owl_mascot_character_1765735937930.png',
    book: '/book_mascot_character_1765735991537.png',
    star: '/celebration_star_character_1765735973398.png',
};

export default function CharacterMascot({
    expression = 'happy',
    message,
    position = 'bottom-right',
    showSpeechBubble = false,
    size = 'medium',
    character = 'owl',
}: CharacterMascotProps) {
    const [isVisible, setIsVisible] = useState(true);
    const [currentExpression, setCurrentExpression] = useState(expression);

    useEffect(() => {
        setCurrentExpression(expression);
    }, [expression]);

    // Animation variants based on expression
    const getAnimation = () => {
        switch (currentExpression) {
            case 'celebrating':
                return {
                    y: [0, -20, 0],
                    rotate: [0, -10, 10, -10, 0],
                    scale: [1, 1.1, 1],
                    transition: { duration: 0.8, repeat: 2 },
                };
            case 'thinking':
                return {
                    rotate: [-5, 5, -5],
                    transition: { duration: 2, repeat: Infinity },
                };
            case 'encouraging':
                return {
                    y: [0, -10, 0],
                    transition: { duration: 1.5, repeat: Infinity },
                };
            case 'excited':
                return {
                    scale: [1, 1.05, 1],
                    y: [0, -5, 0],
                    transition: { duration: 0.5, repeat: Infinity },
                };
            case 'proud':
                return {
                    scale: [1, 1.02, 1],
                    transition: { duration: 2, repeat: Infinity },
                };
            default: // happy
                return {
                    y: [0, -8, 0],
                    transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
                };
        }
    };

    if (!isVisible) return null;

    return (
        <div className={`fixed ${positionClasses[position]} z-40 pointer-events-none`}>
            <div className="relative">
                {/* Speech Bubble */}
                {showSpeechBubble && message && (
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 pointer-events-auto"
                    >
                        <div className="relative bg-white rounded-2xl px-6 py-4 shadow-xl max-w-xs">
                            <p className="text-lg font-bold text-purple-800 text-center">{message}</p>
                            {/* Speech bubble tail */}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
                                <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-white" />
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Character */}
                <motion.div
                    className={`${sizeClasses[size]} relative cursor-pointer pointer-events-auto`}
                    animate={getAnimation()}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsVisible(false)}
                >
                    {/* Glow effect */}
                    <motion.div
                        className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 opacity-30 blur-xl"
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.3, 0.5, 0.3],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        }}
                    />

                    {/* Character Image Placeholder - Using colored circle for now */}
                    <div className="relative w-full h-full bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center shadow-2xl">
                        <span className="text-6xl">
                            {character === 'owl' ? '🦉' : character === 'book' ? '📚' : '⭐'}
                        </span>
                    </div>

                    {/* Expression indicator (sparkles, hearts, etc.) */}
                    {currentExpression === 'celebrating' && (
                        <motion.div
                            className="absolute -top-2 -right-2 text-3xl"
                            animate={{
                                rotate: [0, 360],
                                scale: [1, 1.2, 1],
                            }}
                            transition={{
                                duration: 1,
                                repeat: Infinity,
                            }}
                        >
                            ✨
                        </motion.div>
                    )}

                    {currentExpression === 'encouraging' && (
                        <motion.div
                            className="absolute -top-2 -right-2 text-3xl"
                            animate={{
                                y: [0, -10, 0],
                            }}
                            transition={{
                                duration: 1,
                                repeat: Infinity,
                            }}
                        >
                            💪
                        </motion.div>
                    )}

                    {currentExpression === 'proud' && (
                        <motion.div
                            className="absolute -top-2 -right-2 text-3xl"
                            animate={{
                                scale: [1, 1.3, 1],
                            }}
                            transition={{
                                duration: 1.5,
                                repeat: Infinity,
                            }}
                        >
                            🏆
                        </motion.div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}

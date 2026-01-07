'use client';

import { motion } from 'framer-motion';
import { Star, TrendingUp, BookOpen } from 'lucide-react';

export interface TierBadgeProps {
    tier: 1 | 2 | 3;
    size?: 'sm' | 'md' | 'lg';
    showLabel?: boolean;
    animated?: boolean;
}

const tierConfig = {
    1: {
        label: 'Star Reader',
        emoji: '⭐',
        description: 'Amazing! You\'re reading like a star!',
        color: 'from-yellow-400 to-amber-500',
        bgColor: 'bg-gradient-to-br from-yellow-50 to-amber-50',
        borderColor: 'border-yellow-400',
        textColor: 'text-yellow-800',
        icon: Star,
        iconColor: 'text-yellow-500'
    },
    2: {
        label: 'Rising Reader',
        emoji: '🌟',
        description: 'Great progress! Keep practicing!',
        color: 'from-purple-400 to-pink-500',
        bgColor: 'bg-gradient-to-br from-purple-50 to-pink-50',
        borderColor: 'border-purple-400',
        textColor: 'text-purple-800',
        icon: TrendingUp,
        iconColor: 'text-purple-500'
    },
    3: {
        label: 'Learning Reader',
        emoji: '📚',
        description: 'You\'re learning! Let\'s practice together!',
        color: 'from-blue-400 to-cyan-500',
        bgColor: 'bg-gradient-to-br from-blue-50 to-cyan-50',
        borderColor: 'border-blue-400',
        textColor: 'text-blue-800',
        icon: BookOpen,
        iconColor: 'text-blue-500'
    }
};

const sizeConfig = {
    sm: {
        container: 'px-3 py-1.5',
        emoji: 'text-xl',
        label: 'text-sm',
        icon: 'w-4 h-4'
    },
    md: {
        container: 'px-4 py-2',
        emoji: 'text-2xl',
        label: 'text-base',
        icon: 'w-5 h-5'
    },
    lg: {
        container: 'px-6 py-3',
        emoji: 'text-4xl',
        label: 'text-lg',
        icon: 'w-6 h-6'
    }
};

export default function TierBadge({
    tier,
    size = 'md',
    showLabel = true,
    animated = true
}: TierBadgeProps) {
    const config = tierConfig[tier];
    const sizes = sizeConfig[size];
    const Icon = config.icon;

    const badgeVariants = {
        initial: { scale: 0, rotate: -180 },
        animate: {
            scale: 1,
            rotate: 0,
            transition: {
                type: 'spring',
                stiffness: 260,
                damping: 20
            }
        },
        hover: {
            scale: 1.05,
            transition: {
                type: 'spring',
                stiffness: 400,
                damping: 10
            }
        }
    };

    const sparkleVariants = {
        animate: {
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
            transition: {
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut'
            }
        }
    };

    return (
        <motion.div
            variants={badgeVariants}
            initial={animated ? 'initial' : 'animate'}
            animate="animate"
            whileHover="hover"
            className={`
                inline-flex items-center gap-2 rounded-full
                ${config.bgColor} ${config.borderColor} border-2
                ${sizes.container} shadow-lg relative overflow-hidden
            `}
        >
            {/* Sparkle effect for Tier 1 */}
            {tier === 1 && animated && (
                <motion.div
                    variants={sparkleVariants}
                    animate="animate"
                    className="absolute -top-1 -right-1 text-yellow-400"
                >
                    ✨
                </motion.div>
            )}

            {/* Emoji */}
            <span className={sizes.emoji}>{config.emoji}</span>

            {/* Icon */}
            <Icon className={`${sizes.icon} ${config.iconColor}`} />

            {/* Label */}
            {showLabel && (
                <span className={`font-bold ${config.textColor} ${sizes.label}`}>
                    {config.label}
                </span>
            )}

            {/* Shine effect */}
            {animated && (
                <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    animate={{
                        x: ['-100%', '100%']
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        repeatDelay: 3
                    }}
                />
            )}
        </motion.div>
    );
}

// Compact version for list views
export function TierBadgeCompact({ tier }: { tier: 1 | 2 | 3 }) {
    const config = tierConfig[tier];

    return (
        <div
            className={`
                inline-flex items-center gap-1 px-2 py-1 rounded-full
                ${config.bgColor} ${config.borderColor} border
                text-xs font-semibold ${config.textColor}
            `}
            title={config.description}
        >
            <span>{config.emoji}</span>
            <span>{config.label}</span>
        </div>
    );
}

// Full card version with description
export function TierBadgeCard({ tier }: { tier: 1 | 2 | 3 }) {
    const config = tierConfig[tier];
    const Icon = config.icon;

    return (
        <motion.div
            initial={{ scale: 0, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className={`
                p-6 rounded-2xl ${config.bgColor} ${config.borderColor} border-2
                shadow-xl text-center space-y-3
            `}
        >
            {/* Large emoji with icon */}
            <div className="flex items-center justify-center gap-3">
                <motion.span
                    className="text-6xl"
                    animate={{
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0]
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut'
                    }}
                >
                    {config.emoji}
                </motion.span>
                <Icon className={`w-12 h-12 ${config.iconColor}`} />
            </div>

            {/* Label */}
            <h3 className={`text-2xl font-bold ${config.textColor}`}>
                {config.label}
            </h3>

            {/* Description */}
            <p className={`text-sm ${config.textColor} opacity-80`}>
                {config.description}
            </p>

            {/* Decorative stars for Tier 1 */}
            {tier === 1 && (
                <div className="flex justify-center gap-2 mt-2">
                    {[...Array(5)].map((_, i) => (
                        <motion.span
                            key={i}
                            className="text-yellow-400"
                            animate={{
                                scale: [1, 1.3, 1],
                                opacity: [0.5, 1, 0.5]
                            }}
                            transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                delay: i * 0.2
                            }}
                        >
                            ⭐
                        </motion.span>
                    ))}
                </div>
            )}
        </motion.div>
    );
}

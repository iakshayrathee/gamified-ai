/**
 * Animation Library for Children's Learning Platform
 * Framer Motion animation variants for consistent, playful animations
 */

import { Variants } from 'framer-motion';

// ============================================================================
// ENTRANCE ANIMATIONS
// ============================================================================

export const fadeIn: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { duration: 0.3 }
    },
};

export const slideInUp: Variants = {
    hidden: { y: 50, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: {
            type: 'spring',
            stiffness: 100,
            damping: 15
        }
    },
};

export const slideInDown: Variants = {
    hidden: { y: -50, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: {
            type: 'spring',
            stiffness: 100,
            damping: 15
        }
    },
};

export const slideInLeft: Variants = {
    hidden: { x: -50, opacity: 0 },
    visible: {
        x: 0,
        opacity: 1,
        transition: {
            type: 'spring',
            stiffness: 100,
            damping: 15
        }
    },
};

export const slideInRight: Variants = {
    hidden: { x: 50, opacity: 0 },
    visible: {
        x: 0,
        opacity: 1,
        transition: {
            type: 'spring',
            stiffness: 100,
            damping: 15
        }
    },
};

export const scaleIn: Variants = {
    hidden: { scale: 0, opacity: 0 },
    visible: {
        scale: 1,
        opacity: 1,
        transition: {
            type: 'spring',
            stiffness: 200,
            damping: 20
        }
    },
};

export const bounceIn: Variants = {
    hidden: { scale: 0, opacity: 0 },
    visible: {
        scale: 1,
        opacity: 1,
        transition: {
            type: 'spring',
            stiffness: 300,
            damping: 10,
            bounce: 0.5
        }
    },
};

// ============================================================================
// EXIT ANIMATIONS
// ============================================================================

export const fadeOut: Variants = {
    visible: { opacity: 1 },
    hidden: {
        opacity: 0,
        transition: { duration: 0.2 }
    },
};

export const scaleOut: Variants = {
    visible: { scale: 1, opacity: 1 },
    hidden: {
        scale: 0,
        opacity: 0,
        transition: { duration: 0.2 }
    },
};

// ============================================================================
// ATTENTION SEEKERS - Looping animations
// ============================================================================

export const bounce = {
    animate: {
        y: [0, -20, 0],
        transition: {
            duration: 0.6,
            repeat: Infinity,
            ease: 'easeInOut'
        }
    }
};

export const pulse = {
    animate: {
        scale: [1, 1.05, 1],
        transition: {
            duration: 1,
            repeat: Infinity,
            ease: 'easeInOut'
        }
    }
};

export const wiggle = {
    animate: {
        rotate: [0, -5, 5, -5, 5, 0],
        transition: {
            duration: 0.5,
            repeat: Infinity,
            repeatDelay: 2
        }
    }
};

export const shake = {
    animate: {
        x: [0, -10, 10, -10, 10, 0],
        transition: {
            duration: 0.5,
            repeat: Infinity,
            repeatDelay: 3
        }
    }
};

export const tada = {
    animate: {
        scale: [1, 0.9, 1.1, 1.1, 1.1, 1],
        rotate: [0, -3, 3, -3, 3, 0],
        transition: {
            duration: 1,
            repeat: Infinity,
            repeatDelay: 2
        }
    }
};

export const float = {
    animate: {
        y: [0, -15, 0],
        transition: {
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut'
        }
    }
};

export const glow = {
    animate: {
        boxShadow: [
            '0 0 5px rgba(167, 139, 250, 0.5)',
            '0 0 20px rgba(167, 139, 250, 0.8)',
            '0 0 5px rgba(167, 139, 250, 0.5)',
        ],
        transition: {
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut'
        }
    }
};

// ============================================================================
// CELEBRATION ANIMATIONS
// ============================================================================

export const confetti = {
    initial: { scale: 0, opacity: 0 },
    animate: (i: number) => ({
        scale: [0, 1, 1, 0],
        opacity: [0, 1, 1, 0],
        x: [0, (Math.random() - 0.5) * 500],
        y: [0, (Math.random() - 0.5) * 500],
        rotate: [0, Math.random() * 360],
        transition: {
            duration: 1.5,
            delay: i * 0.02,
            ease: 'easeOut'
        }
    })
};

export const starBurst = {
    initial: { scale: 0, rotate: 0 },
    animate: {
        scale: [0, 1.5, 1],
        rotate: [0, 180, 360],
        transition: {
            duration: 0.6,
            ease: 'easeOut'
        }
    }
};

export const firework = {
    initial: { scale: 0, opacity: 1 },
    animate: {
        scale: [0, 2, 3],
        opacity: [1, 0.8, 0],
        transition: {
            duration: 1,
            ease: 'easeOut'
        }
    }
};

// ============================================================================
// HOVER EFFECTS
// ============================================================================

export const hoverLift = {
    rest: { y: 0, scale: 1 },
    hover: {
        y: -8,
        scale: 1.05,
        transition: {
            type: 'spring',
            stiffness: 400,
            damping: 10
        }
    }
};

export const hoverScale = {
    rest: { scale: 1 },
    hover: {
        scale: 1.1,
        transition: {
            type: 'spring',
            stiffness: 400,
            damping: 10
        }
    }
};

export const hoverTilt = {
    rest: { rotateZ: 0 },
    hover: {
        rotateZ: 5,
        transition: {
            type: 'spring',
            stiffness: 300,
            damping: 10
        }
    }
};

export const hoverGlow = {
    rest: {
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    },
    hover: {
        boxShadow: '0 10px 30px rgba(167, 139, 250, 0.4)',
        transition: { duration: 0.3 }
    }
};

// ============================================================================
// TAP/PRESS EFFECTS
// ============================================================================

export const tapScale = {
    tap: { scale: 0.95 }
};

export const tapBounce = {
    tap: {
        scale: 0.9,
        transition: {
            type: 'spring',
            stiffness: 400,
            damping: 10
        }
    }
};

// ============================================================================
// LOADING ANIMATIONS
// ============================================================================

export const spinner = {
    animate: {
        rotate: 360,
        transition: {
            duration: 1,
            repeat: Infinity,
            ease: 'linear'
        }
    }
};

export const dots = {
    animate: (i: number) => ({
        y: [0, -20, 0],
        transition: {
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.1,
            ease: 'easeInOut'
        }
    })
};

export const wave = {
    animate: (i: number) => ({
        scaleY: [1, 1.5, 1],
        transition: {
            duration: 1,
            repeat: Infinity,
            delay: i * 0.1,
            ease: 'easeInOut'
        }
    })
};

// ============================================================================
// STAGGER ANIMATIONS - For lists and grids
// ============================================================================

export const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2
        }
    }
};

export const staggerItem: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: {
            type: 'spring',
            stiffness: 100
        }
    }
};

// ============================================================================
// SPECIAL EFFECTS
// ============================================================================

export const shimmer = {
    animate: {
        backgroundPosition: ['200% 0', '-200% 0'],
        transition: {
            duration: 2,
            repeat: Infinity,
            ease: 'linear'
        }
    }
};

export const breathe = {
    animate: {
        scale: [1, 1.05, 1],
        opacity: [1, 0.8, 1],
        transition: {
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut'
        }
    }
};

export const rainbow = {
    animate: {
        background: [
            'linear-gradient(90deg, #ff0000, #ff7f00)',
            'linear-gradient(90deg, #ff7f00, #ffff00)',
            'linear-gradient(90deg, #ffff00, #00ff00)',
            'linear-gradient(90deg, #00ff00, #0000ff)',
            'linear-gradient(90deg, #0000ff, #8b00ff)',
            'linear-gradient(90deg, #8b00ff, #ff0000)',
        ],
        transition: {
            duration: 3,
            repeat: Infinity,
            ease: 'linear'
        }
    }
};

// Export all animations
export const animations = {
    // Entrance
    fadeIn,
    slideInUp,
    slideInDown,
    slideInLeft,
    slideInRight,
    scaleIn,
    bounceIn,

    // Exit
    fadeOut,
    scaleOut,

    // Attention
    bounce,
    pulse,
    wiggle,
    shake,
    tada,
    float,
    glow,

    // Celebration
    confetti,
    starBurst,
    firework,

    // Hover
    hoverLift,
    hoverScale,
    hoverTilt,
    hoverGlow,

    // Tap
    tapScale,
    tapBounce,

    // Loading
    spinner,
    dots,
    wave,

    // Stagger
    staggerContainer,
    staggerItem,

    // Special
    shimmer,
    breathe,
    rainbow,
};

export default animations;

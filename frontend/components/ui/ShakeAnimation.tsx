'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface ShakeAnimationProps {
    children: ReactNode;
    trigger: boolean;
    intensity?: 'low' | 'medium' | 'high';
    onComplete?: () => void;
}

export default function ShakeAnimation({
    children,
    trigger,
    intensity = 'medium',
    onComplete
}: ShakeAnimationProps) {
    const getShakeDistance = () => {
        switch (intensity) {
            case 'low': return 5;
            case 'medium': return 10;
            case 'high': return 15;
            default: return 10;
        }
    };

    const distance = getShakeDistance();

    return (
        <motion.div
            animate={trigger ? {
                x: [0, -distance, distance, -distance, distance, -distance / 2, distance / 2, 0],
                transition: {
                    duration: 0.5,
                    ease: 'easeInOut'
                }
            } : {}}
            onAnimationComplete={onComplete}
        >
            {children}
        </motion.div>
    );
}

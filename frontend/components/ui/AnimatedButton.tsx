'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import { ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'rainbow';
type ButtonSize = 'small' | 'medium' | 'large' | 'xl';

interface AnimatedButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
    children: ReactNode;
    variant?: ButtonVariant;
    size?: ButtonSize;
    icon?: ReactNode;
    iconPosition?: 'left' | 'right';
    fullWidth?: boolean;
    withRipple?: boolean;
    with3D?: boolean;
    withGlow?: boolean;
}

const variantClasses = {
    primary: 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-purple',
    secondary: 'bg-gradient-to-r from-blue-400 to-cyan-400 hover:from-blue-500 hover:to-cyan-500 text-white shadow-blue',
    success: 'bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white',
    danger: 'bg-gradient-to-r from-red-400 to-pink-500 hover:from-red-500 hover:to-pink-600 text-white',
    warning: 'bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-500 hover:to-orange-500 text-white',
    rainbow: 'bg-gradient-to-r from-red-400 via-yellow-400 via-green-400 via-blue-400 to-purple-400 text-white animate-rainbow',
};

const sizeClasses = {
    small: 'px-4 py-2 text-sm',
    medium: 'px-6 py-3 text-base',
    large: 'px-8 py-4 text-lg',
    xl: 'px-12 py-6 text-2xl',
};

export default function AnimatedButton({
    children,
    variant = 'primary',
    size = 'medium',
    icon,
    iconPosition = 'left',
    fullWidth = false,
    withRipple = true,
    with3D = false,
    withGlow = false,
    className = '',
    ...props
}: AnimatedButtonProps) {
    const baseClasses = 'font-bold rounded-full transition-all duration-300 transform';
    const widthClass = fullWidth ? 'w-full' : '';
    const rippleClass = withRipple ? 'ripple' : '';
    const threeDClass = with3D ? 'btn-3d' : '';
    const glowClass = withGlow ? 'glow-purple' : '';

    return (
        <motion.button
            className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${widthClass}
        ${rippleClass}
        ${threeDClass}
        ${glowClass}
        ${className}
      `}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                type: 'spring',
                stiffness: 400,
                damping: 17,
            }}
            {...props}
        >
            <span className="flex items-center justify-center gap-2">
                {icon && iconPosition === 'left' && <span className="inline-block">{icon}</span>}
                {children}
                {icon && iconPosition === 'right' && <span className="inline-block">{icon}</span>}
            </span>
        </motion.button>
    );
}

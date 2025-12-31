'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Info, X, AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastProps {
    id: string;
    type: ToastType;
    message: string;
    duration?: number;
    onClose: (id: string) => void;
}

export default function Toast({ id, type, message, duration = 3000, onClose }: ToastProps) {
    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(() => {
                onClose(id);
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [id, duration, onClose]);

    const config = {
        success: {
            icon: CheckCircle2,
            bgColor: 'bg-gradient-to-r from-green-500 to-emerald-600',
            textColor: 'text-white',
        },
        error: {
            icon: XCircle,
            bgColor: 'bg-gradient-to-r from-red-500 to-rose-600',
            textColor: 'text-white',
        },
        warning: {
            icon: AlertTriangle,
            bgColor: 'bg-gradient-to-r from-orange-500 to-amber-600',
            textColor: 'text-white',
        },
        info: {
            icon: Info,
            bgColor: 'bg-gradient-to-r from-blue-500 to-indigo-600',
            textColor: 'text-white',
        },
    };

    const { icon: Icon, bgColor, textColor } = config[type];

    return (
        <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className={`${bgColor} ${textColor} rounded-lg shadow-xl p-4 flex items-center gap-3 min-w-[300px] max-w-md backdrop-blur-sm`}
        >
            <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
            >
                <Icon className="w-6 h-6" />
            </motion.div>
            <p className="flex-1 font-medium">{message}</p>
            <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onClose(id)}
                className="hover:bg-white/20 rounded-full p-1 transition-colors"
            >
                <X className="w-4 h-4" />
            </motion.button>
        </motion.div>
    );
}

export function ToastContainer({ toasts, onClose }: { toasts: ToastProps[]; onClose: (id: string) => void }) {
    return (
        <div className="fixed top-20 right-4 z-[100] flex flex-col gap-2">
            <AnimatePresence mode="popLayout">
                {toasts.map((toast) => (
                    <Toast key={toast.id} {...toast} onClose={onClose} />
                ))}
            </AnimatePresence>
        </div>
    );
}

'use client';

import { useState, useCallback } from 'react';
import { ToastProps } from '@/components/admin/Toast';

let toastId = 0;

export function useToast() {
    const [toasts, setToasts] = useState<ToastProps[]>([]);

    const showToast = useCallback((
        type: 'success' | 'error' | 'info' | 'warning',
        message: string,
        duration = 3000
    ) => {
        const id = `toast-${toastId++}`;
        const newToast: ToastProps = {
            id,
            type,
            message,
            duration,
            onClose: (toastId) => {
                setToasts((prev) => prev.filter((t) => t.id !== toastId));
            },
        };

        setToasts((prev) => [...prev, newToast]);
    }, []);

    const success = useCallback((message: string, duration?: number) => {
        showToast('success', message, duration);
    }, [showToast]);

    const error = useCallback((message: string, duration?: number) => {
        showToast('error', message, duration);
    }, [showToast]);

    const info = useCallback((message: string, duration?: number) => {
        showToast('info', message, duration);
    }, [showToast]);

    const warning = useCallback((message: string, duration?: number) => {
        showToast('warning', message, duration);
    }, [showToast]);

    return {
        toasts,
        success,
        error,
        info,
        warning,
        clearToast: (id: string) => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        },
    };
}

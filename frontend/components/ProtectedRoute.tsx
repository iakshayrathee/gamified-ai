'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles: Array<'CHILD' | 'TEACHER' | 'ADMIN'>;
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (!user) {
                // Not authenticated - redirect to home
                router.push('/');
            } else if (!allowedRoles.includes(user.role)) {
                // Authenticated but wrong role - redirect to appropriate page
                switch (user.role) {
                    case 'CHILD':
                        router.push('/child/home');
                        break;
                    case 'TEACHER':
                        router.push('/teacher/dashboard');
                        break;
                    case 'ADMIN':
                        router.push('/admin/panel');
                        break;
                }
            }
        }
    }, [user, loading, allowedRoles, router]);

    // Show loading state
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-white mx-auto mb-4"></div>
                    <p className="text-white text-xl font-semibold">Loading...</p>
                </div>
            </div>
        );
    }

    // Show nothing while redirecting
    if (!user || !allowedRoles.includes(user.role)) {
        return null;
    }

    // User is authenticated and has correct role
    return <>{children}</>;
}

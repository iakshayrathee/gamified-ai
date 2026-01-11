'use client';

import { ReactNode } from 'react';

interface ResultsLayoutProps {
    children: ReactNode;
}

export default function ResultsLayout({ children }: ResultsLayoutProps) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-pink-100">
            <div className="container mx-auto px-4 py-8 max-w-5xl">
                {children}
            </div>
        </div>
    );
}

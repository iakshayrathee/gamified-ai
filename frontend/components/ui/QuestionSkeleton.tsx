'use client';

import { motion } from 'framer-motion';

export default function QuestionSkeleton() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 p-6">
            {/* Question Prompt Skeleton */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-8 text-center w-full max-w-4xl"
            >
                {/* Title skeleton */}
                <div className="h-16 bg-gradient-to-r from-purple-200 via-purple-300 to-purple-200 rounded-2xl mb-4 animate-pulse bg-[length:200%_100%]"
                    style={{
                        animation: 'skeleton-loading 1.5s ease-in-out infinite',
                        backgroundSize: '200% 100%'
                    }}
                />

                {/* Audio button skeleton */}
                <div className="w-16 h-16 bg-purple-200 rounded-full mx-auto animate-pulse" />
            </motion.div>

            {/* Answer Options Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full">
                {[1, 2, 3, 4].map((index) => (
                    <motion.div
                        key={index}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="h-32 bg-gradient-to-r from-purple-100 via-purple-200 to-purple-100 rounded-3xl shadow-lg animate-pulse"
                        style={{
                            animation: 'skeleton-loading 1.5s ease-in-out infinite',
                            animationDelay: `${index * 0.2}s`,
                            backgroundSize: '200% 100%'
                        }}
                    />
                ))}
            </div>

            {/* Loading text */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-8 text-2xl font-bold text-purple-600"
            >
                Loading next question...
            </motion.div>

            <style jsx>{`
                @keyframes skeleton-loading {
                    0% {
                        background-position: -200% 0;
                    }
                    100% {
                        background-position: 200% 0;
                    }
                }
            `}</style>
        </div>
    );
}

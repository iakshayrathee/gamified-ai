'use client';

import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { getComprehensiveQuizResults, ComprehensiveQuizResults } from '@/lib/quiz-results-api';
import SummaryCard from './summary-card';
import PerformanceMetrics from './performance-metrics';
import InsightsPanel from './insights-panel';
import NextSteps from './next-steps';
import ResultsLayout from './results-layout';

interface ResultsOrchestratorProps {
    childId: string;
    sessionId: string;
    skillName: string;
    domainId: string;
    onPlayAgain: () => void;
    onBackToDomains: () => void;
}

export default function ResultsOrchestrator({
    childId,
    sessionId,
    skillName,
    domainId,
    onPlayAgain,
    onBackToDomains
}: ResultsOrchestratorProps) {
    const [results, setResults] = useState<ComprehensiveQuizResults | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const loadingRef = useRef(false);
    const loadedSessionRef = useRef<string | null>(null);

    useEffect(() => {
        // Prevent duplicate calls for the same session
        if (loadingRef.current || loadedSessionRef.current === sessionId) {
            return;
        }
        loadResults();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [childId, sessionId]);

    async function loadResults() {
        // Double-check to prevent race conditions
        if (loadingRef.current || loadedSessionRef.current === sessionId) {
            return;
        }

        try {
            loadingRef.current = true;
            setLoading(true);
            setError(null);
            const data = await getComprehensiveQuizResults(childId, sessionId);
            setResults(data);
            loadedSessionRef.current = sessionId;
        } catch (err) {
            console.error('Error loading quiz results:', err);
            setError('Failed to load quiz results. Please try again.');
        } finally {
            setLoading(false);
            loadingRef.current = false;
        }
    }

    if (loading) {
        return (
            <ResultsLayout>
                <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                    <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-lg text-gray-600">Analyzing your performance...</p>
                </div>
            </ResultsLayout>
        );
    }

    if (error || !results) {
        return (
            <ResultsLayout>
                <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                    <div className="text-6xl">😕</div>
                    <h2 className="text-2xl font-bold text-gray-800">Oops!</h2>
                    <p className="text-gray-600">{error || 'Something went wrong'}</p>
                    <button
                        onClick={loadResults}
                        className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </ResultsLayout>
        );
    }

    return (
        <ResultsLayout>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-6"
            >
                {/* Summary Card */}
                <SummaryCard
                    summary={results.summary}
                    skillName={skillName}
                />

                {/* Performance Metrics */}
                <PerformanceMetrics
                    metrics={results.metrics}
                    wordMastery={results.wordMastery}
                    errorPatterns={results.errorPatterns}
                />

                {/* AI Insights */}
                <InsightsPanel
                    insights={results.insights}
                    errorPatterns={results.errorPatterns}
                />

                {/* Next Steps & Recommendations */}
                <NextSteps
                    recommendations={results.recommendations}
                    domainId={domainId}
                    onPlayAgain={onPlayAgain}
                    onBackToDomains={onBackToDomains}
                />
            </motion.div>
        </ResultsLayout>
    );
}

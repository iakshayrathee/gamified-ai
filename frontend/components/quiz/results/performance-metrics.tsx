'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QuizResultsMetrics, QuizResultsWordMastery } from '@/lib/quiz-results-api';
import { ErrorPattern } from '@/lib/types';
import { Clock, CheckCircle, XCircle, AlertTriangle, Eye, Zap, Brain, TrendingDown, SkipForward, ChevronDown, ChevronUp } from 'lucide-react';

interface PerformanceMetricsProps {
    metrics: QuizResultsMetrics;
    wordMastery?: QuizResultsWordMastery;
    errorPatterns: ErrorPattern;
}

export default function PerformanceMetrics({ metrics, wordMastery, errorPatterns }: PerformanceMetricsProps) {
    const [expandedSection, setExpandedSection] = useState<string | null>('overview');

    const toggleSection = (section: string) => {
        setExpandedSection(expandedSection === section ? null : section);
    };

    const getErrorPatternIcon = (type: string) => {
        switch (type) {
            case 'visual': return <Eye className="w-5 h-5" />;
            case 'guessing': return <Zap className="w-5 h-5" />;
            case 'slow': return <Clock className="w-5 h-5" />;
            case 'inconsistent': return <TrendingDown className="w-5 h-5" />;
            case 'avoidance': return <SkipForward className="w-5 h-5" />;
            default: return <AlertTriangle className="w-5 h-5" />;
        }
    };

    const getSeverityColor = (severity: 'low' | 'medium' | 'high') => {
        switch (severity) {
            case 'low': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
            case 'medium': return 'bg-orange-100 text-orange-800 border-orange-300';
            case 'high': return 'bg-red-100 text-red-800 border-red-300';
        }
    };

    const Section = ({ title, id, children }: { title: string; id: string; children: React.ReactNode }) => (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button
                onClick={() => toggleSection(id)}
                className="w-full px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
            >
                <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
                {expandedSection === id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            <AnimatePresence>
                {expandedSection === id && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="p-6 bg-white">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );

    return (
        <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-100 space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">📊 Performance Analysis</h2>

            {/* Overview Section */}
            <Section title="Overview" id="overview">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                        <div className="text-sm text-blue-600 font-medium mb-1">Total Attempts</div>
                        <div className="text-3xl font-bold text-blue-700">{metrics.totalAttempts}</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                        <div className="text-sm text-green-600 font-medium mb-1">Correct Answers</div>
                        <div className="text-3xl font-bold text-green-700">{metrics.correctAttempts}</div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4">
                        <div className="text-sm text-purple-600 font-medium mb-1">Avg Response Time</div>
                        <div className="text-3xl font-bold text-purple-700">{metrics.avgResponseTime}s</div>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-4">
                        <div className="text-sm text-amber-600 font-medium mb-1">Consistency</div>
                        <div className="text-lg font-bold text-amber-700">{metrics.consistency.pattern}</div>
                    </div>
                </div>

                {/* Response Time Distribution */}
                <div className="mt-6">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Response Time Distribution</h4>
                    <div className="flex items-center space-x-2">
                        <div className="flex-1">
                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                                <span>Fast (&lt;3s)</span>
                                <span>{metrics.responseTimeDistribution.fast}</span>
                            </div>
                            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-green-500"
                                    style={{ width: `${(metrics.responseTimeDistribution.fast / metrics.totalAttempts) * 100}%` }}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2 mt-2">
                        <div className="flex-1">
                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                                <span>Normal (3-6s)</span>
                                <span>{metrics.responseTimeDistribution.normal}</span>
                            </div>
                            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-blue-500"
                                    style={{ width: `${(metrics.responseTimeDistribution.normal / metrics.totalAttempts) * 100}%` }}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2 mt-2">
                        <div className="flex-1">
                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                                <span>Slow (&gt;6s)</span>
                                <span>{metrics.responseTimeDistribution.slow}</span>
                            </div>
                            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-orange-500"
                                    style={{ width: `${(metrics.responseTimeDistribution.slow / metrics.totalAttempts) * 100}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </Section>

            {/* Word Mastery Section */}
            {wordMastery && (
                <Section title="Word Mastery" id="wordMastery">
                    <div className="space-y-4">
                        {/* Mastered Words */}
                        {wordMastery.mastered.length > 0 && (
                            <div>
                                <h4 className="text-sm font-semibold text-green-700 mb-2 flex items-center">
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Mastered ({wordMastery.mastered.length})
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {wordMastery.mastered.map((word, idx) => (
                                        <span key={idx} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                                            {word.word}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Proficient Words */}
                        {wordMastery.proficient.length > 0 && (
                            <div>
                                <h4 className="text-sm font-semibold text-blue-700 mb-2 flex items-center">
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Proficient ({wordMastery.proficient.length})
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {wordMastery.proficient.map((word, idx) => (
                                        <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                                            {word.word}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Developing Words */}
                        {wordMastery.developing.length > 0 && (
                            <div>
                                <h4 className="text-sm font-semibold text-yellow-700 mb-2 flex items-center">
                                    <AlertTriangle className="w-4 h-4 mr-2" />
                                    Needs Practice ({wordMastery.developing.length})
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {wordMastery.developing.map((word, idx) => (
                                        <span key={idx} className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                                            {word.word}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Struggling Words */}
                        {wordMastery.struggling.length > 0 && (
                            <div>
                                <h4 className="text-sm font-semibold text-red-700 mb-2 flex items-center">
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Struggling ({wordMastery.struggling.length})
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {wordMastery.struggling.map((word, idx) => (
                                        <span key={idx} className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                                            {word.word}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Weak Clusters */}
                        {wordMastery.weakClusters.length > 0 && (
                            <div className="mt-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
                                <h4 className="text-sm font-semibold text-orange-800 mb-2">⚠️ Focus Areas</h4>
                                {wordMastery.weakClusters.map((cluster, idx) => (
                                    <div key={idx} className="mb-2">
                                        <div className="font-medium text-orange-700">{cluster.clusterName}</div>
                                        <div className="text-sm text-orange-600">{cluster.recommendation}</div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Readiness Score */}
                        <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-sm text-gray-600">Readiness Score</div>
                                    <div className="text-2xl font-bold text-purple-700">{wordMastery.readinessScore}/100</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-medium text-gray-700">{wordMastery.readinessLevel}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Section>
            )}

            {/* Error Patterns Section */}
            <Section title="Error Patterns" id="errorPatterns">
                <div className="space-y-4">
                    {/* Visual Confusion */}
                    {errorPatterns.visualConfusion.detected && (
                        <div className={`p-4 rounded-lg border-2 ${getSeverityColor(errorPatterns.visualConfusion.severity)}`}>
                            <div className="flex items-start space-x-3">
                                <Eye className="w-6 h-6 mt-1" />
                                <div className="flex-1">
                                    <h4 className="font-semibold mb-1">Visual Confusion Detected</h4>
                                    <p className="text-sm mb-2">{errorPatterns.visualConfusion.recommendation}</p>
                                    {errorPatterns.visualConfusion.confusedPairs.length > 0 && (
                                        <div className="text-xs space-y-1">
                                            {errorPatterns.visualConfusion.confusedPairs.map((pair, idx) => (
                                                <div key={idx}>
                                                    Confused "{pair.correct}" with "{pair.chosen}" ({pair.count}x)
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Random Guessing */}
                    {errorPatterns.randomGuessing.detected && (
                        <div className="p-4 rounded-lg border-2 bg-orange-100 text-orange-800 border-orange-300">
                            <div className="flex items-start space-x-3">
                                <Zap className="w-6 h-6 mt-1" />
                                <div className="flex-1">
                                    <h4 className="font-semibold mb-1">Random Guessing Detected</h4>
                                    <p className="text-sm mb-2">{errorPatterns.randomGuessing.recommendation}</p>
                                    <div className="text-xs">
                                        {errorPatterns.randomGuessing.instanceCount} rapid incorrect responses
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Slow Processing */}
                    {errorPatterns.slowProcessing.detected && (
                        <div className="p-4 rounded-lg border-2 bg-blue-100 text-blue-800 border-blue-300">
                            <div className="flex items-start space-x-3">
                                <Clock className="w-6 h-6 mt-1" />
                                <div className="flex-1">
                                    <h4 className="font-semibold mb-1">Slow Processing Detected</h4>
                                    <p className="text-sm mb-2">{errorPatterns.slowProcessing.recommendation}</p>
                                    <div className="text-xs">
                                        Average: {errorPatterns.slowProcessing.avgTime.toFixed(1)}s (Expected: {errorPatterns.slowProcessing.expectedTime}s)
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Inconsistent Performance */}
                    {errorPatterns.inconsistentPerformance.detected && (
                        <div className="p-4 rounded-lg border-2 bg-yellow-100 text-yellow-800 border-yellow-300">
                            <div className="flex items-start space-x-3">
                                <TrendingDown className="w-6 h-6 mt-1" />
                                <div className="flex-1">
                                    <h4 className="font-semibold mb-1">Inconsistent Performance</h4>
                                    <p className="text-sm mb-2">{errorPatterns.inconsistentPerformance.recommendation}</p>
                                    <div className="text-xs">
                                        Pattern: {errorPatterns.inconsistentPerformance.pattern}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Avoidance Behavior */}
                    {errorPatterns.avoidanceBehavior.detected && (
                        <div className="p-4 rounded-lg border-2 bg-red-100 text-red-800 border-red-300">
                            <div className="flex items-start space-x-3">
                                <SkipForward className="w-6 h-6 mt-1" />
                                <div className="flex-1">
                                    <h4 className="font-semibold mb-1">Avoidance Behavior Detected</h4>
                                    <p className="text-sm mb-2">{errorPatterns.avoidanceBehavior.recommendation}</p>
                                    <div className="text-xs">
                                        {errorPatterns.avoidanceBehavior.timeouts} timeouts, {errorPatterns.avoidanceBehavior.skips} skips
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* No Patterns Detected */}
                    {!errorPatterns.visualConfusion.detected &&
                        !errorPatterns.randomGuessing.detected &&
                        !errorPatterns.slowProcessing.detected &&
                        !errorPatterns.inconsistentPerformance.detected &&
                        !errorPatterns.avoidanceBehavior.detected && (
                            <div className="p-4 bg-green-50 rounded-lg border border-green-200 text-center">
                                <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                                <p className="text-green-800 font-medium">No concerning patterns detected!</p>
                                <p className="text-sm text-green-600">Performance is consistent and healthy.</p>
                            </div>
                        )}
                </div>
            </Section>
        </div>
    );
}

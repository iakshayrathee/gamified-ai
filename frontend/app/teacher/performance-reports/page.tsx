'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Download, TrendingUp, TrendingDown, AlertCircle, Sparkles, ArrowUp } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/lib/auth-context';
import ProtectedRoute from '@/components/ProtectedRoute';
import TeacherNavbar from '@/components/navigation/TeacherNavbar';

interface PerformanceReport {
    id: string;
    generatedAt: string;
    reportPeriodStart: string;
    reportPeriodEnd: string;
    overallAccuracy: number;
    totalAttempts: number;
    totalTimeSpent: number;
    skillsMastered: number;
    skillsInProgress: number;
    strengths: string[];
    weaknesses: string[];
    confusionPatterns: Array<{
        type: string;
        frequency: number;
        description: string;
    }>;
    recommendations: Array<{
        title: string;
        description: string;
        priority: number;
    }>;
    domainPerformance: Array<{
        domain: { name: string; code: string };
        accuracy: number;
        avgResponseTime: number;
        attemptsCount: number;
        masteryLevel: string;
    }>;
}

interface Child {
    id: string;
    name: string;
}

export default function PerformanceReportsPage() {
    const { user } = useAuth();
    const teacherId = user?.id || '';

    const [selectedChild, setSelectedChild] = useState<string>('');
    const [startDate, setStartDate] = useState<Date>();
    const [endDate, setEndDate] = useState<Date>();
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState<PerformanceReport | null>(null);
    const [children, setChildren] = useState<Child[]>([]);
    const [hasFetchedStudents, setHasFetchedStudents] = useState(false);

    // Fetch teacher's students
    useEffect(() => {
        if (hasFetchedStudents || !teacherId) return; // Prevent multiple fetches

        const fetchStudents = async () => {
            const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            try {
                const response = await fetch(`${API_BASE_URL}/api/teacher/${teacherId}/students`, {
                    cache: 'no-store'
                });
                if (response.ok) {
                    const students = await response.json();
                    setChildren(students);
                    setHasFetchedStudents(true);
                }
            } catch (error) {
                console.error('Error fetching students:', error);
            }
        };

        fetchStudents();
    }, [teacherId, hasFetchedStudents]);

    const generateReport = async () => {
        if (!selectedChild || !startDate || !endDate) {
            alert('Please select a child and date range');
            return;
        }

        setLoading(true);
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        try {
            const response = await fetch(`${API_BASE_URL}/api/teacher/student/${selectedChild}/generate-report`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString()
                })
            });

            if (!response.ok) throw new Error('Failed to generate report');

            const data = await response.json();
            setReport(data);
        } catch (error) {
            console.error('Error generating report:', error);
            alert('Failed to generate report');
        } finally {
            setLoading(false);
        }
    };

    const getMasteryColor = (level: string) => {
        switch (level) {
            case 'MASTERED': return 'text-green-600 bg-green-50';
            case 'INTERMEDIATE': return 'text-blue-600 bg-blue-50';
            case 'BEGINNER': return 'text-yellow-600 bg-yellow-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    return (
        <ProtectedRoute allowedRoles={['TEACHER']}>
            <TeacherNavbar />
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 pt-20 p-6">
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="mb-8"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <motion.div
                                animate={{ rotate: [0, 360] }}
                                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                            >
                                <Sparkles className="w-8 h-8 text-cyan-600" />
                            </motion.div>
                            <h1 className="text-4xl font-semibold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">
                                Performance Reports
                            </h1>
                        </div>
                        <p className="text-lg text-slate-600">AI-powered student performance analysis</p>
                    </motion.div>

                    {/* Report Generation Controls */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <Card className="shadow-lg border-slate-200">
                            <CardHeader>
                                <CardTitle className="text-2xl font-semibold text-slate-900">Generate New Report</CardTitle>
                                <CardDescription className="text-slate-600">Select a student and date range to generate an AI-powered performance report</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-slate-700">Select Student</label>
                                        <select
                                            className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                                            value={selectedChild}
                                            onChange={(e) => setSelectedChild(e.target.value)}
                                        >
                                            <option value="">Choose a student...</option>
                                            {children.map(child => (
                                                <option key={child.id} value={child.id}>{child.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-slate-700">Start Date</label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" className="w-full justify-start border-slate-300 hover:border-cyan-500 transition-all">
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {startDate ? format(startDate, 'PPP') : 'Pick a date'}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <Calendar mode="single" selected={startDate} onSelect={setStartDate} />
                                            </PopoverContent>
                                        </Popover>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-slate-700">End Date</label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" className="w-full justify-start border-slate-300 hover:border-cyan-500 transition-all">
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {endDate ? format(endDate, 'PPP') : 'Pick a date'}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <Calendar mode="single" selected={endDate} onSelect={setEndDate} />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                </div>

                                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                                    <Button
                                        onClick={generateReport}
                                        disabled={loading}
                                        className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all"
                                    >
                                        {loading ? 'Generating Report...' : 'Generate AI Report'}
                                    </Button>
                                </motion.div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Report Display */}
                    {report && (
                        <div className="space-y-6">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                {[
                                    { title: 'Overall Accuracy', value: `${report.overallAccuracy.toFixed(1)}%`, subtitle: `${report.totalAttempts} attempts`, gradient: 'from-cyan-500 to-blue-600' },
                                    { title: 'Skills Mastered', value: report.skillsMastered, subtitle: `${report.skillsInProgress} in progress`, gradient: 'from-emerald-500 to-teal-600', color: 'text-green-600' },
                                    { title: 'Time Spent', value: `${Math.round(report.totalTimeSpent / 60)}m`, subtitle: 'Total learning time', gradient: 'from-violet-500 to-purple-600' },
                                    { title: 'Report Period', value: `${Math.ceil((new Date(report.reportPeriodEnd).getTime() - new Date(report.reportPeriodStart).getTime()) / (1000 * 60 * 60 * 24))} days`, subtitle: `${format(new Date(report.reportPeriodStart), 'MMM d')} - ${format(new Date(report.reportPeriodEnd), 'MMM d')}`, gradient: 'from-amber-500 to-orange-600' }
                                ].map((stat, index) => (
                                    <motion.div
                                        key={stat.title}
                                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        transition={{ delay: 0.2 + index * 0.1, type: 'spring', stiffness: 200 }}
                                        whileHover={{ y: -5, scale: 1.02 }}
                                    >
                                        <Card className="shadow-lg hover:shadow-xl transition-all border-slate-200 overflow-hidden relative">
                                            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${stat.gradient} opacity-10 rounded-full -mr-12 -mt-12`} />
                                            <CardHeader className="pb-3 relative">
                                                <CardTitle className="text-sm font-medium text-slate-600 uppercase tracking-wide">{stat.title}</CardTitle>
                                            </CardHeader>
                                            <CardContent className="relative">
                                                <div className={`text-3xl font-bold ${stat.color || 'text-slate-900'}`}>{stat.value}</div>
                                                <p className="text-sm text-slate-600 mt-1">{stat.subtitle}</p>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))}
                            </div>

                            {/* AI Insights */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.6 }}
                                >
                                    <Card className="shadow-lg border-slate-200 h-full">
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2 text-xl font-semibold text-slate-900">
                                                <TrendingUp className="h-5 w-5 text-green-600" />
                                                Strengths
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <ul className="space-y-2">
                                                {report.strengths.map((strength, index) => (
                                                    <motion.li
                                                        key={index}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: 0.7 + index * 0.05 }}
                                                        className="flex items-start gap-2"
                                                    >
                                                        <span className="text-green-600 mt-1 font-bold">✓</span>
                                                        <span className="text-slate-700">{strength}</span>
                                                    </motion.li>
                                                ))}
                                            </ul>
                                        </CardContent>
                                    </Card>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.6 }}
                                >
                                    <Card className="shadow-lg border-slate-200 h-full">
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2 text-xl font-semibold text-slate-900">
                                                <TrendingDown className="h-5 w-5 text-orange-600" />
                                                Areas for Improvement
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <ul className="space-y-2">
                                                {report.weaknesses.map((weakness, index) => (
                                                    <motion.li
                                                        key={index}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: 0.7 + index * 0.05 }}
                                                        className="flex items-start gap-2"
                                                    >
                                                        <span className="text-orange-600 mt-1 font-bold">!</span>
                                                        <span className="text-slate-700">{weakness}</span>
                                                    </motion.li>
                                                ))}
                                            </ul>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            </div>

                            {/* Confusion Patterns */}
                            {report.confusionPatterns.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.8 }}
                                >
                                    <Card className="shadow-lg border-slate-200">
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2 text-xl font-semibold text-slate-900">
                                                <AlertCircle className="h-5 w-5 text-red-600" />
                                                Detected Confusion Patterns
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {report.confusionPatterns.map((pattern, index) => (
                                                    <motion.div
                                                        key={index}
                                                        initial={{ opacity: 0, scale: 0.95 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        transition={{ delay: 0.9 + index * 0.05 }}
                                                        className="p-4 border border-slate-200 rounded-lg hover:shadow-md transition-all"
                                                    >
                                                        <div className="flex justify-between items-start mb-2">
                                                            <h4 className="font-semibold text-slate-900">{pattern.description}</h4>
                                                            <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded font-medium">
                                                                {pattern.frequency} errors
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-slate-600">Type: {pattern.type.replace(/_/g, ' ')}</p>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            )}

                            {/* AI Recommendations */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1.0 }}
                            >
                                <Card className="shadow-lg border-slate-200">
                                    <CardHeader>
                                        <CardTitle className="text-xl font-semibold text-slate-900">AI-Generated Recommendations</CardTitle>
                                        <CardDescription className="text-slate-600">Personalized suggestions for improving learning outcomes</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {report.recommendations.sort((a, b) => b.priority - a.priority).map((rec, index) => (
                                                <motion.div
                                                    key={index}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: 1.1 + index * 0.05 }}
                                                    className="p-4 border border-slate-200 rounded-lg hover:shadow-md transition-all"
                                                >
                                                    <div className="flex justify-between items-start mb-2">
                                                        <h4 className="font-semibold text-lg text-slate-900">{rec.title}</h4>
                                                        <span className={`px-3 py-1 rounded text-sm font-medium ${rec.priority >= 8 ? 'bg-red-100 text-red-700' :
                                                            rec.priority >= 6 ? 'bg-orange-100 text-orange-700' :
                                                                'bg-blue-100 text-blue-700'
                                                            }`}>
                                                            Priority: {rec.priority}/10
                                                        </span>
                                                    </div>
                                                    <p className="text-slate-700">{rec.description}</p>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>

                            {/* Domain Performance */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1.2 }}
                            >
                                <Card className="shadow-lg border-slate-200">
                                    <CardHeader>
                                        <CardTitle className="text-xl font-semibold text-slate-900">Domain-Level Performance</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {report.domainPerformance.map((domain, index) => (
                                                <motion.div
                                                    key={index}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: 1.3 + index * 0.05 }}
                                                    className="p-4 border border-slate-200 rounded-lg hover:shadow-md transition-all"
                                                >
                                                    <div className="flex justify-between items-center mb-2">
                                                        <div>
                                                            <h4 className="font-semibold text-slate-900">{domain.domain.name}</h4>
                                                            <p className="text-sm text-slate-600">Code: {domain.domain.code}</p>
                                                        </div>
                                                        <span className={`px-3 py-1 rounded text-sm font-medium ${getMasteryColor(domain.masteryLevel)}`}>
                                                            {domain.masteryLevel}
                                                        </span>
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-4 mt-3">
                                                        <div>
                                                            <p className="text-sm text-slate-600">Accuracy</p>
                                                            <p className="text-lg font-semibold text-slate-900">{domain.accuracy.toFixed(1)}%</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-slate-600">Avg Time</p>
                                                            <p className="text-lg font-semibold text-slate-900">{domain.avgResponseTime.toFixed(1)}s</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-slate-600">Attempts</p>
                                                            <p className="text-lg font-semibold text-slate-900">{domain.attemptsCount}</p>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>

                            {/* Export Button */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1.4 }}
                                className="flex justify-end"
                            >
                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                    <Button variant="outline" className="gap-2 border-slate-300 hover:border-cyan-500 hover:bg-cyan-50 transition-all shadow-md">
                                        <Download className="h-4 w-4" />
                                        Export Report (PDF)
                                    </Button>
                                </motion.div>
                            </motion.div>
                        </div>
                    )}
                </div>
            </div>
        </ProtectedRoute>
    );
}

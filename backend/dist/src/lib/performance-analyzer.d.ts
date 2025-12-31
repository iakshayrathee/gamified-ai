/**
 * Performance Analyzer Service
 * Generates comprehensive performance reports with AI insights
 */
export declare class PerformanceAnalyzer {
    /**
     * Generate a performance report for a child
     */
    generateReport(childId: string, startDate: Date, endDate: Date): Promise<any>;
    /**
     * Calculate aggregate metrics from attempts
     */
    private calculateMetrics;
    /**
     * Calculate domain-level performance
     */
    private calculateDomainPerformance;
    /**
     * Use AI to analyze performance and generate insights
     */
    private analyzeWithAI;
    /**
     * Detect confusion patterns in attempts
     */
    private detectConfusionPatterns;
    /**
     * Fallback insights when AI is unavailable
     */
    private getFallbackInsights;
    /**
     * Get all reports for a child
     */
    getChildReports(childId: string, limit?: number): Promise<any[]>;
}
declare const _default: PerformanceAnalyzer;
export default _default;
//# sourceMappingURL=performance-analyzer.d.ts.map
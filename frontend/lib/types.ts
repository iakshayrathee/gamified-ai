/**
 * Shared types for Quiz Results components
 */

export interface VisualConfusionPattern {
    detected: boolean;
    severity: 'low' | 'medium' | 'high';
    confusedPairs: Array<{
        correct: string;
        chosen: string;
        count: number;
    }>;
    recommendation: string;
}

export interface RandomGuessingPattern {
    detected: boolean;
    instanceCount: number;
    affectedWords: string[];
    recommendation: string;
}

export interface SlowProcessingPattern {
    detected: boolean;
    avgTime: number;
    expectedTime: number;
    slowWords: string[];
    recommendation: string;
}

export interface InconsistencyPattern {
    detected: boolean;
    variance: number;
    standardDeviation: number;
    pattern: string;
    recommendation: string;
}

export interface AvoidancePattern {
    detected: boolean;
    timeouts: number;
    skips: number;
    affectedWords: string[];
    recommendation: string;
}

export interface ErrorPattern {
    visualConfusion: VisualConfusionPattern;
    randomGuessing: RandomGuessingPattern;
    slowProcessing: SlowProcessingPattern;
    inconsistentPerformance: InconsistencyPattern;
    avoidanceBehavior: AvoidancePattern;
}

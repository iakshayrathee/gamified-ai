import { v4 as uuidv4 } from 'uuid';

interface QueuedAttempt {
    id: string; // Unique attempt ID for idempotency
    childId: string;
    questionId: string;
    microSkillId: string;
    sessionId: string;
    isCorrect: boolean;
    responseTimeSeconds: number;
    hintUsed: boolean;
    hintCount: number;
    userResponse: string;
    correctAnswer: string;
    difficultyLevelAtAttempt: number;
    timestamp: number; // Client timestamp for ordering
    retryCount: number;
}

export class AttemptQueue {
    private queue: QueuedAttempt[] = [];
    private isProcessing = false;
    private flushTimer: NodeJS.Timeout | null = null;
    private readonly STORAGE_KEY = 'quiz_attempt_queue';
    private readonly MAX_BATCH_SIZE = 10;
    private readonly FLUSH_INTERVAL = 5000; // 5 seconds
    private readonly MAX_RETRIES = 5;

    constructor() {
        this.loadFromStorage();
        this.startAutoFlush();
        this.setupBeforeUnloadHandler();
        this.setupNetworkListeners();
    }

    /**
     * Add attempt to queue with optimistic UI update
     */
    add(attemptData: Omit<QueuedAttempt, 'id' | 'timestamp' | 'retryCount'>): string {
        const attempt: QueuedAttempt = {
            ...attemptData,
            id: uuidv4(), // Unique ID for idempotency
            timestamp: Date.now(),
            retryCount: 0
        };

        this.queue.push(attempt);
        this.saveToStorage();

        console.log(`📝 Queued attempt ${attempt.id} (queue size: ${this.queue.length})`);

        // Flush if batch size reached
        if (this.queue.length >= this.MAX_BATCH_SIZE) {
            console.log('📦 Batch size reached, flushing...');
            this.flush();
        }

        return attempt.id;
    }

    /**
     * Flush queue to backend
     */
    async flush(): Promise<void> {
        if (this.queue.length === 0 || this.isProcessing) return;

        this.isProcessing = true;
        const batch = [...this.queue];

        console.log(`🚀 Flushing ${batch.length} attempts...`);

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/attempts/batch`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ attempts: batch }),
                    signal: AbortSignal.timeout(10000) // 10s timeout
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();

            // Remove successfully saved attempts
            const successIds = new Set(result.savedAttemptIds || []);
            this.queue = this.queue.filter(a => !successIds.has(a.id));
            this.saveToStorage();

            console.log(`✅ Flushed ${successIds.size}/${batch.length} attempts`);

            if (result.errors && result.errors.length > 0) {
                console.warn(`⚠️  ${result.errors.length} attempts failed:`, result.errors);
            }

        } catch (error) {
            console.error('❌ Flush failed:', error);

            // Retry with exponential backoff
            await this.retryFailedAttempts(batch);

        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Retry failed attempts with exponential backoff
     */
    private async retryFailedAttempts(attempts: QueuedAttempt[]): Promise<void> {
        for (const attempt of attempts) {
            if (attempt.retryCount >= this.MAX_RETRIES) {
                console.error(`❌ Max retries (${this.MAX_RETRIES}) reached for attempt:`, attempt.id);
                // Store in failed attempts log
                this.logFailedAttempt(attempt);
                // Remove from queue
                this.queue = this.queue.filter(a => a.id !== attempt.id);
                continue;
            }

            attempt.retryCount++;
            const delay = Math.min(1000 * Math.pow(2, attempt.retryCount), 30000);

            console.log(`🔄 Retry ${attempt.retryCount}/${this.MAX_RETRIES} for ${attempt.id} in ${delay}ms`);

            setTimeout(() => {
                // Re-add to queue if not already there
                if (!this.queue.find(a => a.id === attempt.id)) {
                    this.queue.push(attempt);
                    this.saveToStorage();
                }
                this.flush();
            }, delay);
        }

        this.saveToStorage();
    }

    /**
     * Persist queue to localStorage
     */
    private saveToStorage(): void {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.queue));
        } catch (error) {
            console.error('Failed to save queue to storage:', error);
            // Handle quota exceeded
            if (error instanceof Error && error.name === 'QuotaExceededError') {
                // Keep only most recent attempts
                this.queue = this.queue.slice(-50);
                try {
                    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.queue));
                } catch (e) {
                    console.error('Failed to save even after trimming:', e);
                }
            }
        }
    }

    /**
     * Load queue from localStorage on init
     */
    private loadFromStorage(): void {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                this.queue = JSON.parse(stored);
                console.log(`📦 Loaded ${this.queue.length} attempts from storage`);

                // Flush recovered attempts after a delay
                if (this.queue.length > 0) {
                    setTimeout(() => {
                        console.log('🔄 Flushing recovered attempts...');
                        this.flush();
                    }, 1000);
                }
            }
        } catch (error) {
            console.error('Failed to load queue from storage:', error);
            // Clear corrupted data
            localStorage.removeItem(this.STORAGE_KEY);
        }
    }

    /**
     * Auto-flush every 5 seconds
     */
    private startAutoFlush(): void {
        this.flushTimer = setInterval(() => {
            if (this.queue.length > 0) {
                console.log(`⏰ Auto-flush triggered (${this.queue.length} attempts)`);
                this.flush();
            }
        }, this.FLUSH_INTERVAL);
    }

    /**
     * Flush on page unload (browser close, navigation)
     */
    private setupBeforeUnloadHandler(): void {
        if (typeof window === 'undefined') return;

        window.addEventListener('beforeunload', (e) => {
            if (this.queue.length > 0) {
                console.log(`🚪 Page unloading, sending ${this.queue.length} attempts via sendBeacon`);

                // Use sendBeacon for guaranteed delivery
                const blob = new Blob(
                    [JSON.stringify({ attempts: this.queue })],
                    { type: 'application/json' }
                );

                const sent = navigator.sendBeacon(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/attempts/batch`,
                    blob
                );

                if (sent) {
                    console.log('✅ sendBeacon successful');
                } else {
                    console.warn('⚠️  sendBeacon failed, data saved to localStorage');
                }

                // Save to storage as backup
                this.saveToStorage();
            }
        });
    }

    /**
     * Flush on network reconnect
     */
    private setupNetworkListeners(): void {
        if (typeof window === 'undefined') return;

        window.addEventListener('online', () => {
            console.log('🌐 Network reconnected, flushing queue...');
            this.flush();
        });

        window.addEventListener('offline', () => {
            console.log('📡 Network disconnected, queueing mode enabled');
        });
    }

    /**
     * Log failed attempts for admin review
     */
    private logFailedAttempt(attempt: QueuedAttempt): void {
        try {
            const failedAttempts = JSON.parse(
                localStorage.getItem('failed_attempts') || '[]'
            );
            failedAttempts.push({
                ...attempt,
                failedAt: new Date().toISOString()
            });
            // Keep only last 100 failed attempts
            const trimmed = failedAttempts.slice(-100);
            localStorage.setItem('failed_attempts', JSON.stringify(trimmed));

            console.error('💾 Logged failed attempt to localStorage');
        } catch (error) {
            console.error('Failed to log failed attempt:', error);
        }
    }

    /**
     * Get queue status
     */
    getStatus() {
        return {
            queueLength: this.queue.length,
            isProcessing: this.isProcessing,
            oldestAttempt: this.queue[0]?.timestamp,
            oldestAttemptAge: this.queue[0] ? Date.now() - this.queue[0].timestamp : 0
        };
    }

    /**
     * Force flush (for testing or manual trigger)
     */
    forceFlush(): Promise<void> {
        console.log('🔨 Force flush triggered');
        return this.flush();
    }

    /**
     * Clear queue (for testing)
     */
    clear(): void {
        this.queue = [];
        this.saveToStorage();
        console.log('🗑️  Queue cleared');
    }

    /**
     * Get failed attempts log
     */
    getFailedAttempts(): any[] {
        try {
            return JSON.parse(localStorage.getItem('failed_attempts') || '[]');
        } catch {
            return [];
        }
    }

    /**
     * Cleanup
     */
    destroy(): void {
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
        }
        // Final flush before destroy
        if (this.queue.length > 0) {
            this.flush();
        }
    }
}

// Singleton instance
export const attemptQueue = new AttemptQueue();

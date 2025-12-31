/**
 * Audio feedback utility using Web Audio API
 * Generates synthesized sounds for correct/incorrect answers
 * No audio files required - everything is generated programmatically
 */

/**
 * Play a success/correct answer sound
 * Creates a pleasant ascending tone sequence
 */
export function playCorrectSound() {
    try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

        // Create a pleasant "ding" sound with ascending notes
        const notes = [523.25, 659.25, 783.99]; // C5, E5, G5 (major chord)
        const duration = 0.15;
        const startTime = audioContext.currentTime;

        notes.forEach((frequency, index) => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = frequency;
            oscillator.type = 'sine';

            // Envelope for smooth sound
            gainNode.gain.setValueAtTime(0, startTime + index * duration);
            gainNode.gain.linearRampToValueAtTime(0.3, startTime + index * duration + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + index * duration + duration);

            oscillator.start(startTime + index * duration);
            oscillator.stop(startTime + index * duration + duration);
        });

        // Cleanup
        setTimeout(() => {
            audioContext.close();
        }, 1000);
    } catch (error) {
        console.warn('Could not play correct sound:', error);
    }
}

/**
 * Play an error/incorrect answer sound
 * Creates a descending tone to indicate mistake
 */
export function playIncorrectSound() {
    try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

        // Create a "buzz" sound with descending tone
        const startFrequency = 300;
        const endFrequency = 150;
        const duration = 0.3;
        const startTime = audioContext.currentTime;

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(startFrequency, startTime);
        oscillator.frequency.exponentialRampToValueAtTime(endFrequency, startTime + duration);

        // Envelope
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

        oscillator.start(startTime);
        oscillator.stop(startTime + duration);

        // Cleanup
        setTimeout(() => {
            audioContext.close();
        }, 500);
    } catch (error) {
        console.warn('Could not play incorrect sound:', error);
    }
}

/**
 * Play a celebration sound for achievements
 * Creates an uplifting melody
 */
export function playCelebrationSound() {
    try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

        // Create a celebratory melody
        const melody = [
            { freq: 523.25, time: 0 },      // C5
            { freq: 659.25, time: 0.1 },    // E5
            { freq: 783.99, time: 0.2 },    // G5
            { freq: 1046.50, time: 0.3 },   // C6
        ];

        const duration = 0.15;
        const startTime = audioContext.currentTime;

        melody.forEach(({ freq, time }) => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = freq;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0, startTime + time);
            gainNode.gain.linearRampToValueAtTime(0.25, startTime + time + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + time + duration);

            oscillator.start(startTime + time);
            oscillator.stop(startTime + time + duration);
        });

        // Cleanup
        setTimeout(() => {
            audioContext.close();
        }, 1000);
    } catch (error) {
        console.warn('Could not play celebration sound:', error);
    }
}

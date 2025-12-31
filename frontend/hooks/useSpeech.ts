'use client';

import { useCallback, useEffect, useRef } from 'react';

interface UseSpeechOptions {
    /**
     * Speech rate (0.1 to 10, default: 1)
     * 0.9 is slightly slower, good for children
     */
    rate?: number;

    /**
     * Speech pitch (0 to 2, default: 1)
     * 1.1 is slightly higher, more child-friendly
     */
    pitch?: number;

    /**
     * Volume (0 to 1, default: 1)
     */
    volume?: number;

    /**
     * Language code (default: 'en-US')
     */
    lang?: string;

    /**
     * Voice name preference (optional)
     * Will try to find a voice matching this name
     */
    voiceName?: string;
}

interface UseSpeechReturn {
    /**
     * Speak the given text
     * Automatically cancels any ongoing speech
     */
    speak: (text: string) => void;

    /**
     * Stop any ongoing speech
     */
    stop: () => void;

    /**
     * Pause ongoing speech
     */
    pause: () => void;

    /**
     * Resume paused speech
     */
    resume: () => void;

    /**
     * Check if speech synthesis is supported
     */
    isSupported: boolean;

    /**
     * Check if currently speaking
     */
    isSpeaking: boolean;
}

/**
 * Custom hook for text-to-speech using Web Speech API
 * 
 * @example
 * ```tsx
 * const { speak, stop, isSupported } = useSpeech({ rate: 0.9, pitch: 1.1 });
 * 
 * // Speak some text
 * speak("Hello, welcome to the quiz!");
 * 
 * // Stop speaking
 * stop();
 * ```
 */
export function useSpeech(options: UseSpeechOptions = {}): UseSpeechReturn {
    const {
        rate = 0.9,      // Slightly slower for children
        pitch = 1.1,     // Slightly higher pitch for child-friendly voice
        volume = 1,
        lang = 'en-US',
        voiceName,
    } = options;

    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
    const isSpeakingRef = useRef(false);

    // Check if speech synthesis is supported
    const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

    /**
     * Get the best available voice for the specified language
     */
    const getVoice = useCallback((): SpeechSynthesisVoice | null => {
        if (!isSupported) return null;

        const voices = window.speechSynthesis.getVoices();

        // If a specific voice name is requested, try to find it
        if (voiceName) {
            const namedVoice = voices.find(v => v.name === voiceName);
            if (namedVoice) return namedVoice;
        }

        // Try to find a voice matching the language
        const langVoices = voices.filter(v => v.lang.startsWith(lang.split('-')[0]));

        // Prefer voices with 'child', 'kid', or 'young' in the name
        const childVoice = langVoices.find(v =>
            /child|kid|young/i.test(v.name)
        );
        if (childVoice) return childVoice;

        // Prefer female voices (often more pleasant for children)
        const femaleVoice = langVoices.find(v =>
            /female|woman|girl/i.test(v.name)
        );
        if (femaleVoice) return femaleVoice;

        // Return first voice matching language, or first available voice
        return langVoices[0] || voices[0] || null;
    }, [isSupported, lang, voiceName]);

    /**
     * Speak the given text
     */
    const speak = useCallback((text: string) => {
        if (!isSupported || !text.trim()) return;

        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        // Create new utterance
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = rate;
        utterance.pitch = pitch;
        utterance.volume = volume;
        utterance.lang = lang;

        // Set voice
        const voice = getVoice();
        if (voice) {
            utterance.voice = voice;
        }

        // Track speaking state
        utterance.onstart = () => {
            isSpeakingRef.current = true;
        };

        utterance.onend = () => {
            isSpeakingRef.current = false;
        };

        utterance.onerror = (event) => {
            console.warn('Speech synthesis error:', event.error);
            isSpeakingRef.current = false;
        };

        // Store reference and speak
        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
    }, [isSupported, rate, pitch, volume, lang, getVoice]);

    /**
     * Stop any ongoing speech
     */
    const stop = useCallback(() => {
        if (!isSupported) return;
        window.speechSynthesis.cancel();
        isSpeakingRef.current = false;
    }, [isSupported]);

    /**
     * Pause ongoing speech
     */
    const pause = useCallback(() => {
        if (!isSupported) return;
        window.speechSynthesis.pause();
    }, [isSupported]);

    /**
     * Resume paused speech
     */
    const resume = useCallback(() => {
        if (!isSupported) return;
        window.speechSynthesis.resume();
    }, [isSupported]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (isSupported) {
                window.speechSynthesis.cancel();
            }
        };
    }, [isSupported]);

    // Load voices (some browsers load voices asynchronously)
    useEffect(() => {
        if (!isSupported) return;

        // Load voices
        const loadVoices = () => {
            window.speechSynthesis.getVoices();
        };

        loadVoices();

        // Some browsers fire this event when voices are loaded
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
            window.speechSynthesis.onvoiceschanged = loadVoices;
        }

        return () => {
            if (window.speechSynthesis.onvoiceschanged !== undefined) {
                window.speechSynthesis.onvoiceschanged = null;
            }
        };
    }, [isSupported]);

    return {
        speak,
        stop,
        pause,
        resume,
        isSupported,
        isSpeaking: isSpeakingRef.current,
    };
}

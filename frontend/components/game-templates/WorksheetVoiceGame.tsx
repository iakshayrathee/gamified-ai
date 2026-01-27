'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Check, CheckCircle2, XCircle, RotateCcw } from 'lucide-react';
import { BaseGameProps } from '@/lib/types/game.types';

declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

export default function WorksheetVoiceGame({
    question,
    onAnswer,
}: BaseGameProps) {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
    const [startTime] = useState(Date.now());
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onresult = (event: any) => {
                const current = event.resultIndex;
                const result = event.results[current][0].transcript;
                setTranscript(result);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error('Speech recognition error:', event.error);
                setIsListening(false);
            };
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []);

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
        } else {
            setTranscript('');
            recognitionRef.current?.start();
            setIsListening(true);
        }
    };

    const handleOk = () => {
        if (!transcript || feedback) return;

        const isCorrect = transcript.toLowerCase().includes(question.correctAnswer.toLowerCase());
        setFeedback(isCorrect ? 'correct' : 'incorrect');

        const timeSeconds = (Date.now() - startTime) / 1000;

        setTimeout(() => {
            onAnswer(isCorrect, timeSeconds, false, transcript);
        }, 1500);
    };

    const resetTranscript = () => {
        setTranscript('');
        setFeedback(null);
    };

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-4xl bg-white/95 backdrop-blur-md rounded-[3rem] p-10 shadow-2xl border-4 border-white/50 flex flex-col items-center min-h-[500px]">

                <div className="text-center mb-10">
                    <h2 className="text-4xl md:text-5xl font-black text-purple-900 mb-4 leading-tight">
                        {question.promptText}
                    </h2>
                    <div className="h-1.5 w-32 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full mx-auto opacity-60" />
                </div>

                <div className="flex-1 flex flex-col items-center justify-center w-full gap-8">
                    {/* Transcript Display */}
                    <div className="w-full max-w-2xl min-h-[120px] bg-purple-50 rounded-[2.5rem] border-4 border-dashed border-purple-200 flex items-center justify-center p-8 relative overflow-hidden">
                        {transcript ? (
                            <motion.p
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-3xl md:text-4xl font-black text-purple-800 text-center"
                            >
                                {transcript}
                            </motion.p>
                        ) : (
                            <p className="text-2xl font-bold text-purple-300 italic">
                                {isListening ? "Listening..." : "Tap the mic and say the answer!"}
                            </p>
                        )}

                        {isListening && (
                            <motion.div
                                className="absolute bottom-0 left-0 h-1.5 bg-purple-400"
                                animate={{ width: ['0%', '100%'] }}
                                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                            />
                        )}
                    </div>

                    {/* Mic Button */}
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={toggleListening}
                        className={`
                            w-32 h-32 rounded-full flex items-center justify-center shadow-2xl transition-all relative
                            ${isListening ? 'bg-red-500 ring-8 ring-red-100' : 'bg-purple-600 hover:bg-purple-500'}
                        `}
                    >
                        {isListening ? (
                            <MicOff className="w-16 h-16 text-white" />
                        ) : (
                            <Mic className="w-16 h-16 text-white" />
                        )}

                        {isListening && (
                            <motion.div
                                className="absolute -inset-4 border-4 border-red-400 rounded-full"
                                animate={{ scale: [1, 1.2], opacity: [0.5, 0] }}
                                transition={{ duration: 1, repeat: Infinity }}
                            />
                        )}
                    </motion.button>
                </div>

                {/* Bottom Actions */}
                <div className="flex items-center gap-6 mt-10">
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={resetTranscript}
                        className="p-4 bg-gray-100 text-gray-400 rounded-2xl hover:bg-gray-200 transition-all"
                    >
                        <RotateCcw className="w-8 h-8" />
                    </motion.button>

                    <motion.button
                        whileHover={transcript ? { scale: 1.05 } : {}}
                        whileTap={transcript ? { scale: 0.95 } : {}}
                        onClick={handleOk}
                        disabled={!transcript || !!feedback}
                        className={`
                            px-20 py-5 rounded-full font-black text-3xl shadow-xl transition-all flex items-center gap-4
                            ${transcript
                                ? 'bg-[#00C985] text-white hover:bg-[#00B075]'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
                        `}
                    >
                        <Check className="w-10 h-10 stroke-[4px]" />
                        OK
                    </motion.button>
                </div>
            </div>

            <AnimatePresence>
                {feedback && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
                    >
                        <div className={`p-16 rounded-full shadow-2xl backdrop-blur-md border-4 border-white ${feedback === 'correct' ? 'bg-emerald-500/90' : 'bg-red-500/90'}`}>
                            {feedback === 'correct' ? <CheckCircle2 className="w-40 h-40 text-white" /> : <XCircle className="w-40 h-40 text-white" />}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

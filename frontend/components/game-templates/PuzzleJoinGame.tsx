'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Volume2, Sparkles } from 'lucide-react';
import { useSpeech } from '@/hooks/useSpeech';

interface PuzzlePiece {
    id: string;
    text: string;
    type: 'onset' | 'rime';
    audioUrl?: string;
}

interface PuzzleJoinGameProps {
    onset: PuzzlePiece;
    rimes: PuzzlePiece[];
    correctRime: string;
    resultWord: string;
    resultImageUrl?: string;
    onComplete: (correct: boolean, timeSeconds: number) => void;
    onHintRequest?: () => void;
}

export default function PuzzleJoinGame({
    onset,
    rimes,
    correctRime,
    resultWord,
    resultImageUrl,
    onComplete,
    onHintRequest
}: PuzzleJoinGameProps) {
    const [selectedRime, setSelectedRime] = useState<PuzzlePiece | null>(null);
    const [joined, setJoined] = useState(false);
    const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
    const [startTime] = useState(Date.now());
    const [showHint, setShowHint] = useState(false);

    // Initialize TTS
    const { speak } = useSpeech();

    const playAudio = (text?: string) => {
        // Use TTS to read the text
        if (text) {
            speak(text);
        }
    };

    const handleRimeSelect = (rime: PuzzlePiece) => {
        if (feedback) return;

        setSelectedRime(rime);
        setJoined(true);

        // Play combined sound
        setTimeout(() => {
            playAudio(rime.text);
        }, 300);
    };

    const handleCheck = () => {
        if (!selectedRime) return;

        const isCorrect = selectedRime.text === correctRime;
        const timeSeconds = (Date.now() - startTime) / 1000;

        setFeedback(isCorrect ? 'correct' : 'incorrect');

        setTimeout(() => {
            onComplete(isCorrect, timeSeconds);
        }, 2000);
    };

    const handleReset = () => {
        setSelectedRime(null);
        setJoined(false);
    };

    const handleHint = () => {
        setShowHint(true);
        onHintRequest?.();
        setTimeout(() => setShowHint(false), 3000);
    };

    // Safety check
    if (!onset || !rimes || rimes.length === 0 || !correctRime || !resultWord) {
        return (
            <div className="w-full max-w-5xl mx-auto p-8">
                <div className="text-center">
                    <p className="text-2xl text-red-600">Error: Invalid puzzle data</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-5xl mx-auto p-8">
            {/* Instructions */}
            <div className="text-center mb-8">
                <h2 className="text-4xl font-bold text-purple-600 mb-4">Join the Sounds!</h2>
                <p className="text-2xl text-gray-700">Tap a piece to join with the first sound</p>
            </div>

            {/* Puzzle Area */}
            <div className="flex items-center justify-center gap-8 mb-12 min-h-[300px]">
                {/* Onset Piece */}
                <motion.div
                    initial={{ x: -100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="relative"
                >
                    <div
                        className={`
                            bg-gradient-to-br from-blue-400 to-blue-600 text-white
                            rounded-l-3xl rounded-r-lg p-8 shadow-2xl
                            ${joined ? 'rounded-r-none' : ''}
                        `}
                        style={{ clipPath: 'polygon(0 0, 85% 0, 100% 50%, 85% 100%, 0 100%)' }}
                    >
                        <p className="text-6xl font-bold">{onset.text}</p>
                    </div>

                    <button
                        onClick={() => playAudio(onset.text)}
                        className="absolute -top-4 -right-4 bg-blue-500 text-white p-3 rounded-full shadow-lg hover:bg-blue-600"
                    >
                        <Volume2 className="w-6 h-6" />
                    </button>
                </motion.div>

                {/* Selected Rime Piece (Joined) */}
                <AnimatePresence>
                    {joined && selectedRime && (
                        <motion.div
                            initial={{ x: 100, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 100, opacity: 0 }}
                            className="relative"
                        >
                            <div
                                className={`
                                    bg-gradient-to-br from-pink-400 to-pink-600 text-white
                                    rounded-r-3xl rounded-l-lg p-8 shadow-2xl
                                    ${feedback === 'correct' && 'ring-8 ring-green-400'}
                                    ${feedback === 'incorrect' && 'ring-8 ring-red-400'}
                                `}
                                style={{ clipPath: 'polygon(15% 0, 100% 0, 100% 100%, 15% 100%, 0 50%)' }}
                            >
                                <p className="text-6xl font-bold">{selectedRime.text}</p>
                            </div>

                            {!feedback && (
                                <button
                                    onClick={handleReset}
                                    className="absolute -top-4 -right-4 bg-red-500 text-white p-3 rounded-full shadow-lg hover:bg-red-600"
                                >
                                    ✕
                                </button>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Placeholder */}
                {!joined && (
                    <div className="w-48 h-48 border-4 border-dashed border-gray-300 rounded-3xl flex items-center justify-center">
                        <p className="text-4xl text-gray-400">?</p>
                    </div>
                )}
            </div>

            {/* Result Word Display */}
            {joined && selectedRime && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-center mb-8"
                >
                    <div className="inline-block bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-6 shadow-lg">
                        <p className="text-5xl font-bold text-purple-600 mb-2">
                            {onset.text}{selectedRime.text}
                        </p>
                        {resultImageUrl && (
                            <img
                                src={resultImageUrl}
                                alt={resultWord}
                                className="w-32 h-32 object-contain mx-auto mt-4"
                            />
                        )}
                    </div>
                </motion.div>
            )}

            {/* Rime Options */}
            {!joined && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8">
                    {rimes.map((rime, index) => {
                        const isCorrect = rime.text === correctRime;
                        const shouldHighlight = showHint && isCorrect;

                        return (
                            <motion.button
                                key={rime.id}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.1 }}
                                onClick={() => handleRimeSelect(rime)}
                                className={`
                                    relative bg-gradient-to-br from-pink-400 to-pink-600 text-white
                                    rounded-3xl p-8 shadow-xl text-5xl font-bold
                                    hover:scale-110 hover:shadow-2xl transition-all duration-300
                                    ${shouldHighlight && 'ring-4 ring-yellow-400 ring-offset-4 animate-pulse'}
                                `}
                                style={{ clipPath: 'polygon(15% 0, 100% 0, 100% 100%, 15% 100%, 0 50%)' }}
                            >
                                {rime.text}

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        playAudio(rime.text);
                                    }}
                                    className="absolute top-2 right-2 bg-pink-700 text-white p-2 rounded-full hover:bg-pink-800"
                                >
                                    <Volume2 className="w-5 h-5" />
                                </button>
                            </motion.button>
                        );
                    })}
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-center gap-4">
                {!joined && (
                    <button
                        onClick={handleHint}
                        className="px-8 py-4 bg-yellow-500 text-white rounded-full text-xl font-bold hover:bg-yellow-600 transition-colors shadow-lg"
                    >
                        💡 Hint
                    </button>
                )}

                {joined && !feedback && (
                    <button
                        onClick={handleCheck}
                        className="px-12 py-4 bg-green-500 text-white rounded-full text-xl font-bold hover:bg-green-600 hover:scale-105 transition-all shadow-lg"
                    >
                        ✓ Check Answer
                    </button>
                )}
            </div>

            {/* Feedback */}
            <AnimatePresence>
                {feedback && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
                    >
                        <motion.div
                            animate={{
                                rotate: feedback === 'correct' ? [0, 10, -10, 0] : 0,
                                scale: [1, 1.2, 1],
                            }}
                            transition={{ duration: 0.5 }}
                            className={`
                                p-12 rounded-3xl text-center
                                ${feedback === 'correct' ? 'bg-green-500' : 'bg-red-500'}
                            `}
                        >
                            {feedback === 'correct' ? (
                                <>
                                    <CheckCircle2 className="w-32 h-32 text-white mx-auto mb-4" />
                                    <p className="text-5xl font-bold text-white mb-2">Perfect!</p>
                                    <p className="text-3xl text-white">{resultWord}</p>
                                    <Sparkles className="w-16 h-16 text-yellow-300 mx-auto mt-4 animate-pulse" />
                                </>
                            ) : (
                                <>
                                    <XCircle className="w-32 h-32 text-white mx-auto mb-4" />
                                    <p className="text-5xl font-bold text-white">Try Again!</p>
                                </>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

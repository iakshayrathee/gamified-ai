'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Volume2, Sparkles } from 'lucide-react';
import { useSpeech } from '@/hooks/useSpeech';

interface OddOneOutItem {
    id: string;
    content: string;
    imageUrl?: string;
    audioUrl?: string;
    isOdd: boolean;
    category?: string;
}

interface OddOneOutGameProps {
    items: OddOneOutItem[];
    instruction: string;
    explanation?: string;
    onComplete: (correct: boolean, timeSeconds: number) => void;
    onHintRequest?: () => void;
}

export default function OddOneOutGame({
    items,
    instruction,
    explanation,
    onComplete,
    onHintRequest
}: OddOneOutGameProps) {
    const [selectedItem, setSelectedItem] = useState<string | null>(null);
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

    const handleItemClick = (item: OddOneOutItem) => {
        if (feedback) return;

        setSelectedItem(item.id);
        const isCorrect = item.isOdd;
        const timeSeconds = (Date.now() - startTime) / 1000;

        setFeedback(isCorrect ? 'correct' : 'incorrect');

        setTimeout(() => {
            onComplete(isCorrect, timeSeconds);
        }, 2000);
    };

    const handleHint = () => {
        setShowHint(true);
        onHintRequest?.();
        setTimeout(() => setShowHint(false), 3000);
    };

    // Safety check
    if (!items || items.length === 0 || !instruction) {
        return (
            <div className="w-full max-w-6xl mx-auto p-8">
                <div className="text-center">
                    <p className="text-2xl text-red-600">Error: Invalid game data</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-6xl mx-auto p-8">
            {/* Instructions */}
            <div className="text-center mb-12">
                <h2 className="text-4xl font-bold text-purple-600 mb-4">Find the Odd One Out!</h2>
                <p className="text-2xl text-gray-700">{instruction}</p>
            </div>

            {/* Items Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 mb-8">
                {items.map((item, index) => {
                    const isSelected = selectedItem === item.id;
                    const shouldHighlight = showHint && item.isOdd;

                    return (
                        <motion.button
                            key={item.id}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1 }}
                            onClick={() => handleItemClick(item)}
                            disabled={!!feedback}
                            className={`
                                relative p-8 rounded-3xl transition-all duration-300
                                ${!feedback && 'hover:scale-110 hover:shadow-2xl'}
                                ${isSelected && feedback === 'correct' && 'bg-green-500 text-white scale-110 shadow-2xl ring-8 ring-green-300'}
                                ${isSelected && feedback === 'incorrect' && 'bg-red-500 text-white shake'}
                                ${!isSelected && !feedback && 'bg-white shadow-xl border-4 border-purple-300'}
                                ${!isSelected && feedback && item.isOdd && 'bg-green-100 border-4 border-green-500'}
                                ${!isSelected && feedback && !item.isOdd && 'opacity-40'}
                                ${shouldHighlight && 'ring-8 ring-yellow-400 ring-offset-4 animate-pulse'}
                            `}
                            style={{ minHeight: '250px' }}
                        >
                            {/* Image */}
                            {item.imageUrl && (
                                <div className="mb-4">
                                    <img
                                        src={item.imageUrl}
                                        alt={item.content}
                                        className="w-32 h-32 object-contain mx-auto"
                                    />
                                </div>
                            )}

                            {/* Content */}
                            <p className={`
                                text-3xl font-bold text-center
                                ${isSelected && feedback ? 'text-white' : 'text-purple-700'}
                            `}>
                                {item.content}
                            </p>

                            {/* Category Label (shown after feedback) */}
                            {feedback && item.category && (
                                <p className={`
                                    text-sm mt-3 text-center font-medium
                                    ${isSelected && feedback ? 'text-white' : 'text-gray-600'}
                                `}>
                                    ({item.category})
                                </p>
                            )}

                            {/* Audio Button */}
                            {!feedback && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        playAudio(item.content);
                                    }}
                                    className="absolute top-3 right-3 bg-blue-400 text-white p-3 rounded-full hover:bg-blue-500 shadow-lg"
                                >
                                    <Volume2 className="w-5 h-5" />
                                </button>
                            )}

                            {/* Feedback Icons */}
                            {isSelected && feedback === 'correct' && (
                                <CheckCircle2 className="absolute top-3 left-3 w-10 h-10 text-white" />
                            )}
                            {isSelected && feedback === 'incorrect' && (
                                <XCircle className="absolute top-3 left-3 w-10 h-10 text-white" />
                            )}

                            {/* Odd One Indicator (shown after feedback) */}
                            {feedback && item.isOdd && !isSelected && (
                                <div className="absolute -top-4 -right-4 bg-green-500 text-white rounded-full w-16 h-16 flex items-center justify-center text-3xl font-bold shadow-lg">
                                    ⭐
                                </div>
                            )}
                        </motion.button>
                    );
                })}
            </div>

            {/* Hint Button */}
            {!feedback && (
                <div className="flex justify-center">
                    <button
                        onClick={handleHint}
                        className="px-8 py-4 bg-yellow-500 text-white rounded-full text-xl font-bold hover:bg-yellow-600 transition-colors shadow-lg"
                    >
                        💡 Hint
                    </button>
                </div>
            )}

            {/* Explanation (shown after correct answer) */}
            {feedback === 'correct' && explanation && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-8 bg-blue-100 rounded-2xl p-6 text-center"
                >
                    <p className="text-xl text-blue-800 font-medium">{explanation}</p>
                </motion.div>
            )}

            {/* Feedback Modal */}
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
                                p-12 rounded-3xl text-center max-w-2xl
                                ${feedback === 'correct' ? 'bg-green-500' : 'bg-red-500'}
                            `}
                        >
                            {feedback === 'correct' ? (
                                <>
                                    <CheckCircle2 className="w-32 h-32 text-white mx-auto mb-4" />
                                    <p className="text-5xl font-bold text-white mb-4">You Found It!</p>
                                    {explanation && (
                                        <p className="text-2xl text-white">{explanation}</p>
                                    )}
                                    <Sparkles className="w-16 h-16 text-yellow-300 mx-auto mt-4 animate-pulse" />
                                </>
                            ) : (
                                <>
                                    <XCircle className="w-32 h-32 text-white mx-auto mb-4" />
                                    <p className="text-5xl font-bold text-white">Not Quite!</p>
                                    <p className="text-2xl text-white mt-2">Try again</p>
                                </>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Volume2, Sparkles, ArrowRight } from 'lucide-react';
import { useSpeech } from '@/hooks/useSpeech';

interface SequenceItem {
    id: string;
    content: string;
    imageUrl?: string;
    audioUrl?: string;
    correctPosition: number;
}

import { BaseGameProps } from '@/lib/types/game.types';

export default function SequencingGame({
    question,
    onAnswer,
    difficultyLevel,
    showHint: shouldShowHint,
    isRulesModalOpen,
}: BaseGameProps) {
    const items: SequenceItem[] = question.assetUrls?.items || [];
    const instruction: string = question.promptText || '';
    const onComplete = (correct: boolean, timeSeconds: number) => onAnswer(correct, timeSeconds, false);

    // Add null/undefined checks with default values
    const safeItems = items || [];
    const [orderedItems, setOrderedItems] = useState<SequenceItem[]>([...safeItems].sort(() => Math.random() - 0.5));
    const [draggedItem, setDraggedItem] = useState<SequenceItem | null>(null);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
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

    const handleDragStart = (item: SequenceItem, index: number) => {
        setDraggedItem(item);
        setDraggedIndex(index);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();

        if (draggedIndex === null || draggedIndex === index) return;

        const newItems = [...orderedItems];
        const draggedItemCopy = newItems[draggedIndex];

        // Remove from old position
        newItems.splice(draggedIndex, 1);

        // Insert at new position
        newItems.splice(index, 0, draggedItemCopy);

        setOrderedItems(newItems);
        setDraggedIndex(index);
    };

    const handleDragEnd = () => {
        setDraggedItem(null);
        setDraggedIndex(null);
    };

    const handleCheck = () => {
        // Check if sequence is correct
        const isCorrect = orderedItems.every((item, index) => item.correctPosition === index + 1);
        const timeSeconds = (Date.now() - startTime) / 1000;

        setFeedback(isCorrect ? 'correct' : 'incorrect');

        if (isCorrect) {
            onComplete(isCorrect, timeSeconds);
        } else {
            setTimeout(() => {
                onComplete(isCorrect, timeSeconds);
            }, 2000);
        }
    };

    const handleHint = () => {
        setShowHint(true);
        setTimeout(() => setShowHint(false), 3000);
    };

    const handleShuffle = () => {
        setOrderedItems([...safeItems].sort(() => Math.random() - 0.5));
    };

    // Safety check
    if (!safeItems || safeItems.length === 0) {
        return (
            <div className="w-full max-w-6xl mx-auto p-8">
                <div className="text-center">
                    <p className="text-2xl text-red-600">Error: No items to sequence</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-6xl mx-auto p-8">
            {/* Instructions */}
            <div className="text-center mb-8">
                <h2 className="text-4xl font-bold text-purple-600 mb-4">Put in Order!</h2>
                <p className="text-2xl text-gray-700">{instruction}</p>
            </div>

            {/* Sequence Area */}
            <div className="mb-8">
                <div className="flex items-center justify-center gap-4 flex-wrap">
                    {orderedItems.map((item, index) => {
                        const isCorrectPosition = showHint && item.correctPosition === index + 1;
                        const isDragging = draggedIndex === index;

                        return (
                            <div key={item.id} className="flex items-center">
                                <motion.div
                                    draggable
                                    onDragStart={() => handleDragStart(item, index)}
                                    onDragOver={(e) => handleDragOver(e, index)}
                                    onDragEnd={handleDragEnd}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className={`
                                        relative bg-white rounded-2xl p-6 shadow-xl cursor-move
                                        border-4 transition-all duration-200
                                        ${isDragging ? 'opacity-50 scale-95' : 'opacity-100'}
                                        ${isCorrectPosition ? 'border-yellow-400 ring-4 ring-yellow-400 ring-offset-4' : 'border-purple-300'}
                                        ${feedback === 'correct' && 'border-green-500'}
                                        ${feedback === 'incorrect' && item.correctPosition !== index + 1 && 'border-red-500'}
                                        hover:border-purple-500
                                    `}
                                    style={{ minWidth: '180px', minHeight: '180px' }}
                                >
                                    {/* Position Number */}
                                    <div className="absolute -top-4 -left-4 bg-purple-500 text-white rounded-full w-12 h-12 flex items-center justify-center text-2xl font-bold shadow-lg">
                                        {index + 1}
                                    </div>

                                    {/* Correct Position Indicator (for hint) */}
                                    {isCorrectPosition && (
                                        <div className="absolute -top-4 -right-4 bg-yellow-400 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold shadow-lg animate-bounce">
                                            ✓
                                        </div>
                                    )}

                                    {/* Image */}
                                    {item.imageUrl && (
                                        <img
                                            src={item.imageUrl}
                                            alt={item.content}
                                            className="w-24 h-24 object-contain mx-auto mb-3"
                                        />
                                    )}

                                    {/* Content */}
                                    <p className="text-xl font-semibold text-center text-gray-800">
                                        {item.content}
                                    </p>

                                    {/* Audio Button */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            playAudio(item.content);
                                        }}
                                        className="absolute bottom-2 right-2 bg-blue-400 text-white p-2 rounded-full hover:bg-blue-500"
                                    >
                                        <Volume2 className="w-4 h-4" />
                                    </button>
                                </motion.div>

                                {/* Arrow between items */}
                                {index < orderedItems.length - 1 && (
                                    <ArrowRight className="w-8 h-8 text-purple-400 mx-2" />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Helper Text */}
            <div className="text-center mb-6">
                <p className="text-lg text-gray-600">Drag and drop to reorder the items</p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center gap-4">
                <button
                    onClick={handleShuffle}
                    disabled={!!feedback}
                    className="px-8 py-4 bg-gray-500 text-white rounded-full text-xl font-bold hover:bg-gray-600 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    🔀 Shuffle
                </button>

                <button
                    onClick={handleHint}
                    disabled={!!feedback}
                    className="px-8 py-4 bg-yellow-500 text-white rounded-full text-xl font-bold hover:bg-yellow-600 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    💡 Hint
                </button>

                <button
                    onClick={handleCheck}
                    disabled={!!feedback}
                    className="px-12 py-4 bg-green-500 text-white rounded-full text-xl font-bold hover:bg-green-600 hover:scale-105 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    ✓ Check Order
                </button>
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
                                    <p className="text-5xl font-bold text-white">Perfect Order!</p>
                                    <Sparkles className="w-16 h-16 text-yellow-300 mx-auto mt-4 animate-pulse" />
                                </>
                            ) : (
                                <>
                                    <XCircle className="w-32 h-32 text-white mx-auto mb-4" />
                                    <p className="text-5xl font-bold text-white">Try Again!</p>
                                    <p className="text-2xl text-white mt-2">Check the order</p>
                                </>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

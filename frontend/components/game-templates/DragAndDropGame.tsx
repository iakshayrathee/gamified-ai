'use client';

import { useState, useEffect } from 'react';
import { BaseGameProps } from '@/lib/types/game.types';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, Lightbulb } from 'lucide-react';
import { DndContext, DragEndEvent, useDraggable, useDroppable } from '@dnd-kit/core';
import GameContainer from './GameContainer';
import ShakeAnimation from '@/components/ui/ShakeAnimation';
import { useSpeech } from '@/hooks/useSpeech';
import { playCorrectSound, playIncorrectSound } from '@/lib/audioFeedback';

interface DraggableItemProps {
    id: string;
    children: React.ReactNode;
}

function DraggableItem({ id, children }: DraggableItemProps) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });

    const style = transform
        ? {
            transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
            zIndex: isDragging ? 50 : 1,
            opacity: isDragging ? 0.8 : 1,
        }
        : undefined;

    return (
        <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="cursor-grab active:cursor-grabbing">
            {children}
        </div>
    );
}

interface DroppableZoneProps {
    id: string;
    children: React.ReactNode;
    isOver?: boolean;
}

function DroppableZone({ id, children, isOver }: DroppableZoneProps) {
    const { setNodeRef } = useDroppable({ id });

    return (
        <div
            ref={setNodeRef}
            className={`
        min-h-[160px] rounded-3xl border-4 border-dashed p-6 transition-all
        ${isOver ? 'border-purple-500 bg-purple-100 scale-105' : 'border-gray-300 bg-white'}
      `}
        >
            {children}
        </div>
    );
}

export default function DragAndDropGame({
    question,
    onAnswer,
    difficultyLevel,
    showHint,
}: BaseGameProps) {
    // Safety check
    if (!question || !question.correctAnswer || !question.distractors) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 via-green-100 to-yellow-100 p-6">
                <div className="text-center">
                    <p className="text-2xl text-red-600">Error: Invalid question data</p>
                </div>
            </div>
        );
    }

    const [startTime] = useState(Date.now());
    const [hintUsed, setHintUsed] = useState(false);
    const [droppedItem, setDroppedItem] = useState<string | null>(null);
    const [showFeedback, setShowFeedback] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);

    // Initialize TTS
    const { speak, stop } = useSpeech();

    const options = [question.correctAnswer, ...question.distractors];
    const [shuffledOptions] = useState(() => options.sort(() => Math.random() - 0.5));

    const playAudio = () => {
        // Use TTS to read the question text
        speak(question.promptText);
    };

    const handleHint = () => {
        setHintUsed(true);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && over.id === 'drop-zone') {
            const droppedAnswer = active.id as string;
            setDroppedItem(droppedAnswer);

            const responseTime = (Date.now() - startTime) / 1000;
            const correct = droppedAnswer === question.correctAnswer;

            setIsCorrect(correct);
            setShowFeedback(true);

            // Play feedback sound using Web Audio API
            if (correct) {
                playCorrectSound();
            } else {
                playIncorrectSound();
            }

            setTimeout(() => {
                onAnswer(correct, responseTime, hintUsed);
            }, 2000);
        }
    };

    useEffect(() => {
        playAudio();
        return () => stop(); // Cleanup on unmount
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <GameContainer showSuccess={showFeedback && isCorrect}>
            {/* Question Section - Centered at Top */}
            <div className="w-full mb-8">
                <motion.div
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-center relative z-10"
                >
                    <h2 className="text-5xl md:text-6xl font-bold text-blue-800 mb-6">{question?.promptText}</h2>
                    <motion.button
                        onClick={playAudio}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        whileTap={{ scale: 0.95 }}
                        className="bg-white hover:bg-blue-50 text-blue-600 rounded-full p-5 shadow-xl transition-all"
                    >
                        <Volume2 className="w-10 h-10" />
                    </motion.button>
                </motion.div>
            </div>

            <DndContext onDragEnd={handleDragEnd}>
                {/* Drop Zone - Centered */}
                <div className="mb-10 w-full flex justify-center">
                    <div className="w-full max-w-2xl">
                        <p className="text-3xl font-bold text-blue-800 mb-5 text-center">Drag here:</p>
                        <DroppableZone id="drop-zone">
                            {droppedItem ? (
                                <div
                                    className={`
                      text-7xl font-bold text-center p-10 rounded-2xl
                      ${isCorrect ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}
                    `}
                                >
                                    {droppedItem}
                                    {showFeedback && (
                                        <div className="text-9xl mt-6">{isCorrect ? '✓' : '✗'}</div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-gray-400 text-center text-3xl py-8">Drop answer here</div>
                            )}
                        </DroppableZone>
                    </div>
                </div>

                {/* Draggable Options - Full Width Grid */}
                {!droppedItem && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-8 max-w-6xl w-full mx-auto">
                        {shuffledOptions.map((option, index) => (
                            <motion.div
                                key={option}
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <DraggableItem id={option}>
                                    <div className="bg-gradient-to-br from-white to-blue-50 hover:from-blue-50 hover:to-blue-100 rounded-3xl p-8 text-6xl md:text-7xl font-bold text-center shadow-xl min-h-[180px] flex items-center justify-center transition-all border-4 border-blue-200 hover:border-blue-400">
                                        {option}
                                    </div>
                                </DraggableItem>
                            </motion.div>
                        ))}
                    </div>
                )}
            </DndContext>

            {showHint && !hintUsed && !droppedItem && (
                <motion.button
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleHint}
                    className="mt-10 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-yellow-900 font-bold py-5 px-10 rounded-full shadow-lg flex items-center gap-3 text-xl"
                >
                    <Lightbulb className="w-7 h-7" />
                    The answer is: {hintUsed && question.correctAnswer}
                </motion.button>
            )}
        </GameContainer>
    );
}

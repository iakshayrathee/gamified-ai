// Placeholder game templates - simplified implementations

'use client';
import { BaseGameProps } from '@/lib/types/game.types';
import { useState } from 'react';
import { motion } from 'framer-motion';

export function SortingGame({ question, onAnswer }: BaseGameProps) {
    const [startTime] = useState(Date.now());
    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-100 to-blue-100 p-6">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-center">
                <h2 className="text-5xl font-bold text-green-800 mb-8">{question.promptText}</h2>
                <button
                    onClick={() => onAnswer(true, (Date.now() - startTime) / 1000, false)}
                    className="bg-green-500 text-white px-12 py-6 rounded-full text-3xl font-bold hover:bg-green-600"
                >
                    Sort Items
                </button>
            </motion.div>
        </div>
    );
}

export function PictureToWordGame({ question, onAnswer }: BaseGameProps) {
    const [startTime] = useState(Date.now());
    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-yellow-100 to-orange-100 p-6">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-center">
                <h2 className="text-5xl font-bold text-orange-800 mb-8">{question.promptText}</h2>
                <button
                    onClick={() => onAnswer(true, (Date.now() - startTime) / 1000, false)}
                    className="bg-orange-500 text-white px-12 py-6 rounded-full text-3xl font-bold hover:bg-orange-600"
                >
                    Match Picture
                </button>
            </motion.div>
        </div>
    );
}

export function PuzzleJoinGame({ question, onAnswer }: BaseGameProps) {
    const [startTime] = useState(Date.now());
    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-100 to-pink-100 p-6">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-center">
                <h2 className="text-5xl font-bold text-red-800 mb-8">{question.promptText}</h2>
                <button
                    onClick={() => onAnswer(true, (Date.now() - startTime) / 1000, false)}
                    className="bg-red-500 text-white px-12 py-6 rounded-full text-3xl font-bold hover:bg-red-600"
                >
                    Join Puzzle
                </button>
            </motion.div>
        </div>
    );
}

export function FindTheWordGame({ question, onAnswer }: BaseGameProps) {
    const [startTime] = useState(Date.now());
    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-teal-100 to-cyan-100 p-6">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-center">
                <h2 className="text-5xl font-bold text-teal-800 mb-8">{question.promptText}</h2>
                <button
                    onClick={() => onAnswer(true, (Date.now() - startTime) / 1000, false)}
                    className="bg-teal-500 text-white px-12 py-6 rounded-full text-3xl font-bold hover:bg-teal-600"
                >
                    Find Word
                </button>
            </motion.div>
        </div>
    );
}

export function SequencingGame({ question, onAnswer }: BaseGameProps) {
    const [startTime] = useState(Date.now());
    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-violet-100 to-purple-100 p-6">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-center">
                <h2 className="text-5xl font-bold text-violet-800 mb-8">{question.promptText}</h2>
                <button
                    onClick={() => onAnswer(true, (Date.now() - startTime) / 1000, false)}
                    className="bg-violet-500 text-white px-12 py-6 rounded-full text-3xl font-bold hover:bg-violet-600"
                >
                    Arrange Order
                </button>
            </motion.div>
        </div>
    );
}

export function OddOneOutGame({ question, onAnswer }: BaseGameProps) {
    const [startTime] = useState(Date.now());
    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-amber-100 to-yellow-100 p-6">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-center">
                <h2 className="text-5xl font-bold text-amber-800 mb-8">{question.promptText}</h2>
                <button
                    onClick={() => onAnswer(true, (Date.now() - startTime) / 1000, false)}
                    className="bg-amber-500 text-white px-12 py-6 rounded-full text-3xl font-bold hover:bg-amber-600"
                >
                    Find Different
                </button>
            </motion.div>
        </div>
    );
}

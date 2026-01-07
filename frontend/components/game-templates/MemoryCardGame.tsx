'use client';

import { useState } from 'react';
import { BaseGameProps } from '@/lib/types/game.types';
import { motion } from 'framer-motion';
import GameContainer from './GameContainer';

export default function MemoryCardGame({ question, onAnswer, difficultyLevel, isRulesModalOpen }: BaseGameProps) {
    // Safety check
    if (!question || !question.correctAnswer || !question.distractors || question.distractors.length < 2) {
        return (
            <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-pink-100 to-purple-100 p-6">
                <div className="text-center">
                    <p className="text-2xl text-red-600">Error: Invalid question data</p>
                </div>
            </div>
        );
    }

    const [flipped, setFlipped] = useState<number[]>([]);
    const [matched, setMatched] = useState<number[]>([]);
    const [startTime] = useState(Date.now());
    const [gameComplete, setGameComplete] = useState(false);

    const pairs = [
        question.correctAnswer,
        question.correctAnswer,
        ...question.distractors.slice(0, 2),
        ...question.distractors.slice(0, 2),
    ];
    const [shuffled] = useState(() => pairs.sort(() => Math.random() - 0.5));

    const handleFlip = (index: number) => {
        if (flipped.length === 2 || flipped.includes(index) || matched.includes(index)) return;

        const newFlipped = [...flipped, index];
        setFlipped(newFlipped);

        if (newFlipped.length === 2) {
            const [first, second] = newFlipped;
            if (shuffled[first] === shuffled[second]) {
                const newMatched = [...matched, first, second];
                setMatched(newMatched);
                setFlipped([]);

                if (newMatched.length === shuffled.length) {
                    setGameComplete(true);
                    const responseTime = (Date.now() - startTime) / 1000;
                    onAnswer(true, responseTime, false);
                }
            } else {
                setTimeout(() => setFlipped([]), 1000);
            }
        }
    };

    return (
        <GameContainer showSuccess={gameComplete}>
            <h2 className="text-4xl font-bold text-purple-800 mb-8 relative z-10">Match the Pairs!</h2>
            <div className="grid grid-cols-4 gap-4 max-w-2xl relative z-10">
                {shuffled.map((item, index) => (
                    <motion.button
                        key={index}
                        onClick={() => handleFlip(index)}
                        className={`
                            w-24 h-32 rounded-xl text-4xl font-bold transition-all shadow-lg
                            flex items-center justify-center
                            ${flipped.includes(index) || matched.includes(index)
                                ? 'bg-gradient-to-br from-white to-purple-50'
                                : 'bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700'
                            }
                        `}
                        whileHover={{ scale: 1.05, y: -4 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        {(flipped.includes(index) || matched.includes(index)) && item}
                    </motion.button>
                ))}
            </div>
        </GameContainer>
    );
}

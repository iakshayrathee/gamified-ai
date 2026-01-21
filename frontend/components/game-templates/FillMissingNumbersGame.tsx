'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Sparkles, Eye, Volume2 } from 'lucide-react';
import { BaseGameProps } from '@/lib/types/game.types';
import { useSpeech } from '@/hooks/useSpeech';

export default function FillMissingNumbersGame({
    question,
    onAnswer,
    difficultyLevel,
    showHint: shouldShowHint,
    isRulesModalOpen,
}: BaseGameProps) {
    const { speak } = useSpeech();

    // Parse question data
    const sequence: number[] = question.assetUrls?.sequence || [];
    const gapPositions: number[] = question.assetUrls?.gapPositions || [];
    const availableNumbers: number[] = question.assetUrls?.availableNumbers || [];
    const correctAnswers = question.correctAnswer.split(',').map(Number);

    const [selectedNumbers, setSelectedNumbers] = useState<{ [key: number]: number | null }>({});
    const [usedNumbers, setUsedNumbers] = useState<Set<number>>(new Set());
    const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
    const [scanningPosition, setScanningPosition] = useState<number | null>(null);
    const [startTime] = useState(Date.now());

    // Speak instructions on mount
    useEffect(() => {
        if (!isRulesModalOpen) {
            speak(question.promptText);
        }
    }, [isRulesModalOpen]);

    const handleNumberSelect = (gapPosition: number, number: number) => {
        if (feedback) return;

        // If this gap already has a number, remove it from used set
        const previousNumber = selectedNumbers[gapPosition];
        if (previousNumber !== null && previousNumber !== undefined) {
            const newUsed = new Set(usedNumbers);
            newUsed.delete(previousNumber);
            setUsedNumbers(newUsed);
        }

        // Add new number
        setSelectedNumbers(prev => ({ ...prev, [gapPosition]: number }));
        setUsedNumbers(prev => new Set([...prev, number]));
    };

    const handleRemoveNumber = (gapPosition: number) => {
        const number = selectedNumbers[gapPosition];
        if (number !== null && number !== undefined) {
            setSelectedNumbers(prev => ({ ...prev, [gapPosition]: null }));
            const newUsed = new Set(usedNumbers);
            newUsed.delete(number);
            setUsedNumbers(newUsed);
        }
    };

    const handleCheck = () => {
        // Check if all gaps are filled correctly
        const allCorrect = gapPositions.every((pos, idx) => {
            return selectedNumbers[pos] === correctAnswers[idx];
        });

        const timeSeconds = (Date.now() - startTime) / 1000;
        onAnswer(allCorrect, timeSeconds, false);
    };

    const handleScan = () => {
        // Animate scanning beam across the sequence
        let position = 0;
        const interval = setInterval(() => {
            setScanningPosition(position);
            position++;
            if (position >= sequence.length) {
                clearInterval(interval);
                setTimeout(() => setScanningPosition(null), 500);
            }
        }, 200);
    };

    const playNumberAudio = (num: number) => {
        speak(num.toString());
    };

    const allFilled = gapPositions.every(pos => selectedNumbers[pos] !== null && selectedNumbers[pos] !== undefined);

    return (
        <div className="w-full h-full flex items-center justify-center p-4">
            <div className="w-full max-w-5xl">
                {/* Header */}
                <motion.div
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-center mb-6"
                >
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                        🔍 What Comes Next?
                    </h2>
                </motion.div>

                {/* Number Sequence with Gaps */}
                <div className="mb-4 bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-3xl shadow-xl">
                    <div className="flex items-center justify-center gap-3 flex-wrap">
                        {sequence.map((num, index) => {
                            const isGap = gapPositions.includes(index);
                            const selectedNum = selectedNumbers[index];
                            const isScanning = scanningPosition === index;
                            const isCorrectGap = isGap && selectedNum === num;
                            const isWrongGap = isGap && selectedNum !== null && selectedNum !== num;

                            return (
                                <motion.div
                                    key={index}
                                    initial={{ scale: 0, y: 50 }}
                                    animate={{ scale: 1, y: 0 }}
                                    transition={{ delay: index * 0.05, type: 'spring' }}
                                    className="relative"
                                >
                                    {isGap ? (
                                        <motion.div
                                            whileHover={{ scale: 1.05 }}
                                            className={`
                                            w-24 h-28 flex items-center justify-center rounded-2xl
                                            border-4 border-dashed shadow-xl transition-all duration-300 cursor-pointer
                                            ${selectedNum ? 'bg-white border-purple-400' : 'bg-yellow-100 border-yellow-400'}
                                            ${isScanning ? 'ring-4 ring-blue-400 ring-offset-4' : ''}
                                            ${feedback === 'correct' && isCorrectGap ? 'border-green-500 bg-green-100' : ''}
                                            ${feedback === 'incorrect' && isWrongGap ? 'border-red-500 bg-red-100 animate-shake' : ''}
                                        `}
                                            onClick={() => selectedNum && handleRemoveNumber(index)}
                                        >
                                            {selectedNum ? (
                                                <span className="text-4xl font-bold text-purple-600">{selectedNum}</span>
                                            ) : (
                                                <span className="text-5xl text-yellow-500">?</span>
                                            )}
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            whileHover={{ scale: 1.1, rotate: 5 }}
                                            className={`
                                            relative group w-24 h-28 flex items-center justify-center
                                            bg-gradient-to-br from-indigo-400 to-purple-600 text-white
                                            text-4xl font-bold rounded-2xl shadow-xl border-4 border-indigo-300
                                            ${isScanning ? 'ring-4 ring-blue-400 ring-offset-4' : ''}
                                        `}
                                        >
                                            {num}
                                            <button
                                                onClick={() => playNumberAudio(num)}
                                                className="absolute -top-2 -right-2 bg-pink-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-pink-600"
                                            >
                                                <Volume2 className="w-4 h-4" />
                                            </button>
                                        </motion.div>
                                    )}

                                    {/* Arrow between numbers */}
                                    {index < sequence.length - 1 && (
                                        <div className="absolute top-1/2 -right-4 transform -translate-y-1/2 text-3xl text-purple-400">
                                            →
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                {/* Available Numbers */}
                <div className="mb-6">
                    <div className="flex items-center justify-center gap-4 flex-wrap">
                        {availableNumbers.map((num, idx) => {
                            const isUsed = usedNumbers.has(num);
                            return (
                                <motion.button
                                    key={idx}
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ delay: idx * 0.05, type: 'spring' }}
                                    whileHover={!isUsed && !feedback ? { scale: 1.1, y: -5 } : {}}
                                    whileTap={!isUsed && !feedback ? { scale: 0.95 } : {}}
                                    onClick={() => {
                                        if (!isUsed && !feedback) {
                                            const firstEmptyGap = gapPositions.find(pos =>
                                                selectedNumbers[pos] === null || selectedNumbers[pos] === undefined
                                            );
                                            if (firstEmptyGap !== undefined) {
                                                handleNumberSelect(firstEmptyGap, num);
                                            }
                                        }
                                    }}
                                    disabled={isUsed || !!feedback}
                                    className={`
                                    w-20 h-20 text-3xl font-bold rounded-2xl shadow-lg
                                    transition-all duration-300 border-4
                                    ${isUsed
                                            ? 'bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed opacity-50'
                                            : 'bg-gradient-to-br from-orange-400 to-pink-500 text-white border-orange-300 hover:shadow-2xl cursor-pointer'
                                        }
                                `}
                                >
                                    {num}
                                </motion.button>
                            );
                        })}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-center gap-6 mb-6">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleScan}
                        disabled={!!feedback}
                        className="px-8 py-4 bg-gradient-to-r from-blue-400 to-cyan-500 text-white rounded-full text-xl font-bold shadow-xl hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <Eye className="w-6 h-6" />
                        Scan Sequence
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleCheck}
                        disabled={!allFilled || !!feedback}
                        className="px-12 py-4 bg-gradient-to-r from-green-400 to-emerald-500 text-white rounded-full text-xl font-bold shadow-xl hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <CheckCircle2 className="w-6 h-6" />
                        Check Answers!
                    </motion.button>
                </div>
            </div>
        </div>
    );
}

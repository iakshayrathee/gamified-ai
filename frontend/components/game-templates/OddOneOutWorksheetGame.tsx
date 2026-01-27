'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Check } from 'lucide-react';
import { BaseGameProps } from '@/lib/types/game.types';

interface OddOneOutRow {
    items: {
        id: string;
        value: string;
        isOdd: boolean;
    }[];
}

export default function OddOneOutWorksheetGame({
    question,
    onAnswer,
}: BaseGameProps) {
    const rows: OddOneOutRow[] = question.assetUrls?.rows || [];
    const [selections, setSelections] = useState<Record<number, string>>({}); // rowIndex -> itemId
    const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
    const [startTime] = useState(Date.now());

    const handleSelect = (rowIndex: number, itemId: string) => {
        if (feedback) return;
        setSelections(prev => ({ ...prev, [rowIndex]: itemId }));
    };

    const checkAnswers = () => {
        if (Object.keys(selections).length < rows.length) return;

        const allCorrect = rows.every((row, idx) => {
            const selectedItem = row.items.find(item => item.id === selections[idx]);
            return selectedItem?.isOdd === true;
        });

        setFeedback(allCorrect ? 'correct' : 'incorrect');
        const timeSeconds = (Date.now() - startTime) / 1000;

        if (allCorrect) {
            setTimeout(() => onAnswer(true, timeSeconds, false), 1500);
        } else {
            setTimeout(() => {
                setFeedback(null);
            }, 2000);
        }
    };

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-5xl bg-white/95 backdrop-blur-md rounded-[3rem] p-8 shadow-2xl border-4 border-white/50 flex flex-col max-h-[85vh]">

                <div className="text-center mb-6">
                    <h2 className="text-4xl md:text-5xl font-black text-purple-900 mb-1 leading-tight">{question.promptText}</h2>
                    <p className="text-purple-700 font-bold text-lg">Select the shape that is different in each row</p>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar px-6 space-y-6">
                    {rows.map((row, rowIndex) => (
                        <div key={rowIndex} className="relative p-6 bg-purple-50/50 rounded-[2.5rem] border-2 border-purple-100/50">
                            <div className="absolute top-2 left-6 text-purple-300 text-xs font-black uppercase">Row {rowIndex + 1}</div>
                            <div className="flex gap-4 md:gap-8 justify-around pt-4">
                                {row.items.map((item) => {
                                    const isSelected = selections[rowIndex] === item.id;
                                    return (
                                        <motion.button
                                            key={item.id}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => handleSelect(rowIndex, item.id)}
                                            className={`
                                                relative p-3 rounded-[2rem] border-4 transition-all w-24 h-24 md:w-28 md:h-28 flex items-center justify-center
                                                ${isSelected
                                                    ? 'bg-purple-600 border-purple-400 shadow-lg scale-105'
                                                    : 'bg-white border-white/80 shadow-md hover:border-purple-200'}
                                            `}
                                        >
                                            <img
                                                src={item.value}
                                                alt="shape"
                                                className={`w-16 h-16 md:w-20 md:h-20 object-contain drop-shadow-md ${isSelected ? 'brightness-200' : ''}`}
                                            />
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Bottom UI - Consistent with Matching */}
                <div className="flex flex-col items-center mt-8 gap-4">
                    <div className="text-xl font-bold text-gray-700">
                        Completed: <span className="text-purple-600 font-black">{Object.keys(selections).length}</span> / {rows.length}
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={checkAnswers}
                        disabled={Object.keys(selections).length < rows.length || !!feedback}
                        className={`
                            px-16 py-4 rounded-full font-black text-2xl shadow-xl transition-all flex items-center gap-3
                            ${Object.keys(selections).length === rows.length
                                ? 'bg-[#00C985] text-white hover:bg-[#00B075]'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
                        `}
                    >
                        <Check className="w-8 h-8 stroke-[4px]" />
                        Check Answer
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

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(0, 0, 0, 0.05);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(0, 0, 0, 0.1);
                    border-radius: 10px;
                }
            `}</style>
        </div>
    );
}

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Check } from 'lucide-react';
import { BaseGameProps } from '@/lib/types/game.types';

export default function WorksheetQuizGame({
    question,
    onAnswer,
}: BaseGameProps) {
    const options = [question.correctAnswer, ...(question.distractors || [])].sort();
    const [selected, setSelected] = useState<string | null>(null);
    const [startTime] = useState(Date.now());
    const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);

    const handleSelect = (option: string) => {
        if (selected || feedback) return;
        setSelected(option);

        const isCorrect = option === question.correctAnswer;
        const timeSeconds = (Date.now() - startTime) / 1000;

        setFeedback(isCorrect ? 'correct' : 'incorrect');

        setTimeout(() => {
            onAnswer(isCorrect, timeSeconds, false);
        }, 1500);
    };

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-4 text-purple-900">
            <div className="w-full max-w-4xl bg-white/95 backdrop-blur-md rounded-[3rem] p-10 shadow-2xl border-4 border-white/50 flex flex-col max-h-[85vh]">

                <div className="text-center mb-8">
                    <h2 className="text-4xl md:text-5xl font-black mb-3 drop-shadow-sm leading-tight">
                        {question.promptText}
                    </h2>
                    <div className="h-1.5 w-24 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full mx-auto opacity-60" />
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar px-2 px-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                        {options.map((option, index) => {
                            const letter = String.fromCharCode(97 + index); // a, b, c, d, e
                            const isSelected = selected === option;
                            const isCorrect = option === question.correctAnswer;

                            let cardStyle = "bg-white border-white/60 text-purple-900 hover:bg-purple-50 hover:border-purple-300 shadow-md";
                            if (isSelected) {
                                cardStyle = isCorrect
                                    ? "bg-emerald-500 border-emerald-400 text-white shadow-emerald-500/30 scale-105"
                                    : "bg-red-500 border-red-400 text-white shadow-red-500/30 scale-105";
                            }

                            return (
                                <motion.button
                                    key={option}
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: index * 0.08, type: 'spring' }}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleSelect(option)}
                                    className={`
                                        relative flex items-center p-6 rounded-[2.5rem] border-4 transition-all text-left
                                        ${cardStyle}
                                    `}
                                >
                                    <span className={`
                                        w-12 h-12 rounded-2xl flex items-center justify-center font-black text-2xl mr-6 shadow-inner transition-all
                                        ${isSelected ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-600'}
                                    `}>
                                        {letter}
                                    </span>
                                    <span className="text-2xl font-bold tracking-tight">
                                        {option}
                                    </span>
                                </motion.button>
                            );
                        })}
                    </div>
                </div>

                {/* Bottom Status - Mockup Consistency */}
                <div className="flex flex-col items-center mt-10">
                    <div className={`px-10 py-4 rounded-full font-black text-2xl flex items-center gap-3 transition-all ${selected ? 'bg-[#00C985] text-white shadow-xl' : 'bg-gray-100 text-gray-400'}`}>
                        {selected ? (
                            <>
                                <Check className="w-8 h-8 stroke-[4px]" />
                                Option Selected
                            </>
                        ) : (
                            "Select an Option"
                        )}
                    </div>
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

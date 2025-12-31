'use client';

import { useState, useEffect } from 'react';
import { BaseGameProps } from '@/lib/types/game.types';
import { motion } from 'framer-motion';
import { Volume2 } from 'lucide-react';
import GameContainer from './GameContainer';
import ShakeAnimation from '@/components/ui/ShakeAnimation';
import { useSpeech } from '@/hooks/useSpeech';
import { playCorrectSound, playIncorrectSound } from '@/lib/audioFeedback';

export default function AudioToLetterGame({
    question,
    onAnswer,
    difficultyLevel,
    showHint,
}: BaseGameProps) {
    // Safety check
    if (!question || !question.correctAnswer || !question.distractors) {
        return (
            <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 p-6">
                <div className="text-center">
                    <p className="text-2xl text-red-600">Error: Invalid question data</p>
                </div>
            </div>
        );
    }

    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [startTime] = useState(Date.now());
    const [hintUsed, setHintUsed] = useState(false);
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

    const handleSelect = (answer: string) => {
        if (selectedAnswer) return;

        setSelectedAnswer(answer);
        const responseTime = (Date.now() - startTime) / 1000;
        const correct = answer === question.correctAnswer;

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
    };

    useEffect(() => {
        playAudio();
        return () => stop(); // Cleanup on unmount
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <GameContainer showSuccess={showFeedback && isCorrect}>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="mb-12 text-center relative z-10">
                <h2 className="text-3xl md:text-4xl font-bold text-indigo-800 mb-6">Listen and Select the Letter</h2>
                <motion.button
                    onClick={playAudio}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-full p-8 shadow-2xl transition-all"
                >
                    <Volume2 className="w-16 h-16" />
                </motion.button>
                <p className="mt-4 text-xl text-indigo-600">Tap the speaker to hear the sound again</p>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-4xl w-full relative z-10">
                {shuffledOptions.map((option, index) => {
                    const isSelected = selectedAnswer === option;
                    const showAsCorrect = isSelected && isCorrect && showFeedback;
                    const showAsWrong = isSelected && !isCorrect && showFeedback;

                    return (
                        <ShakeAnimation
                            key={`shake-${option}`}
                            trigger={showAsWrong}
                            intensity="medium"
                        >
                            <motion.button
                                key={option}
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: index * 0.1 + 0.5 }}
                                whileHover={{ scale: selectedAnswer === null ? 1.05 : 1, y: selectedAnswer === null ? -4 : 0 }}
                                whileTap={{ scale: selectedAnswer === null ? 0.98 : 1 }}
                                onClick={() => handleSelect(option)}
                                disabled={selectedAnswer !== null}
                                className={`
                                    min-h-[140px] w-full rounded-3xl p-6 text-6xl font-bold transition-all shadow-xl
                                    flex items-center justify-center
                                    ${selectedAnswer === null
                                        ? 'bg-gradient-to-br from-white to-indigo-50 hover:from-indigo-50 hover:to-indigo-100 cursor-pointer'
                                        : showAsCorrect
                                            ? 'bg-gradient-to-br from-green-400 to-green-600 text-white scale-105'
                                            : showAsWrong
                                                ? 'bg-gradient-to-br from-red-400 to-red-600 text-white'
                                                : 'bg-gray-200 opacity-50'
                                    }
                                `}
                            >
                                {option}
                            </motion.button>
                        </ShakeAnimation>
                    );
                })}
            </div>
        </GameContainer>
    );
}

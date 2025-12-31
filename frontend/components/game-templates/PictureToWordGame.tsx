'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Volume2, Sparkles } from 'lucide-react';
import GameContainer from './GameContainer';
import ShakeAnimation from '@/components/ui/ShakeAnimation';
import { useSpeech } from '@/hooks/useSpeech';

interface PictureOption {
    id: string;
    imageUrl: string;
    word: string;
    audioUrl?: string;
}

interface PictureToWordGameProps {
    question: {
        imageUrl: string;
        correctWord: string;
        audioUrl?: string;
    };
    options: PictureOption[];
    onComplete: (correct: boolean, timeSeconds: number) => void;
    onHintRequest?: () => void;
}

export default function PictureToWordGame({ question, options, onComplete, onHintRequest }: PictureToWordGameProps) {
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
    const [startTime] = useState(Date.now());
    const [showHint, setShowHint] = useState(false);

    // Initialize TTS
    const { speak } = useSpeech();

    const playAudio = (text?: string) => {
        // Use TTS to read the word
        if (text) {
            speak(text);
        }
    };

    const handleOptionClick = (optionId: string, word: string) => {
        if (feedback) return;

        setSelectedOption(optionId);
        const isCorrect = word === question?.correctWord;
        const timeSeconds = (Date.now() - startTime) / 1000;

        setFeedback(isCorrect ? 'correct' : 'incorrect');

        setTimeout(() => {
            onComplete(isCorrect, timeSeconds);
        }, 2000);
    };

    const handleHint = () => {
        setShowHint(true);
        playAudio(question?.correctWord);
        onHintRequest?.();
        setTimeout(() => setShowHint(false), 3000);
    };

    // Safety check
    if (!question || !options || options.length === 0) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100 p-6">
                <div className="text-center">
                    <p className="text-2xl text-red-600">Error: Invalid question data</p>
                </div>
            </div>
        );
    }

    return (
        <GameContainer showSuccess={feedback === 'correct'}>
            <div className="w-full max-w-5xl mx-auto relative z-10">
                {/* Instructions */}
                <div className="text-center mb-8">
                    <h2 className="text-4xl font-bold text-purple-600 mb-4">Match the Picture!</h2>
                    <p className="text-2xl text-gray-700">Tap the word that matches the picture</p>
                </div>

                {/* Main Picture */}
                <div className="flex justify-center mb-12">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="relative"
                    >
                        <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-3xl p-8 shadow-2xl">
                            <img
                                src={question?.imageUrl || ''}
                                alt="Question"
                                className="w-64 h-64 object-contain"
                            />
                        </div>

                        {/* Audio Button */}
                        <motion.button
                            onClick={() => playAudio(question?.correctWord)}
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            whileTap={{ scale: 0.95 }}
                            className="absolute -top-4 -right-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-full shadow-lg transition-all"
                        >
                            <Volume2 className="w-8 h-8" />
                        </motion.button>
                    </motion.div>
                </div>

                {/* Word Options */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8">
                    {options?.map((option, index) => {
                        const isSelected = selectedOption === option.id;
                        const isCorrect = option.word === question?.correctWord;
                        const shouldHighlight = showHint && isCorrect;
                        const showAsCorrect = isSelected && feedback === 'correct';
                        const showAsWrong = isSelected && feedback === 'incorrect';

                        return (
                            <ShakeAnimation
                                key={`shake-${option.id}`}
                                trigger={showAsWrong}
                                intensity="medium"
                            >
                                <motion.button
                                    key={option.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    whileHover={{ scale: !feedback ? 1.05 : 1, y: !feedback ? -4 : 0 }}
                                    whileTap={{ scale: !feedback ? 0.98 : 1 }}
                                    onClick={() => handleOptionClick(option.id, option.word)}
                                    disabled={!!feedback}
                                    className={`
                                        relative p-6 rounded-2xl text-2xl font-bold min-h-[140px]
                                        transition-all duration-300 transform w-full flex flex-col items-center justify-center
                                        ${showAsCorrect && 'bg-gradient-to-br from-green-400 to-green-600 text-white scale-110'}
                                        ${showAsWrong && 'bg-gradient-to-br from-red-400 to-red-600 text-white'}
                                        ${!isSelected && !feedback && 'bg-gradient-to-br from-white to-purple-50 text-purple-600 shadow-lg border-4 border-purple-300 hover:from-purple-50 hover:to-purple-100'}
                                        ${!isSelected && feedback && 'opacity-50'}
                                        ${shouldHighlight && 'ring-4 ring-yellow-400 ring-offset-4'}
                                    `}
                                >
                                    {/* Option Image */}
                                    {option.imageUrl && (
                                        <img
                                            src={option.imageUrl}
                                            alt={option.word}
                                            className="w-24 h-24 object-contain mx-auto mb-3"
                                        />
                                    )}

                                    {/* Word */}
                                    <div className="text-center">
                                        {option.word}
                                    </div>

                                    {/* Audio Icon */}
                                    {!feedback && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                playAudio(option.word);
                                            }}
                                            className="absolute top-2 right-2 bg-blue-400 text-white p-2 rounded-full hover:bg-blue-500"
                                        >
                                            <Volume2 className="w-4 h-4" />
                                        </button>
                                    )}

                                    {/* Feedback Icons */}
                                    {showAsCorrect && (
                                        <motion.div
                                            initial={{ scale: 0, rotate: -180 }}
                                            animate={{ scale: 1, rotate: 0 }}
                                            transition={{ type: "spring" }}
                                        >
                                            <CheckCircle2 className="absolute top-2 left-2 w-8 h-8 text-white" />
                                        </motion.div>
                                    )}
                                    {showAsWrong && (
                                        <motion.div
                                            initial={{ scale: 0, rotate: 180 }}
                                            animate={{ scale: 1, rotate: 0 }}
                                            transition={{ type: "spring" }}
                                        >
                                            <XCircle className="absolute top-2 left-2 w-8 h-8 text-white" />
                                        </motion.div>
                                    )}
                                </motion.button>
                            </ShakeAnimation>
                        );
                    })}
                </div>

                {/* Hint Button */}
                {!feedback && (
                    <div className="flex justify-center">
                        <motion.button
                            onClick={handleHint}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-8 py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-full text-xl font-bold shadow-lg transition-all"
                        >
                            💡 Hint
                        </motion.button>
                    </div>
                )}
            </div>
        </GameContainer>
    );
}

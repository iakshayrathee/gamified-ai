'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Volume2 } from 'lucide-react';
import GameContainer from './GameContainer';
import ShakeAnimation from '@/components/ui/ShakeAnimation';
import { useSpeech } from '@/hooks/useSpeech';

import { BaseGameProps } from '@/lib/types/game.types';

export default function FindTheWordGame({
    question,
    onAnswer,
    difficultyLevel,
    showHint: shouldShowHint,
    isRulesModalOpen,
}: BaseGameProps) {
    const sentence: string = question.promptText;
    const targetWord: string = question.correctAnswer;
    const audioUrl: string = question.promptAudioUrl || '';
    const imageUrl: string = question.assetUrls?.imageUrl || '';
    const onComplete = (correct: boolean, timeSeconds: number) => onAnswer(correct, timeSeconds, false);

    const words = (sentence || '').split(' ').filter(word => word.trim() !== '');
    const [selectedWord, setSelectedWord] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
    const [startTime] = useState(Date.now());
    const [showHint, setShowHint] = useState(false);

    // Initialize TTS
    const { speak } = useSpeech();

    const playAudio = () => {
        // Use TTS to read the target word
        speak(`Find the word: ${targetWord}`);
    };

    const handleWordClick = (word: string) => {
        if (feedback) return;

        setSelectedWord(word);
        const cleanWord = word.replace(/[.,!?]/g, '').toLowerCase();
        const isCorrect = cleanWord === targetWord.toLowerCase();
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
        playAudio();
        setTimeout(() => setShowHint(false), 3000);
    };

    if (!sentence || !targetWord || words.length === 0) {
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
                    <h2 className="text-4xl font-bold text-purple-600 mb-4">Find the Word!</h2>
                    <p className="text-2xl text-gray-700">Tap the word: <span className="font-bold text-purple-600">{targetWord}</span></p>
                </div>

                {/* Image (if provided) */}
                {imageUrl && (
                    <div className="flex justify-center mb-8">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl p-6 shadow-xl"
                        >
                            <img
                                src={imageUrl}
                                alt={targetWord}
                                className="w-48 h-48 object-contain"
                            />
                        </motion.div>
                    </div>
                )}

                {/* Sentence with Tappable Words */}
                <div className="bg-white rounded-3xl p-12 shadow-2xl mb-8">
                    <div className="flex flex-wrap justify-center gap-4 text-4xl font-medium leading-relaxed">
                        {words.map((word, index) => {
                            const cleanWord = word.replace(/[.,!?]/g, '').toLowerCase();
                            const isSelected = selectedWord === word;
                            const isTarget = cleanWord === targetWord.toLowerCase();
                            const shouldHighlight = showHint && isTarget;
                            const showAsCorrect = isSelected && feedback === 'correct';
                            const showAsWrong = isSelected && feedback === 'incorrect';

                            return (
                                <ShakeAnimation
                                    key={`shake-${index}`}
                                    trigger={showAsWrong}
                                    intensity="medium"
                                >
                                    <motion.button
                                        key={index}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        whileHover={{ scale: !feedback ? 1.1 : 1, y: !feedback ? -4 : 0 }}
                                        whileTap={{ scale: !feedback ? 0.95 : 1 }}
                                        onClick={() => handleWordClick(word)}
                                        disabled={!!feedback}
                                        className={`
                                            px-6 py-3 rounded-2xl transition-all duration-300 relative
                                            ${showAsCorrect && 'bg-gradient-to-br from-green-400 to-green-600 text-white scale-110 shadow-2xl'}
                                            ${showAsWrong && 'bg-gradient-to-br from-red-400 to-red-600 text-white'}
                                            ${!isSelected && !feedback && 'bg-gradient-to-br from-purple-100 to-purple-200 text-purple-700 hover:from-purple-200 hover:to-purple-300'}
                                            ${!isSelected && feedback && 'opacity-40'}
                                            ${shouldHighlight && 'ring-4 ring-yellow-400 ring-offset-4 bg-gradient-to-br from-yellow-100 to-yellow-200'}
                                        `}
                                    >
                                        {word}

                                        {/* Feedback Icons */}
                                        {showAsCorrect && (
                                            <motion.div
                                                initial={{ scale: 0, rotate: -180 }}
                                                animate={{ scale: 1, rotate: 0 }}
                                                className="inline-block ml-2"
                                            >
                                                <CheckCircle2 className="w-8 h-8" />
                                            </motion.div>
                                        )}
                                        {showAsWrong && (
                                            <motion.div
                                                initial={{ scale: 0, rotate: 180 }}
                                                animate={{ scale: 1, rotate: 0 }}
                                                className="inline-block ml-2"
                                            >
                                                <XCircle className="w-8 h-8" />
                                            </motion.div>
                                        )}
                                    </motion.button>
                                </ShakeAnimation>
                            );
                        })}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-center gap-4">
                    {audioUrl && !feedback && (
                        <motion.button
                            onClick={playAudio}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full text-xl font-bold shadow-lg transition-all flex items-center gap-2"
                        >
                            <Volume2 className="w-6 h-6" />
                            Listen
                        </motion.button>
                    )}

                    {!feedback && (
                        <motion.button
                            onClick={handleHint}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-8 py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-full text-xl font-bold shadow-lg transition-all"
                        >
                            💡 Hint
                        </motion.button>
                    )}
                </div>
            </div>
        </GameContainer>
    );
}

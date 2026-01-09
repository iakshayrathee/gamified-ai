'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, XCircle } from 'lucide-react';
import { useSpeech } from '@/hooks/useSpeech';
import { BaseGameProps } from '@/lib/types/game.types';
import { CardContainer, CardBody, CardItem } from '@/components/ui/3d-card';

export default function RecallGame({
    question,
    onAnswer,
    isRulesModalOpen,
}: BaseGameProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [allWords, setAllWords] = useState<string[]>([]);
    const [currentWord, setCurrentWord] = useState<string>('');

    const { speak, stop } = useSpeech();

    // Initialize words from question data
    useEffect(() => {
        if (question?.assetUrls && typeof question.assetUrls === 'object') {
            const assetData = question.assetUrls as any;

            // Get list words from assetUrls
            if (assetData.listWords && Array.isArray(assetData.listWords)) {
                setAllWords(assetData.listWords);
                setCurrentIndex(0);
                setCurrentWord(assetData.listWords[0] || '');
            }
        }

        stop();
    }, [question?.id, stop]);

    // Update current word when index changes
    useEffect(() => {
        if (allWords.length > 0) {
            setCurrentWord(allWords[currentIndex]);
        }
    }, [currentIndex, allWords]);

    // Auto-play word audio when it changes
    useEffect(() => {
        if (!isRulesModalOpen && currentWord) {
            const timer = setTimeout(() => {
                speak(currentWord);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [currentWord, isRulesModalOpen, speak]);

    const handleNext = () => {
        if (currentIndex < allWords.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            // Reached end of list - redirect to Reading Foundation domain page
            window.location.href = getDomainPageUrl();
        }
    };

    const handlePrevious = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    };

    const handleReplayAudio = () => {
        if (currentWord) {
            speak(currentWord);
        }
    };

    // Get domain ID from URL
    const getDomainPageUrl = () => {
        if (typeof window !== 'undefined') {
            const pathParts = window.location.pathname.split('/');
            const domainIndex = pathParts.indexOf('domains');
            if (domainIndex !== -1 && pathParts[domainIndex + 1]) {
                return `/child/domains/${pathParts[domainIndex + 1]}`;
            }
        }
        return '/child/domains';
    };

    // Safety check
    if (!question || allWords.length === 0) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100 p-6">
                <div className="text-center">
                    <p className="text-2xl text-red-600">Loading flashcards...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 rounded-3xl overflow-hidden p-8">
            {/* Exit Button */}
            <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute top-6 right-6 z-50 bg-white/50 backdrop-blur-sm p-3 rounded-full text-purple-800 hover:bg-red-100 hover:text-red-600 transition-colors shadow-sm"
                onClick={() => window.location.href = getDomainPageUrl()}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
            >
                <XCircle className="w-8 h-8" />
            </motion.button>

            {/* Progress Indicator */}
            <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg">
                <span className="text-lg font-bold text-purple-800">
                    {currentIndex + 1} / {allWords.length}
                </span>
            </div>

            {/* Main Content Area */}
            <div className="flex items-center justify-center gap-8 w-full max-w-7xl">
                {/* Previous Button */}
                <motion.button
                    onClick={handlePrevious}
                    disabled={currentIndex === 0}
                    whileHover={{ scale: currentIndex === 0 ? 1 : 1.1 }}
                    whileTap={{ scale: currentIndex === 0 ? 1 : 0.95 }}
                    className={`p-6 rounded-full shadow-2xl transition-all ${currentIndex === 0
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-white text-purple-600 hover:bg-purple-50'
                        }`}
                >
                    <ChevronLeft className="w-12 h-12" />
                </motion.button>

                {/* Flashcard */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIndex}
                        initial={{ scale: 0.8, rotateY: -90, opacity: 0 }}
                        animate={{ scale: 1, rotateY: 0, opacity: 1 }}
                        exit={{ scale: 0.8, rotateY: 90, opacity: 0 }}
                        transition={{
                            type: 'spring',
                            stiffness: 200,
                            damping: 20
                        }}
                        className="flex-shrink-0"
                    >
                        <CardContainer className="w-[576px] h-[432px]">
                            <CardBody className="relative w-full h-full">
                                <CardItem
                                    translateZ="100"
                                    className="w-full h-full"
                                >
                                    {/* Landscape Card: 3x4 ratio */}
                                    <div
                                        onClick={handleReplayAudio}
                                        className="w-full h-full bg-gradient-to-br from-white to-purple-50 rounded-3xl shadow-2xl border-4 border-purple-300 flex items-center justify-center p-12 cursor-pointer hover:shadow-3xl hover:border-purple-400 transition-all duration-300"
                                    >
                                        {/* Word - Large, centered */}
                                        <div className="text-9xl font-bold text-purple-800 text-center break-words leading-tight">
                                            {currentWord}
                                        </div>
                                    </div>
                                </CardItem>
                            </CardBody>
                        </CardContainer>
                    </motion.div>
                </AnimatePresence>

                {/* Next Button */}
                <motion.button
                    onClick={handleNext}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-6 rounded-full bg-white text-purple-600 hover:bg-purple-50 shadow-2xl transition-all"
                >
                    <ChevronRight className="w-12 h-12" />
                </motion.button>
            </div>

            {/* Instruction Text */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-sm px-8 py-4 rounded-full shadow-lg">
                <p className="text-xl font-semibold text-purple-800 text-center">
                    👆 Click card to hear the word • Use arrows to navigate
                </p>
            </div>
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Sparkles } from 'lucide-react';

interface SortingItem {
    id: string;
    label: string;
    imageUrl?: string;
    category: string;
}

interface SortingCategory {
    id: string;
    name: string;
    color: string;
}

interface SortingGameProps {
    items: SortingItem[];
    categories: SortingCategory[];
    onComplete: (correct: boolean, timeSeconds: number) => void;
    onHintRequest?: () => void;
}

export default function SortingGame({ items, categories, onComplete, onHintRequest }: SortingGameProps) {
    // Add null/undefined checks with default values
    const safeItems = items || [];
    const safeCategories = categories || [];
    const [unsortedItems, setUnsortedItems] = useState<SortingItem[]>(safeItems);
    const [sortedItems, setSortedItems] = useState<Record<string, SortingItem[]>>(
        Object.fromEntries(safeCategories.map(c => [c.id, []]))
    );
    const [draggedItem, setDraggedItem] = useState<SortingItem | null>(null);
    const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
    const [startTime] = useState(Date.now());
    const [showHint, setShowHint] = useState(false);

    const handleDragStart = (item: SortingItem) => {
        setDraggedItem(item);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (categoryId: string) => {
        if (!draggedItem) return;

        // Remove from unsorted
        setUnsortedItems(prev => prev.filter(i => i.id !== draggedItem.id));

        // Add to category
        setSortedItems(prev => ({
            ...prev,
            [categoryId]: [...prev[categoryId], draggedItem],
        }));

        setDraggedItem(null);
    };

    const handleItemClick = (item: SortingItem, fromCategory?: string) => {
        if (fromCategory) {
            // Move back to unsorted
            setSortedItems(prev => ({
                ...prev,
                [fromCategory]: prev[fromCategory].filter(i => i.id !== item.id),
            }));
            setUnsortedItems(prev => [...prev, item]);
        }
    };

    const handleSubmit = () => {
        // Check if all items are correctly sorted
        let allCorrect = true;
        let totalSorted = 0;

        for (const category of safeCategories) {
            const itemsInCategory = sortedItems[category.id];
            totalSorted += itemsInCategory.length;

            for (const item of itemsInCategory) {
                if (item.category !== category.id) {
                    allCorrect = false;
                    break;
                }
            }
        }

        // Check if all items are sorted
        if (totalSorted !== safeItems.length) {
            allCorrect = false;
        }

        const timeSeconds = (Date.now() - startTime) / 1000;
        setFeedback(allCorrect ? 'correct' : 'incorrect');

        setTimeout(() => {
            onComplete(allCorrect, timeSeconds);
        }, 2000);
    };

    const handleHint = () => {
        setShowHint(true);
        onHintRequest?.();
        setTimeout(() => setShowHint(false), 3000);
    };

    const allItemsSorted = unsortedItems.length === 0;

    // Safety check
    if (!safeItems || safeItems.length === 0 || !safeCategories || safeCategories.length === 0) {
        return (
            <div className="w-full max-w-6xl mx-auto p-8">
                <div className="text-center">
                    <p className="text-2xl text-red-600">Error: Invalid sorting game data</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-6xl mx-auto p-8">
            {/* Instructions */}
            <div className="text-center mb-8">
                <h2 className="text-4xl font-bold text-purple-600 mb-4">Sort the Items!</h2>
                <p className="text-2xl text-gray-700">Drag each item to the correct category</p>
            </div>

            {/* Unsorted Items */}
            {unsortedItems.length > 0 && (
                <div className="mb-8">
                    <h3 className="text-2xl font-semibold text-gray-700 mb-4">Items to Sort:</h3>
                    <div className="flex flex-wrap gap-4 justify-center p-6 bg-gray-100 rounded-2xl min-h-[120px]">
                        {unsortedItems.map((item) => (
                            <motion.div
                                key={item.id}
                                draggable
                                onDragStart={() => handleDragStart(item)}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className={`
                                    bg-white rounded-xl p-4 shadow-lg cursor-move
                                    border-4 border-purple-300 hover:border-purple-500
                                    transition-all duration-200
                                    ${showHint && item.category ? 'ring-4 ring-yellow-400' : ''}
                                `}
                            >
                                {item.imageUrl && (
                                    <img
                                        src={item.imageUrl}
                                        alt={item.label}
                                        className="w-20 h-20 object-contain mb-2"
                                    />
                                )}
                                <p className="text-xl font-semibold text-center">{item.label}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* Categories */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
                {safeCategories.map((category) => (
                    <div
                        key={category.id}
                        onDragOver={handleDragOver}
                        onDrop={() => handleDrop(category.id)}
                        className={`
                            rounded-2xl p-6 min-h-[250px]
                            border-4 border-dashed transition-all duration-200
                            ${draggedItem ? 'border-opacity-100 scale-105' : 'border-opacity-50'}
                        `}
                        style={{
                            borderColor: category.color,
                            backgroundColor: `${category.color}15`,
                        }}
                    >
                        <h3
                            className="text-2xl font-bold mb-4 text-center"
                            style={{ color: category.color }}
                        >
                            {category.name}
                        </h3>

                        <div className="space-y-3">
                            {sortedItems[category.id].map((item) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    onClick={() => handleItemClick(item, category.id)}
                                    className="bg-white rounded-lg p-3 shadow cursor-pointer hover:shadow-lg transition-shadow"
                                >
                                    {item.imageUrl && (
                                        <img
                                            src={item.imageUrl}
                                            alt={item.label}
                                            className="w-16 h-16 object-contain mx-auto mb-1"
                                        />
                                    )}
                                    <p className="text-lg font-medium text-center">{item.label}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center gap-4">
                <button
                    onClick={handleHint}
                    className="px-8 py-4 bg-yellow-500 text-white rounded-full text-xl font-bold hover:bg-yellow-600 transition-colors"
                >
                    💡 Hint
                </button>

                <button
                    onClick={handleSubmit}
                    disabled={!allItemsSorted}
                    className={`
                        px-12 py-4 rounded-full text-xl font-bold transition-all
                        ${allItemsSorted
                            ? 'bg-green-500 text-white hover:bg-green-600 hover:scale-105'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }
                    `}
                >
                    ✓ Check Answer
                </button>
            </div>

            {/* Feedback */}
            <AnimatePresence>
                {feedback && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
                    >
                        <motion.div
                            animate={{
                                rotate: feedback === 'correct' ? [0, 10, -10, 0] : 0,
                                scale: [1, 1.2, 1],
                            }}
                            transition={{ duration: 0.5 }}
                            className={`
                                p-12 rounded-3xl text-center
                                ${feedback === 'correct' ? 'bg-green-500' : 'bg-red-500'}
                            `}
                        >
                            {feedback === 'correct' ? (
                                <>
                                    <CheckCircle2 className="w-32 h-32 text-white mx-auto mb-4" />
                                    <p className="text-5xl font-bold text-white">Great Job!</p>
                                    <Sparkles className="w-16 h-16 text-yellow-300 mx-auto mt-4 animate-pulse" />
                                </>
                            ) : (
                                <>
                                    <XCircle className="w-32 h-32 text-white mx-auto mb-4" />
                                    <p className="text-5xl font-bold text-white">Try Again!</p>
                                </>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

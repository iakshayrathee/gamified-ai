'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, RefreshCw, Check } from 'lucide-react';
import { BaseGameProps } from '@/lib/types/game.types';

interface Pair {
    id: string;
    left: { type: 'image' | 'text'; value: string };
    right: { type: 'image' | 'text'; value: string };
}

interface Connection {
    fromId: string;
    toId: string;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
}

export default function ShapeMatchingGame({
    question,
    onAnswer,
}: BaseGameProps) {
    const pairs: Pair[] = question.assetUrls?.pairs || [];
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const [leftItems, setLeftItems] = useState<any[]>([]);
    const [rightItems, setRightItems] = useState<any[]>([]);
    const [connections, setConnections] = useState<Connection[]>([]);
    const [selectedSource, setSelectedSource] = useState<{ id: string; x: number; y: number } | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
    const [startTime] = useState(Date.now());

    // Shuffle and setup positions
    useEffect(() => {
        const lefts = pairs.map(p => ({ ...p.left, id: p.id }));
        const rights = [...pairs].map(p => ({ ...p.right, id: p.id })).sort(() => Math.random() - 0.5);
        setLeftItems(lefts);
        setRightItems(rights);
    }, [pairs, question.id]);

    // Canvas drawing
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resizeCanvas = () => {
            const container = containerRef.current;
            if (container) {
                canvas.width = container.scrollWidth;
                canvas.height = container.scrollHeight;
            }
        };
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.lineWidth = 10;
            ctx.lineCap = 'round';

            // Draw completed connections
            connections.forEach(conn => {
                ctx.beginPath();
                const gradient = ctx.createLinearGradient(conn.startX, conn.startY, conn.endX, conn.endY);
                gradient.addColorStop(0, '#8B5CF6'); // Purple
                gradient.addColorStop(1, '#EC4899'); // Pink
                ctx.strokeStyle = gradient;
                ctx.shadowBlur = 10;
                ctx.shadowColor = 'rgba(139, 92, 246, 0.4)';
                ctx.moveTo(conn.startX, conn.startY);
                ctx.lineTo(conn.endX, conn.endY);
                ctx.stroke();
                ctx.shadowBlur = 0;
            });

            // Draw active connection line from selected source to mouse
            if (selectedSource && containerRef.current) {
                const sourceElement = document.getElementById(`left-${selectedSource.id}`);
                if (sourceElement) {
                    const rect = sourceElement.getBoundingClientRect();
                    const containerRect = containerRef.current.getBoundingClientRect();
                    const startX = rect.right - containerRect.left;
                    const startY = rect.top + rect.height / 2 - containerRect.top;

                    ctx.beginPath();
                    ctx.setLineDash([15, 10]);
                    ctx.strokeStyle = '#D946EF';
                    ctx.moveTo(startX, startY);
                    ctx.lineTo(mousePos.x, mousePos.y);
                    ctx.stroke();
                    ctx.setLineDash([]);
                }
            }
        };

        const render = () => {
            draw();
            requestAnimationFrame(render);
        };
        render();

        return () => window.removeEventListener('resize', resizeCanvas);
    }, [connections, selectedSource, mousePos]);

    const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

        setMousePos({
            x: clientX - rect.left,
            y: clientY - rect.top
        });
    };

    const handleLeftClick = (id: string) => {
        if (feedback) return;
        if (selectedSource?.id === id) {
            setSelectedSource(null);
        } else {
            setSelectedSource({ id, x: mousePos.x, y: mousePos.y });
        }
    };

    const handleRightClick = (id: string) => {
        if (!selectedSource || feedback) return;

        const container = containerRef.current;
        const sourceElement = document.getElementById(`left-${selectedSource.id}`);
        const targetElement = document.getElementById(`right-${id}`);

        if (container && sourceElement && targetElement) {
            const containerRect = container.getBoundingClientRect();
            const sourceRect = sourceElement.getBoundingClientRect();
            const targetRect = targetElement.getBoundingClientRect();

            const startX = sourceRect.right - containerRect.left;
            const startY = sourceRect.top + sourceRect.height / 2 - containerRect.top;
            const endX = targetRect.left - containerRect.left;
            const endY = targetRect.top + targetRect.height / 2 - containerRect.top;

            setConnections(prev => {
                const filtered = prev.filter(c => c.fromId !== selectedSource.id && c.toId !== id);
                return [...filtered, {
                    fromId: selectedSource.id,
                    toId: id,
                    startX,
                    startY,
                    endX,
                    endY
                }];
            });
            setSelectedSource(null);
        }
    };

    const checkAnswers = () => {
        if (connections.length < pairs.length) return;

        const isCorrect = connections.every(c => c.fromId === c.toId);
        setFeedback(isCorrect ? 'correct' : 'incorrect');

        const timeSeconds = (Date.now() - startTime) / 1000;

        if (isCorrect) {
            setTimeout(() => onAnswer(true, timeSeconds, false), 1500);
        } else {
            setTimeout(() => {
                setFeedback(null);
                setConnections([]);
            }, 2000);
        }
    };

    const reset = () => {
        setConnections([]);
        setFeedback(null);
        setSelectedSource(null);
    };

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-4">
            {/* Main Worksheet Card */}
            <div className="w-full max-w-6xl bg-white/95 backdrop-blur-md rounded-[3rem] p-8 shadow-2xl border-4 border-white/50 flex flex-col min-h-[600px] max-h-[85vh]">

                {/* Scrollable Content Area */}
                <div
                    ref={scrollContainerRef}
                    className="flex-1 overflow-y-auto custom-scrollbar px-10 relative"
                    onMouseMove={handleMouseMove}
                    onTouchMove={handleMouseMove}
                >
                    <div
                        ref={containerRef}
                        className="relative flex justify-between w-full min-h-full py-10"
                    >
                        <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-10" />

                        {/* Left Column - Standardized item height for alignment */}
                        <div className="flex flex-col gap-10 z-20 w-32">
                            {leftItems.map((item, idx) => (
                                <div key={`left-${item.id}`} className="h-28 flex items-center justify-center">
                                    <motion.div
                                        id={`left-${item.id}`}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        onClick={() => handleLeftClick(item.id)}
                                        className={`cursor-pointer transition-all flex items-center justify-center ${selectedSource?.id === item.id ? 'scale-110' : ''}`}
                                    >
                                        {item.type === 'image' ? (
                                            <div className="w-24 h-24 flex items-center justify-center drop-shadow-xl hover:scale-110 transition-transform">
                                                <img src={item.value} alt="shape" className="w-full h-full object-contain" />
                                            </div>
                                        ) : (
                                            <div className="px-6 py-4 bg-purple-50 rounded-2xl border-2 border-purple-200 text-2xl font-black text-purple-900 shadow-sm min-w-[120px] text-center">
                                                {item.value}
                                            </div>
                                        )}
                                    </motion.div>
                                </div>
                            ))}
                        </div>

                        {/* Right Column - Standardized item height for alignment */}
                        <div className="flex flex-col gap-10 z-20 w-32">
                            {rightItems.map((item, idx) => (
                                <div key={`right-${item.id}`} className="h-28 flex items-center justify-center">
                                    <motion.div
                                        id={`right-${item.id}`}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        onClick={() => handleRightClick(item.id)}
                                        className={`
                                            w-28 h-28 rounded-3xl border-4 p-2 flex items-center justify-center cursor-pointer transition-all
                                            ${connections.some(c => c.toId === item.id) ? 'border-emerald-400 bg-emerald-50' : 'border-emerald-300 hover:border-emerald-500 bg-white/50'}
                                        `}
                                    >
                                        {item.type === 'image' ? (
                                            <img src={item.value} alt="target" className="w-20 h-20 object-contain drop-shadow-md" />
                                        ) : (
                                            <span className="text-xl font-black text-purple-900 text-center">{item.value}</span>
                                        )}
                                    </motion.div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bottom UI - Matching Mockup */}
                <div className="flex flex-col items-center mt-6 gap-4">
                    <div className="text-2xl font-bold text-gray-700">
                        Matched: <span className="text-purple-600 font-black">{connections.length}</span> / {pairs.length}
                    </div>

                    <div className="flex items-center gap-4">
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={reset}
                            className="p-3 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-all shadow-sm"
                        >
                            <RefreshCw className="w-6 h-6" />
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={checkAnswers}
                            disabled={connections.length < pairs.length || !!feedback}
                            className={`
                                px-14 py-4 rounded-full font-black text-2xl flex items-center gap-3 shadow-xl transition-all
                                ${connections.length === pairs.length
                                    ? 'bg-[#00C985] text-white hover:bg-[#00B075]'
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'}
                            `}
                        >
                            <Check className="w-8 h-8 stroke-[4px]" />
                            Check Answer
                        </motion.button>
                    </div>
                </div>
            </div>

            {/* Feedback */}
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

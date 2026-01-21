'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw } from 'lucide-react';
import { BaseGameProps } from '@/lib/types/game.types';
import { useSpeech } from '@/hooks/useSpeech';

interface Dot {
    number: number;
    x: number;
    y: number;
}

// Predefined shapes scaled for 500x400 canvas - Based on exact reference images
const SHAPES = {
    // Beginner shapes (10 dots each) - Matching reference images exactly
    watermelon: [
        { number: 1, x: 90, y: 260 },
        { number: 2, x: 110, y: 230 },
        { number: 3, x: 140, y: 200 },
        { number: 4, x: 180, y: 175 },
        { number: 5, x: 220, y: 175 },
        { number: 6, x: 260, y: 200 },
        { number: 7, x: 290, y: 230 },
        { number: 8, x: 310, y: 260 },
        { number: 9, x: 280, y: 300 },
        { number: 10, x: 240, y: 315 },
        { number: 11, x: 160, y: 315 },
        { number: 12, x: 120, y: 300 }
    ],
    apple: [
        // Apple body (main outline)
        { number: 1, x: 160, y: 180 },   // Top left curve
        { number: 2, x: 140, y: 210 },   // Left upper side
        { number: 3, x: 130, y: 250 },   // Left middle
        { number: 4, x: 140, y: 290 },   // Left lower side
        { number: 5, x: 170, y: 320 },   // Bottom left
        { number: 6, x: 210, y: 335 },   // Bottom center-left
        { number: 7, x: 250, y: 335 },   // Bottom center-right
        { number: 8, x: 290, y: 320 },   // Bottom right
        { number: 9, x: 320, y: 290 },   // Right lower side
        { number: 10, x: 330, y: 250 },  // Right middle
        { number: 11, x: 320, y: 210 },  // Right upper side
        { number: 12, x: 300, y: 180 },  // Top right curve
        // Stem
        { number: 13, x: 230, y: 160 },  // Stem top
        { number: 14, x: 230, y: 180 },  // Stem bottom
        // Leaf
        { number: 15, x: 250, y: 155 }   // Leaf tip
    ],
    icecream: [
        { number: 1, x: 200, y: 90 },
        { number: 2, x: 235, y: 105 },
        { number: 3, x: 260, y: 135 },
        { number: 4, x: 250, y: 170 },
        { number: 5, x: 225, y: 190 },
        { number: 6, x: 200, y: 200 },
        { number: 7, x: 175, y: 190 },
        { number: 8, x: 150, y: 170 },
        { number: 9, x: 140, y: 135 },
        { number: 10, x: 165, y: 105 },
        { number: 11, x: 200, y: 90 },
        { number: 12, x: 225, y: 230 },
        { number: 13, x: 215, y: 300 },
        { number: 14, x: 185, y: 300 },
        { number: 15, x: 175, y: 230 }
    ],
    guava: [
        { number: 1, x: 200, y: 110 },
        { number: 2, x: 240, y: 120 },
        { number: 3, x: 275, y: 160 },
        { number: 4, x: 285, y: 210 },
        { number: 5, x: 265, y: 260 },
        { number: 6, x: 230, y: 300 },
        { number: 7, x: 200, y: 315 },
        { number: 8, x: 170, y: 300 },
        { number: 9, x: 135, y: 260 },
        { number: 10, x: 115, y: 210 },
        { number: 11, x: 125, y: 160 },
        { number: 12, x: 160, y: 120 }
    ],

    // Intermediate shapes (26 dots)
    face: [
        { number: 1, x: 292, y: 160 },
        { number: 2, x: 317, y: 176 },
        { number: 3, x: 333, y: 200 },
        { number: 4, x: 342, y: 224 },
        { number: 5, x: 342, y: 248 },
        { number: 6, x: 333, y: 272 },
        { number: 7, x: 317, y: 296 },
        { number: 8, x: 292, y: 312 },
        { number: 9, x: 267, y: 320 },
        { number: 10, x: 242, y: 324 },
        { number: 11, x: 217, y: 324 },
        { number: 12, x: 192, y: 320 },
        { number: 13, x: 167, y: 312 },
        { number: 14, x: 142, y: 296 },
        { number: 15, x: 125, y: 272 },
        { number: 16, x: 117, y: 248 },
        { number: 17, x: 117, y: 224 },
        { number: 18, x: 125, y: 200 },
        { number: 19, x: 142, y: 176 },
        { number: 20, x: 167, y: 160 },
        { number: 21, x: 192, y: 152 },
        { number: 22, x: 217, y: 148 },
        { number: 23, x: 242, y: 148 },
        { number: 24, x: 267, y: 152 },
        { number: 25, x: 250, y: 200 },
        { number: 26, x: 208, y: 200 },
    ],
    penguin: [
        { number: 1, x: 229, y: 120 },
        { number: 2, x: 208, y: 128 },
        { number: 3, x: 192, y: 144 },
        { number: 4, x: 183, y: 168 },
        { number: 5, x: 183, y: 192 },
        { number: 6, x: 183, y: 216 },
        { number: 7, x: 183, y: 240 },
        { number: 8, x: 183, y: 264 },
        { number: 9, x: 183, y: 288 },
        { number: 10, x: 192, y: 312 },
        { number: 11, x: 200, y: 328 },
        { number: 12, x: 208, y: 340 },
        { number: 13, x: 221, y: 348 },
        { number: 14, x: 233, y: 352 },
        { number: 15, x: 246, y: 348 },
        { number: 16, x: 258, y: 340 },
        { number: 17, x: 267, y: 328 },
        { number: 18, x: 275, y: 312 },
        { number: 19, x: 275, y: 288 },
        { number: 20, x: 275, y: 264 },
        { number: 21, x: 275, y: 240 },
        { number: 22, x: 275, y: 216 },
        { number: 23, x: 275, y: 192 },
        { number: 24, x: 275, y: 168 },
        { number: 25, x: 267, y: 144 },
        { number: 26, x: 250, y: 128 },
    ],
};

export default function JoinTheDotsGame({
    question,
    onAnswer,
    difficultyLevel,
    showHint: shouldShowHint,
    isRulesModalOpen,
}: BaseGameProps) {
    const { speak } = useSpeech();
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Parse question data
    const pictureName: string = question.assetUrls?.pictureName || 'watermelon';
    const canvasWidth = 500;
    const canvasHeight = 400;

    // Get shape coordinates
    const dots: Dot[] = SHAPES[pictureName as keyof typeof SHAPES] || SHAPES.watermelon;
    const dotCount = dots.length;

    const [connectedDots, setConnectedDots] = useState<number[]>([]);
    const [startTime] = useState(Date.now());
    const [hoveredDot, setHoveredDot] = useState<number | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);

    // Draw on canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);

        // Draw background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // Draw connected lines
        if (connectedDots.length > 1) {
            ctx.strokeStyle = '#8b5cf6';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            for (let i = 0; i < connectedDots.length - 1; i++) {
                const dot1 = dots.find(d => d.number === connectedDots[i]);
                const dot2 = dots.find(d => d.number === connectedDots[i + 1]);

                if (dot1 && dot2) {
                    ctx.beginPath();
                    ctx.moveTo(dot1.x, dot1.y);
                    ctx.lineTo(dot2.x, dot2.y);
                    ctx.stroke();
                }
            }
        }

        // Draw dots
        dots.forEach(dot => {
            const isConnected = connectedDots.includes(dot.number);
            const isHovered = hoveredDot === dot.number;

            // Dot circle
            ctx.beginPath();
            ctx.arc(dot.x, dot.y, isHovered ? 10 : 7, 0, Math.PI * 2);

            if (isConnected) {
                ctx.fillStyle = '#10b981';
            } else {
                ctx.fillStyle = '#000000';
            }
            ctx.fill();

            // Number label
            if (!isConnected) {
                ctx.fillStyle = '#000000';
                ctx.font = 'bold 12px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(dot.number.toString(), dot.x + 12, dot.y - 8);
            }
        });

    }, [connectedDots, dots, hoveredDot, canvasWidth, canvasHeight, dotCount]);

    const handleDotClick = (dotNumber: number) => {
        const expectedNext = connectedDots.length + 1;

        if (dotNumber === expectedNext) {
            // Correct dot
            const newConnected = [...connectedDots, dotNumber];
            setConnectedDots(newConnected);
            speak(dotNumber.toString());

            // Check if completed
            if (dotNumber === dotCount) {
                const timeSeconds = (Date.now() - startTime) / 1000;
                setTimeout(() => {
                    onAnswer(true, timeSeconds, false);
                }, 300);
            }
        }
    };

    const handleReset = () => {
        setConnectedDots([]);
    };

    const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return null;

        const rect = canvas.getBoundingClientRect();
        const scaleX = canvasWidth / rect.width;
        const scaleY = canvasHeight / rect.height;

        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY,
        };
    };

    const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const coords = getCanvasCoordinates(e);
        if (!coords) return;

        // Find clicked dot
        const clickedDot = dots.find(dot => {
            const distance = Math.sqrt(Math.pow(coords.x - dot.x, 2) + Math.pow(coords.y - dot.y, 2));
            return distance <= 12;
        });

        if (clickedDot) {
            handleDotClick(clickedDot.number);
            setIsDrawing(true);
        }
    };

    const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const coords = getCanvasCoordinates(e);
        if (!coords) return;

        // Find hovered dot
        const hovered = dots.find(dot => {
            const distance = Math.sqrt(Math.pow(coords.x - dot.x, 2) + Math.pow(coords.y - dot.y, 2));
            return distance <= 12;
        });

        setHoveredDot(hovered ? hovered.number : null);

        // If drawing (mouse down), connect to hovered dot
        if (isDrawing && hovered) {
            handleDotClick(hovered.number);
        }
    };

    const handleCanvasMouseUp = () => {
        setIsDrawing(false);
    };

    return (
        <div className="w-full h-full flex items-center justify-center p-2">
            <div className="w-full max-w-3xl">
                {/* Header */}
                <motion.div
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-center mb-3"
                >
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                        ✨ Connect the Numbers
                    </h2>
                </motion.div>

                {/* Progress Info */}
                <div className="flex justify-between items-center mb-2 bg-white rounded-2xl p-2 shadow-lg">
                    <div className="flex items-center gap-3">
                        <div className="text-sm text-gray-600">
                            Progress: {connectedDots.length} / {dotCount}
                        </div>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleReset}
                        className="px-3 py-1.5 bg-gradient-to-r from-orange-400 to-red-500 text-white rounded-full font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2 text-xs"
                    >
                        <RotateCcw className="w-3 h-3" />
                        Reset
                    </motion.button>
                </div>

                {/* Canvas */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="relative"
                >
                    <canvas
                        ref={canvasRef}
                        width={canvasWidth}
                        height={canvasHeight}
                        onMouseDown={handleCanvasMouseDown}
                        onMouseMove={handleCanvasMouseMove}
                        onMouseUp={handleCanvasMouseUp}
                        onMouseLeave={() => {
                            setHoveredDot(null);
                            setIsDrawing(false);
                        }}
                        className="w-full border-4 border-purple-300 rounded-2xl shadow-xl cursor-crosshair bg-white"
                        style={{ maxWidth: '100%', height: 'auto' }}
                    />
                </motion.div>
            </div>
        </div>
    );
}

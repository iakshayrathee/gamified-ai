'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface FloatingShape {
    id: number;
    type: 'circle' | 'star' | 'heart' | 'cloud' | 'book' | 'pencil';
    x: number;
    y: number;
    size: number;
    duration: number;
    delay: number;
    color: string;
}

interface FloatingShapesProps {
    density?: 'low' | 'medium' | 'high';
    theme?: 'default' | 'ocean' | 'forest' | 'candy' | 'space';
}

const themes = {
    default: ['#A78BFA', '#FF6B9D', '#6BCF7F', '#FFD93D', '#4FD1C5'],
    ocean: ['#4facfe', '#00f2fe', '#4FD1C5', '#6BCF7F', '#A78BFA'],
    forest: ['#43e97b', '#38f9d7', '#6BCF7F', '#FFD93D', '#A78BFA'],
    candy: ['#fa709a', '#fee140', '#FF6B9D', '#FFD93D', '#A78BFA'],
    space: ['#667eea', '#764ba2', '#A78BFA', '#4FD1C5', '#FF6B9D'],
};

const shapeTypes: FloatingShape['type'][] = ['circle', 'star', 'heart', 'cloud', 'book', 'pencil'];

export default function FloatingShapes({ density = 'medium', theme = 'default' }: FloatingShapesProps) {
    const [shapes, setShapes] = useState<FloatingShape[]>([]);

    useEffect(() => {
        // Adjusted icon count to prevent overlapping
        const count = density === 'low' ? 12 : density === 'medium' ? 22 : 35;
        const colors = themes[theme];

        // Grid-based distribution for better spacing
        const cols = Math.ceil(Math.sqrt(count * 1.5)); // More columns than rows for wider viewport
        const rows = Math.ceil(count / cols);

        const newShapes: FloatingShape[] = [];
        let shapeIndex = 0;

        for (let row = 0; row < rows && shapeIndex < count; row++) {
            for (let col = 0; col < cols && shapeIndex < count; col++) {
                // Calculate base position in grid
                const baseX = (col / cols) * 100;
                const baseY = (row / rows) * 100;

                // Add random offset within grid cell for natural look
                const offsetX = (Math.random() - 0.5) * (100 / cols) * 0.8;
                const offsetY = (Math.random() - 0.5) * (100 / rows) * 0.8;

                newShapes.push({
                    id: shapeIndex,
                    type: shapeTypes[Math.floor(Math.random() * shapeTypes.length)],
                    x: Math.max(0, Math.min(100, baseX + offsetX)), // Keep within bounds
                    y: Math.max(0, Math.min(100, baseY + offsetY)),
                    size: 25 + Math.random() * 70,
                    duration: 12 + Math.random() * 18,
                    delay: Math.random() * 8,
                    color: colors[Math.floor(Math.random() * colors.length)],
                });

                shapeIndex++;
            }
        }

        setShapes(newShapes);
    }, [density, theme]);

    const renderShape = (shape: FloatingShape) => {
        const commonProps = {
            width: shape.size,
            height: shape.size,
            fill: shape.color,
            opacity: 0.25, // Increased opacity from 0.15 to 0.25
        };

        switch (shape.type) {
            case 'circle':
                return <circle cx={shape.size / 2} cy={shape.size / 2} r={shape.size / 2} {...commonProps} />;

            case 'star':
                return (
                    <polygon
                        points={`${shape.size / 2},0 ${shape.size * 0.6},${shape.size * 0.35} ${shape.size},${shape.size * 0.4} ${shape.size * 0.7},${shape.size * 0.65} ${shape.size * 0.8},${shape.size} ${shape.size / 2},${shape.size * 0.75} ${shape.size * 0.2},${shape.size} ${shape.size * 0.3},${shape.size * 0.65} 0,${shape.size * 0.4} ${shape.size * 0.4},${shape.size * 0.35}`}
                        {...commonProps}
                    />
                );

            case 'heart':
                return (
                    <path
                        d={`M${shape.size / 2},${shape.size * 0.9} C${shape.size / 2},${shape.size * 0.9} 0,${shape.size * 0.5} 0,${shape.size * 0.3} C0,${shape.size * 0.1} ${shape.size * 0.2},0 ${shape.size * 0.4},0 C${shape.size * 0.5},0 ${shape.size / 2},${shape.size * 0.2} ${shape.size / 2},${shape.size * 0.2} C${shape.size / 2},${shape.size * 0.2} ${shape.size * 0.5},0 ${shape.size * 0.6},0 C${shape.size * 0.8},0 ${shape.size},${shape.size * 0.1} ${shape.size},${shape.size * 0.3} C${shape.size},${shape.size * 0.5} ${shape.size / 2},${shape.size * 0.9} ${shape.size / 2},${shape.size * 0.9} Z`}
                        {...commonProps}
                    />
                );

            case 'cloud':
                return (
                    <g {...commonProps}>
                        <ellipse cx={shape.size * 0.3} cy={shape.size * 0.6} rx={shape.size * 0.25} ry={shape.size * 0.2} />
                        <ellipse cx={shape.size * 0.5} cy={shape.size * 0.4} rx={shape.size * 0.3} ry={shape.size * 0.25} />
                        <ellipse cx={shape.size * 0.7} cy={shape.size * 0.6} rx={shape.size * 0.25} ry={shape.size * 0.2} />
                    </g>
                );

            case 'book':
                return (
                    <g {...commonProps}>
                        <rect x={shape.size * 0.2} y={shape.size * 0.1} width={shape.size * 0.6} height={shape.size * 0.8} rx={2} />
                        <line x1={shape.size * 0.5} y1={shape.size * 0.1} x2={shape.size * 0.5} y2={shape.size * 0.9} stroke={shape.color} strokeWidth="2" />
                    </g>
                );

            case 'pencil':
                return (
                    <g {...commonProps}>
                        <polygon points={`${shape.size * 0.3},${shape.size * 0.1} ${shape.size * 0.7},${shape.size * 0.1} ${shape.size * 0.5},${shape.size * 0.3}`} />
                        <rect x={shape.size * 0.4} y={shape.size * 0.3} width={shape.size * 0.2} height={shape.size * 0.6} />
                    </g>
                );

            default:
                return <circle cx={shape.size / 2} cy={shape.size / 2} r={shape.size / 2} {...commonProps} />;
        }
    };

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-10" style={{ height: '100vh' }}>
            {shapes.map((shape) => {
                // Randomize animation patterns for variety
                const animationVariant = shape.id % 4;

                return (
                    <motion.div
                        key={shape.id}
                        className="absolute"
                        style={{
                            left: `${shape.x}%`,
                            top: `${shape.y}vh`, // Use vh for better vertical distribution
                        }}
                        animate={
                            animationVariant === 0
                                ? {
                                    // Floating up and down with rotation
                                    y: [0, -40, 0],
                                    x: [0, 25, 0],
                                    rotate: [0, 360],
                                    scale: [1, 1.2, 1],
                                    opacity: [0.25, 0.4, 0.25],
                                }
                                : animationVariant === 1
                                    ? {
                                        // Figure-8 pattern
                                        y: [0, -30, -60, -30, 0],
                                        x: [0, 30, 0, -30, 0],
                                        rotate: [0, 180, 360],
                                        scale: [1, 1.15, 1],
                                        opacity: [0.25, 0.35, 0.25],
                                    }
                                    : animationVariant === 2
                                        ? {
                                            // Circular motion
                                            y: [0, -20, -40, -20, 0],
                                            x: [0, 20, 0, -20, 0],
                                            rotate: [0, -360],
                                            scale: [1, 1.1, 1.2, 1.1, 1],
                                            opacity: [0.25, 0.3, 0.4, 0.3, 0.25],
                                        }
                                        : {
                                            // Zigzag pattern
                                            y: [0, -50, 0],
                                            x: [0, -30, 0],
                                            rotate: [0, 180, 360],
                                            scale: [1, 1.25, 1],
                                            opacity: [0.25, 0.45, 0.25],
                                        }
                        }
                        transition={{
                            duration: shape.duration,
                            delay: shape.delay,
                            repeat: Infinity,
                            ease: 'easeInOut',
                            times: animationVariant === 1 || animationVariant === 2 ? [0, 0.25, 0.5, 0.75, 1] : [0, 0.5, 1],
                        }}
                    >
                        <svg width={shape.size} height={shape.size} viewBox={`0 0 ${shape.size} ${shape.size}`}>
                            {renderShape(shape)}
                        </svg>
                    </motion.div>
                );
            })}
        </div>
    );
}

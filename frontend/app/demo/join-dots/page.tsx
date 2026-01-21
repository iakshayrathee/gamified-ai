"use client";
import { useState, useRef, useEffect } from "react";
import "./styles.css";

interface Dot {
  id: number;
  x: number;
  y: number;
}

// Complete dot positions from the plane SVG (fixed positions for dots 14 and 15)
const planeDots: Dot[] = [
  { id: 1, x: 60, y: 325 },
  { id: 2, x: 150, y: 293 },
  { id: 3, x: 339, y: 373 },
  { id: 4, x: 383, y: 319 },
  { id: 5, x: 500, y: 290 },
  { id: 6, x: 596, y: 281 },
  { id: 7, x: 636, y: 259 },
  { id: 8, x: 561, y: 226 },
  { id: 9, x: 615, y: 210 },
  { id: 10, x: 688, y: 259 },
  { id: 11, x: 730, y: 118 },
  { id: 12, x: 797, y: 122 },
  { id: 13, x: 768, y: 289 },
  { id: 14, x: 907, y: 307 }, // Fixed position
  { id: 15, x: 858, y: 351 }, // Fixed position
  { id: 16, x: 748, y: 348 },
  { id: 17, x: 621, y: 415 },
  { id: 18, x: 975, y: 559 },
  { id: 19, x: 868, y: 625 },
  { id: 20, x: 495, y: 506 },
];

// Pre-completed lines (semi-completed image)
const preCompletedLines = [
  { from: planeDots[0], to: planeDots[1] }, // 1-2
  { from: planeDots[1], to: planeDots[2] }, // 2-3
  { from: planeDots[2], to: planeDots[3] }, // 3-4
  { from: planeDots[3], to: planeDots[4] }, // 4-5
  { from: planeDots[4], to: planeDots[5] }, // 5-6
  { from: planeDots[5], to: planeDots[6] }, // 6-7
  { from: planeDots[6], to: planeDots[7] }, // 7-8
];

// Dotted lines to be completed by the child
const dottedLines = [
  { from: planeDots[7], to: planeDots[8] }, // 8-9
  { from: planeDots[8], to: planeDots[9] }, // 9-10
  { from: planeDots[9], to: planeDots[10] }, // 10-11
  { from: planeDots[10], to: planeDots[11] }, // 11-12
  { from: planeDots[11], to: planeDots[12] }, // 12-13
  { from: planeDots[12], to: planeDots[13] }, // 13-14
  { from: planeDots[13], to: planeDots[14] }, // 14-15
  { from: planeDots[14], to: planeDots[15] }, // 15-16
  { from: planeDots[15], to: planeDots[16] }, // 16-17
  { from: planeDots[16], to: planeDots[17] }, // 17-18
  { from: planeDots[17], to: planeDots[18] }, // 18-19
  { from: planeDots[18], to: planeDots[19] }, // 19-20
];

function JoinDots({ dots }: { dots: Dot[] }) {
  const [current, setCurrent] = useState(9); // Start from dot 9 since 1-8 are pre-completed
  const [userLines, setUserLines] = useState<any[]>([]);
  const [hoveredDot, setHoveredDot] = useState<number | null>(null);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [tempLine, setTempLine] = useState<{ from: Dot; to: { x: number; y: number } } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const handleSvgMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 800;
    const y = ((e.clientY - rect.top) / rect.height) * 600;
    
    setCursorPos({ x, y });

    // Check if we're near the previous completed dot to start drawing
    const prevDot = dots.find(d => d.id === current - 1);
    if (prevDot && !isDrawing && current > 8) {
      const distance = Math.sqrt(Math.pow(x - prevDot.x, 2) + Math.pow(y - prevDot.y, 2));
      if (distance <= 15) {
        setIsDrawing(true);
        setTempLine({ from: prevDot, to: { x, y } });
      }
    }

    // Update temporary line while drawing
    if (isDrawing && prevDot) {
      setTempLine({ from: prevDot, to: { x, y } });
    }
  };

  const handleDotMouseEnter = (dot: Dot) => {
    setHoveredDot(dot.id);
    
    // If we're drawing and reach the target dot, complete the connection
    if (isDrawing && dot.id === current) {
      const prev = dots.find(d => d.id === current - 1);
      if (prev && current > 8) {
        setUserLines([...userLines, { from: prev, to: dot }]);
        setCurrent(current + 1);
        setIsDrawing(false);
        setTempLine(null);
      }
    }
  };

  const handleDotMouseLeave = () => {
    setHoveredDot(null);
  };

  const handleSvgMouseLeave = () => {
    setIsDrawing(false);
    setTempLine(null);
    setHoveredDot(null);
  };

  const isDotClickable = (dotId: number) => {
    return dotId === current;
  };

  const isDotCompleted = (dotId: number) => {
    return dotId < current;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-4">
            ✈️ Connect the Dots - Complete the Plane!
          </h1>
          <p className="text-gray-600 text-lg mb-4">
            Move your cursor near the last completed dot to start drawing, then guide it to the next dot!
          </p>
          <div className="text-lg font-semibold text-gray-700">
            Progress: {Math.min(current - 9, dots.length - 8)} / {dots.length - 8} dots remaining
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-6">
          <svg 
            ref={svgRef}
            width="800" 
            height="600" 
            className="w-full h-auto bg-white rounded-xl shadow-inner cursor-crosshair"
            onMouseMove={handleSvgMouseMove}
            onMouseLeave={handleSvgMouseLeave}
          >
            {/* Pre-completed solid lines */}
            {preCompletedLines.map((line, i) => (
              <line
                key={`pre-${i}`}
                x1={line.from.x}
                y1={line.from.y}
                x2={line.to.x}
                y2={line.to.y}
                stroke="#10B981"
                strokeWidth="3"
                strokeLinecap="round"
              />
            ))}

            {/* Dotted guide lines */}
            {dottedLines.map((line, i) => {
              const isCompleted = userLines.some(
                userLine => 
                  (userLine.from.id === line.from.id && userLine.to.id === line.to.id) ||
                  (userLine.from.id === line.to.id && userLine.to.id === line.from.id)
              );
              
              return (
                <line
                  key={`dot-${i}`}
                  x1={line.from.x}
                  y1={line.from.y}
                  x2={line.to.x}
                  y2={line.to.y}
                  stroke={isCompleted ? "#7C3AED" : "#E5E7EB"}
                  strokeWidth={isCompleted ? "4" : "2"}
                  strokeDasharray={isCompleted ? "0" : "5,5"}
                  strokeLinecap="round"
                  opacity={isCompleted ? 1 : 0.5}
                />
              );
            })}

            {/* User-drawn lines */}
            {userLines.map((line, i) => (
              <line
                key={`user-${i}`}
                x1={line.from.x}
                y1={line.from.y}
                x2={line.to.x}
                y2={line.to.y}
                stroke="#7C3AED"
                strokeWidth="4"
                strokeLinecap="round"
                className="animate-draw-line"
              />
            ))}

            {/* Temporary line while drawing */}
            {tempLine && (
              <line
                x1={tempLine.from.x}
                y1={tempLine.from.y}
                x2={tempLine.to.x}
                y2={tempLine.to.y}
                stroke="#F59E0B"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="5,5"
                opacity="0.7"
              />
            )}

            {/* Dots */}
            {dots.map(dot => {
              const isClickable = isDotClickable(dot.id);
              const isCompleted = isDotCompleted(dot.id);
              const isPreCompleted = dot.id <= 8;
              
              return (
                <g key={dot.id}>
                  <circle
                    cx={dot.x}
                    cy={dot.y}
                    r={isCompleted || isPreCompleted ? 8 : isClickable ? 7 : 6}
                    fill={
                      isPreCompleted ? "#10B981" :
                      isCompleted ? "#7C3AED" :
                      isClickable ? "#F59E0B" :
                      "#6B7280"
                    }
                    stroke={isClickable ? "#F59E0B" : "none"}
                    strokeWidth={isClickable ? "2" : "0"}
                    className={
                    isClickable ? "cursor-pointer pulse-dot" : "cursor-default"
                  }
                  onMouseEnter={() => handleDotMouseEnter(dot)}
                  onMouseLeave={handleDotMouseLeave}
                  />
                  <text
                    x={dot.x}
                    y={dot.y + 4}
                    fontSize="12"
                    fontWeight="bold"
                    fill="white"
                    textAnchor="middle"
                    className="select-none pointer-events-none"
                  >
                    {dot.id}
                  </text>
                  {isClickable && hoveredDot === dot.id && (
                    <text
                      x={dot.x}
                      y={dot.y - 15}
                      fontSize="11"
                      fill="#F59E0B"
                      textAnchor="middle"
                      className="select-none pointer-events-none animate-bounce"
                    >
                      Click me!
                    </text>
                  )}
                </g>
              );
            })}

            {/* Custom cursor indicator */}
            {hoveredDot && (
              <circle
                cx={cursorPos.x}
                cy={cursorPos.y}
                r="8"
                fill="none"
                stroke="#F59E0B"
                strokeWidth="2"
                className="pointer-events-none"
                opacity="0.6"
              />
            )}
          </svg>

          {current > dots.length && (
            <div className="mt-6 p-4 bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl text-center">
              <h2 className="text-2xl font-bold text-green-800 mb-2">
                🎉 Amazing! You've completed the plane!
              </h2>
              <p className="text-green-600">
                Great job finishing the remaining {dots.length - 8} dots!
              </p>
              <button
                onClick={() => {
                  setCurrent(9);
                  setUserLines([]);
                }}
                className="mt-4 px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full font-bold shadow-lg hover:shadow-xl transition-all"
              >
                Play Again
              </button>
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 rounded-xl">
            <h3 className="font-bold text-blue-800 mb-2">How to play:</h3>
            <ul className="text-blue-600 space-y-1 text-sm">
              <li>• The first 8 dots are already connected (green lines)</li>
              <li>• Move your cursor near the last completed dot to start drawing</li>
              <li>• Guide the cursor to the next orange dot to connect them</li>
              <li>• A dotted line follows your cursor while drawing</li>
              <li>• Complete all dots to finish the plane!</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// Demo page component
export default function PlaneDemoPage() {
  return <JoinDots dots={planeDots} />;
}

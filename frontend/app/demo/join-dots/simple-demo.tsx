"use client";
import { useState } from "react";

interface Dot {
  id: number;
  x: number;
  y: number;
  onClick?: () => void;
}

export default function JoinDots({ dots }: { dots: Dot[] }) {
  const [current, setCurrent] = useState(1);
  const [lines, setLines] = useState<any[]>([]);

  const handleDotClick = (dot: Dot) => {
    if (dot.id !== current) return;

    if (current > 1) {
      const prev = dots.find(d => d.id === current - 1);
      setLines([...lines, { from: prev, to: dot }]);
    }

    setCurrent(current + 1);
    
    // Call custom onClick if provided
    if (dot.onClick) {
      dot.onClick();
    }
  };

  return (
    <svg width="800" height="600" className="bg-white rounded-xl">
      
      {/* Lines */}
      {lines.map((line, i) => (
        <line
          key={i}
          x1={line.from.x}
          y1={line.from.y}
          x2={line.to.x}
          y2={line.to.y}
          stroke="#7C3AED"
          strokeWidth="4"
          strokeLinecap="round"
        />
      ))}

      {/* Dots */}
      {dots.map(dot => (
        <g key={dot.id} onClick={() => handleDotClick(dot)} className="cursor-pointer">
          <circle
            cx={dot.x}
            cy={dot.y}
            r={current > dot.id ? 7 : 6}
            fill={current > dot.id ? "#10B981" : dot.id === current ? "#7C3AED" : "#000"}
            className="transition-all duration-200 hover:scale-125"
          />
          <text
            x={dot.x + 10}
            y={dot.y + 5}
            fontSize="14"
            fontWeight="bold"
            fill={current > dot.id ? "#10B981" : "#000"}
            className="select-none pointer-events-none"
          >
            {dot.id}
          </text>
        </g>
      ))}
    </svg>
  );
}

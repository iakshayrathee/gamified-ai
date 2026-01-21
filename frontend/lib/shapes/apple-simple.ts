// Simple Apple Shape for Beginner Level (12 dots)
// Designed for 500x400 canvas, centered apple with stem and leaf

export interface DotPoint {
    number: number;
    x: number;
    y: number;
}

export const appleSimpleDots: DotPoint[] = [
    // Start from top left of apple body
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

    // Stem (connects to top)
    { number: 13, x: 230, y: 160 },  // Stem top
    { number: 14, x: 230, y: 180 },  // Stem bottom (connects to apple)

    // Leaf (small decorative element)
    { number: 15, x: 250, y: 155 },  // Leaf tip
];

// SVG path for the completed apple shape (to show when finished)
export const appleCompletedPath = `
  M 160,180 
  Q 140,210 130,250 
  Q 130,290 170,320 
  Q 210,340 250,340 
  Q 290,340 330,320 
  Q 370,290 330,250 
  Q 320,210 300,180 
  L 230,180 
  L 230,160 
  M 230,160 
  Q 250,150 255,155 
  Q 250,160 230,160 
  Z
`;

// Color scheme for the apple
export const appleColors = {
    fill: '#FF4444',      // Bright red
    stroke: '#8B0000',    // Dark red
    stemFill: '#8B4513',  // Brown
    leafFill: '#228B22',  // Green
};

// Description for the game
export const appleDescription = {
    name: 'Apple',
    difficulty: 'beginner',
    dotCount: 15,
    instructions: 'Connect the dots from 1 to 15 to draw a delicious apple!',
};

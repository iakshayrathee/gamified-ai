/**
 * Design Tokens for Children's Learning Platform
 * A comprehensive design system with child-friendly colors, spacing, and animations
 */

// ============================================================================
// COLOR PALETTE - Vibrant and Child-Friendly
// ============================================================================

export const colors = {
  // Primary Colors - Bright and Engaging
  primary: {
    sunshine: '#FFD93D',      // Bright yellow
    sky: '#6BCF7F',           // Fresh green-blue
    coral: '#FF6B9D',         // Playful pink
    purple: '#A78BFA',        // Magic purple
    ocean: '#4FD1C5',         // Teal
  },

  // Secondary Colors - Supporting palette
  secondary: {
    peach: '#FFDAB9',
    mint: '#B4F8C8',
    lavender: '#E0BBE4',
    lemon: '#FFF9A5',
    rose: '#FFB6C1',
  },

  // Semantic Colors
  success: {
    light: '#D1FAE5',
    DEFAULT: '#10B981',
    dark: '#059669',
  },
  error: {
    light: '#FEE2E2',
    DEFAULT: '#EF4444',
    dark: '#DC2626',
  },
  warning: {
    light: '#FEF3C7',
    DEFAULT: '#F59E0B',
    dark: '#D97706',
  },
  info: {
    light: '#DBEAFE',
    DEFAULT: '#3B82F6',
    dark: '#2563EB',
  },

  // Neutral Colors
  neutral: {
    white: '#FFFFFF',
    gray: {
      50: '#F9FAFB',
      100: '#F3F4F6',
      200: '#E5E7EB',
      300: '#D1D5DB',
      400: '#9CA3AF',
      500: '#6B7280',
      600: '#4B5563',
      700: '#374151',
      800: '#1F2937',
      900: '#111827',
    },
    black: '#000000',
  },
};

// ============================================================================
// GRADIENT PRESETS - Pre-defined beautiful gradients
// ============================================================================

export const gradients = {
  // Background Gradients
  rainbow: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  sunset: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  ocean: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  forest: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  candy: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  sky: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
  
  // Button Gradients
  primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  success: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
  danger: 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)',
  warning: 'linear-gradient(135deg, #f7971e 0%, #ffd200 100%)',
  
  // Special Effects
  shimmer: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)',
  glow: 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, transparent 70%)',
};

// ============================================================================
// SPACING SCALE - Consistent spacing system
// ============================================================================

export const spacing = {
  0: '0',
  1: '0.25rem',    // 4px
  2: '0.5rem',     // 8px
  3: '0.75rem',    // 12px
  4: '1rem',       // 16px
  5: '1.25rem',    // 20px
  6: '1.5rem',     // 24px
  8: '2rem',       // 32px
  10: '2.5rem',    // 40px
  12: '3rem',      // 48px
  16: '4rem',      // 64px
  20: '5rem',      // 80px
  24: '6rem',      // 96px
  32: '8rem',      // 128px
};

// ============================================================================
// TYPOGRAPHY - Font sizes and weights
// ============================================================================

export const typography = {
  fontFamily: {
    primary: '"Fredoka", "Nunito", sans-serif',
    secondary: '"Comic Neue", cursive',
    mono: '"Courier New", monospace',
  },
  
  fontSize: {
    xs: '0.75rem',      // 12px
    sm: '0.875rem',     // 14px
    base: '1rem',       // 16px
    lg: '1.125rem',     // 18px
    xl: '1.25rem',      // 20px
    '2xl': '1.5rem',    // 24px
    '3xl': '1.875rem',  // 30px
    '4xl': '2.25rem',   // 36px
    '5xl': '3rem',      // 48px
    '6xl': '3.75rem',   // 60px
    '7xl': '4.5rem',    // 72px
    '8xl': '6rem',      // 96px
  },
  
  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
  
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
    loose: 2,
  },
};

// ============================================================================
// SHADOWS - Elevation system
// ============================================================================

export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  
  // Colored shadows for playful effect
  colorful: {
    purple: '0 10px 30px rgba(167, 139, 250, 0.4)',
    pink: '0 10px 30px rgba(255, 107, 157, 0.4)',
    blue: '0 10px 30px rgba(79, 209, 197, 0.4)',
    yellow: '0 10px 30px rgba(255, 217, 61, 0.4)',
  },
};

// ============================================================================
// BORDER RADIUS - Rounded corners
// ============================================================================

export const borderRadius = {
  none: '0',
  sm: '0.125rem',    // 2px
  DEFAULT: '0.25rem', // 4px
  md: '0.375rem',    // 6px
  lg: '0.5rem',      // 8px
  xl: '0.75rem',     // 12px
  '2xl': '1rem',     // 16px
  '3xl': '1.5rem',   // 24px
  full: '9999px',
};

// ============================================================================
// ANIMATION TIMINGS - Consistent timing functions
// ============================================================================

export const transitions = {
  duration: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
    slower: '700ms',
  },
  
  timing: {
    linear: 'linear',
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    
    // Custom bezier curves
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
    spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  },
};

// ============================================================================
// Z-INDEX SCALE - Layering system
// ============================================================================

export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
};

// ============================================================================
// BREAKPOINTS - Responsive design
// ============================================================================

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

// Export all tokens as default
export const designTokens = {
  colors,
  gradients,
  spacing,
  typography,
  shadows,
  borderRadius,
  transitions,
  zIndex,
  breakpoints,
};

export default designTokens;

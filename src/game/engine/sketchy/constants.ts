// Sketchy/hand-drawn rendering constants for flipbook aesthetic

// Blue ink color (like ballpoint pen)
export const INK_BLUE = '#1a4a7a';
export const INK_LIGHT = '#4a7ab0';
export const INK_DARK = '#0d2840';

// Noir theme colors (inverted for dark backgrounds)
export const NOIR_INK = '#e8e8e8';
export const NOIR_LIGHT = '#ffffff';
export const NOIR_DARK = '#cccccc';

// Pencil gray color for sketch underlays
export const PENCIL_GRAY = '#9a9590';

// Wobble intensity tiers for different element types
// Higher values = more hand-drawn imperfection
export const WOBBLE_INTENSITY = {
  hero: 2.5,      // Player, ground, flag - most prominent wobble
  standard: 2.0,  // Clouds, UI boxes, trajectories
  fine: 1.0,      // Small details, eyes, dashes
} as const;

// Frame timing for wobble updates (higher = more deliberate, less jittery)
export const WOBBLE_FRAME_MS = 150;

// Flipbook theme line weight constants
export const LINE_WEIGHTS = {
  primary: 2.5,      // Hero outlines, player, ground edge
  secondary: 1.5,    // Grid/labels/less important markers
  shadow: 1.0,       // Faint pencil shadow offset
} as const;

// Character scale - controls overall character size
export const CHARACTER_SCALE = {
  normal: 1.2,    // Slightly larger than original 0.85
  ghost: 0.9,     // Ghost trail figures
  mini: 0.7,      // Small UI previews
} as const;

// Line widths for scaled characters
export const SCALED_LINE_WEIGHTS = {
  body: 4.5,      // Main body strokes
  limbs: 4,       // Arms, legs
  details: 3,     // Fingers, face
  effects: 2.5,   // Energy spirals, etc.
} as const;

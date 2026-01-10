// Theme ID type for type-safe theme selection
export type ThemeId = 'flipbook' | 'noir';

// Render style metadata for theme-specific rendering behavior
export interface RenderStyle {
  kind: 'flipbook' | 'noir';
  wobble: number;      // 0-1: amount of hand-drawn wobble
  grain: number;       // 0-1: paper/film grain intensity
  vignette: number;    // 0-1: vignette intensity (noir only)
  pencilLayers: number; // 1-3: number of stroke layers
}

export interface Theme {
  id: ThemeId;
  name: string;
  background: string;
  backgroundGradientEnd: string;
  horizon: string;
  gridPrimary: string;
  gridSecondary: string;
  accent1: string;
  accent2: string;
  accent3: string;
  accent4: string;
  highlight: string;
  player: string;
  playerGlow: string;
  trailNormal: string;
  trailPastTarget: string;
  star: string;
  danger: string;
  uiBg: string;
  uiText: string;
  renderStyle: RenderStyle;
}

// Flipbook theme - hand-drawn notebook aesthetic
const FLIPBOOK_THEME: Theme = {
  id: 'flipbook',
  name: 'Flipbook',
  background: '#f5f1e8',           // Warm cream paper
  backgroundGradientEnd: '#ebe7de', // Slightly darker cream
  horizon: '#e8e4db',              // Paper fold line
  gridPrimary: '#c8daf0',          // Light blue ruled line
  gridSecondary: '#d8e6f4',        // Faint blue lines
  accent1: '#1a4a7a',              // Blue ballpoint pen ink (INK_BLUE)
  accent2: '#0d2840',              // Dark blue pen (INK_DARK)
  accent3: '#4a7ab0',              // Light blue accents (INK_LIGHT)
  accent4: '#c94040',              // Red pen (softer)
  highlight: '#e8a030',            // Highlighter yellow-orange (warmer)
  player: '#1a4a7a',               // Blue pen ink for stick figure
  playerGlow: 'rgba(26, 74, 122, 0.3)',
  trailNormal: '#7a9ac0',          // Light ink trail
  trailPastTarget: '#1a4a7a',      // Blue ink trail
  star: '#d1d5db',                 // Faint pencil marks
  danger: '#c94040',               // Red pen
  uiBg: 'rgba(245, 241, 232, 0.95)',
  uiText: '#2a4060',               // Dark blue-gray text
  renderStyle: {
    kind: 'flipbook',
    wobble: 0.6,        // Medium wobble for hand-drawn feel
    grain: 0.4,         // Subtle paper texture
    vignette: 0,        // No vignette for flipbook
    pencilLayers: 2,    // Primary ink + faint graphite
  },
};

// Noir Ink theme - high-contrast, dry-ink strokes, film grain + vignette
const NOIR_THEME: Theme = {
  id: 'noir',
  name: 'Noir Ink',
  background: '#1a1a1e',           // Near-black background
  backgroundGradientEnd: '#0d0d0f', // Darker gradient end
  horizon: '#252528',              // Dark horizon line
  gridPrimary: '#2a2a30',          // Subtle grid lines
  gridSecondary: '#222226',        // Very faint secondary grid
  accent1: '#e8e4e0',              // Off-white primary ink
  accent2: '#f5f1ed',              // Bright white for emphasis
  accent3: '#8a8680',              // Muted gray accents
  accent4: '#c94040',              // Red accent (same intensity)
  highlight: '#f0e68c',            // Khaki/gold highlight
  player: '#e8e4e0',               // Off-white stick figure
  playerGlow: 'rgba(232, 228, 224, 0.2)',
  trailNormal: '#6a6660',          // Muted gray trail
  trailPastTarget: '#e8e4e0',      // Bright trail past target
  star: '#4a4640',                 // Faint marks
  danger: '#dc3545',               // Bright red danger
  uiBg: 'rgba(26, 26, 30, 0.95)',
  uiText: '#e8e4e0',               // Off-white text
  renderStyle: {
    kind: 'noir',
    wobble: 0.3,        // Lower wobble, sharper intent
    grain: 0.6,         // Film grain (more prominent)
    vignette: 0.7,      // Strong vignette
    pencilLayers: 1,    // Single clean ink stroke
  },
};

// All themes registry
export const THEMES: Record<ThemeId, Theme> = {
  flipbook: FLIPBOOK_THEME,
  noir: NOIR_THEME,
};

// Default theme ID
export const DEFAULT_THEME_ID: ThemeId = 'flipbook';

// Get theme by ID (with fallback to default)
export function getTheme(id: ThemeId): Theme {
  return THEMES[id] ?? THEMES[DEFAULT_THEME_ID];
}

// List of all available theme IDs
export const THEME_IDS: ThemeId[] = ['flipbook', 'noir'];

// Legacy export for backwards compatibility during migration
export const THEME = FLIPBOOK_THEME;

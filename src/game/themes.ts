export interface Theme {
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
}

// Flipbook theme - hand-drawn notebook aesthetic
export const THEME: Theme = {
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
};

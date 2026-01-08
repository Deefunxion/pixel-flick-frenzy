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

export const THEMES: Record<string, Theme> = {
  flipbook: {
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
  },
  synthwave: {
    name: 'Synthwave',
    background: '#000008',
    backgroundGradientEnd: '#0a0a1a',
    horizon: '#101028',
    gridPrimary: '#ff0080',
    gridSecondary: '#4400aa',
    accent1: '#ff0080',
    accent2: '#00ffff',
    accent3: '#8800ff',
    accent4: '#ff4444',
    highlight: '#ffff00',
    player: '#00ffff',
    playerGlow: 'rgba(0,255,255,0.5)',
    trailNormal: '#ff0080',
    trailPastTarget: '#00ffff',
    star: '#ffffff',
    danger: '#ff0000',
    uiBg: 'rgba(0,0,8,0.9)',
    uiText: '#ffffff',
  },
  noir: {
    name: 'Dark Noir',
    background: '#000000',
    backgroundGradientEnd: '#0a0a0a',
    horizon: '#101010',
    gridPrimary: '#333333',
    gridSecondary: '#1a1a1a',
    accent1: '#ff0000',
    accent2: '#888888',
    accent3: '#555555',
    accent4: '#aa0000',
    highlight: '#ffffff',
    player: '#ffffff',
    playerGlow: 'rgba(255,255,255,0.35)',
    trailNormal: '#555555',
    trailPastTarget: '#ff0000',
    star: '#333333',
    danger: '#ff0000',
    uiBg: 'rgba(0,0,0,0.9)',
    uiText: '#cccccc',
  },
  golf: {
    name: 'Golf Classic',
    background: '#001100',
    backgroundGradientEnd: '#002200',
    horizon: '#003300',
    gridPrimary: '#00ff00',
    gridSecondary: '#006600',
    accent1: '#00ff00',
    accent2: '#ffffff',
    accent3: '#88ff88',
    accent4: '#00cc00',
    highlight: '#ffaa00',
    player: '#ffffff',
    playerGlow: 'rgba(255,255,255,0.45)',
    trailNormal: '#88ff88',
    trailPastTarget: '#ffaa00',
    star: '#aaffaa',
    danger: '#ff0000',
    uiBg: 'rgba(0,17,0,0.9)',
    uiText: '#88ff88',
  },
};

export const DEFAULT_THEME_KEY = 'flipbook' as const;

export function isThemeKey(key: string): key is keyof typeof THEMES {
  return Object.prototype.hasOwnProperty.call(THEMES, key);
}

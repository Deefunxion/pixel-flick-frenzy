// src/game/engine/backgroundState.ts

/**
 * State for animated background elements
 * Updated each frame based on wind and time
 */

export interface CloudState {
  x: number;        // Current x position
  y: number;        // Fixed y position
  baseX: number;    // Starting x position (for drift calculation)
  size: 'large' | 'medium' | 'small';
  stretchX: number; // Wind stretch factor (1.0 = normal)
}

export interface VoidLayerState {
  offsetX: number;  // Parallax scroll offset (loops at image width)
  speed: number;    // Base scroll speed multiplier
}

export interface WindParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  asset: 'paper' | 'leaf' | 'dust1' | 'dust2';
  rotation: number;
  rotationSpeed: number;
}

export interface WindSwoosh {
  x: number;
  y: number;
  opacity: number;
  fadeState: 'in' | 'visible' | 'out';
  asset: 'swoosh1' | 'swoosh2' | 'swoosh3';
  lifetime: number;
}

export interface BirdState {
  x: number;
  y: number;
  baseY: number;
  vx: number;          // Horizontal velocity
  wingPhase: number;   // For wing flap animation
  asset: 'dove' | 'seagull';
}

export interface BackgroundState {
  // Clouds drift with wind
  clouds: CloudState[];

  // Void parallax layers
  voidLayers: [VoidLayerState, VoidLayerState, VoidLayerState];

  // Wind particles
  windParticles: WindParticle[];

  // Wind swoosh effects
  windSwooshes: WindSwoosh[];

  // Animated birds
  birds: BirdState[];

  // Flag animation
  flagFrame: number;          // Current frame 0-3
  flagFrameTimer: number;     // Ms since last frame change
  flagDirection: 1 | -1;      // Wind direction applied to flag (right = 1, left = -1)
  flagLevel: number;          // Discrete wind level 0-5 for flag intensity
  flagLean: number;           // Radians to lean the pole/flag into the wind
  flagWavePhase: number;      // Phase accumulator for subtle sway

  // Timing
  lastUpdateTime: number;
}

/** Create initial background state */
export function createBackgroundState(): BackgroundState {
  return {
    clouds: [
      { x: 120, y: 55, baseX: 120, size: 'medium', stretchX: 1.0 },
      { x: 280, y: 70, baseX: 280, size: 'large', stretchX: 1.0 },
      { x: 400, y: 50, baseX: 400, size: 'small', stretchX: 1.0 },
    ],
    voidLayers: [
      { offsetX: 0, speed: 1.0 },    // Layer 1: fastest
      { offsetX: 0, speed: 0.6 },    // Layer 2: medium
      { offsetX: 0, speed: 0.3 },    // Layer 3: slowest
    ],
    windParticles: [],
    windSwooshes: [],
    birds: [
      { x: 350, y: 60, baseY: 60, vx: 0.8, wingPhase: 0, asset: 'dove' },
      { x: 150, y: 45, baseY: 45, vx: 0.5, wingPhase: Math.PI, asset: 'seagull' },
    ],
    flagFrame: 0,
    flagFrameTimer: 0,
    flagDirection: 1,
    flagLevel: 0,
    flagLean: 0,
    flagWavePhase: 0,
    lastUpdateTime: 0,
  };
}

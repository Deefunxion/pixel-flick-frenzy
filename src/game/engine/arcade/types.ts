// src/game/engine/arcade/types.ts
export type DoodleSize = 'small' | 'large';
export type SpringDirection = 'up' | 'up-left' | 'up-right' | 'down';
export type PortalExitDirection = 'straight' | 'up-45' | 'down-45';

// Motion patterns for moving doodles (World 3+)
export type DoodleMotion =
  | { type: 'static' }
  | { type: 'linear'; axis: 'x' | 'y'; range: number; speed: number }
  | { type: 'circular'; radius: number; speed: number };

export interface DoodlePlacement {
  x: number;
  y: number;
  size: DoodleSize;
  sprite: string;      // e.g., 'paperplane', 'star', 'globe'
  sequence: number;    // 1, 2, 3... for order objective
  scale?: number;      // Custom scale multiplier (default 1.0)
  rotation?: number;   // Rotation in degrees (default 0)
  motion?: DoodleMotion;  // Motion pattern (default static)
}

export interface SpringPlacement {
  x: number;
  y: number;
  direction: SpringDirection;
  strength?: number;   // Impulse multiplier (default 1.0)
  scale?: number;      // Visual scale (default 1.0)
}

export interface PortalPair {
  entry: { x: number; y: number };
  exit: { x: number; y: number };
  exitDirection?: PortalExitDirection;  // Direction to launch player (default 'straight')
  exitSpeed?: number;                   // Speed multiplier on exit (default 1.0)
  scale?: number;                       // Visual scale for both portals (default 1.0)
}

// Wind zone direction
export type WindDirection = 'left' | 'right' | 'up' | 'down';

// Wind zones apply continuous force to player (World 5+)
export interface WindZonePlacement {
  x: number;           // Center X
  y: number;           // Center Y
  width: number;       // Zone width
  height: number;      // Zone height
  direction: WindDirection;
  strength: number;    // Force applied per frame (0.1 = gentle, 0.5 = strong)
}

export interface ArcadeLevel {
  id: number;
  landingTarget: number;  // 409 + id (level 1 = 410, level 10 = 419)
  doodles: DoodlePlacement[];
  springs: SpringPlacement[];
  portal: PortalPair | null;
  windZones?: WindZonePlacement[];  // Wind zones (World 5+)
}

// Star objectives
// NOTE: allDoodles is a PASS REQUIREMENT, not a star!
// Stars are: ★ landedInZone, ★★ inOrder (circular Bomb Jack style)
export interface StarObjectives {
  allDoodles: boolean;      // PASS REQUIREMENT - collected all doodles
  inOrder: boolean;         // ★★ - collected in circular sequence (Bomb Jack style)
  landedInZone: boolean;    // ★ - landed beyond target
}

// Runtime state for current arcade session
export interface ArcadeState {
  currentLevelId: number;
  starsPerLevel: Record<number, StarObjectives>;  // levelId -> stars earned
  // Current throw tracking
  doodlesCollected: number[];      // sequence numbers collected this throw
  expectedNextSequence: number | null;  // null until first pickup, then expected next in cycle
  streakCount: number;             // consecutive correct pickups in circular order
  totalDoodlesInLevel: number;     // cached for circular wrap calculation
}

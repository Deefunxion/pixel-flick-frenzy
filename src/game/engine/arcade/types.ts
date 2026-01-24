// src/game/engine/arcade/types.ts
export type DoodleSize = 'small' | 'large';
export type SpringDirection = 'up' | 'up-left' | 'up-right' | 'down';

export interface DoodlePlacement {
  x: number;
  y: number;
  size: DoodleSize;
  sprite: string;      // e.g., 'paperplane', 'star', 'globe'
  sequence: number;    // 1, 2, 3... for order objective
}

export interface SpringPlacement {
  x: number;
  y: number;
  direction: SpringDirection;
}

export interface PortalPair {
  entry: { x: number; y: number };
  exit: { x: number; y: number };
}

export interface ArcadeLevel {
  id: number;
  landingTarget: number;  // 409 + id (level 1 = 410, level 10 = 419)
  doodles: DoodlePlacement[];
  springs: SpringPlacement[];
  portal: PortalPair | null;
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

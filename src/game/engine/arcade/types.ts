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

// Star objectives (independent - any one = level pass)
export interface StarObjectives {
  allDoodles: boolean;      // ★ - collected all (any order)
  inOrder: boolean;         // ★★ - collected in sequence (includes ★)
  landedInZone: boolean;    // ★★★ - landed beyond target
}

// Runtime state for current arcade session
export interface ArcadeState {
  currentLevelId: number;
  starsPerLevel: Record<number, StarObjectives>;  // levelId -> stars earned
  // Current throw tracking
  doodlesCollected: number[];   // sequence numbers collected this throw
  lastCollectedSequence: number; // for order tracking
  sequenceBroken: boolean;       // collected out of order
}

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
  rotation?: number;   // Rotation in degrees (default 0)
  breakable?: boolean; // One-use spring that breaks after use (World 17+)
  // Timing for on/off cycling (World 7+)
  timing?: {
    onDuration: number;   // Time active in ms
    offDuration: number;  // Time inactive in ms
    offset?: number;      // Initial phase offset in ms (default 0)
  };
}

export interface PortalPair {
  entry: { x: number; y: number };
  exit: { x: number; y: number };
  exitDirection?: PortalExitDirection;  // Direction to launch player (default 'straight')
  exitSpeed?: number;                   // Speed multiplier on exit (default 1.0)
  scale?: number;                       // Visual scale for both portals (default 1.0)
  colorId?: number;                     // Color identifier for multi-portal levels (0-5)
  // Timing for on/off cycling (World 12+)
  timing?: {
    onDuration: number;   // Time portal is active in ms
    offDuration: number;  // Time portal is inactive in ms
    offset?: number;      // Initial phase offset in ms (default 0)
  };
}

// Wind zones apply continuous force to player (World 5+)
// Uses angle-based direction (0-360°) and circular radius
export interface WindZonePlacement {
  x: number;           // Center X
  y: number;           // Center Y
  radius: number;      // Circular effect area
  angle: number;       // Force direction in degrees (0=right, 90=down, 180=left, 270=up)
  strength: number;    // Force per frame (0.1 = gentle, 0.5 = strong)
  scale?: number;      // Visual sprite scale (default 1.0)
}

// Hazard motion patterns (World 8-9)
export type HazardMotion =
  | { type: 'static' }
  | { type: 'linear'; axis: 'x' | 'y'; range: number; speed: number }
  | { type: 'circular'; radius: number; speed: number };

// Hazards damage the player on contact (World 8+)
export interface HazardPlacement {
  x: number;           // Center X
  y: number;           // Center Y
  radius: number;      // Collision radius
  sprite: string;      // 'spike', 'saw', 'fire'
  motion?: HazardMotion;  // Motion pattern (default static)
  scale?: number;      // Visual scale (default 1.0)
  rotation?: number;   // Rotation in degrees (default 0)
}

// Gravity wells attract or repel the player (World 10-11)
export type GravityWellType = 'attract' | 'repel';

export interface GravityWellPlacement {
  x: number;           // Center X
  y: number;           // Center Y
  type: GravityWellType;
  radius: number;      // Effect radius
  strength: number;    // Force strength (0.1 = weak, 0.5 = strong)
  scale?: number;      // Visual scale (default 1.0)
  rotation?: number;   // Visual rotation in degrees (default 0)
}

// Friction zone types (World 15-16)
export type FrictionType = 'ice' | 'sticky';

export interface FrictionZonePlacement {
  x: number;           // Center X
  y: number;           // Center Y (typically at ground level)
  width: number;       // Zone width
  type: FrictionType;  // 'ice' = low friction, 'sticky' = high friction
  strength?: number;   // Friction multiplier (default: ice=0.2, sticky=3.0)
}

export interface ArcadeLevel {
  id: number;
  landingTarget: number;  // 409 + id (level 1 = 410, level 10 = 419)
  doodles: DoodlePlacement[];
  springs: SpringPlacement[];
  portal: PortalPair | null;              // Single portal (backward compatible)
  portals?: PortalPair[];                 // Multiple portals (World 13+)
  windZones?: WindZonePlacement[];        // Wind zones (World 5+)
  hazards?: HazardPlacement[];            // Hazards (World 8+)
  gravityWells?: GravityWellPlacement[];  // Gravity wells (World 10+)
  frictionZones?: FrictionZonePlacement[]; // Friction zones (World 15+)
}

// Star objectives
// NEW: 3 stars total
// ★ landedInZone - landed beyond target
// ★★ allDoodles - collected all doodles (any order)
// ★★★ inOrder - collected all doodles in circular sequence (Bomb Jack style)
export interface StarObjectives {
  landedInZone: boolean;    // ★ - landed beyond target
  allDoodles: boolean;      // ★★ - collected all doodles (any order)
  inOrder: boolean;         // ★★★ - collected in circular sequence (Bomb Jack style)
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

// src/game/engine/arcade/doodles.ts
import type { DoodlePlacement, DoodleSize, DoodleMotion, PortalPair } from './types';
import {
  createMovingDoodleState,
  updateMovingDoodle,
  resetMovingDoodlePhase,
  type MovingDoodleState,
} from './movingDoodles';
import { detectStrokeBoundaries } from './calligraphicScale';

export interface Doodle {
  x: number;           // Base position (for static) or updated position (for motion)
  y: number;
  baseX: number;       // Original placement position
  baseY: number;
  hitRadius: number;
  displaySize: number;
  sprite: string;
  sequence: number;
  collected: boolean;
  collectedAt: number;  // timestamp for animation
  scale: number;        // Custom scale multiplier
  rotation: number;     // Rotation in degrees
  motionState: MovingDoodleState | null;  // Motion state for moving doodles
  isStrokeStart: boolean;  // For glow effect on stroke starts
}

const SIZE_CONFIG: Record<DoodleSize, { hitRadius: number; displaySize: number }> = {
  small: { hitRadius: 28, displaySize: 20 },
  large: { hitRadius: 36, displaySize: 36 },
};

export function createDoodleFromPlacement(
  placement: DoodlePlacement,
  isStrokeStart: boolean = false
): Doodle {
  const config = SIZE_CONFIG[placement.size];
  const scale = placement.scale ?? 1.0;
  const motion = placement.motion ?? { type: 'static' as const };

  // Create motion state if not static
  const motionState = motion.type !== 'static'
    ? createMovingDoodleState(placement.x, placement.y, motion)
    : null;

  return {
    x: placement.x,
    y: placement.y,
    baseX: placement.x,
    baseY: placement.y,
    hitRadius: config.hitRadius * scale,
    displaySize: config.displaySize * scale,
    sprite: placement.sprite,
    sequence: placement.sequence,
    collected: false,
    collectedAt: 0,
    scale,
    rotation: placement.rotation ?? 0,
    motionState,
    isStrokeStart,
  };
}

export function createDoodlesFromLevel(
  placements: DoodlePlacement[],
  portals: PortalPair[] = []
): Doodle[] {
  const strokes = detectStrokeBoundaries(placements, portals);
  const strokeStartIndices = new Set(strokes.map(s => s.startIndex));

  return placements.map((placement, index) =>
    createDoodleFromPlacement(placement, strokeStartIndices.has(index))
  );
}

export function checkDoodleCollision(
  playerX: number,
  playerY: number,
  doodle: Doodle
): boolean {
  if (doodle.collected) return false;

  const dx = playerX - doodle.x;
  const dy = playerY - doodle.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  return distance < doodle.hitRadius;
}

export function collectDoodle(doodle: Doodle, timestamp: number): void {
  doodle.collected = true;
  doodle.collectedAt = timestamp;
}

export function resetDoodles(doodles: Doodle[]): void {
  doodles.forEach(d => {
    d.collected = false;
    d.collectedAt = 0;
    // Reset motion to base position
    if (d.motionState) {
      resetMovingDoodlePhase(d.motionState);
      d.x = d.baseX;
      d.y = d.baseY;
    }
  });
}

/**
 * Update all doodle positions based on motion
 * @param doodles - Array of doodles
 * @param deltaMs - Time elapsed in milliseconds
 */
export function updateDoodles(doodles: Doodle[], deltaMs: number): void {
  for (const doodle of doodles) {
    if (doodle.motionState && !doodle.collected) {
      updateMovingDoodle(doodle.motionState, deltaMs);
      doodle.x = doodle.motionState.currentX;
      doodle.y = doodle.motionState.currentY;
    }
  }
}

export function countCollectedDoodles(doodles: Doodle[]): number {
  return doodles.filter(d => d.collected).length;
}

export function allDoodlesCollected(doodles: Doodle[]): boolean {
  return doodles.length === 0 || doodles.every(d => d.collected);
}

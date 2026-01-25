// src/game/engine/arcade/hazards.ts
import type { HazardPlacement, HazardMotion } from './types';

// Runtime hazard state (includes motion)
export interface Hazard {
  baseX: number;
  baseY: number;
  currentX: number;
  currentY: number;
  radius: number;
  sprite: string;
  motion: HazardMotion;
  phase: number;  // 0-1 cycle position
  scale: number;
}

const DEFAULT_RADIUS = 15;

/**
 * Create a hazard from placement data
 */
export function createHazardFromPlacement(placement: HazardPlacement): Hazard {
  const scale = placement.scale ?? 1.0;
  const motion = placement.motion ?? { type: 'static' };

  return {
    baseX: placement.x,
    baseY: placement.y,
    currentX: placement.x,
    currentY: placement.y,
    radius: (placement.radius ?? DEFAULT_RADIUS) * scale,
    sprite: placement.sprite,
    motion,
    phase: 0,
    scale,
  };
}

/**
 * Create hazards from level placements
 */
export function createHazardsFromLevel(placements: HazardPlacement[]): Hazard[] {
  return placements.map(createHazardFromPlacement);
}

/**
 * Update hazard positions based on motion patterns
 */
export function updateHazards(hazards: Hazard[], deltaMs: number): void {
  for (const hazard of hazards) {
    if (hazard.motion.type === 'static') continue;

    const speed = hazard.motion.type === 'linear'
      ? hazard.motion.speed
      : hazard.motion.speed;

    const deltaPhase = (deltaMs / 1000) * (speed / 60);
    hazard.phase = (hazard.phase + deltaPhase) % 1;

    if (hazard.motion.type === 'linear') {
      const offset = Math.sin(hazard.phase * Math.PI * 2) * hazard.motion.range;
      if (hazard.motion.axis === 'x') {
        hazard.currentX = hazard.baseX + offset;
        hazard.currentY = hazard.baseY;
      } else {
        hazard.currentX = hazard.baseX;
        hazard.currentY = hazard.baseY + offset;
      }
    } else if (hazard.motion.type === 'circular') {
      const angle = hazard.phase * Math.PI * 2;
      hazard.currentX = hazard.baseX + Math.cos(angle) * hazard.motion.radius;
      hazard.currentY = hazard.baseY + Math.sin(angle) * hazard.motion.radius;
    }
  }
}

/**
 * Check if player collides with any hazard
 * Returns true if hit (player should fail)
 */
export function checkHazardCollision(
  playerX: number,
  playerY: number,
  hazards: Hazard[]
): Hazard | null {
  for (const hazard of hazards) {
    const dx = playerX - hazard.currentX;
    const dy = playerY - hazard.currentY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < hazard.radius) {
      return hazard;
    }
  }
  return null;
}

/**
 * Check collision with single hazard
 */
export function checkSingleHazardCollision(
  playerX: number,
  playerY: number,
  hazard: Hazard
): boolean {
  const dx = playerX - hazard.currentX;
  const dy = playerY - hazard.currentY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance < hazard.radius;
}

/**
 * Reset all hazards to initial positions
 */
export function resetHazards(hazards: Hazard[]): void {
  for (const hazard of hazards) {
    hazard.phase = 0;
    hazard.currentX = hazard.baseX;
    hazard.currentY = hazard.baseY;
  }
}

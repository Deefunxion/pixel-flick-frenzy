// src/game/engine/arcade/gravityWells.ts
import type { GravityWellPlacement, GravityWellType } from './types';

// Runtime gravity well state
export interface GravityWell {
  x: number;
  y: number;
  type: GravityWellType;
  radius: number;
  strength: number;
  scale: number;
}

/**
 * Create a gravity well from placement data
 */
export function createGravityWellFromPlacement(placement: GravityWellPlacement): GravityWell {
  const scale = placement.scale ?? 1.0;

  return {
    x: placement.x,
    y: placement.y,
    type: placement.type,
    radius: placement.radius * scale,
    strength: placement.strength,
    scale,
  };
}

/**
 * Create gravity wells from level placements
 */
export function createGravityWellsFromLevel(placements: GravityWellPlacement[]): GravityWell[] {
  return placements.map(createGravityWellFromPlacement);
}

/**
 * Check if player is within gravity well's influence
 */
export function isInGravityWell(
  playerX: number,
  playerY: number,
  well: GravityWell
): boolean {
  const dx = playerX - well.x;
  const dy = playerY - well.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance < well.radius;
}

/**
 * Calculate the force vector from a gravity well
 * Returns {fx, fy} to be added to velocity
 */
export function getGravityWellForce(
  playerX: number,
  playerY: number,
  well: GravityWell
): { fx: number; fy: number } {
  const dx = well.x - playerX;
  const dy = well.y - playerY;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance === 0 || distance >= well.radius) {
    return { fx: 0, fy: 0 };
  }

  // Normalize direction
  const nx = dx / distance;
  const ny = dy / distance;

  // Force is stronger closer to center (inverse linear falloff)
  const falloff = 1 - (distance / well.radius);
  const forceMagnitude = well.strength * falloff;

  // Attract pulls toward center, repel pushes away
  const direction = well.type === 'attract' ? 1 : -1;

  return {
    fx: nx * forceMagnitude * direction,
    fy: ny * forceMagnitude * direction,
  };
}

/**
 * Apply gravity well forces to player velocity
 * Returns true if any force was applied
 */
export function applyGravityWellForces(
  playerX: number,
  playerY: number,
  velocity: { vx: number; vy: number },
  wells: GravityWell[]
): boolean {
  let forceApplied = false;

  for (const well of wells) {
    if (isInGravityWell(playerX, playerY, well)) {
      const force = getGravityWellForce(playerX, playerY, well);
      velocity.vx += force.fx;
      velocity.vy += force.fy;
      forceApplied = true;
    }
  }

  return forceApplied;
}

/**
 * Get the closest gravity well to the player (for visual effects)
 */
export function getClosestGravityWell(
  playerX: number,
  playerY: number,
  wells: GravityWell[]
): { well: GravityWell; distance: number } | null {
  if (wells.length === 0) return null;

  let closest: GravityWell | null = null;
  let minDistance = Infinity;

  for (const well of wells) {
    const dx = playerX - well.x;
    const dy = playerY - well.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < minDistance && distance < well.radius) {
      minDistance = distance;
      closest = well;
    }
  }

  return closest ? { well: closest, distance: minDistance } : null;
}

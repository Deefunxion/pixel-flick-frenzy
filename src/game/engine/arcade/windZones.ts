// src/game/engine/arcade/windZones.ts
import type { WindZonePlacement, WindDirection } from './types';

export interface WindZone {
  x: number;
  y: number;
  width: number;
  height: number;
  direction: WindDirection;
  strength: number;
  // Computed bounds for fast collision
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/**
 * Create runtime wind zone from placement data
 */
export function createWindZoneFromPlacement(placement: WindZonePlacement): WindZone {
  const halfWidth = placement.width / 2;
  const halfHeight = placement.height / 2;

  return {
    x: placement.x,
    y: placement.y,
    width: placement.width,
    height: placement.height,
    direction: placement.direction,
    strength: placement.strength,
    // Pre-compute bounds
    left: placement.x - halfWidth,
    right: placement.x + halfWidth,
    top: placement.y - halfHeight,
    bottom: placement.y + halfHeight,
  };
}

/**
 * Create multiple wind zones from level data
 */
export function createWindZonesFromLevel(placements: WindZonePlacement[] | undefined): WindZone[] {
  if (!placements) return [];
  return placements.map(createWindZoneFromPlacement);
}

/**
 * Check if player is inside a wind zone
 */
export function isInWindZone(
  playerX: number,
  playerY: number,
  zone: WindZone
): boolean {
  return (
    playerX >= zone.left &&
    playerX <= zone.right &&
    playerY >= zone.top &&
    playerY <= zone.bottom
  );
}

/**
 * Get wind force vector for a zone
 * Returns { fx, fy } force components
 */
export function getWindForce(zone: WindZone): { fx: number; fy: number } {
  switch (zone.direction) {
    case 'left':
      return { fx: -zone.strength, fy: 0 };
    case 'right':
      return { fx: zone.strength, fy: 0 };
    case 'up':
      return { fx: 0, fy: -zone.strength };
    case 'down':
      return { fx: 0, fy: zone.strength };
    default:
      return { fx: 0, fy: 0 };
  }
}

/**
 * Apply wind forces to player velocity
 * @param playerX - Player X position
 * @param playerY - Player Y position
 * @param velocity - Velocity object with vx, vy (modified in place)
 * @param zones - Array of wind zones
 * @returns True if player was affected by any wind
 */
export function applyWindForces(
  playerX: number,
  playerY: number,
  velocity: { vx: number; vy: number },
  zones: WindZone[]
): boolean {
  let affected = false;

  for (const zone of zones) {
    if (isInWindZone(playerX, playerY, zone)) {
      const force = getWindForce(zone);
      velocity.vx += force.fx;
      velocity.vy += force.fy;
      affected = true;
    }
  }

  return affected;
}

/**
 * Get all wind zones affecting a position
 */
export function getActiveWindZones(
  playerX: number,
  playerY: number,
  zones: WindZone[]
): WindZone[] {
  return zones.filter(zone => isInWindZone(playerX, playerY, zone));
}

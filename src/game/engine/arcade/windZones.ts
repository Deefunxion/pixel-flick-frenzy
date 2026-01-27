// src/game/engine/arcade/windZones.ts
import type { WindZonePlacement } from './types';

export interface WindZone {
  x: number;
  y: number;
  radius: number;      // Circular effect area
  angle: number;       // Force direction in degrees (0=right, 90=down, 180=left, 270=up)
  strength: number;
  scale: number;
  // Computed for fast collision
  radiusSquared: number;
}

/**
 * Create runtime wind zone from placement data
 */
export function createWindZoneFromPlacement(placement: WindZonePlacement): WindZone {
  const radius = placement.radius;
  return {
    x: placement.x,
    y: placement.y,
    radius,
    angle: placement.angle,
    strength: placement.strength,
    scale: placement.scale ?? 1.0,
    radiusSquared: radius * radius,
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
 * Check if player is inside a wind zone (circular)
 */
export function isInWindZone(
  playerX: number,
  playerY: number,
  zone: WindZone
): boolean {
  const dx = playerX - zone.x;
  const dy = playerY - zone.y;
  return (dx * dx + dy * dy) <= zone.radiusSquared;
}

/**
 * Get wind force vector for a zone using trigonometry
 * Returns { fx, fy } force components based on angle
 */
export function getWindForce(zone: WindZone): { fx: number; fy: number } {
  const radians = zone.angle * Math.PI / 180;
  return {
    fx: Math.cos(radians) * zone.strength,
    fy: Math.sin(radians) * zone.strength,
  };
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

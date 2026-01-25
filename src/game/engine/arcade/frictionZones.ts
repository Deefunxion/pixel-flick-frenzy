// src/game/engine/arcade/frictionZones.ts
import type { FrictionZonePlacement, FrictionType } from './types';

// Default friction values
const DEFAULT_FRICTION = {
  ice: 0.2,     // Very slippery (20% of normal friction)
  sticky: 3.0,  // Very grippy (300% of normal friction)
};

// Runtime friction zone state
export interface FrictionZone {
  x: number;
  y: number;
  width: number;
  height: number;  // Typically small (ground-level zone)
  type: FrictionType;
  frictionMultiplier: number;
}

const DEFAULT_HEIGHT = 10;  // Thin zone at ground level

/**
 * Create a friction zone from placement data
 */
export function createFrictionZoneFromPlacement(placement: FrictionZonePlacement): FrictionZone {
  const defaultStrength = DEFAULT_FRICTION[placement.type];

  return {
    x: placement.x,
    y: placement.y,
    width: placement.width,
    height: DEFAULT_HEIGHT,
    type: placement.type,
    frictionMultiplier: placement.strength ?? defaultStrength,
  };
}

/**
 * Create friction zones from level placements
 */
export function createFrictionZonesFromLevel(placements: FrictionZonePlacement[]): FrictionZone[] {
  return placements.map(createFrictionZoneFromPlacement);
}

/**
 * Check if a position is within a friction zone
 */
export function isInFrictionZone(
  playerX: number,
  playerY: number,
  zone: FrictionZone
): boolean {
  const halfWidth = zone.width / 2;
  const halfHeight = zone.height / 2;

  return (
    playerX >= zone.x - halfWidth &&
    playerX <= zone.x + halfWidth &&
    playerY >= zone.y - halfHeight &&
    playerY <= zone.y + halfHeight
  );
}

/**
 * Get the friction multiplier at a position
 * Returns 1.0 (normal friction) if not in any zone
 */
export function getFrictionMultiplier(
  playerX: number,
  playerY: number,
  zones: FrictionZone[]
): number {
  for (const zone of zones) {
    if (isInFrictionZone(playerX, playerY, zone)) {
      return zone.frictionMultiplier;
    }
  }
  return 1.0;  // Normal friction
}

/**
 * Get the friction zone the player is currently in (if any)
 */
export function getCurrentFrictionZone(
  playerX: number,
  playerY: number,
  zones: FrictionZone[]
): FrictionZone | null {
  for (const zone of zones) {
    if (isInFrictionZone(playerX, playerY, zone)) {
      return zone;
    }
  }
  return null;
}

/**
 * Apply friction modification during slide
 * baseFriction is the normal friction value (e.g., 0.96)
 * Returns modified friction for the current position
 */
export function applyFrictionModifier(
  baseFriction: number,
  playerX: number,
  playerY: number,
  zones: FrictionZone[]
): number {
  const multiplier = getFrictionMultiplier(playerX, playerY, zones);

  if (multiplier === 1.0) {
    return baseFriction;
  }

  // For ice (multiplier < 1): reduce friction (more slippery)
  // For sticky (multiplier > 1): increase friction (more grip)

  // Convert friction to "grip" factor (how much velocity is lost)
  // friction 0.96 means 4% velocity lost per frame
  const grip = 1 - baseFriction;  // 0.04

  // Modify grip by multiplier
  const modifiedGrip = grip * multiplier;

  // Convert back to friction
  // Clamp to prevent negative friction or friction > 1
  return Math.max(0.5, Math.min(0.999, 1 - modifiedGrip));
}

/**
 * Check if any friction zones exist in the level
 */
export function hasFrictionZones(zones: FrictionZone[]): boolean {
  return zones.length > 0;
}

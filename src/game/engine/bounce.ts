// src/game/engine/bounce.ts
/**
 * Bounce Surface System - Creates bank-shot puzzle trajectories
 *
 * Provides deterministic, telegraphed bounce points that enable
 * "weird but solvable" routes for pattern-solving gameplay.
 */

export interface BounceSurface {
  // Position
  x: number;
  y: number;
  radius: number;

  // Physics
  restitution: number;  // 0.65-0.9

  // State
  bouncedThisThrow: boolean;

  // Visual
  type: 'eraser' | 'cloud';
}

const DEFAULT_RESTITUTION = 0.75;
const MIN_SPEED_TO_BOUNCE = 1.5;

/**
 * Create a bounce surface
 */
export function createBounceSurface(
  x: number,
  y: number,
  radius: number = 20,
  restitution: number = DEFAULT_RESTITUTION,
  type: 'eraser' | 'cloud' = 'eraser'
): BounceSurface {
  return {
    x,
    y,
    radius,
    restitution,
    bouncedThisThrow: false,
    type,
  };
}

/**
 * Check if player collides with bounce surface
 */
export function checkBounceCollision(
  playerX: number,
  playerY: number,
  surface: BounceSurface
): boolean {
  if (surface.bouncedThisThrow) return false;

  const dx = playerX - surface.x;
  const dy = playerY - surface.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  return distance < surface.radius;
}

/**
 * Apply bounce physics - reflects velocity off normal
 */
export function applyBounce(
  state: { px: number; py: number; vx: number; vy: number },
  surface: BounceSurface
): boolean {
  const speed = Math.sqrt(state.vx * state.vx + state.vy * state.vy);

  // Too slow to bounce - just pass through
  if (speed < MIN_SPEED_TO_BOUNCE) {
    return false;
  }

  // Calculate normal from surface center to player
  const dx = state.px - surface.x;
  const dy = state.py - surface.y;
  const dist = Math.sqrt(dx * dx + dy * dy) || 1;
  const nx = dx / dist;
  const ny = dy / dist;

  // Reflect velocity: v' = v - 2 * dot(v, n) * n
  const dot = state.vx * nx + state.vy * ny;
  state.vx = (state.vx - 2 * dot * nx) * surface.restitution;
  state.vy = (state.vy - 2 * dot * ny) * surface.restitution;

  // Push player outside surface to prevent re-collision
  state.px = surface.x + nx * (surface.radius + 2);
  state.py = surface.y + ny * (surface.radius + 2);

  surface.bouncedThisThrow = true;

  return true;
}

/**
 * Generate a bounce surface for current throw (seeded placement)
 */
export function generateBounceSurface(seed: number): BounceSurface | null {
  // Seeded random
  let t = seed + 0x6D2B79F5;
  t = Math.imul(t ^ t >>> 15, t | 1);
  t ^= t + Math.imul(t ^ t >>> 7, t | 61);
  const random = () => {
    t = t + 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };

  // 60% chance to have a bounce surface
  if (random() > 0.6) return null;

  // Position in mid-trajectory zone (180-320)
  const x = 180 + random() * 140;
  const y = 80 + random() * 80; // Upper-mid area

  return createBounceSurface(
    x,
    y,
    18 + random() * 8,       // 18-26 radius
    0.7 + random() * 0.15,   // 0.7-0.85 restitution
    random() > 0.5 ? 'eraser' : 'cloud'
  );
}

/**
 * Reset bounce surface for new throw
 */
export function resetBounce(surface: BounceSurface | null): void {
  if (surface) {
    surface.bouncedThisThrow = false;
  }
}

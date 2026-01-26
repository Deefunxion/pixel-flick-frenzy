// src/game/engine/arcade/springs.ts
import type { SpringPlacement, SpringDirection } from './types';

// Timing configuration for timed springs
export interface SpringTiming {
  onDuration: number;   // Time active in ms
  offDuration: number;  // Time inactive in ms
  offset: number;       // Initial phase offset in ms
  cycleDuration: number; // Total cycle time (on + off)
}

export interface Spring {
  x: number;
  y: number;
  direction: SpringDirection;
  radius: number;
  force: number;
  scale: number;
  usedThisThrow: boolean;
  // Timing state
  timing: SpringTiming | null;  // null = always active
  isActive: boolean;            // Current active state (for timed springs)
  // Breakable state (World 17+)
  breakable: boolean;           // true = one-use spring that breaks permanently
  isBroken: boolean;            // true = spring has been broken (cannot be used again)
}

const DEFAULT_RADIUS = 18;
const DEFAULT_FORCE = 10;

// Sprite is rendered at radius * 2.5 (diameter), so visual radius = radius * 1.25
// To have collision cover ~80% of visual sprite, multiply by ~1.0
// But user feedback says hitbox feels too small, so we increase to 1.1 (88% of visual)
const COLLISION_RADIUS_MULTIPLIER = 1.1;

// Direction vectors (normalized)
const DIRECTION_VECTORS: Record<SpringDirection, { x: number; y: number }> = {
  up: { x: 0, y: -1 },
  'up-left': { x: -0.707, y: -0.707 },
  'up-right': { x: 0.707, y: -0.707 },
  down: { x: 0, y: 1 },
};

export function createSpringFromPlacement(placement: SpringPlacement): Spring {
  const scale = placement.scale ?? 1.0;
  const strength = placement.strength ?? 1.0;

  // Create timing if specified
  let timing: SpringTiming | null = null;
  if (placement.timing) {
    timing = {
      onDuration: placement.timing.onDuration,
      offDuration: placement.timing.offDuration,
      offset: placement.timing.offset ?? 0,
      cycleDuration: placement.timing.onDuration + placement.timing.offDuration,
    };
  }

  return {
    x: placement.x,
    y: placement.y,
    direction: placement.direction,
    radius: DEFAULT_RADIUS * scale,
    force: DEFAULT_FORCE * strength,
    scale,
    usedThisThrow: false,
    timing,
    isActive: true, // Start active (timing will update this)
    breakable: placement.breakable ?? false,
    isBroken: false,
  };
}

export function createSpringsFromLevel(placements: SpringPlacement[]): Spring[] {
  return placements.map(createSpringFromPlacement);
}

export function checkSpringCollision(
  playerX: number,
  playerY: number,
  spring: Spring
): boolean {
  // Spring must be active, not used this throw, and not broken
  if (!spring.isActive || spring.usedThisThrow || spring.isBroken) return false;

  const dx = playerX - spring.x;
  const dy = playerY - spring.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  // Use expanded collision radius to match ~80% of visual sprite
  const collisionRadius = spring.radius * COLLISION_RADIUS_MULTIPLIER;
  return distance < collisionRadius;
}

export function applySpringImpulse(
  spring: Spring,
  velocity: { vx: number; vy: number }
): void {
  const dir = DIRECTION_VECTORS[spring.direction];

  // Apply impulse in spring direction
  velocity.vx += dir.x * spring.force;
  velocity.vy += dir.y * spring.force;

  spring.usedThisThrow = true;

  // Break the spring if it's breakable (permanent destruction)
  if (spring.breakable) {
    spring.isBroken = true;
  }
}

export function resetSprings(springs: Spring[]): void {
  springs.forEach(s => {
    s.usedThisThrow = false;
    // Reset isActive based on timing (at time 0)
    if (s.timing) {
      const phase = s.timing.offset % s.timing.cycleDuration;
      s.isActive = phase < s.timing.onDuration;
    } else {
      s.isActive = true;
    }
  });
}

/**
 * Update spring timing states based on current time
 * @param springs - Array of springs
 * @param timeMs - Current game time in milliseconds
 */
export function updateSprings(springs: Spring[], timeMs: number): void {
  for (const spring of springs) {
    if (spring.timing) {
      // Calculate where we are in the cycle
      const adjustedTime = timeMs + spring.timing.offset;
      const cyclePosition = adjustedTime % spring.timing.cycleDuration;

      // Active during first part of cycle (onDuration)
      spring.isActive = cyclePosition < spring.timing.onDuration;
    }
    // Springs without timing are always active (unless used this throw)
  }
}

/**
 * Check if a spring is currently in its active phase
 */
export function isSpringActive(spring: Spring): boolean {
  return spring.isActive && !spring.usedThisThrow && !spring.isBroken;
}

/**
 * Check if a spring is broken (permanently destroyed)
 */
export function isSpringBroken(spring: Spring): boolean {
  return spring.isBroken;
}

/**
 * Reset all springs including broken state (for level restart)
 * Unlike resetSprings(), this also repairs broken springs
 */
export function resetSpringsForLevel(springs: Spring[]): void {
  springs.forEach(s => {
    s.usedThisThrow = false;
    s.isBroken = false;  // Repair broken springs
    // Reset isActive based on timing (at time 0)
    if (s.timing) {
      const phase = s.timing.offset % s.timing.cycleDuration;
      s.isActive = phase < s.timing.onDuration;
    } else {
      s.isActive = true;
    }
  });
}

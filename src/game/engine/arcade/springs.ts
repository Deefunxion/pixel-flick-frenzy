// src/game/engine/arcade/springs.ts
import type { SpringPlacement, SpringDirection } from './types';

export interface Spring {
  x: number;
  y: number;
  direction: SpringDirection;
  radius: number;
  force: number;
  scale: number;
  usedThisThrow: boolean;
}

const DEFAULT_RADIUS = 18;
const DEFAULT_FORCE = 10;

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
  return {
    x: placement.x,
    y: placement.y,
    direction: placement.direction,
    radius: DEFAULT_RADIUS * scale,
    force: DEFAULT_FORCE * strength,
    scale,
    usedThisThrow: false,
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
  if (spring.usedThisThrow) return false;

  const dx = playerX - spring.x;
  const dy = playerY - spring.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  return distance < spring.radius;
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
}

export function resetSprings(springs: Spring[]): void {
  springs.forEach(s => {
    s.usedThisThrow = false;
  });
}

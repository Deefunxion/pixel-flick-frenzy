// src/game/engine/arcade/doodles.ts
import type { DoodlePlacement, DoodleSize } from './types';

export interface Doodle {
  x: number;
  y: number;
  hitRadius: number;
  displaySize: number;
  sprite: string;
  sequence: number;
  collected: boolean;
  collectedAt: number;  // timestamp for animation
}

const SIZE_CONFIG: Record<DoodleSize, { hitRadius: number; displaySize: number }> = {
  small: { hitRadius: 28, displaySize: 7 },   // 65% smaller (was 20)
  large: { hitRadius: 36, displaySize: 13 },  // 65% smaller (was 36)
};

export function createDoodleFromPlacement(placement: DoodlePlacement): Doodle {
  const config = SIZE_CONFIG[placement.size];
  return {
    x: placement.x,
    y: placement.y,
    hitRadius: config.hitRadius,
    displaySize: config.displaySize,
    sprite: placement.sprite,
    sequence: placement.sequence,
    collected: false,
    collectedAt: 0,
  };
}

export function createDoodlesFromLevel(placements: DoodlePlacement[]): Doodle[] {
  return placements.map(createDoodleFromPlacement);
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
  });
}

export function countCollectedDoodles(doodles: Doodle[]): number {
  return doodles.filter(d => d.collected).length;
}

export function allDoodlesCollected(doodles: Doodle[]): boolean {
  return doodles.length === 0 || doodles.every(d => d.collected);
}

// src/game/engine/__tests__/doodles.test.ts
import { describe, it, expect } from 'vitest';
import {
  createDoodleFromPlacement,
  checkDoodleCollision,
  type Doodle,
} from '../arcade/doodles';
import type { DoodlePlacement } from '../arcade/types';

describe('Doodle System', () => {
  it('should create doodle from placement', () => {
    const placement: DoodlePlacement = {
      x: 200,
      y: 100,
      size: 'large',
      sprite: 'paperplane',
      sequence: 1,
    };

    const doodle = createDoodleFromPlacement(placement);
    expect(doodle.x).toBe(200);
    expect(doodle.y).toBe(100);
    expect(doodle.hitRadius).toBe(18); // large = 18
    expect(doodle.collected).toBe(false);
  });

  it('should use smaller hitbox for small doodles', () => {
    const placement: DoodlePlacement = {
      x: 100,
      y: 80,
      size: 'small',
      sprite: 'star',
      sequence: 2,
    };

    const doodle = createDoodleFromPlacement(placement);
    expect(doodle.hitRadius).toBe(14); // small = 14
  });

  it('should detect collision when within radius', () => {
    const doodle: Doodle = {
      x: 200,
      y: 100,
      hitRadius: 16,
      displaySize: 32,
      sprite: 'star',
      sequence: 1,
      collected: false,
      collectedAt: 0,
    };

    // Direct hit
    expect(checkDoodleCollision(200, 100, doodle)).toBe(true);
    // Edge hit
    expect(checkDoodleCollision(214, 100, doodle)).toBe(true);
    // Just outside
    expect(checkDoodleCollision(220, 100, doodle)).toBe(false);
  });

  it('should not collide when already collected', () => {
    const doodle: Doodle = {
      x: 200,
      y: 100,
      hitRadius: 16,
      displaySize: 32,
      sprite: 'star',
      sequence: 1,
      collected: true,
      collectedAt: 1000,
    };

    expect(checkDoodleCollision(200, 100, doodle)).toBe(false);
  });
});

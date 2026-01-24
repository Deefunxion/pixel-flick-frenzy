// src/game/engine/__tests__/springs.test.ts
import { describe, it, expect } from 'vitest';
import {
  createSpringFromPlacement,
  checkSpringCollision,
  applySpringImpulse,
  type Spring,
} from '../arcade/springs';
import type { SpringPlacement } from '../arcade/types';

describe('Springs System', () => {
  it('should create spring from placement', () => {
    const placement: SpringPlacement = {
      x: 200,
      y: 100,
      direction: 'up',
    };

    const spring = createSpringFromPlacement(placement);
    expect(spring.x).toBe(200);
    expect(spring.direction).toBe('up');
    expect(spring.usedThisThrow).toBe(false);
  });

  it('should detect collision', () => {
    const spring: Spring = {
      x: 200,
      y: 100,
      direction: 'up',
      radius: 18,
      force: 10,
      usedThisThrow: false,
    };

    expect(checkSpringCollision(200, 100, spring)).toBe(true);
    expect(checkSpringCollision(250, 100, spring)).toBe(false);
  });

  it('should not collide when already used', () => {
    const spring: Spring = {
      x: 200,
      y: 100,
      direction: 'up',
      radius: 18,
      force: 10,
      usedThisThrow: true,
    };

    expect(checkSpringCollision(200, 100, spring)).toBe(false);
  });

  it('should apply upward impulse', () => {
    const spring: Spring = {
      x: 200,
      y: 100,
      direction: 'up',
      radius: 18,
      force: 10,
      usedThisThrow: false,
    };

    const velocity = { vx: 2, vy: 3 };
    applySpringImpulse(spring, velocity);

    expect(velocity.vy).toBeLessThan(0); // Upward
    expect(spring.usedThisThrow).toBe(true);
  });

  it('should apply diagonal impulse for up-right', () => {
    const spring: Spring = {
      x: 200,
      y: 100,
      direction: 'up-right',
      radius: 18,
      force: 10,
      usedThisThrow: false,
    };

    const velocity = { vx: 0, vy: 0 };
    applySpringImpulse(spring, velocity);

    expect(velocity.vx).toBeGreaterThan(0); // Rightward
    expect(velocity.vy).toBeLessThan(0);    // Upward
  });

  it('should apply downward impulse', () => {
    const spring: Spring = {
      x: 200,
      y: 100,
      direction: 'down',
      radius: 18,
      force: 10,
      usedThisThrow: false,
    };

    const velocity = { vx: 0, vy: -5 };
    applySpringImpulse(spring, velocity);

    expect(velocity.vy).toBeGreaterThan(0); // Downward
  });
});

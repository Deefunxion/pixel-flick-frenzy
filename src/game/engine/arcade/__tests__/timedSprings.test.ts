// src/game/engine/arcade/__tests__/timedSprings.test.ts
import { describe, it, expect } from 'vitest';
import {
  createSpringFromPlacement,
  checkSpringCollision,
  updateSprings,
  resetSprings,
  isSpringActive,
} from '../springs';
import type { SpringPlacement } from '../types';

describe('Timed Springs', () => {
  describe('createSpringFromPlacement', () => {
    it('creates spring without timing when not specified', () => {
      const placement: SpringPlacement = {
        x: 100,
        y: 150,
        direction: 'up',
      };

      const spring = createSpringFromPlacement(placement);

      expect(spring.timing).toBeNull();
      expect(spring.isActive).toBe(true);
    });

    it('creates spring with timing configuration', () => {
      const placement: SpringPlacement = {
        x: 100,
        y: 150,
        direction: 'up',
        timing: {
          onDuration: 1000,
          offDuration: 500,
          offset: 250,
        },
      };

      const spring = createSpringFromPlacement(placement);

      expect(spring.timing).not.toBeNull();
      expect(spring.timing!.onDuration).toBe(1000);
      expect(spring.timing!.offDuration).toBe(500);
      expect(spring.timing!.offset).toBe(250);
      expect(spring.timing!.cycleDuration).toBe(1500);
    });

    it('defaults offset to 0 when not specified', () => {
      const placement: SpringPlacement = {
        x: 100,
        y: 150,
        direction: 'up',
        timing: {
          onDuration: 1000,
          offDuration: 500,
        },
      };

      const spring = createSpringFromPlacement(placement);

      expect(spring.timing!.offset).toBe(0);
    });
  });

  describe('updateSprings', () => {
    it('does not affect springs without timing', () => {
      const springs = [
        createSpringFromPlacement({ x: 100, y: 100, direction: 'up' }),
      ];

      updateSprings(springs, 5000);

      expect(springs[0].isActive).toBe(true);
    });

    it('activates spring during onDuration phase', () => {
      const springs = [
        createSpringFromPlacement({
          x: 100, y: 100, direction: 'up',
          timing: { onDuration: 1000, offDuration: 500 },
        }),
      ];

      // At t=0, should be active (start of on phase)
      updateSprings(springs, 0);
      expect(springs[0].isActive).toBe(true);

      // At t=500, should still be active (middle of on phase)
      updateSprings(springs, 500);
      expect(springs[0].isActive).toBe(true);

      // At t=999, should still be active (end of on phase)
      updateSprings(springs, 999);
      expect(springs[0].isActive).toBe(true);
    });

    it('deactivates spring during offDuration phase', () => {
      const springs = [
        createSpringFromPlacement({
          x: 100, y: 100, direction: 'up',
          timing: { onDuration: 1000, offDuration: 500 },
        }),
      ];

      // At t=1000, should be inactive (start of off phase)
      updateSprings(springs, 1000);
      expect(springs[0].isActive).toBe(false);

      // At t=1250, should be inactive (middle of off phase)
      updateSprings(springs, 1250);
      expect(springs[0].isActive).toBe(false);

      // At t=1499, should be inactive (end of off phase)
      updateSprings(springs, 1499);
      expect(springs[0].isActive).toBe(false);
    });

    it('cycles back to active after full cycle', () => {
      const springs = [
        createSpringFromPlacement({
          x: 100, y: 100, direction: 'up',
          timing: { onDuration: 1000, offDuration: 500 }, // cycle = 1500ms
        }),
      ];

      // At t=1500, should be active again (new cycle)
      updateSprings(springs, 1500);
      expect(springs[0].isActive).toBe(true);

      // At t=3000, should be active (2 full cycles)
      updateSprings(springs, 3000);
      expect(springs[0].isActive).toBe(true);
    });

    it('respects offset for staggered timing', () => {
      const springs = [
        createSpringFromPlacement({
          x: 100, y: 100, direction: 'up',
          timing: { onDuration: 500, offDuration: 500, offset: 500 },
        }),
      ];

      // At t=0, with offset 500, effective time is 500 = start of off phase
      updateSprings(springs, 0);
      expect(springs[0].isActive).toBe(false);

      // At t=500, effective time is 1000 = start of new cycle = on phase
      updateSprings(springs, 500);
      expect(springs[0].isActive).toBe(true);
    });
  });

  describe('checkSpringCollision', () => {
    it('returns false when spring is inactive', () => {
      const placement: SpringPlacement = {
        x: 100, y: 100, direction: 'up',
        timing: { onDuration: 500, offDuration: 500 },
      };
      const spring = createSpringFromPlacement(placement);

      // Make spring inactive
      updateSprings([spring], 500); // Off phase
      expect(spring.isActive).toBe(false);

      // Player at spring position should not collide
      const collision = checkSpringCollision(100, 100, spring);
      expect(collision).toBe(false);
    });

    it('returns true when spring is active and in range', () => {
      const placement: SpringPlacement = {
        x: 100, y: 100, direction: 'up',
        timing: { onDuration: 500, offDuration: 500 },
      };
      const spring = createSpringFromPlacement(placement);

      // Spring is active at t=0
      updateSprings([spring], 0);
      expect(spring.isActive).toBe(true);

      const collision = checkSpringCollision(100, 100, spring);
      expect(collision).toBe(true);
    });
  });

  describe('resetSprings', () => {
    it('resets isActive based on timing at time 0', () => {
      const springs = [
        createSpringFromPlacement({
          x: 100, y: 100, direction: 'up',
          timing: { onDuration: 500, offDuration: 500 },
        }),
      ];

      // Move to off phase
      updateSprings(springs, 600);
      expect(springs[0].isActive).toBe(false);

      // Reset should restore to initial state at t=0
      resetSprings(springs);
      expect(springs[0].isActive).toBe(true);
      expect(springs[0].usedThisThrow).toBe(false);
    });

    it('respects offset when resetting', () => {
      const springs = [
        createSpringFromPlacement({
          x: 100, y: 100, direction: 'up',
          timing: { onDuration: 500, offDuration: 500, offset: 500 },
        }),
      ];

      // With offset 500, at t=0 the spring starts in off phase
      resetSprings(springs);
      expect(springs[0].isActive).toBe(false);
    });
  });

  describe('isSpringActive', () => {
    it('returns true for active, unused spring', () => {
      const spring = createSpringFromPlacement({
        x: 100, y: 100, direction: 'up',
      });

      expect(isSpringActive(spring)).toBe(true);
    });

    it('returns false for used spring', () => {
      const spring = createSpringFromPlacement({
        x: 100, y: 100, direction: 'up',
      });
      spring.usedThisThrow = true;

      expect(isSpringActive(spring)).toBe(false);
    });

    it('returns false for inactive timed spring', () => {
      const spring = createSpringFromPlacement({
        x: 100, y: 100, direction: 'up',
        timing: { onDuration: 500, offDuration: 500 },
      });

      updateSprings([spring], 600); // Off phase
      expect(isSpringActive(spring)).toBe(false);
    });
  });
});

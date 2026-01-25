// src/game/engine/arcade/__tests__/breakableSprings.test.ts
import { describe, it, expect } from 'vitest';
import {
  createSpringFromPlacement,
  checkSpringCollision,
  applySpringImpulse,
  resetSprings,
  resetSpringsForLevel,
  isSpringActive,
  isSpringBroken,
} from '../springs';
import type { SpringPlacement } from '../types';

describe('Breakable Springs', () => {
  describe('createSpringFromPlacement', () => {
    it('creates non-breakable spring by default', () => {
      const placement: SpringPlacement = {
        x: 100,
        y: 150,
        direction: 'up',
      };

      const spring = createSpringFromPlacement(placement);

      expect(spring.breakable).toBe(false);
      expect(spring.isBroken).toBe(false);
    });

    it('creates breakable spring when specified', () => {
      const placement: SpringPlacement = {
        x: 100,
        y: 150,
        direction: 'up',
        breakable: true,
      };

      const spring = createSpringFromPlacement(placement);

      expect(spring.breakable).toBe(true);
      expect(spring.isBroken).toBe(false);
    });
  });

  describe('checkSpringCollision', () => {
    it('returns false when spring is broken', () => {
      const placement: SpringPlacement = {
        x: 100,
        y: 100,
        direction: 'up',
        breakable: true,
      };
      const spring = createSpringFromPlacement(placement);
      spring.isBroken = true;

      // Player at spring position should not collide with broken spring
      const collision = checkSpringCollision(100, 100, spring);
      expect(collision).toBe(false);
    });

    it('returns true when breakable spring is not broken', () => {
      const placement: SpringPlacement = {
        x: 100,
        y: 100,
        direction: 'up',
        breakable: true,
      };
      const spring = createSpringFromPlacement(placement);

      const collision = checkSpringCollision(100, 100, spring);
      expect(collision).toBe(true);
    });
  });

  describe('applySpringImpulse', () => {
    it('does not break non-breakable spring', () => {
      const placement: SpringPlacement = {
        x: 100,
        y: 100,
        direction: 'up',
      };
      const spring = createSpringFromPlacement(placement);
      const velocity = { vx: 0, vy: 0 };

      applySpringImpulse(spring, velocity);

      expect(spring.usedThisThrow).toBe(true);
      expect(spring.isBroken).toBe(false);
    });

    it('breaks breakable spring after use', () => {
      const placement: SpringPlacement = {
        x: 100,
        y: 100,
        direction: 'up',
        breakable: true,
      };
      const spring = createSpringFromPlacement(placement);
      const velocity = { vx: 0, vy: 0 };

      applySpringImpulse(spring, velocity);

      expect(spring.usedThisThrow).toBe(true);
      expect(spring.isBroken).toBe(true);
    });

    it('still applies impulse when breaking', () => {
      const placement: SpringPlacement = {
        x: 100,
        y: 100,
        direction: 'up',
        breakable: true,
        strength: 1.5,
      };
      const spring = createSpringFromPlacement(placement);
      const velocity = { vx: 5, vy: 5 };

      applySpringImpulse(spring, velocity);

      // Should have applied upward impulse (negative vy)
      expect(velocity.vy).toBeLessThan(5);
    });
  });

  describe('resetSprings (per-throw reset)', () => {
    it('does NOT repair broken springs', () => {
      const placement: SpringPlacement = {
        x: 100,
        y: 100,
        direction: 'up',
        breakable: true,
      };
      const spring = createSpringFromPlacement(placement);

      // Use and break the spring
      applySpringImpulse(spring, { vx: 0, vy: 0 });
      expect(spring.isBroken).toBe(true);

      // Reset for next throw
      resetSprings([spring]);

      // Spring should still be broken
      expect(spring.isBroken).toBe(true);
      expect(spring.usedThisThrow).toBe(false);
    });

    it('resets usedThisThrow for non-broken breakable springs', () => {
      const placement: SpringPlacement = {
        x: 100,
        y: 100,
        direction: 'up',
        breakable: true,
      };
      const spring = createSpringFromPlacement(placement);

      // Manually set usedThisThrow without breaking
      spring.usedThisThrow = true;

      resetSprings([spring]);

      expect(spring.usedThisThrow).toBe(false);
      expect(spring.isBroken).toBe(false);
    });
  });

  describe('resetSpringsForLevel (level restart)', () => {
    it('repairs broken springs', () => {
      const placement: SpringPlacement = {
        x: 100,
        y: 100,
        direction: 'up',
        breakable: true,
      };
      const spring = createSpringFromPlacement(placement);

      // Use and break the spring
      applySpringImpulse(spring, { vx: 0, vy: 0 });
      expect(spring.isBroken).toBe(true);

      // Reset for level restart
      resetSpringsForLevel([spring]);

      // Spring should be repaired
      expect(spring.isBroken).toBe(false);
      expect(spring.usedThisThrow).toBe(false);
    });

    it('resets timing state correctly', () => {
      const placement: SpringPlacement = {
        x: 100,
        y: 100,
        direction: 'up',
        breakable: true,
        timing: { onDuration: 1000, offDuration: 500, offset: 0 },
      };
      const spring = createSpringFromPlacement(placement);

      spring.isActive = false;
      spring.isBroken = true;

      resetSpringsForLevel([spring]);

      expect(spring.isActive).toBe(true);
      expect(spring.isBroken).toBe(false);
    });
  });

  describe('isSpringActive', () => {
    it('returns false for broken spring', () => {
      const placement: SpringPlacement = {
        x: 100,
        y: 100,
        direction: 'up',
        breakable: true,
      };
      const spring = createSpringFromPlacement(placement);
      spring.isBroken = true;

      expect(isSpringActive(spring)).toBe(false);
    });

    it('returns true for unbroken breakable spring', () => {
      const placement: SpringPlacement = {
        x: 100,
        y: 100,
        direction: 'up',
        breakable: true,
      };
      const spring = createSpringFromPlacement(placement);

      expect(isSpringActive(spring)).toBe(true);
    });
  });

  describe('isSpringBroken', () => {
    it('returns false for unbroken spring', () => {
      const placement: SpringPlacement = {
        x: 100,
        y: 100,
        direction: 'up',
        breakable: true,
      };
      const spring = createSpringFromPlacement(placement);

      expect(isSpringBroken(spring)).toBe(false);
    });

    it('returns true for broken spring', () => {
      const placement: SpringPlacement = {
        x: 100,
        y: 100,
        direction: 'up',
        breakable: true,
      };
      const spring = createSpringFromPlacement(placement);
      applySpringImpulse(spring, { vx: 0, vy: 0 });

      expect(isSpringBroken(spring)).toBe(true);
    });
  });

  describe('gameplay scenario', () => {
    it('breakable spring can only be used once across multiple throws', () => {
      const placement: SpringPlacement = {
        x: 100,
        y: 100,
        direction: 'up',
        breakable: true,
      };
      const spring = createSpringFromPlacement(placement);

      // First throw: use the spring
      expect(checkSpringCollision(100, 100, spring)).toBe(true);
      applySpringImpulse(spring, { vx: 0, vy: 0 });
      expect(spring.isBroken).toBe(true);

      // Reset for second throw
      resetSprings([spring]);

      // Second throw: spring should still be broken
      expect(checkSpringCollision(100, 100, spring)).toBe(false);
      expect(isSpringActive(spring)).toBe(false);

      // Level restart: spring should be repaired
      resetSpringsForLevel([spring]);
      expect(checkSpringCollision(100, 100, spring)).toBe(true);
      expect(isSpringActive(spring)).toBe(true);
    });
  });
});

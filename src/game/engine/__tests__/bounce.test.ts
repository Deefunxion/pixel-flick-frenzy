// src/game/engine/__tests__/bounce.test.ts
import { describe, it, expect } from 'vitest';
import {
  createBounceSurface,
  checkBounceCollision,
  applyBounce,
  type BounceSurface,
} from '../bounce';

describe('Bounce Surface', () => {
  describe('checkBounceCollision', () => {
    it('detects collision when within radius', () => {
      const surface: BounceSurface = createBounceSurface(200, 100, 25);
      const result = checkBounceCollision(210, 105, surface);
      expect(result).toBe(true);
    });

    it('returns false when outside radius', () => {
      const surface: BounceSurface = createBounceSurface(200, 100, 25);
      const result = checkBounceCollision(250, 100, surface);
      expect(result).toBe(false);
    });

    it('returns false if already bounced this throw', () => {
      const surface: BounceSurface = createBounceSurface(200, 100, 25);
      surface.bouncedThisThrow = true;
      const result = checkBounceCollision(200, 100, surface);
      expect(result).toBe(false);
    });
  });

  describe('applyBounce', () => {
    it('reflects velocity off normal', () => {
      const surface: BounceSurface = createBounceSurface(200, 100, 25);
      const state = {
        px: 210,
        py: 100,
        vx: 5,
        vy: 2,
      };

      applyBounce(state as any, surface);

      // Velocity should be reflected and reduced by restitution
      expect(state.vx).toBeLessThan(5);
      expect(surface.bouncedThisThrow).toBe(true);
    });

    it('applies restitution coefficient', () => {
      const surface: BounceSurface = createBounceSurface(200, 100, 25, 0.8);
      const state = { px: 200, py: 100, vx: 0, vy: 5 };

      applyBounce(state as any, surface);

      // Speed should be reduced by restitution
      expect(Math.abs(state.vy)).toBeCloseTo(5 * 0.8, 1);
    });
  });
});

// src/game/engine/__tests__/airThrottle.test.ts
import { describe, it, expect } from 'vitest';
import { applyAirThrottle, calculateEdgeMultiplier } from '../precision';
import { createInitialState } from '../state';

describe('Air Throttle (Bomb Jack-like lift)', () => {
  describe('Hold (upward acceleration, stamina cost/sec)', () => {
    it('applies upward acceleration when holding', () => {
      const state = createInitialState({ reduceFx: false });
      state.px = 200;
      state.vy = 2; // Falling
      state.stamina = 100;
      const deltaTime = 1/60;

      const result = applyAirThrottle(state, deltaTime);

      expect(result.applied).toBe(true);
      expect(state.vy).toBeLessThan(2); // Velocity reduced (upward push)
    });

    it('costs stamina based on edge multiplier', () => {
      const state = createInitialState({ reduceFx: false });
      state.px = 410; // ~1.73x multiplier
      state.vy = 2;
      state.stamina = 100;
      const deltaTime = 1/60;

      const result = applyAirThrottle(state, deltaTime);
      const edgeMult = calculateEdgeMultiplier(410);
      const expectedCost = 20 * edgeMult * deltaTime; // THROTTLE_COST_PER_SEC = 20

      expect(result.applied).toBe(true);
      expect(state.stamina).toBeCloseTo(100 - expectedCost, 1);
    });

    it('denies if stamina insufficient', () => {
      const state = createInitialState({ reduceFx: false });
      state.px = 200;
      state.vy = 2;
      state.stamina = 0.1;
      const deltaTime = 1/60;

      const result = applyAirThrottle(state, deltaTime);

      expect(result.applied).toBe(false);
      expect(result.denied).toBe(true);
      expect(state.vy).toBe(2); // Unchanged
    });

    it('respects throttle time cap', () => {
      const state = createInitialState({ reduceFx: false });
      state.px = 200;
      state.vy = 2;
      state.stamina = 100;
      state.airControl = { throttleActive: true, throttleMsUsed: 1500, brakeTaps: 0 }; // 1.5s used
      const deltaTime = 1/60;

      const result = applyAirThrottle(state, deltaTime);

      // Should still work but with cap awareness
      expect(result.applied).toBe(true);
    });
  });
});

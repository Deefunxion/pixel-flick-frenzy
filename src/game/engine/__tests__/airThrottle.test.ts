// src/game/engine/__tests__/airThrottle.test.ts
// Tests for TRUE Bomb Jack-like float mechanic
import { describe, it, expect } from 'vitest';
import { applyAirThrottle, calculateEdgeMultiplier } from '../precision';
import { createInitialState } from '../state';

describe('Air Float (TRUE Bomb Jack mechanic)', () => {
  describe('Hold = Float (reduces gravity, does NOT add height)', () => {
    it('returns gravityMultiplier < 1 when floating (does NOT modify vy)', () => {
      const state = createInitialState({ reduceFx: false });
      state.px = 200;
      state.vy = 2; // Falling
      state.stamina = 100;
      const deltaTime = 1/60;

      const initialVy = state.vy;
      const result = applyAirThrottle(state, deltaTime);

      expect(result.applied).toBe(true);
      // KEY: vy should be UNCHANGED - float doesn't add height!
      expect(state.vy).toBe(initialVy);
      // Instead, we return a gravity multiplier < 1
      expect(result.gravityMultiplier).toBeLessThan(1);
      expect(result.gravityMultiplier).toBeCloseTo(0.3, 1); // FLOAT_GRAVITY_MULT = 0.3
    });

    it('costs stamina based on edge multiplier (FLOAT_COST_PER_SEC = 12)', () => {
      const state = createInitialState({ reduceFx: false });
      state.px = 410; // ~1.73x multiplier
      state.vy = 2;
      state.stamina = 100;
      const deltaTime = 1/60;

      const result = applyAirThrottle(state, deltaTime);
      const edgeMult = calculateEdgeMultiplier(410);
      const expectedCost = 12 * edgeMult * deltaTime; // FLOAT_COST_PER_SEC = 12

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
      expect(result.gravityMultiplier).toBe(1.0); // Normal gravity when denied
      expect(state.vy).toBe(2); // Unchanged
    });

    it('denies when float time cap exceeded (MAX_FLOAT_TIME_MS = 2500)', () => {
      const state = createInitialState({ reduceFx: false });
      state.px = 200;
      state.vy = 2;
      state.stamina = 100;
      state.airControl = { throttleActive: true, throttleMsUsed: 2500, brakeTaps: 0 };
      const deltaTime = 1/60;

      const result = applyAirThrottle(state, deltaTime);

      // Should be denied because time cap exceeded
      expect(result.applied).toBe(false);
      expect(result.denied).toBe(true);
      expect(result.gravityMultiplier).toBe(1.0);
    });

    it('allows float when under time cap', () => {
      const state = createInitialState({ reduceFx: false });
      state.px = 200;
      state.vy = 2;
      state.stamina = 100;
      state.airControl = { throttleActive: true, throttleMsUsed: 2000, brakeTaps: 0 };
      const deltaTime = 1/60;

      const result = applyAirThrottle(state, deltaTime);

      expect(result.applied).toBe(true);
      expect(result.gravityMultiplier).toBeCloseTo(0.3, 1);
    });
  });
});

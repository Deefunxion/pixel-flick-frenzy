import { describe, it, expect } from 'vitest';
import { applyAirBrake, calculateEdgeMultiplier } from '../precision';
import { createInitialState } from '../state';

describe('Edge Multiplier', () => {
  it('returns 1.0 for positions at or below 350', () => {
    expect(calculateEdgeMultiplier(0)).toBe(1.0);
    expect(calculateEdgeMultiplier(300)).toBe(1.0);
    expect(calculateEdgeMultiplier(350)).toBe(1.0);
  });

  it('increases quadratically for positions above 350', () => {
    // At 380: 1 + ((380-350)/70)^2 = 1 + (30/70)^2 ≈ 1.18
    expect(calculateEdgeMultiplier(380)).toBeCloseTo(1.18, 1);

    // At 400: 1 + ((400-350)/70)^2 = 1 + (50/70)^2 ≈ 1.51
    expect(calculateEdgeMultiplier(400)).toBeCloseTo(1.51, 1);

    // At 410: 1 + ((410-350)/70)^2 = 1 + (60/70)^2 ≈ 1.73
    expect(calculateEdgeMultiplier(410)).toBeCloseTo(1.73, 1);

    // At 419: 1 + ((419-350)/70)^2 = 1 + (69/70)^2 ≈ 1.97
    expect(calculateEdgeMultiplier(419)).toBeCloseTo(1.97, 1);
  });

  it('reaches approximately 2.0 at cliff edge (420)', () => {
    // At 420: 1 + ((420-350)/70)^2 = 1 + 1 = 2.0
    expect(calculateEdgeMultiplier(420)).toBe(2.0);
  });
});

describe('Air Brake', () => {
  describe('Tap (5% reduction, 5 stamina base)', () => {
    it('reduces velocity by 5% on tap in safe zone', () => {
      const state = createInitialState({ reduceFx: false });
      state.px = 300; // Safe zone
      state.vx = 10;
      state.vy = -5;
      state.stamina = 100;

      const result = applyAirBrake(state, 'tap');

      expect(result.applied).toBe(true);
      expect(state.vx).toBeCloseTo(9.5);
      expect(state.vy).toBeCloseTo(-4.75);
      expect(state.stamina).toBe(95); // 5 * 1.0 multiplier
    });

    // FIX 6: Air brake also uses edge multiplier for consistency
    it('costs more stamina near the edge', () => {
      const state = createInitialState({ reduceFx: false });
      state.px = 410; // ~1.73x multiplier
      state.vx = 10;
      state.vy = -5;
      state.stamina = 100;

      const result = applyAirBrake(state, 'tap');
      const edgeMult = calculateEdgeMultiplier(410);
      const expectedCost = Math.ceil(5 * edgeMult);

      expect(result.applied).toBe(true);
      expect(state.stamina).toBe(100 - expectedCost);
    });

    it('does not apply if stamina insufficient for edge-scaled cost', () => {
      const state = createInitialState({ reduceFx: false });
      state.px = 415; // Higher multiplier
      state.vx = 10;
      state.vy = -5;
      state.stamina = 4; // Not enough for scaled cost

      const result = applyAirBrake(state, 'tap');

      expect(result.applied).toBe(false);
      expect(result.denied).toBe(true);
      expect(state.vx).toBe(10);
    });
  });

  describe('Hold (3% reduction per frame, 15 stamina/sec base)', () => {
    it('reduces velocity by 3% per frame on hold', () => {
      const state = createInitialState({ reduceFx: false });
      state.px = 300;
      state.vx = 10;
      state.vy = -5;
      state.stamina = 100;
      const deltaTime = 1/60; // 60fps

      const result = applyAirBrake(state, 'hold', deltaTime);

      expect(result.applied).toBe(true);
      expect(state.vx).toBeCloseTo(9.7);
      expect(state.vy).toBeCloseTo(-4.85);
      expect(state.stamina).toBeCloseTo(100 - 15 * 1.0 * deltaTime);
    });

    it('drains to 0 and stops if insufficient stamina', () => {
      const state = createInitialState({ reduceFx: false });
      state.px = 300;
      state.vx = 10;
      state.stamina = 0.1;
      const deltaTime = 1/60;

      const result = applyAirBrake(state, 'hold', deltaTime);

      expect(result.applied).toBe(false);
      expect(result.denied).toBe(true);
      expect(state.stamina).toBe(0.1); // Unchanged
    });
  });
});

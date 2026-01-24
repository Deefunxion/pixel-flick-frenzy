// src/game/engine/__tests__/airThrottle.test.ts
// Tests for ZENO Air Control System (Custom Bomb Jack-style)
import { describe, it, expect } from 'vitest';
import {
  registerFloatTap,
  calculateTapGravity,
  applyHardBrake,
  calculateEdgeMultiplier,
} from '../precision';
import { createInitialState } from '../state';

describe('Zeno Air Control System', () => {
  describe('registerFloatTap', () => {
    it('adds tap timestamp to recentTapTimes', () => {
      const state = createInitialState({ reduceFx: false });
      state.stamina = 100;

      const result = registerFloatTap(state, 1000);

      expect(result.applied).toBe(true);
      expect(state.airControl.recentTapTimes).toContain(1000);
    });

    it('costs small amount of stamina per tap', () => {
      const state = createInitialState({ reduceFx: false });
      state.px = 200; // Edge multiplier = 1
      state.stamina = 100;

      registerFloatTap(state, 1000);

      // TAP_STAMINA_COST = 2, ceil(2 * 1) = 2
      expect(state.stamina).toBe(98);
    });

    it('costs more stamina near edge', () => {
      const state = createInitialState({ reduceFx: false });
      state.px = 410; // Edge multiplier ~1.73
      state.stamina = 100;

      registerFloatTap(state, 1000);

      const edgeMult = calculateEdgeMultiplier(410);
      const expectedCost = Math.ceil(2 * edgeMult);
      expect(state.stamina).toBe(100 - expectedCost);
    });

    it('denies if stamina insufficient', () => {
      const state = createInitialState({ reduceFx: false });
      state.stamina = 1;

      const result = registerFloatTap(state, 1000);

      expect(result.applied).toBe(false);
      expect(result.denied).toBe(true);
    });

    it('cleans old taps outside window', () => {
      const state = createInitialState({ reduceFx: false });
      state.stamina = 100;
      state.airControl.recentTapTimes = [100, 200, 300]; // Old taps

      // TAP_WINDOW_MS = 400, so taps older than 1000-400=600 are removed
      registerFloatTap(state, 1000);

      // Old taps (100, 200, 300) are all older than 600, so removed
      // Only the new tap (1000) remains
      expect(state.airControl.recentTapTimes).toEqual([1000]);
    });
  });

  describe('calculateTapGravity', () => {
    it('returns heavy gravity (2.0) when no recent taps', () => {
      const state = createInitialState({ reduceFx: false });
      state.airControl.recentTapTimes = [];

      const gravity = calculateTapGravity(state, 1000);

      expect(gravity).toBe(2.0); // HEAVY_GRAVITY_MULT
    });

    it('returns reduced gravity with recent taps', () => {
      const state = createInitialState({ reduceFx: false });
      // 3 taps within window
      state.airControl.recentTapTimes = [800, 900, 950];

      const gravity = calculateTapGravity(state, 1000);

      // Should be between min and max float gravity
      expect(gravity).toBeLessThan(2.0);
      expect(gravity).toBeGreaterThan(0.15);
    });

    it('returns best float gravity with rapid tapping', () => {
      const state = createInitialState({ reduceFx: false });
      // 6+ taps within window = best float
      state.airControl.recentTapTimes = [700, 750, 800, 850, 900, 950];

      const gravity = calculateTapGravity(state, 1000);

      // Should be close to FLOAT_MIN_GRAVITY = 0.15
      expect(gravity).toBeCloseTo(0.15, 1);
    });

    it('cleans old taps and recalculates', () => {
      const state = createInitialState({ reduceFx: false });
      // Mix of old and recent taps
      state.airControl.recentTapTimes = [100, 200, 800, 900]; // 100, 200 are old

      const gravity = calculateTapGravity(state, 1000);

      // Only 2 recent taps (800, 900), so intermediate gravity
      expect(gravity).toBeLessThan(2.0);
      expect(gravity).toBeGreaterThan(0.15);

      // recentTapTimes should be cleaned
      expect(state.airControl.recentTapTimes).toEqual([800, 900]);
    });
  });

  describe('applyHardBrake', () => {
    it('rapidly decelerates velocity', () => {
      const state = createInitialState({ reduceFx: false });
      state.px = 200;
      state.vx = 5;
      state.vy = 3;
      state.stamina = 100;

      const result = applyHardBrake(state, 1/60);

      expect(result.applied).toBe(true);
      // HARD_BRAKE_DECEL = 0.6
      expect(state.vx).toBeCloseTo(5 * 0.6, 1);
      expect(state.vy).toBeCloseTo(3 * 0.6, 1);
    });

    it('costs stamina based on edge multiplier', () => {
      const state = createInitialState({ reduceFx: false });
      state.px = 410;
      state.vx = 5;
      state.vy = 3;
      state.stamina = 100;

      applyHardBrake(state, 1/60);

      // HARD_BRAKE_COST_PER_SEC = 25
      const edgeMult = calculateEdgeMultiplier(410);
      const expectedCost = 25 * edgeMult * (1/60);
      expect(state.stamina).toBeCloseTo(100 - expectedCost, 1);
    });

    it('denies if stamina insufficient', () => {
      const state = createInitialState({ reduceFx: false });
      state.vx = 5;
      state.vy = 3;
      state.stamina = 0.1;

      const result = applyHardBrake(state, 1/60);

      expect(result.applied).toBe(false);
      expect(result.denied).toBe(true);
      expect(state.vx).toBe(5); // Unchanged
      expect(state.vy).toBe(3); // Unchanged
    });

    it('returns velocity multiplier', () => {
      const state = createInitialState({ reduceFx: false });
      state.vx = 5;
      state.vy = 3;
      state.stamina = 100;

      const result = applyHardBrake(state, 1/60);

      expect(result.velocityMultiplier).toBe(0.6); // HARD_BRAKE_DECEL
    });
  });
});

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

      // TAP_STAMINA_COST = 5, ceil(5 * 1) = 5
      expect(state.stamina).toBe(95);
    });

    it('costs more stamina near edge', () => {
      const state = createInitialState({ reduceFx: false });
      state.px = 410; // Edge multiplier ~1.73
      state.stamina = 100;

      registerFloatTap(state, 1000);

      const edgeMult = calculateEdgeMultiplier(410);
      const expectedCost = Math.ceil(5 * edgeMult); // TAP_STAMINA_COST = 5
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

    it('applies forward velocity boost when DESCENDING', () => {
      const state = createInitialState({ reduceFx: false });
      state.vx = 0; // Stopped (after brake)
      state.vy = 2; // Descending (positive vy)
      state.stamina = 100;

      const result = registerFloatTap(state, 1000);

      // TAP_VELOCITY_BOOST = 0.50 when descending
      expect(result.velocityBoost).toBe(0.50);
      expect(state.vx).toBe(0.50); // Restored forward momentum
      expect(state.vy).toBe(2);    // vy unchanged
    });

    it('NEUTRALIZES upward motion when ASCENDING', () => {
      const state = createInitialState({ reduceFx: false });
      state.vx = 5;
      state.vy = -3; // Ascending (negative vy)
      state.stamina = 100;

      const result = registerFloatTap(state, 1000);

      // Ascending: neutralize vy, no velocity boost
      expect(result.velocityBoost).toBe(0);
      expect(state.vx).toBe(5);    // vx unchanged
      expect(state.vy).toBe(0);    // vy neutralized to 0
    });

    it('caps velocity at MAX_VELOCITY when descending', () => {
      const state = createInitialState({ reduceFx: false });
      state.vx = 6.8; // Already near max
      state.vy = 1;   // Descending
      state.stamina = 100;

      const result = registerFloatTap(state, 1000);

      // MAX_VELOCITY = 7.0, TAP_VELOCITY_BOOST = 0.50
      // 6.8 + 0.50 = 7.30 → capped at 7.0
      expect(state.vx).toBe(7.0);
      expect(result.velocityBoost).toBeCloseTo(0.2, 1); // Actual boost was capped
    });
  });

  describe('calculateTapGravity', () => {
    it('returns heavy gravity (1.2) when no recent taps', () => {
      const state = createInitialState({ reduceFx: false });
      state.airControl.recentTapTimes = [];

      const gravity = calculateTapGravity(state, 1000);

      expect(gravity).toBe(1.2); // HEAVY_GRAVITY_MULT
    });

    it('returns reduced gravity with recent taps', () => {
      const state = createInitialState({ reduceFx: false });
      // 1 tap within window
      state.airControl.recentTapTimes = [950];

      const gravity = calculateTapGravity(state, 1000);

      // Should be between min (0.1) and max (0.3) float gravity
      expect(gravity).toBeLessThan(1.2);
      expect(gravity).toBeGreaterThanOrEqual(0.1);
    });

    it('returns best float gravity with rapid tapping', () => {
      const state = createInitialState({ reduceFx: false });
      // 2+ taps within window = best float (MAX_TAPS_FOR_BEST_FLOAT = 2)
      state.airControl.recentTapTimes = [900, 950];

      const gravity = calculateTapGravity(state, 1000);

      // Should be close to FLOAT_MIN_GRAVITY = 0.1
      expect(gravity).toBeCloseTo(0.1, 1);
    });

    it('cleans old taps and recalculates', () => {
      const state = createInitialState({ reduceFx: false });
      // Mix of old and recent taps
      state.airControl.recentTapTimes = [100, 200, 800, 900]; // 100, 200 are old

      const gravity = calculateTapGravity(state, 1000);

      // Only 2 recent taps (800, 900) = best float
      expect(gravity).toBeCloseTo(0.1, 1);

      // recentTapTimes should be cleaned
      expect(state.airControl.recentTapTimes).toEqual([800, 900]);
    });
  });

  describe('applyHardBrake', () => {
    it('applies gentle brake at start (holdFrames=0)', () => {
      const state = createInitialState({ reduceFx: false });
      state.px = 200;
      state.vx = 5;
      state.vy = 3;
      state.stamina = 100;

      // Just past threshold, holdFramesPastThreshold = 0
      const result = applyHardBrake(state, 0, 1/60);

      expect(result.applied).toBe(true);
      // BRAKE_MIN_DECEL = 0.98 (gentle start)
      expect(state.vx).toBeCloseTo(5 * 0.98, 2);
      expect(state.vy).toBeCloseTo(3 * 0.98, 2);
    });

    it('applies stronger brake after ramp (holdFrames=60)', () => {
      const state = createInitialState({ reduceFx: false });
      state.px = 200;
      state.vx = 5;
      state.vy = 3;
      state.stamina = 100;

      // Full ramp (60 frames = 1 second past threshold)
      const result = applyHardBrake(state, 60, 1/60);

      expect(result.applied).toBe(true);
      // BRAKE_MAX_DECEL = 0.80 (full brake)
      expect(state.vx).toBeCloseTo(5 * 0.80, 2);
      expect(state.vy).toBeCloseTo(3 * 0.80, 2);
    });

    it('costs stamina based on edge multiplier', () => {
      const state = createInitialState({ reduceFx: false });
      state.px = 410;
      state.vx = 5;
      state.vy = 3;
      state.stamina = 100;

      applyHardBrake(state, 0, 1/60);

      // HARD_BRAKE_COST_PER_SEC = 40
      const edgeMult = calculateEdgeMultiplier(410);
      const expectedCost = 40 * edgeMult * (1/60);
      expect(state.stamina).toBeCloseTo(100 - expectedCost, 1);
    });

    it('denies if stamina insufficient', () => {
      const state = createInitialState({ reduceFx: false });
      state.vx = 5;
      state.vy = 3;
      state.stamina = 0.1;

      const result = applyHardBrake(state, 0, 1/60);

      expect(result.applied).toBe(false);
      expect(result.denied).toBe(true);
      expect(state.vx).toBe(5); // Unchanged
      expect(state.vy).toBe(3); // Unchanged
    });

    it('returns progressive velocity multiplier', () => {
      const state = createInitialState({ reduceFx: false });
      state.vx = 5;
      state.vy = 3;
      state.stamina = 100;

      // At start (0 frames): decel = 0.98
      const result0 = applyHardBrake(state, 0, 1/60);
      expect(result0.velocityMultiplier).toBeCloseTo(0.98, 2);

      // Reset for next test
      state.vx = 5;
      state.vy = 3;

      // Halfway (30 frames): decel = 0.98 - 0.5*(0.98-0.80) = 0.89
      const result30 = applyHardBrake(state, 30, 1/60);
      expect(result30.velocityMultiplier).toBeCloseTo(0.89, 2);

      // Reset for next test
      state.vx = 5;
      state.vy = 3;

      // Full ramp (60 frames): decel = 0.80
      const result60 = applyHardBrake(state, 60, 1/60);
      expect(result60.velocityMultiplier).toBeCloseTo(0.80, 2);
    });
  });
});

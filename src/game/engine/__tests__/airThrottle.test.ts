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

      // TAP_STAMINA_COST = 3, ceil(3 * 1) = 3
      expect(state.stamina).toBe(97);
    });

    it('costs more stamina near edge', () => {
      const state = createInitialState({ reduceFx: false });
      state.px = 410; // Edge multiplier ~1.73
      state.stamina = 100;

      registerFloatTap(state, 1000);

      const edgeMult = calculateEdgeMultiplier(410);
      const expectedCost = Math.ceil(3 * edgeMult); // TAP_STAMINA_COST = 3
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

  describe('Directional tap behavior (Bomb Jack style)', () => {
    it('should reset vx to 0 and add boost when moving LEFT (vx < 0)', () => {
      const state = createInitialState({ reduceFx: false });
      state.vx = -3;  // Moving left
      state.vy = 2;   // Falling
      state.stamina = 100;
      state.airControl.recentTapTimes = [];

      registerFloatTap(state, 1000);

      expect(state.vx).toBeCloseTo(0.8);  // Reset + boost (TAP_VELOCITY_BOOST)
      expect(state.vy).toBe(0);            // Stop falling
    });

    it('should KEEP vx and only stop vy when moving RIGHT (vx > 0)', () => {
      const state = createInitialState({ reduceFx: false });
      state.vx = 3;   // Moving right
      state.vy = 2;   // Falling
      state.stamina = 100;
      state.airControl.recentTapTimes = [900]; // Not fresh tap

      registerFloatTap(state, 1000);

      expect(state.vx).toBeCloseTo(3.8);  // Keep 3 + add boost 0.8
      expect(state.vy).toBe(0);            // Stop falling
    });

    it('should KEEP vx and stop vy when vx is 0 (stopped)', () => {
      const state = createInitialState({ reduceFx: false });
      state.vx = 0;   // Stopped
      state.vy = 2;   // Falling
      state.stamina = 100;
      state.airControl.recentTapTimes = [900];

      registerFloatTap(state, 1000);

      expect(state.vx).toBeCloseTo(0.8);  // 0 + boost
      expect(state.vy).toBe(0);            // Stop falling
    });

    it('should cap vx at FLOAT_MAX_VELOCITY when moving right', () => {
      const state = createInitialState({ reduceFx: false });
      state.vx = 4.2;  // Near cap (4.5)
      state.vy = 1;
      state.stamina = 100;
      state.airControl.recentTapTimes = [900];

      registerFloatTap(state, 1000);

      expect(state.vx).toBe(4.5);  // Capped, not 4.2 + 0.8 = 5.0
      expect(state.vy).toBe(0);
    });

    it('should stop vy on fresh tap even when moving right', () => {
      const state = createInitialState({ reduceFx: false });
      state.vx = 5;   // Moving right fast
      state.vy = 4;   // Falling fast
      state.stamina = 100;
      state.airControl.recentTapTimes = [];  // Fresh tap (no recent taps)

      registerFloatTap(state, 1000);

      expect(state.vx).toBeGreaterThanOrEqual(5);  // Keep or add boost
      expect(state.vy).toBe(0);                     // Stop falling
    });
  });

  describe('calculateTapGravity', () => {
    it('returns heavy gravity (0.6) when no recent taps', () => {
      const state = createInitialState({ reduceFx: false });
      state.airControl.recentTapTimes = [];

      const gravity = calculateTapGravity(state, 1000);

      expect(gravity).toBe(0.6); // HEAVY_GRAVITY_MULT (50% reduction from 1.2)
    });

    it('returns reduced gravity with recent taps', () => {
      const state = createInitialState({ reduceFx: false });
      // 1 tap within window
      state.airControl.recentTapTimes = [950];

      const gravity = calculateTapGravity(state, 1000);

      // Should be between min (0.08) and max (0.30) float gravity
      expect(gravity).toBeLessThan(0.6);
      expect(gravity).toBeGreaterThanOrEqual(0.08);
    });

    it('returns best float gravity with rapid tapping', () => {
      const state = createInitialState({ reduceFx: false });
      // 3+ taps within window = best float (MAX_TAPS_FOR_BEST_FLOAT = 3)
      state.airControl.recentTapTimes = [850, 900, 950];

      const gravity = calculateTapGravity(state, 1000);

      // Should be FLOAT_MIN_GRAVITY = 0.08
      expect(gravity).toBeCloseTo(0.08, 5);
    });

    it('cleans old taps and recalculates', () => {
      const state = createInitialState({ reduceFx: false });
      // Mix of old and recent taps - taps older than 1 second (TAP_HISTORY_MS) get removed
      state.airControl.recentTapTimes = [500, 600, 1800, 1900]; // 500, 600 are old (>1sec before 2000)

      const gravity = calculateTapGravity(state, 2000);

      // Only 2 recent taps (1800, 1900) within window (250ms)
      expect(gravity).toBeGreaterThan(0.08); // Not best float (need 3 taps)
      expect(gravity).toBeLessThan(0.6);     // But still floating

      // recentTapTimes should be cleaned (keeping 1-second history from 1000-2000)
      expect(state.airControl.recentTapTimes).toEqual([1800, 1900]);
    });
  });

  describe('Lighter gravity multipliers (Bomb Jack style)', () => {
    it('should have HEAVY_GRAVITY_MULT at 0.6 (was 1.2)', () => {
      // No input = 60% gravity (was 120%)
      const state = createInitialState({ reduceFx: false });
      state.airControl.recentTapTimes = []; // No taps
      const gravity = calculateTapGravity(state, 1000);
      expect(gravity).toBe(0.6);
    });

    it('should have FLOAT_MAX_GRAVITY at 0.30 (was 0.60)', () => {
      // Single tap = 30% gravity
      const state = createInitialState({ reduceFx: false });
      state.airControl.recentTapTimes = [900]; // 1 tap within window
      const gravity = calculateTapGravity(state, 1000);
      expect(gravity).toBe(0.30);
    });

    it('should have FLOAT_MIN_GRAVITY at 0.08 (was 0.15)', () => {
      // 3+ taps = 8% gravity (best float)
      const state = createInitialState({ reduceFx: false });
      state.airControl.recentTapTimes = [850, 900, 950]; // 3 taps within window
      const gravity = calculateTapGravity(state, 1000);
      expect(gravity).toBeCloseTo(0.08, 5);
    });

    it('should have RAPID_FLAP_GRAVITY at 0.015 (was 0.03)', () => {
      // 7+ taps/sec = 1.5% gravity (almost horizontal)
      const state = createInitialState({ reduceFx: false });
      // 8 taps in ~1 second = 8 taps/sec
      state.airControl.recentTapTimes = [100, 200, 300, 400, 500, 600, 700, 800];
      const gravity = calculateTapGravity(state, 850);
      expect(gravity).toBe(0.015);
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

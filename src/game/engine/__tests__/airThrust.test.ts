import { describe, it, expect } from 'vitest';
import { applyAirThrust } from '../precision';
import { createInitialState } from '../state';
import { calculateEdgeMultiplier } from '../precision';

// NOTE: applyAirThrust is no longer used in the game loop (replaced by applyAirThrottle).
// These tests verify the function still works correctly with current constants:
// AIR_THRUST_VX_BOOST = 1.0, AIR_THRUST_BASE_COST = 6, AIR_THRUST_MAX_VX_MULT = 1.6
describe('Air Thrust (Forward Velocity Boost) - Legacy', () => {
  describe('applyAirThrust', () => {
    it('adds 1.0 to vx on tap', () => {
      const state = createInitialState({ reduceFx: false });
      state.px = 300; // Safe zone
      state.stamina = 100;
      state.vx = 5;
      state.initialSpeed = 8;

      applyAirThrust(state);

      expect(state.vx).toBe(6); // 5 + 1.0 = 6
    });

    it('costs 6 stamina in safe zone', () => {
      const state = createInitialState({ reduceFx: false });
      state.px = 300;
      state.stamina = 100;
      state.vx = 5;
      state.initialSpeed = 8;

      applyAirThrust(state);

      expect(state.stamina).toBe(94); // 100 - 6 = 94
    });

    it('costs more stamina near edge (uses edgeMultiplier)', () => {
      const state = createInitialState({ reduceFx: false });
      state.px = 410; // ~1.73x multiplier
      state.stamina = 100;
      state.vx = 5;
      state.initialSpeed = 8;

      applyAirThrust(state);

      const expectedCost = Math.ceil(6 * calculateEdgeMultiplier(410));
      expect(state.stamina).toBe(100 - expectedCost);
    });

    it('returns denied: true when stamina insufficient', () => {
      const state = createInitialState({ reduceFx: false });
      state.px = 300;
      state.stamina = 2; // Not enough
      state.vx = 5;
      state.initialSpeed = 8;

      const result = applyAirThrust(state);

      expect(result.applied).toBe(false);
      expect(result.denied).toBe(true);
      expect(state.vx).toBe(5); // Unchanged
    });

    it('caps vx at 1.6 * initialSpeed', () => {
      const state = createInitialState({ reduceFx: false });
      state.px = 300;
      state.stamina = 100;
      state.vx = 11.8; // Already near cap
      state.initialSpeed = 8; // Cap = 12.8

      applyAirThrust(state);

      expect(state.vx).toBe(12.8); // Boosted then capped at 1.6 * 8 = 12.8
    });

    it('returns denied when already at velocity cap', () => {
      const state = createInitialState({ reduceFx: false });
      state.px = 300;
      state.stamina = 100;
      state.vx = 12.8; // At cap
      state.initialSpeed = 8; // Cap = 12.8

      const result = applyAirThrust(state);

      expect(result.applied).toBe(false);
      expect(result.denied).toBe(true);
      expect(state.vx).toBe(12.8); // Unchanged
      expect(state.stamina).toBe(100); // No stamina consumed
    });

    it('allows multiple taps up to the cap', () => {
      const state = createInitialState({ reduceFx: false });
      state.px = 300;
      state.stamina = 100;
      state.vx = 5;
      state.initialSpeed = 8; // Cap = 12.8

      // First tap: 5 -> 6
      applyAirThrust(state);
      expect(state.vx).toBe(6);

      // Second tap: 6 -> 7
      applyAirThrust(state);
      expect(state.vx).toBe(7);

      // Third tap: 7 -> 8
      applyAirThrust(state);
      expect(state.vx).toBe(8);

      // Stamina should be 100 - 18 = 82
      expect(state.stamina).toBe(82);
    });
  });
});

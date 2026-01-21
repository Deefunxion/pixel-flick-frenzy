import { describe, it, expect } from 'vitest';
import { applyAirThrust } from '../precision';
import { createInitialState } from '../state';
import { calculateEdgeMultiplier } from '../precision';

describe('Air Thrust (Forward Velocity Boost)', () => {
  describe('applyAirThrust', () => {
    it('adds 0.5 to vx on tap', () => {
      const state = createInitialState({ reduceFx: false });
      state.px = 300; // Safe zone
      state.stamina = 100;
      state.vx = 5;
      state.initialSpeed = 8;

      applyAirThrust(state);

      expect(state.vx).toBe(5.5);
    });

    it('costs 5 stamina in safe zone', () => {
      const state = createInitialState({ reduceFx: false });
      state.px = 300;
      state.stamina = 100;
      state.vx = 5;
      state.initialSpeed = 8;

      applyAirThrust(state);

      expect(state.stamina).toBe(95);
    });

    it('costs more stamina near edge (uses edgeMultiplier)', () => {
      const state = createInitialState({ reduceFx: false });
      state.px = 410; // ~1.73x multiplier
      state.stamina = 100;
      state.vx = 5;
      state.initialSpeed = 8;

      applyAirThrust(state);

      const expectedCost = Math.ceil(5 * calculateEdgeMultiplier(410));
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

    it('caps vx at 1.5 * initialSpeed', () => {
      const state = createInitialState({ reduceFx: false });
      state.px = 300;
      state.stamina = 100;
      state.vx = 11; // Already near cap
      state.initialSpeed = 8; // Cap = 12

      applyAirThrust(state);

      expect(state.vx).toBe(11.5); // Boosted to 11.5

      // Try again - should be capped at 12
      applyAirThrust(state);
      expect(state.vx).toBe(12); // Capped at 1.5 * 8 = 12
    });

    it('returns denied when already at velocity cap', () => {
      const state = createInitialState({ reduceFx: false });
      state.px = 300;
      state.stamina = 100;
      state.vx = 12; // At cap
      state.initialSpeed = 8; // Cap = 12

      const result = applyAirThrust(state);

      expect(result.applied).toBe(false);
      expect(result.denied).toBe(true);
      expect(state.vx).toBe(12); // Unchanged
      expect(state.stamina).toBe(100); // No stamina consumed
    });

    it('allows multiple taps up to the cap', () => {
      const state = createInitialState({ reduceFx: false });
      state.px = 300;
      state.stamina = 100;
      state.vx = 5;
      state.initialSpeed = 8; // Cap = 12

      // First tap: 5 -> 5.5
      applyAirThrust(state);
      expect(state.vx).toBe(5.5);

      // Second tap: 5.5 -> 6
      applyAirThrust(state);
      expect(state.vx).toBe(6);

      // Third tap: 6 -> 6.5
      applyAirThrust(state);
      expect(state.vx).toBe(6.5);

      // Stamina should be 100 - 15 = 85
      expect(state.stamina).toBe(85);
    });
  });
});

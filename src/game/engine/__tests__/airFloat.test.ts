import { describe, it, expect } from 'vitest';
import { applyAirFloat } from '../precision';
import { createInitialState } from '../state';
import { calculateEdgeMultiplier } from '../precision';

describe('Air Float (Gravity Reduction)', () => {
  describe('applyAirFloat', () => {
    it('sets gravityMultiplier to 0.5 and floatDuration to 0.3', () => {
      const state = createInitialState({ reduceFx: false });
      state.px = 300; // Safe zone
      state.stamina = 100;

      applyAirFloat(state);

      expect(state.gravityMultiplier).toBe(0.5);
      expect(state.floatDuration).toBe(0.3);
    });

    it('costs 5 stamina in safe zone', () => {
      const state = createInitialState({ reduceFx: false });
      state.px = 300;
      state.stamina = 100;

      applyAirFloat(state);

      expect(state.stamina).toBe(95);
    });

    it('costs more stamina near edge (uses edgeMultiplier)', () => {
      const state = createInitialState({ reduceFx: false });
      state.px = 410; // ~1.73x multiplier
      state.stamina = 100;

      applyAirFloat(state);

      const expectedCost = Math.ceil(5 * calculateEdgeMultiplier(410));
      expect(state.stamina).toBe(100 - expectedCost);
    });

    it('returns denied: true when stamina insufficient', () => {
      const state = createInitialState({ reduceFx: false });
      state.px = 300;
      state.stamina = 2; // Not enough

      const result = applyAirFloat(state);

      expect(result.applied).toBe(false);
      expect(result.denied).toBe(true);
      expect(state.gravityMultiplier).toBe(1); // Unchanged
    });

    it('does not stack - multiple calls just refresh duration', () => {
      const state = createInitialState({ reduceFx: false });
      state.px = 300;
      state.stamina = 100;

      applyAirFloat(state);
      expect(state.gravityMultiplier).toBe(0.5);

      applyAirFloat(state);
      expect(state.gravityMultiplier).toBe(0.5); // Still 0.5, not 0.25
      expect(state.floatDuration).toBe(0.3); // Reset to 0.3
    });
  });
});

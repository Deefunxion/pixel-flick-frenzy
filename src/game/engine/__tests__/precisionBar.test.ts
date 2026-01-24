import { describe, it, expect, beforeEach } from 'vitest';
import {
  shouldActivatePrecisionBar,
  calculatePrecisionProgress,
  calculatePrecisionTimeScale,
  getDynamicDecimalPrecision,
  getPbMarkerPosition,
} from '../precisionBar';
import type { GameState } from '../types';

// Minimal mock state
function createMockState(overrides: Partial<GameState> = {}): GameState {
  return {
    px: 0,
    py: 0,
    best: 0,
    achievements: new Set<string>(),
    ...overrides,
  } as GameState;
}

describe('precisionBar', () => {
  describe('shouldActivatePrecisionBar', () => {
    it('returns false when px < 409.9', () => {
      const state = createMockState({ px: 409 });
      expect(shouldActivatePrecisionBar(state)).toBe(false);
    });

    it('returns true when px >= 409.9 (no py check)', () => {
      // py check removed - flying/sliding is checked by caller in update.ts
      const state = createMockState({ px: 410, py: 220 }); // py=220 is ground level
      expect(shouldActivatePrecisionBar(state)).toBe(true);
    });

    it('returns true without any achievement (no gate)', () => {
      const state = createMockState({ px: 410, achievements: new Set() });
      expect(shouldActivatePrecisionBar(state)).toBe(true);
    });

    it('returns true when in precision zone', () => {
      const state = createMockState({ px: 415 });
      expect(shouldActivatePrecisionBar(state)).toBe(true);
    });

    it('returns true at exact threshold', () => {
      const state = createMockState({ px: 409.9 });
      expect(shouldActivatePrecisionBar(state)).toBe(true);
    });
  });

  describe('calculatePrecisionProgress', () => {
    it('returns 0 at px=410', () => {
      expect(calculatePrecisionProgress(410)).toBe(0);
    });

    it('returns 0.5 at px=415', () => {
      expect(calculatePrecisionProgress(415)).toBe(0.5);
    });

    it('returns 1 at px=420', () => {
      expect(calculatePrecisionProgress(420)).toBe(1);
    });

    it('clamps below 410 to 0', () => {
      expect(calculatePrecisionProgress(409)).toBe(0);
    });

    it('clamps above 420 to 1', () => {
      expect(calculatePrecisionProgress(421)).toBe(1);
    });
  });

  describe('calculatePrecisionTimeScale', () => {
    it('returns 1.0 at px=410', () => {
      expect(calculatePrecisionTimeScale(410)).toBeCloseTo(1.0);
    });

    it('returns ~0.55 at px=415', () => {
      expect(calculatePrecisionTimeScale(415)).toBeCloseTo(0.55, 1);
    });

    it('returns ~0.2 at px=420', () => {
      // Linear: 1.0 → 0.2 as progress goes 0 → 1, so at px=420: 1 - (1 * 0.8) = 0.2
      expect(calculatePrecisionTimeScale(420)).toBeCloseTo(0.2, 1);
    });
  });

  describe('getDynamicDecimalPrecision', () => {
    it('returns 1 decimal for 419.0-419.89', () => {
      expect(getDynamicDecimalPrecision(419.5)).toBe(1);
      expect(getDynamicDecimalPrecision(419.89)).toBe(1);
    });

    it('returns 2 decimals for 419.9-419.989', () => {
      expect(getDynamicDecimalPrecision(419.9)).toBe(2);
      expect(getDynamicDecimalPrecision(419.95)).toBe(2);
    });

    it('returns 3 decimals for 419.99-419.9989', () => {
      expect(getDynamicDecimalPrecision(419.99)).toBe(3);
      expect(getDynamicDecimalPrecision(419.995)).toBe(3);
    });

    it('returns up to 8 decimals for extreme precision', () => {
      expect(getDynamicDecimalPrecision(419.9999999)).toBe(8);
    });
  });

  describe('getPbMarkerPosition', () => {
    it('returns null when no PB in range', () => {
      expect(getPbMarkerPosition(0, 60)).toBe(null);
      expect(getPbMarkerPosition(409, 60)).toBe(null);
    });

    it('returns correct position for PB at 415', () => {
      // 415 is 50% between 410 and 420
      expect(getPbMarkerPosition(415, 60)).toBe(30);
    });

    it('returns correct position for PB at 418', () => {
      // 418 is 80% between 410 and 420
      expect(getPbMarkerPosition(418, 60)).toBeCloseTo(48, 1);
    });

    it('clamps PB above 420', () => {
      expect(getPbMarkerPosition(420.5, 60)).toBe(60);
    });
  });
});

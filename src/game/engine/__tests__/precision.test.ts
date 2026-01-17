import { describe, it, expect } from 'vitest';
import { calculateEdgeMultiplier } from '../precision';

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

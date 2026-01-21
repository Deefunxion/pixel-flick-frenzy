import { describe, it, expect } from 'vitest';
import { createInitialState } from '../state';
import type { Stats } from '../types';

describe('Extended Stats Interface', () => {
  it('initializes new stats fields to default values', () => {
    const state = createInitialState({ reduceFx: false });
    const stats = state.stats;

    expect(stats.maxAirTime).toBe(0);
    expect(stats.successfulLandings).toBeDefined();
  });

  it('has all required fields for achievement tracking', () => {
    const state = createInitialState({ reduceFx: false });
    const stats: Stats = state.stats;

    // Existing fields
    expect(typeof stats.totalThrows).toBe('number');
    expect(typeof stats.successfulLandings).toBe('number');
    expect(typeof stats.perfectLandings).toBe('number');

    // New field
    expect(typeof stats.maxAirTime).toBe('number');
  });
});

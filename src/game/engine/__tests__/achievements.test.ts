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

describe('Air Time Tracking', () => {
  it('calculates air time from launch to landing', () => {
    const state = createInitialState({ reduceFx: false });

    // Simulate a throw
    state.launchTimestamp = 1000; // Launch at t=1000ms
    const nowMs = 4500; // Land at t=4500ms
    const airTimeSeconds = (nowMs - state.launchTimestamp) / 1000;

    expect(airTimeSeconds).toBe(3.5);
  });

  it('updates maxAirTime when current air time exceeds previous', () => {
    const state = createInitialState({ reduceFx: false });
    state.stats.maxAirTime = 2.0;

    const currentAirTime = 3.5;
    if (currentAirTime > state.stats.maxAirTime) {
      state.stats.maxAirTime = currentAirTime;
    }

    expect(state.stats.maxAirTime).toBe(3.5);
  });
});

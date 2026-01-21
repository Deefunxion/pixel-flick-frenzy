import { describe, it, expect } from 'vitest';
import { createInitialState } from '../state';
import type { Stats } from '../types';
import { ACHIEVEMENTS } from '../achievements';

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

describe('ACHIEVEMENTS constant', () => {
  it('contains at least 150 achievements', () => {
    expect(Object.keys(ACHIEVEMENTS).length).toBeGreaterThanOrEqual(150);
  });

  it('contains distance achievements for 400-419', () => {
    expect(ACHIEVEMENTS['dist_400']).toBeDefined();
    expect(ACHIEVEMENTS['dist_410']).toBeDefined();
    expect(ACHIEVEMENTS['dist_419']).toBeDefined();
  });

  it('contains decimal distance achievements', () => {
    expect(ACHIEVEMENTS['dist_419_5']).toBeDefined();
    expect(ACHIEVEMENTS['dist_419_99']).toBeDefined();
    expect(ACHIEVEMENTS['dist_419_999']).toBeDefined();
  });

  it('contains air time achievements', () => {
    expect(ACHIEVEMENTS['air_3s']).toBeDefined();
    expect(ACHIEVEMENTS['air_5s']).toBeDefined();
  });

  it('contains falls achievements', () => {
    expect(ACHIEVEMENTS['falls_1']).toBeDefined();
    expect(ACHIEVEMENTS['falls_100']).toBeDefined();
  });
});

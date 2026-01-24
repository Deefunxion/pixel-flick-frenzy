// src/game/engine/__tests__/arcade.test.ts
import { describe, it, expect } from 'vitest';
import type { ArcadeLevel, DoodlePlacement, SpringPlacement, PortalPair } from '../arcade/types';
import { ARCADE_LEVELS, getLevel } from '../arcade/levels';
import {
  createArcadeState,
  collectDoodle,
  checkStarObjectives,
  advanceLevel,
  resetThrowState,
} from '../arcade/state';

describe('Arcade Types', () => {
  it('should define a valid ArcadeLevel structure', () => {
    const level: ArcadeLevel = {
      id: 1,
      landingTarget: 410,
      doodles: [],
      springs: [],
      portal: null,
    };
    expect(level.id).toBe(1);
    expect(level.landingTarget).toBe(410);
  });

  it('should define doodle placement with sequence', () => {
    const doodle: DoodlePlacement = {
      x: 200,
      y: 120,
      size: 'large',
      sprite: 'paperplane',
      sequence: 1,
    };
    expect(doodle.sequence).toBe(1);
    expect(doodle.size).toBe('large');
  });

  it('should define spring with direction', () => {
    const spring: SpringPlacement = {
      x: 250,
      y: 100,
      direction: 'up-left',
    };
    expect(spring.direction).toBe('up-left');
  });

  it('should define portal pair', () => {
    const portal: PortalPair = {
      entry: { x: 100, y: 150 },
      exit: { x: 350, y: 80 },
    };
    expect(portal.entry.x).toBe(100);
    expect(portal.exit.x).toBe(350);
  });
});

describe('Arcade Levels', () => {
  it('should have 10 levels defined', () => {
    expect(ARCADE_LEVELS.length).toBe(10);
  });

  it('should have correct landing targets (409 + level)', () => {
    ARCADE_LEVELS.forEach((level, index) => {
      expect(level.landingTarget).toBe(409 + level.id);
      expect(level.id).toBe(index + 1);
    });
  });

  it('should get level by id', () => {
    const level = getLevel(5);
    expect(level?.id).toBe(5);
    expect(level?.landingTarget).toBe(414);
  });

  it('should return undefined for invalid level', () => {
    expect(getLevel(0)).toBeUndefined();
    expect(getLevel(11)).toBeUndefined();
  });

  it('level 1 should have no doodles (intro level)', () => {
    const level = getLevel(1);
    expect(level?.doodles.length).toBe(0);
  });

  it('level 6 should have springs', () => {
    const level = getLevel(6);
    expect(level?.springs.length).toBeGreaterThan(0);
  });

  it('level 8 should have portal', () => {
    const level = getLevel(8);
    expect(level?.portal).not.toBeNull();
  });
});

describe('Arcade State', () => {
  it('should create initial arcade state', () => {
    const state = createArcadeState();
    expect(state.currentLevelId).toBe(1);
    expect(state.doodlesCollected).toEqual([]);
    expect(state.sequenceBroken).toBe(false);
  });

  it('should track doodle collection in order', () => {
    const state = createArcadeState();
    state.currentLevelId = 5; // 3 doodles, order matters

    collectDoodle(state, 1);
    expect(state.doodlesCollected).toEqual([1]);
    expect(state.sequenceBroken).toBe(false);

    collectDoodle(state, 2);
    expect(state.doodlesCollected).toEqual([1, 2]);
    expect(state.sequenceBroken).toBe(false);
  });

  it('should detect out-of-order collection', () => {
    const state = createArcadeState();
    state.currentLevelId = 5;

    collectDoodle(state, 2); // Skip 1
    expect(state.sequenceBroken).toBe(true);
  });

  it('should check star objectives correctly', () => {
    const state = createArcadeState();
    state.currentLevelId = 4; // 3 doodles
    const level = getLevel(4)!;

    // No stars yet
    let stars = checkStarObjectives(state, level, 400);
    expect(stars.allDoodles).toBe(false);
    expect(stars.inOrder).toBe(false);
    expect(stars.landedInZone).toBe(false);

    // Collect all doodles in order
    collectDoodle(state, 1);
    collectDoodle(state, 2);
    collectDoodle(state, 3);

    // Land beyond target (413)
    stars = checkStarObjectives(state, level, 414);
    expect(stars.allDoodles).toBe(true);
    expect(stars.inOrder).toBe(true);
    expect(stars.landedInZone).toBe(true);
  });

  it('should advance to next level', () => {
    const state = createArcadeState();
    expect(state.currentLevelId).toBe(1);

    advanceLevel(state);
    expect(state.currentLevelId).toBe(2);
  });

  it('should reset throw state between throws', () => {
    const state = createArcadeState();
    collectDoodle(state, 1);
    collectDoodle(state, 3); // breaks sequence

    resetThrowState(state);
    expect(state.doodlesCollected).toEqual([]);
    expect(state.sequenceBroken).toBe(false);
    expect(state.lastCollectedSequence).toBe(0);
  });
});

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
    expect(state.expectedNextSequence).toBe(null);
    expect(state.streakCount).toBe(0);
  });

  it('should track circular doodle collection starting from any doodle', () => {
    const state = createArcadeState();
    state.totalDoodlesInLevel = 5; // 5 doodles

    // Start from doodle 3
    collectDoodle(state, 3);
    expect(state.doodlesCollected).toEqual([3]);
    expect(state.streakCount).toBe(1);
    expect(state.expectedNextSequence).toBe(4); // Next expected is 4

    // Continue in order: 4
    collectDoodle(state, 4);
    expect(state.streakCount).toBe(2);
    expect(state.expectedNextSequence).toBe(5);

    // Continue: 5 (wraps to 1 next)
    collectDoodle(state, 5);
    expect(state.streakCount).toBe(3);
    expect(state.expectedNextSequence).toBe(1); // Wrapped!

    // Continue: 1
    collectDoodle(state, 1);
    expect(state.streakCount).toBe(4);
    expect(state.expectedNextSequence).toBe(2);

    // Finish: 2
    collectDoodle(state, 2);
    expect(state.streakCount).toBe(5); // Perfect circular collection!
  });

  it('should break streak on out-of-order collection', () => {
    const state = createArcadeState();
    state.totalDoodlesInLevel = 5;

    collectDoodle(state, 1); // Start from 1
    expect(state.streakCount).toBe(1);
    expect(state.expectedNextSequence).toBe(2);

    collectDoodle(state, 3); // Skip 2 - breaks streak
    expect(state.streakCount).toBe(1); // Streak doesn't increase
    expect(state.doodlesCollected).toEqual([1, 3]); // But doodle is collected
  });

  it('should check star objectives correctly (allDoodles = pass, stars = inOrder + landedInZone)', () => {
    const state = createArcadeState();
    state.currentLevelId = 4; // 3 doodles
    const level = getLevel(4)!;
    state.totalDoodlesInLevel = level.doodles.length;

    // No doodles collected - not passed
    let stars = checkStarObjectives(state, level, 400);
    expect(stars.allDoodles).toBe(false); // Not passed
    expect(stars.inOrder).toBe(false);
    expect(stars.landedInZone).toBe(false);

    // Collect all doodles in circular order (1→2→3)
    collectDoodle(state, 1);
    collectDoodle(state, 2);
    collectDoodle(state, 3);

    // Land beyond target (413)
    stars = checkStarObjectives(state, level, 414);
    expect(stars.allDoodles).toBe(true);  // Passed!
    expect(stars.inOrder).toBe(true);     // ★★ circular order
    expect(stars.landedInZone).toBe(true); // ★ landed in zone
  });

  it('should not give inOrder star if sequence broken', () => {
    const state = createArcadeState();
    const level = getLevel(4)!; // 3 doodles
    state.totalDoodlesInLevel = level.doodles.length;

    // Collect out of order (1→3→2)
    collectDoodle(state, 1);
    collectDoodle(state, 3); // Skip 2
    collectDoodle(state, 2);

    const stars = checkStarObjectives(state, level, 414);
    expect(stars.allDoodles).toBe(true);  // Passed (all collected)
    expect(stars.inOrder).toBe(false);    // No ★★ (streak broken)
    expect(stars.landedInZone).toBe(true); // ★ landed in zone
  });

  it('should advance to next level', () => {
    const state = createArcadeState();
    expect(state.currentLevelId).toBe(1);

    advanceLevel(state);
    expect(state.currentLevelId).toBe(2);
  });

  it('should reset throw state between throws', () => {
    const state = createArcadeState();
    state.totalDoodlesInLevel = 3;
    collectDoodle(state, 1);
    collectDoodle(state, 3);

    resetThrowState(state);
    expect(state.doodlesCollected).toEqual([]);
    expect(state.expectedNextSequence).toBe(null);
    expect(state.streakCount).toBe(0);
  });
});

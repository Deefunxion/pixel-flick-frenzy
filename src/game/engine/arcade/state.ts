// src/game/engine/arcade/state.ts
import type { ArcadeState, ArcadeLevel, StarObjectives } from './types';
import { loadJson, saveJson } from '@/game/storage';
import { getTotalLevels } from './levels';

const STORAGE_KEY = 'arcade_state';

export function createArcadeState(): ArcadeState {
  const saved = loadJson<Partial<ArcadeState>>(STORAGE_KEY, {});
  return {
    currentLevelId: saved.currentLevelId ?? 1,
    starsPerLevel: saved.starsPerLevel ?? {},
    doodlesCollected: [],
    expectedNextSequence: null,
    streakCount: 0,
    totalDoodlesInLevel: 0,
  };
}

export function saveArcadeState(state: ArcadeState): void {
  // Only save persistent data (not per-throw state)
  saveJson(STORAGE_KEY, {
    currentLevelId: state.currentLevelId,
    starsPerLevel: state.starsPerLevel,
  });
}

/**
 * Collect a doodle with circular sequence tracking (Bomb Jack style)
 * Always updates expectedNextSequence to show which doodle to collect next.
 * E.g., if player picks #3, next glow is #4 (or wraps to #1 if #4 doesn't exist).
 */
export function collectDoodle(state: ArcadeState, sequence: number): void {
  // Already collected
  if (state.doodlesCollected.includes(sequence)) return;

  state.doodlesCollected.push(sequence);

  // First pickup - any doodle is valid, sets the expected next
  if (state.streakCount === 0) {
    state.streakCount = 1;
  } else {
    // Check if this is the expected next in circular order
    if (sequence === state.expectedNextSequence) {
      state.streakCount++;
    }
    // If not expected, streak breaks but we still update the glow
  }

  // Always update expected next to be the next in circular order from what was just collected
  // This ensures the glow always shows the "correct" next doodle
  state.expectedNextSequence = findNextUncollectedInSequence(
    sequence,
    state.totalDoodlesInLevel,
    state.doodlesCollected
  );
}

/**
 * Find the next uncollected doodle in circular sequence order.
 * Starting from `fromSequence`, wraps around to find the first uncollected.
 */
function findNextUncollectedInSequence(
  fromSequence: number,
  totalDoodles: number,
  collected: number[]
): number {
  if (totalDoodles === 0) return 1;

  let next = (fromSequence % totalDoodles) + 1;
  let checked = 0;

  // Search circularly for the next uncollected doodle
  while (checked < totalDoodles) {
    if (!collected.includes(next)) {
      return next;
    }
    next = (next % totalDoodles) + 1;
    checked++;
  }

  // All collected, return 1 as fallback
  return 1;
}

export function checkStarObjectives(
  state: ArcadeState,
  level: ArcadeLevel,
  landingDistance: number
): StarObjectives {
  const totalDoodles = level.doodles.length;
  const collectedCount = state.doodlesCollected.length;

  // ★ landedInZone - landed beyond target
  const landedInZone = landingDistance >= level.landingTarget;

  // ★★ allDoodles - collected all doodles (any order)
  const allDoodles = totalDoodles === 0 || collectedCount === totalDoodles;

  // ★★★ inOrder - collected all in circular sequence (Bomb Jack style)
  const inOrder = allDoodles && state.streakCount === totalDoodles;

  return {
    landedInZone,
    allDoodles,
    inOrder,
  };
}

/**
 * Check if level is passed.
 * PASS REQUIREMENT: At least 1 star (land on target).
 */
export function isLevelPassed(objectives: StarObjectives): boolean {
  return objectives.landedInZone;  // Just need to land on target
}

/**
 * Check if any stars were earned.
 * Stars: ★ landedInZone, ★★ allDoodles, ★★★ inOrder
 */
export function hasAnyStars(objectives: StarObjectives): boolean {
  return objectives.landedInZone || objectives.allDoodles || objectives.inOrder;
}

/**
 * Count stars earned (max 3).
 * ★ landedInZone
 * ★★ allDoodles (any order)
 * ★★★ inOrder (circular Bomb Jack style)
 */
export function countStars(objectives: StarObjectives): number {
  let count = 0;
  if (objectives.landedInZone) count++;  // ★
  if (objectives.allDoodles) count++;    // ★★
  if (objectives.inOrder) count++;       // ★★★
  return count;
}

export function mergeStars(
  existing: StarObjectives | undefined,
  newStars: StarObjectives
): StarObjectives {
  if (!existing) return newStars;
  return {
    allDoodles: existing.allDoodles || newStars.allDoodles,
    inOrder: existing.inOrder || newStars.inOrder,
    landedInZone: existing.landedInZone || newStars.landedInZone,
  };
}

export function advanceLevel(state: ArcadeState): void {
  const totalLevels = getTotalLevels();
  if (state.currentLevelId < totalLevels) {
    state.currentLevelId++;
    saveArcadeState(state);
  }
}

export function setLevel(state: ArcadeState, levelId: number): void {
  const totalLevels = getTotalLevels();
  if (levelId >= 1 && levelId <= totalLevels) {
    state.currentLevelId = levelId;
    resetThrowState(state);
    saveArcadeState(state);
  }
}

export function resetThrowState(state: ArcadeState): void {
  state.doodlesCollected = [];
  state.expectedNextSequence = 1;  // Start with #1 glowing
  state.streakCount = 0;
}

export function recordStars(
  state: ArcadeState,
  levelId: number,
  stars: StarObjectives
): void {
  state.starsPerLevel[levelId] = mergeStars(
    state.starsPerLevel[levelId],
    stars
  );
  saveArcadeState(state);
}

/**
 * Get total stars across all levels (max 3 per level).
 * ★ landedInZone, ★★ allDoodles, ★★★ inOrder
 */
export function getTotalStars(state: ArcadeState): number {
  let total = 0;
  for (const levelId in state.starsPerLevel) {
    const stars = state.starsPerLevel[levelId];
    if (stars.landedInZone) total++;
    if (stars.allDoodles) total++;
    if (stars.inOrder) total++;
  }
  return total;
}

/**
 * Set the total doodles count for a level (needed for circular wrap calculation)
 */
export function setLevelDoodleCount(state: ArcadeState, count: number): void {
  state.totalDoodlesInLevel = count;
}

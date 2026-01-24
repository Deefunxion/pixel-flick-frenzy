// src/game/engine/arcade/state.ts
import type { ArcadeState, ArcadeLevel, StarObjectives } from './types';
import { loadJson, saveJson } from '@/game/storage';

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
 * Player can start from any doodle, and the chain follows the cycle.
 * E.g., for 5 doodles: 3→4→5→1→2 is a perfect in-order collection.
 */
export function collectDoodle(state: ArcadeState, sequence: number): void {
  // Already collected
  if (state.doodlesCollected.includes(sequence)) return;

  state.doodlesCollected.push(sequence);

  // First pickup - any doodle is valid, sets the expected next
  if (state.expectedNextSequence === null) {
    state.streakCount = 1;
    // Next expected is sequence + 1, wrapping around
    state.expectedNextSequence = (sequence % state.totalDoodlesInLevel) + 1;
  } else {
    // Check if this is the expected next in circular order
    if (sequence === state.expectedNextSequence) {
      state.streakCount++;
      // Update expected next (circular wrap)
      state.expectedNextSequence = (sequence % state.totalDoodlesInLevel) + 1;
    }
    // If not expected, streak breaks but we don't update expectedNextSequence
    // (player can still collect remaining doodles, just won't get inOrder star)
  }
}

export function checkStarObjectives(
  state: ArcadeState,
  level: ArcadeLevel,
  landingDistance: number
): StarObjectives {
  const totalDoodles = level.doodles.length;
  const collectedCount = state.doodlesCollected.length;

  // allDoodles is PASS REQUIREMENT (not a star)
  const allDoodles = totalDoodles === 0 || collectedCount === totalDoodles;

  // inOrder (★★) - collected all in circular sequence (Bomb Jack style)
  // streakCount must equal totalDoodles for perfect circular collection
  const inOrder = allDoodles && state.streakCount === totalDoodles;

  // landedInZone (★) - landed beyond target
  const landedInZone = landingDistance >= level.landingTarget;

  return {
    allDoodles,
    inOrder,
    landedInZone,
  };
}

/**
 * Check if level is passed.
 * PASS REQUIREMENT: All doodles must be collected.
 */
export function isLevelPassed(objectives: StarObjectives): boolean {
  return objectives.allDoodles;
}

/**
 * Check if any stars were earned (not counting pass requirement).
 * Stars: ★ landedInZone, ★★ inOrder
 */
export function hasAnyStars(objectives: StarObjectives): boolean {
  return objectives.inOrder || objectives.landedInZone;
}

/**
 * Count stars earned (max 2).
 * ★ landedInZone
 * ★★ inOrder (circular Bomb Jack style)
 */
export function countStars(objectives: StarObjectives): number {
  let count = 0;
  if (objectives.landedInZone) count++;
  if (objectives.inOrder) count++;  // ★★ for perfect circular order
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
  if (state.currentLevelId < 10) {
    state.currentLevelId++;
    saveArcadeState(state);
  }
}

export function setLevel(state: ArcadeState, levelId: number): void {
  if (levelId >= 1 && levelId <= 10) {
    state.currentLevelId = levelId;
    resetThrowState(state);
    saveArcadeState(state);
  }
}

export function resetThrowState(state: ArcadeState): void {
  state.doodlesCollected = [];
  state.expectedNextSequence = null;
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
 * Get total stars across all levels (max 2 per level = 20 total).
 * ★ landedInZone, ★★ inOrder
 */
export function getTotalStars(state: ArcadeState): number {
  let total = 0;
  for (const levelId in state.starsPerLevel) {
    const stars = state.starsPerLevel[levelId];
    if (stars.landedInZone) total++;
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

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
    lastCollectedSequence: 0,
    sequenceBroken: false,
  };
}

export function saveArcadeState(state: ArcadeState): void {
  // Only save persistent data (not per-throw state)
  saveJson(STORAGE_KEY, {
    currentLevelId: state.currentLevelId,
    starsPerLevel: state.starsPerLevel,
  });
}

export function collectDoodle(state: ArcadeState, sequence: number): void {
  // Already collected
  if (state.doodlesCollected.includes(sequence)) return;

  state.doodlesCollected.push(sequence);

  // Check if collected in order
  if (!state.sequenceBroken) {
    const expectedSequence = state.lastCollectedSequence + 1;
    if (sequence !== expectedSequence) {
      state.sequenceBroken = true;
    } else {
      state.lastCollectedSequence = sequence;
    }
  }
}

export function checkStarObjectives(
  state: ArcadeState,
  level: ArcadeLevel,
  landingDistance: number
): StarObjectives {
  const totalDoodles = level.doodles.length;
  const collectedCount = state.doodlesCollected.length;

  const allDoodles = totalDoodles === 0 || collectedCount === totalDoodles;
  const inOrder = allDoodles && !state.sequenceBroken;
  const landedInZone = landingDistance >= level.landingTarget;

  return {
    allDoodles,
    inOrder,
    landedInZone,
  };
}

export function hasAnyStars(objectives: StarObjectives): boolean {
  return objectives.allDoodles || objectives.inOrder || objectives.landedInZone;
}

export function countStars(objectives: StarObjectives): number {
  let count = 0;
  if (objectives.landedInZone) count++;
  if (objectives.allDoodles) count++;
  // inOrder includes allDoodles, so only count if allDoodles isn't already counted
  if (objectives.inOrder && !objectives.allDoodles) count++;
  // Actually: inOrder implies allDoodles, so if inOrder is true, allDoodles is true
  // We count: ★ allDoodles, ★★ inOrder (which subsumes allDoodles), ★★★ landedInZone
  // So max is 3 if all achieved, but ★★ replaces ★
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
  state.lastCollectedSequence = 0;
  state.sequenceBroken = false;
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

export function getTotalStars(state: ArcadeState): number {
  let total = 0;
  for (const levelId in state.starsPerLevel) {
    const stars = state.starsPerLevel[levelId];
    if (stars.allDoodles && !stars.inOrder) total += 1;
    if (stars.inOrder) total += 2; // ★★ counts as 2
    if (stars.landedInZone) total += 1;
  }
  return total;
}

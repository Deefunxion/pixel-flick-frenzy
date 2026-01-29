// src/game/engine/arcade/progression/state.ts

import type { ArcadeState } from '../types';
import type { ProgressionState, World, Galaxy } from './types';
import { WORLDS, GALAXIES, LEVELS_PER_WORLD, STARS_PER_LEVEL } from './constants';
import { loadJson, saveJson } from '@/game/storage';

const STORAGE_KEY = 'progression_state';

export function createProgressionState(): ProgressionState {
  const saved = loadJson<Partial<ProgressionState>>(STORAGE_KEY, {});
  return {
    unlockedWorlds: saved.unlockedWorlds ?? [1],
    currentWorld: saved.currentWorld ?? 1,
    totalStarsEarned: saved.totalStarsEarned ?? 0,
  };
}

export function saveProgressionState(state: ProgressionState): void {
  saveJson(STORAGE_KEY, state);
}

export function loadProgressionState(): ProgressionState {
  return createProgressionState();
}

export function getWorldForLevel(levelId: number): World {
  const worldId = Math.ceil(levelId / LEVELS_PER_WORLD);
  return WORLDS[worldId - 1] ?? WORLDS[0];
}

export function getGalaxyForLevel(levelId: number): Galaxy {
  const world = getWorldForLevel(levelId);
  return GALAXIES[world.galaxyId - 1] ?? GALAXIES[0];
}

export function getStarsInWorld(worldId: number, arcadeState: ArcadeState): number {
  const world = WORLDS[worldId - 1];
  if (!world) return 0;

  let total = 0;
  for (let level = world.startLevel; level <= world.endLevel; level++) {
    const stars = arcadeState.starsPerLevel[level];
    if (stars) {
      if (stars.landedInZone) total++;
      if (stars.allDoodles) total++;
      if (stars.inOrder) total++;
    }
  }
  return total;
}

export function isWorldUnlocked(worldId: number, arcadeState: ArcadeState): boolean {
  // World 1 is always unlocked
  if (worldId === 1) return true;

  const world = WORLDS[worldId - 1];
  if (!world) return false;

  // Check if previous world has enough stars
  const prevWorldId = worldId - 1;
  const starsInPrevWorld = getStarsInWorld(prevWorldId, arcadeState);

  return starsInPrevWorld >= world.requiredStars;
}

export function getNextLockedWorld(arcadeState: ArcadeState): World | null {
  for (const world of WORLDS) {
    if (!isWorldUnlocked(world.id, arcadeState)) {
      return world;
    }
  }
  return null; // All worlds unlocked
}

export function getAllUnlockedWorlds(arcadeState: ArcadeState): number[] {
  return WORLDS.filter(w => isWorldUnlocked(w.id, arcadeState)).map(w => w.id);
}

export function getTotalStarsEarned(arcadeState: ArcadeState): number {
  let total = 0;
  for (const levelId in arcadeState.starsPerLevel) {
    const stars = arcadeState.starsPerLevel[levelId];
    if (stars.landedInZone) total++;
    if (stars.allDoodles) total++;
    if (stars.inOrder) total++;
  }
  return total;
}

export function getWorldProgress(worldId: number, arcadeState: ArcadeState): {
  starsEarned: number;
  starsTotal: number;
  levelsCompleted: number;
  levelsTotal: number;
} {
  const world = WORLDS[worldId - 1];
  if (!world) {
    return { starsEarned: 0, starsTotal: 0, levelsCompleted: 0, levelsTotal: 0 };
  }

  let starsEarned = 0;
  let levelsCompleted = 0;

  for (let level = world.startLevel; level <= world.endLevel; level++) {
    const stars = arcadeState.starsPerLevel[level];
    if (stars) {
      if (stars.landedInZone) {
        starsEarned++;
        levelsCompleted++; // Level is "completed" if you landed
      }
      if (stars.allDoodles) starsEarned++;
      if (stars.inOrder) starsEarned++;
    }
  }

  return {
    starsEarned,
    starsTotal: LEVELS_PER_WORLD * STARS_PER_LEVEL,
    levelsCompleted,
    levelsTotal: LEVELS_PER_WORLD,
  };
}

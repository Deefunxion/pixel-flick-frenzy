// src/game/engine/arcade/levels.ts
import type { ArcadeLevel } from './types';
import levelsData from './levels-data.json';

// Import levels from JSON (editable via Level Editor)
export const ARCADE_LEVELS: ArcadeLevel[] = levelsData as ArcadeLevel[];

export function getLevel(id: number): ArcadeLevel | undefined {
  return ARCADE_LEVELS.find(level => level.id === id);
}

export function getTotalLevels(): number {
  return ARCADE_LEVELS.length;
}

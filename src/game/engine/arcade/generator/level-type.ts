// src/game/engine/arcade/generator/level-type.ts

import type { LevelType } from '../types';

export type { LevelType };

export interface StarRequirements {
  oneStar: 'land';
  twoStar: 'allCoins' | 'halfCoins';
  threeStar: 'allCoinsInSequence' | 'allCoins';
}

/**
 * Get position within world (1-10) from level number
 */
function getPositionInWorld(level: number): number {
  const pos = level % 10;
  return pos === 0 ? 10 : pos;
}

/**
 * Check if level is a juicy level (positions 3, 6, 10 in each world)
 */
export function isJuicyLevel(level: number): boolean {
  const position = getPositionInWorld(level);
  return position === 3 || position === 6 || position === 10;
}

/**
 * Get level type (puzzly or juicy)
 * Juicy levels: 3, 6, 10 of each world (early taste, mid reward, finale)
 * Puzzly levels: 1, 2, 4, 5, 7, 8, 9 of each world
 */
export function getLevelType(level: number): LevelType {
  return isJuicyLevel(level) ? 'juicy' : 'puzzly';
}

/**
 * Get star requirements based on level type
 */
export function getStarRequirements(type: LevelType): StarRequirements {
  if (type === 'juicy') {
    return {
      oneStar: 'land',
      twoStar: 'halfCoins',      // 50% of coins
      threeStar: 'allCoins',     // All coins, no sequence required
    };
  }

  return {
    oneStar: 'land',
    twoStar: 'allCoins',         // All coins, any order
    threeStar: 'allCoinsInSequence', // All coins in sequence
  };
}

/**
 * Get default coin density for level type
 * 0.0 = very sparse, 1.0 = very dense
 */
export function getDefaultDensity(type: LevelType): number {
  return type === 'juicy' ? 0.9 : 0.3;
}

/**
 * Get suggested coin count range based on level type and world
 */
export function getSuggestedCoinRange(level: number, type: LevelType): { min: number; max: number } {
  const world = Math.ceil(level / 10);

  if (type === 'puzzly') {
    // Puzzly: 5-20 coins, grows slightly with world
    const base = 5 + Math.floor(world / 5) * 2;
    return { min: base, max: base + 15 };
  }

  // Juicy: 40-150 coins, grows significantly with world
  const base = 40 + world * 4;
  return { min: base, max: Math.min(150, base + 50) };
}

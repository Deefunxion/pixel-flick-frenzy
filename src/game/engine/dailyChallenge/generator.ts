// src/game/engine/dailyChallenge/generator.ts

import { LevelGenerator } from '../arcade/generator/level-generator';
import type { ArcadeLevel } from '../arcade/types';
import { dailySeedFromDate, todayLocalISODate } from '@/game/storage';

// Daily challenge level ID (negative to distinguish from regular levels)
export const DAILY_CHALLENGE_LEVEL_ID = -1;

// Singleton generator instance
let generatorInstance: LevelGenerator | null = null;

function getGenerator(): LevelGenerator {
  if (!generatorInstance) {
    generatorInstance = new LevelGenerator();
  }
  return generatorInstance;
}

/**
 * Generate today's daily challenge level.
 * Uses date as seed for deterministic generation.
 */
export async function generateDailyLevel(): Promise<ArcadeLevel | null> {
  const today = todayLocalISODate();
  const seed = dailySeedFromDate(today);

  const generator = getGenerator();
  await generator.initialize();

  // Generate a mid-difficulty level (around level 50-100 complexity)
  // Daily challenges should be accessible but not trivial
  const result = await generator.generateLevel(75, `daily-${seed}`);

  if (!result.success || !result.level) {
    console.warn('Failed to generate daily challenge level');
    return null;
  }

  return {
    ...result.level,
    id: DAILY_CHALLENGE_LEVEL_ID,
  };
}

/**
 * Get the seed for today's challenge (for leaderboard matching)
 */
export function getTodaySeed(): number {
  return dailySeedFromDate(todayLocalISODate());
}

/**
 * Get the date string for today's challenge
 */
export function getTodayDate(): string {
  return todayLocalISODate();
}

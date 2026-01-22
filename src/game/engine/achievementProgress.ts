// src/game/engine/achievementProgress.ts
import type { GameState, Stats } from './types';
import { ACHIEVEMENTS } from './achievements';

export interface AchievementProgress {
  id: string;
  name: string;
  desc: string;
  progress: number;      // 0-1 (percentage)
  current: number;       // Current value
  target: number;        // Target value
  unlocked: boolean;
}

/**
 * Get progress for all achievements
 */
export function getAchievementProgress(
  stats: Stats,
  state: GameState,
  unlockedSet: Set<string>
): AchievementProgress[] {
  const progressList: AchievementProgress[] = [];

  // Define progress tracking for each achievement (IDs must match generated achievements)
  const progressDefs: Record<string, { current: (s: Stats, g: GameState) => number; target: number }> = {
    // Zeno levels
    zeno_1: { current: (_, g) => g.zenoLevel, target: 1 },
    zeno_5: { current: (_, g) => g.zenoLevel, target: 5 },
    zeno_10: { current: (_, g) => g.zenoLevel, target: 10 },
    // Distances
    dist_400: { current: (_, g) => g.best, target: 400 },
    dist_410: { current: (_, g) => g.best, target: 410 },
    dist_419: { current: (_, g) => g.best, target: 419 },
    // Perfect landings
    perfect_1: { current: (s) => s.perfectLandings, target: 1 },
    perfect_10: { current: (s) => s.perfectLandings, target: 10 },
    perfect_100: { current: (s) => s.perfectLandings, target: 100 },
    // Total throws
    throws_50: { current: (s) => s.totalThrows, target: 50 },
    throws_100: { current: (s) => s.totalThrows, target: 100 },
    throws_1000: { current: (s) => s.totalThrows, target: 1000 },
    // Score
    score_500: { current: (_, g) => g.totalScore, target: 500 },
    score_1000: { current: (_, g) => g.totalScore, target: 1000 },
    score_10000: { current: (_, g) => g.totalScore, target: 10000 },
    // Hot streaks
    streak_hot_5: { current: (_, g) => g.hotStreak, target: 5 },
    streak_hot_10: { current: (_, g) => g.hotStreak, target: 10 },
    // Safe landings
    streak_safe_10: { current: (_, g) => g.landingsWithoutFall, target: 10 },
    // Session marathon
    session_50: { current: (_, g) => g.sessionThrows, target: 50 },
    // Rings
    rings_1: { current: (s) => s.totalRingsPassed, target: 1 },
    rings_100: { current: (s) => s.totalRingsPassed, target: 100 },
    rings_perfect_1: { current: (s) => s.perfectRingThrows, target: 1 },
    rings_perfect_10: { current: (s) => s.perfectRingThrows, target: 10 },
  };

  for (const [id, ach] of Object.entries(ACHIEVEMENTS)) {
    const def = progressDefs[id];
    if (!def) continue;

    const current = def.current(stats, state);
    const unlocked = unlockedSet.has(id);
    const progress = unlocked ? 1 : Math.min(1, current / def.target);

    progressList.push({
      id,
      name: ach.name,
      desc: ach.desc,
      progress,
      current: Math.floor(current),
      target: def.target,
      unlocked,
    });
  }

  return progressList;
}

/**
 * Get top N achievements closest to unlock (sorted by progress desc, unlocked excluded)
 */
export function getClosestAchievements(
  stats: Stats,
  state: GameState,
  unlockedSet: Set<string>,
  count: number = 3
): AchievementProgress[] {
  const all = getAchievementProgress(stats, state, unlockedSet);
  return all
    .filter(a => !a.unlocked)
    .sort((a, b) => b.progress - a.progress)
    .slice(0, count);
}

/**
 * Get the single closest goal for mini HUD
 * Prioritizes: near achievements > long-term
 */
export function getClosestGoal(
  stats: Stats,
  state: GameState,
  unlockedSet: Set<string>
): { text: string; progress: number; current: number; target: number } | null {
  // Get closest achievements
  const closest = getClosestAchievements(stats, state, unlockedSet, 1);

  if (closest.length === 0) return null;

  const goal = closest[0];

  return {
    text: goal.name,
    progress: goal.current / goal.target,
    current: goal.current,
    target: goal.target,
  };
}

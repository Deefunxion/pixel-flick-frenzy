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

  // Define progress tracking for each achievement
  const progressDefs: Record<string, { current: (s: Stats, g: GameState) => number; target: number }> = {
    first_zeno: { current: (_, g) => g.zenoLevel, target: 1 },
    level_5: { current: (_, g) => g.zenoLevel, target: 5 },
    level_10: { current: (_, g) => g.zenoLevel, target: 10 },
    perfect_140: { current: (_, g) => g.best, target: 140 },
    perfect_landing: { current: (s) => s.perfectLandings, target: 1 },
    ten_perfects: { current: (s) => s.perfectLandings, target: 10 },
    hundred_throws: { current: (s) => s.totalThrows, target: 100 },
    high_roller: { current: (s) => s.maxMultiplier, target: 4 },
    thousand_score: { current: (_, g) => g.totalScore, target: 1000 },
    bullet_time: { current: (_, g) => g.best, target: 401 },
    hot_streak_5: { current: (_, g) => g.hotStreak, target: 5 },
    hot_streak_10: { current: (_, g) => g.hotStreak, target: 10 },
    untouchable: { current: (_, g) => g.landingsWithoutFall, target: 10 },
    marathon: { current: (_, g) => g.sessionThrows, target: 50 },
    ring_rookie: { current: (s) => s.totalRingsPassed, target: 1 },
    ring_collector: { current: (s) => s.totalRingsPassed, target: 100 },
    ring_master: { current: (s) => s.maxRingsInThrow, target: 3 },
    triple_threat: { current: (s) => s.perfectRingThrows, target: 10 },
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

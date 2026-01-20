import type { GameState, Stats } from './types';

export type AchievementDef = {
  name: string;
  desc: string;
  check: (stats: Stats, state: GameState) => boolean;
};

export const ACHIEVEMENTS: Record<string, AchievementDef> = {
  first_zeno: { name: 'First Step', desc: 'Beat your first Zeno target', check: (_, s) => s.zenoLevel >= 1 },
  level_5: { name: 'Halfway There', desc: 'Reach Zeno Level 5', check: (_, s) => s.zenoLevel >= 5 },
  level_10: { name: 'Zeno Master', desc: 'Reach Zeno Level 10', check: (_, s) => s.zenoLevel >= 10 },
  perfect_140: { name: 'Edge Walker', desc: 'Land beyond 140', check: (_, s) => s.best >= 140 },
  perfect_landing: { name: 'Bullseye', desc: 'Get a perfect landing', check: (stats) => stats.perfectLandings >= 1 },
  ten_perfects: { name: 'Sharpshooter', desc: 'Get 10 perfect landings', check: (stats) => stats.perfectLandings >= 10 },
  hundred_throws: { name: 'Dedicated', desc: '100 total throws', check: (stats) => stats.totalThrows >= 100 },
  high_roller: { name: 'High Roller', desc: 'Achieve 4x multiplier', check: (stats) => stats.maxMultiplier >= 4 },
  thousand_score: { name: 'Scorer', desc: 'Accumulate 1000 total score', check: (_, s) => s.totalScore >= 1000 },
  bullet_time: { name: 'Bullet Time', desc: 'Land beyond 400 to unlock slow-mo', check: (_, s) => s.best > 400 },
  // Phase 1: Streak achievements
  hot_streak_5: { name: 'Hot Streak', desc: 'Land 5 consecutive throws at 419+', check: (_, s) => s.hotStreak >= 5 },
  hot_streak_10: { name: 'On Fire', desc: 'Land 10 consecutive throws at 419+', check: (_, s) => s.hotStreak >= 10 },
  untouchable: { name: 'Untouchable', desc: 'Land 10 times without falling', check: (_, s) => s.landingsWithoutFall >= 10 },
  marathon: { name: 'Marathon', desc: 'Make 50 throws in one session', check: (_, s) => s.sessionThrows >= 50 },
  // Phase 2: Ring achievements
  ring_rookie: { name: 'Ring Rookie', desc: 'Pass through your first ring', check: (stats) => stats.totalRingsPassed >= 1 },
  ring_collector: { name: 'Ring Collector', desc: 'Pass through 100 rings total', check: (stats) => stats.totalRingsPassed >= 100 },
  ring_master: { name: 'Ring Master', desc: 'Pass through all 3 rings in one throw', check: (stats) => stats.maxRingsInThrow >= 3 },
  triple_threat: { name: 'Triple Threat', desc: 'Get all 3 rings in 10 different throws', check: (stats) => stats.perfectRingThrows >= 10 },
};

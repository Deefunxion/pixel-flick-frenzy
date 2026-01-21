export const W = 480;
export const H = 240;
export const CLIFF_EDGE = 420;

export const BASE_GRAV = 0.15;

export const CHARGE_MS = 1800;
export const MIN_POWER = 3;
export const MAX_POWER = 10;

export const MIN_ANGLE = 20;
export const MAX_ANGLE = 70;
export const OPTIMAL_ANGLE = 45;

export const LAUNCH_PAD_X = 30;

export const STORAGE_VERSION = 2 as const;

// === Throw/Energy System ===
export const FREE_THROWS_CAP = 50;
export const FREE_THROW_REGEN_MS = 216000; // 3.6 minutes = 216,000ms
export const NEW_PLAYER_BONUS_THROWS = 100;

// Achievement throw rewards (one-time)
export const ACHIEVEMENT_REWARDS: Record<string, number> = {
  first_zeno: 10,      // First Step
  level_5: 20,         // Halfway There
  level_10: 30,        // Zeno Master
  perfect_landing: 10, // Bullseye
  ten_perfects: 20,    // Sharpshooter
  hundred_throws: 10,  // Dedicated
  hot_streak_5: 20,    // Hot Streak
};

// Milestone throw rewards (one-time)
export const MILESTONE_REWARDS: Record<string, { condition: string; amount: number }> = {
  zeno_level_up: { condition: 'each_zeno_level', amount: 10 },
  best_410: { condition: 'best >= 410', amount: 10 },
  best_419: { condition: 'best >= 419', amount: 10 },
  score_1000: { condition: 'totalScore >= 1000', amount: 10 },
  score_10000: { condition: 'totalScore >= 10000', amount: 100 },
  score_100000: { condition: 'totalScore >= 100000', amount: 1000 },
};

// Daily task throw rewards (renewable)
export const DAILY_TASK_REWARDS: Record<string, { desc: string; amount: number }> = {
  land_5: { desc: 'Land 5 times', amount: 10 },
  zeno_2x: { desc: 'Reach Zeno target 2x', amount: 10 },
  land_400: { desc: 'Land beyond 400', amount: 10 },
  air_3s: { desc: 'Stay airborne 3+ seconds', amount: 10 },
  air_4s: { desc: 'Stay airborne 4+ seconds', amount: 10 },
  air_5s: { desc: 'Stay airborne 5+ seconds', amount: 10 },
};

// Scoring cap to prevent multiplier runaway
export const MAX_FINAL_MULTIPLIER = 6.0;  // Risk (5x max) + small ring bonus

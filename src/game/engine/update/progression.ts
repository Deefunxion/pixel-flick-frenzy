/**
 * Progression module for update system
 * Handles stats, achievements, daily tasks, milestones, streaks, and leaderboard sync
 */

import {
  loadDailyStats,
  saveDailyStats,
  saveJson,
  saveNumber,
  todayLocalISODate,
  updateTodayHistory,
} from '@/game/storage';
import type { DailyStats } from '@/game/storage';
import { addToPersonalLeaderboard } from '@/game/leaderboard';
import { updateDailyChallenge, type DailyChallenge } from '@/game/dailyChallenge';
import { updateGoals, type SessionGoal } from '@/game/goals';
import type { DailyTasks, GameState } from '../types';
import { ACHIEVEMENTS } from '../achievements';
import { checkMilestones, awardZenoLevelUp } from '../milestones';
import { updateDailyProgress } from '../dailyTasks';
import { spawnCelebration } from '../state';
import { CLIFF_EDGE } from '@/game/constants';

const ACHIEVEMENT_DISPLAY_MS = 1500; // 1.5 seconds per achievement

// Audio interface for progression
export type ProgressionAudio = {
  tone: (freq: number, duration: number, type?: OscillatorType, volume?: number) => void;
  zenoJingle: () => void;
  stopEdgeWarning: () => void;
};

// UI interface for progression
export type ProgressionUI = {
  setTotalScore: (v: number) => void;
  setBestScore: (v: number) => void;
  setZenoTarget: (v: number) => void;
  setZenoLevel: (v: number) => void;
  setStats: (v: GameState['stats']) => void;
  setAchievements: (v: Set<string>) => void;
  setNewAchievement: (v: string | null) => void;
  setSessionGoals: (updater: (prev: SessionGoal[]) => SessionGoal[]) => void;
  setDailyStats: (v: DailyStats) => void;
  setDailyChallenge: (v: DailyChallenge) => void;
  setHotStreak: (current: number, best: number) => void;
  setDailyTasks: (tasks: DailyTasks) => void;
  onNewPersonalBest?: (totalScore: number, bestThrow: number) => void;
  onPbPassed?: () => void;
};

/**
 * Check and unlock achievements
 */
export function checkAchievements(
  state: GameState,
  ui: ProgressionUI,
  audio: ProgressionAudio
): void {
  const newlyUnlocked: string[] = [];

  for (const [id, achievement] of Object.entries(ACHIEVEMENTS)) {
    if (!state.achievements.has(id) && achievement.check(state.stats, state)) {
      state.achievements.add(id);
      newlyUnlocked.push(id);
      saveJson('achievements', [...state.achievements]);
    }
  }

  if (newlyUnlocked.length > 0) {
    state.achievementQueue.push(...newlyUnlocked);
    ui.setAchievements(new Set(state.achievements));

    // Play unlock sound (once for batch)
    audio.tone(523, 0.1, 'sine', 0.06);
    setTimeout(() => audio.tone(659, 0.1, 'sine', 0.06), 80);
    setTimeout(() => audio.tone(784, 0.15, 'sine', 0.08), 160);
  }
}

/**
 * Update achievement display queue (runs every frame for smooth cycling)
 */
export function updateAchievementDisplay(
  state: GameState,
  ui: ProgressionUI,
  nowMs: number
): void {
  // If nothing displaying and queue has items, start showing next
  if (!state.achievementDisplaying && state.achievementQueue.length > 0) {
    const nextId = state.achievementQueue.shift()!;
    state.achievementDisplaying = nextId;
    state.achievementDisplayStartTime = nowMs;

    const achievement = ACHIEVEMENTS[nextId];
    if (achievement) {
      const remaining = state.achievementQueue.length;
      const message = remaining > 0
        ? `${achievement.name} - Claim in Stats! +${remaining} more...`
        : `${achievement.name} - Claim in Stats!`;
      state.newAchievement = message;
      ui.setNewAchievement(message);
    }
  }

  // Check if current display time elapsed
  if (state.achievementDisplaying) {
    const elapsed = nowMs - state.achievementDisplayStartTime;
    if (elapsed >= ACHIEVEMENT_DISPLAY_MS) {
      state.achievementDisplaying = null;

      // If queue empty, clear the notification
      if (state.achievementQueue.length === 0) {
        state.newAchievement = null;
        ui.setNewAchievement(null);
      }
    }
  }
}

/**
 * Update ring stats after landing
 */
export function updateRingStats(state: GameState): void {
  state.stats.totalRingsPassed += state.ringsPassedThisThrow;
  if (state.ringsPassedThisThrow > state.stats.maxRingsInThrow) {
    state.stats.maxRingsInThrow = state.ringsPassedThisThrow;
  }
  if (state.ringsPassedThisThrow === 3) {
    state.stats.perfectRingThrows++;
  }
}

/**
 * Update total score after landing
 */
export function updateTotalScore(
  state: GameState,
  scoreGained: number,
  ui: ProgressionUI
): void {
  state.totalScore += scoreGained;
  saveNumber('total_score', state.totalScore);
  ui.setTotalScore(state.totalScore);
}

/**
 * Update daily stats after landing
 */
export function updateDailyStatsOnLanding(
  state: GameState,
  ui: ProgressionUI,
  getDailyStats: () => DailyStats
): void {
  const today = todayLocalISODate();
  const cachedDaily = getDailyStats();
  const daily = cachedDaily.date === today ? cachedDaily : loadDailyStats();
  const nextDaily: DailyStats = {
    date: today,
    bestDistance: Math.max(daily.bestDistance, state.dist),
    bestScore: Math.max(daily.bestScore, state.totalScore),
  };
  saveDailyStats(nextDaily);
  ui.setDailyStats(nextDaily);
}

/**
 * Handle Zeno progression (leveling up)
 */
export function handleZenoProgression(
  state: GameState,
  audio: ProgressionAudio,
  ui: ProgressionUI,
  theme: { accent1: string; accent2: string; accent3: string; accent4: string; highlight: string }
): boolean {
  if (state.dist >= state.zenoTarget) {
    state.zenoLevel++;
    state.best = state.dist;
    state.zenoTarget = (state.best + CLIFF_EDGE) / 2;

    saveNumber('best', state.best);
    saveNumber('zeno_target', state.zenoTarget);
    saveNumber('zeno_level', state.zenoLevel);

    ui.setBestScore(state.best);
    ui.setZenoTarget(state.zenoTarget);
    ui.setZenoLevel(state.zenoLevel);

    // Award Zeno level up bonus
    awardZenoLevelUp(state, state.zenoLevel, ui);

    state.screenFlash = state.reduceFx ? 0 : 1;
    state.celebrationBurst = true;
    spawnCelebration(state, state.px, state.py, [theme.accent2, theme.accent1, theme.highlight, theme.accent4, theme.accent3]);

    audio.zenoJingle();
    audio.stopEdgeWarning();

    if (state.runTrail.length > 0) {
      state.bestTrail = state.runTrail.slice(0, 240);
      saveJson('best_trail', state.bestTrail);
    }

    ui.setSessionGoals((prev) => updateGoals(prev, { beat_target_once: 1 }));
    ui.onNewPersonalBest?.(state.totalScore, state.best);
    ui.onPbPassed?.();

    return true;
  } else if (state.dist > state.best) {
    state.best = state.dist;
    saveNumber('best', state.best);
    ui.setBestScore(state.best);
    audio.tone(660, 0.08, 'sine', 0.08);

    if (state.runTrail.length > 0) {
      state.bestTrail = state.runTrail.slice(0, 240);
      saveJson('best_trail', state.bestTrail);
    }

    ui.onNewPersonalBest?.(state.totalScore, state.best);
    ui.onPbPassed?.();

    return false;
  }

  return false;
}

/**
 * Update landing stats (successful landings, distance, multiplier, perfect)
 */
export function updateLandingStats(
  state: GameState,
  isPerfect: boolean,
  finalMultiplier: number,
  ui: ProgressionUI
): void {
  state.stats.successfulLandings++;
  state.stats.totalDistance += state.dist;
  if (isPerfect) state.stats.perfectLandings++;
  if (finalMultiplier > state.stats.maxMultiplier) state.stats.maxMultiplier = finalMultiplier;

  // Increment landingsWithoutFall streak
  state.landingsWithoutFall++;

  ui.setSessionGoals((prev) => updateGoals(prev, { land_5_times: 1 }));
  if (finalMultiplier >= 3) ui.setSessionGoals((prev) => updateGoals(prev, { reach_multiplier_3: 1 }));
  if (isPerfect) ui.setSessionGoals((prev) => updateGoals(prev, { two_perfects: 1 }));
}

/**
 * Update throw stats and save
 */
export function updateThrowStats(state: GameState, ui: ProgressionUI): void {
  state.stats.totalThrows++;
  state.sessionThrows++; // Session-volatile counter for Marathon achievement
  saveJson('stats', state.stats);
  ui.setStats({ ...state.stats });

  // Update history tracking for stats page
  updateTodayHistory(state.best, state.stats.totalThrows, state.totalScore);
}

/**
 * Add to personal leaderboard if distance is meaningful
 */
export function updatePersonalLeaderboard(distance: number): void {
  if (distance > 50) {
    addToPersonalLeaderboard(distance);
  }
}

/**
 * Update daily challenge progress
 */
export function updateDailyChallengeProgress(
  state: GameState,
  ui: ProgressionUI
): void {
  const updatedChallenge = updateDailyChallenge(state.dist, state.lastMultiplier, state.fellOff);
  ui.setDailyChallenge(updatedChallenge);
}

/**
 * Update daily tasks on successful landing
 */
export function updateDailyTasksOnLanding(
  state: GameState,
  nowMs: number,
  ui: ProgressionUI
): void {
  if (state.fellOff) return;

  const airTimeSeconds = (nowMs - state.launchTimestamp) / 1000;

  // Track max air time for achievements
  if (airTimeSeconds > state.stats.maxAirTime) {
    state.stats.maxAirTime = airTimeSeconds;
  }

  const reachedZeno = state.dist >= state.zenoTarget;
  updateDailyProgress(state, state.dist, reachedZeno, airTimeSeconds);
  ui.setDailyTasks({ ...state.dailyTasks });
}

/**
 * Update hot streak tracking
 */
export function updateHotStreak(
  state: GameState,
  ui: ProgressionUI
): void {
  // Hot streak tracking (consecutive 419+ throws)
  if (!state.fellOff && state.dist >= 419) {
    state.hotStreak++;
    if (state.hotStreak > state.bestHotStreak) {
      state.bestHotStreak = state.hotStreak;
      saveNumber('best_hot_streak', state.bestHotStreak);
    }
  } else {
    state.hotStreak = 0;
  }
  ui.setHotStreak(state.hotStreak, state.bestHotStreak);

  // Session heat (builds across session, doesn't reset on fail)
  if (!state.fellOff) {
    state.sessionHeat = Math.min(100, state.sessionHeat + 5);
  }
  // ON FIRE mode triggers at streak 5+
  state.onFireMode = state.hotStreak >= 5;
}

/**
 * Handle fall stats (increment falls, reset streaks)
 */
export function handleFallStats(
  state: GameState,
  ui: { onFall?: (totalFalls: number) => void }
): void {
  state.totalFalls++;
  saveNumber('total_falls', state.totalFalls);
  ui.onFall?.(state.totalFalls);

  // Reset landingsWithoutFall streak on fall
  state.landingsWithoutFall = 0;
}

/**
 * Run all milestone checks
 */
export function runMilestoneChecks(state: GameState, ui: ProgressionUI): void {
  checkMilestones(state, ui);
}

// src/game/engine/dailyChallenge/state.ts

import type { DailyChallengeState } from './types';
import { loadJson, saveJson, todayLocalISODate, dailySeedFromDate } from '@/game/storage';

const STORAGE_KEY = 'daily_challenge';

export function loadDailyChallengeState(): DailyChallengeState {
  const today = todayLocalISODate();
  const defaultState: DailyChallengeState = {
    date: today,
    levelSeed: dailySeedFromDate(today),
    bestScore: 0,
    attempts: 0,
    completed: false,
    stars: 0,
  };

  const saved = loadJson<DailyChallengeState>(STORAGE_KEY, defaultState);

  // Reset if it's a new day
  if (saved.date !== today) {
    const fresh: DailyChallengeState = {
      date: today,
      levelSeed: dailySeedFromDate(today),
      bestScore: 0,
      attempts: 0,
      completed: false,
      stars: 0,
    };
    saveDailyChallengeState(fresh);
    return fresh;
  }

  return saved;
}

export function saveDailyChallengeState(state: DailyChallengeState): void {
  saveJson(STORAGE_KEY, state);
}

export function recordDailyAttempt(
  state: DailyChallengeState,
  score: number,
  stars: number
): DailyChallengeState {
  const updated: DailyChallengeState = {
    ...state,
    attempts: state.attempts + 1,
    bestScore: Math.max(state.bestScore, score),
    completed: state.completed || stars > 0,
    stars: Math.max(state.stars, stars),
  };
  saveDailyChallengeState(updated);
  return updated;
}

export function getDailyChallengeProgress(state: DailyChallengeState): {
  hasPlayed: boolean;
  hasCompleted: boolean;
  bestScore: number;
  stars: number;
  attempts: number;
} {
  return {
    hasPlayed: state.attempts > 0,
    hasCompleted: state.completed,
    bestScore: state.bestScore,
    stars: state.stars,
    attempts: state.attempts,
  };
}

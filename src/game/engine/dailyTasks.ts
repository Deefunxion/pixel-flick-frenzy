/**
 * Daily Tasks System
 *
 * Renewable daily challenges that award throws.
 */

import type { GameState, DailyTasks, ThrowState } from './types';
import { DAILY_TASK_REWARDS } from '@/game/constants';
import { addPermanentThrows } from './throws';
import { saveJson } from '@/game/storage';

/**
 * Reset daily tasks if it's a new day
 */
export function checkDailyReset(state: GameState): void {
  const today = new Date().toISOString().split('T')[0];

  if (state.dailyTasks.date !== today) {
    state.dailyTasks = {
      date: today,
      landCount: 0,
      zenoTargetCount: 0,
      landed400: false,
      airTime3s: false,
      airTime4s: false,
      airTime5s: false,
      claimed: [],
    };
    saveJson('daily_tasks', state.dailyTasks);
  }
}

/**
 * Update daily task progress after a landing
 */
export function updateDailyProgress(
  state: GameState,
  landingDist: number,
  reachedZeno: boolean,
  airTimeSeconds: number
): void {
  checkDailyReset(state);

  state.dailyTasks.landCount++;

  if (reachedZeno) {
    state.dailyTasks.zenoTargetCount++;
  }

  if (landingDist >= 400) {
    state.dailyTasks.landed400 = true;
  }

  if (airTimeSeconds >= 3) state.dailyTasks.airTime3s = true;
  if (airTimeSeconds >= 4) state.dailyTasks.airTime4s = true;
  if (airTimeSeconds >= 5) state.dailyTasks.airTime5s = true;

  saveJson('daily_tasks', state.dailyTasks);
}

/**
 * Check which daily tasks can be claimed
 */
export function getClaimableTasks(dailyTasks: DailyTasks): string[] {
  const claimable: string[] = [];

  if (dailyTasks.landCount >= 5 && !dailyTasks.claimed.includes('land_5')) {
    claimable.push('land_5');
  }
  if (dailyTasks.zenoTargetCount >= 2 && !dailyTasks.claimed.includes('zeno_2x')) {
    claimable.push('zeno_2x');
  }
  if (dailyTasks.landed400 && !dailyTasks.claimed.includes('land_400')) {
    claimable.push('land_400');
  }
  if (dailyTasks.airTime3s && !dailyTasks.claimed.includes('air_3s')) {
    claimable.push('air_3s');
  }
  if (dailyTasks.airTime4s && !dailyTasks.claimed.includes('air_4s')) {
    claimable.push('air_4s');
  }
  if (dailyTasks.airTime5s && !dailyTasks.claimed.includes('air_5s')) {
    claimable.push('air_5s');
  }

  return claimable;
}

/**
 * Claim a daily task reward
 */
export function claimDailyTask(
  state: GameState,
  taskId: string,
  ui: { setThrowState: (t: ThrowState) => void }
): boolean {
  const reward = DAILY_TASK_REWARDS[taskId];
  if (!reward) return false;

  if (state.dailyTasks.claimed.includes(taskId)) return false;

  const claimable = getClaimableTasks(state.dailyTasks);
  if (!claimable.includes(taskId)) return false;

  state.throwState = addPermanentThrows(state.throwState, reward.amount);
  state.dailyTasks.claimed.push(taskId);

  saveJson('throw_state', state.throwState);
  saveJson('daily_tasks', state.dailyTasks);
  ui.setThrowState(state.throwState);

  return true;
}

/**
 * Get all daily tasks with their status
 */
export function getDailyTasksStatus(dailyTasks: DailyTasks): Array<{
  id: string;
  desc: string;
  reward: number;
  completed: boolean;
  claimed: boolean;
}> {
  return [
    {
      id: 'land_5',
      desc: `Land 5 times (${Math.min(dailyTasks.landCount, 5)}/5)`,
      reward: 10,
      completed: dailyTasks.landCount >= 5,
      claimed: dailyTasks.claimed.includes('land_5'),
    },
    {
      id: 'zeno_2x',
      desc: `Reach Zeno target 2x (${Math.min(dailyTasks.zenoTargetCount, 2)}/2)`,
      reward: 10,
      completed: dailyTasks.zenoTargetCount >= 2,
      claimed: dailyTasks.claimed.includes('zeno_2x'),
    },
    {
      id: 'land_400',
      desc: 'Land beyond 400',
      reward: 10,
      completed: dailyTasks.landed400,
      claimed: dailyTasks.claimed.includes('land_400'),
    },
    {
      id: 'air_3s',
      desc: 'Stay airborne 3+ seconds',
      reward: 10,
      completed: dailyTasks.airTime3s,
      claimed: dailyTasks.claimed.includes('air_3s'),
    },
    {
      id: 'air_4s',
      desc: 'Stay airborne 4+ seconds',
      reward: 10,
      completed: dailyTasks.airTime4s,
      claimed: dailyTasks.claimed.includes('air_4s'),
    },
    {
      id: 'air_5s',
      desc: 'Stay airborne 5+ seconds',
      reward: 10,
      completed: dailyTasks.airTime5s,
      claimed: dailyTasks.claimed.includes('air_5s'),
    },
  ];
}

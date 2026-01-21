/**
 * Milestone Rewards System
 *
 * One-time rewards for reaching specific thresholds.
 */

import type { GameState, ThrowState } from './types';
import { addPermanentThrows } from './throws';
import { saveJson } from '@/game/storage';

interface MilestoneCheck {
  id: string;
  check: (state: GameState) => boolean;
  amount: number;
}

const MILESTONE_CHECKS: MilestoneCheck[] = [
  { id: 'best_410', check: (s) => s.best >= 410, amount: 10 },
  { id: 'best_419', check: (s) => s.best >= 419, amount: 10 },
  { id: 'score_1000', check: (s) => s.totalScore >= 1000, amount: 10 },
  { id: 'score_10000', check: (s) => s.totalScore >= 10000, amount: 100 },
  { id: 'score_100000', check: (s) => s.totalScore >= 100000, amount: 1000 },
];

/**
 * Check and award milestone rewards
 */
export function checkMilestones(
  state: GameState,
  ui: { setThrowState: (t: ThrowState) => void }
): void {
  let awarded = false;

  for (const milestone of MILESTONE_CHECKS) {
    if (state.milestonesClaimed.milestones.includes(milestone.id)) continue;

    if (milestone.check(state)) {
      state.throwState = addPermanentThrows(state.throwState, milestone.amount);
      state.milestonesClaimed.milestones.push(milestone.id);
      awarded = true;
    }
  }

  if (awarded) {
    saveJson('throw_state', state.throwState);
    saveJson('milestones_claimed', state.milestonesClaimed);
    ui.setThrowState(state.throwState);
  }
}

/**
 * Award throws for Zeno level up
 */
export function awardZenoLevelUp(
  state: GameState,
  newLevel: number,
  ui: { setThrowState: (t: ThrowState) => void }
): void {
  const milestoneId = `zeno_level_${newLevel}`;

  if (!state.milestonesClaimed.milestones.includes(milestoneId)) {
    state.throwState = addPermanentThrows(state.throwState, 10);
    state.milestonesClaimed.milestones.push(milestoneId);
    saveJson('throw_state', state.throwState);
    saveJson('milestones_claimed', state.milestonesClaimed);
    ui.setThrowState(state.throwState);
  }
}

/**
 * Achievement Claim System
 *
 * Handles manual claiming of achievement rewards via the Stats UI.
 * Achievements must be unlocked AND manually claimed to receive throw rewards.
 */

import type { GameState, ThrowState } from './types';
import { ACHIEVEMENTS } from './achievements';
import { ACHIEVEMENT_REWARDS, ACHIEVEMENT_TIER_REWARDS } from '@/game/constants';
import { addPermanentThrows } from './throws';
import { saveJson } from '@/game/storage';

/**
 * Get the throw reward for an achievement.
 * Checks legacy rewards first, then tier-based rewards.
 */
export function getAchievementReward(achievementId: string): number {
  // Check legacy rewards first (for backwards compatibility)
  const legacy = ACHIEVEMENT_REWARDS[achievementId];
  if (legacy !== undefined) return legacy;

  // Fall back to tier-based rewards
  const achievement = ACHIEVEMENTS[achievementId];
  if (achievement?.tier) {
    return ACHIEVEMENT_TIER_REWARDS[achievement.tier] || 0;
  }
  return 0;
}

/**
 * Claim an achievement reward.
 * Returns true if the reward was successfully claimed.
 */
export function claimAchievement(
  state: GameState,
  achievementId: string,
  ui: { setThrowState: (t: ThrowState) => void }
): boolean {
  // Must be unlocked
  if (!state.achievements.has(achievementId)) return false;

  // Must not be already claimed
  if (state.milestonesClaimed.achievements.includes(achievementId)) return false;

  const reward = getAchievementReward(achievementId);
  if (!reward) return false;

  // Grant reward
  state.throwState = addPermanentThrows(state.throwState, reward);
  state.milestonesClaimed.achievements.push(achievementId);

  // Persist
  saveJson('throw_state', state.throwState);
  saveJson('milestones_claimed', state.milestonesClaimed);
  ui.setThrowState(state.throwState);

  return true;
}

/**
 * Get list of achievements that are unlocked but not yet claimed.
 * Only includes achievements that exist in the current ACHIEVEMENTS object.
 */
export function getUnclaimedAchievements(
  achievements: Set<string>,
  claimedIds: string[]
): string[] {
  return [...achievements].filter(id =>
    !claimedIds.includes(id) && ACHIEVEMENTS[id] !== undefined
  );
}

/**
 * Get the count of unclaimed achievements (for badge/notification display).
 * Only counts achievements that exist in the current ACHIEVEMENTS object.
 */
export function getUnclaimedCount(
  achievements: Set<string>,
  claimedIds: string[]
): number {
  return getUnclaimedAchievements(achievements, claimedIds).length;
}

/**
 * Claim all unclaimed achievements with animated cascade.
 * Returns array of { id, reward } for each claimed achievement.
 */
export function getClaimableAchievements(
  achievements: Set<string>,
  claimedIds: string[]
): { id: string; reward: number }[] {
  return getUnclaimedAchievements(achievements, claimedIds)
    .map(id => ({ id, reward: getAchievementReward(id) }))
    .filter(a => a.reward > 0);
}

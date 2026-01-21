import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getAchievementReward,
  claimAchievement,
  getUnclaimedAchievements,
  getUnclaimedCount,
} from '../achievementClaim';
import { createInitialState } from '../state';
import { ACHIEVEMENT_REWARDS, ACHIEVEMENT_TIER_REWARDS } from '@/game/constants';
import type { GameState, ThrowState } from '../types';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    clear: () => {
      store = {};
    },
    removeItem: (key: string) => {
      delete store[key];
    },
  };
})();

vi.stubGlobal('localStorage', localStorageMock);

describe('getAchievementReward', () => {
  it('returns legacy reward for known legacy achievement IDs', () => {
    expect(getAchievementReward('first_zeno')).toBe(ACHIEVEMENT_REWARDS['first_zeno']);
    expect(getAchievementReward('level_5')).toBe(ACHIEVEMENT_REWARDS['level_5']);
    expect(getAchievementReward('perfect_landing')).toBe(ACHIEVEMENT_REWARDS['perfect_landing']);
  });

  it('returns tier-based reward for achievements without legacy reward', () => {
    // Distance achievements use tier-based rewards
    const reward = getAchievementReward('dist_400');
    expect(reward).toBe(ACHIEVEMENT_TIER_REWARDS['bronze']);
  });

  it('returns 0 for unknown achievement ID', () => {
    expect(getAchievementReward('nonexistent_achievement_xyz')).toBe(0);
  });
});

describe('claimAchievement', () => {
  let state: GameState;
  let setThrowState: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    localStorageMock.clear();
    state = createInitialState({ reduceFx: false });
    setThrowState = vi.fn();
  });

  it('returns false if achievement is not unlocked', () => {
    // Achievement not in state.achievements
    const result = claimAchievement(state, 'dist_400', { setThrowState });
    expect(result).toBe(false);
    expect(setThrowState).not.toHaveBeenCalled();
  });

  it('returns false if achievement is already claimed', () => {
    // Unlock the achievement
    state.achievements.add('dist_400');
    // Mark it as claimed
    state.milestonesClaimed.achievements.push('dist_400');

    const result = claimAchievement(state, 'dist_400', { setThrowState });
    expect(result).toBe(false);
    expect(setThrowState).not.toHaveBeenCalled();
  });

  it('grants throws and marks claimed for unlocked unclaimed achievement', () => {
    // Unlock the achievement
    state.achievements.add('dist_400');
    const initialPermanent = state.throwState.permanentThrows;

    const result = claimAchievement(state, 'dist_400', { setThrowState });

    expect(result).toBe(true);
    expect(state.milestonesClaimed.achievements).toContain('dist_400');
    expect(state.throwState.permanentThrows).toBe(
      initialPermanent + ACHIEVEMENT_TIER_REWARDS['bronze']
    );
    expect(setThrowState).toHaveBeenCalledWith(state.throwState);
  });

  it('uses legacy reward amount for legacy achievements', () => {
    state.achievements.add('first_zeno');
    const initialPermanent = state.throwState.permanentThrows;

    const result = claimAchievement(state, 'first_zeno', { setThrowState });

    expect(result).toBe(true);
    expect(state.throwState.permanentThrows).toBe(
      initialPermanent + ACHIEVEMENT_REWARDS['first_zeno']
    );
  });

  it('prevents double-claiming the same achievement', () => {
    state.achievements.add('dist_400');

    // First claim
    const result1 = claimAchievement(state, 'dist_400', { setThrowState });
    expect(result1).toBe(true);

    const throwsAfterFirstClaim = state.throwState.permanentThrows;

    // Second claim attempt
    const result2 = claimAchievement(state, 'dist_400', { setThrowState });
    expect(result2).toBe(false);
    expect(state.throwState.permanentThrows).toBe(throwsAfterFirstClaim);
  });
});

describe('getUnclaimedAchievements', () => {
  it('returns empty array when no achievements are unlocked', () => {
    const achievements = new Set<string>();
    const claimed: string[] = [];

    const result = getUnclaimedAchievements(achievements, claimed);
    expect(result).toEqual([]);
  });

  it('returns all unlocked achievements when none are claimed', () => {
    const achievements = new Set(['dist_400', 'dist_410', 'dist_419']);
    const claimed: string[] = [];

    const result = getUnclaimedAchievements(achievements, claimed);
    expect(result).toHaveLength(3);
    expect(result).toContain('dist_400');
    expect(result).toContain('dist_410');
    expect(result).toContain('dist_419');
  });

  it('filters out claimed achievements', () => {
    const achievements = new Set(['dist_400', 'dist_410', 'dist_419']);
    const claimed = ['dist_400', 'dist_419'];

    const result = getUnclaimedAchievements(achievements, claimed);
    expect(result).toHaveLength(1);
    expect(result).toContain('dist_410');
  });

  it('returns empty array when all achievements are claimed', () => {
    const achievements = new Set(['dist_400', 'dist_410']);
    const claimed = ['dist_400', 'dist_410'];

    const result = getUnclaimedAchievements(achievements, claimed);
    expect(result).toEqual([]);
  });
});

describe('getUnclaimedCount', () => {
  it('returns 0 when no achievements are unlocked', () => {
    const achievements = new Set<string>();
    const claimed: string[] = [];

    expect(getUnclaimedCount(achievements, claimed)).toBe(0);
  });

  it('returns count of unclaimed achievements', () => {
    const achievements = new Set(['dist_400', 'dist_410', 'dist_419']);
    const claimed = ['dist_400'];

    expect(getUnclaimedCount(achievements, claimed)).toBe(2);
  });

  it('returns 0 when all are claimed', () => {
    const achievements = new Set(['dist_400', 'dist_410']);
    const claimed = ['dist_400', 'dist_410'];

    expect(getUnclaimedCount(achievements, claimed)).toBe(0);
  });
});

import { describe, it, expect } from 'vitest';
import {
  generateDistanceAchievements,
  generateZenoAchievements,
  generateThrowsAchievements,
  generateScoreAchievements,
  AchievementTier,
} from '../achievementGenerators';
import type { Stats, GameState } from '../types';

describe('Achievement Generators', () => {
  describe('generateDistanceAchievements', () => {
    it('generates 20 whole number achievements (400-419)', () => {
      const achievements = generateDistanceAchievements();
      const wholeNumbers = Object.keys(achievements).filter(k => k.match(/^dist_4\d{2}$/));
      expect(wholeNumbers.length).toBe(20);
    });

    it('generates 9 first decimal achievements (419.1-419.9)', () => {
      const achievements = generateDistanceAchievements();
      const decimals = Object.keys(achievements).filter(k => k.match(/^dist_419_\d$/));
      expect(decimals.length).toBe(9);
    });

    it('generates correct check function for dist_410', () => {
      const achievements = generateDistanceAchievements();
      const mockStats = { totalThrows: 0 } as Partial<Stats> as Stats;
      const mockState = { best: 410 } as Partial<GameState> as GameState;
      expect(achievements['dist_410'].check(mockStats, mockState)).toBe(true);
      mockState.best = 409.9;
      expect(achievements['dist_410'].check(mockStats, mockState)).toBe(false);
    });

    it('assigns correct tiers', () => {
      const achievements = generateDistanceAchievements();
      expect(achievements['dist_400'].tier).toBe('bronze');
      expect(achievements['dist_419'].tier).toBe('gold');
      expect(achievements['dist_419_9'].tier).toBe('platinum');
      expect(achievements['dist_419_99'].tier).toBe('diamond');
      expect(achievements['dist_419_999'].tier).toBe('mythic');
    });
  });

  describe('generateZenoAchievements', () => {
    it('generates 15 zeno level achievements', () => {
      const achievements = generateZenoAchievements();
      expect(Object.keys(achievements).length).toBe(15);
    });

    it('includes levels 1, 5, 10, 20, 50, 100, 200', () => {
      const achievements = generateZenoAchievements();
      expect(achievements['zeno_1']).toBeDefined();
      expect(achievements['zeno_5']).toBeDefined();
      expect(achievements['zeno_10']).toBeDefined();
      expect(achievements['zeno_50']).toBeDefined();
      expect(achievements['zeno_100']).toBeDefined();
      expect(achievements['zeno_200']).toBeDefined();
    });
  });
});

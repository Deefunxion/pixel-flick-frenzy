import type { GameState, Stats } from './types';
import { generateAllAchievements, type GeneratedAchievement, type AchievementTier } from './achievementGenerators';

export type AchievementDef = {
  name: string;
  desc: string;
  tier?: AchievementTier;
  check: (stats: Stats, state: GameState) => boolean;
};

// Generate all achievements programmatically
const generatedAchievements = generateAllAchievements();

// Convert GeneratedAchievement to AchievementDef
export const ACHIEVEMENTS: Record<string, AchievementDef> = Object.fromEntries(
  Object.entries(generatedAchievements).map(([id, achievement]) => [
    id,
    {
      name: achievement.name,
      desc: achievement.desc,
      tier: achievement.tier,
      check: achievement.check,
    },
  ])
);

// Export tier type for reward system
export type { AchievementTier };

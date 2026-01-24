import type { GameState, Stats } from './types';

export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'mythic';

export type GeneratedAchievement = {
  name: string;
  desc: string;
  tier: AchievementTier;
  check: (stats: Stats, state: GameState) => boolean;
};

// Tier based on distance threshold
function getDistanceTier(distance: number): AchievementTier {
  if (distance >= 419.999) return 'mythic';
  if (distance >= 419.99) return 'diamond';
  if (distance >= 419.9) return 'platinum';
  if (distance >= 419) return 'gold';
  if (distance >= 415) return 'silver';
  return 'bronze';
}

export function generateDistanceAchievements(): Record<string, GeneratedAchievement> {
  const achievements: Record<string, GeneratedAchievement> = {};

  // 400-419 whole numbers
  for (let d = 400; d <= 419; d++) {
    const id = `dist_${d}`;
    achievements[id] = {
      name: d === 404 ? 'Not Found... JK!' : d === 419 ? 'The Edge Dweller' : `Breaking ${d}`,
      desc: `Land beyond ${d}`,
      tier: getDistanceTier(d),
      check: (_, s) => s.best >= d,
    };
  }

  // 419.1 - 419.9
  for (let i = 1; i <= 9; i++) {
    const d = 419 + i / 10;
    const id = `dist_419_${i}`;
    achievements[id] = {
      name: i === 5 ? 'Halfway to Perfect' : i === 9 ? 'Almost There' : `Point ${['One','Two','Three','Four','Five','Six','Seven','Eight','Nine'][i-1]}`,
      desc: `Land beyond ${d.toFixed(1)}`,
      tier: getDistanceTier(d),
      check: (_, s) => s.best >= d,
    };
  }

  // 419.91 - 419.99
  for (let i = 91; i <= 99; i++) {
    const d = 419 + i / 100;
    const id = `dist_419_${i}`;
    achievements[id] = {
      name: i === 99 ? 'The 99 Club' : `Ninety-${['One','Two','Three','Four','Five','Six','Seven','Eight','Nine'][i-91]}`,
      desc: `Land beyond ${d.toFixed(2)}`,
      tier: getDistanceTier(d),
      check: (_, s) => s.best >= d,
    };
  }

  // 419.991 - 419.999
  for (let i = 991; i <= 999; i++) {
    const d = 419 + i / 1000;
    const id = `dist_419_${i}`;
    const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX'];
    achievements[id] = {
      name: i === 999 ? 'The Limit' : `Thousandth ${romanNumerals[i-991]}`,
      desc: `Land beyond ${d.toFixed(3)}`,
      tier: getDistanceTier(d),
      check: (_, s) => s.best >= d,
    };
  }

  // 419.9991 - 419.9999
  for (let i = 9991; i <= 9999; i++) {
    const d = 419 + i / 10000;
    const id = `dist_419_${i}`;
    const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX'];
    achievements[id] = {
      name: i === 9999 ? "Zeno's Paradox" : `Beyond Mortal ${romanNumerals[i-9991]}`,
      desc: `Land beyond ${d.toFixed(4)}`,
      tier: 'mythic',
      check: (_, s) => s.best >= d,
    };
  }

  return achievements;
}

export function generateZenoAchievements(): Record<string, GeneratedAchievement> {
  const levels = [1, 2, 3, 5, 7, 10, 15, 20, 25, 30, 40, 50, 75, 100, 200];
  const names: Record<number, string> = {
    1: 'First Step',
    2: 'Getting Started',
    3: "Third Time's a Charm",
    5: 'Halfway There',
    7: 'Lucky Seven',
    10: 'Zeno Master',
    15: 'Zeno Expert',
    20: 'Zeno Veteran',
    25: 'Quarter Century',
    30: 'Zeno Elder',
    40: 'Zeno Sage',
    50: 'Half a Hundred',
    75: 'Zeno Legend',
    100: 'Centurion',
    200: 'Infinite Approach',
  };

  const achievements: Record<string, GeneratedAchievement> = {};
  for (const level of levels) {
    const id = `zeno_${level}`;
    const tier: AchievementTier = level >= 100 ? 'mythic' : level >= 50 ? 'diamond' : level >= 20 ? 'gold' : level >= 10 ? 'silver' : 'bronze';
    achievements[id] = {
      name: names[level],
      desc: `Reach Zeno Level ${level}`,
      tier,
      check: (_, s) => s.zenoLevel >= level,
    };
  }
  return achievements;
}

export function generateThrowsAchievements(): Record<string, GeneratedAchievement> {
  const milestones = [50, 100, 250, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000, 250000, 500000, 1000000];
  const names: Record<number, string> = {
    50: 'Getting Started',
    100: 'Dedicated',
    250: 'Committed',
    500: 'Half Thousand',
    1000: 'Thousand Club',
    2500: 'Devoted',
    5000: 'Five Thousand Strong',
    10000: 'Ten Thousand',
    25000: 'Obsessed',
    50000: 'Fifty Thousand',
    100000: 'One Hundred Thousand',
    250000: 'Quarter Million',
    500000: 'Half Million',
    1000000: 'Millionaire Thrower',
  };

  const achievements: Record<string, GeneratedAchievement> = {};
  for (const count of milestones) {
    const id = `throws_${count}`;
    const tier: AchievementTier = count >= 100000 ? 'mythic' : count >= 10000 ? 'diamond' : count >= 1000 ? 'gold' : count >= 250 ? 'silver' : 'bronze';
    achievements[id] = {
      name: names[count],
      desc: `Make ${count.toLocaleString()} throws`,
      tier,
      check: (stats) => stats.totalThrows >= count,
    };
  }
  return achievements;
}

export function generateScoreAchievements(): Record<string, GeneratedAchievement> {
  const milestones = [500, 1000, 2500, 5000, 10000, 25000, 50000, 100000, 250000, 500000, 1000000, 5000000, 10000000];
  const names: Record<number, string> = {
    500: 'First Haul',
    1000: 'Scorer',
    2500: 'Building Up',
    5000: 'Five K',
    10000: 'Ten K',
    25000: 'Twenty-Five K',
    50000: 'Fifty K',
    100000: 'Hundred K',
    250000: 'Quarter Million',
    500000: 'Half Million',
    1000000: 'Millionaire',
    5000000: 'Five Million',
    10000000: 'Ten Million',
  };

  const achievements: Record<string, GeneratedAchievement> = {};
  for (const score of milestones) {
    const id = `score_${score}`;
    const tier: AchievementTier = score >= 1000000 ? 'mythic' : score >= 100000 ? 'diamond' : score >= 10000 ? 'gold' : score >= 2500 ? 'silver' : 'bronze';
    achievements[id] = {
      name: names[score],
      desc: `Accumulate ${score.toLocaleString()} total score`,
      tier,
      check: (_, s) => s.totalScore >= score,
    };
  }
  return achievements;
}

export function generatePerfectLandingAchievements(): Record<string, GeneratedAchievement> {
  const milestones = [1, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000];
  const names: Record<number, string> = {
    1: 'Bullseye',
    5: 'Sharp Eye',
    10: 'Sharpshooter',
    25: 'Precision Player',
    50: 'Half Century',
    100: 'Century Mark',
    250: 'Quarter Thousand',
    500: 'High Five Hundred',
    1000: 'Thousand Perfects',
    2500: 'Perfectionist',
    5000: 'Precision Master',
    10000: 'Perfect Legend',
  };

  const achievements: Record<string, GeneratedAchievement> = {};
  for (const count of milestones) {
    const id = `perfect_${count}`;
    const tier: AchievementTier = count >= 5000 ? 'mythic' : count >= 500 ? 'diamond' : count >= 100 ? 'gold' : count >= 25 ? 'silver' : 'bronze';
    achievements[id] = {
      name: names[count],
      desc: `Get ${count.toLocaleString()} perfect landings`,
      tier,
      check: (stats) => stats.perfectLandings >= count,
    };
  }
  return achievements;
}

export function generateRingsAchievements(): Record<string, GeneratedAchievement> {
  const achievements: Record<string, GeneratedAchievement> = {};

  // Total rings passed
  const ringMilestones = [1, 10, 25, 50, 100, 250, 500, 1000];
  const ringNames: Record<number, string> = {
    1: 'Ring Rookie',
    10: 'Ring Hunter',
    25: 'Ring Seeker',
    50: 'Ring Gatherer',
    100: 'Ring Collector',
    250: 'Ring Enthusiast',
    500: 'Ring Fanatic',
    1000: 'Ring Master',
  };

  for (const count of ringMilestones) {
    const id = `rings_${count}`;
    const tier: AchievementTier = count >= 500 ? 'diamond' : count >= 100 ? 'gold' : count >= 25 ? 'silver' : 'bronze';
    achievements[id] = {
      name: ringNames[count],
      desc: `Pass through ${count.toLocaleString()} rings total`,
      tier,
      check: (stats) => stats.totalRingsPassed >= count,
    };
  }

  // Perfect ring throws (all 3)
  const perfectRingMilestones = [1, 5, 10, 25, 50, 100];
  const perfectRingNames: Record<number, string> = {
    1: 'Triple Ring',
    5: 'Ring Ace',
    10: 'Triple Threat',
    25: 'Ring Champion',
    50: 'Ring Legend',
    100: 'Ring God',
  };

  for (const count of perfectRingMilestones) {
    const id = `rings_perfect_${count}`;
    const tier: AchievementTier = count >= 50 ? 'diamond' : count >= 10 ? 'gold' : count >= 5 ? 'silver' : 'bronze';
    achievements[id] = {
      name: perfectRingNames[count],
      desc: count === 1 ? 'Pass through all 3 rings in one throw' : `Get all 3 rings in ${count} different throws`,
      tier,
      check: (stats) => stats.perfectRingThrows >= count,
    };
  }

  return achievements;
}

export function generateStreakAchievements(): Record<string, GeneratedAchievement> {
  const achievements: Record<string, GeneratedAchievement> = {};

  // Hot streak (consecutive 419+)
  const hotStreakMilestones = [3, 5, 7, 10, 15, 20, 25, 50];
  const hotStreakNames: Record<number, string> = {
    3: 'Warming Up',
    5: 'Hot Streak',
    7: 'Heating Up',
    10: 'On Fire',
    15: 'Blazing',
    20: 'Inferno',
    25: 'Supernova',
    50: 'Solar Flare',
  };

  for (const count of hotStreakMilestones) {
    const id = `streak_hot_${count}`;
    const tier: AchievementTier = count >= 25 ? 'mythic' : count >= 15 ? 'diamond' : count >= 10 ? 'gold' : count >= 5 ? 'silver' : 'bronze';
    achievements[id] = {
      name: hotStreakNames[count],
      desc: `Land ${count} consecutive throws at 419+`,
      tier,
      check: (_, s) => s.hotStreak >= count || s.bestHotStreak >= count,
    };
  }

  // Safe landings (without fall)
  const safeMilestones = [5, 10, 15, 20, 30, 50, 100];
  const safeNames: Record<number, string> = {
    5: 'Safe Landing',
    10: 'Untouchable',
    15: 'Sure-footed',
    20: 'Steady',
    30: 'Unshakeable',
    50: 'Ironclad',
    100: 'Invincible',
  };

  for (const count of safeMilestones) {
    const id = `streak_safe_${count}`;
    const tier: AchievementTier = count >= 50 ? 'diamond' : count >= 20 ? 'gold' : count >= 10 ? 'silver' : 'bronze';
    achievements[id] = {
      name: safeNames[count],
      desc: `Land ${count} times without falling`,
      tier,
      check: (_, s) => s.landingsWithoutFall >= count,
    };
  }

  // Session marathon
  const sessionMilestones = [50, 100, 200];
  const sessionNames: Record<number, string> = {
    50: 'Marathon',
    100: 'Century Session',
    200: 'Double Century',
  };

  for (const count of sessionMilestones) {
    const id = `session_${count}`;
    const tier: AchievementTier = count >= 200 ? 'gold' : count >= 100 ? 'silver' : 'bronze';
    achievements[id] = {
      name: sessionNames[count],
      desc: `Make ${count} throws in one session`,
      tier,
      check: (_, s) => s.sessionThrows >= count,
    };
  }

  return achievements;
}

export function generateAirTimeAchievements(): Record<string, GeneratedAchievement> {
  const achievements: Record<string, GeneratedAchievement> = {};

  const milestones = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const names: Record<number, string> = {
    1: 'Takeoff',
    2: 'Floating',
    3: 'Hang Time',
    4: 'Flight',
    5: 'Soaring',
    6: 'Extended Flight',
    7: 'Long Haul',
    8: 'Marathon Flight',
    9: 'Endless Sky',
    10: 'Eternal Flight',
  };

  for (const seconds of milestones) {
    const id = `air_${seconds}s`;
    const tier: AchievementTier = seconds >= 9 ? 'mythic' : seconds >= 7 ? 'diamond' : seconds >= 5 ? 'gold' : seconds >= 3 ? 'silver' : 'bronze';
    achievements[id] = {
      name: names[seconds],
      desc: `Stay airborne for ${seconds} second${seconds > 1 ? 's' : ''}`,
      tier,
      check: (stats) => stats.maxAirTime >= seconds,
    };
  }

  return achievements;
}

export function generateFallsAchievements(): Record<string, GeneratedAchievement> {
  const achievements: Record<string, GeneratedAchievement> = {};

  const milestones = [1, 10, 50, 100, 250, 500, 1000, 2500, 5000, 10000];
  const names: Record<number, string> = {
    1: 'First Tumble',
    10: 'Learning Curve',
    50: 'Persistent',
    100: 'Determined',
    250: 'Stubborn',
    500: 'Never Give Up',
    1000: 'Thousand Falls',
    2500: 'Cliff Diver',
    5000: "Gravity's Friend",
    10000: 'Fall Legend',
  };

  for (const count of milestones) {
    const id = `falls_${count}`;
    const tier: AchievementTier = count >= 5000 ? 'mythic' : count >= 1000 ? 'diamond' : count >= 250 ? 'gold' : count >= 50 ? 'silver' : 'bronze';
    achievements[id] = {
      name: names[count],
      desc: count === 1 ? 'Fall off the cliff for the first time' : `Fall ${count.toLocaleString()} times`,
      tier,
      check: (_, s) => s.totalFalls >= count,
    };
  }

  return achievements;
}

export function generateLandingsAchievements(): Record<string, GeneratedAchievement> {
  const achievements: Record<string, GeneratedAchievement> = {};

  const milestones = [1, 10, 50, 100, 250, 500, 1000, 2500, 5000, 10000];
  const names: Record<number, string> = {
    1: 'First Landing',
    10: 'Beginner',
    50: 'Amateur',
    100: 'Skilled',
    250: 'Experienced',
    500: 'Expert',
    1000: 'Master',
    2500: 'Grandmaster',
    5000: 'Legendary',
    10000: 'Mythical',
  };

  for (const count of milestones) {
    const id = `land_${count}`;
    const tier: AchievementTier = count >= 5000 ? 'mythic' : count >= 1000 ? 'diamond' : count >= 250 ? 'gold' : count >= 50 ? 'silver' : 'bronze';
    achievements[id] = {
      name: names[count],
      desc: count === 1 ? 'Land successfully for the first time' : `Land successfully ${count.toLocaleString()} times`,
      tier,
      check: (stats) => stats.successfulLandings >= count,
    };
  }

  return achievements;
}

export function generateMultiplierAchievements(): Record<string, GeneratedAchievement> {
  const achievements: Record<string, GeneratedAchievement> = {};

  const milestones = [2, 3, 4, 5, 6];
  const names: Record<number, string> = {
    2: 'Double Up',
    3: 'Triple Threat',
    4: 'High Roller',
    5: 'Quintuple',
    6: 'Maximum Multiplier',
  };

  for (const mult of milestones) {
    const id = `mult_${mult}x`;
    const tier: AchievementTier = mult >= 6 ? 'diamond' : mult >= 5 ? 'gold' : mult >= 4 ? 'silver' : 'bronze';
    achievements[id] = {
      name: names[mult],
      desc: `Achieve ${mult}x multiplier`,
      tier,
      check: (stats) => stats.maxMultiplier >= mult,
    };
  }

  return achievements;
}

// Arcade Level Completion Achievements
export function generateArcadeLevelAchievements(): Record<string, GeneratedAchievement> {
  const achievements: Record<string, GeneratedAchievement> = {};

  // Complete each level (all doodles collected = pass)
  for (let level = 1; level <= 10; level++) {
    const id = `arcade_level_${level}`;
    const tier: AchievementTier = level <= 3 ? 'bronze' : level <= 6 ? 'silver' : level <= 9 ? 'gold' : 'platinum';
    achievements[id] = {
      name: level === 10 ? 'Arcade Master' : `Level ${level} Clear`,
      desc: `Complete Arcade Level ${level}`,
      tier,
      check: (_, state) => {
        if (!state.arcadeState) return false;
        const stars = state.arcadeState.starsPerLevel[level];
        return stars?.allDoodles || false;
      },
    };
  }

  return achievements;
}

// Arcade Star Achievements (max 20 stars = 2 per level)
export function generateArcadeStarAchievements(): Record<string, GeneratedAchievement> {
  const achievements: Record<string, GeneratedAchievement> = {};

  const milestones = [
    { stars: 5, name: 'Star Collector', tier: 'bronze' as const },
    { stars: 10, name: 'Star Hunter', tier: 'silver' as const },
    { stars: 15, name: 'Star Seeker', tier: 'gold' as const },
    { stars: 20, name: 'Star Master', tier: 'platinum' as const },
  ];

  for (const { stars, name, tier } of milestones) {
    const id = `arcade_stars_${stars}`;
    achievements[id] = {
      name,
      desc: `Earn ${stars} stars in Arcade mode`,
      tier,
      check: (_, state) => {
        if (!state.arcadeState) return false;
        let total = 0;
        for (const levelId in state.arcadeState.starsPerLevel) {
          const s = state.arcadeState.starsPerLevel[levelId];
          if (s.landedInZone) total++;
          if (s.inOrder) total++;
        }
        return total >= stars;
      },
    };
  }

  return achievements;
}

// Perfect Level Achievements (both stars on a level)
export function generateArcadePerfectAchievements(): Record<string, GeneratedAchievement> {
  const achievements: Record<string, GeneratedAchievement> = {};

  // Perfect any level
  achievements['arcade_perfect_any'] = {
    name: 'Perfect Clear',
    desc: 'Get both stars on any Arcade level',
    tier: 'silver',
    check: (_, state) => {
      if (!state.arcadeState) return false;
      for (const levelId in state.arcadeState.starsPerLevel) {
        const s = state.arcadeState.starsPerLevel[levelId];
        if (s.landedInZone && s.inOrder) return true;
      }
      return false;
    },
  };

  // Perfect all levels
  achievements['arcade_perfect_all'] = {
    name: 'Flawless',
    desc: 'Get both stars on all 10 Arcade levels',
    tier: 'mythic',
    check: (_, state) => {
      if (!state.arcadeState) return false;
      for (let level = 1; level <= 10; level++) {
        const s = state.arcadeState.starsPerLevel[level];
        if (!s || !s.landedInZone || !s.inOrder) return false;
      }
      return true;
    },
  };

  return achievements;
}

// Export all achievements combined
export function generateAllAchievements(): Record<string, GeneratedAchievement> {
  return {
    ...generateDistanceAchievements(),
    ...generateZenoAchievements(),
    ...generateThrowsAchievements(),
    ...generateScoreAchievements(),
    ...generatePerfectLandingAchievements(),
    ...generateRingsAchievements(),
    ...generateStreakAchievements(),
    ...generateAirTimeAchievements(),
    ...generateFallsAchievements(),
    ...generateLandingsAchievements(),
    ...generateMultiplierAchievements(),
    ...generateArcadeLevelAchievements(),
    ...generateArcadeStarAchievements(),
    ...generateArcadePerfectAchievements(),
  };
}

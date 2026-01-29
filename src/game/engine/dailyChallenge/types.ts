// src/game/engine/dailyChallenge/types.ts

export interface DailyChallengeState {
  date: string;                    // YYYY-MM-DD
  levelSeed: number;               // Derived from date
  bestScore: number;               // Player's best on this challenge
  attempts: number;                // Number of attempts today
  completed: boolean;              // At least 1 star earned
  stars: number;                   // Stars earned (0-3)
}

export interface DailyChallengeLeaderboardEntry {
  rank: number;
  nickname: string;
  score: number;
  stars: number;
}

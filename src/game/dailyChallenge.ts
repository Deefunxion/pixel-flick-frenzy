import { dailySeedFromDate, loadJson, saveJson, todayLocalISODate } from './storage';

export type ChallengeType =
  | 'streak_above'      // Land X throws above a distance
  | 'misery'            // Shortest throw wins
  | 'jackpot_target'    // Hit within ±N of a random target
  | 'consistency'       // X throws within ±5 of each other
  | 'multiplier_hunt';  // Achieve total multiplier sum

export type DailyChallenge = {
  type: ChallengeType;
  date: string;
  target: number;        // The goal (distance, count, etc.)
  threshold: number;     // For streak_above: the distance threshold
  tolerance: number;     // For jackpot: ±N tolerance
  description: string;
  progress: number;
  completed: boolean;
  attempts: number;
  bestAttempt: number;
};

// Generate deterministic daily challenge from date
export function generateDailyChallenge(date: string = todayLocalISODate()): DailyChallenge {
  const seed = dailySeedFromDate(date);
  const challengeTypes: ChallengeType[] = ['streak_above', 'misery', 'jackpot_target', 'consistency', 'multiplier_hunt'];
  const type = challengeTypes[seed % challengeTypes.length];

  let target: number;
  let threshold = 0;
  let tolerance = 0;
  let description: string;

  switch (type) {
    case 'streak_above':
      target = 3 + (seed % 3); // 3-5 throws
      threshold = 350 + (seed % 50); // Above 350-400
      description = `Land ${target} throws above ${threshold}`;
      break;

    case 'misery':
      target = 50; // Below 50 is "winning"
      description = `Shortest safe landing wins (under ${target})`;
      break;

    case 'jackpot_target':
      target = 100 + ((seed * 7) % 300); // Random target 100-400
      tolerance = 30 - Math.floor((seed % 20)); // ±10-30
      description = `Hit ${target} ±${tolerance}`;
      break;

    case 'consistency':
      target = 4; // 4 throws
      tolerance = 5; // Within ±5
      description = `${target} throws within ±${tolerance} of each other`;
      break;

    case 'multiplier_hunt':
      target = 10; // Total 10x multiplier
      description = `Accumulate ${target}x total multiplier`;
      break;

    default:
      target = 3;
      description = 'Unknown challenge';
  }

  return {
    type,
    date,
    target,
    threshold,
    tolerance,
    description,
    progress: 0,
    completed: false,
    attempts: 0,
    bestAttempt: 0,
  };
}

// Load today's challenge (creates if doesn't exist)
export function loadDailyChallenge(): DailyChallenge {
  const today = todayLocalISODate();
  const stored = loadJson<DailyChallenge | null>('daily_challenge', null, 'omf_daily_challenge');

  if (!stored || stored.date !== today) {
    const newChallenge = generateDailyChallenge(today);
    saveJson('daily_challenge', newChallenge);
    return newChallenge;
  }

  return stored;
}

// Update challenge progress
export function updateDailyChallenge(
  distance: number,
  multiplier: number,
  fellOff: boolean,
): DailyChallenge {
  const challenge = loadDailyChallenge();

  if (challenge.completed) return challenge;

  challenge.attempts++;

  switch (challenge.type) {
    case 'streak_above': {
      if (!fellOff && distance >= challenge.threshold) {
        challenge.progress++;
        if (challenge.progress >= challenge.target) {
          challenge.completed = true;
        }
      } else {
        challenge.progress = 0; // Streak broken
      }
      break;
    }

    case 'misery':
      if (!fellOff && distance < challenge.target) {
        if (challenge.bestAttempt === 0 || distance < challenge.bestAttempt) {
          challenge.bestAttempt = distance;
        }
        challenge.completed = true;
      }
      break;

    case 'jackpot_target':
      if (!fellOff) {
        const diff = Math.abs(distance - challenge.target);
        if (diff <= challenge.tolerance) {
          challenge.completed = true;
          challenge.bestAttempt = distance;
        }
      }
      break;

    case 'consistency':
      // Track in separate storage, simplified here
      if (!fellOff) {
        challenge.progress++;
        if (challenge.progress >= challenge.target) {
          challenge.completed = true;
        }
      }
      break;

    case 'multiplier_hunt':
      if (!fellOff) {
        challenge.progress += multiplier;
        if (challenge.progress >= challenge.target) {
          challenge.completed = true;
        }
      }
      break;
  }

  saveJson('daily_challenge', challenge);
  return challenge;
}

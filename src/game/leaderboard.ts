import { loadJson, saveJson, loadNumber, saveNumber } from './storage';
import { CLIFF_EDGE } from './constants';

export type LeaderboardEntry = {
  distance: number;
  precision: number; // Number of decimal places
  date: string;
  displayDistance: string;
};

// Get current precision level (starts at 4 decimals)
export function getCurrentPrecision(): number {
  return loadNumber('leaderboard_precision', 4, 'omf_leaderboard_precision');
}

// Calculate the theoretical maximum at current precision
export function getMaxAtPrecision(precision: number): number {
  // Max is CLIFF_EDGE - (1 / 10^precision)
  // e.g., at 4 decimals: 419.9999
  return CLIFF_EDGE - Math.pow(10, -precision);
}

// Check if precision should increase
export function shouldIncreasePrecision(distance: number): boolean {
  const precision = getCurrentPrecision();
  const threshold = getMaxAtPrecision(precision) - Math.pow(10, -(precision - 1));
  // If distance is within 0.1 of the current max, increase precision
  return distance >= threshold;
}

// Increase precision level
export function increasePrecision(): number {
  const current = getCurrentPrecision();
  const next = Math.min(current + 1, 12); // Cap at 12 decimals
  saveNumber('leaderboard_precision', next);
  return next;
}

// Format distance with appropriate precision
export function formatLeaderboardDistance(distance: number): string {
  const precision = getCurrentPrecision();
  return distance.toFixed(precision);
}

// Personal leaderboard (top 10 throws)
export function getPersonalLeaderboard(): LeaderboardEntry[] {
  return loadJson<LeaderboardEntry[]>('personal_leaderboard', [], 'omf_personal_leaderboard');
}

export function addToPersonalLeaderboard(distance: number): boolean {
  const precision = getCurrentPrecision();
  const leaderboard = getPersonalLeaderboard();

  const entry: LeaderboardEntry = {
    distance,
    precision,
    date: new Date().toISOString(),
    displayDistance: distance.toFixed(precision),
  };

  // Check if this would trigger precision increase
  if (shouldIncreasePrecision(distance)) {
    increasePrecision();
    entry.precision = getCurrentPrecision();
    entry.displayDistance = distance.toFixed(entry.precision);
  }

  // Add and sort
  leaderboard.push(entry);
  leaderboard.sort((a, b) => b.distance - a.distance);

  // Keep top 10
  const trimmed = leaderboard.slice(0, 10);
  saveJson('personal_leaderboard', trimmed);

  // Return true if this is a new top entry
  return trimmed[0].distance === distance;
}

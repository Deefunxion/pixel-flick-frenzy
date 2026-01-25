import { loadJson, saveJson, loadNumber, saveNumber } from './storage';
import { CLIFF_EDGE } from './constants';

export type LeaderboardEntry = {
  distance: number;
  precision: number; // Number of decimal places
  date: string;
  displayDistance: string;
};

/**
 * Zeno Decimal System - precision based on proximity to the edge (420)
 * The closer to the edge, the more decimals revealed.
 * Like Zeno's paradox: infinite precision as you approach the limit.
 *
 * Distance from edge → Decimals
 * > 120 (score < 300)      → 1
 * > 20  (score < 400)      → 2
 * > 5   (score < 415)      → 3
 * > 1   (score < 419)      → 4
 * > 0.1 (score < 419.9)    → 5
 * > 0.01                   → 6
 * > 0.001                  → 7
 * > 0.0001                 → 8 (max)
 */
export function getZenoPrecision(score: number): number {
  const distanceFromEdge = CLIFF_EDGE - score;

  if (distanceFromEdge > 120) return 1;
  if (distanceFromEdge > 20) return 2;
  if (distanceFromEdge > 5) return 3;
  if (distanceFromEdge > 1) return 4;
  if (distanceFromEdge > 0.1) return 5;
  return 6; // Max 6 decimals for display clarity
}

/**
 * Format a score with Zeno-adaptive precision
 * Shows only as many decimals as meaningful for that score range
 */
export function formatZenoScore(score: number): string {
  const precision = getZenoPrecision(score);
  return score.toFixed(precision);
}

// Get current precision level (starts at 4 decimals) - legacy, kept for compatibility
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

// Format distance with appropriate precision - now uses Zeno system
export function formatLeaderboardDistance(distance: number): string {
  return formatZenoScore(distance);
}

// Personal leaderboard (top 10 throws)
export function getPersonalLeaderboard(): LeaderboardEntry[] {
  return loadJson<LeaderboardEntry[]>('personal_leaderboard', [], 'omf_personal_leaderboard');
}

export function addToPersonalLeaderboard(distance: number): boolean {
  const precision = getZenoPrecision(distance);
  const leaderboard = getPersonalLeaderboard();

  const entry: LeaderboardEntry = {
    distance,
    precision,
    date: new Date().toISOString(),
    displayDistance: formatZenoScore(distance),
  };

  // Add and sort
  leaderboard.push(entry);
  leaderboard.sort((a, b) => b.distance - a.distance);

  // Keep top 10
  const trimmed = leaderboard.slice(0, 10);
  saveJson('personal_leaderboard', trimmed);

  // Return true if this is a new top entry
  return trimmed[0].distance === distance;
}

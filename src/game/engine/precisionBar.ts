import { CLIFF_EDGE } from '@/game/constants';
import type { GameState } from './types';

// Precision bar trigger thresholds
const PRECISION_X_THRESHOLD = 409.9;  // 0.1 before precision zone
const PRECISION_Y_THRESHOLD = 5;      // Near ground
const PRECISION_ZONE_START = 410;     // Start of precision zone
const PRECISION_ZONE_END = CLIFF_EDGE; // 420

/**
 * Check if precision bar should be active.
 * Requires:
 * - px >= 409.9 (approaching precision zone)
 * - py < 5 (near ground)
 * No achievement requirement - always available
 */
export function shouldActivatePrecisionBar(state: GameState): boolean {
  return state.px >= PRECISION_X_THRESHOLD && state.py < PRECISION_Y_THRESHOLD;
}

/**
 * Calculate progress through precision zone (0 to 1).
 * 0 = at 419, 1 = at 420
 */
export function calculatePrecisionProgress(px: number): number {
  if (px <= PRECISION_ZONE_START) return 0;
  if (px >= PRECISION_ZONE_END) return 1;
  return (px - PRECISION_ZONE_START) / (PRECISION_ZONE_END - PRECISION_ZONE_START);
}

/**
 * Calculate time scale for progressive slow-motion.
 * 1.0 at 419, 0.1 at 420 (linear interpolation)
 */
export function calculatePrecisionTimeScale(px: number): number {
  const progress = calculatePrecisionProgress(px);
  // Linear: 1.0 → 0.1 as progress goes 0 → 1
  return 1 - (progress * 0.9);
}

/**
 * Get number of decimal places to display based on position.
 * More decimals as we approach .9 thresholds.
 */
export function getDynamicDecimalPrecision(px: number): number {
  if (px < PRECISION_ZONE_START) return 1;

  // Use comparison against thresholds to avoid floating point issues
  const floor = Math.floor(px);

  if (px >= floor + 0.9999999) return 8;
  if (px >= floor + 0.999999) return 7;
  if (px >= floor + 0.99999) return 6;
  if (px >= floor + 0.9999) return 5;
  if (px >= floor + 0.999) return 4;
  if (px >= floor + 0.99) return 3;
  if (px >= floor + 0.9) return 2;
  return 1;
}

/**
 * Format score with dynamic decimal precision.
 */
export function formatPrecisionScore(px: number): string {
  const decimals = getDynamicDecimalPrecision(px);
  return px.toFixed(decimals);
}

/**
 * Get PB marker position in pixels within bar.
 * Returns null if PB is not in precision zone.
 */
export function getPbMarkerPosition(bestScore: number, barWidth: number): number | null {
  if (bestScore < PRECISION_ZONE_START) return null;

  const progress = Math.min(1, (bestScore - PRECISION_ZONE_START) / (PRECISION_ZONE_END - PRECISION_ZONE_START));
  return progress * barWidth;
}

/**
 * Get bar fill color based on position (gold → white gradient).
 */
export function getPrecisionBarColor(px: number): string {
  const progress = calculatePrecisionProgress(px);

  if (progress < 0.5) {
    // Deep gold (#FFD700)
    return '#FFD700';
  } else if (progress < 0.9) {
    // Bright gold (#FFEC8B)
    return '#FFEC8B';
  } else if (progress < 0.99) {
    // White-gold (#FFFACD)
    return '#FFFACD';
  } else {
    // Glowing white
    return '#FFFFFF';
  }
}

/**
 * Check if current position has passed the personal best.
 */
export function hasPassedPb(px: number, best: number): boolean {
  return best >= PRECISION_ZONE_START && px > best;
}

/**
 * Get feedback message for fall.
 */
export function getFallMessage(lastValidPx: number, isFirstTimeInZone: boolean): string {
  if (isFirstTimeInZone) {
    return 'Welcome to the precision zone!';
  }
  if (lastValidPx >= 419.99) {
    return `${lastValidPx.toFixed(4)} - So close!`;
  }
  return `${lastValidPx.toFixed(2)} - Keep practicing!`;
}

/**
 * Get feedback message for successful landing.
 */
export function getSuccessMessage(px: number, best: number, isNewPb: boolean): string {
  if (isNewPb) {
    const improvement = px - best;
    return `NEW PERSONAL BEST! +${improvement.toFixed(4)}`;
  }

  const distFromPb = best - px;
  if (distFromPb < 0.01) {
    return `${px.toFixed(4)} - Just ${distFromPb.toFixed(4)} away!`;
  }

  return `${px.toFixed(2)} - Solid throw!`;
}

/**
 * Throw/Energy System
 *
 * Manages free throw regeneration, consumption, and practice mode.
 */

import { FREE_THROWS_CAP, FREE_THROW_REGEN_MS } from '@/game/constants';
import type { ThrowState } from './types';

/**
 * Calculate regenerated free throws based on elapsed time
 */
export function calculateThrowRegen(state: ThrowState): ThrowState {
  if (state.isPremium) return state;
  if (state.freeThrows >= FREE_THROWS_CAP) {
    return { ...state, lastRegenTimestamp: Date.now() };
  }

  const now = Date.now();
  const elapsed = now - state.lastRegenTimestamp;
  const throwsToAdd = Math.floor(elapsed / FREE_THROW_REGEN_MS);

  if (throwsToAdd <= 0) return state;

  const newFreeThrows = Math.min(FREE_THROWS_CAP, state.freeThrows + throwsToAdd);
  const remainderMs = elapsed % FREE_THROW_REGEN_MS;

  return {
    ...state,
    freeThrows: newFreeThrows,
    lastRegenTimestamp: now - remainderMs,
  };
}

/**
 * Get milliseconds until next free throw regenerates
 */
export function getMsUntilNextThrow(state: ThrowState): number {
  if (state.isPremium || state.freeThrows >= FREE_THROWS_CAP) return 0;

  const elapsed = Date.now() - state.lastRegenTimestamp;
  return Math.max(0, FREE_THROW_REGEN_MS - elapsed);
}

/**
 * Format remaining time as "M:SS"
 */
export function formatRegenTime(ms: number): string {
  if (ms <= 0) return '';
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Consume one throw. Returns updated state and whether in practice mode.
 * Consumption order: Free → Permanent → Practice Mode
 */
export function consumeThrow(state: ThrowState): {
  newState: ThrowState;
  practiceMode: boolean;
  throwConsumed: boolean;
} {
  if (state.isPremium) {
    return { newState: state, practiceMode: false, throwConsumed: true };
  }

  // Try free throws first
  if (state.freeThrows > 0) {
    return {
      newState: { ...state, freeThrows: state.freeThrows - 1 },
      practiceMode: false,
      throwConsumed: true,
    };
  }

  // Try permanent throws
  if (state.permanentThrows > 0) {
    return {
      newState: { ...state, permanentThrows: state.permanentThrows - 1 },
      practiceMode: false,
      throwConsumed: true,
    };
  }

  // Practice mode - no throw consumed
  return { newState: state, practiceMode: true, throwConsumed: false };
}

/**
 * Add permanent throws (from rewards, purchases, ads)
 */
export function addPermanentThrows(state: ThrowState, amount: number): ThrowState {
  return { ...state, permanentThrows: state.permanentThrows + amount };
}

/**
 * Check if player can make a "real" throw (not practice)
 */
export function canMakeRealThrow(state: ThrowState): boolean {
  return state.isPremium || state.freeThrows > 0 || state.permanentThrows > 0;
}

/**
 * Get total available throws (for display)
 */
export function getTotalThrows(state: ThrowState): number {
  if (state.isPremium) return Infinity;
  return state.freeThrows + state.permanentThrows;
}

/**
 * Slide physics module for update system
 * Handles slide mechanics, precision controls (extend/brake), friction, and outcomes
 */

import { CLIFF_EDGE, H } from '@/game/constants';
import type { Theme } from '@/game/themes';
import type { GameState } from '../types';
import { applySlideControl } from '../precision';
import { spawnParticles } from '../state';
import { TAP_GRACE_FRAMES } from './input';

// Audio interface for slide
export type SlideAudio = {
  slideExtend?: () => void;
  slideBrake?: () => void;
  actionDenied?: () => void;
  staminaLow?: () => void;
};

export type SlideControlResult = {
  frictionMultiplier: number;
  precisionAppliedThisFrame: boolean;
};

/**
 * Process slide precision controls (tap to extend, hold to brake)
 */
export function processSlideControls(
  state: GameState,
  pressed: boolean,
  nowMs: number,
  audio: SlideAudio,
  precisionAlreadyApplied: boolean
): SlideControlResult {
  let frictionMultiplier = 1.0;
  let precisionApplied = precisionAlreadyApplied;

  if (state.landed) {
    return { frictionMultiplier, precisionAppliedThisFrame: precisionApplied };
  }

  const deltaTime = 1 / 60;

  if (state.precisionInput.pressedThisFrame && !precisionApplied) {
    // Tap: extend slide (immediate on press for responsiveness)
    const staminaBefore = state.stamina;
    const result = applySlideControl(state, 'tap');
    if (result.applied) {
      state.staminaUsedThisThrow += staminaBefore - state.stamina;
      precisionApplied = true;
      state.pendingTapVelocity = 0.15; // Track what we added so we can undo
      audio.slideExtend?.();
    } else if (result.denied) {
      audio.actionDenied?.();
      state.staminaDeniedShake = 8;
    }
  } else if (state.precisionInput.releasedThisFrame && state.precisionInput.holdDurationAtRelease <= TAP_GRACE_FRAMES) {
    // Quick release - confirm tap (clear pending, no undo needed)
    state.pendingTapVelocity = 0;
  } else if (pressed && state.precisionInput.holdDuration === TAP_GRACE_FRAMES + 1) {
    // Just crossed grace period - undo the tap effect if there was one
    if (state.pendingTapVelocity && state.pendingTapVelocity > 0) {
      // Reverse the velocity boost from tap
      if (state.vx > 0) {
        state.vx = Math.max(0, state.vx - state.pendingTapVelocity);
      } else if (state.vx < 0) {
        state.vx = Math.min(0, state.vx + state.pendingTapVelocity);
      }
      state.pendingTapVelocity = 0;
    }
  }

  if (pressed && state.precisionInput.holdDuration > TAP_GRACE_FRAMES && !precisionApplied) {
    // Hold: brake (grace period allows clean taps)
    const staminaBefore = state.stamina;
    const result = applySlideControl(state, 'hold', deltaTime);
    if (result.applied) {
      state.staminaUsedThisThrow += staminaBefore - state.stamina;
      precisionApplied = true;
      if (result.frictionMultiplier) {
        frictionMultiplier = result.frictionMultiplier;
      }
      // Play brake sound every 6 frames to avoid spam
      if (state.precisionInput.holdDuration % 6 === 0) {
        audio.slideBrake?.();
      }
    } else if (result.denied) {
      audio.actionDenied?.();
      state.staminaDeniedShake = 8;
    }
  }

  return { frictionMultiplier, precisionAppliedThisFrame: precisionApplied };
}

/**
 * Process low stamina warning during slide
 */
export function processSlideStaminaWarning(
  state: GameState,
  nowMs: number,
  audio: SlideAudio
): void {
  if (state.stamina <= 25 && state.stamina > 0) {
    if (Math.floor(nowMs / 500) !== Math.floor((nowMs - 16) / 500)) {
      audio.staminaLow?.();
    }
  }
}

/**
 * Update slide physics (friction, position)
 */
export function updateSlidePhysics(
  state: GameState,
  effectiveTimeScale: number,
  frictionMultiplier: number,
  theme: Theme
): void {
  // Apply friction with TIME_SCALE and optional brake multiplier
  const baseFriction = 0.92;
  const friction = Math.pow(baseFriction, effectiveTimeScale * frictionMultiplier);
  state.vx *= friction;
  state.px += state.vx * effectiveTimeScale;

  if (Math.abs(state.vx) > 0.5 && Math.random() > 0.5) {
    spawnParticles(state, state.px, state.py, 1, 0.5, theme.accent1);
  }

  const pastTarget = state.px >= state.zenoTarget;
  state.trail.push({ x: state.px, y: state.py, age: 0, pastTarget });

  // Track last valid position for precision bar (during slide)
  if (state.px < CLIFF_EDGE) {
    state.lastValidPx = state.px;
  }
}

/**
 * Check if slide has stopped (velocity near zero)
 */
export function hasSlideStoppedSuccessfully(state: GameState): boolean {
  return Math.abs(state.vx) < 0.1;
}

/**
 * Check if player has slid off the cliff edge
 */
export function hasSlidOffEdge(state: GameState): boolean {
  return state.px >= CLIFF_EDGE;
}

/**
 * Get landing distance with 8 decimal precision for Zeno system
 */
export function getLandingDistance(px: number): number {
  return Math.round(px * 100000000) / 100000000;
}

/**
 * Determine if landing is perfect (within 0.5 of target)
 */
export function isPerfectLanding(landedAt: number, zenoTarget: number): boolean {
  const distFromTarget = Math.abs(landedAt - zenoTarget);
  return distFromTarget < 0.5;
}

/**
 * Calculate score from landing
 */
export function calculateLandingScore(
  distance: number,
  ringMultiplier: number,
  maxMultiplier: number,
  isPerfect: boolean
): { finalMultiplier: number; scoreGained: number } {
  const finalMultiplier = Math.min(maxMultiplier, ringMultiplier);
  const basePoints = distance;
  const multipliedPoints = basePoints * finalMultiplier;
  const perfectBonus = isPerfect ? 10 : 0;
  const scoreGained = multipliedPoints + perfectBonus;

  return { finalMultiplier, scoreGained };
}

// src/game/engine/animationController.ts

import type { GameState } from './types';
import type { AnimationName } from './spriteConfig';

// Hysteresis thresholds to prevent rapid animation switching
const DESCEND_ENTER_THRESHOLD = 2.0;  // Must exceed this to switch TO descend
const DESCEND_EXIT_THRESHOLD = 0.5;   // Must go below this to switch FROM descend

// Track last flight animation to apply hysteresis
let lastFlightAnimation: 'fly' | 'descend' = 'fly';

/**
 * Determines which animation should play based on game state.
 * This centralizes the animation selection logic.
 *
 * Animation flow:
 * idle → coil → launch → fly → descend → touchdown → win/slide → idle
 *                                    ↘ lose (if fell off)
 */
export function getDesiredAnimation(state: GameState): AnimationName {
  // Priority order: lose > charging > launch > fly/descend > landing/sliding > win > idle

  // Failure animation (fell off the edge)
  if (state.failureAnimating) {
    return 'lose';
  }

  // Charging up for throw
  if (state.charging) {
    // Reset flight animation tracking on new throw
    lastFlightAnimation = 'fly';
    return 'coil';
  }

  // During flight (not yet landed)
  if (state.flying && !state.sliding) {
    // Launch phase: first ~15 frames after release
    if (state.launchFrame > 0 && state.launchFrame < 15) {
      return 'launch';
    }

    // Hysteresis for fly/descend to prevent jitter during precision controls
    if (lastFlightAnimation === 'fly') {
      // Currently flying - only switch to descend if vy exceeds higher threshold
      if (state.vy > DESCEND_ENTER_THRESHOLD) {
        lastFlightAnimation = 'descend';
        return 'descend';
      }
      return 'fly';
    } else {
      // Currently descending - only switch back to fly if vy drops below lower threshold
      if (state.vy < DESCEND_EXIT_THRESHOLD) {
        lastFlightAnimation = 'fly';
        return 'fly';
      }
      return 'descend';
    }
  }

  // Sliding on ground
  if (state.sliding) {
    // Reset flight animation tracking when landing
    lastFlightAnimation = 'fly';
    return 'slide';
  }

  // Touchdown animation after landing (first contact, before sliding)
  if (state.landingFrame > 0 && !state.fellOff) {
    return 'touchdown';
  }

  // Keep touchdown animation until it finishes
  if (state.zenoAnimator?.currentAnimation === 'touchdown' && !state.zenoAnimator.isFinished()) {
    return 'touchdown';
  }

  // Victory animation after successful landing
  // Triggers when: landed, didn't fall off, and not sliding anymore
  if (state.landed && !state.fellOff && !state.sliding) {
    return 'win';
  }

  // Keep win animation playing if already in it
  if (state.zenoAnimator?.currentAnimation === 'win') {
    return 'win';
  }

  return 'idle';
}

/**
 * Update the animator based on current game state.
 * Call this in the update loop.
 */
export function updateAnimator(state: GameState, deltaTime: number): void {
  if (!state.zenoAnimator || !state.zenoAnimator.isReady()) return;

  // Determine desired animation
  const desiredAnim = getDesiredAnimation(state);

  // Switch animation if needed
  if (state.zenoAnimator.currentAnimation !== desiredAnim) {
    state.zenoAnimator.play(desiredAnim);
  }

  // Update animation timing
  state.zenoAnimator.update(deltaTime);
}

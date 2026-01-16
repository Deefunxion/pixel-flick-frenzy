// src/game/engine/animationController.ts

import type { GameState } from './types';
import type { AnimationName } from './spriteConfig';

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
    return 'coil';
  }

  // During flight (not yet landed)
  if (state.flying && !state.sliding) {
    // Launch phase: first ~15 frames after release
    if (state.launchFrame > 0 && state.launchFrame < 15) {
      return 'launch';
    }

    // Descending: falling down (vy > threshold to avoid jitter)
    if (state.vy > 1.5) {
      return 'descend';
    }

    // Flying: ascending or horizontal movement
    return 'fly';
  }

  // Sliding on ground
  if (state.sliding) {
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

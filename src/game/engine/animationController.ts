// src/game/engine/animationController.ts

import type { GameState } from './types';
import type { AnimationName } from './spriteConfig';

/**
 * Determines which animation should play based on game state.
 * This centralizes the animation selection logic.
 */
export function getDesiredAnimation(state: GameState): AnimationName {
  // Priority order: failure > charging > flying > landing > idle

  if (state.failureAnimating) {
    return 'fail';
  }

  if (state.charging) {
    return 'coil';
  }

  if (state.flying || state.sliding) {
    return 'bolt';
  }

  if (state.landingFrame > 0 && state.landingFrame < 15 && !state.fellOff) {
    return 'impact';
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

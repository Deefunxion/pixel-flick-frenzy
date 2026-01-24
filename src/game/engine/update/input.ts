/**
 * Input handling module for update system
 * Handles pressed edge detection, buffering, and hold duration tracking
 */

import type { GameState } from '../types';
import {
  isBuffering,
  hasBufferedInput,
  clearBuffer,
} from '../inputBuffer';

// Grace period for tap detection - prevents accidental hold trigger
// 4 frames = ~67ms buffer at 60fps
export const TAP_GRACE_FRAMES = 4;

/**
 * Process precision input edge detection for flying/sliding states
 * Tracks pressedThisFrame, releasedThisFrame, and holdDuration
 */
export function updatePrecisionInput(
  state: GameState,
  pressed: boolean,
  processBufferedInputs: boolean
): void {
  const wasPressed = state.precisionInput.lastPressedState;
  state.precisionInput.pressedThisFrame = pressed && !wasPressed;
  state.precisionInput.releasedThisFrame = !pressed && wasPressed;

  // Apply buffered inputs from slow-mo period
  let bufferedTapApplied = false;
  if (processBufferedInputs) {
    if (hasBufferedInput('tap')) {
      // Buffered tap = complete press+release, trigger tap action
      state.precisionInput.releasedThisFrame = true;
      state.precisionInput.holdDurationAtRelease = 1; // Quick tap
      bufferedTapApplied = true;
    } else if (hasBufferedInput('press')) {
      state.precisionInput.pressedThisFrame = true;
    }
    if (hasBufferedInput('release') && !bufferedTapApplied) {
      state.precisionInput.releasedThisFrame = true;
      state.precisionInput.holdDurationAtRelease = state.precisionInput.holdDuration;
    }
    clearBuffer();
  }

  // Capture hold duration at release BEFORE resetting (skip if buffered tap already set it)
  if (state.precisionInput.releasedThisFrame && !bufferedTapApplied) {
    state.precisionInput.holdDurationAtRelease = state.precisionInput.holdDuration;
  }

  if (pressed) {
    state.precisionInput.holdDuration++;
  } else {
    state.precisionInput.holdDuration = 0;
  }

  state.precisionInput.lastPressedState = pressed;
}

/**
 * Check if input buffering should start (entering slow-mo)
 */
export function shouldStartBuffering(slowMo: number): boolean {
  return slowMo > 0.8 && !isBuffering();
}

/**
 * Check if input buffering should stop (exiting slow-mo)
 */
export function shouldStopBuffering(slowMo: number): boolean {
  return slowMo < 0.3 && isBuffering();
}

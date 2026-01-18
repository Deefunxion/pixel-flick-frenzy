import type { GameState, TutorialPhase } from './types';

const TUTORIAL_DURATION = 2.0; // seconds
const TUTORIAL_SLOWMO = 0.1;

export interface TutorialContent {
  lines: string[];
}

export const TUTORIAL_CONTENT: Record<TutorialPhase, TutorialContent> = {
  none: { lines: [] },
  idle: { lines: ['Welcome to One More Flick!', 'Tap and hold to begin'] },
  charge: { lines: ['Hold to charge power (it bounces!)', 'Drag up/down to aim'] },
  air: { lines: ['TAP = float longer', 'HOLD = brake'] },
  slide: { lines: ['TAP = push further', 'HOLD = brake'] },
};

/**
 * Check if a tutorial should trigger based on game state.
 * Returns the phase to trigger, or 'none' if no tutorial needed.
 */
export function checkTutorialTrigger(state: GameState, prevVy: number): TutorialPhase {
  // Don't trigger if already in tutorial
  if (state.tutorialState.active) return 'none';

  // Charge tutorial: first touch while idle
  if (state.charging && !state.tutorialState.hasSeenCharge) {
    return 'charge';
  }

  // Air tutorial: at flight apex (vy crosses from negative to positive)
  if (state.flying && !state.tutorialState.hasSeenAir) {
    if (prevVy < 0 && state.vy >= 0) {
      return 'air';
    }
  }

  // Slide tutorial: first frame of sliding
  if (state.sliding && !state.tutorialState.hasSeenSlide && state.vx !== 0) {
    return 'slide';
  }

  return 'none';
}

/**
 * Start a tutorial phase.
 */
export function startTutorial(state: GameState, phase: TutorialPhase): void {
  state.tutorialState.phase = phase;
  state.tutorialState.active = true;
  state.tutorialState.timeRemaining = TUTORIAL_DURATION;
}

/**
 * Update tutorial state (call every frame).
 * Returns the slow-mo multiplier to apply.
 */
export function updateTutorial(state: GameState, deltaTime: number): number {
  if (!state.tutorialState.active) return 1;

  state.tutorialState.timeRemaining -= deltaTime;

  if (state.tutorialState.timeRemaining <= 0) {
    completeTutorial(state);
    return 1;
  }

  return TUTORIAL_SLOWMO;
}

/**
 * Complete current tutorial and mark as seen.
 */
export function completeTutorial(state: GameState): void {
  const phase = state.tutorialState.phase;

  // Mark as seen
  if (phase === 'charge') {
    state.tutorialState.hasSeenCharge = true;
    localStorage.setItem('tutorial_charge_seen', 'true');
  } else if (phase === 'air') {
    state.tutorialState.hasSeenAir = true;
    localStorage.setItem('tutorial_air_seen', 'true');
  } else if (phase === 'slide') {
    state.tutorialState.hasSeenSlide = true;
    localStorage.setItem('tutorial_slide_seen', 'true');
  }

  // Reset state
  state.tutorialState.phase = 'none';
  state.tutorialState.active = false;
  state.tutorialState.timeRemaining = 0;
}

/**
 * Reset all tutorial progress (for replay button).
 */
export function resetTutorialProgress(): void {
  localStorage.removeItem('tutorial_charge_seen');
  localStorage.removeItem('tutorial_air_seen');
  localStorage.removeItem('tutorial_slide_seen');
}

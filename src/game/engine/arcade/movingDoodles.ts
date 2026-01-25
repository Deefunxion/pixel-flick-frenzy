// src/game/engine/arcade/movingDoodles.ts
import type { DoodleMotion } from './types';

export interface MovingDoodleState {
  baseX: number;
  baseY: number;
  currentX: number;
  currentY: number;
  motion: DoodleMotion;
  phase: number; // 0-1 cycle position
}

/**
 * Create motion state for a doodle
 */
export function createMovingDoodleState(
  x: number,
  y: number,
  motion: DoodleMotion = { type: 'static' }
): MovingDoodleState {
  return {
    baseX: x,
    baseY: y,
    currentX: x,
    currentY: y,
    motion,
    phase: 0,
  };
}

/**
 * Update moving doodle position based on elapsed time
 * @param state - The doodle's motion state
 * @param deltaMs - Time elapsed in milliseconds
 */
export function updateMovingDoodle(state: MovingDoodleState, deltaMs: number): void {
  if (state.motion.type === 'static') return;

  // Calculate phase increment based on speed
  // Speed is cycles per second, so deltaMs / 1000 * speed gives phase delta
  const speed = state.motion.type === 'linear'
    ? state.motion.speed
    : state.motion.speed;

  const deltaPhase = (deltaMs / 1000) * speed;
  state.phase = (state.phase + deltaPhase) % 1;

  if (state.motion.type === 'linear') {
    // Oscillate along axis using sine wave
    const offset = Math.sin(state.phase * Math.PI * 2) * state.motion.range;

    if (state.motion.axis === 'x') {
      state.currentX = state.baseX + offset;
      state.currentY = state.baseY;
    } else {
      state.currentX = state.baseX;
      state.currentY = state.baseY + offset;
    }
  } else if (state.motion.type === 'circular') {
    // Orbit around base position
    const angle = state.phase * Math.PI * 2;
    state.currentX = state.baseX + Math.cos(angle) * state.motion.radius;
    state.currentY = state.baseY + Math.sin(angle) * state.motion.radius;
  }
}

/**
 * Reset motion phase (e.g., when starting a new throw)
 */
export function resetMovingDoodlePhase(state: MovingDoodleState): void {
  state.phase = 0;
  state.currentX = state.baseX;
  state.currentY = state.baseY;
}

/**
 * Batch update all moving doodles
 */
export function updateAllMovingDoodles(
  states: MovingDoodleState[],
  deltaMs: number
): void {
  for (const state of states) {
    updateMovingDoodle(state, deltaMs);
  }
}

/**
 * Reset all motion phases
 */
export function resetAllMovingDoodles(states: MovingDoodleState[]): void {
  for (const state of states) {
    resetMovingDoodlePhase(state);
  }
}

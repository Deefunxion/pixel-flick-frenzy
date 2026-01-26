/**
 * Cinematic effects module for update system
 * Handles slow-mo, record zone, zoom, screen effects, edge proximity
 */

import { CLIFF_EDGE, H } from '@/game/constants';
import type { GameState } from '../types';
import {
  shouldActivatePrecisionBar,
  calculatePrecisionTimeScale,
  hasPassedPb,
} from '../precisionBar';

// Cinematic zone threshold - triggers 4x zoom and 4x slowdown
const CINEMATIC_THRESHOLD = 318.5;

// Height-based slow-mo scaling
const GROUND_Y = H - 20; // 220 - where landing occurs
const HEIGHT_SLOWMO_THRESHOLD = 180; // Start factoring height below this py value

/**
 * Calculate height factor for slow-mo scaling.
 * Returns 0 when high in air (py < 180), 1 when near ground (py >= 220).
 * Sliding always returns 1 (full slow-mo on ground).
 */
function calculateHeightFactor(py: number, isSliding: boolean): number {
  if (isSliding) return 1; // Full slow-mo when sliding
  if (py < HEIGHT_SLOWMO_THRESHOLD) return 0; // No slow-mo when high up
  // Linear interpolation: 0 at threshold, 1 at ground
  return Math.min(1, (py - HEIGHT_SLOWMO_THRESHOLD) / (GROUND_Y - HEIGHT_SLOWMO_THRESHOLD));
}

// Audio interface for cinematic
export type CinematicAudio = {
  edgeWarning: (proximity01: number) => void;
  stopEdgeWarning: () => void;
  heartbeat: (intensity: number) => void;
  recordBreak: () => void;
  precisionDrone?: () => void;
  stopPrecisionDrone?: () => void;
  pbDing?: () => void;
};

/**
 * Update record zone detection (Peggle-style epic moment)
 */
export function updateRecordZone(state: GameState): void {
  if (state.epicMomentTriggered) return;
  if (!state.flying && !state.sliding) return;

  const approachingBest = state.px > state.best - 30 && state.px < state.best + 5;
  const willBeatRecord = state.px > state.best - 10 && state.vx > 0;

  if (approachingBest && state.best > 50) {
    state.recordZoneActive = true;
    // Intensity ramps up as we get closer
    const distToBest = Math.abs(state.px - state.best);
    state.recordZoneIntensity = Math.max(0, 1 - distToBest / 30);

    if (willBeatRecord && state.px > state.best - 3) {
      state.recordZonePeak = true;
      state.epicMomentTriggered = true;
    }
  } else {
    state.recordZoneActive = false;
    state.recordZoneIntensity = 0;
  }
}

/**
 * Calculate cinematic effects (slow-mo, zoom) based on position and state
 */
export function calculateCinematicEffects(
  state: GameState,
  audio: CinematicAudio
): { targetSlowMo: number; targetZoom: number } {
  // Only apply edge slow-mo effects when player has meaningful best score
  const hasEstablishedBest = state.best > 50;

  if ((!state.flying && !state.sliding) || state.px <= 90 || !hasEstablishedBest) {
    audio.stopEdgeWarning();
    return { targetSlowMo: 0, targetZoom: 1 };
  }

  const edgeProximity = (state.px - 90) / (CLIFF_EDGE - 90);

  // Height factor: 0 when high in air, 1 when near ground or sliding
  const heightFactor = calculateHeightFactor(state.py, state.sliding);

  // Slow-mo is an unlockable feature - requires 'dist_400' achievement
  const hasSlowMoUnlocked = state.achievements.has('dist_400');

  // Base slowMo from edge proximity (only if unlocked), scaled by height
  let targetSlowMo = (state.reduceFx || !hasSlowMoUnlocked) ? 0 : Math.min(0.7, edgeProximity * 0.8) * heightFactor;
  let targetZoom = state.reduceFx ? 1 : (1 + edgeProximity * 0.3);

  // Record Zone Bullet Time - Two Levels (only if unlocked), scaled by height
  if (state.recordZoneActive && !state.reduceFx && hasSlowMoUnlocked) {
    // Level 1: Instant bullet time when entering record zone (scaled by height)
    targetSlowMo = Math.max(0.7 * heightFactor, targetSlowMo);
    targetZoom = Math.max(1 + 0.5 * heightFactor, targetZoom);

    // Level 2: Peggle super heat when really going for record (scaled by height)
    if (state.recordZoneIntensity > 0.6) {
      const intensitySlowMo = 0.85 + state.recordZoneIntensity * 0.1; // 0.91-0.95
      targetSlowMo = intensitySlowMo * heightFactor;
      targetZoom = 1 + (0.8 + state.recordZoneIntensity * 0.5) * heightFactor; // scaled 2.1-2.3
    }
  }

  // Peak moment - maximum freeze (only if unlocked), scaled by height
  if (state.recordZonePeak && !state.reduceFx && hasSlowMoUnlocked) {
    targetSlowMo = 0.98 * heightFactor;
    targetZoom = 1 + 1.5 * heightFactor;
  }

  // CINEMATIC ZONE - 2x zoom and 2x slowdown when passing threshold, scaled by height
  if (state.px > CINEMATIC_THRESHOLD && !state.reduceFx && hasSlowMoUnlocked) {
    targetZoom = 1 + 1 * heightFactor; // 1 when high, 2 when near ground
    targetSlowMo = 0.5 * heightFactor; // 0 when high, 0.5 when near ground
    // Focus on the finish area instead of Zeno
    state.zoomTargetX = CLIFF_EDGE - 30;
    state.zoomTargetY = 240 - 60; // H - 60, ground level area
  }

  // ZENO RULER ZONE - Extreme bullet time for fractal ruler visualization (px > 419)
  // ONLY activates during SLIDING, not flying - prevents slow-mo during fall
  if (state.px > 419 && state.sliding && !state.reduceFx && hasSlowMoUnlocked) {
    const decimal = state.px - 419; // 0.0 to 1.0
    let zenoLevel = 0;
    if (decimal >= 0.9) zenoLevel = 1;
    if (decimal >= 0.99) zenoLevel = 2;
    if (decimal >= 0.999) zenoLevel = 3;
    if (decimal >= 0.9999) zenoLevel = 4;

    // Progressive slow-mo: deeper levels = slower time
    const zenoSlowMo = 0.90 + zenoLevel * 0.02;
    targetSlowMo = Math.max(targetSlowMo, zenoSlowMo);

    // Slight extra zoom at Zeno ruler zone
    targetZoom = Math.max(targetZoom, 1.8);
  }

  // Heartbeat audio during record zone (only if unlocked)
  if (state.recordZoneActive && !state.reduceFx && hasSlowMoUnlocked) {
    // Handled in applyCinematicEffects for proper timing
  }

  // Record break celebration (always plays - not dependent on slow-mo)
  if (state.recordZonePeak) {
    audio.recordBreak();
    state.recordZonePeak = false; // Only trigger once
  }

  audio.edgeWarning(edgeProximity);

  return { targetSlowMo, targetZoom };
}

/**
 * Apply cinematic effects to state
 */
export function applyCinematicEffects(
  state: GameState,
  targetSlowMo: number,
  targetZoom: number,
  nowMs: number,
  audio: CinematicAudio
): void {
  state.slowMo = targetSlowMo;
  state.zoom = targetZoom;
  state.zoomTargetX = state.px;
  state.zoomTargetY = state.py;

  // Heartbeat audio during record zone
  const hasSlowMoUnlocked = state.achievements.has('dist_400');
  if (state.recordZoneActive && !state.reduceFx && hasSlowMoUnlocked) {
    const heartbeatInterval = state.recordZoneIntensity > 0.6 ? 300 : 400;
    if (Math.floor(nowMs / heartbeatInterval) !== Math.floor((nowMs - 16) / heartbeatInterval)) {
      audio.heartbeat(state.recordZoneIntensity);
    }
  }
}

/**
 * Update precision bar activation and time scale
 */
export function updatePrecisionBar(
  state: GameState,
  audio: CinematicAudio
): void {
  if ((!state.flying && !state.sliding) || state.landed) {
    if (state.precisionBarActive) {
      state.precisionBarActive = false;
      state.precisionTimeScale = 1;
      audio.stopPrecisionDrone?.();
    }
    return;
  }

  const shouldActivate = shouldActivatePrecisionBar(state);

  if (shouldActivate && !state.precisionBarActive) {
    state.precisionBarActive = true;
    state.precisionBarTriggeredThisThrow = true;
    audio.precisionDrone?.();
  }

  // Apply precision time scale when active (only in 410-420 zone), scaled by height
  if (state.precisionBarActive && state.px >= 410 && state.px <= CLIFF_EDGE) {
    const heightFactor = calculateHeightFactor(state.py, state.sliding);
    const baseTimeScale = calculatePrecisionTimeScale(state.px); // 1.0 at 410, 0.2 at 420
    // Interpolate: when high (heightFactor=0), timeScale=1 (normal speed)
    // when near ground (heightFactor=1), use full precision slow-mo
    state.precisionTimeScale = 1 - (1 - baseTimeScale) * heightFactor;
  }

  // Deactivate slow-mo when past cliff edge (420) - player fell off
  if (state.px > CLIFF_EDGE && state.precisionBarActive) {
    state.precisionTimeScale = 1;
    state.precisionBarActive = false;
    audio.stopPrecisionDrone?.();
  }

  // Track PB pace (within 10px of best)
  if (!state.pbPaceActive && state.px > state.best - 10 && state.best > 0) {
    state.pbPaceActive = true;
  }

  // Track if we passed PB position
  if (state.precisionBarActive && !state.passedPbThisThrow && hasPassedPb(state.px, state.best)) {
    state.passedPbThisThrow = true;
    audio.pbDing?.();
  }
}

/**
 * Decay visual effects (shake, flash, zoom, slowMo)
 */
export function decayVisualEffects(state: GameState): void {
  if (state.screenShake > 0) state.screenShake *= 0.8;
  if (state.landingFrame > 0) state.landingFrame--;
  if (state.staminaDeniedShake > 0) state.staminaDeniedShake--;

  if (state.slowMo > 0) state.slowMo *= 0.95;
  if (state.screenFlash > 0) state.screenFlash *= 0.85;
  if (state.zoom > 1) state.zoom = 1 + (state.zoom - 1) * 0.92;
}

/**
 * Decay touch feedback
 */
export function decayTouchFeedback(state: GameState): void {
  if (state.touchFeedback > 0) {
    state.touchFeedback *= 0.9;
    if (state.touchFeedback < 0.01) state.touchFeedback = 0;
  }
}

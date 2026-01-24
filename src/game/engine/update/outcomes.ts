/**
 * Outcomes module for update system
 * Handles landing/fall resolution, fail juice, near-miss detection
 */

import { CLIFF_EDGE, H } from '@/game/constants';
import type { Theme } from '@/game/themes';
import type { GameState } from '../types';
import { spawnParticles, nextWind, loadArcadeLevel } from '../state';
import { startPageFlip } from '../pageFlip';
import { evaluateContract } from '../contracts';
import { isRouteComplete } from '../routes';
import {
  checkStarObjectives,
  isLevelPassed,
  recordStars,
  advanceLevel,
  getLevel,
} from '../arcade';

// Audio interface for outcomes
export type OutcomeAudio = {
  stopSlide?: () => void;
  stopFly?: () => void;
  win?: () => void;
  tone: (freq: number, duration: number, type?: OscillatorType, volume?: number) => void;
  failureSound: (type: 'tumble' | 'dive' | 'splat') => void;
  wilhelmScream: () => void;
  failImpact?: () => void;
  heartbeat: (intensity: number) => void;
  zenoJingle: () => void;
  stopEdgeWarning: () => void;
};

// UI interface for outcomes
export type OutcomeUI = {
  setFellOff: (v: boolean) => void;
  setLastMultiplier: (v: number) => void;
  setPerfectLanding: (v: boolean) => void;
  setLastDist: (v: number | null) => void;
  setThrowState: (state: import('../types').ThrowState) => void;
  onFall?: (totalFalls: number) => void;
  onLanding?: (landingX: number, targetX: number, ringsPassedThisThrow: number, landingVelocity: number, fellOff: boolean) => void;
};

// Services interface for outcomes
export type OutcomeServices = {
  triggerHaptic: (pattern?: number | number[]) => void;
  scheduleReset: (ms: number) => void;
  canvas?: HTMLCanvasElement;
};

/**
 * Handle successful landing (stopped before cliff edge)
 */
export function handleSuccessfulLanding(
  state: GameState,
  landedAt: number,
  isPerfect: boolean,
  finalMultiplier: number,
  theme: Theme,
  audio: OutcomeAudio,
  ui: OutcomeUI
): void {
  state.dist = Math.max(0, landedAt);
  ui.setFellOff(false);

  state.lastMultiplier = finalMultiplier;
  ui.setLastMultiplier(finalMultiplier);

  state.perfectLanding = isPerfect;
  ui.setPerfectLanding(isPerfect);

  // Perfect landing audio feedback
  if (isPerfect) {
    setTimeout(() => audio.tone(1320, 0.05, 'sine', 0.06), 50);
    setTimeout(() => audio.tone(1760, 0.04, 'sine', 0.05), 100);
  }

  audio.win?.();
  audio.stopSlide?.();
}

/**
 * Handle fall off edge
 */
export function handleFallOff(
  state: GameState,
  nowMs: number,
  audio: OutcomeAudio,
  ui: OutcomeUI,
  svc: OutcomeServices
): void {
  state.fellOff = true;
  state.dist = 0;
  state.lastMultiplier = 0;
  ui.setFellOff(true);
  ui.setLastMultiplier(0);
  ui.setPerfectLanding(false);

  audio.stopSlide?.();
  audio.stopFly?.();

  // Trigger comedic failure
  state.failureAnimating = true;
  state.failureFrame = 0;
  state.failureType = Math.random() > 0.5 ? 'tumble' : 'dive';

  // Fail juice
  triggerFailJuice(state, nowMs, audio, svc);

  // 10% chance of Wilhelm scream
  if (Math.random() < 0.1) {
    audio.wilhelmScream();
  } else {
    audio.failureSound(state.failureType);
  }
}

/**
 * Handle slide off edge (during sliding)
 */
export function handleSlideOffEdge(
  state: GameState,
  nowMs: number,
  audio: OutcomeAudio,
  ui: OutcomeUI,
  svc: OutcomeServices
): void {
  state.sliding = false;
  state.fellOff = true;
  state.dist = 0;
  ui.setFellOff(true);

  // Comedic failure
  state.failureAnimating = true;
  state.failureFrame = 0;
  state.failureType = state.vx > 2 ? 'dive' : 'tumble';

  // Fail juice
  triggerFailJuice(state, nowMs, audio, svc);

  // Near-miss detection
  detectNearMiss(state, nowMs, audio);

  // 10% chance of Wilhelm scream
  if (Math.random() < 0.1) {
    audio.wilhelmScream();
  } else {
    audio.failureSound(state.failureType);
  }

  ui.setLastDist(null);
}

/**
 * Trigger fail juice effects (hit-stop, shake, particles)
 */
export function triggerFailJuice(
  state: GameState,
  nowMs: number,
  audio: OutcomeAudio,
  svc: OutcomeServices
): void {
  if (state.failJuiceActive) return;

  state.failJuiceActive = true;
  state.failJuiceStartTime = nowMs;
  state.failImpactX = state.px;
  state.failImpactY = state.py;

  // Hit-stop (brief freeze on impact)
  state.slowMo = Math.max(state.slowMo, 0.95);

  // Screen shake
  state.screenShake = state.reduceFx ? 0 : 5;

  // Fail impact sound
  audio.failImpact?.();

  // Haptic feedback
  svc.triggerHaptic(60);

  // Spawn dust particles at impact point
  if (!state.reduceFx) {
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI + Math.PI; // Upward arc
      state.particles.push({
        x: state.failImpactX,
        y: H - 20, // Ground level
        vx: Math.cos(angle) * (1 + Math.random()),
        vy: Math.sin(angle) * 2,
        life: 1,
        maxLife: 20 + Math.random() * 10,
        color: '#8B7355', // Dust brown
      });
    }
  }
}

/**
 * Detect near-miss and trigger dramatic effects
 */
export function detectNearMiss(
  state: GameState,
  nowMs: number,
  audio: OutcomeAudio
): void {
  if (state.nearMissActive) return;

  const distFromTarget = Math.abs(state.px - state.zenoTarget);
  const distFromEdge = CLIFF_EDGE - state.px;

  // Determine intensity based on distance
  let intensity: 'extreme' | 'close' | 'near' | null = null;
  if (distFromEdge < 0.5 || distFromTarget < 2) {
    intensity = 'extreme';
    state.nearMissDistance = Math.min(distFromEdge, distFromTarget);
  } else if (distFromEdge < 2 || distFromTarget < 5) {
    intensity = 'close';
    state.nearMissDistance = Math.min(distFromEdge, distFromTarget);
  } else if (distFromEdge < 5 || distFromTarget < 10) {
    intensity = 'near';
    state.nearMissDistance = Math.min(distFromEdge, distFromTarget);
  }

  if (intensity) {
    state.nearMissActive = true;
    state.nearMissIntensity = intensity;
    state.nearMissAnimationStart = nowMs;

    // Trigger heartbeat for all players
    if (intensity === 'extreme' || intensity === 'close') {
      audio.heartbeat(intensity === 'extreme' ? 1.0 : 0.7);
    }

    // Dramatic slowdown
    state.slowMo = 0.9;
  }
}

/**
 * Evaluate contract on landing
 */
export function evaluateLandingContract(
  state: GameState,
  audio: OutcomeAudio,
  ui: OutcomeUI
): void {
  if (!state.activeContract || state.practiceMode || state.fellOff) return;

  const result = evaluateContract(state.activeContract, {
    routeComplete: state.activeRoute ? isRouteComplete(state.activeRoute) : false,
    routeFailed: state.activeRoute?.failed ?? false,
    staminaUsed: state.staminaUsedThisThrow,
    brakeTaps: state.airControl.brakeTaps,
    landingDistance: state.dist,
    ringsCollected: state.ringsPassedThisThrow,
  });

  state.lastContractResult = result;

  if (result.success) {
    // Award throws
    state.throwState.permanentThrows += result.reward;
    ui.setThrowState(state.throwState);
    state.contractConsecutiveFails = 0;

    // Celebration feedback
    audio.zenoJingle?.();
    state.screenFlash = state.reduceFx ? 0 : 0.5;
  } else {
    state.contractConsecutiveFails++;
  }

  // Rotate contract every 3 landings or after success
  if (result.success || state.stats.totalThrows % 3 === 0) {
    state.activeContract = null; // Will regenerate on next throw
  }
}

/**
 * Evaluate arcade star objectives on landing
 * Returns true if level should advance
 *
 * PASS REQUIREMENT: All doodles must be collected
 * STARS: ★ landedInZone, ★★ inOrder (circular Bomb Jack style)
 */
export function evaluateArcadeStars(
  state: GameState,
  audio: OutcomeAudio
): boolean {
  if (!state.arcadeMode || !state.arcadeState || state.fellOff) return false;

  const level = getLevel(state.arcadeState.currentLevelId);
  if (!level) return false;

  const stars = checkStarObjectives(state.arcadeState, level, state.dist);

  // Must collect all doodles to pass level
  if (!isLevelPassed(stars)) {
    return false;
  }

  // Record earned stars (even if no bonus stars, we passed)
  recordStars(state.arcadeState, level.id, stars);

  // Celebration feedback based on stars earned
  const starCount = (stars.inOrder ? 1 : 0) + (stars.landedInZone ? 1 : 0);
  if (starCount >= 1) {
    audio.zenoJingle?.();
  }

  // Advance to next level if not at max
  if (state.arcadeState.currentLevelId < 10) {
    advanceLevel(state.arcadeState);
    // Load new level objects
    loadArcadeLevel(state, state.arcadeState.currentLevelId);
    return true;
  }

  return false;
}

/**
 * Trigger page flip transition
 */
export function triggerPageFlip(
  state: GameState,
  canvas: HTMLCanvasElement | undefined,
  audio: { playPaperFlip?: () => void },
  scheduleReset: (ms: number) => void,
  delay: number = 800
): void {
  if (canvas && !state.reduceFx) {
    setTimeout(() => {
      if (canvas) {
        startPageFlip(state, canvas, performance.now());
        audio.playPaperFlip?.();
      }
    }, delay);
  } else {
    // Fallback for reduceFx mode
    scheduleReset(state.fellOff ? 1200 : 400);
  }
}

/**
 * Finalize throw outcome (increment try count, wind change)
 */
export function finalizeThrowOutcome(state: GameState): void {
  state.tryCount++;
  if (state.tryCount % 5 === 0) {
    nextWind(state);
  }
  state.landed = true;
}

/**
 * Update near-miss dramatic pause
 */
export function updateNearMissPause(
  state: GameState,
  nowMs: number
): void {
  const NEAR_MISS_PAUSE_DURATION = 1000;

  if (!state.nearMissActive) return;

  const timeSinceNearMiss = nowMs - state.nearMissAnimationStart;

  if (timeSinceNearMiss < NEAR_MISS_PAUSE_DURATION) {
    // Maintain heavy slow-mo during pause
    state.slowMo = Math.max(state.slowMo, 0.85);

    // Screen pulse effect synced with heartbeat
    if (timeSinceNearMiss < 200 || (timeSinceNearMiss > 400 && timeSinceNearMiss < 600)) {
      if (!state.reduceFx) {
        state.screenFlash = 0.1;
      }
    }
  } else {
    // Release dramatic pause
    state.nearMissActive = false;
  }
}

/**
 * Update failure animation
 */
export function updateFailureAnimation(
  state: GameState,
  theme: Theme
): void {
  if (!state.failureAnimating) return;

  state.failureFrame++;

  // Animate falling off the edge
  if (state.failureType === 'tumble') {
    state.px += 1;
    state.py += state.failureFrame * 0.5;
    // Spawn occasional particles
    if (state.failureFrame % 5 === 0) {
      spawnParticles(state, state.px, state.py, 2, 1, theme.danger);
    }
  } else if (state.failureType === 'dive') {
    state.px += 2;
    state.py += state.failureFrame * 0.8;
  }

  // End animation after falling off screen
  if (state.py > H + 50) {
    state.failureAnimating = false;
  }
}

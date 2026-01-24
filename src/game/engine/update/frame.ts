/**
 * Frame orchestrator module for update system
 * Main updateFrame function that coordinates all subsystems
 */

import { CLIFF_EDGE, H, MAX_FINAL_MULTIPLIER } from '@/game/constants';
import type { Theme } from '@/game/themes';
import type { DailyStats } from '@/game/storage';
import { saveJson, saveNumber } from '@/game/storage';
import type { DailyTasks, GameState, ThrowState } from '../types';
import type { DailyChallenge } from '@/game/dailyChallenge';
import type { SessionGoal } from '@/game/goals';
import { startBuffering, stopBuffering } from '../inputBuffer';
import { checkTutorialTrigger, startTutorial, updateTutorial } from '../tutorial';
import { updateAnimator } from '../animationController';

// Import subsystem modules
import {
  updatePrecisionInput,
  shouldStartBuffering,
  shouldStopBuffering,
} from './input';
import {
  shouldStartCharging,
  startCharging,
  updateCharging,
  executeLaunch,
} from './charge';
import {
  processAirControls,
  processStaminaWarning,
  updateFlightPhysics,
  processBounceCollision,
  processArcadeCollisions,
  updateJuicePopups,
  checkLandingTransition,
  trackLastValidPosition,
} from './flight';
import {
  processSlideControls,
  processSlideStaminaWarning,
  updateSlidePhysics,
  hasSlideStoppedSuccessfully,
  hasSlidOffEdge,
  getLandingDistance,
  isPerfectLanding,
  calculateLandingScore,
} from './slide';
import {
  handleSuccessfulLanding,
  handleFallOff,
  handleSlideOffEdge,
  evaluateLandingContract,
  evaluateArcadeStars,
  triggerPageFlip,
  finalizeThrowOutcome,
  updateNearMissPause,
  updateFailureAnimation,
} from './outcomes';
import {
  checkAchievements,
  updateAchievementDisplay,
  updateRingStats,
  updateTotalScore,
  updateDailyStatsOnLanding,
  handleZenoProgression,
  updateLandingStats,
  updateThrowStats,
  updatePersonalLeaderboard,
  updateDailyChallengeProgress,
  updateDailyTasksOnLanding,
  updateHotStreak,
  handleFallStats,
  runMilestoneChecks,
} from './progression';
import {
  updateRecordZone,
  calculateCinematicEffects,
  applyCinematicEffects,
  updatePrecisionBar,
  decayVisualEffects,
  decayTouchFeedback,
} from './cinematic';
import {
  updateStars,
  updateGrid,
  updateTrail,
  updateParticles,
  updateParticleSystem,
  resetCurrentMultiplier,
} from './fx';

// Time scale for gameplay speed (0.550 = 55% speed, 1.0 = normal)
const TIME_SCALE = 0.550;

export type GameAudio = {
  startCharge: (power01: number) => void;
  updateCharge: (power01: number) => void;
  stopCharge: () => void;
  whoosh: () => void;
  impact: (intensity01: number) => void;
  edgeWarning: (proximity01: number) => void;
  stopEdgeWarning: () => void;
  tone: (freq: number, duration: number, type?: OscillatorType, volume?: number) => void;
  zenoJingle: () => void;
  heartbeat: (intensity: number) => void;
  recordBreak: () => void;
  failureSound: (type: 'tumble' | 'dive' | 'splat') => void;
  wilhelmScream: () => void;
  startFly?: () => void;
  stopFly?: () => void;
  slide?: () => void;
  stopSlide?: () => void;
  win?: () => void;
  airBrakeTap?: () => void;
  airBrakeHold?: () => void;
  slideExtend?: () => void;
  slideBrake?: () => void;
  staminaLow?: () => void;
  actionDenied?: () => void;
  precisionDrone?: () => void;
  stopPrecisionDrone?: () => void;
  pbDing?: () => void;
  newRecordJingle?: () => void;
  closeCall?: () => void;
  playPaperFlip?: () => void;
  playPaperSettle?: () => void;
  ringCollect?: (ringIndex: number, ringX?: number) => void;
  failImpact?: () => void;
  sweetSpotClick?: () => void;
  startTensionDrone?: () => void;
  updateTensionDrone?: (power01: number) => void;
  stopTensionDrone?: () => void;
};

export type GameUI = {
  setFellOff: (v: boolean) => void;
  setLastMultiplier: (v: number) => void;
  setPerfectLanding: (v: boolean) => void;
  setTotalScore: (v: number) => void;
  setBestScore: (v: number) => void;
  setZenoTarget: (v: number) => void;
  setZenoLevel: (v: number) => void;
  setStats: (v: GameState['stats']) => void;
  setAchievements: (v: Set<string>) => void;
  setNewAchievement: (v: string | null) => void;
  setLastDist: (v: number | null) => void;
  setSessionGoals: (updater: (prev: SessionGoal[]) => SessionGoal[]) => void;
  setDailyStats: (v: DailyStats) => void;
  setDailyChallenge: (v: DailyChallenge) => void;
  setHotStreak: (current: number, best: number) => void;
  setThrowState: (state: ThrowState) => void;
  setPracticeMode: (mode: boolean) => void;
  setDailyTasks: (tasks: DailyTasks) => void;
  onNewPersonalBest?: (totalScore: number, bestThrow: number) => void;
  onFall?: (totalFalls: number) => void;
  onLanding?: (landingX: number, targetX: number, ringsPassedThisThrow: number, landingVelocity: number, fellOff: boolean) => void;
  onChargeStart?: () => void;
  onPbPassed?: () => void;
};

export type GameServices = {
  theme: Theme;
  nowMs: number;
  pressed: boolean;
  audio: GameAudio;
  ui: GameUI;
  triggerHaptic: (pattern?: number | number[]) => void;
  scheduleReset: (ms: number) => void;
  getDailyStats: () => DailyStats;
  canvas?: HTMLCanvasElement;
};

/**
 * Main frame update function - orchestrates all subsystems
 */
export function updateFrame(state: GameState, svc: GameServices): void {
  const { pressed, nowMs, theme, audio, ui } = svc;

  if (state.paused) return;

  // === INPUT BUFFERING ===
  if (shouldStartBuffering(state.slowMo)) {
    startBuffering();
  }

  let processBufferedInputs = false;
  if (shouldStopBuffering(state.slowMo)) {
    processBufferedInputs = true;
    stopBuffering();
  }

  // Calculate effective delta time
  const effectiveDeltaMs = 16.67;

  // Track previous vy for tutorial apex detection
  const prevVy = state.vy;

  // === DECAY EFFECTS ===
  decayTouchFeedback(state);

  // === PRECISION INPUT ===
  if (state.flying || state.sliding) {
    updatePrecisionInput(state, pressed, processBufferedInputs);
  }

  let precisionAppliedThisFrame = false;

  // === CHARGING ===
  if (shouldStartCharging(state, pressed)) {
    startCharging(state, nowMs, audio, ui);
  }

  if (state.charging && pressed) {
    updateCharging(state, nowMs, theme, audio);
  }

  if (state.charging && !pressed) {
    executeLaunch(state, nowMs, theme, audio, ui);
  }

  // === BACKGROUND FX ===
  updateStars(state, nowMs);
  updateGrid(state);

  // === TUTORIAL ===
  const tutorialSlowMo = updateTutorial(state, 1 / 60);

  // Calculate effective time scale
  const precisionSlowdown = state.precisionBarActive ? state.precisionTimeScale : 1;
  const effectiveTimeScale = TIME_SCALE * (1 - state.slowMo) * tutorialSlowMo * precisionSlowdown;

  // === FLYING ===
  if (state.flying) {
    // Air controls
    if (!state.landed) {
      precisionAppliedThisFrame = processAirControls(state, pressed, nowMs, audio);
      processStaminaWarning(state, nowMs, audio);
    }

    // Physics
    updateFlightPhysics(state, pressed, nowMs, effectiveTimeScale);

    // Bounce collision
    processBounceCollision(state, nowMs, audio);

    // Arcade collisions (doodles, springs, portal)
    processArcadeCollisions(state, nowMs, audio);

    // Juice popups
    updateJuicePopups(state, effectiveDeltaMs, nowMs);

    // Landing transition
    if (checkLandingTransition(state, theme, audio)) {
      // Transitioned to sliding
    }

    // Track last valid position
    trackLastValidPosition(state);
  }

  // === TRAIL & PARTICLES ===
  updateTrail(state);
  updateParticles(state);
  updateParticleSystem(state);

  // === FAILURE ANIMATION ===
  updateFailureAnimation(state, theme);

  // === DECAY VISUAL EFFECTS ===
  decayVisualEffects(state);

  // === RECORD ZONE ===
  updateRecordZone(state);

  // === CINEMATIC EFFECTS ===
  const { targetSlowMo, targetZoom } = calculateCinematicEffects(state, audio);
  if ((state.flying || state.sliding) && state.px > 90 && state.best > 50) {
    applyCinematicEffects(state, targetSlowMo, targetZoom, nowMs, audio);
  } else {
    audio.stopEdgeWarning();
  }

  // === PRECISION BAR ===
  updatePrecisionBar(state, audio);

  // === MULTIPLIER RESET ===
  resetCurrentMultiplier(state);

  // === SLIDING ===
  if (state.sliding) {
    // Slide controls
    const slideResult = processSlideControls(state, pressed, nowMs, audio, precisionAppliedThisFrame);
    precisionAppliedThisFrame = slideResult.precisionAppliedThisFrame;
    processSlideStaminaWarning(state, nowMs, audio);

    // Physics
    updateSlidePhysics(state, effectiveTimeScale, slideResult.frictionMultiplier, theme);

    // Juice popups (continue updating during slide)
    updateJuicePopups(state, effectiveDeltaMs, nowMs);

    // === SLIDE STOPPED (LANDED) ===
    if (hasSlideStoppedSuccessfully(state)) {
      state.sliding = false;
      state.vx = 0;

      const landedAt = getLandingDistance(state.px);

      if (landedAt >= CLIFF_EDGE) {
        // Fell off
        handleFallOff(state, nowMs, audio, ui, svc);

        if (!state.practiceMode) {
          handleFallStats(state, ui);
        }
      } else {
        // Successful landing
        const isPerfect = isPerfectLanding(landedAt, state.zenoTarget);
        const { finalMultiplier, scoreGained } = calculateLandingScore(
          landedAt,
          state.ringMultiplier,
          MAX_FINAL_MULTIPLIER,
          isPerfect
        );

        handleSuccessfulLanding(state, landedAt, isPerfect, finalMultiplier, theme, audio, ui);

        if (!state.practiceMode) {
          updateRingStats(state);

          // Dev logging
          if (import.meta.env.DEV) {
            console.log('[DEV] Landing stats:', {
              ringsPassedThisThrow: state.ringsPassedThisThrow,
              ringMultiplier: state.ringMultiplier.toFixed(3),
              basePoints: landedAt,
              scoreGained: scoreGained.toFixed(1),
            });
          }

          updateTotalScore(state, scoreGained, ui);
          updateDailyStatsOnLanding(state, ui, svc.getDailyStats);
          handleZenoProgression(state, audio, ui, theme);

          audio.stopEdgeWarning();

          updateLandingStats(state, isPerfect, finalMultiplier, ui);
        }

        audio.stopEdgeWarning();
      }

      // Stats tracking (all modes)
      if (!state.practiceMode) {
        updateThrowStats(state, ui);
        updatePersonalLeaderboard(state.dist);
        updateDailyChallengeProgress(state, ui);
        updateDailyTasksOnLanding(state, nowMs, ui);
        updateHotStreak(state, ui);
        checkAchievements(state, ui, audio);
        runMilestoneChecks(state, ui);

        state.lastDist = state.fellOff ? null : state.dist;
        ui.setLastDist(state.lastDist);
      }

      // Landing callback
      ui.onLanding?.(
        state.px,
        state.zenoTarget,
        state.ringsPassedThisThrow,
        Math.abs(state.vx),
        state.fellOff
      );

      // Contract evaluation
      evaluateLandingContract(state, audio, ui);
      if (state.lastContractResult?.success) {
        saveJson('throw_state', state.throwState);
      }

      // Arcade mode: evaluate star objectives
      evaluateArcadeStars(state, audio);

      // Show "Almost!" overlay
      if (!state.fellOff && state.dist < state.zenoTarget) {
        state.almostOverlayActive = true;
        state.almostOverlayDistance = state.zenoTarget - state.dist;
      }

      // Finalize
      finalizeThrowOutcome(state);

      // Page flip
      triggerPageFlip(state, svc.canvas, audio, svc.scheduleReset, 800);
    }

    // === SLID OFF EDGE ===
    if (hasSlidOffEdge(state) && state.sliding) {
      handleSlideOffEdge(state, nowMs, audio, ui, svc);

      if (!state.practiceMode) {
        handleFallStats(state, ui);
      }

      ui.onLanding?.(
        state.px,
        state.zenoTarget,
        state.ringsPassedThisThrow,
        Math.abs(state.vx),
        true
      );

      finalizeThrowOutcome(state);
      triggerPageFlip(state, svc.canvas, audio, svc.scheduleReset, 800);
    }
  }

  // === NEAR-MISS PAUSE ===
  updateNearMissPause(state, nowMs);

  // === TUTORIAL TRIGGERS ===
  const tutorialPhase = checkTutorialTrigger(state, prevVy);
  if (tutorialPhase !== 'none') {
    startTutorial(state, tutorialPhase);
  }

  // === ACHIEVEMENT DISPLAY ===
  updateAchievementDisplay(state, ui, nowMs);

  // === ANIMATION ===
  updateAnimator(state, 1 / 60);
}

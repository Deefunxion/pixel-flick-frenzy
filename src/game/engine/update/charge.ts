/**
 * Charge lifecycle module for update system
 * Handles charge start, update (power bouncing), sweet spot, and launch
 */

import {
  CHARGE_MS,
  MIN_POWER,
  MAX_POWER,
} from '@/game/constants';
import type { Theme } from '@/game/themes';
import { saveJson } from '@/game/storage';
import type { GameState } from '../types';
import { consumeThrow } from '../throws';
// Types will be imported from frame.ts once created
// For now, inline the minimal interface needed
export type ChargeAudio = {
  startCharge: (power01: number) => void;
  updateCharge: (power01: number) => void;
  stopCharge: () => void;
  whoosh: () => void;
  sweetSpotClick?: () => void;
  startTensionDrone?: () => void;
  updateTensionDrone?: (power01: number) => void;
  stopTensionDrone?: () => void;
  startFly?: () => void;
};

export type ChargeUI = {
  setFellOff: (v: boolean) => void;
  setThrowState: (state: import('../types').ThrowState) => void;
  setPracticeMode: (mode: boolean) => void;
  onChargeStart?: () => void;
};

/**
 * Check if charging should start
 */
export function shouldStartCharging(state: GameState, pressed: boolean): boolean {
  return !state.flying && !state.sliding && !state.landed && pressed && !state.charging;
}

/**
 * Start charging phase
 */
export function startCharging(
  state: GameState,
  nowMs: number,
  audio: ChargeAudio,
  ui: ChargeUI
): void {
  state.charging = true;
  state.chargeStart = nowMs;
  state.almostOverlayActive = false; // Hide "Almost!" overlay when starting new throw
  ui.setFellOff(false);
  ui.onChargeStart?.(); // Dismiss grade overlay immediately
  audio.startCharge(0);
  audio.startTensionDrone?.(); // Start low tension drone
}

/**
 * Update charge power and visual effects
 * Returns current charge power (0-1)
 */
export function updateCharging(
  state: GameState,
  nowMs: number,
  theme: Theme,
  audio: ChargeAudio
): number {
  const elapsed = nowMs - state.chargeStart;
  const cycleTime = CHARGE_MS * 2; // Full cycle is up + down
  const cyclePosition = (elapsed % cycleTime) / CHARGE_MS;
  // cyclePosition: 0→1 (going up), 1→2 (going down)
  const dt = cyclePosition <= 1 ? cyclePosition : 2 - cyclePosition;
  state.chargePower = dt;
  audio.updateCharge(dt);
  audio.updateTensionDrone?.(dt); // Update tension drone pitch/volume

  // Sweet spot detection (70-85% power)
  const SWEET_SPOT_MIN = 0.70;
  const SWEET_SPOT_MAX = 0.85;
  const inSweetSpot = dt >= SWEET_SPOT_MIN && dt <= SWEET_SPOT_MAX;

  // Track entry into sweet spot
  if (inSweetSpot && !state.chargeSweetSpot) {
    state.sweetSpotJustEntered = true;
    audio.sweetSpotClick?.(); // Satisfying click

    // Micro zoom
    if (!state.reduceFx) {
      state.zoom = 1.02; // Subtle 2% zoom
    }
  } else {
    state.sweetSpotJustEntered = false;
  }

  state.chargeSweetSpot = inSweetSpot;

  // Build charge visual intensity
  state.chargeGlowIntensity = dt;
  state.chargeVignetteActive = dt > 0.5;

  // Emit charging swirls every 4 frames (intensified with charge level)
  if (Math.floor(nowMs / 64) % 4 === 0 && state.particleSystem) {
    state.particleSystem.emitChargingSwirls(state.px, state.py, dt, theme.accent1);
  }

  // Extra particles at high charge
  if (dt > 0.6 && !state.reduceFx && state.particleSystem) {
    const particleChance = dt * 0.3; // Up to 30% chance per frame
    if (Math.random() < particleChance) {
      state.particleSystem.emitChargingSwirls(state.px, state.py, dt, '#FFD700');
    }
  }

  return dt;
}

/**
 * Execute launch when charge is released
 */
export function executeLaunch(
  state: GameState,
  nowMs: number,
  theme: Theme,
  audio: ChargeAudio,
  ui: ChargeUI
): void {
  state.charging = false;

  // Reset charge visual tension
  state.chargeGlowIntensity = 0;
  state.chargeVignetteActive = false;

  // Consume a throw when launching
  const { newState: newThrowState, practiceMode, throwConsumed } = consumeThrow(state.throwState);
  state.throwState = newThrowState;
  state.practiceMode = practiceMode;

  // Sync throw state to React UI
  ui.setThrowState(newThrowState);
  ui.setPracticeMode(practiceMode);

  // Save throw state
  if (throwConsumed) {
    saveJson('throw_state', state.throwState);
  }

  state.flying = true;
  state.launchTimestamp = nowMs; // Track launch time for air time calculation
  const power = MIN_POWER + (MAX_POWER - MIN_POWER) * state.chargePower;
  const angleRad = (state.angle * Math.PI) / 180;
  state.vx = power * Math.cos(angleRad);
  state.vy = -power * Math.sin(angleRad);
  state.initialSpeed = power;
  state.trail = [];
  state.ghostTrail = []; // Clear ghost trail for new throw
  state.chargePower = 0;
  state.nudgeUsed = false;
  state.launchFrame = 0; // Reset launch frame for burst effect

  // Reset Zeno air control for new throw
  state.airControl = {
    throttleActive: false,
    throttleMsUsed: 0,
    brakeTaps: 0,
    recentTapTimes: [],
    isHoldingBrake: false,
  };

  // Reset stamina tracking for this throw
  state.staminaUsedThisThrow = 0;

  // Emit launch sparks
  if (state.particleSystem) {
    state.particleSystem.emitLaunchSparks(state.px, state.py, theme.accent3);
  }

  audio.stopCharge();
  audio.stopTensionDrone?.(); // Release tension on launch
  audio.whoosh();
  audio.startFly?.(); // Start fly sound while in air
}

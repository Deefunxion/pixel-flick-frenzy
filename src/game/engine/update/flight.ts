/**
 * Flight physics module for update system
 * Handles flight mechanics, air controls, ring collision, bounce, and landing transition
 */

import { BASE_GRAV, CEILING_Y, CLIFF_EDGE, H } from '@/game/constants';
import type { Theme } from '@/game/themes';
import type { GameState } from '../types';
import {
  registerFloatTap,
  calculateTapGravity,
  applyHardBrake,
  BRAKE_ACTIVATION_FRAMES,
} from '../precision';
import { spawnParticles } from '../state';
import {
  checkRingCollision,
  RING_MULTIPLIERS,
} from '../rings';
import {
  createRingPopup,
  updateRingPopups,
  shouldMicroFreeze,
  getEdgeGlowIntensity,
  shouldScreenFlash,
} from '../ringJuice';
import {
  createRoutePopup,
  updateRoutePopups,
  getRouteNodeFrequency,
} from '../routeJuice';
import { checkBounceCollision, applyBounce } from '../bounce';
import { checkRouteNodeProgress } from '../routes';
import {
  checkDoodleCollision,
  collectDoodle as collectDoodleObj,
  updateDoodles,
} from '../arcade/doodles';
import { checkSpringCollision, applySpringImpulse, updateSprings } from '../arcade/springs';
import { checkPortalEntry, applyPortalTeleport, updatePortal } from '../arcade/portal';
import { collectDoodle as collectDoodleState } from '../arcade/state';
import { updateHazards, checkHazardCollision } from '../arcade/hazards';
import { applyWindForces } from '../arcade/windZones';
import { applyGravityWellForces } from '../arcade/gravityWells';
import { updateWindZoneParticles } from '../arcade/windZonesRender';

// Collision Y offset: moves collision point from feet to sprite center
// This matches ZENO_Y_OFFSET in render, so collisions happen at visual center
const COLLISION_Y_OFFSET = -20;

// Audio interface for flight
export type FlightAudio = {
  airBrakeTap?: () => void;
  airBrakeHold?: () => void;
  actionDenied?: () => void;
  staminaLow?: () => void;
  ringCollect?: (ringIndex: number, ringX?: number) => void;
  impact: (intensity01: number) => void;
  stopFly?: () => void;
  slide?: () => void;
  tone: (freq: number, duration: number, type?: OscillatorType, volume?: number) => void;
};

export type FlightResult = {
  transitionedToSliding: boolean;
  precisionAppliedThisFrame: boolean;
};

/**
 * Process air controls during flight (tap for float, hold for brake)
 */
export function processAirControls(
  state: GameState,
  pressed: boolean,
  nowMs: number,
  audio: FlightAudio
): boolean {
  let precisionApplied = false;
  const deltaTime = 1 / 60;

  if (state.landed) return false;

  // TAP detection: triggers on PRESS (not release) for immediate response
  if (state.precisionInput.pressedThisFrame) {
    const staminaBefore = state.stamina;
    const result = registerFloatTap(state, nowMs);
    if (result.applied) {
      state.staminaUsedThisThrow += staminaBefore - state.stamina;
      precisionApplied = true;
      state.lastControlAction = 'float';
      state.controlActionTime = nowMs;
      audio.airBrakeTap?.();

      // Visual feedback: forward thrust particles
      if (state.particleSystem && !state.reduceFx) {
        state.particleSystem.emit('spark', {
          x: state.px - 10,
          y: state.py,
          count: 4,
          baseAngle: Math.PI, // Backward (thrust effect)
          spread: 0.5,
          speed: 2,
          life: 15,
          color: '#FFD700', // Gold
          gravity: 0.02,
        });
      }
    } else if (result.denied) {
      audio.actionDenied?.();
      state.staminaDeniedShake = 8;
    }
  }

  // HOLD detection: past threshold = PROGRESSIVE BRAKE
  if (pressed && state.precisionInput.holdDuration > BRAKE_ACTIVATION_FRAMES) {
    const holdFramesPastThreshold = state.precisionInput.holdDuration - BRAKE_ACTIVATION_FRAMES;
    const staminaBefore = state.stamina;
    const result = applyHardBrake(state, holdFramesPastThreshold, deltaTime);
    if (result.applied) {
      state.staminaUsedThisThrow += staminaBefore - state.stamina;
      precisionApplied = true;
      state.airControl.isHoldingBrake = true;
      state.airControl.brakeTaps++;

      // Track brake action periodically
      if (state.precisionInput.holdDuration % 8 === 0) {
        state.lastControlAction = 'brake';
        state.controlActionTime = nowMs;

        // Visual feedback: downward brake particles
        if (state.particleSystem && !state.reduceFx) {
          state.particleSystem.emit('spark', {
            x: state.px,
            y: state.py,
            count: 4,
            baseAngle: Math.PI / 2, // Downward
            spread: 0.4,
            speed: 2,
            life: 15,
            color: '#FF6B6B', // Red for brake
            gravity: 0.1,
          });
        }
      }

      // Audio feedback
      if (state.precisionInput.holdDuration % 6 === 0) {
        audio.airBrakeHold?.();
      }
    } else if (result.denied) {
      audio.actionDenied?.();
      state.staminaDeniedShake = 8;
    }
  } else {
    state.airControl.isHoldingBrake = false;
  }

  return precisionApplied;
}

/**
 * Process low stamina warning audio
 */
export function processStaminaWarning(
  state: GameState,
  nowMs: number,
  audio: FlightAudio
): void {
  if (state.stamina <= 25 && state.stamina > 0) {
    if (Math.floor(nowMs / 500) !== Math.floor((nowMs - 16) / 500)) {
      audio.staminaLow?.();
    }
  }
}

/**
 * Update flight physics (gravity, wind, position)
 */
export function updateFlightPhysics(
  state: GameState,
  pressed: boolean,
  nowMs: number,
  effectiveTimeScale: number
): void {
  state.launchFrame++; // Increment for launch burst effect

  // Calculate gravity based on tap frequency
  const gravityMult = state.airControl.isHoldingBrake
    ? 1.0 // Normal gravity during brake
    : calculateTapGravity(state, nowMs);

  // Apply gravity with calculated multiplier
  state.vy += BASE_GRAV * effectiveTimeScale * gravityMult;

  // BOMB JACK STYLE AIR FRICTION
  // When NOT floating (no recent taps), horizontal velocity slowly decays
  // When floating (rapid taps), you maintain momentum better
  const isFloating = gravityMult < 0.5; // Floating if gravity is significantly reduced
  const airFriction = isFloating ? 0.998 : 0.992; // Less drag when floating
  state.vx *= airFriction;

  // Wind effect with 50% resistance when air-braking
  const isAirBraking = pressed && state.precisionInput.holdDuration > BRAKE_ACTIVATION_FRAMES;
  const windResistance = isAirBraking ? 0.5 : 1.0;
  state.vx += state.wind * 0.3 * effectiveTimeScale * windResistance;

  // Arcade mode zone forces
  if (state.arcadeMode) {
    // Wind zones apply directional force
    if (state.arcadeWindZones?.length > 0) {
      const velocity = { vx: state.vx, vy: state.vy };
      applyWindForces(state.px, state.py, velocity, state.arcadeWindZones);
      state.vx = velocity.vx;
      state.vy = velocity.vy;
    }

    // Gravity wells attract or repel
    if (state.arcadeGravityWells?.length > 0) {
      const velocity = { x: state.vx, y: state.vy };
      applyGravityWellForces(state.px, state.py, velocity, state.arcadeGravityWells);
      state.vx = velocity.x;
      state.vy = velocity.y;
    }
  }

  state.px += state.vx * effectiveTimeScale;
  state.py += state.vy * effectiveTimeScale;

  // CEILING COLLISION - "sticky ceiling" mechanic
  // The harder you hit, the longer you stay stuck sliding along
  if (state.ceilingStuckFrames > 0) {
    // Currently stuck to ceiling
    state.py = CEILING_Y;
    state.vy = 0;
    state.ceilingStuckFrames--;
    // Horizontal velocity continues but slightly dampened
    state.vx *= 0.995;
  } else if (state.py < CEILING_Y) {
    // Just hit the ceiling
    const impactVelocity = Math.abs(state.vy); // How hard we hit (upward velocity)
    state.ceilingImpactVelocity = impactVelocity;

    // Calculate stuck frames: harder hit = longer stuck (up to ~1 second at max power)
    // At vy = -10 (max power, 85° angle), ~60 frames = 1 second
    // At vy = -3 (weak hit), ~18 frames = 0.3 seconds
    state.ceilingStuckFrames = Math.round(impactVelocity * 6);

    // Clamp to ceiling
    state.py = CEILING_Y;
    state.vy = 0; // Absorb vertical velocity
  }

  // Update trail
  const pastTarget = state.px >= state.zenoTarget;
  state.trail.push({ x: state.px, y: state.py, age: 0, pastTarget });

  // Record ghost frame for trail (every 50ms during flight)
  const lastGhostTimestamp = state.ghostTrail[state.ghostTrail.length - 1]?.timestamp ?? 0;
  if (nowMs - lastGhostTimestamp > 50) {
    state.ghostTrail.push({
      x: state.px,
      y: state.py,
      vx: state.vx,
      vy: state.vy,
      angle: Math.atan2(-state.vy, state.vx),
      timestamp: nowMs,
    });
    if (state.ghostTrail.length > 20) {
      state.ghostTrail.shift();
    }
  }

  if (state.runTrail.length === 0 || state.runTrail.length % 2 === 0) {
    state.runTrail.push({ x: state.px, y: state.py });
  }
}

/**
 * Process ring collisions during flight
 */
export function processRingCollisions(
  state: GameState,
  nowMs: number,
  audio: FlightAudio
): void {
  for (const ring of state.rings) {
    if (!ring.passed && checkRingCollision(state.px, state.py, ring)) {
      ring.passed = true;
      ring.passedAt = nowMs;
      state.ringsPassedThisThrow++;

      // Apply escalating multiplier
      state.ringMultiplier *= RING_MULTIPLIERS[ring.ringIndex];

      // Ring juice: popup
      state.ringJuicePopups.push(
        createRingPopup(ring.x, ring.y, state.ringsPassedThisThrow - 1, nowMs)
      );

      // Micro-freeze
      if (shouldMicroFreeze(state.slowMo)) {
        state.slowMo = Math.max(state.slowMo, 0.95);
        state.lastRingCollectTime = nowMs;
      }

      // Screen flash
      if (!state.reduceFx) {
        if (shouldScreenFlash(state.ringsPassedThisThrow)) {
          state.screenFlash = 0.5;
        } else {
          state.screenFlash = 0.3;
        }
      }

      // Edge glow
      state.edgeGlowIntensity = getEdgeGlowIntensity(state.ringsPassedThisThrow);

      // Spawn ring collection particles
      for (let i = 0; i < 10; i++) {
        const angle = (i / 10) * Math.PI * 2;
        state.particles.push({
          x: ring.x,
          y: ring.y,
          vx: Math.cos(angle) * 2,
          vy: Math.sin(angle) * 2,
          life: 1,
          maxLife: 20,
          color: ring.color,
        });
      }

      // Play collection sound
      audio.ringCollect?.(ring.ringIndex, ring.x);

      // Check route progress
      processRouteProgress(state, 'ring', ring.x, ring.y, nowMs, audio);
    }
  }
}

/**
 * Process bounce surface collision
 */
export function processBounceCollision(
  state: GameState,
  nowMs: number,
  audio: FlightAudio
): void {
  if (state.bounce && checkBounceCollision(state.px, state.py, state.bounce)) {
    const bounced = applyBounce(state, state.bounce);
    if (bounced) {
      // Track bounce direction for reversal mechanic
      // If moving right after bounce, player can tap to reverse direction
      state.airControl.postBounceMovingRight = state.vx > 0;
      state.airControl.postBounceTapCount = 0;

      // Visual feedback
      state.screenShake = state.reduceFx ? 0 : 3;
      if (state.particleSystem) {
        state.particleSystem.emit('spark', {
          x: state.bounce.x,
          y: state.bounce.y,
          count: 8,
          baseAngle: 0,
          spread: Math.PI * 2,
          speed: 2,
          life: 20,
          color: '#FFDD00',
          gravity: 0,
        });
      }
      audio.impact(0.5);

      // Check route progress for bounce
      processRouteProgress(state, 'bounce', state.bounce.x, state.bounce.y, nowMs, audio);
    }
  }
}

/**
 * Process arcade mode collisions (doodles, springs, portal)
 */
export function processArcadeCollisions(
  state: GameState,
  nowMs: number,
  audio: FlightAudio
): void {
  if (!state.arcadeMode) return;

  // Doodle collection (use sprite center for collision)
  const collisionY = state.py + COLLISION_Y_OFFSET;
  for (const doodle of state.arcadeDoodles) {
    if (checkDoodleCollision(state.px, collisionY, doodle)) {
      collectDoodleObj(doodle, nowMs);
      if (state.arcadeState) {
        collectDoodleState(state.arcadeState, doodle.sequence);
      }

      // Visual feedback: particles
      if (state.particleSystem && !state.reduceFx) {
        state.particleSystem.emit('spark', {
          x: doodle.x,
          y: doodle.y,
          count: 10,
          baseAngle: 0,
          spread: Math.PI * 2,
          speed: 3,
          life: 25,
          color: '#4ADE80', // Green for collection
          gravity: 0.05,
        });
      }

      // Audio: ascending tone based on sequence
      const freq = 440 + (doodle.sequence - 1) * 100;
      audio.tone(freq, 0.12, 'triangle', 0.08);
    }
  }

  // Spring collision (use sprite center)
  for (const spring of state.arcadeSprings) {
    if (checkSpringCollision(state.px, collisionY, spring)) {
      applySpringImpulse(spring, state);

      // Visual feedback
      state.screenShake = state.reduceFx ? 0 : 5;
      if (state.particleSystem) {
        state.particleSystem.emit('spark', {
          x: spring.x,
          y: spring.y,
          count: 12,
          baseAngle: -Math.PI / 2, // Upward burst
          spread: 0.8,
          speed: 4,
          life: 20,
          color: '#FF6B6B', // Red for spring
          gravity: 0.1,
        });
      }

      // Audio: spring boing
      audio.tone(330, 0.1, 'sine', 0.1);
      audio.tone(440, 0.08, 'sine', 0.08);
    }
  }

  // Portal collision (bidirectional - can enter from either side, use sprite center)
  const portalSide = state.arcadePortal ? checkPortalEntry(state.px, collisionY, state.arcadePortal) : null;
  if (portalSide) {
    // Store entry position before teleport
    const entryX = state.px;
    const entryY = state.py;

    applyPortalTeleport(state.arcadePortal!, portalSide, state, state);

    // Visual feedback: ENHANCED portal juice
    state.screenFlash = 0.7; // Stronger flash
    state.screenShake = 8; // Add screen shake
    if (!state.reduceFx) {
      // Post-warp punch: keep slow-mo and push zoom a bit more to highlight exit
      state.portalJuiceTimer = 24; // Shorter but more intense (~0.4s at 60fps)
      state.portalZoomTargetX = state.px;
      state.portalZoomTargetY = state.py;
    }

    if (state.particleSystem) {
      // Entry portal burst (where player entered)
      state.particleSystem.emit('spark', {
        x: entryX,
        y: entryY,
        count: 15,
        baseAngle: 0,
        spread: Math.PI * 2,
        speed: 6,
        life: 25,
        color: '#1e3a5f', // Blue for entry
        gravity: 0,
      });

      // Exit portal burst (where player appeared) - more dramatic
      state.particleSystem.emit('spark', {
        x: state.px,
        y: state.py,
        count: 25,
        baseAngle: 0,
        spread: Math.PI * 2,
        speed: 8,
        life: 35,
        color: '#d35400', // Orange for exit
        gravity: 0,
      });

      // Swirl particles at exit (slower, spiraling out)
      state.particleSystem.emit('swirl', {
        x: state.px,
        y: state.py,
        count: 12,
        baseAngle: 0,
        spread: Math.PI * 2,
        speed: 2,
        life: 45,
        color: '#f5f0e1', // Paper white
        gravity: 0,
      });
    }

    // Audio: enhanced portal whoosh (harmonic series)
    audio.tone(200, 0.12, 'sine', 0.12);
    audio.tone(300, 0.10, 'sine', 0.10);
    audio.tone(450, 0.08, 'sine', 0.08);
  }

  // Hazard collision - causes immediate failure (use sprite center)
  if (state.arcadeHazards?.length > 0) {
    const hitHazard = checkHazardCollision(state.px, collisionY, state.arcadeHazards);
    if (hitHazard) {
      // Trigger failure animation
      state.fellOff = true;
      state.failureAnimating = true;
      state.failureFrame = 0;
      state.failureType = 'tumble';

      // Visual feedback
      state.screenShake = state.reduceFx ? 0 : 12;
      state.screenFlash = 0.8;

      if (state.particleSystem) {
        state.particleSystem.emit('spark', {
          x: state.px,
          y: state.py,
          count: 20,
          baseAngle: 0,
          spread: Math.PI * 2,
          speed: 5,
          life: 30,
          color: '#FF4444', // Red for damage
          gravity: 0.1,
        });
      }

      // Audio: damage sound
      audio.tone(150, 0.15, 'sawtooth', 0.2);
      audio.tone(100, 0.2, 'sawtooth', 0.15);
    }
  }
}

/**
 * Helper: Process route node progress
 */
function processRouteProgress(
  state: GameState,
  nodeType: 'ring' | 'bounce',
  x: number,
  y: number,
  nowMs: number,
  audio: FlightAudio
): void {
  if (state.activeRoute && !state.activeRoute.failed) {
    const progress = checkRouteNodeProgress(
      state.activeRoute,
      state.activeRoute.currentIndex,
      nodeType,
      x,
      y
    );
    if (progress.advanced) {
      const completedNodeIndex = state.activeRoute.currentIndex;
      state.activeRoute.currentIndex = progress.newIndex;

      // Route juice: popup, particles, audio
      state.routeJuicePopups.push(
        createRoutePopup(x, y, completedNodeIndex, nowMs)
      );
      if (state.particleSystem) {
        state.particleSystem.emit('spark', {
          x,
          y,
          count: nodeType === 'bounce' ? 15 : 12,
          baseAngle: 0,
          spread: Math.PI * 2,
          speed: nodeType === 'bounce' ? 4 : 3,
          life: nodeType === 'bounce' ? 35 : 30,
          color: nodeType === 'bounce' ? '#3498DB' : '#9B59B6',
          gravity: 0.05,
        });
      }
      audio.tone(getRouteNodeFrequency(completedNodeIndex), 0.15, 'triangle', 0.1);
    }
  }
}

/**
 * Update ring/route juice popups
 */
export function updateJuicePopups(
  state: GameState,
  effectiveDeltaMs: number,
  nowMs: number
): void {
  state.ringJuicePopups = updateRingPopups(state.ringJuicePopups, effectiveDeltaMs, nowMs);
  state.routeJuicePopups = updateRoutePopups(state.routeJuicePopups, effectiveDeltaMs, nowMs);
}

/**
 * Check for landing transition (ground collision)
 */
export function checkLandingTransition(
  state: GameState,
  theme: Theme,
  audio: FlightAudio
): boolean {
  if (state.py >= H - 10) {
    state.flying = false;
    state.sliding = true;
    state.py = H - 10;  // Lowered 10px after Zeno size reduction (35x35)

    const impactVelocity = Math.abs(state.vy);
    state.screenShake = state.reduceFx ? 0 : Math.min(8, 2 + impactVelocity * 1.5);
    state.landingFrame = 8;

    const particleCount = Math.floor(4 + impactVelocity * 2);
    spawnParticles(state, state.px, state.py, particleCount, 1.5 + impactVelocity * 0.3, theme.accent4);

    // New particle system landing effects
    if (state.particleSystem) {
      state.particleSystem.emitLandingDust(state.px, state.py, theme.accent3);
      state.particleSystem.emitImpactDebris(state.px, state.py, theme.accent3);
      state.particleSystem.emitGroundCracks(state.px, state.py, theme.accent3);
    }

    state.vx *= 0.55;
    state.vy = 0;

    audio.impact(Math.min(1, impactVelocity / 4));
    audio.stopFly?.();
    audio.slide?.();

    return true;
  }

  return false;
}

/**
 * Track last valid position for precision bar
 */
export function trackLastValidPosition(state: GameState): void {
  if (state.px < CLIFF_EDGE) {
    state.lastValidPx = state.px;
  }
}

/**
 * Update arcade element positions (moving hazards, doodles, timed springs)
 */
export function updateArcadeElements(
  state: GameState,
  deltaMs: number,
  nowMs: number
): void {
  if (!state.arcadeMode) return;

  // Update moving doodles
  if (state.arcadeDoodles?.length > 0) {
    updateDoodles(state.arcadeDoodles, deltaMs);
  }

  // Update timed springs
  if (state.arcadeSprings?.length > 0) {
    updateSprings(state.arcadeSprings, nowMs);
  }

  // Update moving hazards
  if (state.arcadeHazards?.length > 0) {
    updateHazards(state.arcadeHazards, deltaMs);
  }

  // Update timed portal
  if (state.arcadePortal) {
    updatePortal(state.arcadePortal, nowMs);
  }

  // Update wind zone particles (visual only)
  if (state.arcadeWindZones?.length > 0) {
    updateWindZoneParticles(state.arcadeWindZones, deltaMs);
  }
}

// src/game/engine/arcade/generator/physics-simulator.ts
import { BASE_GRAV, CEILING_Y, CLIFF_EDGE, H, LAUNCH_PAD_X } from '@/game/constants';
import type { ArcadeLevel } from '../types';
import type { GhostInput, StrokePoint } from './types';
import { createSpringFromPlacement, checkSpringCollision, applySpringImpulse } from '../springs';
import { createPortalFromPair, checkPortalEntry, applyPortalTeleport } from '../portal';

export interface SimulationConfig {
  launchAngle: number; // degrees
  launchPower: number; // 3-10
  inputs: GhostInput[]; // brake/throttle events
}

export interface SimulationResult {
  success: boolean;
  trajectory: StrokePoint[];
  finalX: number;
  finalY: number;
  doodlesCollected: number[]; // sequence numbers
  doodlesInOrder: boolean;
  springsHit: number[];
  portalUsed: boolean;
  landedInZone: boolean;
  fellOff: boolean;
  maxAirTime: number;
}

const FRAME_MS = 1000 / 60; // 60fps
const MAX_FRAMES = 60 * 30; // 30 seconds max simulation
const DOODLE_RADIUS = 20;
const GROUND_Y = H - 20;

// Match actual game physics (from precision.ts)
const TAP_VELOCITY_BOOST = 0.8;       // Forward boost on tap
const FLOAT_MAX_VELOCITY = 4.5;       // Max velocity from tapping
const HEAVY_GRAVITY_MULT = 1.2;       // No input = heavier gravity
const FLOAT_GRAVITY_MULT = 0.15;      // Tapping = reduced gravity
const RAPID_FLAP_GRAVITY = 0.03;      // 7+ taps/sec = near-zero gravity
const TAP_WINDOW_MS = 250;            // Window for counting taps

export class PhysicsSimulator {
  /**
   * Run headless physics simulation for a level
   */
  simulate(level: ArcadeLevel, config: SimulationConfig): SimulationResult {
    // Initialize state
    let px = LAUNCH_PAD_X;
    let py = GROUND_Y;

    const angleRad = (config.launchAngle * Math.PI) / 180;
    let vx = Math.cos(angleRad) * config.launchPower;
    let vy = -Math.sin(angleRad) * config.launchPower;

    const trajectory: StrokePoint[] = [{ x: px, y: py }];
    const doodlesCollected: number[] = [];
    const springsHit: number[] = [];
    let portalUsed = false;
    let flying = true;
    let sliding = false;
    let fellOff = false;

    // Create runtime objects
    const springs = level.springs.map(createSpringFromPlacement);
    const portal = level.portal ? createPortalFromPair(level.portal) : null;
    const doodleStates = level.doodles.map(d => ({ ...d, collected: false }));

    // Input state - Bomb Jack style tracking
    let inputIndex = 0;
    let isPressed = false;
    let holdDuration = 0;
    const recentTapTimes: number[] = []; // Track tap timestamps for frequency

    // Simulation loop
    let frame = 0;
    let currentTimeMs = 0;

    while (frame < MAX_FRAMES) {
      currentTimeMs = frame * FRAME_MS;

      // Process inputs
      while (inputIndex < config.inputs.length &&
             config.inputs[inputIndex].timestamp <= currentTimeMs) {
        const input = config.inputs[inputIndex];
        const wasPressed = isPressed;
        isPressed = input.action === 'press';

        // Detect tap (press after release)
        if (isPressed && !wasPressed && flying) {
          // Register tap for frequency calculation
          recentTapTimes.push(currentTimeMs);

          // Apply velocity boost (Bomb Jack style)
          if (vx >= 0 && vx < FLOAT_MAX_VELOCITY) {
            vx = Math.min(vx + TAP_VELOCITY_BOOST, FLOAT_MAX_VELOCITY);
          } else if (vx < 0) {
            vx = Math.min(vx + TAP_VELOCITY_BOOST, FLOAT_MAX_VELOCITY);
          }
        }

        if (!isPressed) holdDuration = 0;
        inputIndex++;
      }

      if (isPressed) holdDuration++;

      // Clean old taps outside window
      while (recentTapTimes.length > 0 &&
             currentTimeMs - recentTapTimes[0] > TAP_WINDOW_MS * 4) {
        recentTapTimes.shift();
      }

      if (flying) {
        // Calculate gravity based on tap frequency (Bomb Jack style)
        let gravityMult = HEAVY_GRAVITY_MULT; // Default: heavy gravity

        // Count recent taps in window
        const tapsInWindow = recentTapTimes.filter(
          t => currentTimeMs - t < TAP_WINDOW_MS
        ).length;

        if (tapsInWindow >= 1) {
          // Calculate taps per second from history
          if (recentTapTimes.length >= 2) {
            const oldestTap = recentTapTimes[0];
            const newestTap = recentTapTimes[recentTapTimes.length - 1];
            const timeSpanSec = (newestTap - oldestTap) / 1000;

            if (timeSpanSec > 0.1) {
              const tapsPerSec = (recentTapTimes.length - 1) / timeSpanSec;

              // 7+ taps/sec = rapid flap (near-zero gravity)
              if (tapsPerSec >= 7) {
                gravityMult = RAPID_FLAP_GRAVITY;
              } else {
                // Normal float gravity
                gravityMult = FLOAT_GRAVITY_MULT;
              }
            } else {
              gravityMult = FLOAT_GRAVITY_MULT;
            }
          } else {
            gravityMult = FLOAT_GRAVITY_MULT;
          }
        }

        // Apply gravity with multiplier
        vy += BASE_GRAV * gravityMult;

        // Apply brake if holding (after 10 frames)
        if (isPressed && holdDuration > 10) {
          vx *= 0.97;
          vy *= 0.97;
        }

        // Update position
        px += vx;
        py += vy;

        // Check doodle collection
        for (const doodle of doodleStates) {
          if (!doodle.collected) {
            const dx = px - doodle.x;
            const dy = py - doodle.y;
            if (Math.sqrt(dx * dx + dy * dy) < DOODLE_RADIUS) {
              doodle.collected = true;
              doodlesCollected.push(doodle.sequence);
            }
          }
        }

        // Check spring collision
        for (let i = 0; i < springs.length; i++) {
          if (!springs[i].usedThisThrow && checkSpringCollision(px, py, springs[i])) {
            // Create velocity object for spring impulse
            const vel = { vx, vy };
            applySpringImpulse(springs[i], vel);
            vx = vel.vx;
            vy = vel.vy;
            springsHit.push(i);
          }
        }

        // Check portal
        if (portal && !portal.usedThisThrow) {
          const side = checkPortalEntry(px, py, portal);
          if (side) {
            const pos = { px, py };
            const vel = { vx, vy };
            applyPortalTeleport(portal, side, pos, vel);
            px = pos.px;
            py = pos.py;
            vx = vel.vx;
            vy = vel.vy;
            portalUsed = true;
          }
        }

        // Check ground collision
        if (py >= GROUND_Y) {
          py = GROUND_Y;
          flying = false;
          sliding = true;
          vx *= 0.55; // Landing friction
          vy = 0;
        }

        // Check ceiling collision - bounce/slide along ceiling
        if (py < CEILING_Y) {
          py = CEILING_Y;
          if (vy < 0) {
            // Absorb vertical velocity, keep horizontal
            vy = 0;
          }
        }
        // Check left wall
        if (px < 0) px = 0;

        trajectory.push({ x: Math.round(px), y: Math.round(py) });
      } else if (sliding) {
        // Slide physics
        const friction = isPressed && holdDuration > 5 ? 0.92 : 0.96;
        vx *= friction;
        px += vx;

        // Check if fell off
        if (px >= CLIFF_EDGE) {
          fellOff = true;
          break;
        }

        // Check if stopped
        if (Math.abs(vx) < 0.1) {
          break;
        }

        trajectory.push({ x: Math.round(px), y: Math.round(py) });
      }

      frame++;
    }

    // Calculate results
    const allCollected = doodlesCollected.length === level.doodles.length;
    const inOrder = this.checkSequenceOrder(doodlesCollected);
    const landedInZone = !fellOff && px >= level.landingTarget && px < CLIFF_EDGE;

    return {
      success: allCollected && landedInZone,
      trajectory,
      finalX: px,
      finalY: py,
      doodlesCollected,
      doodlesInOrder: inOrder,
      springsHit,
      portalUsed,
      landedInZone,
      fellOff,
      maxAirTime: frame * FRAME_MS / 1000,
    };
  }

  /**
   * Check if doodles were collected in sequence order
   */
  private checkSequenceOrder(collected: number[]): boolean {
    if (collected.length === 0) return true;

    for (let i = 1; i < collected.length; i++) {
      if (collected[i] !== collected[i - 1] + 1) {
        return false;
      }
    }
    return true;
  }

  /**
   * Generate initial rapid tap sequence (Bomb Jack style)
   */
  private generateInitialTaps(): GhostInput[] {
    const inputs: GhostInput[] = [];
    // Start with a burst of rapid taps to gain altitude and horizontal speed
    const numTaps = 8 + Math.floor(Math.random() * 6); // 8-13 taps
    const startTime = 200; // Start after launch

    for (let i = 0; i < numTaps; i++) {
      const pressTime = startTime + i * 120; // ~8 taps/sec
      const releaseTime = pressTime + 40;
      inputs.push({ timestamp: pressTime, action: 'press' });
      inputs.push({ timestamp: releaseTime, action: 'release' });
    }

    return inputs;
  }

  /**
   * Find optimal inputs to complete a level
   * Uses hill climbing optimization with Bomb Jack physics
   */
  findOptimalInputs(
    level: ArcadeLevel,
    _targetPath: StrokePoint[],
    maxAttempts: number = 150
  ): { config: SimulationConfig; result: SimulationResult } | null {
    // Start with rapid taps (needed for Bomb Jack style flight)
    let bestConfig: SimulationConfig = {
      launchAngle: 35 + Math.random() * 20, // 35-55° for good horizontal distance
      launchPower: 6 + Math.random() * 3,   // 6-9 power
      inputs: this.generateInitialTaps(),
    };
    let bestResult = this.simulate(level, bestConfig);
    let bestScore = this.scoreResult(bestResult, level);

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      // Mutate parameters
      const config: SimulationConfig = {
        launchAngle: bestConfig.launchAngle + (Math.random() - 0.5) * 10,
        launchPower: Math.max(3, Math.min(10, bestConfig.launchPower + (Math.random() - 0.5) * 2)),
        inputs: this.mutateInputs(bestConfig.inputs),
      };

      // Clamp angle (20° to 85° - almost vertical allowed)
      config.launchAngle = Math.max(20, Math.min(85, config.launchAngle));

      const result = this.simulate(level, config);
      const score = this.scoreResult(result, level);

      if (score > bestScore) {
        bestConfig = config;
        bestResult = result;
        bestScore = score;

        if (result.success) {
          return { config, result };
        }
      }
    }

    return bestResult.success ? { config: bestConfig, result: bestResult } : null;
  }

  private scoreResult(result: SimulationResult, level: ArcadeLevel): number {
    let score = 0;

    // Points for collecting doodles
    score += result.doodlesCollected.length * 10;

    // Bonus for sequence
    if (result.doodlesInOrder) score += 20;

    // Points for landing in zone
    if (result.landedInZone) score += 50;

    // Penalty for falling off
    if (result.fellOff) score -= 100;

    // Proximity bonus
    if (!result.fellOff) {
      const distanceToTarget = Math.abs(result.finalX - level.landingTarget);
      score += Math.max(0, 20 - distanceToTarget / 5);
    }

    return score;
  }

  private mutateInputs(inputs: GhostInput[]): GhostInput[] {
    const newInputs = [...inputs];

    // Randomly add, remove, or modify inputs
    const action = Math.random();

    if (action < 0.2 && newInputs.length > 0) {
      // Remove random input
      const idx = Math.floor(Math.random() * newInputs.length);
      newInputs.splice(idx, 1);
    } else if (action < 0.5) {
      // Add rapid tap burst (Bomb Jack style - 7+ taps/sec)
      const startTime = Math.random() * 3000;
      const numTaps = 3 + Math.floor(Math.random() * 8); // 3-10 rapid taps
      const tapInterval = 100 + Math.random() * 50; // ~7-10 taps/sec

      for (let i = 0; i < numTaps; i++) {
        const pressTime = startTime + i * tapInterval;
        const releaseTime = pressTime + 30 + Math.random() * 30; // Quick tap (30-60ms)
        newInputs.push({ timestamp: pressTime, action: 'press' });
        newInputs.push({ timestamp: releaseTime, action: 'release' });
      }
    } else if (action < 0.7) {
      // Add single tap
      const timestamp = Math.random() * 4000;
      newInputs.push({ timestamp, action: 'press' });
      newInputs.push({ timestamp: timestamp + 30 + Math.random() * 50, action: 'release' });
    } else if (action < 0.85) {
      // Add brake hold
      const timestamp = Math.random() * 3000;
      newInputs.push({ timestamp, action: 'press' });
      newInputs.push({ timestamp: timestamp + 300 + Math.random() * 500, action: 'release' });
    } else if (newInputs.length > 0) {
      // Modify existing
      const idx = Math.floor(Math.random() * newInputs.length);
      newInputs[idx] = {
        ...newInputs[idx],
        timestamp: Math.max(0, newInputs[idx].timestamp + (Math.random() - 0.5) * 200),
      };
    }

    // Sort by timestamp
    return newInputs.sort((a, b) => a.timestamp - b.timestamp);
  }
}

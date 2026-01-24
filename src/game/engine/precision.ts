import { CLIFF_EDGE } from '@/game/constants';
import type { GameState } from './types';

const PRECISION_ZONE_WIDTH = 70;
const PRECISION_ZONE_START = CLIFF_EDGE - PRECISION_ZONE_WIDTH;

// Air brake constants
const AIR_BRAKE_TAP_REDUCTION = 0.95;   // 5% velocity reduction
const AIR_BRAKE_TAP_BASE_COST = 5;      // Base cost, scaled by edge multiplier
const AIR_BRAKE_HOLD_REDUCTION = 0.97;  // 3% velocity reduction per frame
const AIR_BRAKE_HOLD_COST_PER_SEC = 15; // Base cost/sec, scaled by edge multiplier

// Air thrust constants (forward velocity boost on tap)
const AIR_THRUST_VX_BOOST = 1.0;       // 2x original (was 0.5)
const AIR_THRUST_BASE_COST = 6;        // Slight increase for balance (was 5)
const AIR_THRUST_MAX_VX_MULT = 1.6;    // Modest increase (was 1.5)

// Slide control constants
const SLIDE_EXTEND_VELOCITY = 0.15;
const SLIDE_EXTEND_BASE_COST = 8;
const SLIDE_BRAKE_FRICTION_MULT = 2.5;
const SLIDE_BRAKE_COST_PER_SEC = 10;

export type PrecisionResult = {
  applied: boolean;
  denied: boolean;
};

export type SlideControlResult = PrecisionResult & {
  frictionMultiplier?: number;
};

/**
 * Calculate stamina cost multiplier based on edge proximity.
 * Actions near the cliff edge cost more stamina.
 *
 * Formula: position <= PRECISION_ZONE_START ? 1.0 : 1 + ((position - PRECISION_ZONE_START) / PRECISION_ZONE_WIDTH)^2
 *
 * @param position - Current x position (0-CLIFF_EDGE)
 * @returns Multiplier from 1.0 (safe zone) to 2.0 (cliff edge)
 */
export function calculateEdgeMultiplier(position: number): number {
  if (position <= PRECISION_ZONE_START) {
    return 1.0;
  }
  const edgeDistance = (position - PRECISION_ZONE_START) / PRECISION_ZONE_WIDTH;
  return 1 + Math.pow(edgeDistance, 2);
}

/**
 * Apply air brake during flight phase.
 * Tap: 5% velocity reduction, costs 5 * edgeMultiplier stamina
 * Hold: 3% velocity reduction per frame, costs 15/sec * edgeMultiplier stamina
 *
 * FIX 6: Edge multiplier now applies to air brake for consistency
 */
export function applyAirBrake(
  state: GameState,
  inputType: 'tap' | 'hold',
  deltaTime: number = 1/60
): PrecisionResult {
  const edgeMultiplier = calculateEdgeMultiplier(state.px);

  if (inputType === 'tap') {
    const cost = Math.ceil(AIR_BRAKE_TAP_BASE_COST * edgeMultiplier);
    if (state.stamina < cost) {
      return { applied: false, denied: true };
    }
    state.vx *= AIR_BRAKE_TAP_REDUCTION;
    state.vy *= AIR_BRAKE_TAP_REDUCTION;
    state.stamina -= cost;
    return { applied: true, denied: false };
  }

  // Hold
  const frameCost = AIR_BRAKE_HOLD_COST_PER_SEC * edgeMultiplier * deltaTime;
  if (state.stamina < frameCost) {
    return { applied: false, denied: true };
  }
  state.vx *= AIR_BRAKE_HOLD_REDUCTION;
  state.vy *= AIR_BRAKE_HOLD_REDUCTION;
  state.stamina -= frameCost;
  return { applied: true, denied: false };
}

/**
 * Apply slide control during ground slide phase.
 * Tap: +0.15 velocity in travel direction (extend slide), costs 8 * edgeMultiplier stamina
 * Hold: 2.5x friction (brake), costs 10/sec * edgeMultiplier stamina
 *
 * FIX 5: Extends in current direction of travel, not always positive
 */
export function applySlideControl(
  state: GameState,
  inputType: 'tap' | 'hold',
  deltaTime: number = 1/60
): SlideControlResult {
  const edgeMultiplier = calculateEdgeMultiplier(state.px);

  if (inputType === 'tap') {
    const cost = Math.ceil(SLIDE_EXTEND_BASE_COST * edgeMultiplier);
    if (state.stamina < cost) {
      return { applied: false, denied: true };
    }
    // FIX 5: Extend in current direction of travel
    if (state.vx > 0) {
      state.vx += SLIDE_EXTEND_VELOCITY;
    } else if (state.vx < 0) {
      state.vx -= SLIDE_EXTEND_VELOCITY; // Extend in negative direction
    }
    // If vx === 0, do nothing (shouldn't happen during slide)
    state.stamina -= cost;
    return { applied: true, denied: false };
  }

  // Hold (brake)
  const frameCost = SLIDE_BRAKE_COST_PER_SEC * edgeMultiplier * deltaTime;
  if (state.stamina < frameCost) {
    return { applied: false, denied: true, frictionMultiplier: 1.0 };
  }
  state.stamina -= frameCost;
  return { applied: true, denied: false, frictionMultiplier: SLIDE_BRAKE_FRICTION_MULT };
}

/**
 * Apply air thrust during flight phase.
 * Gives instant forward velocity boost.
 * Costs 5 * edgeMultiplier stamina.
 * Velocity capped at 1.5 * initialSpeed to prevent abuse.
 */
// ============================================
// ZENO AIR CONTROL SYSTEM (Custom Bomb Jack-style)
// ============================================
// Three states:
// 1. RAPID TAPPING = Float/Glide (faster tap = less fall)
// 2. NO INPUT = Heavy gravity (falls faster, but not extreme)
// 3. HOLD (0.3sec+) = Progressive brake (ramps from gentle to strong)
// ============================================

// Gravity multipliers (softer than before)
const HEAVY_GRAVITY_MULT = 1.2;        // No input = 1.0x gravity (noticeable but not harsh)
const FLOAT_MIN_GRAVITY = 0.1;         // Best float (fast tapping) = 10% gravity
const FLOAT_MAX_GRAVITY = 0.3;         // Slow tapping = 30% gravity

// Tap detection
const TAP_WINDOW_MS = 400;             // Count taps in last 400ms
const MIN_TAPS_FOR_FLOAT = 1;          // 1+ tap in window starts float
const MAX_TAPS_FOR_BEST_FLOAT = 2;     // 2+ taps = best float

// Progressive brake (hold 0.3sec+)
// Brake strength ramps up over time for smooth deceleration
const BRAKE_ACTIVATION_FRAMES = 18;    // 0.3sec at 60fps before brake starts
const BRAKE_MIN_DECEL = 0.98;          // Start very gentle (2% reduction/frame)
const BRAKE_MAX_DECEL = 0.80;          // Max brake after full ramp (20% reduction/frame)
const BRAKE_RAMP_FRAMES = 60;          // 1 second to reach full brake strength
const HARD_BRAKE_COST_PER_SEC = 40;    // Stamina cost for brake (slightly lower)

// Tap cost and boost
const TAP_STAMINA_COST = 5;            // Small cost per tap
const TAP_VELOCITY_BOOST = 0.50;       // Forward velocity gain per tap (20% less than before)
const MAX_VELOCITY = 7.0;              // Maximum forward velocity (physics cap)

// Export for update.ts
export { BRAKE_ACTIVATION_FRAMES, TAP_VELOCITY_BOOST, MAX_VELOCITY };

export type FloatResult = PrecisionResult & {
  gravityMultiplier: number;
};

export type FloatTapResult = PrecisionResult & {
  velocityBoost: number;   // Forward velocity gain from tap (vx)
};

export type BrakeResult = PrecisionResult & {
  velocityMultiplier: number;
};

/**
 * Register a tap for the float system.
 * Each tap:
 * - Extends float time (via recentTapTimes → reduced gravity)
 * - If ASCENDING (vy < 0): NEUTRALIZES upward motion (vy = 0), NO velocity boost
 * - If DESCENDING (vy >= 0): Gives forward velocity boost (vx)
 * - Costs stamina
 */
export function registerFloatTap(
  state: GameState,
  nowMs: number
): FloatTapResult {
  const edgeMultiplier = calculateEdgeMultiplier(state.px);
  const cost = Math.ceil(TAP_STAMINA_COST * edgeMultiplier);

  if (state.stamina < cost) {
    return { applied: false, denied: true, velocityBoost: 0 };
  }

  state.stamina -= cost;

  // Add tap timestamp (for float gravity calculation)
  state.airControl.recentTapTimes.push(nowMs);

  // Clean old taps outside window
  state.airControl.recentTapTimes = state.airControl.recentTapTimes.filter(
    t => nowMs - t < TAP_WINDOW_MS
  );

  // Check if ascending (vy < 0 means moving upward)
  const isAscending = state.vy < 0;

  if (isAscending) {
    // NEUTRALIZE upward motion - tap cancels the rise
    state.vy = 0;
    // NO velocity boost during ascent - prevents launch tap abuse
    return {
      applied: true,
      denied: false,
      velocityBoost: 0
    };
  }

  // DESCENDING or LEVEL: Apply forward velocity boost
  // Capped at MAX_VELOCITY to prevent infinite acceleration
  const oldVx = state.vx;
  state.vx = Math.min(state.vx + TAP_VELOCITY_BOOST, MAX_VELOCITY);
  const actualBoost = state.vx - oldVx;

  return {
    applied: true,
    denied: false,
    velocityBoost: actualBoost
  };
}

/**
 * Calculate gravity multiplier based on recent tap frequency.
 * More taps = lower gravity (better float)
 * No taps = heavy gravity (falls fast)
 */
export function calculateTapGravity(
  state: GameState,
  nowMs: number
): number {
  // Clean old taps
  const recentTaps = state.airControl.recentTapTimes.filter(
    t => nowMs - t < TAP_WINDOW_MS
  );
  state.airControl.recentTapTimes = recentTaps;

  const tapCount = recentTaps.length;

  // No recent taps = heavy gravity
  if (tapCount < MIN_TAPS_FOR_FLOAT) {
    return HEAVY_GRAVITY_MULT;
  }

  // Interpolate between max and min gravity based on tap count
  // More taps = lower gravity
  const tapRatio = Math.min(1, (tapCount - MIN_TAPS_FOR_FLOAT) / (MAX_TAPS_FOR_BEST_FLOAT - MIN_TAPS_FOR_FLOAT));
  const gravity = FLOAT_MAX_GRAVITY - (tapRatio * (FLOAT_MAX_GRAVITY - FLOAT_MIN_GRAVITY));

  return gravity;
}

/**
 * Apply progressive brake during flight (HOLD 0.3sec+).
 * Brake strength ramps up over time for smooth deceleration.
 *
 * @param holdFramesPastThreshold - How many frames past the 0.3sec activation threshold
 */
export function applyHardBrake(
  state: GameState,
  holdFramesPastThreshold: number = 0,
  deltaTime: number = 1/60
): BrakeResult {
  const edgeMultiplier = calculateEdgeMultiplier(state.px);
  const frameCost = HARD_BRAKE_COST_PER_SEC * edgeMultiplier * deltaTime;

  if (state.stamina < frameCost) {
    return { applied: false, denied: true, velocityMultiplier: 1.0 };
  }

  state.stamina -= frameCost;

  // Calculate progressive deceleration based on how long past threshold
  // Starts gentle (0.98), ramps to strong (0.80) over 1 second
  const rampProgress = Math.min(1, holdFramesPastThreshold / BRAKE_RAMP_FRAMES);
  const decel = BRAKE_MIN_DECEL - (rampProgress * (BRAKE_MIN_DECEL - BRAKE_MAX_DECEL));

  // Apply progressive deceleration
  state.vx *= decel;
  state.vy *= decel;

  return { applied: true, denied: false, velocityMultiplier: decel };
}

// Legacy function - kept for compatibility but use new system
export function applyAirThrottle(
  _state: GameState,
  _deltaTime: number = 1/60
): FloatResult {
  // This is now handled by calculateTapGravity + registerFloatTap
  return { applied: false, denied: false, gravityMultiplier: 1.0 };
}

export function applyAirThrust(state: GameState): PrecisionResult {
  const edgeMultiplier = calculateEdgeMultiplier(state.px);
  const cost = Math.ceil(AIR_THRUST_BASE_COST * edgeMultiplier);

  if (state.stamina < cost) {
    return { applied: false, denied: true };
  }

  // Check velocity cap - can't boost beyond 1.5x initial speed
  const maxVx = state.initialSpeed * AIR_THRUST_MAX_VX_MULT;
  if (state.vx >= maxVx) {
    return { applied: false, denied: true };
  }

  // Apply forward boost (capped)
  state.vx = Math.min(state.vx + AIR_THRUST_VX_BOOST, maxVx);
  state.stamina -= cost;

  return { applied: true, denied: false };
}

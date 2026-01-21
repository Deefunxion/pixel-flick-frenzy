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
const AIR_THRUST_VX_BOOST = 0.5;
const AIR_THRUST_BASE_COST = 5;
const AIR_THRUST_MAX_VX_MULT = 1.5;

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

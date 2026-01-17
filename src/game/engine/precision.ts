import { CLIFF_EDGE } from '@/game/constants';
import type { GameState } from './types';

const PRECISION_ZONE_WIDTH = 70;
const PRECISION_ZONE_START = CLIFF_EDGE - PRECISION_ZONE_WIDTH;

// Air brake constants
const AIR_BRAKE_TAP_REDUCTION = 0.95;   // 5% velocity reduction
const AIR_BRAKE_TAP_BASE_COST = 5;      // Base cost, scaled by edge multiplier
const AIR_BRAKE_HOLD_REDUCTION = 0.97;  // 3% velocity reduction per frame
const AIR_BRAKE_HOLD_COST_PER_SEC = 15; // Base cost/sec, scaled by edge multiplier

export type PrecisionResult = {
  applied: boolean;
  denied: boolean;
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

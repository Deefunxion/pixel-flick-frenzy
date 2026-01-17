/**
 * Calculate stamina cost multiplier based on edge proximity.
 * Actions near the cliff edge (420) cost more stamina.
 *
 * Formula: position <= 350 ? 1.0 : 1 + ((position - 350) / 70)^2
 *
 * @param position - Current x position (0-420)
 * @returns Multiplier from 1.0 (safe zone) to 2.0 (cliff edge)
 */
export function calculateEdgeMultiplier(position: number): number {
  if (position <= 350) {
    return 1.0;
  }
  const edgeDistance = (position - 350) / 70;
  return 1 + Math.pow(edgeDistance, 2);
}

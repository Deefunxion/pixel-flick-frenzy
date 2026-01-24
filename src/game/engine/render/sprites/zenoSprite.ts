import type { GameState } from '../../types';

/**
 * Draw Zeno using sprite animation if available, otherwise fall back to procedural.
 * Returns true if sprite was drawn, false if fallback is needed.
 */
export function drawZenoSprite(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  x: number,
  y: number
): boolean {
  if (!state.zenoAnimator || !state.zenoAnimator.isReady()) {
    return false;
  }

  // Safety check for invalid positions (NaN, Infinity) - fallback to procedural
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    console.warn('[Render] Invalid sprite position:', x, y);
    return false;
  }

  // Determine if we need to flip based on velocity
  const flipH = state.vx < -0.5;

  state.zenoAnimator.draw(ctx, x, y, flipH);
  return true;
}

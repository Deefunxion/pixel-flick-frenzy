/**
 * Render ON FIRE mode visual effects
 * - Warm background tint
 * - Flame border effect at bottom of screen
 */
export function renderOnFireMode(
  ctx: CanvasRenderingContext2D,
  intensity: number,  // sessionHeat / 100
  width: number,
  height: number
): void {
  // Warm background tint
  ctx.fillStyle = `rgba(255, 100, 0, ${intensity * 0.1})`;
  ctx.fillRect(0, 0, width, height);

  // Flame border effect at bottom
  const gradient = ctx.createLinearGradient(0, height, 0, height - 40);
  gradient.addColorStop(0, `rgba(255, 100, 0, ${intensity * 0.3})`);
  gradient.addColorStop(1, 'rgba(255, 100, 0, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, height - 40, width, 40);
}

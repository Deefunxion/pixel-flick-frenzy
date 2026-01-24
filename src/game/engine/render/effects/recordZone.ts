/**
 * Render charge glow around Zeno during charge
 */
export function renderChargeGlow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  intensity: number  // 0-1
): void {
  if (intensity <= 0) return;

  const radius = 30 + intensity * 20;  // 30-50px
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);

  gradient.addColorStop(0, `rgba(255, 215, 0, ${intensity * 0.4})`);
  gradient.addColorStop(0.5, `rgba(255, 165, 0, ${intensity * 0.2})`);
  gradient.addColorStop(1, 'rgba(255, 165, 0, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}

/**
 * Render charge vignette (subtle edge darkening)
 */
export function renderChargeVignette(
  ctx: CanvasRenderingContext2D,
  intensity: number,
  width: number,
  height: number
): void {
  if (intensity <= 0) return;

  const gradient = ctx.createRadialGradient(
    width / 2, height / 2, height * 0.3,
    width / 2, height / 2, height * 0.8
  );

  gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
  gradient.addColorStop(1, `rgba(0, 0, 0, ${intensity * 0.3})`);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

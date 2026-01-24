/**
 * Render near-miss spotlight effect
 * Vignette that focuses on target zone
 */
export function renderNearMissSpotlight(
  ctx: CanvasRenderingContext2D,
  targetX: number,
  intensity: 'extreme' | 'close' | 'near',
  width: number,
  height: number
): void {
  // Dimming intensity based on near-miss level
  const dimAmount = intensity === 'extreme' ? 0.5
                  : intensity === 'close' ? 0.4
                  : 0.3;

  // Create radial gradient centered on target
  const gradient = ctx.createRadialGradient(
    targetX, height - 30,  // Target position
    30,  // Inner radius (bright)
    targetX, height - 30,
    150  // Outer radius (dim)
  );

  gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');  // Clear center
  gradient.addColorStop(0.5, `rgba(0, 0, 0, ${dimAmount * 0.5})`);
  gradient.addColorStop(1, `rgba(0, 0, 0, ${dimAmount})`);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Glow on target zone
  const glowGradient = ctx.createRadialGradient(
    targetX, height - 30, 0,
    targetX, height - 30, 40
  );
  glowGradient.addColorStop(0, 'rgba(255, 215, 0, 0.3)');
  glowGradient.addColorStop(1, 'rgba(255, 215, 0, 0)');

  ctx.fillStyle = glowGradient;
  ctx.fillRect(targetX - 50, height - 80, 100, 100);
}

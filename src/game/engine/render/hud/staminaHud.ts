import type { Theme } from '@/game/themes';

/**
 * Draw stamina bar above Zeno.
 * - Hidden when stamina = 100
 * - Green > 50, Yellow 25-50, Red < 25
 * - Flashes when < 25
 */
export function drawStaminaBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  stamina: number,
  nowMs: number,
  COLORS: Theme,
  shakeAmount: number = 0
) {
  // Hidden when full
  if (stamina >= 100) return;

  const barWidth = 40;
  const barHeight = 6;

  // Apply shake offset for denied action feedback
  const shakeX = shakeAmount > 0 ? (Math.random() - 0.5) * shakeAmount : 0;
  const shakeY = shakeAmount > 0 ? (Math.random() - 0.5) * shakeAmount : 0;

  const barX = x - barWidth / 2 + shakeX;
  const barY = y - 12 + shakeY;

  // Background
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(barX, barY, barWidth, barHeight);

  // Fill color based on stamina level
  let fillColor: string;
  if (stamina > 50) {
    fillColor = '#22c55e'; // Green
  } else if (stamina > 25) {
    fillColor = '#eab308'; // Yellow
  } else {
    fillColor = '#ef4444'; // Red
    // Pulsing glow effect when low (Task 8.2)
    const pulseAlpha = 0.3 + Math.sin(nowMs * 0.01) * 0.2;
    ctx.save();
    ctx.shadowColor = 'red';
    ctx.shadowBlur = 8;
    ctx.fillStyle = `rgba(239, 68, 68, ${pulseAlpha})`;
    ctx.fillRect(barX - 3, barY - 3, barWidth + 6, barHeight + 6);
    ctx.restore();
  }

  // Fill bar
  const fillWidth = (stamina / 100) * (barWidth - 2);
  ctx.fillStyle = fillColor;
  ctx.fillRect(barX + 1, barY + 1, fillWidth, barHeight - 2);

  // Border
  ctx.strokeStyle = COLORS.accent3;
  ctx.lineWidth = 1;
  ctx.strokeRect(barX, barY, barWidth, barHeight);

  // Stamina number (small)
  ctx.fillStyle = COLORS.uiText;
  ctx.font = '7px monospace';
  ctx.textAlign = 'right';
  ctx.fillText(Math.floor(stamina).toString(), barX + barWidth + 12, barY + 5);
}

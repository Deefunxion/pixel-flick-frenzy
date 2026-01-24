// src/game/engine/bounceRender.ts
/**
 * Bounce Surface Rendering
 */

import type { BounceSurface } from './bounce';

/**
 * Draw bounce surface with telegraph visual
 */
export function renderBounce(
  ctx: CanvasRenderingContext2D,
  bounce: BounceSurface | null,
  nowMs: number
): void {
  if (!bounce) return;

  const { x, y, radius, type, bouncedThisThrow } = bounce;

  ctx.save();

  // Pulse animation
  const pulse = 1 + Math.sin(nowMs * 0.003) * 0.1;
  const visualRadius = radius * pulse;

  // Opacity reduced after bounce
  ctx.globalAlpha = bouncedThisThrow ? 0.3 : 0.9;

  if (type === 'eraser') {
    // Pink eraser rectangle
    ctx.fillStyle = '#FFB6C1';
    ctx.strokeStyle = '#FF69B4';
    ctx.lineWidth = 2;

    const w = visualRadius * 1.8;
    const h = visualRadius * 0.9;
    ctx.fillRect(x - w/2, y - h/2, w, h);
    ctx.strokeRect(x - w/2, y - h/2, w, h);

    // Eraser texture lines
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath();
    ctx.moveTo(x - w/3, y - h/2);
    ctx.lineTo(x - w/3, y + h/2);
    ctx.moveTo(x + w/3, y - h/2);
    ctx.lineTo(x + w/3, y + h/2);
    ctx.stroke();
  } else {
    // Cloud puff
    ctx.fillStyle = 'rgba(255,255,255,0.8)';

    // Three overlapping circles
    ctx.beginPath();
    ctx.arc(x - visualRadius * 0.4, y, visualRadius * 0.6, 0, Math.PI * 2);
    ctx.arc(x + visualRadius * 0.4, y, visualRadius * 0.6, 0, Math.PI * 2);
    ctx.arc(x, y - visualRadius * 0.3, visualRadius * 0.7, 0, Math.PI * 2);
    ctx.fill();
  }

  // Hit zone indicator (debug mode)
  if (import.meta.env.DEV) {
    ctx.strokeStyle = 'rgba(255,0,0,0.3)';
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.restore();
}

/**
 * Ring Rendering System
 *
 * Visual representation of rings with:
 * - Outer glow
 * - Main ring stroke
 * - Inner highlight
 * - Pulse animation (when active)
 * - Fade-out on collection
 */

import type { Ring } from './rings';
import type { Theme } from '@/game/themes';

/**
 * Draw a single ring with all visual effects
 */
export function drawRing(
  ctx: CanvasRenderingContext2D,
  ring: Ring,
  theme: Theme,
  nowMs: number
): void {
  const { x, y, passed, passedAt, color } = ring;

  // Calculate alpha (fade out if passed)
  let alpha = 1;
  if (passed) {
    const elapsed = nowMs - passedAt;
    const fadeTime = 300; // 300ms fade
    alpha = Math.max(0, 1 - elapsed / fadeTime);
    if (alpha <= 0) return; // Skip drawing if fully faded
  }

  // Calculate scale (expand briefly on collection)
  let scale = 1;
  if (passed) {
    const elapsed = nowMs - passedAt;
    if (elapsed < 150) {
      // Expand to 1.3x over first 150ms
      scale = 1 + 0.3 * (elapsed / 150);
    } else {
      // Hold at 1.3x while fading
      scale = 1.3;
    }
  }

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // Outer glow (larger, semi-transparent)
  ctx.beginPath();
  ctx.arc(0, 0, 22, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(100, 200, 255, ${0.3 * alpha})`;
  ctx.lineWidth = 6;
  ctx.stroke();

  // Main ring
  ctx.beginPath();
  ctx.arc(0, 0, 18, 0, Math.PI * 2);
  if (passed) {
    // Green when passed
    ctx.strokeStyle = `rgba(100, 255, 100, ${alpha})`;
  } else {
    // Use ring's assigned color (gold variants)
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  ctx.lineWidth = 3;
  ctx.stroke();

  // Inner highlight (white, thinner)
  ctx.beginPath();
  ctx.arc(0, 0, 14, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(255, 255, 255, ${0.5 * alpha})`;
  ctx.lineWidth = 1;
  ctx.stroke();

  // Pulse effect when active (not passed)
  if (!passed) {
    const pulse = Math.sin(nowMs / 200) * 0.2 + 0.8;
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 * pulse * alpha})`;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Draw all rings
 */
export function drawRings(
  ctx: CanvasRenderingContext2D,
  rings: Ring[],
  theme: Theme,
  nowMs: number
): void {
  for (const ring of rings) {
    drawRing(ctx, ring, theme, nowMs);
  }
}

/**
 * Draw ring multiplier indicator (shows current ring bonus)
 * Positioned near the rings area
 */
export function drawRingMultiplierIndicator(
  ctx: CanvasRenderingContext2D,
  ringMultiplier: number,
  ringsPassedThisThrow: number,
  theme: Theme
): void {
  if (ringsPassedThisThrow === 0) return;

  const text = `${ringMultiplier.toFixed(2)}x`;

  ctx.save();
  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Position above the ring area
  const x = 270; // Center of ring zones
  const y = 30;

  // Background pill
  const metrics = ctx.measureText(text);
  const padding = 4;
  const width = metrics.width + padding * 2;
  const height = 16;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.beginPath();
  ctx.roundRect(x - width / 2, y - height / 2, width, height, 4);
  ctx.fill();

  // Text with gold color for multiplier
  ctx.fillStyle = '#FFD700';
  ctx.fillText(text, x, y);

  // Ring count indicator (dots)
  const dotY = y + 12;
  const dotSpacing = 8;
  const startX = x - dotSpacing;

  for (let i = 0; i < 3; i++) {
    const dotX = startX + i * dotSpacing;
    ctx.beginPath();
    ctx.arc(dotX, dotY, 3, 0, Math.PI * 2);

    if (i < ringsPassedThisThrow) {
      // Filled dot for collected
      ctx.fillStyle = '#7FD858';
      ctx.fill();
    } else {
      // Empty dot for uncollected
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  ctx.restore();
}

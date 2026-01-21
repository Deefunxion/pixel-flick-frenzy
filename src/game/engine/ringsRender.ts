/**
 * Ring Rendering System - Sprite-based
 *
 * Uses hand-drawn ring assets:
 * - Ring 1 (easy): 6.png - green glow
 * - Ring 2 (medium): 5.png - gold glow
 * - Ring 3 (hard): 4.png - orange
 */

import type { Ring } from './rings';
import { RING_SPRITES } from './rings';
import type { Theme } from '@/game/themes';

// Sprite cache
const spriteCache: Map<string, HTMLImageElement> = new Map();
let spritesLoaded = false;

// Sprite display size (scaled down from original, +15% for easier gameplay)
const RING_DISPLAY_SIZE = 58;

/**
 * Load all ring sprites (including upgraded variants)
 */
export function loadRingSprites(): Promise<void> {
  if (spritesLoaded) return Promise.resolve();

  const paths = [
    RING_SPRITES.easy,
    RING_SPRITES.medium,
    RING_SPRITES.hard,
    RING_SPRITES.mediumUpgraded,
    RING_SPRITES.hardUpgraded,
  ];

  const promises = paths.map(path => {
    return new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        spriteCache.set(path, img);
        resolve();
      };
      img.onerror = () => {
        console.warn(`Failed to load ring sprite: ${path}`);
        resolve(); // Don't reject, fall back to procedural
      };
      img.src = path;
    });
  });

  return Promise.all(promises).then(() => {
    spritesLoaded = true;
  });
}

/**
 * Get sprite for ring index, considering upgrade based on rings passed
 * - Ring 2 upgrades to 7.png when Ring 1 is passed
 * - Ring 3 upgrades to 8.png when Ring 2 is passed
 */
function getRingSprite(ringIndex: number, ringsPassedThisThrow: number): HTMLImageElement | null {
  let path: string;

  if (ringIndex === 1 && ringsPassedThisThrow >= 1) {
    // Ring 2 upgrades when Ring 1 is passed
    path = RING_SPRITES.mediumUpgraded;
  } else if (ringIndex === 2 && ringsPassedThisThrow >= 2) {
    // Ring 3 upgrades when Ring 2 is passed
    path = RING_SPRITES.hardUpgraded;
  } else {
    // Default sprites
    const paths = [RING_SPRITES.easy, RING_SPRITES.medium, RING_SPRITES.hard];
    path = paths[ringIndex];
  }

  return spriteCache.get(path) || null;
}

/**
 * Draw a single ring using sprite
 */
export function drawRing(
  ctx: CanvasRenderingContext2D,
  ring: Ring,
  theme: Theme,
  nowMs: number,
  ringsPassedThisThrow: number = 0
): void {
  const { x, y, passed, passedAt, ringIndex, color } = ring;

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
      // Expand to 1.4x over first 150ms
      scale = 1 + 0.4 * (elapsed / 150);
    } else {
      // Hold at 1.4x while fading
      scale = 1.4;
    }
  }

  const sprite = getRingSprite(ringIndex, ringsPassedThisThrow);

  if (sprite && sprite.complete) {
    // Draw sprite
    ctx.save();
    ctx.globalAlpha = alpha;

    const size = RING_DISPLAY_SIZE * scale;
    const drawX = x - size / 2;
    const drawY = y - size / 2;

    ctx.drawImage(sprite, drawX, drawY, size, size);

    // Add pulse glow effect when active (not passed)
    if (!passed) {
      const pulse = Math.sin(nowMs / 200) * 0.15 + 0.85;
      ctx.globalAlpha = alpha * (1 - pulse) * 0.5;
      const glowSize = size * (1 + (1 - pulse) * 0.2);
      const glowX = x - glowSize / 2;
      const glowY = y - glowSize / 2;
      ctx.drawImage(sprite, glowX, glowY, glowSize, glowSize);
    }

    ctx.restore();
  } else {
    // Fallback to procedural drawing if sprite not loaded
    drawRingProcedural(ctx, ring, theme, nowMs, alpha, scale);
  }
}

/**
 * Fallback procedural ring drawing
 */
function drawRingProcedural(
  ctx: CanvasRenderingContext2D,
  ring: Ring,
  theme: Theme,
  nowMs: number,
  alpha: number,
  scale: number
): void {
  const { x, y, passed, color } = ring;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // Outer glow
  ctx.beginPath();
  ctx.arc(0, 0, 22, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(100, 200, 255, ${0.3 * alpha})`;
  ctx.lineWidth = 6;
  ctx.stroke();

  // Main ring
  ctx.beginPath();
  ctx.arc(0, 0, 18, 0, Math.PI * 2);
  if (passed) {
    ctx.strokeStyle = `rgba(100, 255, 100, ${alpha})`;
  } else {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  ctx.lineWidth = 3;
  ctx.stroke();

  // Inner highlight
  ctx.beginPath();
  ctx.arc(0, 0, 14, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(255, 255, 255, ${0.5 * alpha})`;
  ctx.lineWidth = 1;
  ctx.stroke();

  // Pulse effect when active
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
  nowMs: number,
  ringsPassedThisThrow: number = 0
): void {
  for (const ring of rings) {
    drawRing(ctx, ring, theme, nowMs, ringsPassedThisThrow);
  }
}

/**
 * Draw ring multiplier indicator (shows current ring bonus)
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
  const x = 270;
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

  // Text with gold color
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
      ctx.fillStyle = '#7FD858';
      ctx.fill();
    } else {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  ctx.restore();
}
